import Razorpay from "razorpay";
import { NextResponse } from "next/server";
import { getPlanById } from "../../../app/model/plan-db"; 

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export async function POST(request) {
  try {
    const { planId } = await request.json();

    // 1. Fetch Plan details from DB
    const plan = await getPlanById(planId);

    if (!plan || plan.status !== 'active') {
      return NextResponse.json({ error: "Invalid or inactive plan" }, { status: 400 });
    }

    // 2. Create Order
    const order = await razorpay.orders.create({
      amount: plan.amount * 100, // DB stores Rupees, Razorpay needs Paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json({ orderId: order.id, amount: order.amount });
  } catch (error) {
    console.error("Razorpay Error:", error);
    return NextResponse.json({ error: "Error creating order" }, { status: 500 });
  }
}


// import Razorpay from "razorpay";
// import { NextResponse } from "next/server";
// import { getPlanById } from "@/lib/plan-db"; // Import the helper

// const razorpay = new Razorpay({
//   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// export async function POST(request) {
//   try {
//     const { planId } = await request.json();

//     // 1. Fetch Plan from Database
//     const plan = await getPlanById(planId);

//     if (!plan) {
//       return NextResponse.json({ error: "Invalid plan ID" }, { status: 400 });
//     }

//     // 2. Create Order using dynamic price
//     const order = await razorpay.orders.create({
//       amount: plan.price * 100, // Convert Rupees to Paise
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//     });

//     return NextResponse.json({ orderId: order.id, amount: order.amount });
//   } catch (error) {
//     console.error("Razorpay Error:", error);
//     return NextResponse.json({ error: "Error creating order" }, { status: 500 });
//   }
// }