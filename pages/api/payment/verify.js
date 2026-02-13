import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; 
import { getPlanById } from "../../../app/model/plan-db";

import { createSubscription } from "../../../app/model/subscription-db";
import { updateUserPlan } from "../../../app/model/user-db"; 

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature, 
      planId 
    } = req.body;

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    // 2. Fetch Plan (Source of Truth)
    const plan = await getPlanById(planId);
    if (!plan) return res.status(400).json({ error: "Plan not found" });

    // 3. Extract Features for Snapshot
    // Since we merged tables, features are now directly on the plan object
    const featuresSnapshot = plan.features || {}; 

    // 4. Calculate Expiration Date
    const durationDays = plan.duration || 30;
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + durationDays);

    // 5. Create Subscription with Feature Snapshot
    const subResult = await createSubscription({
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      userId: session.user.id,
      planId: plan.plan_id,
      amount: plan.amount,
      expireDate: expireDate.toISOString(),
      features: featuresSnapshot // <--- SAVED PERMANENTLY FOR THIS SUB
    });

    if (!subResult.success) {
      throw new Error(subResult.error);
    }

    // 6. Update User Profile (So the app knows their current tier)
    await updateUserPlan(session.user.id, plan.plan_id);

    return res.status(200).json({ success: true });

  } catch (error) {
    console.error("Payment Verification Error:", error);
    return res.status(500).json({ error: "Verification failed" });
  }
}



// import { NextResponse } from "next/server";
// import crypto from "crypto";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]"; 
// import { getPlanById } from "../../../app/model/plan-db";
// import { getPlanFeatures } from "../../../app/model/feature-db";
// import { createSubscription } from "../../../app/model/subscription-db";
// import { updateUserPlan } from "../../../app/model/user-db";

// export async function POST(req) {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan: planId } = await req.json();
//     const session = await getServerSession(authOptions);

//     if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     // 1. Verify Signature
//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
//     }

//     // 2. Fetch Plan & Features (The Snapshot Source)
//     const plan = await getPlanById(planId);
//     const features = await getPlanFeatures(planId); // Only active features

//     // 3. Calculate Expiration
//     const durationDays = plan.duration || 30;
//     const expireDate = new Date();
//     expireDate.setDate(expireDate.getDate() + durationDays);

//     // 4. Create Subscription with SNAPSHOT
//     await createSubscription({
//       paymentId: razorpay_payment_id, // Using payment_id as subscription ID
//       orderId: razorpay_order_id,
//       userId: session.user.id,
//       planId: plan.plan_id,
//       amount: plan.amount,
//       expireDate: expireDate.toISOString(),
//       features: features // <--- Saving the list of features PERMANENTLY for this user
//     });

//     // 5. Update User Record (For quick "current plan" lookup)
//     await updateUserPlan(session.user.id, plan.plan_id);

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Payment Verify Error:", error);
//     return NextResponse.json({ error: "Verification failed" }, { status: 500 });
//   }
// }