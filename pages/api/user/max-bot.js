import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { getUserSubscription } from "../../../app/model/subscription-db";

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // Fetch the latest subscription
    const sub = await getUserSubscription(session.user.id);

    // If the user has never subscribed
    if (!sub) {
      return res.status(200).json({ maxBot: 0, expireDate: null });
    }

    // 1. Extract "Max Bots" from features snapshot
    const features = sub.snapshot_features || {};
    // Regex matches "Bot", "Bots", "Max Bots", "Chatbots", etc.
    const botKey = Object.keys(features).find(k => /bot?/i.test(k));
    
    let maxBot = 0;
    if (botKey) {
      maxBot = parseInt(features[botKey]);
      if (isNaN(maxBot)) maxBot = 0;
    }

    // 2. Handle Expired Status
    // We return maxBot: 0 to block access, but still send the expireDate for UI display.
    if (sub.status === "Expired") {
      return res.status(200).json({ 
        maxBot: 0, 
        expireDate: sub.expire_date 
      });
    }

    // 3. Handle Active / Action Required / Grace Period
    return res.status(200).json({ 
      maxBot: maxBot, 
      expireDate: sub.expire_date 
    });

  } catch (error) {
    console.error("Max Bot API Error:", error);
    return res.status(500).json({ error: "Internal Server Error", maxBot: 0 });
  }
}

