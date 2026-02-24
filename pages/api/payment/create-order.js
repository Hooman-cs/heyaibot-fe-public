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