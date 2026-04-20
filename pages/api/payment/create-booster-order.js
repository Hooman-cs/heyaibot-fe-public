import Razorpay from "razorpay";
import Stripe from "stripe";
import { getBoosterPlanById } from "../../../app/model/booster-plan-db";
import { getCouponByCode } from "../../../app/model/coupon-db"; // ✅ NEW: Import coupon DB
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

    // ✅ NEW: Extract couponCode from req.body
    const { boosterId, currency = "INR", couponCode } = req.body;

    // 1. Fetch Booster Plan
    const booster = await getBoosterPlanById(boosterId);
    if (!booster || booster.status !== 'active') return res.status(400).json({ error: "Invalid booster plan" });

    let basePrice = currency === "USD" ? booster.amount_usd : booster.amount;
    let finalPrice = basePrice;
    let dbCoupon = null;

    // ==========================================
    // ✅ NEW: VALIDATE & APPLY COUPON
    // ==========================================
    if (couponCode) {
      dbCoupon = await getCouponByCode(couponCode);
      
      // Basic validity check
      if (!dbCoupon || dbCoupon.status !== 'active') {
        return res.status(400).json({ error: "Invalid or expired coupon" });
      }
      
      // Strict Segregation Check (Backend Security)
      if (dbCoupon.applicable_to !== 'all' && dbCoupon.applicable_to !== 'booster') {
        return res.status(403).json({ error: "This coupon is not valid for token boosters" });
      }

      // Calculate final local price (Crucial for Razorpay)
      finalPrice = Math.round(basePrice * (1 - dbCoupon.discount_percentage / 100));
    }

    // ----------------------------
    // RAZORPAY BOOSTER FLOW (INR)
    // ----------------------------
    if (currency === "INR") {
      const options = {
        amount: finalPrice * 100, // ✅ Razorpay requires the exact discounted amount in paise
        currency: "INR",
        receipt: `receipt_${Date.now()}_${boosterId.substring(0, 5)}`,
      };

      const order = await razorpay.orders.create(options);
      return res.status(200).json({
        gateway: "razorpay",
        orderId: order.id,
        amount: options.amount,
        currency: "INR"
      });
    }

    // ----------------------------
    // STRIPE BOOSTER FLOW (USD)
    // ----------------------------
    if (currency === "USD") {
      const amountInCents = Math.round(basePrice * 100);

      const stripeOptions = {
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: booster.name,
              description: `+${booster.token_amount} Tokens`,
            },
            unit_amount: amountInCents, // Stripe requires the BASE price here
          },
          quantity: 1,
        }],
        mode: 'payment', // One-time payment mode
        metadata: {
          userId: session.user.id,
          boosterId: booster.booster_id,
          tokensAdded: booster.token_amount
        },
        success_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/api/payment/verify-booster?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.NEXTAUTH_URL || "http://localhost:3000"}/pricing`,
      };

      // ✅ ATTACH COUPON TO STRIPE CHECKOUT
      if (dbCoupon && dbCoupon.stripe_promo_id) {
        stripeOptions.discounts = [{
          // promotion_code: dbCoupon.stripe_promo_id
          coupon: dbCoupon.stripe_promo_id
        }];
      }

      const stripeSession = await stripe.checkout.sessions.create(stripeOptions);
      return res.status(200).json({ gateway: "stripe", url: stripeSession.url });
    }

  } catch (error) {
    console.error("Create Booster Order Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
