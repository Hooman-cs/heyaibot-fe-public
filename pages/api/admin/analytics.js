import { docClient } from "../../../app/model/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

const SUBS_TABLE = "Subscriptions";
const BOOSTERS_TABLE = "BoosterOrders";
const PLANS_TABLE = "Plans";
const BOOSTER_PLANS_TABLE = "BoosterPlans"; // Added from your DB schema

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user.isSuperAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const range = req.query.range || '30d'; 
    const targetCurrency = (req.query.currency || 'USD').toUpperCase(); 

    const now = new Date();
    let cutoffDate = new Date(now.getTime());

    if (range === '24h') cutoffDate.setHours(now.getHours() - 24);
    else if (range === '7d') cutoffDate.setDate(now.getDate() - 7);
    else if (range === '30d') cutoffDate.setDate(now.getDate() - 30);
    else if (range === '1y') cutoffDate.setMonth(now.getMonth() - 12);
    else cutoffDate = new Date(0); 

    const getGraphLabel = (dateObj) => {
        const iso = dateObj.toISOString();
        if (range === '24h') return `${iso.substring(0, 10)} ${iso.substring(11, 13)}:00`;
        if (range === '7d' || range === '30d') return iso.substring(0, 10); 
        if (range === '1y') return iso.substring(0, 7); 
        return iso.substring(0, 4); 
    };

    const graphDataMap = {};
    if (range !== 'all') {
        let current = new Date(cutoffDate.getTime());
        if (range === '24h') current.setMinutes(0, 0, 0);
        
        while (current <= now) {
            const label = getGraphLabel(current);
            if (!graphDataMap[label]) {
                graphDataMap[label] = { label, subRevenue: 0, boosterRevenue: 0, activeUsersSet: new Set(), newUsersSet: new Set() };
            }
            if (range === '24h') current.setHours(current.getHours() + 1);
            else if (range === '7d' || range === '30d') current.setDate(current.getDate() + 1);
            else if (range === '1y') current.setMonth(current.getMonth() + 1);
        }
    }

    // Fetch ALL tables (Added BoosterPlans)
    const [subsData, boostersData, plansData, boosterPlansData] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: SUBS_TABLE })),
      docClient.send(new ScanCommand({ TableName: BOOSTERS_TABLE })),
      docClient.send(new ScanCommand({ TableName: PLANS_TABLE })),
      docClient.send(new ScanCommand({ TableName: BOOSTER_PLANS_TABLE }))
    ]);

    // Create Maps to lookup real names from IDs
    const planNameMap = {};
    (plansData.Items || []).forEach(p => { planNameMap[p.plan_id] = p.plan_name; });

    const boosterNameMap = {};
    (boosterPlansData.Items || []).forEach(p => { boosterNameMap[p.booster_id] = p.name; });

    let subRevenueTotal = 0;
    let boosterRevenueTotal = 0;
    const globalActiveUsers = new Set();
    const globalNewUsers = new Set();
    const subPlanPopularity = {};
    const boosterPlanPopularity = {};

    // PROCESS SUBSCRIPTIONS
    (subsData.Items || []).forEach(sub => {
        const subDate = new Date(sub.start_date); // Fixed: using start_date from DB
        if (isNaN(subDate.getTime())) return; 
        
        const subCurrency = (sub.currency || "USD").toUpperCase(); 
        const planName = planNameMap[sub.plan_id] || "Unknown Plan";

        // Fixed: Only count Active Users for the specific market (Currency)
        if (sub.status === 'Active' && subCurrency === targetCurrency) {
            globalActiveUsers.add(sub.user_id);
        }

        if (subDate >= cutoffDate && subCurrency === targetCurrency) {
            const amount = Number(sub.amount) || 0; // Fixed: using amount from DB
            
            subRevenueTotal += amount;
            globalNewUsers.add(sub.user_id); 

            const label = getGraphLabel(subDate);
            if (!graphDataMap[label]) graphDataMap[label] = { label, subRevenue: 0, boosterRevenue: 0, activeUsersSet: new Set(), newUsersSet: new Set() };
            
            graphDataMap[label].subRevenue += amount;
            graphDataMap[label].newUsersSet.add(sub.user_id);
            graphDataMap[label].activeUsersSet.add(sub.user_id);

            subPlanPopularity[planName] = (subPlanPopularity[planName] || 0) + 1;
        }
    });

    // PROCESS BOOSTERS
    (boostersData.Items || []).forEach(order => {
        const orderDate = new Date(order.purchase_date); // Fixed: using purchase_date from DB
        if (isNaN(orderDate.getTime())) return; 
        
        const orderCurrency = (order.currency || "USD").toUpperCase();

        if (orderDate >= cutoffDate && orderCurrency === targetCurrency) {
            const amount = Number(order.amount_paid) || 0; // Fixed: using amount_paid from DB
            const boosterName = boosterNameMap[order.booster_id] || "Unknown Booster Pack"; // Mapped from DB
            
            boosterRevenueTotal += amount;

            const label = getGraphLabel(orderDate);
            if (!graphDataMap[label]) graphDataMap[label] = { label, subRevenue: 0, boosterRevenue: 0, activeUsersSet: new Set(), newUsersSet: new Set() };
            
            graphDataMap[label].boosterRevenue += amount;
            // A booster purchase is considered "activity" for the graph
            graphDataMap[label].activeUsersSet.add(order.user_id || 'unknown'); 

            boosterPlanPopularity[boosterName] = (boosterPlanPopularity[boosterName] || 0) + 1;
        }
    });

    // FORMAT OUTPUT
    const graph = Object.values(graphDataMap)
        .sort((a, b) => a.label.localeCompare(b.label))
        .map(point => ({
            label: point.label,
            subRevenue: Number(point.subRevenue.toFixed(2)),
            boosterRevenue: Number(point.boosterRevenue.toFixed(2)),
            activeUsers: point.activeUsersSet.size,
            newUsers: point.newUsersSet.size
        }));

    const formatPlans = (map) => Object.keys(map).map(key => ({ name: key, purchases: map[key] })).sort((a, b) => b.purchases - a.purchases);
    const sortedSubPlans = formatPlans(subPlanPopularity);
    const sortedBoosterPlans = formatPlans(boosterPlanPopularity);

    return res.status(200).json({
      success: true,
      range,
      currency: targetCurrency,
      summary: {
        totalRevenue: Number((subRevenueTotal + boosterRevenueTotal).toFixed(2)),
        subRevenue: Number(subRevenueTotal.toFixed(2)),
        boosterRevenue: Number(boosterRevenueTotal.toFixed(2)),
        activeUsers: globalActiveUsers.size,
        newUsers: globalNewUsers.size,
        topSubPlan: sortedSubPlans.length > 0 ? sortedSubPlans[0].name : "No Data",
        topBoosterPlan: sortedBoosterPlans.length > 0 ? sortedBoosterPlans[0].name : "No Data"
      },
      plans: { subscriptions: sortedSubPlans, boosters: sortedBoosterPlans },
      graph
    });

  } catch (error) {
    console.error("Admin Analytics Error:", error);
    return res.status(500).json({ success: false, error: "Failed to generate analytics" });
  }
}
// import { docClient } from "../../../app/model/dynamodb";
// import { ScanCommand } from "@aws-sdk/lib-dynamodb";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]";

