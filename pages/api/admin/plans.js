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
    // FIX: Extract grace_period
    const { name, price, duration, grace_period, features } = req.body;
    
    const result = await createPlan({ 
      name, 
      amount: price, 
      duration, 
      grace_period, // Pass to DB
      features 
    });

    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(201).json({ success: true, planId: result.planId });
  } 
  
  // 2. UPDATE PLAN
  else if (req.method === 'PUT') {
    // FIX: Extract grace_period
    const { id, name, price, duration, grace_period, features } = req.body;
    
    if (!id) return res.status(400).json({ error: "Missing Plan ID" });

    const result = await updatePlan(id, { 
      name, 
      amount: price, 
      duration, 
      grace_period, // Pass to DB
      features 
    });

    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  // 3. TOGGLE STATUS
  else if (req.method === 'PATCH') {
    const { id, status } = req.body; 
    if (!id || !status) return res.status(400).json({ error: "Missing ID or Status" });

    const result = await togglePlanStatus(id, status);
    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}