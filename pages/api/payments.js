// import { NextResponse } from "next/server";
// import { getAllSubscriptions } from "../../app/model/subscription-db"; // <--- Changed from getAllPayments
// // import { getServerSession } from "next-auth";
// import { getServerSession } from "next-auth/next";

// import { authOptions } from "../api/auth/[...nextauth]"; 

// export async function GET() {
//   const session = await getServerSession(authOptions);
  
//   if (session?.user?.isSuperAdmin !== true) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
//   }

//   const payments = await getAllSubscriptions();
//   return NextResponse.json(payments);
// }



import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import { getAllSubscriptions } from "../../app/model/subscription-db"; 
import { getUserById } from "../../app/model/user-db"; 
import { getPlanById } from "../../app/model/plan-db"; 

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: "Method not allowed" });

  // 1. Security Check
  const session = await getServerSession(req, res, authOptions);
  
  if (!session || !session.user.isSuperAdmin) {
    return res.status(403).json({ error: "Unauthorized" });
  }

  try {
    // 2. Get Raw Subscriptions
    const rawSubs = await getAllSubscriptions();

    // 3. Enrich Data (Fetch User and Plan details for each subscription)
    const enrichedSubs = await Promise.all(rawSubs.map(async (sub) => {
      // Fetch details in parallel or sequentially (Parallel is faster)
      const [user, plan] = await Promise.all([
        getUserById(sub.user_id),
        getPlanById(sub.plan_id)
      ]);

      return {
        ...sub,
        user_name: user ? user.user_name : "Unknown User",
        user_email: user ? user.user_email : "Unknown Email",
        plan_name: plan ? plan.plan_name : `Plan ${sub.plan_id}`
      };
    }));

    return res.status(200).json(enrichedSubs);

  } catch (error) {
    console.error("Payments API Error:", error);
    return res.status(500).json({ error: "Failed to fetch payments" });
  }
}