// const SUBS_TABLE = "Subscriptions";
// const BOOSTERS_TABLE = "BoosterOrders";
// const PLANS_TABLE = "Plans";

// export default async function handler(req, res) {
//   if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

//   try {
//     const session = await getServerSession(req, res, authOptions);
//     if (!session || !session.user.isSuperAdmin) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const range = req.query.range || '30d'; 
//     const targetCurrency = (req.query.currency || 'USD').toUpperCase(); 

//     const now = new Date();
//     let cutoffDate = new Date(now.getTime());

//     // 1. Define exact cutoff times
//     if (range === '24h') cutoffDate.setHours(now.getHours() - 24);
//     else if (range === '7d') cutoffDate.setDate(now.getDate() - 7);
//     else if (range === '30d') cutoffDate.setDate(now.getDate() - 30);
//     else if (range === '1y') cutoffDate.setMonth(now.getMonth() - 12);
//     else cutoffDate = new Date(0); // All time

//     // 2. Formatting helper for the Graph Labels
//     const getGraphLabel = (dateObj) => {
//         const iso = dateObj.toISOString();
//         if (range === '24h') return `${iso.substring(0, 10)} ${iso.substring(11, 13)}:00`; // YYYY-MM-DD HH:00
//         if (range === '7d' || range === '30d') return iso.substring(0, 10); // YYYY-MM-DD
//         if (range === '1y') return iso.substring(0, 7); // YYYY-MM
//         return iso.substring(0, 4); // YYYY (All Time)
//     };

