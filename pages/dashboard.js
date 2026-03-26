import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image"; 
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";

// IMPORT SEPARATED COMPONENTS & CONFIG
import config from "../app/components/utils/config";
import OverviewTab from "../app/components/dashboard/OverviewTab";
import AdminBillingTab from "../app/components/dashboard/AdminBillingTab";
import SubscriptionHistoryTab from "../app/components/dashboard/SubscriptionHistoryTab";
import LeadCaptureTab from "../app/components/dashboard/LeadCaptureTab";
import ChatHistoryTab from "../app/components/dashboard/ChatHistoryTab"; 
import AdminAnalyticsTab from "../app/components/dashboard/AdminAnalyticsTab";

const STATUS_UI = {
  "Active": { text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200", icon: "●" },
  "Action Required": { text: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", icon: "▲" },
  "Expired": { text: "text-rose-700", bg: "bg-rose-100", border: "border-rose-200", icon: "✕" },
  "No Active Subscription": { text: "text-rose-700", bg: "bg-rose-100", border: "border-rose-200", icon: "✕" },
  "Loading...": { text: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", icon: "..." },
  "Default": { text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", icon: "?" }
};

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [subStatus, setSubStatus] = useState("Loading...");
  const [allowedBots, setAllowedBots] = useState("0");
  const [activeTab, setActiveTab] = useState("Overview"); 
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
  const [bots, setBots] = useState([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [totalConversationsCount, setTotalConversationsCount] = useState(0); 
  const [expireDate, setExpireDate] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);
  const [rawSubs, setRawSubs] = useState([]);
  const [rawBoosters, setRawBoosters] = useState([]);
  
  const [adminStats, setAdminStats] = useState({ activePlans: 0, totalInr: 0, totalUsd: 0 });

  const isAdmin = session?.user?.isSuperAdmin === true;

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      
      if (!isAdmin) {
        fetch("/api/user/subscription")
          .then(res => res.json())
          .then(data => {
            const currentStatus = data.subscription?.status || "No Active Subscription";
            setSubStatus(currentStatus);
            setExpireDate(data.subscription?.expire_date || null);
            
            if (["No Active Subscription", "Expired", "Canceled", "Cancelled"].includes(currentStatus)) {
              setAllowedBots("0");
            } else {
              const features = data.subscription?.snapshot_features || {};
              let limit = "1";
              if (features["MaxBot"] !== undefined) limit = features["MaxBot"];
              else if (features["maxBot"] !== undefined) limit = features["maxBot"];
              else if (features["Chatbots"] !== undefined) limit = features["Chatbots"];
              else {
                const fallbackKey = Object.keys(features).find(k => k.toLowerCase().includes("bot"));
                if (fallbackKey) limit = features[fallbackKey];
              }
              setAllowedBots(limit);
            }
          })
          .catch(() => setSubStatus("Error"));

        fetch("/api/user/wallet")
          .then(res => res.json())
          .then(data => setWalletBalance(data.balance || 0))
          .catch(err => console.error("Wallet fetch error", err));
      }

      if (session?.user?.id) {
        if (isAdmin) {
          fetch("/api/payments")
            .then(res => res.json())
            .then(data => {
              const uniqueUsers = new Set();
              let subInr = 0, subUsd = 0;
              let boosterInr = 0, boosterUsd = 0;

              setRawSubs(data.subscriptions || []);
    setRawBoosters(data.boosterOrders || []);

              // --- NEW: Analytics Data Arrays ---
              const monthlyRevenueMap = {}; // For MRR Trend Line Chart
              const planPopularityMap = {}; // For Plan Bar Chart

              // 1. Process Subscriptions
              if (data.subscriptions) {
                data.subscriptions.forEach(sub => {
                  const amount = Number(sub.amount) || 0;
                  const isUSD = sub.currency === 'USD';
                  
                  if (sub.status === 'Active') {
                     uniqueUsers.add(sub.user_id); 
                     
                     // Count active users per plan for Bar Chart
                     const planId = sub.plan_id || "Unknown";
                     planPopularityMap[planId] = (planPopularityMap[planId] || 0) + 1;
                  }

                  if (isUSD) subUsd += amount;
                  else subInr += amount;

                  // Group MRR by Month (e.g., "Oct 2023")
                  const date = new Date(sub.start_date);
                  const monthYear = date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
                  
                  if (!monthlyRevenueMap[monthYear]) {
                    monthlyRevenueMap[monthYear] = { name: monthYear, subscriptions: 0, boosters: 0 };
                  }
                  // Normalizing to INR for the chart (Assuming roughly 1 USD = 83 INR for visual scale, adjust as needed)
                  const normalizedAmount = isUSD ? amount * 83 : amount; 
                  monthlyRevenueMap[monthYear].subscriptions += normalizedAmount;
                });
              }

              // 2. Process Boosters
              if (data.boosterOrders) {
                data.boosterOrders.forEach(order => {
                  const amount = Number(order.amount || order.amount_paid) || 0;
                  const isUSD = order.currency === 'USD';
                  
                  if (isUSD) boosterUsd += amount;
                  else boosterInr += amount;

                  // Group Booster revenue by Month
                  const date = new Date(order.created_at || order.createdAt);
                  if (!isNaN(date)) {
                      const monthYear = date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
                      if (!monthlyRevenueMap[monthYear]) {
                        monthlyRevenueMap[monthYear] = { name: monthYear, subscriptions: 0, boosters: 0 };
                      }
                      const normalizedAmount = isUSD ? amount * 83 : amount;
                      monthlyRevenueMap[monthYear].boosters += normalizedAmount;
                  }
                });
              }

              // --- Format Data for Recharts ---
              // Sort chronological
              const mrrChartData = Object.values(monthlyRevenueMap).sort((a, b) => new Date(a.name) - new Date(b.name));
              
              // Revenue Split Pie Chart Data (Total INR normalized)
              const revenueSplitData = [
                { name: 'Subscriptions', value: Math.round(subInr + (subUsd * 83)), color: '#4F46E5' }, // Indigo-600
                { name: 'Token Boosters', value: Math.round(boosterInr + (boosterUsd * 83)), color: '#10B981' } // Emerald-500
              ];

              // Plan Popularity Bar Chart Data
              const planChartData = Object.keys(planPopularityMap).map(key => ({
                name: key.substring(0, 8) + '...', // We'll map real names later if needed, or just show IDs
                users: planPopularityMap[key]
              }));

              setAdminStats({ 
                subRevenueInr: subInr, subRevenueUsd: subUsd,
                boosterRevenueInr: boosterInr, boosterRevenueUsd: boosterUsd,
                uniqueActiveUsers: uniqueUsers.size,
                mrrChartData,        // NEW
                revenueSplitData,    // NEW
                planChartData        // NEW
              });
            })
            .catch(err => console.error("Error fetching admin stats", err));
        }
        else {
          fetch(`${config.apiBaseUrl}/api/websites/user/${session.user.id}/credentials`)
            .then(res => res.json())
            .then(async (data) => {
              const botList = data.credentials || data.data || [];
              setBots(botList);
              
              let grandTotalLeads = 0;
              let grandTotalChats = 0;
              
              if (botList.length > 0) {
                for (const bot of botList) {
                  try {
                    const leadsRes = await fetch(`${config.apiBaseUrl}/api/chat-requests/backend-api-key/${bot.apiKey}/count`);
                    const leadsData = await leadsRes.json();
                    grandTotalLeads += (leadsData.count || 0);

                    const chatsRes = await fetch(`${config.apiBaseUrl}/api/chats/apikey/${bot.apiKey}`);
                    const chatsData = await chatsRes.json();
                    grandTotalChats += (chatsData.count || (Array.isArray(chatsData.data) ? chatsData.data.length : 0));
                    
                  } catch (e) { console.error("Error fetching metrics", e); }
                }
              }
              setTotalLeadsCount(grandTotalLeads);
              setTotalConversationsCount(grandTotalChats); 
            })
            .catch(err => console.error("Bot fetch error", err));
        }
      }
    }
  }, [status, router, session, isAdmin]);

  const currentStatus = STATUS_UI[subStatus] || STATUS_UI["Default"];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false); 
  };

  const sidebarLinks = useMemo(() => {
    return isAdmin ? [
      { id: "Overview", name: "Overview", icon: "📊" },
      { id: "SuperAdmin", name: "Super Admin Panel", icon: "👑", isPrimary: true, isExternal: true, href: "/api/launch-studio" },
      { id: "Analytics", name: "Detailed Analytics", icon: "📊" },
      { id: "Billing Management", name: "Billing Management", icon: "💳" }, // UPDATED UNIFIED LINK
      { id: "Revenue", name: "Revenue & History", icon: "📈" },
    ] : [
      { id: "Overview", name: "Overview", icon: "🏠" },
      { id: "Studio", name: "Chatbot Studio", icon: "🤖", isPrimary: true, isExternal: true, href: "/api/launch-studio" },
      { id: "Chat History", name: "Chat History", icon: "💬" }, 
      { id: "Lead Capture", name: "Lead Capture", icon: "🧲" }, 
      { id: "Billing", name: "Billing History", icon: "🧾" },
    ];
  }, [isAdmin]);

  const CONTENT_VIEWS = {
    "Overview": (
      <OverviewTab 
        isAdmin={isAdmin} session={session} adminStats={adminStats}
        totalConversationsCount={totalConversationsCount} totalLeadsCount={totalLeadsCount}
        bots={bots} allowedBots={allowedBots} subStatus={subStatus} currentStatus={currentStatus}
        handleNavClick={handleNavClick} expireDate={expireDate} walletBalance={walletBalance}
      />
    ),
    "Billing Management": <AdminBillingTab />, // NEW UNIFIED TAB
    "Billing": <SubscriptionHistoryTab isAdmin={isAdmin} />,
    "Revenue": <SubscriptionHistoryTab isAdmin={isAdmin} />,
    "Lead Capture": <LeadCaptureTab bots={bots} />, 
    "Chat History": <ChatHistoryTab bots={bots} />, 
    "Analytics": <AdminAnalyticsTab />,
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* TOP NAVBAR */}
      <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 lg:py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          
          <div className="flex items-center gap-3">
            <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <Link href="/" className="flex items-center gap-2 lg:gap-3">
              <Image src="/logo.png" alt="Logo" width={48} height={48} className="w-10 h-10 lg:w-12 lg:h-12 object-contain" />
              <span className="font-bold text-xl lg:text-2xl text-indigo-600 hidden sm:block">HeyAiBot</span>
            </Link>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-3">
                <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base lg:text-lg">{session.user.name?.charAt(0)}</div>
                <span className="text-sm lg:text-lg text-slate-800 font-bold hidden sm:block">{session.user.name}</span>
            </div>
            <button onClick={async () => { await signOut({ redirect: false }); window.location.href = "/"; }} className="text-rose-600 hover:bg-rose-50 font-bold text-xs lg:text-sm border border-rose-200 px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl transition-all">Sign Out</button>
          </div>
        </div>
      </div>

      <div className="flex-grow flex max-w-[1400px] mx-auto w-full relative">
        
        {isMobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
        )}

        <aside className={`fixed lg:static top-0 left-0 h-full lg:h-auto w-72 bg-white lg:bg-transparent z-50 lg:z-auto py-6 lg:py-8 px-4 lg:px-0 lg:pr-8 border-r border-slate-200 transition-transform duration-300 flex flex-col shadow-2xl lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
          <div className="flex justify-between items-center mb-8 px-2 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
              <span className="font-bold text-lg text-indigo-600">HeyAiBot</span>
            </Link>
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-rose-500 bg-slate-100 rounded-full p-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-3 hidden lg:block">Dashboard</div>
          
          <nav className="space-y-2 flex-1 overflow-y-auto pb-20 lg:pb-0">
            {sidebarLinks.map((link) => {
                if (link.isPrimary && link.isExternal) {
                    return (
                        <a key={link.id} href={link.href} className="flex items-center justify-between px-4 py-3.5 mt-6 mb-4 rounded-xl font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
                            <span className="flex items-center gap-3"><span className="text-xl">{link.icon}</span> {link.name}</span>
                            <span>&rarr;</span>
                        </a>
                    )
                }
                
                const isActive = activeTab === link.id;
                return (
                <button key={link.id} onClick={() => handleNavClick(link.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}>
                    <span className="flex items-center gap-3"><span className="text-xl opacity-80">{link.icon}</span> {link.name}</span>
                </button>
                );
            })}
          </nav>
        </aside>

        <main className="flex-1 py-6 lg:py-10 px-4 lg:pl-10 w-full overflow-hidden">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {CONTENT_VIEWS[activeTab] || <div>Tab Not Found</div>}
          </div>
        </main>
      </div>
    </div>
  );
}


// import { useSession, signOut } from "next-auth/react";
// import Link from "next/link";
// import Image from "next/image"; 
// import { useEffect, useState, useMemo } from "react";
// import { useRouter } from "next/router";

// // IMPORT SEPARATED COMPONENTS & CONFIG
// import config from "../app/components/utils/config";
// import OverviewTab from "../app/components/dashboard/OverviewTab";
// import AdminBillingTab from "../app/components/dashboard/AdminBillingTab"; // NEW UNIFIED TAB
// import SubscriptionHistoryTab from "../app/components/dashboard/SubscriptionHistoryTab";
// import LeadCaptureTab from "../app/components/dashboard/LeadCaptureTab";
// import ChatHistoryTab from "../app/components/dashboard/ChatHistoryTab"; 

// const STATUS_UI = {
//   "Active": { text: "text-emerald-700", bg: "bg-emerald-100", border: "border-emerald-200", icon: "●" },
//   "Action Required": { text: "text-amber-700", bg: "bg-amber-100", border: "border-amber-200", icon: "▲" },
//   "Expired": { text: "text-rose-700", bg: "bg-rose-100", border: "border-rose-200", icon: "✕" },
//   "No Active Subscription": { text: "text-rose-700", bg: "bg-rose-100", border: "border-rose-200", icon: "✕" },
//   "Loading...": { text: "text-slate-500", bg: "bg-slate-100", border: "border-slate-200", icon: "..." },
//   "Default": { text: "text-slate-600", bg: "bg-slate-100", border: "border-slate-200", icon: "?" }
// };

// export default function Dashboard() {
//   const { data: session, status } = useSession();
//   const router = useRouter();
  
//   const [subStatus, setSubStatus] = useState("Loading...");
//   const [allowedBots, setAllowedBots] = useState("0");
//   const [activeTab, setActiveTab] = useState("Overview"); 
//   const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); 
  
//   const [bots, setBots] = useState([]);
//   const [totalLeadsCount, setTotalLeadsCount] = useState(0);
//   const [totalConversationsCount, setTotalConversationsCount] = useState(0); 
//   const [expireDate, setExpireDate] = useState(null);
//   const [walletBalance, setWalletBalance] = useState(0);
  
//   const [adminStats, setAdminStats] = useState({ activePlans: 0, totalInr: 0, totalUsd: 0 });

//   const isAdmin = session?.user?.isSuperAdmin === true;

//   useEffect(() => {
//     if (status === "unauthenticated") {
//       router.push("/login");
//     } else if (status === "authenticated") {
      
//       if (!isAdmin) {
//         fetch("/api/user/subscription")
//           .then(res => res.json())
//           .then(data => {
//             const currentStatus = data.subscription?.status || "No Active Subscription";
//             setSubStatus(currentStatus);
//             setExpireDate(data.subscription?.expire_date || null);
            
//             if (["No Active Subscription", "Expired", "Canceled", "Cancelled"].includes(currentStatus)) {
//               setAllowedBots("0");
//             } else {
//               const features = data.subscription?.snapshot_features || {};
//               let limit = "1";
//               if (features["MaxBot"] !== undefined) limit = features["MaxBot"];
//               else if (features["maxBot"] !== undefined) limit = features["maxBot"];
//               else if (features["Chatbots"] !== undefined) limit = features["Chatbots"];
//               else {
//                 const fallbackKey = Object.keys(features).find(k => k.toLowerCase().includes("bot"));
//                 if (fallbackKey) limit = features[fallbackKey];
//               }
//               setAllowedBots(limit);
//             }
//           })
//           .catch(() => setSubStatus("Error"));

//         fetch("/api/user/wallet")
//           .then(res => res.json())
//           .then(data => setWalletBalance(data.balance || 0))
//           .catch(err => console.error("Wallet fetch error", err));
//       }

//       if (session?.user?.id) {
//         // if (isAdmin) {
//         //   fetch("/api/payments")
//         //     .then(res => res.json())
//         //     .then(data => {
//         //       // We use a Set to automatically filter out duplicate user IDs
//         //       const uniqueUsers = new Set();
              
//         //       let subInr = 0, subUsd = 0;
//         //       let boosterInr = 0, boosterUsd = 0;

//         //       // 1. Calculate Subscription Revenue & Unique Active Users
//         //       if (data.subscriptions) {
//         //         data.subscriptions.forEach(sub => {
//         //           if (sub.status === 'Active') {
//         //              uniqueUsers.add(sub.user_id); // Add user to our unique list
//         //           }
//         //           const amount = Number(sub.amount) || 0;
//         //           if (sub.currency === 'USD') subUsd += amount;
//         //           else subInr += amount;
//         //         });
//         //       }

//         //       // 2. Calculate Booster Token Revenue
//         //       if (data.boosterOrders) {
//         //         data.boosterOrders.forEach(order => {
//         //           // Some gateways use amount_paid, some use amount
//         //           const amount = Number(order.amount || order.amount_paid) || 0;
//         //           if (order.currency === 'USD') boosterUsd += amount;
//         //           else boosterInr += amount;
//         //         });
//         //       }

//         //       // Update the state with our new metrics!
//         //       setAdminStats({ 
//         //         subRevenueInr: subInr, 
//         //         subRevenueUsd: subUsd,
//         //         boosterRevenueInr: boosterInr,
//         //         boosterRevenueUsd: boosterUsd,
//         //         uniqueActiveUsers: uniqueUsers.size 
//         //       });
//         //     })
//         //     .catch(err => console.error("Error fetching admin stats", err));
//         // }
//         if (isAdmin) {
//           fetch("/api/payments")
//             .then(res => res.json())
//             .then(data => {
//               const uniqueUsers = new Set();
//               let subInr = 0, subUsd = 0;
//               let boosterInr = 0, boosterUsd = 0;

//               // --- NEW: Analytics Data Arrays ---
//               const monthlyRevenueMap = {}; // For MRR Trend Line Chart
//               const planPopularityMap = {}; // For Plan Bar Chart

//               // 1. Process Subscriptions
//               if (data.subscriptions) {
//                 data.subscriptions.forEach(sub => {
//                   const amount = Number(sub.amount) || 0;
//                   const isUSD = sub.currency === 'USD';
                  
//                   if (sub.status === 'Active') {
//                      uniqueUsers.add(sub.user_id); 
                     
//                      // Count active users per plan for Bar Chart
//                      const planId = sub.plan_id || "Unknown";
//                      planPopularityMap[planId] = (planPopularityMap[planId] || 0) + 1;
//                   }

//                   if (isUSD) subUsd += amount;
//                   else subInr += amount;

//                   // Group MRR by Month (e.g., "Oct 2023")
//                   const date = new Date(sub.start_date);
//                   const monthYear = date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
                  
//                   if (!monthlyRevenueMap[monthYear]) {
//                     monthlyRevenueMap[monthYear] = { name: monthYear, subscriptions: 0, boosters: 0 };
//                   }
//                   // Normalizing to INR for the chart (Assuming roughly 1 USD = 83 INR for visual scale, adjust as needed)
//                   const normalizedAmount = isUSD ? amount * 83 : amount; 
//                   monthlyRevenueMap[monthYear].subscriptions += normalizedAmount;
//                 });
//               }

//               // 2. Process Boosters
//               if (data.boosterOrders) {
//                 data.boosterOrders.forEach(order => {
//                   const amount = Number(order.amount || order.amount_paid) || 0;
//                   const isUSD = order.currency === 'USD';
                  
//                   if (isUSD) boosterUsd += amount;
//                   else boosterInr += amount;

//                   // Group Booster revenue by Month
//                   const date = new Date(order.created_at || order.createdAt);
//                   if (!isNaN(date)) {
//                       const monthYear = date.toLocaleDateString('default', { month: 'short', year: 'numeric' });
//                       if (!monthlyRevenueMap[monthYear]) {
//                         monthlyRevenueMap[monthYear] = { name: monthYear, subscriptions: 0, boosters: 0 };
//                       }
//                       const normalizedAmount = isUSD ? amount * 83 : amount;
//                       monthlyRevenueMap[monthYear].boosters += normalizedAmount;
//                   }
//                 });
//               }

//               // --- Format Data for Recharts ---
//               // Sort chronological
//               const mrrChartData = Object.values(monthlyRevenueMap).sort((a, b) => new Date(a.name) - new Date(b.name));
              
//               // Revenue Split Pie Chart Data (Total INR normalized)
//               const revenueSplitData = [
//                 { name: 'Subscriptions', value: Math.round(subInr + (subUsd * 83)), color: '#4F46E5' }, // Indigo-600
//                 { name: 'Token Boosters', value: Math.round(boosterInr + (boosterUsd * 83)), color: '#10B981' } // Emerald-500
//               ];

//               // Plan Popularity Bar Chart Data
//               const planChartData = Object.keys(planPopularityMap).map(key => ({
//                 name: key.substring(0, 8) + '...', // We'll map real names later if needed, or just show IDs
//                 users: planPopularityMap[key]
//               }));

//               setAdminStats({ 
//                 subRevenueInr: subInr, subRevenueUsd: subUsd,
//                 boosterRevenueInr: boosterInr, boosterRevenueUsd: boosterUsd,
//                 uniqueActiveUsers: uniqueUsers.size,
//                 mrrChartData,        // NEW
//                 revenueSplitData,    // NEW
//                 planChartData        // NEW
//               });
//             })
//             .catch(err => console.error("Error fetching admin stats", err));
//         }
//         else {
//           fetch(`${config.apiBaseUrl}/api/websites/user/${session.user.id}/credentials`)
//             .then(res => res.json())
//             .then(async (data) => {
//               const botList = data.credentials || data.data || [];
//               setBots(botList);
              
//               let grandTotalLeads = 0;
//               let grandTotalChats = 0;
              
//               if (botList.length > 0) {
//                 for (const bot of botList) {
//                   try {
//                     const leadsRes = await fetch(`${config.apiBaseUrl}/api/chat-requests/backend-api-key/${bot.apiKey}/count`);
//                     const leadsData = await leadsRes.json();
//                     grandTotalLeads += (leadsData.count || 0);

//                     const chatsRes = await fetch(`${config.apiBaseUrl}/api/chats/apikey/${bot.apiKey}`);
//                     const chatsData = await chatsRes.json();
//                     grandTotalChats += (chatsData.count || (Array.isArray(chatsData.data) ? chatsData.data.length : 0));
                    
//                   } catch (e) { console.error("Error fetching metrics", e); }
//                 }
//               }
//               setTotalLeadsCount(grandTotalLeads);
//               setTotalConversationsCount(grandTotalChats); 
//             })
//             .catch(err => console.error("Bot fetch error", err));
//         }
//       }
//     }
//   }, [status, router, session, isAdmin]);

//   const currentStatus = STATUS_UI[subStatus] || STATUS_UI["Default"];

//   const handleNavClick = (tabId) => {
//     setActiveTab(tabId);
//     setIsMobileMenuOpen(false); 
//   };

//   const sidebarLinks = useMemo(() => {
//     return isAdmin ? [
//       { id: "Overview", name: "Overview", icon: "📊" },
//       { id: "SuperAdmin", name: "Super Admin Panel", icon: "👑", isPrimary: true, isExternal: true, href: "/api/launch-studio" },
//       { id: "Billing Management", name: "Billing Management", icon: "💳" }, // UPDATED UNIFIED LINK
//       { id: "Revenue", name: "Revenue & History", icon: "📈" },
//     ] : [
//       { id: "Overview", name: "Overview", icon: "🏠" },
//       { id: "Studio", name: "Chatbot Studio", icon: "🤖", isPrimary: true, isExternal: true, href: "/api/launch-studio" },
//       { id: "Chat History", name: "Chat History", icon: "💬" }, 
//       { id: "Lead Capture", name: "Lead Capture", icon: "🧲" }, 
//       { id: "Billing", name: "Billing History", icon: "🧾" },
//     ];
//   }, [isAdmin]);

//   const CONTENT_VIEWS = {
//     "Overview": (
//       <OverviewTab 
//         isAdmin={isAdmin} session={session} adminStats={adminStats}
//         totalConversationsCount={totalConversationsCount} totalLeadsCount={totalLeadsCount}
//         bots={bots} allowedBots={allowedBots} subStatus={subStatus} currentStatus={currentStatus}
//         handleNavClick={handleNavClick} expireDate={expireDate} walletBalance={walletBalance}
//       />
//     ),
//     "Billing Management": <AdminBillingTab />, // NEW UNIFIED TAB
//     "Billing": <SubscriptionHistoryTab isAdmin={isAdmin} />,
//     "Revenue": <SubscriptionHistoryTab isAdmin={isAdmin} />,
//     "Lead Capture": <LeadCaptureTab bots={bots} />, 
//     "Chat History": <ChatHistoryTab bots={bots} />, 
//   };

//   if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
//   if (!session) return null;

//   return (
//     <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
//       {/* TOP NAVBAR */}
//       <div className="bg-white border-b border-slate-200 px-4 lg:px-6 py-3 lg:py-4 sticky top-0 z-30 shadow-sm">
//         <div className="max-w-[1400px] mx-auto flex justify-between items-center">
          
//           <div className="flex items-center gap-3">
//             <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg focus:outline-none">
//               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
//             </button>
//             <Link href="/" className="flex items-center gap-2 lg:gap-3">
//               <Image src="/logo.png" alt="Logo" width={48} height={48} className="w-10 h-10 lg:w-12 lg:h-12 object-contain" />
//               <span className="font-bold text-xl lg:text-2xl text-indigo-600 hidden sm:block">HeyAiBot</span>
//             </Link>
//           </div>

//           <div className="flex items-center gap-4 lg:gap-6">
//             <div className="flex items-center gap-3">
//                 <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-base lg:text-lg">{session.user.name?.charAt(0)}</div>
//                 <span className="text-sm lg:text-lg text-slate-800 font-bold hidden sm:block">{session.user.name}</span>
//             </div>
//             <button onClick={async () => { await signOut({ redirect: false }); window.location.href = "/"; }} className="text-rose-600 hover:bg-rose-50 font-bold text-xs lg:text-sm border border-rose-200 px-4 py-2 lg:px-5 lg:py-2.5 rounded-xl transition-all">Sign Out</button>
//           </div>
//         </div>
//       </div>

//       <div className="flex-grow flex max-w-[1400px] mx-auto w-full relative">
        
//         {isMobileMenuOpen && (
//           <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm transition-opacity" onClick={() => setIsMobileMenuOpen(false)}></div>
//         )}

//         <aside className={`fixed lg:static top-0 left-0 h-full lg:h-auto w-72 bg-white lg:bg-transparent z-50 lg:z-auto py-6 lg:py-8 px-4 lg:px-0 lg:pr-8 border-r border-slate-200 transition-transform duration-300 flex flex-col shadow-2xl lg:shadow-none ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
//           <div className="flex justify-between items-center mb-8 px-2 lg:hidden">
//             <Link href="/" className="flex items-center gap-2">
//               <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
//               <span className="font-bold text-lg text-indigo-600">HeyAiBot</span>
//             </Link>
//             <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-rose-500 bg-slate-100 rounded-full p-2">
//               <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
//             </button>
//           </div>

//           <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-3 hidden lg:block">Dashboard</div>
          
//           <nav className="space-y-2 flex-1 overflow-y-auto pb-20 lg:pb-0">
//             {sidebarLinks.map((link) => {
//                 if (link.isPrimary && link.isExternal) {
//                     return (
//                         <a key={link.id} href={link.href} className="flex items-center justify-between px-4 py-3.5 mt-6 mb-4 rounded-xl font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:-translate-y-0.5 transition-all">
//                             <span className="flex items-center gap-3"><span className="text-xl">{link.icon}</span> {link.name}</span>
//                             <span>&rarr;</span>
//                         </a>
//                     )
//                 }
                
//                 const isActive = activeTab === link.id;
//                 return (
//                 <button key={link.id} onClick={() => handleNavClick(link.id)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all ${isActive ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'text-slate-600 hover:bg-slate-100 border border-transparent'}`}>
//                     <span className="flex items-center gap-3"><span className="text-xl opacity-80">{link.icon}</span> {link.name}</span>
//                 </button>
//                 );
//             })}
//           </nav>
//         </aside>

//         <main className="flex-1 py-6 lg:py-10 px-4 lg:pl-10 w-full overflow-hidden">
//           <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
//             {CONTENT_VIEWS[activeTab] || <div>Tab Not Found</div>}
//           </div>
//         </main>
//       </div>
//     </div>
//   );
// }