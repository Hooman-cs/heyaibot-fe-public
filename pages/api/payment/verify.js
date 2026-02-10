import { NextResponse } from "next/server";
import crypto from "crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; 
import { getPlanById } from "../../../app/model/plan-db";
import { getPlanFeatures } from "../../../app/model/feature-db";
import { createSubscription } from "../../../app/model/subscription-db";
import { updateUserPlan } from "../../../app/model/user-db";

export async function POST(req) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan: planId } = await req.json();
    const session = await getServerSession(authOptions);

    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 1. Verify Signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // 2. Fetch Plan & Features (The Snapshot Source)
    const plan = await getPlanById(planId);
    const features = await getPlanFeatures(planId); // Only active features

    // 3. Calculate Expiration
    const durationDays = plan.duration || 30;
    const expireDate = new Date();
    expireDate.setDate(expireDate.getDate() + durationDays);

    // 4. Create Subscription with SNAPSHOT
    await createSubscription({
      paymentId: razorpay_payment_id, // Using payment_id as subscription ID
      orderId: razorpay_order_id,
      userId: session.user.id,
      planId: plan.plan_id,
      amount: plan.amount,
      expireDate: expireDate.toISOString(),
      features: features // <--- Saving the list of features PERMANENTLY for this user
    });

    // 5. Update User Record (For quick "current plan" lookup)
    await updateUserPlan(session.user.id, plan.plan_id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Payment Verify Error:", error);
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}



// import { NextResponse } from "next/server";
// import crypto from "crypto";
// import { updateUserPlan } from "@/lib/user-db";
// import { getServerSession } from "next-auth";
// import { authOptions } from "@/app/api/auth/[...nextauth]/route";
// import { recordPayment } from "@/lib/subscription-db";

// export async function POST(req) {
//   try {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature, plan } = await req.json();
//     const session = await getServerSession(authOptions);

//     if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

//     const body = razorpay_order_id + "|" + razorpay_payment_id;
//     const expectedSignature = crypto
//       .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
//       .update(body.toString())
//       .digest("hex");

//     if (expectedSignature !== razorpay_signature) {
//       return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
//     }

//     // Update Plan + Expiration (Handled inside user-db.js)
//     await updateUserPlan(session.user.email, plan);

//     // NEW: Record History
//   await recordPayment({
//     paymentId: razorpay_payment_id,
//     orderId: razorpay_order_id,
//     userId: session.user.email,
//     planId: plan,
//     amount: "PAID", // You should pass the actual amount from frontend if possible
//     status: "success"
//   });

//     return NextResponse.json({ success: true });
//   } catch (error) {
//     console.error("Payment Verify Error:", error);
//     return NextResponse.json({ error: "Verification failed" }, { status: 500 });
//   }
// }