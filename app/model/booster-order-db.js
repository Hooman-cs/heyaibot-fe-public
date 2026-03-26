import { docClient } from "./dynamodb";
import { PutCommand, QueryCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";

const BOOSTER_ORDERS_TABLE = "BoosterOrders";

export async function createBoosterOrder(data) {
  const item = {
    order_id: data.paymentId, // We use the Stripe/Razorpay payment ID as the unique key
    user_id: data.userId,         
    booster_id: data.boosterId,
    amount_paid: data.amount,
    currency: data.currency,
    tokens_added: data.tokensAdded,
    gateway: data.gateway,
    purchase_date: new Date().toISOString()
  };

  try {
    await docClient.send(new PutCommand({ TableName: BOOSTER_ORDERS_TABLE, Item: item }));
    return { success: true };
  } catch (error) {
    console.error("Create Booster Order Error:", error);
    return { success: false, error: error.message };
  }
}

export async function getUserBoosterOrders(userId) {
  try {
    const result = await docClient.send(new QueryCommand({
      TableName: BOOSTER_ORDERS_TABLE,
      IndexName: "UserIndex", // Make sure to create a GSI on user_id in DynamoDB!
      KeyConditionExpression: "user_id = :uid",
      ExpressionAttributeValues: { ":uid": userId },
    }));
    
    const orders = result.Items || [];
    return orders.sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
  } catch (error) { return []; }
}

export async function getAllBoosterOrders() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: BOOSTER_ORDERS_TABLE }));
    return (result.Items || []).sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date));
  } catch (error) { return []; }
}