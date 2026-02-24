import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { getUserSubscription } from "../../../app/model/subscription-db";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const sub = await getUserSubscription(session.user.id);
  return res.status(200).json({ subscription: sub });
}