import crypto from "crypto";
import { getSubscriptionByOrderId, createSubscription } from "../../../app/model/subscription-db";
import { getPlanById } from "../../../app/model/plan-db";
import { updateUserPlan } from "../../../app/model/user-db"; 
import { docClient } from "../../../app/model/dynamodb"; 
import { UpdateCommand, GetCommand } from "@aws-sdk/lib-dynamodb"; 

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
      return res.status(500).json({ error: "Server Configuration Error" });
    }

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody.toString())
      .digest("hex");

    if (expectedSignature !== signature) {
      console.error("⚠️ Razorpay Webhook Signature Verification Failed");
      return res.status(400).send("Invalid signature");
    }

    const event = JSON.parse(rawBody.toString());

    // ==========================================
    // 1. HANDLE AUTO-RENEWALS & DUPLICATES
    // ==========================================
    if (event.event === "subscription.charged") {
      const paymentId = event.payload.payment.entity.id;
      const subscriptionId = event.payload.subscription.entity.id;
      const amountPaidInr = event.payload.payment.entity.amount / 100;

      // Prevent Duplicate Records
      const { Item: existingPayment } = await docClient.send(new GetCommand({
        TableName: "Subscriptions",
        Key: { payment_id: paymentId }
      }));

      if (existingPayment) {
        console.log("⏭️ Skipping Razorpay subscription.charged because payment was already verified by frontend.");
        return res.status(200).json({ status: "ok" });
      }

      const originalSub = await getSubscriptionByOrderId(subscriptionId);

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

          await createSubscription({
            paymentId: paymentId,
            orderId: subscriptionId, 
            userId: originalSub.user_id,
            planId: originalSub.plan_id,
            amount: amountPaidInr,
            currency: "INR",
            gateway: "Razorpay Auto-Renewal", 
            billing_cycle: originalSub.billing_cycle,
            expireDate: expireDate.toISOString(),
            graceExpireDate: graceExpireDate.toISOString(),
            system_features: safeSystemFeatures,
            display_features: safeDisplayFeatures
          });
          
          // Update the user plan dynamically
          await updateUserPlan(originalSub.user_id, originalSub.plan_id);

          console.log(`✅ Auto-renewed Razorpay subscription for User: ${originalSub.user_id} (${originalSub.billing_cycle})`);
        }
      }
    }

    // ==========================================
    // 2. HANDLE CANCELLATIONS 
    // ==========================================
    if (event.event === "subscription.cancelled") {
      const subscriptionId = event.payload.subscription.entity.id;
      const dbSub = await getSubscriptionByOrderId(subscriptionId);

      if (dbSub) {
        await docClient.send(new UpdateCommand({
          TableName: "Subscriptions",
          Key: { payment_id: dbSub.payment_id },
          UpdateExpression: "set #st = :exp",
          ExpressionAttributeNames: { "#st": "status" },
          ExpressionAttributeValues: { ":exp": "Expired" }
        }));

        await updateUserPlan(dbSub.user_id, "none");
        console.log(`🚫 Cancelled Razorpay subscription for User: ${dbSub.user_id}`);
      }
    }

    return res.status(200).json({ status: "ok" });

  } catch (error) {
    console.error("Razorpay Webhook Error:", error);
    return res.status(500).json({ error: "Database update failed" });
  }
}