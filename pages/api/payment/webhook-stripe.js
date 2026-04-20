import Stripe from "stripe";
import { getSubscriptionByOrderId, createSubscription } from "../../../app/model/subscription-db";
import { getPlanById } from "../../../app/model/plan-db";
import { updateUserPlan } from "../../../app/model/user-db"; 
import { docClient } from "../../../app/model/dynamodb"; 
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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

  const sig = req.headers["stripe-signature"];
  let event;

  try {
    const rawBody = await buffer(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("⚠️ Stripe Webhook Signature Verification Failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // ==========================================
    // 1. HANDLE AUTO-RENEWALS (And Prevent Duplicates)
    // ==========================================
    if (event.type === "invoice.paid") {
      const invoice = event.data.object;

      // Prevent Duplicate DB Records
      if (invoice.billing_reason === "subscription_create") {
        console.log("⏭️ Skipping initial invoice.paid event to prevent duplicate subscription.");
        return res.status(200).json({ received: true });
      }

      const originalSub = await getSubscriptionByOrderId(invoice.subscription);

      if (originalSub) {
        const plan = await getPlanById(originalSub.plan_id);
        if (plan) {
          // ✅ FIX 1: Dynamically determine duration based on billing cycle!
          const isYearly = originalSub.billing_cycle === "yearly";
          const durationDays = isYearly ? 365 : 30;
          const graceDays = plan.grace_period || 7;
          
          const expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + durationDays);
          
          const graceExpireDate = new Date(expireDate);
          graceExpireDate.setDate(graceExpireDate.getDate() + graceDays);

          // ✅ FIX 2: Safely extract old snapshot features
          const safeSystemFeatures = originalSub.snapshot_system_features || originalSub.snapshot_features || {};
          const safeDisplayFeatures = originalSub.snapshot_display_features || [];

          // Create auto-renewal row
          await createSubscription({
            paymentId: invoice.payment_intent || `auto_${Date.now()}`,
            orderId: invoice.subscription, 
            userId: originalSub.user_id,
            planId: originalSub.plan_id,
            amount: invoice.amount_paid / 100, 
            currency: "USD",
            gateway: "Stripe Auto-Renewal",
            billing_cycle: originalSub.billing_cycle,
            expireDate: expireDate.toISOString(),
            graceExpireDate: graceExpireDate.toISOString(),
            system_features: safeSystemFeatures,
            display_features: safeDisplayFeatures
          });

          // Ensure user's profile is updated on renewal
          await updateUserPlan(originalSub.user_id, originalSub.plan_id);
          
          console.log(`✅ Auto-renewed Stripe subscription for User: ${originalSub.user_id} (${originalSub.billing_cycle})`);
        }
      }
    }

    // ==========================================
    // 2. HANDLE CANCELLATIONS
    // ==========================================
    // if (event.type === "customer.subscription.deleted") {
    //   const subEntity = event.data.object;
    //   const dbSub = await getSubscriptionByOrderId(subEntity.id);

    //   if (dbSub) {
    //     // Mark subscription as Expired in the ledger
    //     await docClient.send(new UpdateCommand({
    //       TableName: "Subscriptions",
    //       Key: { payment_id: dbSub.payment_id },
    //       UpdateExpression: "set #st = :exp",
    //       ExpressionAttributeNames: { "#st": "status" },
    //       ExpressionAttributeValues: { ":exp": "Expired" }
    //     }));

    //     // Remove plan access from the user's main profile
    //     await updateUserPlan(dbSub.user_id, "none");
    //     console.log(`🚫 Cancelled Stripe subscription for User: ${dbSub.user_id}`);
    //   }
    // }
    if (event.type === "customer.subscription.deleted") {
      const subEntity = event.data.object;
      const dbSub = await getSubscriptionByOrderId(subEntity.id);

      if (dbSub) {
        // OPTIMIZATION: Use the new shared utility
        const { markSubscriptionExpired } = await import('../../../app/model/subscription-db');
        await markSubscriptionExpired(dbSub.payment_id, dbSub.user_id);
        
        console.log(`🚫 Cancelled Stripe subscription for User: ${dbSub.user_id}`);
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error processing Stripe Webhook:", err);
    return res.status(500).json({ error: "Database update failed" });
  }
}