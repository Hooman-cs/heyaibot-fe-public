import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { getUserSubscription } from "../../../app/model/subscription-db";
import { getWalletBalance } from "../../../app/model/token-wallet-db"; // NEW

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch both the subscription and wallet balance
    const sub = await getUserSubscription(session.user.id);
    const boosterTokens = await getWalletBalance(session.user.id); // NEW

    if (!sub) {
      return res.status(200).json({ maxBot: 0, tokenCount: 0, baseTokens: 0, boosterTokens: boosterTokens, expireDate: null });
    }

    const features = sub.snapshot_system_features || sub.snapshot_features || {};
    
    // 1. Extract "Max Bots"
    const botKey = Object.keys(features).find(k => /bot/i.test(k));
    let maxBot = 0;
    if (botKey) {
      maxBot = parseInt(features[botKey]);
      if (isNaN(maxBot)) maxBot = 0;
    }

    // 2. Extract "Token Count"
    const tokenKey = Object.keys(features).find(k => /token/i.test(k));
    let baseTokens = 0;
    if (tokenKey) {
      const cleanTokenString = String(features[tokenKey]).replace(/,/g, '');
      baseTokens = parseInt(cleanTokenString);
      if (isNaN(baseTokens)) baseTokens = 0;
    }

    const totalTokens = baseTokens + boosterTokens; // NEW

    // 3. Handle Expired Status
    if (sub.status === "Expired") {
      return res.status(200).json({ 
        maxBot: 0, 
        tokenCount: boosterTokens, // NEW: They can still use their booster tokens!
        baseTokens: 0,
        boosterTokens: boosterTokens,
        expireDate: sub.expire_date 
      });
    }

    return res.status(200).json({ 
      maxBot: maxBot, 
      tokenCount: totalTokens, // NEW: Send combined total
      baseTokens: baseTokens,
      boosterTokens: boosterTokens,
      expireDate: sub.expire_date 
    });

  } catch (error) {
    console.error("Max Bot API Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}