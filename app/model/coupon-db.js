// app/model/coupon-db.js
import { docClient } from "./dynamodb";
import { PutCommand, ScanCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

const COUPONS_TABLE = "Coupons";

export async function getAllCoupons() {
  try {
    const result = await docClient.send(new ScanCommand({ TableName: COUPONS_TABLE }));
    return (result.Items || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (error) { return []; }
}

export async function getCouponByCode(code) {
  try {
    const { Item } = await docClient.send(new GetCommand({
      TableName: COUPONS_TABLE,
      Key: { coupon_code: code.trim().toUpperCase() } 
    }));
    return Item;
  } catch (error) { return null; }
}

// ✅ UPDATED: New Schema matching Stripe/Razorpay realities
export async function saveGatewayOffer(data) {
  const normalizedCode = data.code.trim().toUpperCase();

  // 🚨 RULE ENFORCEMENT: Duration logic based on product type
  const finalDuration = data.applicableTo === "booster" ? "once" : (data.duration || "once");
  const finalDurationMonths = (finalDuration === "repeating" && data.durationInMonths) 
                              ? Number(data.durationInMonths) 
                              : null;

  const item = {
    // Shared Core Fields
    coupon_code: normalizedCode,                  
    gateway: data.gateway,                            // "stripe" OR "razorpay"
    
    // Value Fields (NEW)
    discount_type: data.discountType || "percentage", // "percentage" OR "flat"
    discount_value: Number(data.discountValue),       // Replaces discount_percentage
    
    // Target Fields
    applicable_to: data.applicableTo,                 // "subscription" OR "booster"
    
    // Duration Fields
    duration: finalDuration,                          // "once", "repeating", "forever"
    duration_in_months: finalDurationMonths,      
    
    // Gateway Specific IDs
    stripe_coupon_id: data.stripeCouponId || null,        
    stripe_promo_id: data.stripePromoId || null,          
    razorpay_offer_id: data.razorpayOfferId || null,  // Pasted from Razorpay Dashboard
    
    status: "active",
    created_at: new Date().toISOString()
  };

  try {
    await docClient.send(new PutCommand({ TableName: COUPONS_TABLE, Item: item }));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function toggleCouponStatus(code, newStatus) {
  try {
    await docClient.send(new UpdateCommand({
      TableName: COUPONS_TABLE,
      Key: { coupon_code: code.trim().toUpperCase() },
      UpdateExpression: "set #s = :status",
      ExpressionAttributeNames: { "#s": "status" },
      ExpressionAttributeValues: { ":status": newStatus }
    }));
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
// // app/model/coupon-db.js
// import { docClient } from "./dynamodb";
// import { PutCommand, ScanCommand, GetCommand, UpdateCommand } from "@aws-sdk/lib-dynamodb";

// const COUPONS_TABLE = "Coupons";

// export async function getAllCoupons() {
//   try {
//     const result = await docClient.send(new ScanCommand({ TableName: COUPONS_TABLE }));
//     return (result.Items || []).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
//   } catch (error) { return []; }
// }

// export async function getCouponByCode(code) {
//   try {
//     const { Item } = await docClient.send(new GetCommand({
//       TableName: COUPONS_TABLE,
//       Key: { coupon_code: code.trim().toUpperCase() } 
//     }));
//     return Item;
//   } catch (error) { return null; }
// }

// // ✅ NEW: Polymorphic Database Design
// export async function saveGatewayOffer(data) {
//   const normalizedCode = data.code.trim().toUpperCase();

//   const item = {
//     // Shared Fields
//     coupon_code: normalizedCode,                  
//     gateway: data.gateway,                        // "stripe" OR "razorpay"
//     type: data.type,                              // "coupon" OR "offer"
//     discount_percentage: Number(data.percentage), 
//     applicable_to: data.applicableTo || "all",    
//     status: "active",
//     created_at: new Date().toISOString(),

//     // 🔵 Stripe-Specific Fields (Only populated if gateway === 'stripe')
//     ...(data.gateway === 'stripe' && {
//       duration: data.duration || "forever",         
//       duration_in_months: data.durationInMonths ? Number(data.durationInMonths) : null,
//       stripe_coupon_id: data.stripeCouponId,        
//       stripe_promo_id: data.stripePromoId,   
//     }),

//     // 🟠 Razorpay-Specific Fields (Only populated if gateway === 'razorpay')
//     ...(data.gateway === 'razorpay' && {
//       razorpay_offer_id: data.razorpayOfferId,
//       linked_plan_id: data.linkedPlanId || null, // Native Razorpay requirement for subscriptions
//     })
//   };

//   try {
//     await docClient.send(new PutCommand({ TableName: COUPONS_TABLE, Item: item }));
//     return { success: true };
//   } catch (error) { 
//     return { success: false, error: error.message }; 
//   }
// }

// export async function toggleCouponStatus(code, newStatus) {
//   try {
//     await docClient.send(new UpdateCommand({
//       TableName: COUPONS_TABLE,
//       Key: { coupon_code: code.trim().toUpperCase() },
//       UpdateExpression: "set #s = :status",
//       ExpressionAttributeNames: { "#s": "status" },
//       ExpressionAttributeValues: { ":status": newStatus }
//     }));
//     return { success: true };
//   } catch (error) { return { success: false, error: error.message }; }
// }