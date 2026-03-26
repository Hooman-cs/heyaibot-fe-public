import { useState, useEffect } from "react";
import config from "../utils/config";

const LEAD_STATUS_COLORS = {
  "pending": "bg-amber-100 text-amber-700 border-amber-200",
  "confirmed": "bg-blue-100 text-blue-700 border-blue-200",
  "completed": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "cancelled": "bg-rose-100 text-rose-700 border-rose-200",
  "canceled": "bg-rose-100 text-rose-700 border-rose-200"
};

export default function LeadCaptureTab({ bots }) {
  // Use the first bot as default if available
  const [activeBotKey, setActiveBotKey] = useState(bots.length > 0 ? bots[0].apiKey : null);

  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const leadsPerPage = 15;

  // Sync state if bots prop loads late
  useEffect(() => {
    if (!activeBotKey && bots.length > 0) {
      setActiveBotKey(bots[0].apiKey);
    }
  }, [bots, activeBotKey]);

  useEffect(() => {
    if (!activeBotKey) return;
    setLoading(true);
    setSelectedLead(null);

    // Fetch leads for the selected bot
    fetch(`${config.apiBaseUrl}/api/chat-requests/backend-api-key/${activeBotKey}`)
      .then(res => res.json())
      .then(data => {
        const fetchedLeads = Array.isArray(data) ? data : (data.chatRequests || data.data || data.requests || data.leads || []);

        // Sort by newest first (checking multiple possible date keys)
        const sortedLeads = fetchedLeads.sort((a, b) => {
          const dateA = new Date(a.createdAt || a.timestamp || a.date || 0);
          const dateB = new Date(b.createdAt || b.timestamp || b.date || 0);
          return dateB - dateA;
        });

        setLeads(sortedLeads);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeBotKey]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, activeBotKey]);

  const handleUpdateStatus = async (leadId, newStatus) => {
    if (!newStatus) return;
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${config.apiBaseUrl}/api/chat-requests/${leadId}/status`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });

      if (res.ok) {
        setLeads(prev => prev.map(l => l.id === leadId ? { ...l, status: newStatus } : l));
        if (selectedLead?.id === leadId) setSelectedLead(prev => ({ ...prev, status: newStatus }));
      } else {
        alert("Failed to update status. Please try again.");
      }
    } catch (err) {
      console.error("Error updating status:", err);
      alert("An error occurred while updating status.");
    }
    setUpdatingStatus(false);
  };

  const getLeadTitle = (dataObj) => {
    if (!dataObj) return "Unknown Lead";
    return dataObj.name || dataObj["Your Name"] || dataObj.email || dataObj.Phone || "New Visitor";
  };

  // Robust Date Formatter to catch any key your API uses
  const formatLeadDate = (lead) => {
    const rawDate = lead.createdAt || lead.timestamp || lead.date;
    if (!rawDate) return "Unknown Date";
    try {
      return new Date(rawDate).toLocaleString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
        hour: 'numeric', minute: '2-digit', hour12: true
      });
    } catch (e) {
      return "Invalid Date";
    }
  };

  if (bots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed m-4">
        <div className="text-4xl mb-4">🤖</div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No Bots Found</h2>
        <p className="text-slate-500 text-center max-w-md">You need to create a bot in the Studio before you can capture leads.</p>
      </div>
    );
  }

  const filteredLeads = leads.filter(lead => {
    const matchStatus = filterStatus === 'all' || lead.status === filterStatus;
    const searchString = JSON.stringify(lead.collectedData || {}).toLowerCase();
    const matchSearch = searchTerm === '' || searchString.includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / leadsPerPage));
  const currentLeads = filteredLeads.slice((currentPage - 1) * leadsPerPage, currentPage * leadsPerPage);

  const currentBot = bots.find(b => b.apiKey === activeBotKey);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-[750px] max-h-[85vh]">

      {/* Split Pane View */}
      <div className="flex flex-1 overflow-hidden relative">

        {/* Left List Pane */}
        <div className={`w-full md:w-1/3 border-r border-slate-200 bg-white flex-col ${selectedLead ? 'hidden md:flex' : 'flex'}`}>

          {/* Bot & Status Filters Area */}
          <div className="p-4 border-b border-slate-200 bg-slate-50 shrink-0 space-y-4">

            {/* Top Area: Bot Selection & Lead Count below it */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Bot</label>
              <select
                value={activeBotKey || ""}
                onChange={(e) => setActiveBotKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:outline-none focus:border-indigo-500 bg-white shadow-sm mb-2"
              >
                {bots.map(b => (
                  <option key={b.apiKey} value={b.apiKey}>{b.websiteName}</option>
                ))}
              </select>

              {/* MOVED: Absolute Total Count is now below the dropdown */}
              <div className="inline-block bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-black tracking-wide">
                Total Leads: {leads.length}
              </div>
            </div>

            {/* Bottom Area: Search and Filter */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-[110px] px-2 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-indigo-500 capitalize bg-white"
              >
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Show filter context if searching/filtering */}
            {(searchTerm || filterStatus !== 'all') && (
              <div className="text-xs text-slate-500 font-medium text-right mt-1">
                Showing {filteredLeads.length} of {leads.length}
              </div>
            )}
          </div>

          {/* List Area */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-slate-500 animate-pulse">Loading leads...</div>
            ) : filteredLeads.length === 0 ? (
              <div className="p-8 text-center text-slate-400 mt-10">
                <span className="text-3xl block mb-2">📭</span>
                No leads match criteria.
              </div>
            ) : (
              currentLeads.map((lead) => {
                const isSelected = selectedLead?.id === lead.id;
                const statusColor = LEAD_STATUS_COLORS[lead.status] || 'bg-slate-100 text-slate-600 border-slate-200';

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelectedLead(lead)}
                    className={`p-4 sm:p-5 border-b border-slate-100 cursor-pointer transition-all ${isSelected ? 'bg-indigo-50/50 border-l-4 border-l-indigo-600' : 'hover:bg-slate-50 border-l-4 border-l-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-slate-900 truncate pr-3 text-base capitalize">
                        {getLeadTitle(lead.collectedData)}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${statusColor}`}>
                        {lead.status || 'new'}
                      </span>
                    </div>
                    {/* UPDATED ROBUST DATE */}
                    <div className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
                      <span>🕒</span> {formatLeadDate(lead)}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="border-t border-slate-200 bg-slate-50 p-3 flex justify-between items-center shrink-0">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 disabled:opacity-50">&larr;</button>
              <span className="text-xs font-bold text-slate-500">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="px-3 py-1 bg-white border border-slate-200 rounded text-sm text-slate-600 disabled:opacity-50">&rarr;</button>
            </div>
          )}
        </div>

        {/* Right Details Pane */}
        <div className={`w-full md:w-2/3 bg-slate-50/50 overflow-y-auto flex-col relative ${selectedLead ? 'flex' : 'hidden md:flex'}`}>
          {!selectedLead ? (
            <div className="m-auto flex flex-col items-center justify-center text-slate-400 p-10 text-center">
              <div className="text-6xl mb-4 opacity-50">📱</div>
              <h3 className="text-xl font-bold text-slate-600 mb-2">Select a Lead</h3>
              <p>Click on a chat request from the list to view their full details and manage their status.</p>
            </div>
          ) : (
            <div className="p-4 sm:p-8">

              <button
                onClick={() => setSelectedLead(null)}
                className="md:hidden mb-6 flex items-center gap-2 text-sm font-bold text-slate-700 bg-white border border-slate-200 px-4 py-2 rounded-xl shadow-sm hover:bg-slate-50"
              >
                &larr; Back to Leads List
              </button>

              <div className="flex flex-col xl:flex-row justify-between items-start mb-8 pb-6 border-b border-slate-200 gap-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 capitalize">{getLeadTitle(selectedLead.collectedData)}</h3>
                  <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2">
                    <span>🤖</span> Bot: {currentBot?.websiteName}
                  </div>
                  {/* UPDATED ROBUST DATE IN DETAILS */}
                  <div className="text-sm text-slate-500 font-medium mb-1 flex items-center gap-2">
                    <span>🕒</span> Captured on: {formatLeadDate(selectedLead)}
                  </div>
                  <div className="text-xs text-slate-400 font-mono break-all mt-2">ID: {selectedLead.id}</div>
                </div>

                <div className="flex flex-col w-full xl:w-auto">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Update Status</label>
                  <select
                    value={selectedLead.status}
                    onChange={(e) => handleUpdateStatus(selectedLead.id, e.target.value)}
                    disabled={updatingStatus}
                    className={`px-4 py-2 border rounded-xl font-bold uppercase text-sm cursor-pointer shadow-sm outline-none transition-all ${LEAD_STATUS_COLORS[selectedLead.status] || 'border-slate-200 bg-white text-slate-700'}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                  <span>📋</span> Captured Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(selectedLead.collectedData || {}).map(([key, value]) => (
                    <div key={key} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col break-words">
                      <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-2">{key}</span>
                      <span className="text-slate-800 font-medium text-base whitespace-pre-wrap">{String(value || "—")}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}