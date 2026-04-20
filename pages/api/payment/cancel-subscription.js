// pages/api/payment/cancel-subscription.js
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { getSubscriptionByOrderId } from '../../../app/model/subscription-db'; 
import { docClient } from '../../../app/model/dynamodb'; 
import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

  // 1. Authenticate user
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ message: 'Unauthorized' });

  try {
    const { subscriptionId } = req.body; 
    if (!subscriptionId) return res.status(400).json({ message: 'Missing subscription ID' });

    // 2. Fetch the subscription from your DB
    const dbSub = await getSubscriptionByOrderId(subscriptionId);
    if (!dbSub) return res.status(404).json({ message: "Subscription not found" });

    // Security check: ensure user is cancelling their own subscription
    // FIX #06: Cleaned up email/ID comparison
    if (dbSub.user_id !== session.user.id && dbSub.user_id !== session.user.email) {
       return res.status(403).json({ message: "Forbidden" });
    }

    // FIX #03 part A: Gateway Fallback
    // Auto-renewed DB rows sometimes drop the gateway field. Infer safely from currency.
    let gateway = dbSub.gateway?.toLowerCase();
    if (!gateway) {
        gateway = dbSub.currency === 'USD' ? 'stripe' : 'razorpay';
    }

    // 3. Cancel securely at the period end via gateways
    if (gateway === 'stripe') {
       await stripe.subscriptions.update(dbSub.order_id, {
          cancel_at_period_end: true,
       });
    } else if (gateway === 'razorpay') {
       // FIX #03 part B: Razorpay Node SDK expects a boolean for cancelAtCycleEnd, not an object.
       await razorpay.subscriptions.cancel(dbSub.order_id, true); 
    } else {
       return res.status(400).json({ message: 'Invalid gateway recorded' });
    }

    // 4. Update DynamoDB flag so the UI hides the button
    await docClient.send(new UpdateCommand({
      TableName: "Subscriptions", 
      Key: { payment_id: dbSub.payment_id },
      UpdateExpression: "set cancel_at_period_end = :c",
      ExpressionAttributeValues: { ":c": true }
    }));

    return res.status(200).json({ message: 'Subscription scheduled to cancel.' });

  } catch (error) {
    console.error('Cancellation Error:', error);
    // Return 500 instead of crashing if the gateway throws an error
    return res.status(500).json({ message: 'Failed to cancel', error: error.message });
  }
}
// // pages/api/payment/cancel-subscription.js
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../auth/[...nextauth]";
// import Stripe from 'stripe';
// import Razorpay from 'razorpay';
// // import { getSubscriptionByOrderId, docClient } from '../../../app/model/subscription-db';
// import { getSubscriptionByOrderId } from '../../../app/model/subscription-db'; 
// import { docClient } from '../../../app/model/dynamodb'; 
// import { UpdateCommand } from "@aws-sdk/lib-dynamodb";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
// const razorpay = new Razorpay({
//   key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//   key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// export default async function handler(req, res) {
//   if (req.method !== 'POST') return res.status(405).json({ message: 'Method Not Allowed' });

//   // 1. Authenticate user
//   const session = await getServerSession(req, res, authOptions);
//   if (!session) return res.status(401).json({ message: 'Unauthorized' });

//   try {
//     const { subscriptionId } = req.body; 
//     if (!subscriptionId) return res.status(400).json({ message: 'Missing subscription ID' });

//     // 2. Fetch the subscription from your DB
//     const dbSub = await getSubscriptionByOrderId(subscriptionId);
//     if (!dbSub) return res.status(404).json({ message: "Subscription not found" });

//     // Security check: ensure user is cancelling their own subscription
//     if (dbSub.user_id !== session.user.email && dbSub.user_id !== session.user.id) {
//        return res.status(403).json({ message: "Forbidden" });
//     }

//     const gateway = dbSub.gateway?.toLowerCase();

//     // 3. Cancel securely at the period end via gateways
//     if (gateway === 'stripe') {
//        await stripe.subscriptions.update(dbSub.order_id, {
//           cancel_at_period_end: true,
//        });
//     } else if (gateway === 'razorpay') {
//        await razorpay.subscriptions.cancel(dbSub.order_id, {
//           cancel_at_cycle_end: 1 // Cancels at the end of the current billing cycle
//        });
//     } else {
//        return res.status(400).json({ message: 'Invalid gateway recorded' });
//     }

//     // 4. Update DynamoDB flag so the UI hides the button
//     await docClient.send(new UpdateCommand({
//       TableName: "Subscriptions", 
//       Key: { payment_id: dbSub.payment_id },
//       UpdateExpression: "set cancel_at_period_end = :c",
//       ExpressionAttributeValues: { ":c": true }
//     }));

//     return res.status(200).json({ message: 'Subscription scheduled to cancel.' });

//   } catch (error) {
//     console.error('Cancellation Error:', error);
//     return res.status(500).json({ message: 'Failed to cancel', error: error.message });
//   }
// }