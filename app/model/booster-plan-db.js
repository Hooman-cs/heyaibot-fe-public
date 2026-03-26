import { docClient } from "./dynamodb";
import { ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const BOOSTER_PLANS_TABLE = "BoosterPlans";

export async function getAllBoosterPlans() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: BOOSTER_PLANS_TABLE }));
    return (result.Items || []).sort((a, b) => a.amount - b.amount);
  } catch (error) {
    console.error("Get Booster Plans Error:", error);
    return [];
  }
}

export async function getBoosterPlanById(boosterId) {
  try {
    const { Item } = await docClient.send(new GetCommand({
      TableName: BOOSTER_PLANS_TABLE,
      Key: { booster_id: boosterId }
    }));
    return Item;
  } catch (error) { return null; }
}

export async function createBoosterPlan(data) {
  const boosterId = uuidv4();
  
  const newPlan = {
    booster_id: boosterId,
    name: data.name || "Token Booster",
    token_amount: isNaN(Number(data.token_amount)) ? 0 : Number(data.token_amount),
    amount: isNaN(Number(data.amount)) ? 0 : Number(data.amount), // INR
    amount_usd: isNaN(Number(data.amount_usd)) ? 0 : Number(data.amount_usd), // USD
    status: "active"
  };

  try {
    await docClient.send(new PutCommand({ TableName: BOOSTER_PLANS_TABLE, Item: newPlan }));
    return { success: true, boosterId };
  } catch (error) { return { success: false, error: error.message }; }
}

export async function updateBoosterPlan(boosterId, data) {
  try {
    await docClient.send(new UpdateCommand({
      TableName: BOOSTER_PLANS_TABLE,
      Key: { booster_id: boosterId },
      UpdateExpression: "set #n = :n, token_amount = :ta, amount = :a, amount_usd = :u",
      ExpressionAttributeNames: { "#n": "name" },
      ExpressionAttributeValues: {
        ":n": data.name,
        ":ta": Number(data.token_amount) || 0,
        ":a": Number(data.amount) || 0,
        ":u": Number(data.amount_usd) || 0,
      },
      ReturnValues: "UPDATED_NEW"
    }));
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}

export async function toggleBoosterStatus(boosterId, status) {
  try {
    await docClient.send(new UpdateCommand({
      TableName: BOOSTER_PLANS_TABLE,
      Key: { booster_id: boosterId },
      UpdateExpression: "set #s = :st",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":st": status },
      ReturnValues: "UPDATED_NEW"
    }));
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}