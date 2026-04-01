import Link from "next/link";
import { useState, useEffect } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, ResponsiveContainer 
} from 'recharts';

export default function OverviewTab({ 
  isAdmin, 
  session, 
  adminStats, 
  totalConversationsCount, 
  totalLeadsCount, 
  bots, 
  allowedBots, 
  subStatus, 
  currentStatus, 
  handleNavClick,
  expireDate,      
  walletBalance    
}) {
  
  const formattedExpireDate = expireDate 
    ? new Date(expireDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) 
    : null;

  // --- 1. QUICK STATS CARDS ---
  const overviewCards = isAdmin 
    ? [
        { label: "Subscription Revenue", val: `₹${adminStats?.subRevenueInr || 0} | $${adminStats?.subRevenueUsd || 0}`, icon: "💳" },
        { label: "Booster Revenue", val: `₹${adminStats?.boosterRevenueInr || 0} | $${adminStats?.boosterRevenueUsd || 0}`, icon: "🚀" },
        { label: "Unique Active Users", val: adminStats?.uniqueActiveUsers?.toString() || "0", icon: "👥" }
      ]
    : [
        { label: "Total Conversations", val: totalConversationsCount?.toString() || "0", icon: "💬" },
        { label: "Leads Captured", val: totalLeadsCount?.toString() || "0", icon: "🧲" },
        { label: "Active Chatbots", val: `${bots?.length || 0} / ${allowedBots}`, icon: "🤖" },
        { label: "Token Wallet", val: walletBalance?.toLocaleString() || "0", icon: "⚡" }
      ];

  // --- 2. 30-DAY ANALYTICS FETCHING ---
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(true);
  const apiKey = session?.user?.apiKey || "a357c710-97f8-4f46-ba26-b5024d6a1c37"; // Fallback for dev

  useEffect(() => {
    setChartLoading(true);

    if (isAdmin) {
      // Admin: Fetch 30-Day USD Revenue & Users
      fetch("/api/admin/analytics?range=30d&currency=USD")
        .then(res => res.json())
        .then(resData => {
          if (resData.success && resData.graph) {
            const formattedData = resData.graph.map(point => ({
              label: point.label,
              revenue: point.subRevenue + point.boosterRevenue,
              users: point.activeUsers
            }));
            setChartData(formattedData);
          }
          setChartLoading(false);
        })
        .catch(err => {
          console.error("Failed to load admin overview chart", err);
          setChartLoading(false);
        });
    } else {
      // User: Fetch 30-Day Chats & Leads from Chatbot Backend
      const url = `https://backend-chat1.vercel.app/analytics/graph?apiKey=${apiKey}&backendApiKey=${apiKey}&range=30d&source=both`;
      fetch(url)
        .then(res => res.json())
        .then(resData => {
          if (resData.success) {
            const chatsGraph = resData.chats?.graph || [];
            const leadsGraph = resData.leads?.graph || [];
            
            const merged = chatsGraph.map((c, i) => ({
              label: c.label,
              messages: c.messages || 0,
              leads: leadsGraph[i]?.totalLeads || leadsGraph[i]?.leads || leadsGraph[i]?.total || 0
            }));
            setChartData(merged);
          }
          setChartLoading(false);
        })
        .catch(err => {
          console.error("Failed to load user overview chart", err);
          setChartLoading(false);
        });
    }
  }, [isAdmin, apiKey]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 text-sm">
          <p className="font-bold text-slate-500 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex justify-between gap-4 mb-1">
              <span className="font-semibold" style={{ color: entry.color }}>{entry.name}</span>
              <span className="font-black text-slate-800">
                {entry.name.includes("Revenue") ? `$${entry.value}` : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 lg:space-y-8 max-w-[1600px] mx-auto">
      
      {/* 1. WELCOME HEADER */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-900 tracking-tight">
            Welcome back, {session?.user?.name?.split(' ')[0] || "User"}! 👋
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            {isAdmin ? "Here is your global platform performance." : "Here is how your chatbots are performing today."}
          </p>
        </div>
        {/* ✅ FIX 1: Removed the !isAdmin check so you (Admin) can see the button too! */}
        <a href="/api/launch-studio" className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-sm transition-all hover:-translate-y-0.5 whitespace-nowrap">
          Launch Studio &rarr;
        </a>
      </div>

      {/* 2. QUICK STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        {overviewCards.map((card, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">
              <span>{card.icon}</span> {card.label}
            </div>
            <div className={`text-3xl lg:text-4xl font-black ${isAdmin && i < 2 ? 'text-indigo-600' : 'text-slate-900'}`}>
              {card.val}
            </div>
          </div>
        ))}
      </div>

      {/* 3. 30-DAY PERFORMANCE TREND */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">30-Day Performance Trend</h3>
            <p className="text-sm font-medium text-slate-500">
              {isAdmin ? "Global Revenue vs Active Users (USD)" : "Messages Processed vs Leads Captured"}
            </p>
          </div>
          <button onClick={() => handleNavClick('Analytics')} className="text-indigo-600 hover:text-indigo-800 text-sm font-bold transition-colors">
            View Full Analytics &rarr;
          </button>
        </div>

        <div className="h-[280px] w-full">
          {chartLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <div className="animate-spin w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">
              No data available for the last 30 days.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} minTickGap={30} />
                <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <RechartsTooltip content={<CustomTooltip />} />
                
                {isAdmin ? (
                  <>
                    <Area yAxisId="left" type="monotone" dataKey="revenue" name="Total Revenue" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimary)" />
                    <Area yAxisId="right" type="monotone" dataKey="users" name="Active Users" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSecondary)" />
                  </>
                ) : (
                  <>
                    <Area yAxisId="left" type="monotone" dataKey="messages" name="Total Messages" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorPrimary)" />
                    <Area yAxisId="right" type="monotone" dataKey="leads" name="Leads Captured" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSecondary)" />
                  </>
                )}
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 4. BOTTOM SECTION: PLAN STATUS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 lg:p-8 shadow-sm">
        <div className="flex flex-col lg:flex-row items-center gap-6 lg:gap-10">
          
          <div className="flex-1 w-full text-center lg:text-left">
            <h2 className="text-xs lg:text-sm font-bold text-slate-400 uppercase tracking-widest mb-2">
              {isAdmin ? "Access Level" : "Current Plan"}
            </h2>
            <div className="text-2xl lg:text-3xl font-extrabold text-slate-900 capitalize mb-2">
              {isAdmin ? "Full Access" : (session?.user?.planName || "Free Tier")}
            </div>
            
            {!isAdmin && formattedExpireDate && subStatus !== "Expired" && subStatus !== "No Active Subscription" && (
              <div className="text-sm font-medium text-slate-500 mb-4">
                Expires on: <span className="font-bold text-slate-700">{formattedExpireDate}</span>
              </div>
            )}
          </div>
          
          {isAdmin ? (
            <button onClick={() => handleNavClick('Revenue')} className="w-full lg:w-auto px-8 py-3 lg:py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm lg:text-base whitespace-nowrap">
              View Global Revenue
            </button>
          ) : (
            <Link href="/pricing" className="w-full lg:w-auto px-8 py-3 lg:py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm lg:text-base whitespace-nowrap text-center">
              Upgrade / Buy Tokens
            </Link>
          )}

          {/* ✅ FIX 2: Wrapped the Status block in an !isAdmin check so Admins don't see "Loading..." */}
          {!isAdmin && (
            <div className={`w-full lg:w-auto px-6 py-4 rounded-xl border ${currentStatus?.bg} ${currentStatus?.border} flex items-center justify-center gap-3 shadow-inner`}>
              <span className={`text-xl ${currentStatus?.text}`}>{currentStatus?.icon}</span>
              <div>
                <div className={`text-xs font-bold uppercase tracking-wider mb-0.5 ${currentStatus?.text} opacity-80`}>Status</div>
                <div className={`text-sm font-black ${currentStatus?.text}`}>{subStatus}</div>
              </div>
            </div>
          )}

        </div>
      </div>

    </div>
  );
}