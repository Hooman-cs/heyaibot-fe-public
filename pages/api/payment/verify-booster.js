import crypto from "crypto";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]"; 
import { getBoosterPlanById } from "../../../app/model/booster-plan-db";
import { addTokensToWallet } from "../../../app/model/token-wallet-db";
import { createBoosterOrder } from "../../../app/model/booster-order-db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  // =================================================================
  // 1. RAZORPAY VERIFICATION
  // =================================================================
  if (req.method === 'POST') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, boosterId } = req.body;

      // Verify Razorpay Signature
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(body.toString()).digest("hex");

      if (expectedSignature !== razorpay_signature) return res.status(400).json({ error: "Invalid signature" });

      const booster = await getBoosterPlanById(boosterId);
      if (!booster) return res.status(400).json({ error: "Booster not found" });

      // Action 1: Add tokens to their wallet (Atomic operation)
      const walletResult = await addTokensToWallet(session.user.id, booster.token_amount);
      if (!walletResult.success) throw new Error(walletResult.error);

      // Action 2: Save the receipt to the ledger
      await createBoosterOrder({
        paymentId: razorpay_payment_id,
        userId: session.user.id,
        boosterId: booster.booster_id,
        amount: booster.amount,
        currency: "INR",
        tokensAdded: booster.token_amount,
        gateway: "Razorpay"
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Razorpay Verify Booster Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // =================================================================
  // 2. STRIPE VERIFICATION (Webhook Redirect)
  // =================================================================
  else if (req.method === 'GET') {
    try {
      const { session_id } = req.query;
      if (!session_id) return res.redirect('/pricing?error=NoSession');

      const stripeSession = await stripe.checkout.sessions.retrieve(session_id);
      if (stripeSession.payment_status !== 'paid') return res.redirect('/pricing?error=PaymentNotCompleted');

      const userId = stripeSession.metadata.userId;
      const boosterId = stripeSession.metadata.boosterId;

      const booster = await getBoosterPlanById(boosterId);
      if (!booster) return res.redirect('/pricing?error=BoosterNotFound');

      const actualPaidUsd = stripeSession.amount_total ? (stripeSession.amount_total / 100) : booster.amount_usd;

      // Action 1: Add tokens to their wallet (Atomic operation)
      const walletResult = await addTokensToWallet(userId, booster.token_amount);
      if (!walletResult.success) throw new Error(walletResult.error);

      // Action 2: Save the receipt to the ledger
      await createBoosterOrder({
        paymentId: stripeSession.payment_intent,
        userId: userId,
        boosterId: booster.booster_id,
        amount: actualPaidUsd,
        currency: "USD",
        tokensAdded: booster.token_amount,
        gateway: "Stripe"
      });

      return res.redirect('/dashboard?payment_success=true');
    } catch (error) {
      console.error("Stripe Verify Booster Error:", error);
      return res.redirect('/pricing?error=VerificationFailed');
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}