import { docClient } from "./dynamodb";
// FIX: Removed UpdateCommand
import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const SUBS_TABLE = "Subscriptions";

export async function createSubscription(data) {
  const item = {
    payment_id: data.paymentId,   
    order_id: data.orderId,
    user_id: data.userId,         
    plan_id: data.planId,
    amount: data.amount,
    status: "active",
    start_date: new Date().toISOString(),
    expire_date: data.expireDate, 
    discount: 0,
    snapshot_features: data.features 
  };

  await docClient.send(new PutCommand({
    TableName: SUBS_TABLE,
    Item: item
  }));
  return item;
}

export async function getUserSubscription(userId) {
  const result = await docClient.send(new QueryCommand({
    TableName: SUBS_TABLE,
    IndexName: "UserIndex",
    KeyConditionExpression: "user_id = :uid",
    ExpressionAttributeValues: { ":uid": userId },
  }));
  
  const subs = result.Items || [];
  if (subs.length === 0) return null;

  // Sort by start_date descending (newest first)
  subs.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

  const latestSub = subs[0];

  // Simple expiration check (without DB update)
  if (latestSub.status === 'active' && new Date(latestSub.expire_date) < new Date()) {
    latestSub.status = 'expired'; 
  }

  return latestSub;
}

export async function getAllSubscriptions() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: SUBS_TABLE }));
    return (result.Items || []).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }
}
// import { docClient } from "./dynamodb";
// import { PutCommand, QueryCommand, UpdateCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

// const SUBS_TABLE = "Subscriptions";

// // Creates subscription AND saves the Snapshot
// export async function createSubscription(data) {
//   const item = {
//     payment_id: data.paymentId,   // PK
//     order_id: data.orderId,
//     user_id: data.userId,         // GSI
//     plan_id: data.planId,
//     amount: data.amount,
//     status: "active",
//     start_date: new Date().toISOString(),
//     expire_date: data.expireDate, 
//     discount: 0,
//     snapshot_features: data.features // <--- SNAPSHOT (Array of features)
//   };

//   await docClient.send(new PutCommand({
//     TableName: SUBS_TABLE,
//     Item: item
//   }));
//   return item;
// }

// export async function getUserSubscription(userId) {
//   // Finds the active subscription using GSI
//   const result = await docClient.send(new QueryCommand({
//     TableName: SUBS_TABLE,
//     IndexName: "UserIndex",
//     KeyConditionExpression: "user_id = :uid",
//     ExpressionAttributeValues: { ":uid": userId },
//   }));
  
//   const subs = result.Items || [];
//   // Return most recent active one
//   return subs.find(s => s.status === 'active') || null;
// }

// // NEW: Add this function for Admin Dashboard
// export async function getAllSubscriptions() {
//   try {
//     const result = await docClient.send(new ScanCommand({ TableName: SUBS_TABLE }));
//     // Sort by newest first
//     return (result.Items || []).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
//   } catch (error) {
//     console.error("Error fetching subscriptions:", error);
//     return [];
//   }
// }