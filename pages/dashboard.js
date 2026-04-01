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
import UserAnalyticsTab from "../app/components/dashboard/UserAnalyticsTab";

// ✅ RESTORED: Required for OverviewTab colors
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

  // --- RESTORED ALL UI & DATA STATES ---
  const [subStatus, setSubStatus] = useState("Loading...");
  const [allowedBots, setAllowedBots] = useState("0");
  const [activeTab, setActiveTab] = useState("Overview");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [bots, setBots] = useState([]);
  const [totalLeadsCount, setTotalLeadsCount] = useState(0);
  const [totalConversationsCount, setTotalConversationsCount] = useState(0);
  const [expireDate, setExpireDate] = useState(null);
  const [walletBalance, setWalletBalance] = useState(0);

  const [adminStats, setAdminStats] = useState({ activePlans: 0, totalInr: 0, totalUsd: 0 });

  const isAdmin = session?.user?.isSuperAdmin === true;

  // --- DATA FETCHING (Your original logic exactly) ---
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      
      // 1. Fetch Normal User Data
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

      // 2. Fetch Admin Data (Lightweight Version)
      if (session?.user?.id && isAdmin) {
        fetch("/api/payments")
          .then(res => res.json())
          .then(data => {
            const uniqueUsers = new Set();
            let subInr = 0, subUsd = 0;
            let boosterInr = 0, boosterUsd = 0;

            if (data.subscriptions) {
              data.subscriptions.forEach(sub => {
                const amount = Number(sub.amount) || 0;
                if (sub.status === 'Active') uniqueUsers.add(sub.user_id);
                if (sub.currency === 'USD') subUsd += amount;
                else subInr += amount;
              });
            }

            if (data.boosterOrders) {
              data.boosterOrders.forEach(order => {
                const amount = Number(order.amount || order.amount_paid) || 0;
                if (order.currency === 'USD') boosterUsd += amount;
                else boosterInr += amount;
              });
            }

            setAdminStats({
              subRevenueInr: subInr, subRevenueUsd: subUsd,
              boosterRevenueInr: boosterInr, boosterRevenueUsd: boosterUsd,
              uniqueActiveUsers: uniqueUsers.size
            });
          })
          .catch(err => console.error("Error fetching admin stats", err));
      }
    }
  }, [status, router, session, isAdmin]);

  const currentStatus = STATUS_UI[subStatus] || STATUS_UI["Default"];

  const handleNavClick = (tabId) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false);
  };

  // --- RESTORED: Your original navigation links including the external Studio button ---
  const sidebarLinks = useMemo(() => {
    return isAdmin ? [
      { id: "Overview", name: "Overview", icon: "📊" },
      { id: "SuperAdmin", name: "Super Admin Panel", icon: "👑", isPrimary: true, isExternal: true, href: "/api/launch-studio" },
      { id: "Analytics", name: "Detailed Analytics", icon: "📊" },
      { id: "Billing Management", name: "Billing Management", icon: "💳" }, 
      { id: "Revenue", name: "Revenue & History", icon: "📈" },
    ] : [
      { id: "Overview", name: "Overview", icon: "🏠" },
      { id: "Studio", name: "Chatbot Studio", icon: "🤖", isPrimary: true, isExternal: true, href: "/api/launch-studio" },
      { id: "Analytics", name: "Detailed Analytics", icon: "📊" },
      { id: "Chat History", name: "Chat History", icon: "💬" },
      { id: "Lead Capture", name: "Lead Capture", icon: "🧲" },
      { id: "Billing", name: "Billing History", icon: "🧾" },
    ];
  }, [isAdmin]);

  // --- RESTORED: Passed ALL original props down to OverviewTab to prevent crashes ---
  const CONTENT_VIEWS = {
    "Overview": (
      <OverviewTab
        isAdmin={isAdmin} session={session} adminStats={adminStats}
        totalConversationsCount={totalConversationsCount} totalLeadsCount={totalLeadsCount}
        bots={bots} allowedBots={allowedBots} subStatus={subStatus} currentStatus={currentStatus}
        handleNavClick={handleNavClick} expireDate={expireDate} walletBalance={walletBalance}
      />
    ),
    "Billing Management": <AdminBillingTab />,
    "Billing": <SubscriptionHistoryTab isAdmin={isAdmin} />,
    "Revenue": <SubscriptionHistoryTab isAdmin={isAdmin} />,
    "Lead Capture": <LeadCaptureTab bots={bots} />,
    "Chat History": <ChatHistoryTab bots={bots} />,
    "Analytics": isAdmin ? <AdminAnalyticsTab /> : <UserAnalyticsTab apiKey={session?.user?.apiKey} />
  };

  if (status === "loading") return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div></div>;
  if (!session) return null;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      
      {/* 1. MOBILE OVERLAY */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* 2. FIXED APP SHELL SIDEBAR */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-slate-200 shadow-2xl lg:shadow-none transform transition-transform duration-300 ease-in-out flex flex-col ${
          isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex justify-between items-center h-20 px-6 border-b border-slate-100">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="w-8 h-8 object-contain" />
            <span className="font-black text-xl tracking-tight text-indigo-950">HeyAiBot</span>
          </Link>
          <button 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="lg:hidden text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1.5 custom-scrollbar">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-2 hidden lg:block">Dashboard</div>
          
          {sidebarLinks.map((link) => {
            // RESTORED: Proper handling of your external Studio links
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
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-200 ${
                  isActive 
                    ? "bg-indigo-50 text-indigo-700 shadow-sm border border-indigo-100/50" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
                }`}
              >
                <span className={`flex items-center gap-3 transition-transform ${isActive ? "scale-105" : ""}`}>
                  <span className={`text-xl ${isActive ? "" : "opacity-80"}`}>{link.icon}</span> 
                  {link.name}
                </span>
              </button>
            );
          })}
        </nav>

        {/* BOTTOM USER PROFILE */}
        <div className="p-4 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
            <div className="flex items-center gap-3 mb-3">
               <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">{session.user.name?.charAt(0)}</div>
               <div className="overflow-hidden">
                 <p className="text-sm font-bold text-slate-900 truncate">{session.user.name || "User"}</p>
                 <p className="text-xs font-medium text-slate-500 truncate">{session.user.email}</p>
               </div>
            </div>
            <button
              onClick={async () => { await signOut({ redirect: false }); window.location.href = "/"; }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-xl hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors shadow-sm"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* 3. MAIN CONTENT WRAPPER (Pushed right by lg:pl-72 to not hide under the fixed sidebar) */}
      <div className="lg:pl-72 flex flex-col min-h-screen">
        
        {/* MOBILE HEADER */}
        <header className="lg:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-16 bg-white border-b border-slate-200 shadow-sm">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Logo" width={28} height={28} className="w-7 h-7 object-contain" />
            <span className="font-black text-lg tracking-tight text-indigo-950">HeyAiBot</span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -mr-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto overflow-hidden">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            {CONTENT_VIEWS[activeTab] || <div>Tab Not Found</div>}
          </div>
        </main>

      </div>
    </div>
  );
}
