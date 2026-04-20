import { docClient } from "./dynamodb";
import { ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
import { v4 as uuidv4 } from 'uuid';

const PLANS_TABLE = "Plans";

// 1. Get All Plans
export async function getAllPlans() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: PLANS_TABLE }));
    return (result.Items || []).sort((a, b) => a.amount - b.amount);
  } catch (error) {
    console.error("Get All Plans Error:", error);
    return [];
  }
}

// 2. Get Plan By ID
export async function getPlanById(planId) {
  try {
    const { Item } = await docClient.send(new GetCommand({
      TableName: PLANS_TABLE,
      Key: { plan_id: planId }
    }));
    return Item;
  } catch (error) { return null; }
}

// 3. Create Plan (Explicit Yearly Pricing)
export async function createPlan(planData) {
  const planId = uuidv4();
  
  // INR PRICING
  const safeAmountMrpInr = isNaN(Number(planData.amount_mrp_inr || planData.amount_mrp)) ? 0 : Number(planData.amount_mrp_inr || planData.amount_mrp);
  const safeAmountInr = isNaN(Number(planData.amount_inr || planData.amount)) ? 0 : Number(planData.amount_inr || planData.amount); // Monthly INR
  const safeAmountYearlyInr = isNaN(Number(planData.amount_yearly_inr || planData.amount_yearly)) ? 0 : Number(planData.amount_yearly_inr || planData.amount_yearly); // Yearly INR
  
  // USD PRICING
  const safeAmountMrpUsd = isNaN(Number(planData.amount_mrp_usd)) ? 0 : Number(planData.amount_mrp_usd);
  const safeAmountUsd = isNaN(Number(planData.amount_usd)) ? 0 : Number(planData.amount_usd); // Monthly USD
  const safeAmountYearlyUsd = isNaN(Number(planData.amount_yearly_usd)) ? 0 : Number(planData.amount_yearly_usd); // Yearly USD
  
  const safeGrace = isNaN(Number(planData.grace_period)) ? 7 : Number(planData.grace_period);

  const newPlan = {
    plan_id: planId,
    plan_name: planData.name || "Unnamed Plan",
    
    // Explicit Pricing Fields
    amount_mrp: safeAmountMrpInr,
    amount: safeAmountInr,
    amount_yearly: safeAmountYearlyInr,
    
    amount_mrp_usd: safeAmountMrpUsd,
    amount_usd: safeAmountUsd, 
    amount_yearly_usd: safeAmountYearlyUsd,
    
    allowed_billing_cycles: ["monthly", "yearly"], 
    grace_period: safeGrace,
    status: "active",
    
    // Gateway IDs
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
  } catch (error) { 
    return { success: false, error: error.message }; 
  }
}

