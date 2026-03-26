import Stripe from "stripe";
import { getSubscriptionByOrderId, createSubscription } from "../../../app/model/subscription-db";
import { getPlanById } from "../../../app/model/plan-db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ✅ CRITICAL: Stripe requires the raw body to verify signatures. We MUST disable the default Next.js parser.
export const config = {
  api: { bodyParser: false },
};

// Helper function to read the raw body buffer
async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // 1. Verify the request actually came from Stripe
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("⚠️ Stripe Webhook Signature Verification Failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // 2. Listen specifically for successful recurring payments
  if (event.type === "invoice.payment_succeeded") {
    const invoice = event.data.object;

    // We only care about invoices that belong to a recurring subscription
    if (invoice.subscription) {
      try {
        // Find the original subscription in our database using the Stripe Subscription ID
        const originalSub = await getSubscriptionByOrderId(invoice.subscription);
        
        if (originalSub) {
          // Fetch the plan details to know how many days to add
          const plan = await getPlanById(originalSub.plan_id);
          
          if (plan) {
            const durationDays = originalSub.billing_cycle === 'yearly' ? 365 : (plan.duration || 30);
            const graceDays = plan.grace_period || 7;
            
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + durationDays);
            
            const graceExpireDate = new Date(expireDate);
            graceExpireDate.setDate(graceExpireDate.getDate() + graceDays);

            // Create a NEW row in the database for this month's receipt!
            await createSubscription({
              paymentId: invoice.payment_intent || `auto_${Date.now()}`,
              orderId: invoice.subscription, // Keeps the same recurring ID!
              userId: originalSub.user_id,
              planId: originalSub.plan_id,
              amount: invoice.amount_paid / 100, // Stripe amounts are in cents
              currency: "USD",
              gateway: "Stripe Auto-Renewal", // Differentiate from manual checkout
              billing_cycle: originalSub.billing_cycle,
              expireDate: expireDate.toISOString(),
              graceExpireDate: graceExpireDate.toISOString(),
              system_features: originalSub.snapshot_system_features,
              display_features: originalSub.snapshot_display_features
            });
            
            console.log(`✅ Successfully auto-renewed subscription for User: ${originalSub.user_id}`);
          }
        }
      } catch (err) {
        console.error("Error processing Stripe auto-renewal:", err);
        return res.status(500).json({ error: "Database update failed" });
      }
    }
  }

  // Tell Stripe we received the message so they don't keep retrying
  res.status(200).json({ received: true });
}