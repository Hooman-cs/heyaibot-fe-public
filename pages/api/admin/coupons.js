
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import Stripe from 'stripe';
import { getAllCoupons, saveGatewayOffer, toggleCouponStatus } from "../../../app/model/coupon-db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function checkAdmin(req, res) {
  const session = await getServerSession(req, res, authOptions);
  return !!(session && session.user.isSuperAdmin);
}

export default async function handler(req, res) {
  // GET Route (Fetch all)
  if (req.method === 'GET') {
    if (!await checkAdmin(req, res)) return res.status(401).json({ error: "Unauthorized" });
    const coupons = await getAllCoupons();
    return res.status(200).json({ coupons });
  }

  // POST Route (Create new)
  if (req.method === 'POST') {
    if (!await checkAdmin(req, res)) return res.status(401).json({ error: "Unauthorized" });

    // ✅ UPDATED: Matching the new strict schema requirements
    const { 
        code, discountType, discountValue, gateway, applicableTo, 
        duration, durationInMonths, razorpayOfferId 
    } = req.body;

    if (!code || !discountValue || !gateway || !applicableTo) {
        return res.status(400).json({ error: "Missing required fields" });
    }

    const safeCode = code.trim().toUpperCase();
    let stripeCouponId = null;
    let stripePromoId = null;

    // 🚨 ENFORCE DURATION RULES: Boosters are strictly one-time
    let finalDuration = applicableTo === "booster" ? "once" : (duration || "once");
    
    // ==========================================
    // STRIPE GATEWAY LOGIC
    // ==========================================
    if (gateway === 'stripe') {
      try {
        const stripeCouponParams = {
            id: safeCode,  // ✅ RESTORED: This creates the actual code the user types in!
            name: safeCode,
            duration: finalDuration === "forever" ? "forever" : (finalDuration === "repeating" ? "repeating" : "once"),
            duration_in_months: finalDuration === "repeating" ? Number(durationInMonths) : undefined,
        };

        // ✅ Handle Flat vs Percentage for Stripe
        if (discountType === 'flat') {
            stripeCouponParams.amount_off = Math.round(Number(discountValue) * 100); // Stripe requires cents
            stripeCouponParams.currency = 'usd';
        } else {
            stripeCouponParams.percent_off = Number(discountValue);
        }

        // Create the coupon directly (no promotion code needed)
        const stripeCoupon = await stripe.coupons.create(stripeCouponParams);

        stripeCouponId = stripeCoupon.id;
        stripePromoId = stripeCoupon.id; // Keep them the same for backward compatibility
      } catch (err) {
        return res.status(400).json({ error: `Stripe Error: ${err.message}` });
      }
    }

    // ==========================================
    // SAVE TO OUR DATABASE
    // ==========================================
    try {
      const dbResult = await saveGatewayOffer({
        code: safeCode,
        gateway: gateway,
        discountType: discountType || "percentage",
        discountValue: discountValue,
        applicableTo: applicableTo,
        duration: finalDuration,
        durationInMonths: durationInMonths,
        stripeCouponId: stripeCouponId,
        stripePromoId: stripePromoId,
        razorpayOfferId: razorpayOfferId || null,
      });

      if (!dbResult.success) throw new Error(dbResult.error);

      return res.status(201).json({ success: true, code: safeCode });

    } catch (error) {
      console.error("Database Creation Error:", error);
      return res.status(500).json({ error: error.message });
    }
  }

  // PATCH Route (Toggle active/inactive)
  if (req.method === 'PATCH') {
    if (!await checkAdmin(req, res)) return res.status(401).json({ error: "Unauthorized" });

    const { code, status } = req.body;
    if (!code || !status) return res.status(400).json({ error: "Missing code or status" });

    try {
      await toggleCouponStatus(code, status);

      const dbCoupon = (await getAllCoupons()).find(c => c.coupon_code === code.toUpperCase());
      if (dbCoupon && dbCoupon.gateway === 'stripe' && dbCoupon.stripe_promo_id) {
          await stripe.promotionCodes.update(dbCoupon.stripe_promo_id, {
             active: status === 'active'
          });
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
// import { getServerSession } from "next-auth/next";
// import { authOptions } from "../auth/[...nextauth]";
// import Stripe from 'stripe';
// import { getAllCoupons, saveGatewayOffer, toggleCouponStatus } from "../../../app/model/coupon-db";

// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// async function checkAdmin(req, res) {
//   const session = await getServerSession(req, res, authOptions);
//   return !!(session && session.user.isSuperAdmin);
// }

// export default async function handler(req, res) {
//   if (req.method === 'GET') {
//     if (!await checkAdmin(req, res)) return res.status(401).json({ error: "Unauthorized" });
//     const coupons = await getAllCoupons();
//     return res.status(200).json({ coupons });
//   }

//   if (req.method === 'POST') {
//     if (!await checkAdmin(req, res)) return res.status(401).json({ error: "Unauthorized" });

//     const { 
//         code, percentage, gateway, type, applicableTo, 
//         duration, durationInMonths, razorpayOfferId 
//     } = req.body;

//     if (!code || !percentage || !gateway) {
//         return res.status(400).json({ error: "Missing required fields: code, percentage, or gateway" });
//     }

//     const safeCode = code.trim().toUpperCase();
//     let stripeCouponId = null;
//     let stripePromoId = null;

//     try {
//       // ==========================================
//       // 🔵 PATH A: STRIPE COUPON GENERATION
//       // ==========================================
//       if (gateway === 'stripe') {
//         const stripeCouponPayload = {
//           percent_off: Number(percentage),
//           duration: duration || 'forever',
//           name: `${percentage}% OFF Base Coupon`,
//         };
//         if (duration === 'repeating' && durationInMonths) {
//           stripeCouponPayload.duration_in_months = Number(durationInMonths);
//         }
        
//         const stripeCoupon = await stripe.coupons.create(stripeCouponPayload);
//         const stripePromo = await stripe.promotionCodes.create({
//           promotion: { type: 'coupon', coupon: stripeCoupon.id },
//           code: safeCode,
//         });

//         stripeCouponId = stripeCoupon.id;
//         stripePromoId = stripePromo.id;
//       }

//       // ==========================================
//       // 🟠 PATH B: RAZORPAY OFFER (Dashboard Method)
//       // ==========================================
//       else if (gateway !== 'razorpay') {
//           return res.status(400).json({ error: "Invalid gateway selected" });
//       }

//       // ==========================================
//       // SAVE EXACTLY WHAT WAS GENERATED/PROVIDED
//       // ==========================================
//       const dbResult = await saveGatewayOffer({
//         code: safeCode,
//         gateway: gateway,
//         type: type || (gateway === 'stripe' ? 'coupon' : 'offer'),
//         percentage: Number(percentage),
//         applicableTo: applicableTo || "all", 
//         duration: duration,
//         durationInMonths: durationInMonths,
//         // Save the ID provided from the Razorpay Dashboard (or fallback to local math for Boosters)
//         razorpayOfferId: razorpayOfferId || "managed_by_db", 
//         stripeCouponId: stripeCouponId,
//         stripePromoId: stripePromoId,
//       });

//       if (!dbResult.success) throw new Error(dbResult.error);

//       return res.status(201).json({ success: true, code: safeCode });

//     } catch (error) {
//       console.error("Gateway Creation Error:", error);
//       return res.status(500).json({ error: error.message });
//     }
//   }

//   // PATCH Route (Toggle active/inactive)
//   if (req.method === 'PATCH') {
//     if (!await checkAdmin(req, res)) return res.status(401).json({ error: "Unauthorized" });

//     const { code, status } = req.body;
//     if (!code || !status) return res.status(400).json({ error: "Missing code or status" });

//     try {
//       await toggleCouponStatus(code, status);

//       const dbCoupon = (await getAllCoupons()).find(c => c.coupon_code === code.toUpperCase());
//       if (dbCoupon && dbCoupon.gateway === 'stripe' && dbCoupon.stripe_promo_id) {
//           await stripe.promotionCodes.update(dbCoupon.stripe_promo_id, {
//              active: status === 'active' 
//           });
//       }

//       return res.status(200).json({ success: true });
//     } catch (error) {
//       return res.status(500).json({ error: error.message });
//     }
//   }

//   return res.status(405).json({ error: "Method not allowed" });
// }