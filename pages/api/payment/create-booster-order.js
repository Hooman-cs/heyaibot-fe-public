import Razorpay from "razorpay";
import Stripe from "stripe";
import { getBoosterPlanById } from "../../../app/model/booster-plan-db"; 
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    const { boosterId, currency = "INR" } = req.body;

    // 1. Fetch the Booster Plan
    const booster = await getBoosterPlanById(boosterId);
    if (!booster || booster.status !== 'active') return res.status(400).json({ error: "Invalid booster pack" });

    // 2. Set the price
    let finalPrice = Number(currency === "INR" ? booster.amount : booster.amount_usd);

    // Apply Minimum Charge Floors
    finalPrice = currency === "INR" ? Math.max(1, Math.round(finalPrice)) : Math.max(0.50, parseFloat(finalPrice.toFixed(2))); 

    // ----------------------------
    // RAZORPAY FLOW
    // ----------------------------
    if (currency === "INR") {
      const order = await razorpay.orders.create({
        amount: finalPrice * 100, // Paise
        currency: "INR",
        receipt: `booster_${Date.now()}`,
      });
      return res.status(200).json({ gateway: "razorpay", orderId: order.id, amount: order.amount, currency: order.currency });
    }

    // ----------------------------
    // STRIPE FLOW 
    // ----------------------------
    if (currency === "USD") {
      const stripeSession = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: booster.name },
            unit_amount: Math.round(finalPrice * 100), // Cents
          },
          quantity: 1,
        }],
        mode: 'payment', // One-time payment
        metadata: { 
          userId: session.user.id, 
          boosterId: booster.booster_id 
        },
        // Notice it redirects to our NEW verify-booster API
        success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment/verify-booster?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/pricing`,
      });
      return res.status(200).json({ gateway: "stripe", url: stripeSession.url });
    }

    return res.status(400).json({ error: "Invalid currency" });

  } catch (error) {
    console.error("Booster Order Creation Error:", error);
    return res.status(500).json({ error: "Failed to create order" });
  }
}