import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; 
import { createBoosterPlan, getAllBoosterPlans, updateBoosterPlan, toggleBoosterStatus } from "../../../app/model/booster-plan-db"; 

async function checkAdmin(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user.isSuperAdmin) return false;
  return true;
}

export default async function handler(req, res) {
  // GET is public (so the pricing/dashboard page can fetch available boosters)
  if (req.method === 'GET') {
    const plans = await getAllBoosterPlans();
    return res.status(200).json({ plans });
  }

  // All other methods require Admin privileges
  const isAdmin = await checkAdmin(req, res);
  if (!isAdmin) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === 'POST') {
    const result = await createBoosterPlan(req.body);
    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(201).json({ success: true, boosterId: result.boosterId });
  } 
  
  else if (req.method === 'PUT') {
    const { id, ...data } = req.body;
    if (!id) return res.status(400).json({ error: "Missing Booster ID" });

    const result = await updateBoosterPlan(id, data);
    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  else if (req.method === 'PATCH') {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: "Missing ID or Status" });

    const result = await toggleBoosterStatus(id, status);
    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}