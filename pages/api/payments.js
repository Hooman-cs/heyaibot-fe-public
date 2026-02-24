import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { getAllSubscriptions, getUserSubscriptionHistory } from "../../app/model/subscription-db"; 
import { getUserById } from "../../app/model/user-db"; 
import { getPlanById } from "../../app/model/plan-db"; 

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Logic: SuperAdmin gets all, Normal user gets their own history
    const rawSubs = session.user.isSuperAdmin 
        ? await getAllSubscriptions() 
        : await getUserSubscriptionHistory(session.user.id);

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

    return res.status(200).json(enrichedSubs);
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch history" });
  }
}