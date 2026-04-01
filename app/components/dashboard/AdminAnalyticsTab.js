import { useState, useEffect } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';

// ✅ MOVED OUTSIDE: But now it accepts activeView and formatCurrency as explicit props!
const CustomTooltip = ({ active, payload, label, activeView, formatCurrency }) => {
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
                            {activeView === 'revenue' ? formatCurrency(entry.value) : entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function AdminAnalyticsTab() {
    const [activeView, setActiveView] = useState('revenue'); 
    const [duration, setDuration] = useState('30d'); 
    const [currency, setCurrency] = useState('USD'); 
    const [planChartType, setPlanChartType] = useState('subscriptions'); 

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        setLoading(true);
        setError(null);

        fetch(`/api/admin/analytics?range=${duration}&currency=${currency}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch analytics");
                return res.json();
            })
            .then(resData => {
                if (!resData.success) throw new Error(resData.error || "Unknown error");
                setData(resData);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
                setLoading(false);
            });
    }, [duration, currency]);

    const currSymbol = currency === 'USD' ? '$' : '₹';

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return `${currSymbol}0`;
        return `${currSymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    };

    return (
        <div className="w-full max-w-[1400px] mx-auto">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                
                {/* --- HEADER: VIEW SELECTOR --- */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        📊 Platform Analytics
                    </h2>
                    
                    <div className="flex bg-slate-200/60 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
                        {[
                            { id: 'revenue', label: '💳 Revenue', activeColor: 'bg-white text-indigo-600 shadow-sm' },
                            { id: 'users', label: '👥 Users', activeColor: 'bg-white text-emerald-600 shadow-sm' },
                            { id: 'plans', label: '📦 Plans', activeColor: 'bg-white text-amber-600 shadow-sm' }
                        ].map(view => (
                            <button
                                key={view.id}
                                onClick={() => setActiveView(view.id)}
                                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap ${
                                    activeView === view.id ? view.activeColor : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                            >
                                {view.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- CONTROLS: DURATION & CURRENCY --- */}
                <div className="p-5 pb-0 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex flex-wrap bg-slate-100 p-1 rounded-lg w-full lg:w-auto">
                        {[
                            { id: '24h', label: '24h' },
                            { id: '7d', label: '7 Days' },
                            { id: '30d', label: '30 Days' },
                            { id: '1y', label: '1 Year' },
                            { id: 'all', label: 'All Time' }
                        ].map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setDuration(t.id)} 
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                    duration === t.id ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    <div className="flex bg-slate-100 p-1 rounded-lg w-full lg:w-auto">
                        <button 
                            onClick={() => setCurrency('USD')} 
                            className={`flex-1 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                currency === 'USD' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            🌍 USD Market
                        </button>
                        <button 
                            onClick={() => setCurrency('INR')} 
                            className={`flex-1 px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                                currency === 'INR' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            🇮🇳 INR Market
                        </button>
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
                            
                            {/* --- DYNAMIC CARDS SECTION (Reduced Sizes) --- */}
                            {activeView === 'revenue' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-slate-50 rounded-xl p-4 md:p-5 border border-slate-200">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Total Revenue</div>
                                        <div className="text-2xl lg:text-3xl font-black text-slate-900">{formatCurrency(data.summary.totalRevenue)}</div>
                                    </div>
                                    <div className="bg-indigo-50/50 rounded-xl p-4 md:p-5 border border-indigo-100">
                                        <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-1">Subscriptions</div>
                                        <div className="text-2xl lg:text-3xl font-black text-indigo-700">{formatCurrency(data.summary.subRevenue)}</div>
                                    </div>
                                    <div className="bg-emerald-50/50 rounded-xl p-4 md:p-5 border border-emerald-100">
                                        <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-1">Boosters</div>
                                        <div className="text-2xl lg:text-3xl font-black text-emerald-700">{formatCurrency(data.summary.boosterRevenue)}</div>
                                    </div>
                                </div>
                            )}

                            {activeView === 'users' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                        <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Active Users</div>
                                        <div className="text-3xl font-black text-slate-900">{data.summary.activeUsers.toLocaleString()}</div>
                                        <div className="text-xs font-medium text-slate-500 mt-1">Users with active plans</div>
                                    </div>
                                    <div className="bg-blue-50/50 rounded-xl p-5 border border-blue-100">
                                        <div className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">New Signups</div>
                                        <div className="text-3xl font-black text-blue-700">+{data.summary.newUsers.toLocaleString()}</div>
                                        <div className="text-xs font-medium text-slate-500 mt-1">First-time purchases</div>
                                    </div>
                                </div>
                            )}

                            {activeView === 'plans' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-indigo-50/50 rounded-xl p-5 border border-indigo-100 flex justify-between items-center">
                                        <div>
                                            <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider mb-0.5">Top Subscription</div>
                                            <div className="text-xl font-black text-indigo-900">{data.summary.topSubPlan}</div>
                                        </div>
                                        <div className="text-3xl">👑</div>
                                    </div>
                                    <div className="bg-emerald-50/50 rounded-xl p-5 border border-emerald-100 flex justify-between items-center">
                                        <div>
                                            <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-0.5">Top Booster</div>
                                            <div className="text-xl font-black text-emerald-900">{data.summary.topBoosterPlan}</div>
                                        </div>
                                        <div className="text-3xl">🚀</div>
                                    </div>
                                </div>
                            )}

                            {/* --- DYNAMIC GRAPH SECTION --- */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5">
                                
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-base font-black text-slate-800">
                                        {activeView === 'revenue' && 'Revenue Growth'}
                                        {activeView === 'users' && 'User Acquisition'}
                                        {activeView === 'plans' && 'Plan Purchase Volume'}
                                    </h3>
                                    
                                    {activeView === 'plans' && (
                                        <div className="flex bg-slate-100 p-0.5 rounded-md">
                                            <button 
                                                onClick={() => setPlanChartType('subscriptions')}
                                                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${planChartType === 'subscriptions' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                            >
                                                Subs
                                            </button>
                                            <button 
                                                onClick={() => setPlanChartType('boosters')}
                                                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all ${planChartType === 'boosters' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                                            >
                                                Boosters
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {/* ✅ ADDED min-h-[300px] to fix the Recharts width(-1)/height(-1) warning */}
                                <div className="h-[280px] min-h-[280px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        
                                        {activeView === 'revenue' && (
                                            <LineChart data={data.graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                                                
                                                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#4F46E5', fontSize: 11}} tickFormatter={(val) => `${currSymbol}${val}`} />
                                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#10B981', fontSize: 11}} tickFormatter={(val) => `${currSymbol}${val}`} />
                                                
                                                {/* ✅ Injecting Props into CustomTooltip here! */}
                                                <RechartsTooltip content={(props) => <CustomTooltip {...props} activeView={activeView} formatCurrency={formatCurrency} />} />
                                                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} iconType="circle" />
                                                
                                                <Line yAxisId="left" type="monotone" dataKey="subRevenue" name="Subscription Revenue" stroke="#4F46E5" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                                <Line yAxisId="right" type="monotone" dataKey="boosterRevenue" name="Booster Revenue" stroke="#10B981" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                            </LineChart>
                                        )}

                                        {activeView === 'users' && (
                                            <LineChart data={data.graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                                                
                                                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#0F172A', fontSize: 11}} />
                                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#3B82F6', fontSize: 11}} />
                                                
                                                {/* ✅ Injecting Props into CustomTooltip here! */}
                                                <RechartsTooltip content={(props) => <CustomTooltip {...props} activeView={activeView} formatCurrency={formatCurrency} />} />
                                                <Legend verticalAlign="top" height={30} wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} iconType="circle" />
                                                
                                                <Line yAxisId="left" type="monotone" dataKey="activeUsers" name="Active Users" stroke="#0F172A" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                                <Line yAxisId="right" type="monotone" dataKey="newUsers" name="New Signups" stroke="#3B82F6" strokeWidth={3} dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                                            </LineChart>
                                        )}

                                        {activeView === 'plans' && (
                                            <BarChart 
                                                data={planChartType === 'subscriptions' ? data.plans.subscriptions : data.plans.boosters} 
                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11}} />
                                                
                                                {/* ✅ Injecting Props into CustomTooltip here! */}
                                                <RechartsTooltip cursor={{fill: '#f8fafc'}} content={(props) => <CustomTooltip {...props} activeView={activeView} formatCurrency={formatCurrency} />} />
                                                
                                                <Bar dataKey="purchases" name="Purchases" fill={planChartType === 'subscriptions' ? '#4F46E5' : '#10B981'} radius={[4, 4, 0, 0]} maxBarSize={60} />
                                            </BarChart>
                                        )}

                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}