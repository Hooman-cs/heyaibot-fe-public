import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; // Check this path relative to your folder structure
import { createPlan, getAllPlans, updatePlan, togglePlanStatus } from "../../../app/model/plan-db"; 
// OR import from "@/app/model/plan-db" if you kept it there

async function checkAdmin(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session || !session.user.isSuperAdmin) return false;
  return true;
}

export default async function handler(req, res) {
  // 1. PUBLIC: Get All Plans
  if (req.method === 'GET') {
    const plans = await getAllPlans();
    return res.status(200).json({ plans });
  }

  // 🔒 AUTH: All other methods require Admin
  const isAdmin = await checkAdmin(req, res);
  if (!isAdmin) return res.status(401).json({ error: "Unauthorized" });

  // 2. CREATE PLAN
  if (req.method === 'POST') {
    const { name, price, duration, features } = req.body;
    
    // features expects: { "Feature A": "Value 1", "Feature B": "Value 2" }
    const result = await createPlan({ 
      name, 
      amount: price, 
      duration, 
      features 
    });

    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(201).json({ success: true, planId: result.planId });
  } 
  
  // 3. UPDATE PLAN (Full Edit)
  else if (req.method === 'PUT') {
    const { id, name, price, duration, features } = req.body;
    
    if (!id) return res.status(400).json({ error: "Missing Plan ID" });

    const result = await updatePlan(id, { 
      name, 
      amount: price, 
      duration, 
      features 
    });

    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  // 4. TOGGLE STATUS (Enable/Disable)
  else if (req.method === 'PATCH') {
    const { id, status } = req.body; // status: "active" or "inactive"

    if (!id || !status) return res.status(400).json({ error: "Missing ID or Status" });

    const result = await togglePlanStatus(id, status);

    if (!result.success) return res.status(500).json({ error: result.error });
    return res.status(200).json({ success: true });
  }

  return res.status(405).end();
}

// import { NextResponse } from "next/server";
// import { getAllPlans, createPlan, updatePlanStatus } from "../../app/model/plan-db";
// import { getPlanFeatures } from "../../app/model/feature-db"; // <--- Import this
// // import { getServerSession } from "next-auth";
// import { getServerSession } from "next-auth/next";

// import { authOptions } from "../api/auth/[...nextauth]"; 


// async function isAdmin() {
//   const session = await getServerSession(authOptions);
//   return session?.user?.isSuperAdmin === true;
// }

// export async function GET() {
//   const plans = await getAllPlans();
  
//   // Stitch features into plans
//   const plansWithFeatures = await Promise.all(plans.map(async (plan) => {
//     const features = await getPlanFeatures(plan.plan_id);
    
//     // Format features for display (e.g., "3 max_bots")
//     const formattedFeatures = features.map(f => {
//        // You can customize this formatter logic
//        if (f.feature_value === "true") return f.feature_name;
//        return `${f.feature_value} ${f.feature_name}`;
//     });

//     return { ...plan, features: formattedFeatures };
//   }));

//   return NextResponse.json(plansWithFeatures);
// }

// export async function POST(req) {
//   if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
//   const body = await req.json();
//   await createPlan(body);
//   return NextResponse.json({ success: true });
// }

// export async function PUT(req) {
//   if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
//   const { planId, status } = await req.json();
//   await updatePlanStatus(planId, status);
//   return NextResponse.json({ success: true });
// }