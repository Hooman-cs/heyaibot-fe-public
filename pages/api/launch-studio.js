import { getToken } from "next-auth/jwt"; // Import this
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // 1. Try getting the token directly (Bypasses complex session callbacks)
    const tokenData = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });

    // Debugging Logs
    console.log("1. Launch Studio hit");
    console.log("2. Token Found:", tokenData ? "YES" : "NO");

    if (!tokenData) {
      console.log("3. Debug: No Token. Cookies:", req.headers.cookie);
      // Redirect to login if absolutely no token found
      res.redirect("/login?error=SessionMissing");
      return;
    }

    // 3. Dummy Payload
  const payload = JSON.stringify({
    userId: 'e6fc9edf-981a-4fe4-95a9-778f8d8dd217',
    planId: 'e6fc6edf-981c-4fe8-85a9-778f8d8ad217',
    plan: true,
    maxBot: 3,
  });

    // 4. Sign
    const secret = process.env.NEXTAUTH_SECRET;
    const tokenString = Buffer.from(payload).toString('base64');
    const signature = crypto.createHmac("sha256", secret).update(tokenString).digest("hex");

    // 5. Redirect
    res.redirect(`/AdminPanel?token=${tokenString}&sig=${signature}`);

  } catch (error) {
    console.error("Launch Studio Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}


// import { getServerSession } from "next-auth";
// import { authOptions } from "./auth/[...nextauth]";
// import crypto from "crypto";

// export default async function handler(req, res) {
//   // 1. Check for GET method (Pages Router way)
//   if (req.method !== 'GET') {
//     return res.status(405).end();
//   }

//   // 2. Get Session
//   const session = await getServerSession(req, res, authOptions);

//   if (!session) {
//     return res.redirect("/login");
//   }

//   // // 3. Create Dummy Payload
//   // const payload = JSON.stringify({
//   //   user_id: session.user.id,
//   //   email: session.user.email,
//   //   name: session.user.name,
//   //   plan_id: "plan_premium_test",
//   //   payment_id: "pay_mock_123456",
//   //   status: "active",
//   //   maxBot: 3, 
//   //   timestamp: Date.now()
//   // });

//   // 3. Dummy Payload
// //   const payload = JSON.stringify({
// //     userId: 'e6fc9edf-981a-4fe4-95a9-778f8d8dd217',
// //     planId: 'e6fc6edf-981c-4fe8-85a9-778f8d8ad217',
// //     plan: true,
// //     maxBot: 3,
// //   });

//   // 4. Sign the Token
//   const secret = process.env.NEXTAUTH_SECRET;
//   const token = Buffer.from(payload).toString('base64');
//   const signature = crypto.createHmac("sha256", secret).update(token).digest("hex");

//   // 5. Redirect to Local Admin Panel
//   res.redirect(`/AdminPanel?token=${token}&sig=${signature}`);
// }



// import { NextResponse } from "next/server";
// // import { getServerSession } from "next-auth";
// import { getServerSession } from "next-auth/next";

// import { authOptions } from "../api/auth/[...nextauth]";
// import { getUserSubscription } from "../../app/model/subscription-db";
// import crypto from "crypto";

// export async function GET(req) {
//   const session = await getServerSession(authOptions);
//   if (!session) return NextResponse.redirect(new URL("/", req.url));

//   // 1. Get Subscription (Checks expiration internally)
//   const sub = await getUserSubscription(session.user.id);

//   // 2. Check Validity
//   if (!sub || sub.status !== 'active') {
//     // Redirect to pricing if no active sub
//     return NextResponse.redirect(new URL("/pricing", req.url));
//   }

//   // // 3. Create Payload
//   // const payload = JSON.stringify({
//   //   userId: session.user.id,
//   //   userEmail: session.user.email,
//   //   isSuperAdmin: session.user.isSuperAdmin,
//   //   planId: sub.plan_id,
//   //   subscriptionId: sub.payment_id, // Chatbot uses this to fetch snapshot limits
//   //   ts: Date.now()
//   // });
  
//   // 3. Create Payload
//   const payload = JSON.stringify({
//     userId: 'e6fc9edf-981a-4fe4-95a9-778f8d8dd217',
//     planId: 'e6fc6edf-981c-4fe8-85a9-778f8d8ad217',
//     plan: true,
//     maxBot: 3,
//   });

//   // 4. Sign & Redirect
//   const secret = process.env.NEXTAUTH_SECRET;
//   const token = Buffer.from(payload).toString('base64');
//   const signature = crypto.createHmac("sha256", secret).update(token).digest("hex");

//   // Temporarily hardcode this to ensure it stays local
//   // const chatbotUrl = "/pages/AdminPanel.js"; 
//   // return NextResponse.redirect(`${chatbotUrl}/api/debug?token=${token}&sig=${signature}`);
//   res.redirect(`/AdminPanel?token=${token}&sig=${signature}`);
// }