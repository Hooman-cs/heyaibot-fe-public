import { getServerSession } from "next-auth";
import { authOptions } from "./auth/[...nextauth]";
import crypto from "crypto";

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return res.redirect("/login");
  }

  // --- DUMMY PAYLOAD WITH HARDCODED VALUES ---
  const payload = JSON.stringify({
    user_id: session.user.id,       // Keep dynamic so the user is identified correctly
    email: session.user.email,      // Keep dynamic
    name: session.user.name,        // Keep dynamic
    
    // Hardcoded Subscription Data
    plan_id: "plan_premium_test",   
    payment_id: "pay_mock_123456",
    status: "active",               
    
    // Requested Field
    maxBot: 3,                      

    timestamp: Date.now()
  });

  const secret = process.env.NEXTAUTH_SECRET;
  const token = Buffer.from(payload).toString('base64');
  const signature = crypto.createHmac("sha256", secret).update(token).digest("hex");

  const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || "https://dashboard.heyaibot.com"; 
  
  // Redirect with the token
  res.redirect(`${chatbotUrl}/auth/sso?token=${token}&sig=${signature}`);
}

// new code
// // import { getServerSession } from "next-auth";
// import { authOptions } from "./auth/[...nextauth]"; // Check this path matches your file structure
// import crypto from "crypto";
// import { getUserSubscription } from "@/lib/subscription-db";

// export default async function handler(req, res) {
//   if (req.method !== 'GET') return res.status(405).end();

//   const session = await getServerSession(req, res, authOptions);

//   if (!session) {
//     return res.redirect("/login");
//   }

//   // 1. Fetch the latest subscription
//   // getUserSubscription should return the most recent active sub or null
//   const sub = await getUserSubscription(session.user.id);

//   // 2. Determine status
//   // If sub exists and expire_date is in future => active. 
//   // (Assuming getUserSubscription filters for 'active' status already, but safe to check date)
//   let status = "expired";
//   let planId = "none";
//   let paymentId = null;

//   if (sub && sub.status === 'active') {
//     const now = new Date();
//     const expiry = new Date(sub.expire_date);
//     if (expiry > now) {
//       status = "active";
//       planId = sub.plan_id;
//       paymentId = sub.payment_id;
//     }
//   }

//   // 3. Construct Payload
//   const payload = JSON.stringify({
//     user_id: session.user.id,
//     email: session.user.email,
//     plan_id: planId,          // "latest purchased plan_id"
//     payment_id: paymentId,    // "payment_id"
//     status: status,           // "active" or "expired"
//     timestamp: Date.now()
//   });

//   const secret = process.env.NEXTAUTH_SECRET;
//   const token = Buffer.from(payload).toString('base64');
//   const signature = crypto.createHmac("sha256", secret).update(token).digest("hex");

//   const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || "https://dashboard.heyaibot.com"; 
  
//   res.redirect(`${chatbotUrl}/auth/sso?token=${token}&sig=${signature}`);
// }







// old code
// import { getServerSession } from "next-auth";
// import { authOptions } from "../api/auth/[...nextauth]";
// import crypto from "crypto";

// export default async function handler(req, res) {
//   if (req.method !== 'GET') return res.status(405).end();

//   // Note: getServerSession requires (req, res, options) in Pages Router
//   const session = await getServerSession(req, res, authOptions);

//   if (!session) {
//     return res.redirect("/auth/login");
//   }

//   const payload = JSON.stringify({
//     userId: session.user.id,
//     email: session.user.email,
//     name: session.user.name,
//     plan: session.user.plan || "free",
//     timestamp: Date.now()
//   });

//   const secret = process.env.NEXTAUTH_SECRET;
//   const token = Buffer.from(payload).toString('base64');
//   const signature = crypto.createHmac("sha256", secret).update(token).digest("hex");

//   const chatbotUrl = process.env.NEXT_PUBLIC_CHATBOT_URL || "https://dashboard.heyaibot.com"; 
  
//   // Use res.redirect for server-side redirection
//   res.redirect(`${chatbotUrl}/auth/sso?token=${token}&sig=${signature}`);
// }