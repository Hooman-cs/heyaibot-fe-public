// app/model/subscription-db.js
import { docClient } from "./dynamodb";
import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const SUBS_TABLE = "Subscriptions";

// Helper to calculate dynamic status
function computeStatus(sub) {
  if (!sub) return null;
  const now = new Date();
  const expire = new Date(sub.expire_date);
  const grace = new Date(sub.grace_expire_date || sub.expire_date);

  if (now < expire) sub.status = "Active";
  else if (now < grace) sub.status = "Action Required";
  else sub.status = "Expired";
  
  return sub;
}

export async function createSubscription(data) {
  const item = {
    payment_id: data.paymentId,   
    order_id: data.orderId,
    user_id: data.userId,         
    plan_id: data.planId,
    amount: data.amount,
    status: "Active", // Base status, dynamically computed later
    start_date: new Date().toISOString(),
    expire_date: data.expireDate, 
    grace_expire_date: data.graceExpireDate, // ADDED GRACE EXPIRATION
    discount: 0,
    snapshot_features: data.features || {} 
  };

  try {
    await docClient.send(new PutCommand({ TableName: SUBS_TABLE, Item: item }));
    return { success: true, item };
  } catch (error) { return { success: false, error: error.message }; }
}

export async function getUserSubscription(userId) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: SUBS_TABLE,
      IndexName: "UserIndex",
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }));
    const subs = result.Items || [];
    if (subs.length === 0) return null;
    subs.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    
    return computeStatus(subs[0]); // Return dynamic status
  } catch (error) { return null; }
}

// NEW: Fetch history for a specific user
export async function getUserSubscriptionHistory(userId) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: SUBS_TABLE,
      IndexName: "UserIndex",
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }));
    const subs = result.Items || [];
    subs.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return subs.map(computeStatus); // Compute status for all
  } catch (error) { return []; }
}

export async function getAllSubscriptions() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: SUBS_TABLE }));
    const subs = result.Items || [];
    subs.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
    return subs.map(computeStatus); // Compute status for all
  } catch (error) { return []; }
}