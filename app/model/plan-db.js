import { docClient } from "./dynamodb";
import { ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const PLANS_TABLE = "Plans";

export async function getAllPlans() {
  const result = await docClient.send(new ScanCommand({ TableName: PLANS_TABLE }));
  return result.Items || [];
}

export async function getPlanById(planId) {
  const result = await docClient.send(new GetCommand({
    TableName: PLANS_TABLE,
    Key: { plan_id: planId }
  }));
  return result.Item;
}

export async function createPlan(planData) {
  const planId = uuidv4();
  const newPlan = {
    plan_id: planId,
    plan_name: planData.name,
    amount: Number(planData.amount),
    // NEW: Duration in days (Default to 30 if not provided)
    duration: Number(planData.duration) || 30,
    status: "active", // Default
    createdAt: new Date().toISOString(),
    // Note: Features are NOT stored here anymore. They are in SaaSFeatures.
  };

  await docClient.send(new PutCommand({
    TableName: PLANS_TABLE,
    Item: newPlan
  }));
  return newPlan;
}

export async function updatePlanStatus(planId, status) {
  await docClient.send(new UpdateCommand({
    TableName: PLANS_TABLE,
    Key: { plan_id: planId },
    UpdateExpression: "set #s = :status",
    ExpressionAttributeNames: { "#s": "status" },
    ExpressionAttributeValues: { ":status": status }
  }));
}




// import { docClient } from "./dynamodb";
// import { ScanCommand, PutCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

// const TABLE_NAME = "SaaSPlans";

// export async function getAllPlans() {
//   const result = await docClient.send(new ScanCommand({ TableName: TABLE_NAME }));
//   // Sort by price usually makes sense
//   return result.Items.sort((a, b) => a.price - b.price);
// }

// // NEW: Get single plan
// export async function getPlanById(id) {
//   const result = await docClient.send(new GetCommand({
//     TableName: TABLE_NAME,
//     Key: { id }
//   }));
//   return result.Item;
// }

// export async function createPlan(plan) {
//   await docClient.send(new PutCommand({
//     TableName: TABLE_NAME,
//     Item: plan
//   }));
//   return plan;
// }

// export async function deletePlan(id) {
//   await docClient.send(new DeleteCommand({
//     TableName: TABLE_NAME,
//     Key: { id }
//   }));
// }