import Razorpay from "razorpay";
import Stripe from "stripe";
import { getPlanById } from "../../../app/model/plan-db"; 
import { getUserSubscription, scheduleDowngrade } from "../../../app/model/subscription-db"; 
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

    const { planId, currency = "INR", billingCycle = "monthly" } = req.body;

    // 1. Fetch the new plan
    const newPlan = await getPlanById(planId);
    if (!newPlan || newPlan.status !== 'active') return res.status(400).json({ error: "Invalid plan" });
    
    // ==========================================
    // UPGRADE VS DOWNGRADE LOGIC (Kept exactly as you designed it!)
    // ==========================================
    const currentSub = await getUserSubscription(session.user.id);

    if (currentSub && currentSub.status === "Active") {
      const now = new Date();
      const startDate = new Date(currentSub.start_date);
      const expireDate = new Date(currentSub.expire_date);
      
      if (expireDate > now && startDate < expireDate) {
        // Calculate Daily Rates to determine value
        let basePrice = Number(currency === "INR" ? newPlan.amount : newPlan.amount_usd);
        if (billingCycle === 'yearly' && newPlan.allowed_billing_cycles?.includes('yearly')) {
          const discountPercent = Number(newPlan.yearly_discount) || 20;
          basePrice = (basePrice * 12) * ((100 - discountPercent) / 100);
        }

        const newDurationDays = billingCycle === 'yearly' ? 365 : (newPlan.duration || 30);
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
        // Note: For Stripe/Razorpay Subscriptions, exact dollar proration requires dynamic coupons.
        // Since we are moving to automated billing, upgrades will start a fresh subscription immediately.
      }
    }

    // ----------------------------
    // RAZORPAY SUBSCRIPTION FLOW
    // ----------------------------
    if (currency === "INR") {
      const gatewayPlanId = billingCycle === "yearly" ? newPlan.razorpay_yearly_id : newPlan.razorpay_monthly_id;
      
      if (!gatewayPlanId) return res.status(400).json({ error: "Razorpay Plan ID missing in Admin Dashboard." });

      const subscription = await razorpay.subscriptions.create({
        plan_id: gatewayPlanId,
        customer_notify: 1, // Let Razorpay email them the invoice
        total_count: 120,   // Standard continuous billing 
      });

      return res.status(200).json({ 
        gateway: "razorpay_subscription", 
        subscriptionId: subscription.id, 
        amount: newPlan.amount, 
        currency: "INR" 
      });
    }

    // ----------------------------
    // STRIPE SUBSCRIPTION FLOW 
    // ----------------------------
    if (currency === "USD") {
      const gatewayPriceId = billingCycle === "yearly" ? newPlan.stripe_yearly_id : newPlan.stripe_monthly_id;

      if (!gatewayPriceId) return res.status(400).json({ error: "Stripe Price ID missing in Admin Dashboard." });

      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          // Notice we don't use price_data anymore. We just pass the ID!
          price: gatewayPriceId,
          quantity: 1,
        }],
        mode: 'subscription', // CHANGED from 'payment'
        metadata: { 
          userId: session.user.id, 
          planId: newPlan.plan_id, 
          billingCycle: billingCycle 
        },
        success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment/verify?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/pricing`,
      });
      
      return res.status(200).json({ gateway: "stripe", url: stripeSession.url });
    }

    return res.status(400).json({ error: "Invalid currency" });

  } catch (error) {
    console.error("Order Creation Error:", error);
    return res.status(500).json({ error: "Failed to create subscription order" });
  }
}
// import Razorpay from "razorpay";
// import Stripe from "stripe";
// import { getPlanById } from "../../../app/model/plan-db"; 
// import { getUserSubscription, scheduleDowngrade } from "../../../app/model/subscription-db"; 
// import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]";

// const razorpay = new Razorpay({
//   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// export default async function handler(req, res) {
//   if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

//   try {
//     const session = await getServerSession(req, res, authOptions);
//     if (!session) return res.status(401).json({ error: "Unauthorized" });

//     const { planId, currency = "INR", billingCycle = "monthly" } = req.body;

//     // 1. Fetch the new plan
//     const newPlan = await getPlanById(planId);
//     if (!newPlan || newPlan.status !== 'active') return res.status(400).json({ error: "Invalid plan" });

//     // 2. Calculate initial price (Applying Yearly Discount if applicable)
//     let finalPrice = Number(currency === "INR" ? newPlan.amount : newPlan.amount_usd);
//     if (billingCycle === 'yearly' && newPlan.allowed_billing_cycles?.includes('yearly')) {
//       const discountPercent = Number(newPlan.yearly_discount) || 20;
//       finalPrice = (finalPrice * 12) * ((100 - discountPercent) / 100);
//     }
    
//     // ==========================================
//     // UPGRADE VS DOWNGRADE LOGIC
//     // ==========================================
//     const currentSub = await getUserSubscription(session.user.id);
//     let proratedDiscount = 0; // Initialize here so Stripe can use it later

//     if (currentSub && currentSub.status === "Active") {
//       const now = new Date();
//       const startDate = new Date(currentSub.start_date);
//       const expireDate = new Date(currentSub.expire_date);
      
//       if (expireDate > now && startDate < expireDate) {
        
//         // A. Calculate Daily Rates to determine value
//         const newDurationDays = billingCycle === 'yearly' ? 365 : (newPlan.duration || 30);
//         const newDailyRate = finalPrice / newDurationDays;
        
//         const currentDurationDays = (expireDate - startDate) / (1000 * 60 * 60 * 24);
//         const currentDailyRate = Number(currentSub.amount) / currentDurationDays;

//         // ==========================================
//         // B. Determine if this is an Upgrade (UPDATED)
//         // ==========================================
//         const isCurrentlyYearly = currentSub.billing_cycle === 'yearly';
//         const isNewYearly = billingCycle === 'yearly';

//         let isUpgrade = false;

//         if (isCurrentlyYearly && !isNewYearly) {
//           // Rule 1: Yearly -> Monthly is ALWAYS a downgrade. 
//           // (Protects them from losing their remaining months!)
//           isUpgrade = false;
//         } else if (!isCurrentlyYearly && isNewYearly) {
//           // Rule 2: Monthly -> Yearly is ALWAYS an upgrade.
//           isUpgrade = true;
//         } else {
//           // Rule 3: Same duration (Month->Month or Year->Year). Compare daily rates.
//           isUpgrade = newDailyRate > currentDailyRate;
//         }

//         // C. HANDLE DOWNGRADE INTERCEPT
//         if (!isUpgrade) {
//           await scheduleDowngrade(currentSub.payment_id, newPlan.plan_id, billingCycle);
          
//           const formattedDate = expireDate.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
//           return res.status(200).json({ 
//             gateway: "downgrade_scheduled",
//             message: `Success! Your plan will automatically switch to ${newPlan.plan_name} (${billingCycle}) at the end of your current cycle on ${formattedDate}.`
//           });
//         }

//         // D. HANDLE UPGRADE PRORATION
//         if (currentSub.currency === currency) {
//           const daysRemaining = (expireDate - now) / (1000 * 60 * 60 * 24);
//           proratedDiscount = currentDailyRate * daysRemaining;
          
//           finalPrice = finalPrice - proratedDiscount;
//           if (finalPrice < 0) finalPrice = 0; 
//         }
//       }
//     }

//     // 3. Apply Minimum Charge Floors (Razorpay: 1 INR | Stripe: 0.50 USD)
//     finalPrice = currency === "INR" ? Math.max(1, Math.round(finalPrice)) : Math.max(0.50, parseFloat(finalPrice.toFixed(2))); 

//     // ----------------------------
//     // RAZORPAY FLOW (INDIA)
//     // ----------------------------
//     if (currency === "INR") {
//       const order = await razorpay.orders.create({
//         amount: finalPrice * 100, // Paise
//         currency: "INR",
//         receipt: `receipt_${Date.now()}`,
//       });
//       return res.status(200).json({ 
//         gateway: "razorpay", 
//         orderId: order.id, 
//         amount: order.amount, 
//         currency: order.currency 
//       });
//     }

//     // ----------------------------
//     // STRIPE FLOW (INTERNATIONAL)
//     // ----------------------------
//     if (currency === "USD") {
//       const stripeSession = await stripe.checkout.sessions.create({
//         payment_method_types: ['card'],
//         line_items: [{
//           price_data: {
//             currency: 'usd',
//             product_data: { 
//                 name: `${newPlan.plan_name} Plan (${billingCycle})`,
//                 description: proratedDiscount > 0 ? `Includes a $${proratedDiscount.toFixed(2)} credit for unused time on your current plan.` : undefined
//             },
//             unit_amount: Math.round(finalPrice * 100), // Cents
//           },
//           quantity: 1,
//         }],
//         mode: 'payment',
//         metadata: { 
//           userId: session.user.id, 
//           planId: newPlan.plan_id, 
//           billingCycle: billingCycle 
//         },
//         success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment/verify?session_id={CHECKOUT_SESSION_ID}`,
//         cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/pricing`,
//       });
      
//       return res.status(200).json({ gateway: "stripe", url: stripeSession.url });
//     }

//     return res.status(400).json({ error: "Invalid currency" });

//   } catch (error) {
//     console.error("Order Creation Error:", error);
//     return res.status(500).json({ error: "Failed to create order" });
//   }
// }