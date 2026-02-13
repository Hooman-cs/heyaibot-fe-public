import Razorpay from "razorpay";
import { getPlanById } from "../../../app/model/plan-db"; 

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { planId } = req.body;

    // 1. Fetch Plan details
    const plan = await getPlanById(planId);

    if (!plan || plan.status !== 'active') {
      return res.status(400).json({ error: "Invalid or inactive plan" });
    }

    // 2. Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: plan.amount * 100, // Razorpay expects amount in Paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return res.status(200).json({ 
      orderId: order.id, 
      amount: order.amount,
      currency: order.currency
    });

  } catch (error) {
    console.error("Razorpay Order Error:", error);
    return res.status(500).json({ error: "Error creating order" });
  }
}



// import Razorpay from "razorpay";
// import { NextResponse } from "next/server";
// import { getPlanById } from "../../../app/model/plan-db"; 

// const razorpay = new Razorpay({
//   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// export async function POST(request) {
//   try {
//     const { planId } = await request.json();

//     // 1. Fetch Plan details from DB
//     const plan = await getPlanById(planId);

//     if (!plan || plan.status !== 'active') {
//       return NextResponse.json({ error: "Invalid or inactive plan" }, { status: 400 });
//     }

//     // 2. Create Order
//     const order = await razorpay.orders.create({
//       amount: plan.amount * 100, // DB stores Rupees, Razorpay needs Paise
//       currency: "INR",
//       receipt: `receipt_${Date.now()}`,
//     });

//     return NextResponse.json({ orderId: order.id, amount: order.amount });
//   } catch (error) {
//     console.error("Razorpay Error:", error);
//     return NextResponse.json({ error: "Error creating order" }, { status: 500 });
//   }
// }