//     // 3. Pre-fill the Graph Array with Zeros (Prevents broken lines on the chart)
//     const graphDataMap = {};
//     if (range !== 'all') {
//         let current = new Date(cutoffDate.getTime());
//         while (current <= now) {
//             const label = getGraphLabel(current);
//             if (!graphDataMap[label]) graphDataMap[label] = { label, planRevenue: 0, boosterRevenue: 0 };
            
//             // Advance the loop by the correct increment
//             if (range === '24h') current.setHours(current.getHours() + 1);
//             else if (range === '7d' || range === '30d') current.setDate(current.getDate() + 1);
//             else if (range === '1y') current.setMonth(current.getMonth() + 1);
//         }
//     }

//     // 4. Fetch all Data
//     const [subsData, boostersData, plansData] = await Promise.all([
//       docClient.send(new ScanCommand({ TableName: SUBS_TABLE })),
//       docClient.send(new ScanCommand({ TableName: BOOSTERS_TABLE })),
//       docClient.send(new ScanCommand({ TableName: PLANS_TABLE }))
//     ]);

//     const planNameMap = {};
//     (plansData.Items || []).forEach(p => { planNameMap[p.plan_id] = p.plan_name; });

//     let planRevenue = 0;
//     let boosterRevenue = 0;
//     const activeUsersSet = new Set();
//     const newUsersSet = new Set();
//     const planPopularityMap = {};

//     // 5. PROCESS SUBSCRIPTIONS
//     (subsData.Items || []).forEach(sub => {
//         const subDate = new Date(sub.start_date || sub.createdAt);
//         if (isNaN(subDate.getTime())) return; 
        
//         const subCurrency = (sub.currency || "USD").toUpperCase(); // Default to USD if missing
        
//         // Track overall active users (regardless of when they started, if they are active today, they count)
//         if (sub.status === 'Active') {
//             activeUsersSet.add(sub.user_id);
//         }

//         // Only process revenue and popularity if it's within our selected timeframe & matches currency
//         if (subDate >= cutoffDate && subCurrency === targetCurrency) {
            
//             // NOTE: If Stripe/Razorpay saves money in cents/paise (e.g. 5000 instead of 50.00)
//             // Change the line below to: const amount = (Number(sub.amount) || 0) / 100;
//             const amount = Number(sub.amount || sub.amount_paid) || 0;
            
//             planRevenue += amount;
//             newUsersSet.add(sub.user_id);

//             const label = getGraphLabel(subDate);
//             if (!graphDataMap[label]) graphDataMap[label] = { label, planRevenue: 0, boosterRevenue: 0 };
//             graphDataMap[label].planRevenue += amount;

//             const planName = planNameMap[sub.plan_id] || "Unknown Plan";
//             planPopularityMap[planName] = (planPopularityMap[planName] || 0) + 1;
//         }
//     });

//     // 6. PROCESS BOOSTERS
//     (boostersData.Items || []).forEach(order => {
//         const orderDate = new Date(order.created_at || order.createdAt);
//         if (isNaN(orderDate.getTime())) return; 
        
//         const orderCurrency = (order.currency || "USD").toUpperCase();

//         if (orderDate >= cutoffDate && orderCurrency === targetCurrency) {
            
//             // NOTE: Same as above. Divide by 100 here if Booster amounts are in cents/paise.
//             const amount = Number(order.amount || order.amount_paid || order.price) || 0;
            
//             boosterRevenue += amount;

//             const label = getGraphLabel(orderDate);
//             if (!graphDataMap[label]) graphDataMap[label] = { label, planRevenue: 0, boosterRevenue: 0 };
//             graphDataMap[label].boosterRevenue += amount;

//             // Combine Boosters into the Popularity Chart
//             const boosterName = order.name || order.booster_name || "Booster Pack";
//             planPopularityMap[boosterName] = (planPopularityMap[boosterName] || 0) + 1;
//         }
//     });

//     const totalRevenue = planRevenue + boosterRevenue;
//     const activeUsers = activeUsersSet.size;
//     const arpu = activeUsers > 0 ? (totalRevenue / activeUsers) : 0;

//     const planPopularity = Object.keys(planPopularityMap).map(key => ({
//         name: key,
//         purchases: planPopularityMap[key]
//     })).sort((a, b) => b.purchases - a.purchases);

//     // Sort graph chronologically
//     const graph = Object.values(graphDataMap).sort((a, b) => a.label.localeCompare(b.label));

