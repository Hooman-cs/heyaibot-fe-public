// pages/api/payment/verify.js
import crypto from "crypto";
import Stripe from "stripe";
import Razorpay from "razorpay";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; 
import { getPlanById } from "../../../app/model/plan-db";
import { createSubscription, getSubscriptionByOrderId } from "../../../app/model/subscription-db";
import { updateUserPlan } from "../../../app/model/user-db"; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  // Allow GET for Stripe redirects, POST for Razorpay verifications
  if (req.method !== 'POST' && req.method !== 'GET') {
      return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    let gatewayUsed = null;
    let finalOrderId = null;
    let finalPaymentId = null;
    let actualPaidAmount = 0;
    
    // We will extract these securely from the Gateways, NOT from the user's request
    let planId = null;
    let billingCycle = "monthly";
    let isTrial = false;

    // ==========================================
    // 1. STRIPE VERIFICATION (Handles GET Redirect)
    // ==========================================
    if (req.body?.stripe_session_id || req.query?.session_id) {
      const sessionId = req.body?.stripe_session_id || req.query?.session_id;
      const stripeSession = await stripe.checkout.sessions.retrieve(sessionId);

      if (stripeSession.status !== 'complete') {
        return res.redirect('/dashboard?payment_success=false&error=payment_incomplete');
      }

      // FIX #01 & #02: Extract plan data securely from Stripe metadata
      planId = stripeSession.metadata?.planId;
      billingCycle = stripeSession.metadata?.billingCycle || "monthly";
      gatewayUsed = "Stripe";
      finalOrderId = stripeSession.subscription; 
      finalPaymentId = stripeSession.payment_intent || stripeSession.subscription;
      
      // Amount total is securely provided by Stripe (in cents)
      actualPaidAmount = stripeSession.amount_total ? (stripeSession.amount_total / 100) : 0; 
      
      // If Stripe charged $0 and it's active, it's a 14-day trial checkout
      if (actualPaidAmount === 0 && stripeSession.status === 'complete') {
         isTrial = true;
      }
    } 
    // ==========================================
    // 2. RAZORPAY VERIFICATION (Handles POST)
    // ==========================================
    else if (req.body?.razorpay_subscription_id) {
      const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature } = req.body;
      
      const body = razorpay_payment_id + "|" + razorpay_subscription_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Razorpay Invalid Signature" });
      }

      // FIX #02: Fetch subscription directly from Razorpay to prevent payload spoofing
      const rzpSub = await razorpay.subscriptions.fetch(razorpay_subscription_id);
      
      planId = rzpSub.notes?.planId;
      billingCycle = rzpSub.notes?.billingCycle || "monthly";
      
      // If Razorpay's billing start date is in the future, it's a trial
      const nowSeconds = Math.floor(Date.now() / 1000);
      if (rzpSub.start_at && rzpSub.start_at > nowSeconds + 86400) { 
         isTrial = true;
      }

      gatewayUsed = "Razorpay";
      finalOrderId = razorpay_subscription_id;
      finalPaymentId = razorpay_payment_id;
    } 
    else {
      return res.status(400).json({ error: "Invalid payment payload" });
    }

    // ==========================================
    // 3. SECURE PLAN FETCHING & MATH
    // ==========================================
    if (!planId) throw new Error("Plan ID missing from gateway metadata");
    
    const planData = await getPlanById(planId);
    if (!planData) throw new Error("Plan not found in database");

    // FIX #05: Calculate Razorpay amount dynamically if yearly
    if (gatewayUsed === "Razorpay") {
        if (billingCycle === 'yearly') {
            const discount = planData.yearly_discount || 0;
            actualPaidAmount = (planData.amount * 12) * ((100 - discount) / 100);
        } else {
            actualPaidAmount = planData.amount;
        }
    }

    // ==========================================
    // 4. IDEMPOTENCY CHECK (Prevents Refresh Bug)
    // ==========================================
    if (!finalOrderId) throw new Error("Missing Order ID");
    const existingSub = await getSubscriptionByOrderId(finalOrderId);
    
    if (existingSub) {
      if (req.method === 'GET') return res.redirect('/dashboard?payment_success=true&note=already_verified');
      return res.status(200).json({ success: true, note: "Already verified" });
    }

    // ==========================================
    // 5. CALCULATE DATES & SAVE
    // ==========================================
    let expireDate = new Date();
    
    if (isTrial) {
       expireDate.setDate(expireDate.getDate() + 14); 
    } else {
       if (billingCycle === 'yearly') {
          expireDate.setFullYear(expireDate.getFullYear() + 1);
       } else {
          expireDate.setMonth(expireDate.getMonth() + 1);
       }
    }

    // FIX #04: Grace period reads from plan config safely
    let graceExpireDate = new Date(expireDate);
    const graceDays = planData.grace_period !== undefined ? Number(planData.grace_period) : 3;
    graceExpireDate.setDate(graceExpireDate.getDate() + graceDays);

    const subResult = await createSubscription({
        paymentId: finalPaymentId,
        orderId: finalOrderId,
        userId: session.user.id || session.user.email,
        planId: planData.plan_id,
        amount: actualPaidAmount, 
        currency: gatewayUsed === "Stripe" ? "USD" : "INR",       
        gateway: gatewayUsed, 
        billing_cycle: billingCycle,    
        expireDate: expireDate.toISOString(),
        graceExpireDate: graceExpireDate.toISOString(),
        system_features: planData.system_features || planData.features || {}, 
        display_features: planData.display_features || [] 
    });

    if (!subResult.success) throw new Error(subResult.error);

    await updateUserPlan(session.user.id || session.user.email, planData.plan_id);

    // Return safely based on request type
    if (req.method === 'GET') return res.redirect('/dashboard?payment_success=true');
    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Verification Error:", error);
    if (req.method === 'GET') {
        return res.redirect('/dashboard?payment_success=false&error=' + encodeURIComponent(error.message));
    }
    return res.status(500).json({ error: error.message });
  }
}