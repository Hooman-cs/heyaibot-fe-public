import { getToken } from "next-auth/jwt";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // 1. Try getting the token directly
    const tokenData = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    console.log("1. Launch Studio hit");
    console.log("2. Token Found:", tokenData ? "YES" : "NO");

    if (!tokenData) {
      console.log("3. Debug: No Token. Cookies:", req.headers.cookie);
      res.redirect("/login?error=SessionMissing");
      return;
    }

    // 2. Create payload with expiration (24 hours from now)
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = currentTime + (24 * 60 * 60); // 24 hours
    
    const payload = JSON.stringify({
      userId: tokenData.sub || tokenData.id ,
      planId: 'e6fc6edf-981c-4fe8-85a9-778f8d8ad217',
      plan: true,
      maxBot: 3,
      iat: currentTime,  // Issued at
      exp: expirationTime // Expiration time
    });

    // 3. Sign the token
    const secret = process.env.NEXTAUTH_SECRET;
    
    // Create JWT-like structure
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64');
    const tokenString = Buffer.from(payload).toString('base64');
    
    // Combine header and payload for signature
    const signatureInput = `${header}.${tokenString}`;
    const signature = crypto.createHmac("sha256", secret).update(signatureInput).digest("hex");

    // 4. Redirect with complete JWT token
    const fullToken = `${header}.${tokenString}.${signature}`;
    res.redirect(`/AdminPanel?token=${encodeURIComponent(fullToken)}`);

  } catch (error) {
    console.error("Launch Studio Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}