//     return res.status(200).json({
//       success: true,
//       range,
//       currency: targetCurrency,
//       summary: {
//         totalRevenue: Number(totalRevenue.toFixed(2)),
//         planRevenue: Number(planRevenue.toFixed(2)),
//         boosterRevenue: Number(boosterRevenue.toFixed(2)),
//         activeUsers,
//         newUsers: newUsersSet.size,
//         arpu: Number(arpu.toFixed(2))
//       },
//       planPopularity,
//       graph
//     });

//   } catch (error) {
//     console.error("Admin Analytics Error:", error);
//     return res.status(500).json({ success: false, error: "Failed to generate analytics" });
//   }
// }




// import { docClient } from "../../../app/model/dynamodb";
// import { ScanCommand } from "@aws-sdk/lib-dynamodb";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../auth/[...nextauth]";

// const SUBS_TABLE = "Subscriptions";
// const BOOSTERS_TABLE = "BoosterOrders";
// const PLANS_TABLE = "Plans";

// export default async function handler(req, res) {
//     if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

//     try {
//         // 1. SECURITY CHECK: Only Super Admins can access this data
//         const session = await getServerSession(req, res, authOptions);
//         if (!session || !session.user.isSuperAdmin) {
//             return res.status(401).json({ error: "Unauthorized" });
//         }

//         // 2. PARSE QUERY PARAMETERS
//         const range = req.query.range || '30d'; // 24h, 7d, 30d, 1y, all
//         const targetCurrency = req.query.currency || 'USD'; // USD or INR

//         const now = new Date();
//         const cutoffDate = new Date();
//         let isDailyGraph = true;

//         if (range === '24h') cutoffDate.setHours(now.getHours() - 24);
//         else if (range === '7d') cutoffDate.setDate(now.getDate() - 7);
//         else if (range === '30d') cutoffDate.setDate(now.getDate() - 30);
//         else if (range === '1y') {
//             cutoffDate.setFullYear(now.getFullYear() - 1);
//             isDailyGraph = false; // Group by month instead of day
//         }
//         else {
//             cutoffDate.setTime(0); // All time
//             isDailyGraph = false;
//         }

//         // 3. FETCH ALL REQUIRED DATA FROM DYNAMODB
//         const [subsData, boostersData, plansData] = await Promise.all([
//             docClient.send(new ScanCommand({ TableName: SUBS_TABLE })),
//             docClient.send(new ScanCommand({ TableName: BOOSTERS_TABLE })),
//             docClient.send(new ScanCommand({ TableName: PLANS_TABLE }))
//         ]);

//         // Map Plan IDs to real names dynamically (Future-proof!)
//         const planNameMap = {};
//         (plansData.Items || []).forEach(p => { planNameMap[p.plan_id] = p.plan_name; });

//         // 4. PREPARE OUR AGGREGATION VARIABLES
//         let planRevenue = 0;
//         let boosterRevenue = 0;
//         const activeUsersSet = new Set();
//         const newUsersSet = new Set();
//         const planPopularityMap = {};
//         const graphDataMap = {}; // { "2026-03-24": { planRevenue: 100, boosterRevenue: 0 } }

//         // Helper to format graph labels (YYYY-MM-DD or YYYY-MM)
//         const getGraphLabel = (dateObj) => {
//             if (isDailyGraph) return dateObj.toISOString().split('T')[0];
//             return dateObj.toISOString().slice(0, 7); // "2026-03"
//         };

//         // 5. PROCESS SUBSCRIPTIONS
//         (subsData.Items || []).forEach(sub => {
//             const subDate = new Date(sub.start_date);

//             // ✅ NEW SAFETY CHECK: Skip this row if the date is missing or corrupted
//             if (isNaN(subDate.getTime())) return;

//             // Skip if wrong currency
//             if (sub.currency !== targetCurrency && !(targetCurrency === 'INR' && !sub.currency)) return;

//             // Check if inside timeframe
//             if (subDate >= cutoffDate) {
//                 const amount = Number(sub.amount) || 0;
//                 planRevenue += amount;

//                 // Track New Users (First payment in this timeframe)
//                 newUsersSet.add(sub.user_id);

//                 // Populate Graph
//                 const label = getGraphLabel(subDate);
//                 if (!graphDataMap[label]) graphDataMap[label] = { label, planRevenue: 0, boosterRevenue: 0 };
//                 graphDataMap[label].planRevenue += amount;
//             }

//             // Track Active Users and Plan Popularity
//             if (sub.status === 'Active') {
//                 activeUsersSet.add(sub.user_id);

