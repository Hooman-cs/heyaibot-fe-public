import { docClient } from "./dynamodb";
import { ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const PLANS_TABLE = "Plans";

// 1. VIEW ALL PLANS
export async function getAllPlans() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: PLANS_TABLE }));
    // Sort by price (optional, but helpful)
    return (result.Items || []).sort((a, b) => a.amount - b.amount);
  } catch (error) {
    console.error("Get All Plans Error:", error);
    return [];
  }
}

// 2. GET SINGLE PLAN
export async function getPlanById(planId) {
  try {
    const { Item } = await docClient.send(new GetCommand({
      TableName: PLANS_TABLE,
      Key: { plan_id: planId }
    }));
    return Item;
  } catch (error) {
    console.error("Get Plan Error:", error);
    return null;
  }
}

// 3. CREATE PLAN (Now includes features object)
export async function createPlan(planData) {
  const planId = uuidv4();
  
  const newPlan = {
    plan_id: planId,
    plan_name: planData.name,
    amount: Number(planData.amount),
    duration: Number(planData.duration) || 30, // Default 30 days
    
    // ✅ NEW: Store features directly as an object { "Max Bots": "3", "Storage": "1GB" }
    features: planData.features || {}, 
    
    status: "active", // Default status
    createdAt: new Date().toISOString(),
  };

  try {
    await docClient.send(new PutCommand({
      TableName: PLANS_TABLE,
      Item: newPlan
    }));
    return { success: true, planId };
  } catch (error) {
    console.error("Create Plan Error:", error);
    return { success: false, error: error.message };
  }
}

// 4. UPDATE PLAN (Full Update: Name, Price, Features)
export async function updatePlan(planId, data) {
  try {
    await docClient.send(new UpdateCommand({
      TableName: PLANS_TABLE,
      Key: { plan_id: planId },
      // 1. Use alias #d instead of 'duration'
      UpdateExpression: "set plan_name = :n, amount = :a, #d = :d, features = :f", 
      
      // 2. Define what #d means
      ExpressionAttributeNames: {
        "#d": "duration" 
      },
      
      ExpressionAttributeValues: {
        ":n": data.name,
        ":a": Number(data.amount),
        ":d": Number(data.duration) || 30,
        ":f": data.features || {} 
      },
      ReturnValues: "UPDATED_NEW"
    }));
    return { success: true };
  } catch (error) {
    console.error("Update Plan Error:", error);
    return { success: false, error: error.message };
  }
}

// export async function updatePlan(planId, data) {
//   try {
//     await docClient.send(new UpdateCommand({
//       TableName: PLANS_TABLE,
//       Key: { plan_id: planId },
//       UpdateExpression: "set plan_name = :n, amount = :a, duration = :d, features = :f",
//       ExpressionAttributeValues: {
//         ":n": data.name,
//         ":a": Number(data.amount),
//         ":d": Number(data.duration) || 30,
//         ":f": data.features || {} 
//       },
//       ReturnValues: "UPDATED_NEW"
//     }));
//     return { success: true };
//   } catch (error) {
//     console.error("Update Plan Error:", error);
//     return { success: false, error: error.message };
//   }
// }


// 5. ENABLE / DISABLE PLAN (Soft Delete)
export async function togglePlanStatus(planId, status) {
  // status should be "active" or "inactive"
  try {
    await docClient.send(new UpdateCommand({
      TableName: PLANS_TABLE,
      Key: { plan_id: planId },
      UpdateExpression: "set #s = :st",
      ExpressionAttributeNames: { "#s": "status" }, // 'status' is a reserved word in DynamoDB
      ExpressionAttributeValues: {
        ":st": status 
      },
      ReturnValues: "UPDATED_NEW"
    }));
    return { success: true };
  } catch (error) {
    console.error("Toggle Plan Status Error:", error);
    return { success: false, error: error.message };
  }
}