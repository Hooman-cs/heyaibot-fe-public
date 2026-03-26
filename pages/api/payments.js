import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { getAllSubscriptions, getUserSubscriptionHistory } from "../../app/model/subscription-db"; 
import { getAllBoosterOrders, getUserBoosterOrders } from "../../app/model/booster-order-db"; // NEW
import { getUserById } from "../../app/model/user-db"; 
import { getPlanById } from "../../app/model/plan-db"; 
import { getBoosterPlanById } from "../../app/model/booster-plan-db"; // NEW

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Fetch RAW data for both Subscriptions and Boosters concurrently for speed
    const [rawSubs, rawBoosters] = session.user.isSuperAdmin 
        ? await Promise.all([getAllSubscriptions(), getAllBoosterOrders()]) 
        : await Promise.all([getUserSubscriptionHistory(session.user.id), getUserBoosterOrders(session.user.id)]);

    // 2. Enrich Subscription Data (Attaching User Info & Plan Names)
    const enrichedSubs = await Promise.all(rawSubs.map(async (sub) => {
      const [user, plan] = await Promise.all([
        getUserById(sub.user_id),
        getPlanById(sub.plan_id)
      ]);

      return {
        ...sub,
        user_name: user ? user.user_name : "Unknown User",
        user_email: user ? user.user_email : "Unknown Email",
        plan_name: plan ? plan.plan_name : `Plan ${sub.plan_id}`
      };
    }));

    // 3. Enrich Booster Data (Attaching User Info & Booster Names)
    const enrichedBoosters = await Promise.all(rawBoosters.map(async (order) => {
      const [user, booster] = await Promise.all([
        getUserById(order.user_id),
        getBoosterPlanById(order.booster_id)
      ]);

      return {
        ...order,
        user_name: user ? user.user_name : "Unknown User",
        user_email: user ? user.user_email : "Unknown Email",
        booster_name: booster ? booster.name : "Custom Booster"
      };
    }));

    // 4. Return both as a clean object
    return res.status(200).json({ 
        subscriptions: enrichedSubs, 
        boosterOrders: enrichedBoosters 
    });

  } catch (error) {
    console.error("Payment Fetch Error:", error);
    return res.status(500).json({ error: "Failed to fetch history" });
  }
}