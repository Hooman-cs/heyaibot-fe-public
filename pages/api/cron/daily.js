import { docClient } from "../../../app/model/dynamodb";
import { ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { getPlanById } from "../../../app/model/plan-db";
import Stripe from "stripe";
import Razorpay from "razorpay";

const SUBS_TABLE = "Subscriptions";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  // 1. SECURITY CHECK: Ensure Azure is the one calling this endpoint
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized. Invalid CRON secret." });
  }

  try {
    console.log("🚀 Starting Nightly CRON Job...");
    const now = new Date();

    // ==========================================
    // STEP A: Process Scheduled Downgrades
    // ==========================================
    console.log("--- Executing Step A: Scheduled Downgrades ---");
    const scheduledSubsResult = await docClient.send(new ScanCommand({
      TableName: SUBS_TABLE,
      FilterExpression: "attribute_exists(scheduled_plan_id) AND scheduled_plan_id <> :nullVal",
      ExpressionAttributeValues: { ":nullVal": null }
    }));

    const subsToDowngrade = scheduledSubsResult.Items || [];
    
    for (const sub of subsToDowngrade) {
      const expireDate = new Date(sub.expire_date);

      if (now >= expireDate) {
        console.log(`Processing downgrade for User: ${sub.user_id}`);
        
        try {
          const newPlan = await getPlanById(sub.scheduled_plan_id);
          const nextCycle = sub.scheduled_billing_cycle || "monthly";
          
          if (!newPlan) continue;

          // Update Stripe
          if (sub.gateway === "Stripe") {
            const newStripePriceId = nextCycle === "yearly" ? newPlan.stripe_yearly_id : newPlan.stripe_monthly_id;
            const stripeSub = await stripe.subscriptions.retrieve(sub.order_id);
            const subItemId = stripeSub.items.data[0].id;

            await stripe.subscriptions.update(sub.order_id, {
              items: [{ id: subItemId, price: newStripePriceId }],
              proration_behavior: 'none', 
            });
          } 
          // Update Razorpay
          else if (sub.gateway === "Razorpay" || sub.gateway === "Razorpay Auto-Renewal") {
            const newRazorpayPlanId = nextCycle === "yearly" ? newPlan.razorpay_yearly_id : newPlan.razorpay_monthly_id;
            await razorpay.subscriptions.update(sub.order_id, {
              plan_id: newRazorpayPlanId,
              customer_notify: 1
            });
          }

          // Clear the scheduled downgrade from the OLD record
          await docClient.send(new UpdateCommand({
            TableName: SUBS_TABLE,
            Key: { payment_id: sub.payment_id },
            UpdateExpression: "set scheduled_plan_id = :nullVal, scheduled_billing_cycle = :nullVal",
            ExpressionAttributeValues: { ":nullVal": null }
          }));

          console.log(`✅ Successfully downgraded User: ${sub.user_id}`);

        } catch (downgradeErr) {
          console.error(`Failed to downgrade subscription ${sub.order_id}:`, downgradeErr.message);
        }
      }
    }

    // ==========================================
    // STEP B: Process Expirations (Soft Lock)
    // ==========================================
    console.log("--- Executing Step B: Grace Period Expirations ---");
    
    // Find all subscriptions that are NOT already marked as "Expired"
    const activeSubsResult = await docClient.send(new ScanCommand({
      TableName: SUBS_TABLE,
      FilterExpression: "#st <> :exp",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":exp": "Expired" }
    }));

    const activeSubs = activeSubsResult.Items || [];
    let expiredCount = 0;

    for (const sub of activeSubs) {
      // Ensure we have a valid grace period date to check against
      const graceExpireDate = sub.grace_expire_date 
        ? new Date(sub.grace_expire_date) 
        : new Date(new Date(sub.expire_date).getTime() + 7 * 24 * 60 * 60 * 1000); // Fallback: add 7 days

      // If today is past their grace period, permanently mark them as Expired
      if (now > graceExpireDate) {
        console.log(`Locking account for User: ${sub.user_id}. Grace period ended on ${graceExpireDate.toLocaleDateString()}`);
        
        await docClient.send(new UpdateCommand({
          TableName: SUBS_TABLE,
          Key: { payment_id: sub.payment_id },
          UpdateExpression: "set #st = :expVal",
          ExpressionAttributeNames: { "#st": "status" },
          ExpressionAttributeValues: { ":expVal": "Expired" }
        }));
        
        expiredCount++;
      }
    }

    console.log(`✅ Locked ${expiredCount} expired subscriptions.`);

    console.log("🏁 Nightly CRON Job Completed Successfully.");
    return res.status(200).json({ success: true, message: "Nightly maintenance complete." });

  } catch (error) {
    console.error("Nightly CRON Job Failed:", error);
    return res.status(500).json({ error: "Internal Server Error during maintenance." });
  }
}