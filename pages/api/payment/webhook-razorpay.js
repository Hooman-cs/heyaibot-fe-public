import crypto from "crypto";
import { getSubscriptionByOrderId, createSubscription } from "../../../app/model/subscription-db";
import { getPlanById } from "../../../app/model/plan-db";

// ✅ CRITICAL: Just like Stripe, Razorpay requires the raw body string to perfectly verify the cryptographic signature.
export const config = {
  api: { bodyParser: false },
};

async function buffer(readable) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

  try {
    const rawBody = await buffer(req);
    const signature = req.headers["x-razorpay-signature"];
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error("Missing RAZORPAY_WEBHOOK_SECRET in environment variables");
      return res.status(500).json({ error: "Server Configuration Error" });
    }

    // 1. Verify the signature securely
    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("⚠️ Razorpay Webhook Signature Verification Failed");
      return res.status(400).send("Invalid Signature");
    }

    // Parse the verified body
    const event = JSON.parse(rawBody.toString());

    // 2. Listen specifically for successful recurring subscription payments
    if (event.event === "subscription.charged") {
      const subscriptionEntity = event.payload.subscription.entity;
      const paymentEntity = event.payload.payment.entity;

      const subscriptionId = subscriptionEntity.id; // e.g., sub_12345
      const paymentId = paymentEntity.id; // e.g., pay_12345
      const amountPaidInr = paymentEntity.amount / 100; // Razorpay amounts are in paise

      // Find the original subscription in our database
      const originalSub = await getSubscriptionByOrderId(subscriptionId);
      
      if (originalSub) {
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
            paymentId: paymentId,
            orderId: subscriptionId, // Keeps the same recurring ID
            userId: originalSub.user_id,
            planId: originalSub.plan_id,
            amount: amountPaidInr,
            currency: "INR",
            gateway: "Razorpay Auto-Renewal", // Differentiate from manual checkout
            billing_cycle: originalSub.billing_cycle,
            expireDate: expireDate.toISOString(),
            graceExpireDate: graceExpireDate.toISOString(),
            system_features: originalSub.snapshot_system_features,
            display_features: originalSub.snapshot_display_features
          });
          
          console.log(`✅ Successfully auto-renewed Razorpay subscription for User: ${originalSub.user_id}`);
        }
      }
    }

    // Return 200 OK so Razorpay knows we received it
    return res.status(200).json({ status: "ok" });

  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}