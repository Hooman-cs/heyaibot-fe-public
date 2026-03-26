import { useState, useEffect } from "react";

export default function SubscriptionHistoryTab({ isAdmin }) {
  const [activeTab, setActiveTab] = useState("subscriptions"); // "subscriptions" | "boosters"
  const [subs, setSubs] = useState([]);
  const [boosters, setBoosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetch("/api/payments")
      .then(res => res.json())
      .then(data => {
        // Handle the new object structure from the API
        if (data && !Array.isArray(data)) {
          setSubs(data.subscriptions || []);
          setBoosters(data.boosterOrders || []);
        } else if (Array.isArray(data)) {
          // Fallback just in case old data is cached
          setSubs(data);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // Determine which dataset we are currently viewing
  const activeData = activeTab === "subscriptions" ? subs : boosters;
  
  const totalPages = Math.max(1, Math.ceil(activeData.length / itemsPerPage));
  const currentItems = activeData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // Reset page to 1 when switching tabs
  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className="p-10 text-center text-slate-500 animate-pulse">
        Loading History...
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[750px] max-h-[85vh]">
      
      {/* HEADER & TOGGLE */}
      <div className="p-6 border-b border-slate-100 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-xl font-bold text-slate-900">
          {isAdmin ? "Global Revenue & History" : "Billing History"}
        </h2>
        
        {/* Toggle Switch */}
        <div className="bg-slate-100 p-1 rounded-xl inline-flex items-center">
          <button 
            onClick={() => handleTabSwitch("subscriptions")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "subscriptions" ? "bg-white text-indigo-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
          >
            Subscription Plans
          </button>
          <button 
            onClick={() => handleTabSwitch("boosters")}
            className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === "boosters" ? "bg-white text-emerald-600 shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}
          >
            Token Boosters
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto flex-1">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead className="sticky top-0 bg-slate-50 z-10">
            <tr className="text-slate-500 text-xs uppercase tracking-wider">
              <th className="p-4 font-bold border-b border-slate-200">Date</th>
              
              {isAdmin && <th className="p-4 font-bold border-b border-slate-200">User Name</th>}
              {isAdmin && <th className="p-4 font-bold border-b border-slate-200">Email</th>}
              
              <th className="p-4 font-bold border-b border-slate-200">
                {activeTab === "subscriptions" ? "Plan Name" : "Booster Pack"}
              </th>
              
              <th className="p-4 font-bold border-b border-slate-200">Amount Paid</th>
              
              {/* Only show Tokens Added for the Boosters tab */}
              {activeTab === "boosters" && (
                  <th className="p-4 font-bold border-b border-slate-200">Tokens Added</th>
              )}

              {isAdmin && <th className="p-4 font-bold border-b border-slate-200">Gateway</th>}
              
              {/* Only Subscriptions have an Active/Expired status */}
              {activeTab === "subscriptions" && (
                <th className="p-4 font-bold border-b border-slate-200">Status</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentItems.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50 transition-colors">
                
                {/* DATE */}
                <td className="p-4 text-sm font-medium text-slate-900">
                  {new Date(activeTab === "subscriptions" ? item.start_date : item.purchase_date).toLocaleDateString()}
                </td>
                
                {/* ADMIN USER INFO */}
                {isAdmin && <td className="p-4 text-sm font-medium text-slate-800">{item.user_name}</td>}
                {isAdmin && <td className="p-4 text-sm text-slate-500">{item.user_email}</td>}
                
                {/* PRODUCT NAME */}
                <td className="p-4 text-sm text-slate-600 capitalize font-medium">
                  {activeTab === "subscriptions" ? item.plan_name : item.booster_name}
                </td>
                
                {/* AMOUNT */}
                <td className="p-4 text-sm font-bold text-slate-900">
                  {item.currency === 'USD' ? '$' : '₹'}{item.amount || item.amount_paid}
                  <span className="text-[10px] text-slate-400 font-normal ml-1 uppercase">
                    {item.currency || 'INR'}
                  </span>
                </td>

                {/* TOKENS ADDED (Boosters Only) */}
                {activeTab === "boosters" && (
                    <td className="p-4 text-sm font-bold text-emerald-600">
                        +{item.tokens_added?.toLocaleString()}
                    </td>
                )}

                {/* GATEWAY (Admin Only) */}
                {isAdmin && (
                  <td className="p-4 text-sm font-bold">
                    <span className={`px-2 py-1 rounded-md text-[10px] uppercase tracking-wider ${
                      item.gateway?.toLowerCase() === 'stripe' ? 'bg-indigo-100 text-indigo-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.gateway || "Razorpay"} 
                    </span>
                  </td>
                )}
                
                {/* STATUS (Subscriptions Only) */}
                {activeTab === "subscriptions" && (
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.status}
                    </span>
                  </td>
                )}
              </tr>
            ))}

            {activeData.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 8 : 5} className="px-6 py-10 text-center text-slate-500">
                  No {activeTab === "subscriptions" ? "subscription" : "booster"} history found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="border-t border-slate-200 bg-slate-50 p-4 flex justify-between items-center shrink-0">
          <button 
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
          >
            &larr; Prev
          </button>
          <span className="text-sm font-bold text-slate-500">
            Page {currentPage} of {totalPages}
          </span>
          <button 
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 disabled:opacity-50 hover:bg-slate-100 transition-colors"
          >
            Next &rarr;
          </button>
        </div>
      )}
    </div>
  );
}