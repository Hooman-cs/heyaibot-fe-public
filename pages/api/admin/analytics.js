import { docClient } from "../../../app/model/dynamodb";
import { ScanCommand } from "@aws-sdk/lib-dynamodb";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";

const SUBS_TABLE = "Subscriptions";
const BOOSTERS_TABLE = "BoosterOrders";
const PLANS_TABLE = "Plans";
const BOOSTER_PLANS_TABLE = "BoosterPlans";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    // 1. SECURITY CHECK
    const session = await getServerSession(req, res, authOptions);
    if (!session || !session.user.isSuperAdmin) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    // 2. PARSE QUERY PARAMETERS
    const range = req.query.range || '30d'; 
    const targetCurrency = (req.query.currency || 'USD').toUpperCase(); 

    const DATA_IS_IN_CENTS = false; 

    // 3. DEFINE TIME CUTOFFS
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

    // 4. BUILD STRICT TIME BUCKETS
    const buckets = [];
    if (range !== 'all') {
        let current = new Date(cutoffDate.getTime());
        if (range === '24h') current.setMinutes(0, 0, 0);
        
        while (current <= now) {
            let next = new Date(current.getTime());
            let label = "";

            if (range === '24h') {
                next.setHours(current.getHours() + 1);
                label = `${current.toISOString().substring(0, 10)} ${current.toISOString().substring(11, 13)}:00`;
            } else if (range === '7d' || range === '30d') {
                next.setDate(current.getDate() + 1);
                label = current.toISOString().substring(0, 10);
            } else if (range === '1y') {
                next.setMonth(current.getMonth() + 1);
                label = current.toISOString().substring(0, 7);
            }

            buckets.push({
                label,
                startTs: current.getTime(),
                endTs: next.getTime(),
                subRevenue: 0,
                boosterRevenue: 0,
                activeSet: new Set(),
                newSet: new Set()
            });
            current = next;
        }
    }

    // 5. FETCH ALL DATABASE TABLES
    const [subsData, boostersData, plansData, boosterPlansData] = await Promise.all([
      docClient.send(new ScanCommand({ TableName: SUBS_TABLE })),
      docClient.send(new ScanCommand({ TableName: BOOSTERS_TABLE })),
      docClient.send(new ScanCommand({ TableName: PLANS_TABLE })),
      docClient.send(new ScanCommand({ TableName: BOOSTER_PLANS_TABLE }))
    ]);

    const planNameMap = {};
    (plansData.Items || []).forEach(p => { planNameMap[p.plan_id] = p.plan_name; });
    const boosterNameMap = {};
    (boosterPlansData.Items || []).forEach(p => { boosterNameMap[p.booster_id] = p.name; });

    // 6. FIND "ABSOLUTE FIRST PURCHASE" DATES FOR NEW USER LOGIC
    const firstPurchaseMap = {};
    (subsData.Items || []).forEach(sub => {
        const subCurrency = (sub.currency || "INR").toUpperCase(); 
        if (subCurrency !== targetCurrency) return;

        const startTs = new Date(sub.start_date || sub.createdAt).getTime();
        if (isNaN(startTs)) return;

        if (!firstPurchaseMap[sub.user_id] || startTs < firstPurchaseMap[sub.user_id]) {
            firstPurchaseMap[sub.user_id] = startTs;
        }
    });

    let subRevenueTotal = 0;
    let boosterRevenueTotal = 0;
    const globalActiveUsers = new Set();
    const globalNewUsers = new Set();
    const subPlanPopularity = {};
    const boosterPlanPopularity = {};

    // 7. PROCESS SUBSCRIPTIONS
    (subsData.Items || []).forEach(sub => {
        const subCurrency = (sub.currency || "INR").toUpperCase(); 
        if (subCurrency !== targetCurrency) return;

        const startTs = new Date(sub.start_date || sub.createdAt).getTime();
        const expireTs = sub.expire_date ? new Date(sub.expire_date).getTime() : startTs + (30 * 24 * 60 * 60 * 1000); 
        
        if (isNaN(startTs) || isNaN(expireTs)) return;

        const planName = planNameMap[sub.plan_id] || "Unknown Plan";
        let amount = Number(sub.amount) || 0;
        if (DATA_IS_IN_CENTS) amount = amount / 100;

        // ✅ FIXED: Global Active Users (Are they active RIGHT NOW?)
        if (expireTs >= now.getTime() && startTs <= now.getTime()) {
            globalActiveUsers.add(sub.user_id);
            subPlanPopularity[planName] = (subPlanPopularity[planName] || 0) + 1;
        }

        if (startTs >= cutoffDate.getTime() && startTs <= now.getTime()) {
            subRevenueTotal += amount;
            if (firstPurchaseMap[sub.user_id] === startTs) {
                globalNewUsers.add(sub.user_id);
            }
        }

        if (range !== 'all') {
            buckets.forEach(bucket => {
                if (expireTs >= bucket.startTs && startTs < bucket.endTs) {
                    bucket.activeSet.add(sub.user_id);
                }
                if (startTs >= bucket.startTs && startTs < bucket.endTs) {
                    bucket.subRevenue += amount;
                    if (firstPurchaseMap[sub.user_id] === startTs) {
                        bucket.newSet.add(sub.user_id);
                    }
                }
            });
        }
    });

    // 8. PROCESS BOOSTERS
    (boostersData.Items || []).forEach(order => {
        const orderCurrency = (order.currency || "INR").toUpperCase();
        if (orderCurrency !== targetCurrency) return;

        const purchaseTs = new Date(order.purchase_date).getTime();
        if (isNaN(purchaseTs)) return;

        let amount = Number(order.amount_paid) || 0;
        if (DATA_IS_IN_CENTS) amount = amount / 100;

        const boosterName = boosterNameMap[order.booster_id] || "Unknown Booster Pack";

        if (purchaseTs >= cutoffDate.getTime() && purchaseTs <= now.getTime()) {
            boosterRevenueTotal += amount;
            boosterPlanPopularity[boosterName] = (boosterPlanPopularity[boosterName] || 0) + 1;
        }

        if (range !== 'all') {
            buckets.forEach(bucket => {
                if (purchaseTs >= bucket.startTs && purchaseTs < bucket.endTs) {
                    bucket.boosterRevenue += amount;
                }
            });
        }
    });

    // 9. FORMAT OUTPUT
    let graph = [];
    if (range === 'all') {
        graph = [{ 
            label: "All Time", 
            subRevenue: subRevenueTotal, 
            boosterRevenue: boosterRevenueTotal, 
            activeUsers: globalActiveUsers.size, 
            newUsers: globalNewUsers.size 
        }];
    } else {
        graph = buckets.map(b => ({
            label: b.label,
            subRevenue: Number(b.subRevenue.toFixed(2)),
            boosterRevenue: Number(b.boosterRevenue.toFixed(2)),
            activeUsers: b.activeSet.size,
            newUsers: b.newSet.size
        }));
    }

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
