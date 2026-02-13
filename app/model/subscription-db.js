import { docClient } from "./dynamodb";
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
    snapshot_features: data.features || {} 
  };

  try {
    await docClient.send(new PutCommand({
      TableName: SUBS_TABLE,
      Item: item
    }));
    // FIX: Return an object with 'success: true'
    return { success: true, item }; 
  } catch (error) {
    console.error("Create Subscription Error:", error);
    // FIX: Return error info so verify.js can handle it
    return { success: false, error: error.message }; 
  }
}

export async function getUserSubscription(userId) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: SUBS_TABLE,
      IndexName: "UserIndex", // Ensure this GSI exists in DynamoDB
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }));
    
    const subs = result.Items || [];
    if (subs.length === 0) return null;

    // Sort by start_date descending (newest first)
    subs.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));

    const latestSub = subs[0];

    // Simple expiration check
    if (latestSub.status === 'active' && new Date(latestSub.expire_date) < new Date()) {
      latestSub.status = 'expired'; 
    }

    return latestSub;
  } catch (error) {
    console.error("Get Subscription Error:", error);
    return null;
  }
}

// NEW FUNCTION: Get All Subscriptions (For Admin)
export async function getAllSubscriptions() {
  try {
    // Scan returns all items in the table
    const result = await docClient.send(new ScanCommand({
      TableName: SUBS_TABLE
    }));
    
    // Sort by date (newest first)
    return (result.Items || []).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  } catch (error) {
    console.error("Get All Subscriptions Error:", error);
    return [];
  }
}