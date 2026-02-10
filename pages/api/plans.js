import { NextResponse } from "next/server";
import { getAllPlans, createPlan, updatePlanStatus } from "../../app/model/plan-db";
import { getPlanFeatures } from "../../app/model/feature-db"; // <--- Import this
// import { getServerSession } from "next-auth";
import { getServerSession } from "next-auth/next";

import { authOptions } from "../api/auth/[...nextauth]"; 


async function isAdmin() {
  const session = await getServerSession(authOptions);
  return session?.user?.isSuperAdmin === true;
}

export async function GET() {
  const plans = await getAllPlans();
  
  // Stitch features into plans
  const plansWithFeatures = await Promise.all(plans.map(async (plan) => {
    const features = await getPlanFeatures(plan.plan_id);
    
    // Format features for display (e.g., "3 max_bots")
    const formattedFeatures = features.map(f => {
       // You can customize this formatter logic
       if (f.feature_value === "true") return f.feature_name;
       return `${f.feature_value} ${f.feature_name}`;
    });

    return { ...plan, features: formattedFeatures };
  }));

  return NextResponse.json(plansWithFeatures);
}

export async function POST(req) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
  const body = await req.json();
  await createPlan(body);
  return NextResponse.json({ success: true });
}

export async function PUT(req) {
  if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
  const { planId, status } = await req.json();
  await updatePlanStatus(planId, status);
  return NextResponse.json({ success: true });
}




// import { NextResponse } from "next/server";
// import { getAllPlans, createPlan, updatePlanStatus } from "@/lib/plan-db"; // REMOVED deletePlan
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/lib/auth-config";

// async function isAdmin() {
//   const session = await getServerSession(authOptions);
//   return session?.user?.role === "admin";
// }

// export async function GET() {
//   const plans = await getAllPlans();
//   return NextResponse.json(plans);
// }

// export async function POST(req) {
//   if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
//   const body = await req.json();
//   await createPlan(body);
//   return NextResponse.json({ success: true });
// }

// // Handler for disabling/enabling plans
// export async function PUT(req) {
//   if (!await isAdmin()) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  
//   const { planId, status } = await req.json();
//   await updatePlanStatus(planId, status);
//   return NextResponse.json({ success: true });
// }