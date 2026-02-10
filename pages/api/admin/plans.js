import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { createPlan, getAllPlans } from "../../../app/model/plan-db";

// Helper to check for admin
async function checkAdmin(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user.isSuperAdmin) return false;
  return true;
}

export default async function handler(req, res) {
  // ✅ 1. Allow GET requests for EVERYONE (no admin check needed)
  if (req.method === 'GET') {
    try {
      const plans = await getAllPlans();
      return res.status(200).json({ plans });
    } catch (error) {
      return res.status(500).json({ error: "Failed to fetch plans" });
    }
  }

  // ✅ 2. For POST and DELETE, enforce Admin check
  const isAdmin = await checkAdmin(req, res);
  if (!isAdmin) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  if (req.method === 'POST') {
    const { name, price, interval, stripeId, currency, features } = req.body;

    const result = await createPlan({ 
      name, 
      price: parseInt(price), 
      interval, 
      stripeId, 
      currency,
      features 
    });

    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true, planId: result.planId });
  } 
  
  else if (req.method === 'DELETE') {
    const { id } = req.query; 

    if(!id) return res.status(400).json({ error: "Missing ID" });

    const result = await deletePlan(id);
    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}




// import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]";
// import { createPlan, getAllPlans } from "../../../app/model/plan-db";

// async function checkAdmin(req, res) {
//   const session = await getServerSession(req, res, authOptions);
//   if (!session || !session.user.isSuperAdmin) return false;
//   return true;
// }

// export default async function handler(req, res) {
//   // Check auth first
//   const isAdmin = await checkAdmin(req, res);
//   if (!isAdmin) return res.status(401).json({ error: "Unauthorized" });

//   if (req.method === 'GET') {
//     const plans = await getAllPlans();
//     return res.status(200).json({ plans });
//   } 
  
//   else if (req.method === 'POST') {
//     // req.body is already parsed in Pages router
//     const { name, price, interval, stripeId, currency, features } = req.body;

//     const result = await createPlan({ 
//       name, 
//       price: parseInt(price), 
//       interval, 
//       stripeId, 
//       currency,
//       features 
//     });

//     if (!result.success) return res.status(500).json({ error: result.error });
//     return res.status(200).json({ success: true, planId: result.planId });
//   } 
  
//   else if (req.method === 'DELETE') {
//     const { id } = req.query; // Query params are in req.query

//     if(!id) return res.status(400).json({ error: "Missing ID" });

//     const result = await deletePlan(id);
//     if (!result.success) return res.status(500).json({ error: result.error });
//     return res.status(200).json({ success: true });
//   }

//   return res.status(405).end();
// }