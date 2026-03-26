import crypto from "crypto";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; 
import { getPlanById } from "../../../app/model/plan-db";
import { createSubscription } from "../../../app/model/subscription-db";
import { updateUserPlan } from "../../../app/model/user-db"; 

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // =================================================================
  // 1. RAZORPAY SUBSCRIPTION VERIFICATION
  // =================================================================
  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      // Notice we are grabbing razorpay_subscription_id now!
      const { razorpay_subscription_id, razorpay_payment_id, razorpay_signature, planId, billingCycle = "monthly" } = req.body;

      // Verify Razorpay Subscription Signature
      // The formula for subscriptions is: payment_id + "|" + subscription_id
      const body = razorpay_payment_id + "|" + razorpay_subscription_id;
      const expectedSignature = crypto
        .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest("hex");

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: "Invalid signature" });
      }

      const plan = await getPlanById(planId);
      if (!plan) return res.status(400).json({ error: "Plan not found" });

      const durationDays = billingCycle === 'yearly' ? 365 : (plan.duration || 30);
      const graceDays = plan.grace_period || 7;
      
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + durationDays);
      
      const graceExpireDate = new Date(expireDate);
      graceExpireDate.setDate(graceExpireDate.getDate() + graceDays);

      let finalPriceInr = Number(plan.amount);
      if (billingCycle === 'yearly' && plan.allowed_billing_cycles?.includes('yearly')) {
        const discountPercent = Number(plan.yearly_discount) || 20;
        finalPriceInr = (finalPriceInr * 12) * ((100 - discountPercent) / 100);
      }
      finalPriceInr = Math.round(finalPriceInr);

      // Save the initial subscription to our DB
      const subResult = await createSubscription({
        paymentId: razorpay_payment_id,
        orderId: razorpay_subscription_id, // Save the recurring sub ID here!
        userId: session.user.id,
        planId: plan.plan_id,
        amount: finalPriceInr, 
        currency: "INR",
        gateway: "Razorpay",
        billing_cycle: billingCycle, 
        expireDate: expireDate.toISOString(),
        graceExpireDate: graceExpireDate.toISOString(),
        system_features: plan.system_features || plan.features || {}, 
        display_features: plan.display_features || [] 
      });

      if (!subResult.success) throw new Error(subResult.error);
      await updateUserPlan(session.user.id, plan.plan_id);

      return res.status(200).json({ success: true });

    } catch (error) {
      console.error("Razorpay Verify Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // =================================================================
  // 2. STRIPE SUBSCRIPTION VERIFICATION 
  // =================================================================
  else if (req.method === 'GET') {
    try {
      const { session_id } = req.query;
      if (!session_id) return res.redirect('/pricing?error=NoSession');

      const stripeSession = await stripe.checkout.sessions.retrieve(session_id);
      if (stripeSession.payment_status !== 'paid') {
        return res.redirect('/pricing?error=PaymentNotCompleted');
      }

      const userId = stripeSession.metadata.userId;
      const planId = stripeSession.metadata.planId;
      const billingCycle = stripeSession.metadata.billingCycle || "monthly";

      const plan = await getPlanById(planId);
      if (!plan) return res.redirect('/pricing?error=PlanNotFound');

      const durationDays = billingCycle === 'yearly' ? 365 : (plan.duration || 30);
      const graceDays = plan.grace_period || 7;
      
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + durationDays);
      
      const graceExpireDate = new Date(expireDate);
      graceExpireDate.setDate(graceExpireDate.getDate() + graceDays);

      let finalPriceUsd = Number(plan.amount_usd);
      if (billingCycle === 'yearly' && plan.allowed_billing_cycles?.includes('yearly')) {
        const discountPercent = Number(plan.yearly_discount) || 20;
        finalPriceUsd = (finalPriceUsd * 12) * ((100 - discountPercent) / 100);
      }
      finalPriceUsd = parseFloat(finalPriceUsd.toFixed(2));
      const actualPaidUsd = stripeSession.amount_total ? (stripeSession.amount_total / 100) : finalPriceUsd;

      const subResult = await createSubscription({
        // Save the actual Stripe Subscription ID so the webhook can find it later!
        paymentId: stripeSession.subscription || stripeSession.payment_intent,
        orderId: stripeSession.id,
        userId: userId,
        planId: plan.plan_id,
        amount: actualPaidUsd, 
        currency: "USD",       
        gateway: "Stripe", 
        billing_cycle: billingCycle,    
        expireDate: expireDate.toISOString(),
        graceExpireDate: graceExpireDate.toISOString(),
        system_features: plan.system_features || plan.features || {}, 
        display_features: plan.display_features || [] 
      });

      if (!subResult.success) throw new Error(subResult.error);
      await updateUserPlan(userId, plan.plan_id);

      return res.redirect('/dashboard?payment_success=true');

    } catch (error) {
      console.error("Stripe Verify Error:", error);
      return res.redirect('/pricing?error=VerificationFailed');
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
// import crypto from "crypto";
// import Stripe from "stripe";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]"; 
// import { getPlanById } from "../../../app/model/plan-db";
// import { createSubscription } from "../../../app/model/subscription-db";
// import { updateUserPlan } from "../../../app/model/user-db"; 

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export default async function handler(req, res) {
//   // =================================================================
//   // 1. RAZORPAY VERIFICATION
//   // =================================================================
//   if (req.method === 'POST') {
//     try {
//       const session = await getServerSession(req, res, authOptions);
//       if (!session) return res.status(401).json({ error: "Unauthorized" });

//       const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId, billingCycle = "monthly" } = req.body;

//       // Verify Razorpay Signature
//       const body = razorpay_order_id + "|" + razorpay_payment_id;
//       const expectedSignature = crypto
//         .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//         .update(body.toString())
//         .digest("hex");

//       if (expectedSignature !== razorpay_signature) {
//         return res.status(400).json({ error: "Invalid signature" });
//       }

//       // Fetch Plan & Calculate Dates
//       const plan = await getPlanById(planId);
//       if (!plan) return res.status(400).json({ error: "Plan not found" });

//       const durationDays = billingCycle === 'yearly' ? 365 : (plan.duration || 30);
//       const graceDays = plan.grace_period || 7;
      
//       const expireDate = new Date();
//       expireDate.setDate(expireDate.getDate() + durationDays);
      
//       const graceExpireDate = new Date(expireDate);
//       graceExpireDate.setDate(graceExpireDate.getDate() + graceDays);

//       // ==========================================
//       // FIX: RECALCULATE EXACT INR AMOUNT PAID 
//       // ==========================================
//       let finalPriceInr = Number(plan.amount);
//       if (billingCycle === 'yearly' && plan.allowed_billing_cycles?.includes('yearly')) {
//         const discountPercent = Number(plan.yearly_discount) || 20;
//         finalPriceInr = (finalPriceInr * 12) * ((100 - discountPercent) / 100);
//       }
//       finalPriceInr = Math.round(finalPriceInr); // Ensure it's a clean integer

//       // Save to Database
//       const subResult = await createSubscription({
//         paymentId: razorpay_payment_id,
//         orderId: razorpay_order_id,
//         userId: session.user.id,
//         planId: plan.plan_id,
//         amount: finalPriceInr, // FIXED: Now saves the actual discounted amount
//         currency: "INR",
//         gateway: "Razorpay",
//         billing_cycle: billingCycle, 
//         expireDate: expireDate.toISOString(),
//         graceExpireDate: graceExpireDate.toISOString(),
//         system_features: plan.system_features || plan.features || {}, 
//         display_features: plan.display_features || [] 
//       });

//       if (!subResult.success) throw new Error(subResult.error);

//       // Update User Profile
//       await updateUserPlan(session.user.id, plan.plan_id);

//       return res.status(200).json({ success: true });

//     } catch (error) {
//       console.error("Razorpay Verify Error:", error);
//       return res.status(500).json({ error: error.message });
//     }
//   }

//   // =================================================================
//   // 2. STRIPE VERIFICATION (Webhook Redirect)
//   // =================================================================
//   else if (req.method === 'GET') {
//     try {
//       const { session_id } = req.query;
//       if (!session_id) return res.redirect('/pricing?error=NoSession');

//       const stripeSession = await stripe.checkout.sessions.retrieve(session_id);
//       if (stripeSession.payment_status !== 'paid') {
//         return res.redirect('/pricing?error=PaymentNotCompleted');
//       }

//       const userId = stripeSession.metadata.userId;
//       const planId = stripeSession.metadata.planId;
//       const billingCycle = stripeSession.metadata.billingCycle || "monthly";

//       const plan = await getPlanById(planId);
//       if (!plan) return res.redirect('/pricing?error=PlanNotFound');

//       const durationDays = billingCycle === 'yearly' ? 365 : (plan.duration || 30);
//       const graceDays = plan.grace_period || 7;
      
//       const expireDate = new Date();
//       expireDate.setDate(expireDate.getDate() + durationDays);
      
//       const graceExpireDate = new Date(expireDate);
//       graceExpireDate.setDate(graceExpireDate.getDate() + graceDays);

//       // ==========================================
//       // FIX: GRAB EXACT USD AMOUNT PAID FROM STRIPE
//       // ==========================================
//       // Fallback calculation just in case
//       let finalPriceUsd = Number(plan.amount_usd);
//       if (billingCycle === 'yearly' && plan.allowed_billing_cycles?.includes('yearly')) {
//         const discountPercent = Number(plan.yearly_discount) || 20;
//         finalPriceUsd = (finalPriceUsd * 12) * ((100 - discountPercent) / 100);
//       }
//       finalPriceUsd = parseFloat(finalPriceUsd.toFixed(2));

//       // The safest way: Stripe's session object gives us the exact total charged in Cents
//       const actualPaidUsd = stripeSession.amount_total ? (stripeSession.amount_total / 100) : finalPriceUsd;

//       // Save to Database
//       const subResult = await createSubscription({
//         paymentId: stripeSession.payment_intent,
//         orderId: stripeSession.id,
//         userId: userId,
//         planId: plan.plan_id,
//         amount: actualPaidUsd, // FIXED: Saves exactly what Stripe charged
//         currency: "USD",       
//         gateway: "Stripe", 
//         billing_cycle: billingCycle,    
//         expireDate: expireDate.toISOString(),
//         graceExpireDate: graceExpireDate.toISOString(),
//         system_features: plan.system_features || plan.features || {}, 
//         display_features: plan.display_features || [] 
//       });

//       if (!subResult.success) throw new Error(subResult.error);

//       await updateUserPlan(userId, plan.plan_id);
//       return res.redirect('/dashboard?payment_success=true');

//     } catch (error) {
//       console.error("Stripe Verify Error:", error);
//       return res.redirect('/pricing?error=VerificationFailed');
//     }
//   }

//   return res.status(405).json({ error: "Method not allowed" });
// }