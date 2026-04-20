import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; 
import { createPlan, getAllPlans, updatePlan, togglePlanStatus } from "../../../app/model/plan-db"; 

async function checkAdmin(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user.isSuperAdmin) return false;
  return true;
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const plans = await getAllPlans();
    return res.status(200).json({ plans });
  }

  const isAdmin = await checkAdmin(req, res);
  if (!isAdmin) return res.status(401).json({ error: "Unauthorized" });

  // 1. CREATE PLAN
  if (req.method === 'POST') {
    // We no longer destructure old keys. 
    // We pass req.body entirely because AdminPlansTab now sends the exact 
    // structure (amount, amount_mrp, system_features, etc.) that plan-db expects.
    const result = await createPlan(req.body);

    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(201).json({ success: true, planId: result.planId });
  } 
  
  // 2. UPDATE PLAN
  else if (req.method === 'PUT') {
    // Extract ID, and keep the rest of the pristine payload intact
    const { id, ...planData } = req.body;
    
    if (!id) return res.status(400).json({ error: "Missing Plan ID" });

    // Pass the payload directly to the database model
    const result = await updatePlan(id, planData);

    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  // 3. TOGGLE PLAN STATUS
  else if (req.method === 'PATCH') {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: "Missing ID or Status" });

    const result = await togglePlanStatus(id, status);
    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  return res.status(405).json({ error: "Method not allowed" });
}