import { useState, useEffect, useMemo } from 'react';
import { 
    ComposedChart, AreaChart, Area, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
} from 'recharts';
import config from "../utils/config";

// ✅ Defined outside component to prevent re-render crashes
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 min-w-[180px]">
                <p className="text-xs font-bold text-slate-500 mb-2 pb-1.5 border-b border-slate-100">{label}</p>
                {payload.map((entry, index) => (
                    <div key={index} className="flex justify-between items-center mb-1 gap-4">
                        <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: entry.color }}>
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
                            {entry.name}
                        </span>
                        <span className="text-sm font-black text-slate-800">
                            {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// ✅ FIX 1: Changed prop from `apiKey` to `bots` — the correct source of bot API keys
export default function UserAnalyticsTab({ bots }) {

    // --- Bot Selection State (mirroring LeadCaptureTab pattern) ---
    const [activeBotKey, setActiveBotKey] = useState(bots?.length > 0 ? bots[0].apiKey : null);

    // Sync if bots prop loads after initial render (session/fetch delay)
    useEffect(() => {
        if (!activeBotKey && bots?.length > 0) {
            setActiveBotKey(bots[0].apiKey);
        }
    }, [bots, activeBotKey]);

    // --- Core Analytics State ---
    const [range, setRange] = useState('7d'); 
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ FIX 2: Reset data when bot changes so stale data isn't shown
    useEffect(() => {
        setData(null);
        setError(null);
    }, [activeBotKey]);

    // ✅ FIX 3: Use activeBotKey (the selected bot's API key), not session.user.apiKey
    // ✅ FIX 4: Use config.apiBaseUrl instead of hardcoded https://backend-chat1.vercel.app
    useEffect(() => {
        if (!activeBotKey) {
            setLoading(false);
            return;
        }
        
        setLoading(true);
        setError(null);

        const url = `${config.apiBaseUrl}/analytics/graph?apiKey=${activeBotKey}&backendApiKey=${activeBotKey}&range=${range}&source=both`;

        fetch(url)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch chatbot analytics");
                return res.json();
            })
            .then(resData => {
                if (!resData.success) throw new Error(resData.error || "API returned success: false");
                setData(resData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, [range, activeBotKey]);

    // --- Data Transformation ---
    const mergedGraph = useMemo(() => {
        if (!data) return [];
        const chatsGraph = data.chats?.graph || [];
        const leadsGraph = data.leads?.graph || [];
        return chatsGraph.map((chatPoint, index) => {
            const leadPoint = leadsGraph[index] || {};
            return {
                label: chatPoint.label,
                messages: chatPoint.messages || 0,
                userTokens: chatPoint.userTokens || 0,
                botTokens: chatPoint.botTokens || 0,
                totalTokens: chatPoint.tokens || 0,
                leads: leadPoint.totalLeads || leadPoint.leads || leadPoint.total || 0, 
            };
        });
    }, [data]);

    const leadStatusData = useMemo(() => {
        if (!data?.leads?.summary?.byStatus) return [];
        const status = data.leads.summary.byStatus;
        return [
            { name: 'Pending',   value: status.pending   || 0, color: '#F59E0B' },
            { name: 'Confirmed', value: status.confirmed  || 0, color: '#3B82F6' },
            { name: 'Completed', value: status.completed  || 0, color: '#10B981' },
            { name: 'Cancelled', value: status.cancelled  || 0, color: '#EF4444' }
        ].filter(item => item.value > 0); 
    }, [data]);

    // --- Empty State: No bots created yet ---
    if (!bots || bots.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-slate-200 shadow-sm border-dashed">
                <div className="text-4xl mb-4">🤖</div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">No Bots Found</h2>
                <p className="text-slate-500 text-center max-w-md">Create a bot in the Studio to start seeing analytics here.</p>
            </div>
        );
    }

    const activeBot = bots.find(b => b.apiKey === activeBotKey);

    return (
        <div className="w-full max-w-[1400px] mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* --- HEADER: Bot Selector + Time Range Controls --- */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    
                    {/* Left: Title + Bot Selector */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
                        <h2 className="text-lg font-black text-slate-800 flex items-center gap-2 whitespace-nowrap">
                            🤖 Chatbot Performance
                        </h2>

                        {/* ✅ Bot Selector — only shown if user has more than one bot */}
                        {bots.length > 1 && (
                            <select
                                value={activeBotKey || ""}
                                onChange={(e) => setActiveBotKey(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 bg-white shadow-sm focus:outline-none focus:border-indigo-500 w-full sm:w-auto"
                            >
                                {bots.map(b => (
                                    <option key={b.apiKey} value={b.apiKey}>{b.websiteName}</option>
                                ))}
                            </select>
                        )}

                        {/* Show current bot name as a badge if only one bot */}
                        {bots.length === 1 && (
                            <span className="inline-block bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold">
                                {activeBot?.websiteName}
                            </span>
                        )}
                    </div>

                    {/* Right: Time Range Buttons */}
                    <div className="flex bg-slate-200/60 p-1 rounded-lg w-full sm:w-auto overflow-x-auto shrink-0">
                        {[
                            { id: '24h', label: 'Last 24h' },
                            { id: '7d',  label: '7 Days'   },
                            { id: '30d', label: '30 Days'  },
                            { id: '1y',  label: '1 Year'   },
                            { id: 'all', label: 'All Time' }
                        ].map(t => (
                            <button
                                key={t.id}
                                onClick={() => setRange(t.id)}
                                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                                    range === t.id
                                        ? 'bg-white text-indigo-600 shadow-sm'
                                        : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="p-5">
                    {loading || !data ? (
                        <div className="flex justify-center items-center h-[300px]">
                            <div className="animate-spin w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-rose-50 text-rose-600 p-6 rounded-xl text-sm font-bold border border-rose-100 h-[300px] flex items-center justify-center">
                            Failed to load analytics: {error}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in duration-500">
                            
                            {/* --- 1. QUICK STATS SCORECARDS --- */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="bg-slate-50 rounded-xl p-4 md:p-5 border border-slate-200">
                                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <span>💬</span> Total Sessions
                                    </div>
                                    <div className="text-2xl lg:text-3xl font-black text-slate-900">
                                        {data.chats.summary.totalSessions.toLocaleString()}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-500 mt-1">
                                        {data.chats.summary.totalMessages.toLocaleString()} total messages
                                    </div>
                                </div>
                                
                                <div className="bg-emerald-50/50 rounded-xl p-4 md:p-5 border border-emerald-100">
                                    <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <span>🎯</span> Leads Captured
                                    </div>
                                    <div className="text-2xl lg:text-3xl font-black text-emerald-700">
                                        {data.leads.summary.totalLeads.toLocaleString()}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-500 mt-1">Potential customers</div>
                                </div>

                                <div className="bg-indigo-50/50 rounded-xl p-4 md:p-5 border border-indigo-100">
                                    <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <span>📈</span> Conversion Rate
                                    </div>
                                    <div className="text-2xl lg:text-3xl font-black text-indigo-700">
                                        {data.leads.summary.conversionRate}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-500 mt-1">Sessions to Leads</div>
                                </div>

                                <div className="bg-amber-50/50 rounded-xl p-4 md:p-5 border border-amber-100">
                                    <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                                        <span>⚡</span> Tokens Burned
                                    </div>
                                    <div className="text-2xl lg:text-3xl font-black text-amber-600">
                                        {data.chats.summary.totalTokens.toLocaleString()}
                                    </div>
                                    <div className="text-[11px] font-medium text-slate-500 mt-1">AI computation cost</div>
                                </div>
                            </div>

                            {/* --- 2. ENGAGEMENT VS CONVERSION CHART --- */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
                                <div className="mb-4">
                                    <h3 className="text-base font-black text-slate-800">Engagement vs. Conversions</h3>
                                </div>
                                <div className="h-[390px] min-h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <ComposedChart data={mergedGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 600 }} dy={10} />
                                            <YAxis yAxisId="left"  orientation="left"  axisLine={false} tickLine={false} tick={{ fill: '#4F46E5', fontSize: 11, fontWeight: 700 }} />
                                            <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#10B981', fontSize: 11, fontWeight: 700 }} />
                                            <RechartsTooltip content={<CustomTooltip />} />
                                            <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} iconType="circle" />
                                            <Line yAxisId="left"  type="monotone" dataKey="messages" name="Total Messages"  stroke="#4F46E5" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                            <Line yAxisId="right" type="monotone" dataKey="leads"    name="Leads Captured" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                        </ComposedChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* --- 3. TOKENS & LEAD STATUS PIPELINE --- */}
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                
                                {/* Token Consumption */}
                                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
                                    <div className="mb-4">
                                        <h3 className="text-base font-black text-slate-800">Token Consumption</h3>
                                    </div>
                                    <div className="h-[240px] min-h-[240px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={mergedGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} iconType="circle" />
                                                <Area type="monotone" dataKey="userTokens" stackId="1" name="User Prompt Tokens" stroke="#818CF8" fill="#C7D2FE" />
                                                <Area type="monotone" dataKey="botTokens"  stackId="1" name="Bot Output Tokens"  stroke="#4F46E5" fill="#818CF8" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Lead Status Pipeline Donut */}
                                <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center">
                                    <h3 className="text-base font-black text-slate-800 mb-2 w-full text-left">Lead Pipeline</h3>
                                    
                                    {leadStatusData.length === 0 ? (
                                        <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                                            <div className="text-3xl mb-2">📭</div>
                                            <p className="text-xs font-medium">No leads captured yet.</p>
                                        </div>
                                    ) : (
                                        <div className="h-[220px] min-h-[220px] w-full relative">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <PieChart>
                                                    <Pie data={leadStatusData} innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
                                                        {leadStatusData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                                        ))}
                                                    </Pie>
                                                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
                                                    <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-30px]">
                                                <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
                                                <div className="text-xl font-black text-slate-900">{data.leads.summary.totalLeads}</div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
// import { useState, useEffect, useMemo } from 'react';
// import { 
//     ComposedChart, AreaChart, Area, Line, Bar, XAxis, YAxis, CartesianGrid, 
//     Tooltip as RechartsTooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell 
// } from 'recharts';

// // ✅ MOVED OUTSIDE: Prevents the component from crashing on re-renders!
// const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//         return (
//             <div className="bg-white p-3 rounded-lg shadow-lg border border-slate-100 min-w-[180px]">
//                 <p className="text-xs font-bold text-slate-500 mb-2 pb-1.5 border-b border-slate-100">{label}</p>
//                 {payload.map((entry, index) => (
//                     <div key={index} className="flex justify-between items-center mb-1 gap-4">
//                         <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: entry.color }}>
//                             <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: entry.color }}></div>
//                             {entry.name}
//                         </span>
//                         <span className="text-sm font-black text-slate-800">
//                             {entry.value.toLocaleString()}
//                         </span>
//                     </div>
//                 ))}
//             </div>
//         );
//     }
//     return null;
// };

// export default function UserAnalyticsTab({ apiKey }) {
//     // 1. Core State
//     const [range, setRange] = useState('7d'); 
//     const [data, setData] = useState(null);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);

//     const activeApiKey = apiKey;

//     // 2. Fetch Engine
//     useEffect(() => {
//         if (!activeApiKey) return;
        
//         setLoading(true);
//         setError(null);

//         const url = `https://backend-chat1.vercel.app/analytics/graph?apiKey=${activeApiKey}&backendApiKey=${activeApiKey}&range=${range}&source=both`;

//         fetch(url)
//             .then(res => {
//                 if (!res.ok) throw new Error("Failed to fetch chatbot analytics");
//                 return res.json();
//             })
//             .then(resData => {
//                 if (!resData.success) throw new Error(resData.error || "API returned success: false");
//                 setData(resData);
//                 setLoading(false);
//             })
//             .catch(err => {
//                 console.error(err);
//                 setError(err.message);
//                 setLoading(false);
//             });
//     }, [range, activeApiKey]);

//     // 3. Data Transformation 
//     const mergedGraph = useMemo(() => {
//         if (!data) return [];
        
//         const chatsGraph = data.chats?.graph || [];
//         const leadsGraph = data.leads?.graph || [];
        
//         return chatsGraph.map((chatPoint, index) => {
//             const leadPoint = leadsGraph[index] || {};
//             return {
//                 label: chatPoint.label,
//                 messages: chatPoint.messages || 0,
//                 userTokens: chatPoint.userTokens || 0,
//                 botTokens: chatPoint.botTokens || 0,
//                 totalTokens: chatPoint.tokens || 0,
//                 leads: leadPoint.totalLeads || leadPoint.leads || leadPoint.total || 0, 
//             };
//         });
//     }, [data]);

//     const leadStatusData = useMemo(() => {
//         if (!data?.leads?.summary?.byStatus) return [];
//         const status = data.leads.summary.byStatus;
//         return [
//             { name: 'Pending', value: status.pending || 0, color: '#F59E0B' },   
//             { name: 'Confirmed', value: status.confirmed || 0, color: '#3B82F6' }, 
//             { name: 'Completed', value: status.completed || 0, color: '#10B981' }, 
//             { name: 'Cancelled', value: status.cancelled || 0, color: '#EF4444' }  
//         ].filter(item => item.value > 0); 
//     }, [data]);

//     return (
//         <div className="w-full max-w-[1400px] mx-auto">
//             <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
//                 {/* --- HEADER & CONTROLS (Scaled Down) --- */}
//                 <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
//                     <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
//                         🤖 Chatbot Performance
//                     </h2>
                    
//                     <div className="flex bg-slate-200/60 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
//                         {[
//                             { id: '24h', label: 'Last 24h' },
//                             { id: '7d', label: '7 Days' },
//                             { id: '30d', label: '30 Days' },
//                             { id: '1y', label: '1 Year' },
//                             { id: 'all', label: 'All Time' }
//                         ].map(t => (
//                             <button
//                                 key={t.id}
//                                 onClick={() => setRange(t.id)}
//                                 className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
//                                     range === t.id ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
//                                 }`}
//                             >
//                                 {t.label}
//                             </button>
//                         ))}
//                     </div>
//                 </div>

//                 {/* --- MAIN CONTENT AREA --- */}
//                 <div className="p-5">
//                     {loading || !data ? (
//                         <div className="flex justify-center items-center h-[300px]">
//                             <div className="animate-spin w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
//                         </div>
//                     ) : error ? (
//                         <div className="bg-rose-50 text-rose-600 p-6 rounded-xl text-sm font-bold border border-rose-100 h-[300px] flex items-center justify-center">
//                             Failed to load analytics: {error}
//                         </div>
//                     ) : (
//                         <div className="space-y-6 animate-in fade-in duration-500">
                            
//                             {/* --- 1. QUICK STATS SCORECARDS (Scaled Down) --- */}
//                             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//                                 <div className="bg-slate-50 rounded-xl p-4 md:p-5 border border-slate-200">
//                                     <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><span>💬</span> Total Sessions</div>
//                                     <div className="text-2xl lg:text-3xl font-black text-slate-900">{data.chats.summary.totalSessions.toLocaleString()}</div>
//                                     <div className="text-[11px] font-medium text-slate-500 mt-1">{data.chats.summary.totalMessages.toLocaleString()} total messages</div>
//                                 </div>
                                
//                                 <div className="bg-emerald-50/50 rounded-xl p-4 md:p-5 border border-emerald-100">
//                                     <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><span>🎯</span> Leads Captured</div>
//                                     <div className="text-2xl lg:text-3xl font-black text-emerald-700">{data.leads.summary.totalLeads.toLocaleString()}</div>
//                                     <div className="text-[11px] font-medium text-slate-500 mt-1">Potential customers</div>
//                                 </div>

//                                 <div className="bg-indigo-50/50 rounded-xl p-4 md:p-5 border border-indigo-100">
//                                     <div className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider mb-1 flex items-center gap-1.5"><span>📈</span> Conversion Rate</div>
//                                     <div className="text-2xl lg:text-3xl font-black text-indigo-700">{data.leads.summary.conversionRate}</div>
//                                     <div className="text-[11px] font-medium text-slate-500 mt-1">Sessions to Leads</div>
//                                 </div>

//                                 <div className="bg-amber-50/50 rounded-xl p-4 md:p-5 border border-amber-100">
//                                     <div className="text-[11px] font-bold text-amber-500 uppercase tracking-wider mb-1 flex items-center gap-1.5"><span>⚡</span> Tokens Burned</div>
//                                     <div className="text-2xl lg:text-3xl font-black text-amber-600">{data.chats.summary.totalTokens.toLocaleString()}</div>
//                                     <div className="text-[11px] font-medium text-slate-500 mt-1">AI computation cost</div>
//                                 </div>
//                             </div>

//                             {/* --- 2. MAIN EVENT: ENGAGEMENT VS CONVERSION (Height Reduced) --- */}
//                             <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
//                                 <div className="mb-4">
//                                     <h3 className="text-base font-black text-slate-800">Engagement vs. Conversions</h3>
//                                 </div>

//                                 {/* ✅ ADDED min-h-[280px] to prevent Recharts -1 height crash */}
//                                 <div className="h-[390px] min-h-[280px] w-full">
//                                     <ResponsiveContainer width="100%" height="100%">
//                                         <ComposedChart data={mergedGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                                             <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                                            
//                                             <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#4F46E5', fontSize: 11, fontWeight: 700}} />
//                                             <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#10B981', fontSize: 11, fontWeight: 700}} />
                                            
//                                             <RechartsTooltip content={<CustomTooltip />} />
//                                             <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} iconType="circle" />
                                            
//                                             <Line yAxisId="left" type="monotone" dataKey="messages" name="Total Messages" stroke="#4F46E5" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
//                                             <Line yAxisId="right" type="monotone" dataKey="leads" name="Leads Captured" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
//                                         </ComposedChart>
//                                     </ResponsiveContainer>
//                                 </div>
//                             </div>

//                             {/* --- 3. BOTTOM ROW: TOKENS & LEAD STATUS --- */}
//                             <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                
//                                 {/* Token Burn Analysis */}
//                                 <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm lg:col-span-2">
//                                     <div className="mb-4">
//                                         <h3 className="text-base font-black text-slate-800">Token Consumption</h3>
//                                     </div>
//                                     <div className="h-[240px] min-h-[240px] w-full">
//                                         <ResponsiveContainer width="100%" height="100%">
//                                             <AreaChart data={mergedGraph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
//                                                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
//                                                 <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} dy={10} />
//                                                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
//                                                 <RechartsTooltip content={<CustomTooltip />} />
//                                                 <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} iconType="circle" />
                                                
//                                                 <Area type="monotone" dataKey="userTokens" stackId="1" name="User Prompt Tokens" stroke="#818CF8" fill="#C7D2FE" />
//                                                 <Area type="monotone" dataKey="botTokens" stackId="1" name="Bot Output Tokens" stroke="#4F46E5" fill="#818CF8" />
//                                             </AreaChart>
//                                         </ResponsiveContainer>
//                                     </div>
//                                 </div>

//                                 {/* Lead Status Pipeline (Donut shrunk slightly) */}
//                                 <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col items-center">
//                                     <h3 className="text-base font-black text-slate-800 mb-2 w-full text-left">Lead Pipeline</h3>
                                    
//                                     {leadStatusData.length === 0 ? (
//                                         <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
//                                             <div className="text-3xl mb-2">📭</div>
//                                             <p className="text-xs font-medium">No leads captured yet.</p>
//                                         </div>
//                                     ) : (
//                                         <div className="h-[220px] min-h-[220px] w-full relative">
//                                             <ResponsiveContainer width="100%" height="100%">
//                                                 <PieChart>
//                                                     <Pie data={leadStatusData} innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value" stroke="none">
//                                                         {leadStatusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
//                                                     </Pie>
//                                                     <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', fontSize: '12px' }} />
//                                                     <Legend verticalAlign="bottom" height={30} iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} />
//                                                 </PieChart>
//                                             </ResponsiveContainer>
//                                             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-[-30px]">
//                                                 <div className="text-[10px] font-bold text-slate-400 uppercase">Total</div>
//                                                 <div className="text-xl font-black text-slate-900">{data.leads.summary.totalLeads}</div>
//                                             </div>
//                                         </div>
//                                     )}
//                                 </div>

//                             </div>

//                         </div>
//                     )}
//                 </div>
//             </div>
//         </div>
//     );
// }