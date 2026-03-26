import Link from "next/link";

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
  
  // Format the expiration date cleanly (e.g., "Oct 25, 2024")
  const formattedExpireDate = expireDate 
    ? new Date(expireDate).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) 
    : null;

  // UPDATED: Admin cards now show split revenue and unique active users
  const overviewCards = isAdmin 
    ? [
        { label: "Subscription Revenue", val: `₹${adminStats?.subRevenueInr || 0} | $${adminStats?.subRevenueUsd || 0}`, icon: "💳" },
        { label: "Booster Revenue", val: `₹${adminStats?.boosterRevenueInr || 0} | $${adminStats?.boosterRevenueUsd || 0}`, icon: "🚀" },
        { label: "Unique Active Users", val: adminStats?.uniqueActiveUsers?.toString() || "0", icon: "👥" }
      ]
    : [
        { label: "Total Conversations", val: totalConversationsCount?.toString() || "0", icon: "💬" },
        { label: "Total Leads Captured", val: totalLeadsCount?.toString() || "0", icon: "🧲" }, 
        { label: "Active Bots", val: `${bots?.length || 0} / ${allowedBots}`, icon: "🤖" },
        { label: "Booster Tokens", val: walletBalance?.toLocaleString() || "0", icon: "🚀" } 
      ];

  return (
    <>
      <div className="mb-8 lg:mb-10">
        <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tight mb-2">
          Welcome back, {session?.user?.name?.split(' ')[0]} 👋
        </h1>
        <p className="text-slate-500 text-base lg:text-lg font-medium">
          {isAdmin ? "Here is your platform overview and administrative controls." : "Here's what's happening with your AI assistants today."}
        </p>
      </div>

      {/* UPDATED GRID: Admins get 3 columns (md:grid-cols-3) to fit the new cards */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${isAdmin ? 'md:grid-cols-3' : 'lg:grid-cols-4'} gap-4 lg:gap-6 mb-10`}>
        {overviewCards.map((stat, i) => (
          <div key={i} className="bg-white p-5 lg:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <div className="flex justify-between items-start mb-4">
                <div className="text-xs lg:text-sm font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                <div className="text-xl lg:text-2xl opacity-50">{stat.icon}</div>
            </div>
            <div className="text-3xl lg:text-4xl font-extrabold text-slate-900">{stat.val}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-to-br from-indigo-900 via-indigo-800 to-blue-900 p-6 lg:p-8 rounded-3xl shadow-xl border border-indigo-700 relative overflow-hidden text-white">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-500 opacity-20 rounded-full blur-3xl"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 lg:w-14 lg:h-14 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center text-2xl lg:text-3xl mb-6">
              {isAdmin ? "⚙️" : "🤖"}
            </div>
            <h2 className="text-2xl lg:text-3xl font-extrabold mb-3">
              {isAdmin ? "Platform Configuration" : "Launch Chatbot Studio"}
            </h2>
            <p className="text-indigo-200 mb-8 max-w-lg text-base lg:text-lg font-light">
              {isAdmin 
                ? "Manage your SaaS pricing tiers, feature flags, and global platform settings."
                : "Enter the studio to build, train, and configure your AI agents. Update your knowledge base or create a new bot."}
            </p>
            
            {isAdmin ? (
              <div className="flex flex-wrap gap-3">
                <a href="/api/launch-studio" className="inline-flex items-center px-6 lg:px-8 py-3 lg:py-4 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 hover:scale-105 transition-all text-sm lg:text-base">
                  Open Super Admin &rarr;
                </a>
                <button onClick={() => handleNavClick("Billing Management")} className="inline-flex items-center px-6 lg:px-8 py-3 lg:py-4 bg-indigo-800/50 text-white rounded-xl font-bold hover:bg-indigo-800 transition-all text-sm lg:text-base">
                  Manage Plans
                </button>
              </div>
            ) : (
              <a href="/api/launch-studio" className="inline-flex items-center px-6 lg:px-8 py-3 lg:py-4 bg-white text-indigo-900 rounded-xl font-bold hover:bg-indigo-50 hover:scale-105 transition-all text-sm lg:text-base">
                Open Studio &rarr;
              </a>
            )}
          </div>
        </div>

        <div className="bg-white p-6 lg:p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col relative">
          <div className="flex-1">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
              <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-2xl">
                {isAdmin ? "👑" : "💳"}
              </div>
              {!isAdmin && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${currentStatus.bg} ${currentStatus.text} ${currentStatus.border}`}>
                    {subStatus}
                </span>
              )}
            </div>
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
            <button onClick={() => handleNavClick('Revenue')} className="w-full text-center py-3 lg:py-4 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all text-sm lg:text-base">
              View Global Revenue
            </button>
          ) : (
            <Link href="/pricing" className="w-full text-center py-3 lg:py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all text-sm lg:text-base">
              Upgrade / Buy Tokens
            </Link>
          )}
        </div>
      </div>
      {/* Put this right under the grid of Top Cards
      {isAdmin && (
         <AdminAnalyticsCharts stats={adminStats} />
      )} */}
    </>
  );
}