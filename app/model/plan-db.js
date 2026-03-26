import { docClient } from "./dynamodb";
import { ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const PLANS_TABLE = "Plans";

// 1. RESTORED: Get All Plans
export async function getAllPlans() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: PLANS_TABLE }));
    return (result.Items || []).sort((a, b) => a.amount - b.amount);
  } catch (error) {
    console.error("Get All Plans Error:", error);
    return [];
  }
}

// 2. RESTORED: Get Plan By ID (This fixes the NextAuth crash!)
export async function getPlanById(planId) {
  try {
    const { Item } = await docClient.send(new GetCommand({
      TableName: PLANS_TABLE,
      Key: { plan_id: planId }
    }));
    return Item;
  } catch (error) { return null; }
}

// 3. UPDATED: Create Plan (With Gateway IDs)
export async function createPlan(planData) {
  const planId = uuidv4();
  
  const safeAmountMrpInr = isNaN(Number(planData.amount_mrp)) ? 0 : Number(planData.amount_mrp);
  const safeAmountInr = isNaN(Number(planData.amount)) ? 0 : Number(planData.amount);
  const safeAmountMrpUsd = isNaN(Number(planData.amount_mrp_usd)) ? 0 : Number(planData.amount_mrp_usd);
  const safeAmountUsd = isNaN(Number(planData.amount_usd)) ? 0 : Number(planData.amount_usd);
  const safeGrace = isNaN(Number(planData.grace_period)) ? 7 : Number(planData.grace_period);
  const safeDiscount = isNaN(Number(planData.yearly_discount)) ? 20 : Number(planData.yearly_discount);

  const newPlan = {
    plan_id: planId,
    plan_name: planData.name || "Unnamed Plan",
    amount_mrp: safeAmountMrpInr,
    amount: safeAmountInr,
    amount_mrp_usd: safeAmountMrpUsd,
    amount_usd: safeAmountUsd, 
    allowed_billing_cycles: ["monthly", "yearly"], 
    yearly_discount: safeDiscount, 
    grace_period: safeGrace,
    status: "active",
    // Gateway IDs for Path A Subscriptions
    stripe_monthly_id: planData.stripe_monthly_id || "",
    stripe_yearly_id: planData.stripe_yearly_id || "",
    razorpay_monthly_id: planData.razorpay_monthly_id || "",
    razorpay_yearly_id: planData.razorpay_yearly_id || "",
    system_features: planData.system_features || {}, 
    display_features: planData.display_features || [] 
  };

  try {
    await docClient.send(new PutCommand({ TableName: PLANS_TABLE, Item: newPlan }));
    return { success: true, planId };
  } catch (error) { return { success: false, error: error.message }; }
}

