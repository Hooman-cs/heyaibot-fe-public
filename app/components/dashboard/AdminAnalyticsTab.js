import { useState, useEffect } from 'react';
import { 
    LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip as RechartsTooltip, ResponsiveContainer, Legend 
} from 'recharts';

export default function AdminAnalyticsTab() {
    // 1. Core State
    const [activeView, setActiveView] = useState('revenue'); // 'revenue', 'users', 'plans'
    const [duration, setDuration] = useState('30d'); // '24h', '7d', '30d', '1y', 'all'
    const [currency, setCurrency] = useState('USD'); // 'USD', 'INR'
    const [planChartType, setPlanChartType] = useState('subscriptions'); // 'subscriptions', 'boosters'

    // 2. Data State
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 3. Fetch Engine
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

    // 4. UI Helpers
    const currSymbol = currency === 'USD' ? '$' : '₹';

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return `${currSymbol}0`;
        return `${currSymbol}${value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white p-4 rounded-xl shadow-xl border border-slate-100 min-w-[200px]">
                    <p className="text-sm font-bold text-slate-500 mb-3 pb-2 border-b border-slate-100">{label}</p>
                    {payload.map((entry, index) => (
                        <div key={index} className="flex justify-between items-center mb-1.5 gap-4">
                            <span className="text-sm font-semibold flex items-center gap-2" style={{ color: entry.color }}>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }}></div>
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

    return (
        <div className="w-full max-w-[1600px] mx-auto">
            {/* THE MAIN MASTER BOX */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
                
                {/* --- HEADER: VIEW SELECTOR --- */}
                <div className="bg-slate-50 border-b border-slate-200 p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h2 className="text-xl font-black text-slate-800 flex items-center gap-2">
                        📊 Platform Analytics
                    </h2>
                    
                    <div className="flex bg-slate-200/60 p-1.5 rounded-xl w-full sm:w-auto">
                        {[
                            { id: 'revenue', label: '💳 Revenue', activeColor: 'bg-white text-indigo-600 shadow-sm' },
                            { id: 'users', label: '👥 Users', activeColor: 'bg-white text-emerald-600 shadow-sm' },
                            { id: 'plans', label: '📦 Plans', activeColor: 'bg-white text-amber-600 shadow-sm' }
                        ].map(view => (
                            <button
                                key={view.id}
                                onClick={() => setActiveView(view.id)}
                                className={`flex-1 sm:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                    activeView === view.id ? view.activeColor : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                                }`}
                            >
                                {view.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- CONTROLS: DURATION & CURRENCY --- */}
                <div className="p-6 pb-0 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    {/* Duration Toggle */}
                    <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
                        {[
                            { id: '24h', label: '24 Hours' },
                            { id: '7d', label: '7 Days' },
                            { id: '30d', label: '30 Days' },
                            { id: '1y', label: '1 Year' },
                            { id: 'all', label: 'All Time' }
                        ].map(t => (
                            <button 
                                key={t.id} 
                                onClick={() => setDuration(t.id)} 
                                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
                                    duration === t.id ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                                }`}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {/* Currency Toggle (Only highly relevant for Revenue, but kept visible for consistency) */}
                    <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto">
                        <button 
                            onClick={() => setCurrency('USD')} 
                            className={`flex-1 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                currency === 'USD' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            🌍 USD Market
                        </button>
                        <button 
                            onClick={() => setCurrency('INR')} 
                            className={`flex-1 px-6 py-2 rounded-lg text-sm font-bold transition-all ${
                                currency === 'INR' ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            🇮🇳 INR Market
                        </button>
                    </div>
                </div>

                {/* --- MAIN CONTENT AREA --- */}
                <div className="p-6">
                    {loading || !data ? (
                        <div className="flex justify-center items-center h-[400px]">
                            <div className="animate-spin w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full"></div>
                        </div>
                    ) : error ? (
                        <div className="bg-rose-50 text-rose-600 p-8 rounded-2xl text-center font-bold border border-rose-100 h-[400px] flex items-center justify-center">
                            Failed to load analytics: {error}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-in fade-in duration-500">
                            
                            {/* --- DYNAMIC CARDS SECTION --- */}
                            {activeView === 'revenue' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Revenue</div>
                                        <div className="text-4xl font-black text-slate-900">{formatCurrency(data.summary.totalRevenue)}</div>
                                    </div>
                                    <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100">
                                        <div className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-2">Subscription Revenue</div>
                                        <div className="text-4xl font-black text-indigo-700">{formatCurrency(data.summary.subRevenue)}</div>
                                    </div>
                                    <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100">
                                        <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-2">Booster Revenue</div>
                                        <div className="text-4xl font-black text-emerald-700">{formatCurrency(data.summary.boosterRevenue)}</div>
                                    </div>
                                </div>
                            )}

                            {activeView === 'users' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Total Active Users</div>
                                        <div className="text-4xl font-black text-slate-900">{data.summary.activeUsers.toLocaleString()}</div>
                                        <div className="text-sm font-medium text-slate-500 mt-2">Currently active accounts</div>
                                    </div>
                                    <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100">
                                        <div className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-2">New Users</div>
                                        <div className="text-4xl font-black text-blue-700">+{data.summary.newUsers.toLocaleString()}</div>
                                        <div className="text-sm font-medium text-slate-500 mt-2">Joined during selected timeframe</div>
                                    </div>
                                </div>
                            )}

                            {activeView === 'plans' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 flex justify-between items-center">
                                        <div>
                                            <div className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-1">Top Subscription</div>
                                            <div className="text-2xl font-black text-indigo-900">{data.summary.topSubPlan}</div>
                                        </div>
                                        <div className="text-4xl">👑</div>
                                    </div>
                                    <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 flex justify-between items-center">
                                        <div>
                                            <div className="text-sm font-bold text-emerald-400 uppercase tracking-wider mb-1">Top Booster Pack</div>
                                            <div className="text-2xl font-black text-emerald-900">{data.summary.topBoosterPlan}</div>
                                        </div>
                                        <div className="text-4xl">🚀</div>
                                    </div>
                                </div>
                            )}

                            {/* --- DYNAMIC GRAPH SECTION --- */}
                            <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                
                                {/* Graph Header (Specially for Plans to toggle sub/booster) */}
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-lg font-black text-slate-800">
                                        {activeView === 'revenue' && 'Revenue Growth Line'}
                                        {activeView === 'users' && 'User Acquisition & Activity'}
                                        {activeView === 'plans' && 'Plan Purchase Volume'}
                                    </h3>
                                    
                                    {activeView === 'plans' && (
                                        <div className="flex bg-slate-100 p-1 rounded-lg">
                                            <button 
                                                onClick={() => setPlanChartType('subscriptions')}
                                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${planChartType === 'subscriptions' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                            >
                                                Subscriptions
                                            </button>
                                            <button 
                                                onClick={() => setPlanChartType('boosters')}
                                                className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${planChartType === 'boosters' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500'}`}
                                            >
                                                Boosters
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="h-[350px] w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        
                                        {/* REVENUE GRAPH (Line) */}
                                        {activeView === 'revenue' && (
                                            <LineChart data={data.graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={15} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(val) => `${currSymbol}${val}`} />
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px', fontWeight: 600 }} iconType="circle" />
                                                
                                                <Line type="monotone" dataKey="subRevenue" name="Subscription Revenue" stroke="#4F46E5" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="boosterRevenue" name="Booster Revenue" stroke="#10B981" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                            </LineChart>
                                        )}

                                        {/* USERS GRAPH (Line) */}
                                        {/* {activeView === 'users' && (
                                            <LineChart data={data.graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={15} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px', fontWeight: 600 }} iconType="circle" />
                                                
                                                <Line type="monotone" dataKey="activeUsers" name="Active Users" stroke="#0F172A" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                                <Line type="monotone" dataKey="newUsers" name="New Signups" stroke="#3B82F6" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                            </LineChart>
                                        )} */}

                                        {/* USERS GRAPH (Dual Y-Axis Line) */}
                                        {activeView === 'users' && (
                                            <LineChart data={data.graph} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={15} />
                                                
                                                {/* DUAL Y-AXIS to prevent line squashing */}
                                                <YAxis yAxisId="left" orientation="left" axisLine={false} tickLine={false} tick={{fill: '#3B82F6', fontSize: 12, fontWeight: 600}} />
                                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{fill: '#0F172A', fontSize: 12, fontWeight: 600}} />
                                                
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '13px', fontWeight: 600 }} iconType="circle" />
                                                
                                                {/* Note the yAxisId assignments */}
                                                <Line yAxisId="right" type="monotone" dataKey="activeUsers" name="Daily Active Users" stroke="#0F172A" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                                <Line yAxisId="left" type="monotone" dataKey="newUsers" name="New Signups" stroke="#3B82F6" strokeWidth={4} dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                                            </LineChart>
                                        )}

                                        {/* PLANS GRAPH (Bar) */}
                                        {activeView === 'plans' && (
                                            <BarChart 
                                                data={planChartType === 'subscriptions' ? data.plans.subscriptions : data.plans.boosters} 
                                                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                                            >
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 600}} dy={15} />
                                                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                                                <RechartsTooltip cursor={{fill: '#f8fafc'}} content={<CustomTooltip />} />
                                                
                                                <Bar dataKey="purchases" name="Purchases" fill={planChartType === 'subscriptions' ? '#4F46E5' : '#10B981'} radius={[6, 6, 0, 0]} maxBarSize={80} />
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