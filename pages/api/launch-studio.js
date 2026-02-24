import { getToken } from "next-auth/jwt";
import crypto from "crypto";
import { getUserSubscription } from "../../app/model/subscription-db";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // 1. Get User Token
    const tokenData = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    if (!tokenData) {
      console.log("Debug: No Token. Redirecting to login.");
      res.redirect("/login?error=SessionMissing");
      return;
    }

    const userId = tokenData.sub || tokenData.id;
    const isSuperAdmin = tokenData.isSuperAdmin === true;
    
    // Set token expiration (24 hours from now)
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = currentTime + (24 * 60 * 60); 
    const secret = process.env.NEXTAUTH_SECRET;

    // ==========================================
    // CONDITION 1: SUPER ADMIN FLOW
    // ==========================================
    if (isSuperAdmin) {
      const payload = JSON.stringify({
        userId: userId,
        isSuperAdmin: true,
        iat: currentTime,
        exp: expirationTime
      });

      // Sign the token
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const tokenString = Buffer.from(payload).toString('base64url');
      const signatureInput = `${header}.${tokenString}`;
      const signature = crypto.createHmac("sha256", secret).update(signatureInput).digest("base64url");
      const finalToken = `${signatureInput}.${signature}`;

      // Redirect to SuperAdmin Dashboard
      return res.redirect(`/SuperAdmin?token=${finalToken}`);
    }

    // ==========================================
    // CONDITION 2: NORMAL USER FLOW
    // ==========================================
    
    // Fetch user's latest subscription to get paymentId and dynamic status
    const sub = await getUserSubscription(userId);

    // If no subscription or the subscription is expired -> Redirect to Pricing
    if (!sub || sub.status === "Expired") {
      return res.redirect("/pricing");
    }

    // If subscription is Active or in Grace Period -> Allow Access
    if (sub.status === "Active" || sub.status === "Action Required") {
      const payload = JSON.stringify({
        userId: userId,
        isSuperAdmin: false,
        paymentId: sub.payment_id,
        iat: currentTime,
        exp: expirationTime
      });

      // Sign the token
      const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
      const tokenString = Buffer.from(payload).toString('base64url');
      const signatureInput = `${header}.${tokenString}`;
      const signature = crypto.createHmac("sha256", secret).update(signatureInput).digest("base64url");
      const finalToken = `${signatureInput}.${signature}`;

      // Redirect to Normal Admin Panel
      return res.redirect(`/AdminPanel?token=${finalToken}`);
    }

    // Fallback safeguard
    return res.redirect("/pricing");

  } catch (error) {
    console.error("Launch Studio Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}