// 4. UPDATED: Update Plan (With Gateway IDs)
export async function updatePlan(planId, data) {
  const safeAmountMrpInr = isNaN(Number(data.amount_mrp)) ? 0 : Number(data.amount_mrp);
  const safeAmountInr = isNaN(Number(data.amount)) ? 0 : Number(data.amount);
  const safeAmountMrpUsd = isNaN(Number(data.amount_mrp_usd)) ? 0 : Number(data.amount_mrp_usd);
  const safeAmountUsd = isNaN(Number(data.amount_usd)) ? 0 : Number(data.amount_usd);
  const safeGrace = isNaN(Number(data.grace_period)) ? 7 : Number(data.grace_period);
  const safeDiscount = isNaN(Number(data.yearly_discount)) ? 20 : Number(data.yearly_discount);

  try {
    await docClient.send(new UpdateCommand({
      TableName: PLANS_TABLE,
      Key: { plan_id: planId },
      UpdateExpression: "set plan_name = :n, amount_mrp = :am, amount = :a, amount_mrp_usd = :amu, amount_usd = :u, allowed_billing_cycles = :abc, yearly_discount = :yd, grace_period = :g, stripe_monthly_id = :sm, stripe_yearly_id = :sy, razorpay_monthly_id = :rm, razorpay_yearly_id = :ry, system_features = :sf, display_features = :df",
      ExpressionAttributeValues: {
        ":n": data.name || "Unnamed Plan",
        ":am": safeAmountMrpInr,
        ":a": safeAmountInr,
        ":amu": safeAmountMrpUsd,
        ":u": safeAmountUsd,
        ":abc": ["monthly", "yearly"],
        ":yd": safeDiscount, 
        ":g": safeGrace, 
        ":sm": data.stripe_monthly_id || "",
        ":sy": data.stripe_yearly_id || "",
        ":rm": data.razorpay_monthly_id || "",
        ":ry": data.razorpay_yearly_id || "",
        ":sf": data.system_features || {},
        ":df": data.display_features || []
      },
      ReturnValues: "UPDATED_NEW"
    }));
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}

// 5. RESTORED: Toggle Status
export async function togglePlanStatus(planId, status) {
  try {
    await docClient.send(new UpdateCommand({
      TableName: PLANS_TABLE,
      Key: { plan_id: planId },
      UpdateExpression: "set #s = :st",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":st": status },
      ReturnValues: "UPDATED_NEW"
    }));
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}
// import { docClient } from "./dynamodb";
// import { ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
// import { v4 as uuidv4 } from 'uuid';

// const PLANS_TABLE = "Plans";

// export async function getAllPlans() {
//   try {
//     const result = await docClient.send(new ScanCommand({ TableName: PLANS_TABLE }));
//     return (result.Items || []).sort((a, b) => a.amount - b.amount);
//   } catch (error) {
//     console.error("Get All Plans Error:", error);
//     return [];
//   }
// }

// export async function getPlanById(planId) {
//   try {
//     const { Item } = await docClient.send(new GetCommand({
//       TableName: PLANS_TABLE,
//       Key: { plan_id: planId }
//     }));
//     return Item;
//   } catch (error) { return null; }
// }

// export async function createPlan(planData) {
//   const planId = uuidv4();
  
//   const safeAmountMrpInr = isNaN(Number(planData.amount_mrp)) ? 0 : Number(planData.amount_mrp);
//   const safeAmountInr = isNaN(Number(planData.amount)) ? 0 : Number(planData.amount);
//   const safeAmountMrpUsd = isNaN(Number(planData.amount_mrp_usd)) ? 0 : Number(planData.amount_mrp_usd);
//   const safeAmountUsd = isNaN(Number(planData.amount_usd)) ? 0 : Number(planData.amount_usd);
//   const safeDuration = isNaN(Number(planData.duration)) ? 30 : Number(planData.duration);
//   const safeGrace = isNaN(Number(planData.grace_period)) ? 7 : Number(planData.grace_period);
//   const safeDiscount = isNaN(Number(planData.yearly_discount)) ? 20 : Number(planData.yearly_discount);

//   const newPlan = {
//     plan_id: planId,
//     plan_name: planData.name || "Unnamed Plan",
//     amount_mrp: safeAmountMrpInr,
//     amount: safeAmountInr,
//     amount_mrp_usd: safeAmountMrpUsd,
//     amount_usd: safeAmountUsd, 
//     allowed_billing_cycles: planData.allowed_billing_cycles || ["monthly", "yearly"], 
//     yearly_discount: safeDiscount, // NEW!
//     duration: safeDuration, 
//     grace_period: safeGrace,
//     status: "active",
//     system_features: planData.system_features || {}, 
//     display_features: planData.display_features || [] 
//   };

//   try {
//     await docClient.send(new PutCommand({ TableName: PLANS_TABLE, Item: newPlan }));
//     return { success: true, planId };
//   } catch (error) { return { success: false, error: error.message }; }
// }

// export async function updatePlan(planId, data) {
//   const safeAmountMrpInr = isNaN(Number(data.amount_mrp)) ? 0 : Number(data.amount_mrp);
//   const safeAmountInr = isNaN(Number(data.amount)) ? 0 : Number(data.amount);
//   const safeAmountMrpUsd = isNaN(Number(data.amount_mrp_usd)) ? 0 : Number(data.amount_mrp_usd);
//   const safeAmountUsd = isNaN(Number(data.amount_usd)) ? 0 : Number(data.amount_usd);
//   const safeDuration = isNaN(Number(data.duration)) ? 30 : Number(data.duration);
//   const safeGrace = isNaN(Number(data.grace_period)) ? 7 : Number(data.grace_period);
//   const safeDiscount = isNaN(Number(data.yearly_discount)) ? 20 : Number(data.yearly_discount);

//   try {
//     await docClient.send(new UpdateCommand({
//       TableName: PLANS_TABLE,
//       Key: { plan_id: planId },
//       UpdateExpression: "set plan_name = :n, amount_mrp = :am, amount = :a, amount_mrp_usd = :amu, amount_usd = :u, allowed_billing_cycles = :abc, yearly_discount = :yd, #d = :d, grace_period = :g, system_features = :sf, display_features = :df",
//       ExpressionAttributeNames: { "#d": "duration" },
//       ExpressionAttributeValues: {
//         ":n": data.name || "Unnamed Plan",
//         ":am": safeAmountMrpInr,
//         ":a": safeAmountInr,
//         ":amu": safeAmountMrpUsd,
//         ":u": safeAmountUsd,
//         ":abc": data.allowed_billing_cycles || ["monthly", "yearly"],
//         ":yd": safeDiscount, // NEW!
//         ":d": safeDuration,
//         ":g": safeGrace, 
//         ":sf": data.system_features || {},
//         ":df": data.display_features || []
//       },
//       ReturnValues: "UPDATED_NEW"
//     }));
//     return { success: true };
//   } catch (error) { return { success: false, error: error.message }; }
// }

// export async function togglePlanStatus(planId, status) {
//   try {
//     await docClient.send(new UpdateCommand({
//       TableName: PLANS_TABLE,
//       Key: { plan_id: planId },
//       UpdateExpression: "set #s = :st",
//       ExpressionAttributeNames: { "#s": "status" },
//       ExpressionAttributeValues: { ":st": status },
//       ReturnValues: "UPDATED_NEW"
//     }));
//     return { success: true };
//   } catch (error) { return { success: false, error: error.message }; }
// }