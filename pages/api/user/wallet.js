import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { getWalletBalance } from "../../../app/model/token-wallet-db";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) return res.status(401).json({ error: "Unauthorized" });

    // Fetch the balance from the TokenWallets table
    const balance = await getWalletBalance(session.user.id);
    
    return res.status(200).json({ balance });
  } catch (error) {
    console.error("Wallet Fetch Error:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}