import { docClient } from "./dynamodb";
import { PutCommand, QueryCommand, ScanCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

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
    currency: data.currency || "INR", 
    gateway: data.gateway || "Razorpay",
    billing_cycle: data.billing_cycle || "monthly", // NEW: Logs if they chose monthly/yearly
    scheduled_plan_id: null, // NEW: Used for downgrades
    prorated_credit: data.prorated_credit || 0, // NEW: Used for upgrades
    status: "Active", 
    start_date: new Date().toISOString(),
    expire_date: data.expireDate, 
    grace_expire_date: data.graceExpireDate, 
    discount: data.discount || 0,
    snapshot_system_features: data.system_features || {}, // NEW
    snapshot_display_features: data.display_features || [] // NEW
  };

  try {
    await docClient.send(new PutCommand({ TableName: SUBS_TABLE, Item: item }));
    return { success: true, item };
  } catch (error) {
    console.error("Create Sub Error:", error);
    return { success: false, error: error.message };
  }
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
    
    return computeStatus(subs[0]); 
  } catch (error) { return null; }
}

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
    return subs.map(computeStatus); 
  } catch (error) { return []; }
}

export async function getAllSubscriptions() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: SUBS_TABLE }));
    return (result.Items || []).map(computeStatus).sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
  } catch (error) { return []; }
}

// Used exclusively to schedule a downgrade for the NEXT billing cycle
export async function scheduleDowngrade(paymentId, nextPlanId, nextBillingCycle = "monthly") {
  try {
    await docClient.send(new UpdateCommand({
      TableName: SUBS_TABLE,
      Key: { payment_id: paymentId },
      UpdateExpression: "set scheduled_plan_id = :sp, scheduled_billing_cycle = :sbc",
      ExpressionAttributeValues: {
        ":sp": nextPlanId,
        ":sbc": nextBillingCycle
      },
      ReturnValues: "UPDATED_NEW"
    }));
    return { success: true };
  } catch (error) {
    console.error("Schedule Downgrade Error:", error);
    return { success: false, error: error.message };
  }
}

// NEW FUNCTION: Find a subscription by its Gateway Subscription ID (Saved in order_id)
export async function getSubscriptionByOrderId(orderId) {
  try {
    // We scan the table to find the matching subscription ID.
    // (Note: If your table gets massive, you can add a Global Secondary Index on order_id later for speed)
    const result = await docClient.send(new ScanCommand({ 
        TableName: SUBS_TABLE,
        FilterExpression: "order_id = :oid",
        ExpressionAttributeValues: { ":oid": orderId }
    }));
    
    // Return the most recent match
    if (result.Items && result.Items.length > 0) {
        result.Items.sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
        return result.Items[0];
    }
    return null;
  } catch (error) {
    console.error("Get Sub By Order ID Error:", error);
    return null;
  }
}

// ==========================================
// NEW: Shared Utility for Webhooks
// ==========================================
export async function markSubscriptionExpired(paymentId, userId) {
  try {
    // 1. Mark ledger as Expired
    await docClient.send(new UpdateCommand({
      TableName: "Subscriptions",
      Key: { payment_id: paymentId },
      UpdateExpression: "set #st = :exp",
      ExpressionAttributeNames: { "#st": "status" },
      ExpressionAttributeValues: { ":exp": "Expired" }
    }));

    // 2. Remove access from the user's main profile
    await updateUserPlan(userId, "none");
    
    return true;
  } catch (error) {
    console.error(`Failed to expire subscription for user ${userId}:`, error);
    return false;
  }
}