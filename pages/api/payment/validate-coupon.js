
import { getCouponByCode } from "../../../app/model/coupon-db";

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

  const { code, purchaseType, currency } = req.body; 

  if (!code) return res.status(400).json({ error: "No code provided" });
  if (!purchaseType) return res.status(400).json({ error: "Missing purchase type" });
  if (!currency) return res.status(400).json({ error: "Missing currency context" });

  // Map the user's currency to the expected gateway
  const targetGateway = currency === "USD" ? "stripe" : "razorpay";

  try {
    const coupon = await getCouponByCode(code);

    // 1. Basic Validity
    if (!coupon || coupon.status !== 'active') {
      return res.status(404).json({ error: "Invalid or expired code." });
    }

    // 2. 🚨 GATEWAY CHECK
    if (coupon.gateway !== targetGateway) {
      const allowedCurrency = coupon.gateway === 'stripe' ? 'USD' : 'INR';
      return res.status(403).json({
        error: `This code is only valid for ${allowedCurrency} purchases.`
      });
    }

    // 3. 🚨 PRODUCT SEGREGATION CHECK (STRICT MATCH)
    if (coupon.applicable_to !== purchaseType) {
      const target = coupon.applicable_to === 'subscription' ? 'Subscription Plans' : 'Token Boosters';
      return res.status(403).json({
        error: `This code is only valid for ${target}.`
      });
    }

    // 4. Success! Return the exact mathematical values needed for frontend/backend
    return res.status(200).json({
      code: coupon.coupon_code,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
      applicableTo: coupon.applicable_to
    });

  } catch (error) {
    console.error("Coupon Validation Error:", error);
    return res.status(500).json({ error: "Internal server error during validation" });
  }
}
// import { getCouponByCode } from "../../../app/model/coupon-db";

// export default async function handler(req, res) {
//   if (req.method !== 'POST') return res.status(405).json({ error: "Method not allowed" });

//   const { code, purchaseType, currency } = req.body; 

//   if (!code) return res.status(400).json({ error: "No code provided" });
//   if (!purchaseType) return res.status(400).json({ error: "Missing purchase type" });
//   if (!currency) return res.status(400).json({ error: "Missing currency context" });

//   // Map the user's currency to the expected gateway
//   const targetGateway = currency === "USD" ? "stripe" : "razorpay";

//   try {
//     const coupon = await getCouponByCode(code);

//     // 1. Basic Validity
//     if (!coupon || coupon.status !== 'active') {
//       return res.status(404).json({ error: "Invalid or expired code." });
//     }

//     // 2. 🚨 GATEWAY CHECK
//     if (coupon.gateway !== targetGateway) {
//       const allowedCurrency = coupon.gateway === 'stripe' ? 'USD' : 'INR';
//       return res.status(403).json({
//         error: `This code is only valid for ${allowedCurrency} purchases.`
//       });
//     }

//     // 3. 🚨 PRODUCT SEGREGATION CHECK
//     if (coupon.applicable_to !== 'all' && coupon.applicable_to !== purchaseType) {
//       const target = coupon.applicable_to === 'subscription' ? 'Subscription Plans' : 'Token Boosters';
//       return res.status(403).json({
//         error: `This code is only valid for ${target}.`
//       });
//     }

//     // 4. Success! Return data 
//     // ✅ NEW: Return the Razorpay Offer ID so the checkout API can use it
//     return res.status(200).json({
//       code: coupon.coupon_code,
//       percentage: coupon.discount_percentage,
//       applicableTo: coupon.applicable_to,
//       razorpayOfferId: coupon.razorpay_offer_id || null
//     });

//   } catch (error) {
//     console.error("Coupon Validation Error:", error);
//     return res.status(500).json({ error: "Validation server error" });
//   }
// }