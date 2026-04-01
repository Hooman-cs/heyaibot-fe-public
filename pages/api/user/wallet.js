import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { getWalletBalance, deductTokensFromWallet } from "../../../app/model/token-wallet-db";

export default async function handler(req, res) {
  
  // =================================================================
  // 1. GET: Fetch Wallet Balance (Used by your Next.js Frontend)
  // =================================================================
  if (req.method === 'GET') {
    try {
      const session = await getServerSession(req, res, authOptions);
      if (!session) return res.status(401).json({ error: "Unauthorized" });

      const balance = await getWalletBalance(session.user.id);
      
      return res.status(200).json({ balance });
    } catch (error) {
      console.error("Wallet Fetch Error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  // =================================================================
  // 2. POST: Deduct Tokens (Used by the Chatbot Backend Developer)
  // =================================================================
  if (req.method === 'POST') {
    try {
      // SECURITY CHECK: Ensure this request is coming from your trusted Chatbot Backend
      const authHeader = req.headers.authorization;
      if (authHeader !== `Bearer ${process.env.CHATBOT_BACKEND_SECRET}`) {
         return res.status(401).json({ error: "Unauthorized. Invalid API Secret." });
      }

      const { userId, tokensUsed } = req.body;

      if (!userId || tokensUsed === undefined) {
        return res.status(400).json({ error: "Missing userId or tokensUsed in request body" });
      }

      // Call the deduction function from your database model
      const result = await deductTokensFromWallet(userId, tokensUsed);

      if (!result.success) {
        // This will trigger if the database ConditionExpression fails (e.g., wallet goes below 0)
        return res.status(400).json({ error: "Insufficient token balance or database error" });
      }

      return res.status(200).json({ success: true, message: "Tokens deducted successfully" });
      
    } catch (error) {
      console.error("Wallet Deduct Error:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}

// import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]";
// import { getWalletBalance } from "../../../app/model/token-wallet-db";

// export default async function handler(req, res) {
//   if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

//   try {
//     const session = await getServerSession(req, res, authOptions);
//     if (!session) return res.status(401).json({ error: "Unauthorized" });

//     // Fetch the balance from the TokenWallets table
//     const balance = await getWalletBalance(session.user.id);
    
//     return res.status(200).json({ balance });
//   } catch (error) {
//     console.error("Wallet Fetch Error:", error);
//     return res.status(500).json({ error: "Internal Server Error" });
//   }
// }