//                 const planName = planNameMap[sub.plan_id] || "Unknown Plan";
//                 planPopularityMap[planName] = (planPopularityMap[planName] || 0) + 1;
//             }
//         });

//         // 6. PROCESS BOOSTERS
//         (boostersData.Items || []).forEach(order => {
//             const orderDate = new Date(order.created_at || order.createdAt);

//             // ✅ NEW SAFETY CHECK: Skip this row if the date is missing or corrupted
//             if (isNaN(orderDate.getTime())) return;

//             // Skip if wrong currency or outside timeframe
//             if (order.currency !== targetCurrency) return;
//             if (orderDate < cutoffDate) return;

//             const amount = Number(order.amount || order.amount_paid) || 0;
//             boosterRevenue += amount;

//             // Populate Graph
//             const label = getGraphLabel(orderDate);
//             if (!graphDataMap[label]) graphDataMap[label] = { label, planRevenue: 0, boosterRevenue: 0 };
//             graphDataMap[label].boosterRevenue += amount;
//         });

//         // // 5. PROCESS SUBSCRIPTIONS
//         // (subsData.Items || []).forEach(sub => {
//         //     const subDate = new Date(sub.start_date);

//         //     // Skip if wrong currency
//         //     if (sub.currency !== targetCurrency && !(targetCurrency === 'INR' && !sub.currency)) return;

//         //     // Check if inside timeframe
//         //     if (subDate >= cutoffDate) {
//         //         const amount = Number(sub.amount) || 0;
//         //         planRevenue += amount;

//         //         // Track New Users (First payment in this timeframe)
//         //         newUsersSet.add(sub.user_id);

//         //         // Populate Graph
//         //         const label = getGraphLabel(subDate);
//         //         if (!graphDataMap[label]) graphDataMap[label] = { label, planRevenue: 0, boosterRevenue: 0 };
//         //         graphDataMap[label].planRevenue += amount;
//         //     }

//         //     // Track Active Users and Plan Popularity (Even if they paid before the cutoff, if they are still Active today!)
//         //     if (sub.status === 'Active') {
//         //         activeUsersSet.add(sub.user_id);

//         //         const planName = planNameMap[sub.plan_id] || "Unknown Plan";
//         //         planPopularityMap[planName] = (planPopularityMap[planName] || 0) + 1;
//         //     }
//         // });

//         // // 6. PROCESS BOOSTERS
//         // (boostersData.Items || []).forEach(order => {
//         //     const orderDate = new Date(order.created_at || order.createdAt);

//         //     // Skip if wrong currency or outside timeframe
//         //     if (order.currency !== targetCurrency) return;
//         //     if (orderDate < cutoffDate) return;

//         //     const amount = Number(order.amount || order.amount_paid) || 0;
//         //     boosterRevenue += amount;

//         //     // Populate Graph
//         //     const label = getGraphLabel(orderDate);
//         //     if (!graphDataMap[label]) graphDataMap[label] = { label, planRevenue: 0, boosterRevenue: 0 };
//         //     graphDataMap[label].boosterRevenue += amount;
//         // });

//         // 7. FINALIZE & FORMAT OUTPUT
//         const totalRevenue = planRevenue + boosterRevenue;
//         const activeUsers = activeUsersSet.size;
//         const arpu = activeUsers > 0 ? (totalRevenue / activeUsers) : 0;

//         // Convert plan popularity map to an array
//         const planPopularity = Object.keys(planPopularityMap).map(key => ({
//             name: key,
//             users: planPopularityMap[key]
//         })).sort((a, b) => b.users - a.users); // Sort highest to lowest

//         // Sort the graph array chronologically
//         const graph = Object.values(graphDataMap).sort((a, b) => a.label.localeCompare(b.label));

//         // Return the "Google Analytics" style response
//         return res.status(200).json({
//             success: true,
//             range,
//             currency: targetCurrency,
//             summary: {
//                 totalRevenue: Number(totalRevenue.toFixed(2)),
//                 planRevenue: Number(planRevenue.toFixed(2)),
//                 boosterRevenue: Number(boosterRevenue.toFixed(2)),
//                 activeUsers,
//                 newUsers: newUsersSet.size,
//                 arpu: Number(arpu.toFixed(2))
//             },
//             planPopularity,
//             graph
//         });

//     } catch (error) {
//         console.error("Admin Analytics Error:", error);
//         return res.status(500).json({ success: false, error: "Failed to generate analytics" });
//     }
// }