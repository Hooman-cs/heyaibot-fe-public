import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { getPlanById } from "../../../app/model/plan-db";
import { createSubscription } from "../../../app/model/subscription-db";
import { updateUserPlan } from "../../../app/model/user-db";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { planId } = req.body;
  if (!planId) return res.status(400).json({ error: "Missing planId" });

  try {
    // 1. Fetch Plan Details to calculate expiration
    const plan = await getPlanById(planId);
    if (!plan) return res.status(404).json({ error: "Plan not found" });

    // Calculate Expiration (Default to 30 days if not specified)
    const durationDays = plan.duration || 30; 
    const startDate = new Date();
    const expireDate = new Date(startDate);
    expireDate.setDate(startDate.getDate() + durationDays);

    // 2. Generate Dummy IDs
    const dummyPaymentId = `mock_pay_${Date.now()}`;
    const dummyOrderId = `mock_order_${Date.now()}`;

    // 3. Create Subscription Record
    await createSubscription({
      paymentId: dummyPaymentId,
      orderId: dummyOrderId,
      userId: session.user.id,
      planId: planId,
      amount: plan.price_amount || 0,
      expireDate: expireDate.toISOString(),
      features: plan.features || [] // Snapshot current features
    });

    // 4. Update User Profile
    await updateUserPlan(session.user.id, planId);

    return res.status(200).json({ success: true, message: "Plan updated (Test Mode)" });

  } catch (error) {
    console.error("Mock Payment Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}