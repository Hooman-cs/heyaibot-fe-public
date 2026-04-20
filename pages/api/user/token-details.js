//pages/api/user/token-details.js
import { getUserSubscription } from "../../../app/model/subscription-db";
import { getWalletBalance } from "../../../app/model/token-wallet-db";
// ✅ 1. IMPORT YOUR USER DB FUNCTION
import { getUserById } from "../../../app/model/user-db"; 

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Get userId from query parameter
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, error: "userId is required" });
    }

    // ✅ 2. FETCH USER DETAILS ALONG WITH SUBSCRIPTION & WALLET
    const [sub, boosterTokens, user] = await Promise.all([
      getUserSubscription(userId),
      getWalletBalance(userId),
      getUserById(userId).catch(() => null) // Safely catch errors if user isn't found
    ]);

    let planExpirationDate = null;
    let planTokens = 0;

    // Extract exact plan tokens
    if (sub) {
      planExpirationDate = sub.expire_date || null;
      
      // Only grant plan tokens if the subscription is actively paying or in grace period
      if (["Active", "Action Required"].includes(sub.status)) {
        
        const features = sub.snapshot_system_features || sub.snapshot_features || {};
        
        // Find the key that contains "token" (case insensitive)
        const tokenKey = Object.keys(features).find(k => /token/i.test(k));
        
        if (tokenKey) {
          // Remove commas and convert to integer
          const cleanTokenString = String(features[tokenKey]).replace(/,/g, '');
          planTokens = parseInt(cleanTokenString);
          if (isNaN(planTokens)) planTokens = 0;
        }
      }
    }

    // Calculate Total Tokens
    const totalTokens = planTokens + Number(boosterTokens);

    // Return JSON format
    return res.status(200).json({
      success: true,
      data: {
        userId: userId,
        userEmail: user?.user_email || "Email not found", // ✅ 3. ADD EMAIL TO RESPONSE
        planExpirationDate: planExpirationDate,
        planToken: planTokens,
        boosterToken: Number(boosterTokens),
        totalToken: totalTokens
      }
    });

  } catch (error) {
    console.error("Error fetching token details:", error);
    return res.status(500).json({ success: false, error: "Internal Server Error" });
  }
}