// 4. Update Plan
export async function updatePlan(planId, data) {
  // INR PRICING
  const safeAmountMrpInr = isNaN(Number(data.amount_mrp_inr || data.amount_mrp)) ? 0 : Number(data.amount_mrp_inr || data.amount_mrp);
  const safeAmountInr = isNaN(Number(data.amount_inr || data.amount)) ? 0 : Number(data.amount_inr || data.amount);
  const safeAmountYearlyInr = isNaN(Number(data.amount_yearly_inr || data.amount_yearly)) ? 0 : Number(data.amount_yearly_inr || data.amount_yearly);
  
  // USD PRICING
  const safeAmountMrpUsd = isNaN(Number(data.amount_mrp_usd)) ? 0 : Number(data.amount_mrp_usd);
  const safeAmountUsd = isNaN(Number(data.amount_usd)) ? 0 : Number(data.amount_usd);
  const safeAmountYearlyUsd = isNaN(Number(data.amount_yearly_usd)) ? 0 : Number(data.amount_yearly_usd);
  
  const safeGrace = isNaN(Number(data.grace_period)) ? 7 : Number(data.grace_period);

  try {
    await docClient.send(new UpdateCommand({
      TableName: PLANS_TABLE,
      Key: { plan_id: planId },
      UpdateExpression: "set plan_name = :n, amount_mrp = :am, amount = :a, amount_yearly = :ay, amount_mrp_usd = :amu, amount_usd = :u, amount_yearly_usd = :ayu, allowed_billing_cycles = :abc, grace_period = :g, stripe_monthly_id = :sm, stripe_yearly_id = :sy, razorpay_monthly_id = :rm, razorpay_yearly_id = :ry, system_features = :sf, display_features = :df",
      ExpressionAttributeValues: {
        ":n": data.name || "Unnamed Plan",
        ":am": safeAmountMrpInr,
        ":a": safeAmountInr,
        ":ay": safeAmountYearlyInr,
        ":amu": safeAmountMrpUsd,
        ":u": safeAmountUsd,
        ":ayu": safeAmountYearlyUsd,
        ":abc": ["monthly", "yearly"],
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

// 5. Toggle Status
export async function togglePlanStatus(planId, status) {
  try {
    await docClient.send(new UpdateCommand({
      TableName: PLANS_TABLE,
      Key: { plan_id: planId },
      UpdateExpression: "set #s = :status",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":status": status }
    }));
    return { success: true };
  } catch (error) { return { success: false, error: error.message }; }
}
// import { docClient } from "./dynamodb";
// import { ScanCommand, PutCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";
// import { v4 as uuidv4 } from 'uuid';

// const PLANS_TABLE = "Plans";

// // 1. RESTORED: Get All Plans
// export async function getAllPlans() {
//   try {
//     const result = await docClient.send(new ScanCommand({ TableName: PLANS_TABLE }));
//     return (result.Items || []).sort((a, b) => a.amount - b.amount);
//   } catch (error) {
//     console.error("Get All Plans Error:", error);
//     return [];
//   }
// }

// // 2. RESTORED: Get Plan By ID (This fixes the NextAuth crash!)
// export async function getPlanById(planId) {
//   try {
//     const { Item } = await docClient.send(new GetCommand({
//       TableName: PLANS_TABLE,
//       Key: { plan_id: planId }
//     }));
//     return Item;
//   } catch (error) { return null; }
// }

// // 3. UPDATED: Create Plan (With Gateway IDs)
// export async function createPlan(planData) {
//   const planId = uuidv4();
  
//   const safeAmountMrpInr = isNaN(Number(planData.amount_mrp)) ? 0 : Number(planData.amount_mrp);
//   const safeAmountInr = isNaN(Number(planData.amount)) ? 0 : Number(planData.amount);
//   const safeAmountMrpUsd = isNaN(Number(planData.amount_mrp_usd)) ? 0 : Number(planData.amount_mrp_usd);
//   const safeAmountUsd = isNaN(Number(planData.amount_usd)) ? 0 : Number(planData.amount_usd);
//   const safeGrace = isNaN(Number(planData.grace_period)) ? 7 : Number(planData.grace_period);
//   const safeDiscount = isNaN(Number(planData.yearly_discount)) ? 20 : Number(planData.yearly_discount);

//   const newPlan = {
//     plan_id: planId,
//     plan_name: planData.name || "Unnamed Plan",
//     amount_mrp: safeAmountMrpInr,
//     amount: safeAmountInr,
//     amount_mrp_usd: safeAmountMrpUsd,
//     amount_usd: safeAmountUsd, 
//     allowed_billing_cycles: ["monthly", "yearly"], 
//     yearly_discount: safeDiscount, 
//     grace_period: safeGrace,
//     status: "active",
//     // Gateway IDs for Path A Subscriptions
//     stripe_monthly_id: planData.stripe_monthly_id || "",
//     stripe_yearly_id: planData.stripe_yearly_id || "",
//     razorpay_monthly_id: planData.razorpay_monthly_id || "",
//     razorpay_yearly_id: planData.razorpay_yearly_id || "",
//     system_features: planData.system_features || {}, 
//     display_features: planData.display_features || [] 
//   };

//   try {
//     await docClient.send(new PutCommand({ TableName: PLANS_TABLE, Item: newPlan }));
//     return { success: true, planId };
//   } catch (error) { return { success: false, error: error.message }; }
// }

// // 4. UPDATED: Update Plan (With Gateway IDs)
// export async function updatePlan(planId, data) {
//   const safeAmountMrpInr = isNaN(Number(data.amount_mrp)) ? 0 : Number(data.amount_mrp);
//   const safeAmountInr = isNaN(Number(data.amount)) ? 0 : Number(data.amount);
//   const safeAmountMrpUsd = isNaN(Number(data.amount_mrp_usd)) ? 0 : Number(data.amount_mrp_usd);
//   const safeAmountUsd = isNaN(Number(data.amount_usd)) ? 0 : Number(data.amount_usd);
//   const safeGrace = isNaN(Number(data.grace_period)) ? 7 : Number(data.grace_period);
//   const safeDiscount = isNaN(Number(data.yearly_discount)) ? 20 : Number(data.yearly_discount);

//   try {
//     await docClient.send(new UpdateCommand({
//       TableName: PLANS_TABLE,
//       Key: { plan_id: planId },
//       UpdateExpression: "set plan_name = :n, amount_mrp = :am, amount = :a, amount_mrp_usd = :amu, amount_usd = :u, allowed_billing_cycles = :abc, yearly_discount = :yd, grace_period = :g, stripe_monthly_id = :sm, stripe_yearly_id = :sy, razorpay_monthly_id = :rm, razorpay_yearly_id = :ry, system_features = :sf, display_features = :df",
//       ExpressionAttributeValues: {
//         ":n": data.name || "Unnamed Plan",
//         ":am": safeAmountMrpInr,
//         ":a": safeAmountInr,
//         ":amu": safeAmountMrpUsd,
//         ":u": safeAmountUsd,
//         ":abc": ["monthly", "yearly"],
//         ":yd": safeDiscount, 
//         ":g": safeGrace, 
//         ":sm": data.stripe_monthly_id || "",
//         ":sy": data.stripe_yearly_id || "",
//         ":rm": data.razorpay_monthly_id || "",
//         ":ry": data.razorpay_yearly_id || "",
//         ":sf": data.system_features || {},
//         ":df": data.display_features || []
//       },
//       ReturnValues: "UPDATED_NEW"
//     }));
//     return { success: true };
//   } catch (error) { return { success: false, error: error.message }; }
// }

// // 5. RESTORED: Toggle Status
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