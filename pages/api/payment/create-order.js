
import Razorpay from "razorpay";
import Stripe from "stripe";
import { getPlanById } from "../../../app/model/plan-db"; 
import { getUserSubscription, scheduleDowngrade } from "../../../app/model/subscription-db"; 
import { getCouponByCode } from "../../../app/model/coupon-db"; 
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { planId, currency = "INR", billingCycle = "monthly", couponCode } = req.body;

    // 1. Fetch the new plan
    const newPlan = await getPlanById(planId);
    if (!newPlan || newPlan.status !== 'active') return res.status(400).json({ error: "Invalid plan" });
    
    // ==========================================
    // ✅ VALIDATE COUPON & GATEWAY CONTEXT
    // ==========================================
    let dbCoupon = null;
    if (couponCode) {
      dbCoupon = await getCouponByCode(couponCode);
      
      if (!dbCoupon || dbCoupon.status !== 'active') {
        return res.status(400).json({ error: "Invalid or expired coupon" });
      }

      // Final Backend Security Check: Ensure Gateway matches Currency
      const targetGateway = currency === "USD" ? "stripe" : "razorpay";
      if (dbCoupon.gateway !== targetGateway) {
         return res.status(403).json({ error: "Coupon not valid for this currency/gateway" });
      }

      // Final Backend Security Check: Ensure Product Type matches
      if (dbCoupon.applicable_to === 'booster') {
         return res.status(403).json({ error: "This coupon is only for Token Boosters" });
      }
    }

    // ==========================================
    // UPGRADE VS DOWNGRADE LOGIC 
    // ==========================================
    const currentSub = await getUserSubscription(session.user.id);

    if (currentSub && currentSub.status === "Active") {
      const now = new Date();
      const startDate = new Date(currentSub.start_date);
      const expireDate = new Date(currentSub.expire_date);
      
      if (expireDate > now && startDate < expireDate) {
        let basePrice = Number(currency === "INR" ? newPlan.amount : newPlan.amount_usd);
        if (billingCycle === 'yearly' && newPlan.allowed_billing_cycles?.includes('yearly')) {
          const discountPercent = Number(newPlan.yearly_discount) || 20;
          basePrice = (basePrice * 12) * ((100 - discountPercent) / 100);
        }

        const newDurationDays = billingCycle === 'yearly' ? 2 : 1;
        const newDailyRate = basePrice / newDurationDays;
        
        const currentDurationDays = (expireDate - startDate) / (1000 * 60 * 60 * 24);
        const currentDailyRate = Number(currentSub.amount) / currentDurationDays;

        const isCurrentlyYearly = currentSub.billing_cycle === 'yearly';
        const isNewYearly = billingCycle === 'yearly';

        let isUpgrade = false;
        if (isCurrentlyYearly && !isNewYearly) isUpgrade = false;
        else if (!isCurrentlyYearly && isNewYearly) isUpgrade = true;
        else isUpgrade = newDailyRate > currentDailyRate;

        // HANDLE DOWNGRADE INTERCEPT
        if (!isUpgrade) {
          await scheduleDowngrade(currentSub.payment_id, newPlan.plan_id, billingCycle);
          const formattedDate = expireDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
          return res.status(200).json({ 
            gateway: "downgrade_scheduled",
            message: `Success! Your plan will automatically switch to ${newPlan.plan_name} (${billingCycle}) at the end of your current cycle on ${formattedDate}.`
          });
        }
      }
    }

    // ----------------------------
    // 🟠 RAZORPAY SUBSCRIPTION FLOW 
    // ----------------------------
    if (currency === "INR") {
      const gatewayPlanId = billingCycle === "yearly" ? newPlan.razorpay_yearly_id : newPlan.razorpay_monthly_id;
      if (!gatewayPlanId) return res.status(400).json({ error: "Razorpay Plan ID missing" });

      const razorpayOptions = {
        plan_id: gatewayPlanId,
        customer_notify: 1,
        total_count: 120, // 10 years
        // ✅ NEW: Securely attach metadata so verify.js can read it!
        notes: {
          userId: session.user.id,
          planId: newPlan.plan_id,
          billingCycle: billingCycle
        }
      };

      // ✅ ATTACH THE RAZORPAY OFFER
      // Only attach if it exists and isn't our fallback string for local math
      if (dbCoupon && dbCoupon.razorpay_offer_id && dbCoupon.razorpay_offer_id.startsWith("offer_")) {
        razorpayOptions.offer_id = dbCoupon.razorpay_offer_id;
      }

      const order = await razorpay.subscriptions.create(razorpayOptions);
      
      return res.status(200).json({ 
        gateway: "razorpay", 
        orderId: order.id, 
        amount: newPlan.amount, 
        currency: "INR" 
      });
    }

    // ----------------------------
    // 🔵 STRIPE SUBSCRIPTION FLOW 
    // ----------------------------
    if (currency === "USD") {
      const gatewayPriceId = billingCycle === "yearly" ? newPlan.stripe_yearly_id : newPlan.stripe_monthly_id;
      if (!gatewayPriceId) return res.status(400).json({ error: "Stripe Price ID missing." });

      const stripeOptions = {
        payment_method_types: ['card'],
        customer_email: session.user.email,
        line_items: [{
          price: gatewayPriceId,
          quantity: 1,
        }],
        mode: 'subscription', 
        metadata: { 
          userId: session.user.id, 
          planId: newPlan.plan_id, 
          billingCycle: billingCycle 
        },
        success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment/verify?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/pricing`,
      };

      // ✅ ATTACH THE STRIPE COUPON
      if (dbCoupon && dbCoupon.stripe_promo_id) {
        stripeOptions.discounts = [{
          //promotion_code: dbCoupon.stripe_promo_id
          coupon: dbCoupon.stripe_promo_id
        }];
      }

      const stripeSession = await stripe.checkout.sessions.create(stripeOptions);
      
      return res.status(200).json({ gateway: "stripe", url: stripeSession.url });
    }

  } catch (error) {
    console.error("Create Order Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}