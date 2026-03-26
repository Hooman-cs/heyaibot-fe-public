import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { getUserSubscription } from "../../../app/model/subscription-db";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const sub = await getUserSubscription(session.user.id);

  // FIX: Map the new system_features back to the old snapshot_features 
  // so your max-bot and dashboard scripts continue working seamlessly!
  if (sub) {
    sub.snapshot_features = sub.snapshot_system_features || sub.snapshot_features || {};
  }
  
  return res.status(200).json({ subscription: sub });
}