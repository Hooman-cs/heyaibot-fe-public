import { useState, useEffect } from "react";

const DEFAULT_SYSTEM_FEATURES = [
  { key: "Max Bot", value: "", isFixed: true },
  { key: "Token Count", value: "", isFixed: true },
  { key: "Overage Rate", value: "0.01", isFixed: true }
];

export default function AdminBillingTab() {
  const [activeTab, setActiveTab] = useState("plans"); // "plans" | "boosters"
  
  // Plans State
  const [plans, setPlans] = useState([]);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [planFormData, setPlanFormData] = useState({ 
    name: "", amount_mrp_inr: "", amount_inr: "", amount_mrp_usd: "", amount_usd: "", 
    grace_period: "7", yearly_discount: "20",
    stripe_monthly_id: "", stripe_yearly_id: "", razorpay_monthly_id: "", razorpay_yearly_id: "",
    system_features: [...DEFAULT_SYSTEM_FEATURES], display_features: [""] 
  });

  // Boosters State
  const [boosters, setBoosters] = useState([]);
  const [showBoosterForm, setShowBoosterForm] = useState(false);
  const [isEditingBooster, setIsEditingBooster] = useState(false);
  const [currentBoosterId, setCurrentBoosterId] = useState(null);
  const [boosterFormData, setBoosterFormData] = useState({ name: "", token_amount: "", amount: "", amount_usd: "" });

  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [plansRes, boostersRes] = await Promise.all([
        fetch("/api/admin/plans"), fetch("/api/admin/booster-plans")
      ]);
      const plansData = await plansRes.json();
      const boostersData = await boostersRes.json();
      setPlans(plansData.plans || []);
      setBoosters(boostersData.plans || []);
    } catch (error) { console.error(error); }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  // --- PLANS LOGIC ---
  const handleSystemFeatureChange = (index, field, value) => {
    const newFeatures = [...planFormData.system_features];
    newFeatures[index][field] = value;
    setPlanFormData({ ...planFormData, system_features: newFeatures });
  };
  const addSystemFeatureRow = () => setPlanFormData({ ...planFormData, system_features: [...planFormData.system_features, { key: "", value: "", isFixed: false }] });
  const removeSystemFeatureRow = (index) => setPlanFormData({ ...planFormData, system_features: planFormData.system_features.filter((_, i) => i !== index) });

  const handleDisplayFeatureChange = (index, value) => {
    const newFeatures = [...planFormData.display_features];
    newFeatures[index] = value;
    setPlanFormData({ ...planFormData, display_features: newFeatures });
  };
  const addDisplayFeatureRow = () => setPlanFormData({ ...planFormData, display_features: [...planFormData.display_features, ""] });
  const removeDisplayFeatureRow = (index) => setPlanFormData({ ...planFormData, display_features: planFormData.display_features.filter((_, i) => i !== index) });

  const resetPlanForm = () => {
    setPlanFormData({ 
      name: "", amount_mrp_inr: "", amount_inr: "", amount_mrp_usd: "", amount_usd: "", grace_period: "7", yearly_discount: "20",
      stripe_monthly_id: "", stripe_yearly_id: "", razorpay_monthly_id: "", razorpay_yearly_id: "",
      system_features: [...DEFAULT_SYSTEM_FEATURES.map(f => ({...f}))], display_features: [""]
    });
    setIsEditingPlan(false); setCurrentPlanId(null); setShowPlanForm(false);
  };

  const handleEditPlan = (plan) => {
    const systemFeatureArray = [];
    let hasMaxBot = false; let hasTokenCount = false; let hasOverage = false;
    const oldOrNewFeatures = plan.system_features || plan.features || {};

    Object.entries(oldOrNewFeatures).forEach(([key, value]) => {
      const lowerKey = key.toLowerCase();
      if (lowerKey === "max bot" || lowerKey === "maxbot") { systemFeatureArray.push({ key: "Max Bot", value, isFixed: true }); hasMaxBot = true; } 
      else if (lowerKey === "token count") { systemFeatureArray.push({ key: "Token Count", value, isFixed: true }); hasTokenCount = true; } 
      else if (lowerKey === "overage rate") { systemFeatureArray.push({ key: "Overage Rate", value, isFixed: true }); hasOverage = true; } 
      else { systemFeatureArray.push({ key, value, isFixed: false }); }
    });

    if (!hasOverage) systemFeatureArray.unshift({ key: "Overage Rate", value: "0.01", isFixed: true });
    if (!hasTokenCount) systemFeatureArray.unshift({ key: "Token Count", value: "", isFixed: true });
    if (!hasMaxBot) systemFeatureArray.unshift({ key: "Max Bot", value: "", isFixed: true });

    setPlanFormData({ 
      name: plan.plan_name, 
      amount_mrp_inr: plan.amount_mrp || plan.amount || "", amount_inr: plan.amount || "", 
      amount_mrp_usd: plan.amount_mrp_usd || plan.amount_usd || "", amount_usd: plan.amount_usd || "", 
      grace_period: plan.grace_period || 7, yearly_discount: plan.yearly_discount || "20",
      stripe_monthly_id: plan.stripe_monthly_id || "", stripe_yearly_id: plan.stripe_yearly_id || "", 
      razorpay_monthly_id: plan.razorpay_monthly_id || "", razorpay_yearly_id: plan.razorpay_yearly_id || "",
      system_features: systemFeatureArray, display_features: plan.display_features?.length > 0 ? plan.display_features : [""]
    });
    
    setCurrentPlanId(plan.plan_id); setIsEditingPlan(true); setShowPlanForm(true);
  };

  const submitPlan = async (e) => {
    e.preventDefault();
    const systemFeaturesObject = {};
    planFormData.system_features.forEach(f => { if (f.key.trim()) systemFeaturesObject[f.key.trim()] = f.value; });
    const cleanDisplayFeatures = planFormData.display_features.filter(f => f.trim() !== "");

    const payload = { 
      name: planFormData.name, amount_mrp: planFormData.amount_mrp_inr, amount: planFormData.amount_inr, 
      amount_mrp_usd: planFormData.amount_mrp_usd, amount_usd: planFormData.amount_usd, 
      grace_period: planFormData.grace_period, yearly_discount: planFormData.yearly_discount,
      stripe_monthly_id: planFormData.stripe_monthly_id, stripe_yearly_id: planFormData.stripe_yearly_id,
      razorpay_monthly_id: planFormData.razorpay_monthly_id, razorpay_yearly_id: planFormData.razorpay_yearly_id,
      system_features: systemFeaturesObject, display_features: cleanDisplayFeatures 
    };
    
    const method = isEditingPlan ? "PUT" : "POST";
    const body = isEditingPlan ? { id: currentPlanId, ...payload } : payload;

    const res = await fetch("/api/admin/plans", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { alert(isEditingPlan ? "Updated!" : "Created!"); resetPlanForm(); fetchData(); } 
    else { const err = await res.json(); alert("Error: " + err.error); }
  };

  // --- BOOSTERS LOGIC ---
  const resetBoosterForm = () => {
    setBoosterFormData({ name: "", token_amount: "", amount: "", amount_usd: "" });
    setIsEditingBooster(false); setCurrentBoosterId(null); setShowBoosterForm(false);
  };

  const handleEditBooster = (booster) => {
    setBoosterFormData({ name: booster.name, token_amount: booster.token_amount, amount: booster.amount, amount_usd: booster.amount_usd });
    setCurrentBoosterId(booster.booster_id); setIsEditingBooster(true); setShowBoosterForm(true);
  };

  const submitBooster = async (e) => {
    e.preventDefault();
    const method = isEditingBooster ? "PUT" : "POST";
    const body = isEditingBooster ? { id: currentBoosterId, ...boosterFormData } : boosterFormData;

    const res = await fetch("/api/admin/booster-plans", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { alert(isEditingBooster ? "Updated!" : "Created!"); resetBoosterForm(); fetchData(); } 
    else { const err = await res.json(); alert("Error: " + err.error); }
  };

  const handleToggleStatus = async (item, type) => {
    const newStatus = item.status === "active" ? "inactive" : "active";
    if(!confirm(`Change status to ${newStatus}?`)) return;
    const endpoint = type === 'plan' ? "/api/admin/plans" : "/api/admin/booster-plans";
    const idField = type === 'plan' ? item.plan_id : item.booster_id;
    const res = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: idField, status: newStatus }) });
    if (res.ok) fetchData();
  };

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Loading Configurations...</div>;

  return (
    <div>
      {/* HEADER & TOGGLE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Billing Management</h2>
        
        <div className="bg-slate-200/60 p-1.5 rounded-full inline-flex items-center">
            <button 
                onClick={() => setActiveTab("plans")}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "plans" ? "text-slate-900 shadow-sm bg-white" : "text-slate-500 hover:text-slate-800"}`}
            >
                Subscription Plans
            </button>
            <button 
                onClick={() => setActiveTab("boosters")}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === "boosters" ? "text-slate-900 shadow-sm bg-white" : "text-slate-500 hover:text-slate-800"}`}
            >
                Token Boosters
            </button>
        </div>

        {activeTab === "plans" && !showPlanForm && <button onClick={() => { resetPlanForm(); setShowPlanForm(true); }} className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-indigo-700">+ Create Plan</button>}
        {activeTab === "boosters" && !showBoosterForm && <button onClick={() => { resetBoosterForm(); setShowBoosterForm(true); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-emerald-700">+ Create Booster</button>}
      </div>

      {/* ======================================= */}
      {/* PLANS VIEW */}
      {/* ======================================= */}
      {activeTab === "plans" && (
        <>
          {showPlanForm && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
              <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">{isEditingPlan ? "Edit Plan Details" : "Create a New Plan"}</h2>
                <button onClick={resetPlanForm} className="text-slate-400 hover:text-rose-500 font-bold">✕ Cancel</button>
              </div>
              
              <form onSubmit={submitPlan} className="p-4 sm:p-8">
                {/* Basic Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="md:col-span-2 lg:col-span-4"><label className="block text-sm font-bold text-slate-700 mb-2">Plan Name</label><input required className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="e.g. Pro" value={planFormData.name} onChange={e => setPlanFormData({...planFormData, name: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">Plan Price (INR ₹)</label><input required type="number" className="w-full border px-4 py-2 rounded-lg bg-white text-slate-500" placeholder="MRP" value={planFormData.amount_mrp_inr} onChange={e => setPlanFormData({...planFormData, amount_mrp_inr: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (INR ₹)</label><input required type="number" className="w-full border px-4 py-2 rounded-lg bg-indigo-50 font-bold text-indigo-700" placeholder="Final Price" value={planFormData.amount_inr} onChange={e => setPlanFormData({...planFormData, amount_inr: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">Plan Price (USD $)</label><input required type="number" step="0.01" className="w-full border px-4 py-2 rounded-lg bg-white text-slate-500" placeholder="MRP" value={planFormData.amount_mrp_usd} onChange={e => setPlanFormData({...planFormData, amount_mrp_usd: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (USD $)</label><input required type="number" step="0.01" className="w-full border px-4 py-2 rounded-lg bg-indigo-50 font-bold text-indigo-700" placeholder="Final Price" value={planFormData.amount_usd} onChange={e => setPlanFormData({...planFormData, amount_usd: e.target.value})} /></div>
                </div>

                {/* Gateway IDs (NEW FOR PATH A) */}
                <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8">
                    <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-widest">Payment Gateway Product IDs</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Stripe Monthly Price ID</label><input className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="price_1N2..." value={planFormData.stripe_monthly_id} onChange={e => setPlanFormData({...planFormData, stripe_monthly_id: e.target.value})} /></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Stripe Yearly Price ID</label><input className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="price_9X8..." value={planFormData.stripe_yearly_id} onChange={e => setPlanFormData({...planFormData, stripe_yearly_id: e.target.value})} /></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Razorpay Monthly Plan ID</label><input className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="plan_xyz..." value={planFormData.razorpay_monthly_id} onChange={e => setPlanFormData({...planFormData, razorpay_monthly_id: e.target.value})} /></div>
                        <div><label className="block text-sm font-bold text-slate-700 mb-2">Razorpay Yearly Plan ID</label><input className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="plan_abc..." value={planFormData.razorpay_yearly_id} onChange={e => setPlanFormData({...planFormData, razorpay_yearly_id: e.target.value})} /></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-t border-slate-100 pt-6">
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">UI Yearly Discount % (Badge Display)</label><input required type="number" className="w-full border px-4 py-2 rounded-lg bg-white" value={planFormData.yearly_discount} onChange={e => setPlanFormData({...planFormData, yearly_discount: e.target.value})} /></div>
                  <div><label className="block text-sm font-bold text-slate-700 mb-2">Grace (Days)</label><input required type="number" className="w-full border px-4 py-2 rounded-lg bg-white" value={planFormData.grace_period} onChange={e => setPlanFormData({...planFormData, grace_period: e.target.value})} /></div>
                </div>
                
                {/* Features */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-t border-slate-100 pt-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Pricing Page Features (Visible)</label>
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      {planFormData.display_features.map((item, index) => (
                        <div key={index} className="flex gap-2 mb-3">
                          <input className="flex-1 border px-4 py-2 rounded-lg bg-white text-sm" placeholder="e.g. Priority 24/7 Support" value={item} onChange={e => handleDisplayFeatureChange(index, e.target.value)} />
                          <button type="button" onClick={() => removeDisplayFeatureRow(index)} className="text-rose-500 font-bold px-3 py-2 border border-transparent hover:bg-rose-50 rounded-lg shrink-0">✕</button>
                        </div>
                      ))}
                      <button type="button" onClick={addDisplayFeatureRow} className="text-indigo-600 font-bold text-sm mt-2 px-2 py-1 hover:bg-indigo-50 rounded"><span>+</span> Add Text Line</button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">System Limits (Hidden)</label>
                    <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                      {planFormData.system_features.map((item, index) => (
                        <div key={index} className="flex gap-2 mb-3">
                          <input className={`flex-1 border px-3 py-2 rounded-lg text-sm ${item.isFixed ? 'bg-slate-100 font-bold text-slate-500 cursor-not-allowed border-slate-200' : 'bg-white'}`} placeholder="Key" value={item.key} onChange={e => !item.isFixed && handleSystemFeatureChange(index, 'key', e.target.value)} readOnly={item.isFixed} required />
                          <input className="w-24 border px-3 py-2 rounded-lg bg-white text-sm" placeholder="Value" value={item.value} onChange={e => handleSystemFeatureChange(index, 'value', e.target.value)} required={item.isFixed} />
                          {item.isFixed ? <div className="px-2 py-2 w-10 flex justify-center text-slate-300">🔒</div> : <button type="button" onClick={() => removeSystemFeatureRow(index)} className="text-rose-500 font-bold px-2 py-2 hover:bg-rose-50 rounded-lg w-10 text-center">✕</button>}
                        </div>
                      ))}
                      <button type="button" onClick={addSystemFeatureRow} className="text-indigo-600 font-bold text-sm mt-2 px-2 py-1 hover:bg-indigo-50 rounded"><span>+</span> Add Variable</button>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-4 border-t border-slate-100 pt-8 mt-6">
                  <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md text-lg">{isEditingPlan ? "Save Changes" : "Create Plan"}</button>
                </div>
              </form>
            </div>
          )}

          {!showPlanForm && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {plans.map(plan => {
                const featuresList = plan.display_features?.length > 0 ? plan.display_features : Object.entries(plan.features || {}).map(([k,v]) => `${v} ${k}`);
                return (
                <div key={plan.plan_id} className={`bg-white rounded-3xl shadow-sm border p-6 flex flex-col ${plan.status === 'inactive' ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold capitalize">{plan.plan_name}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{plan.status}</span>
                  </div>
                  
                  <div className="mt-2 mb-4">
                    <div className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-1">INR / USD Pricing</div>
                    <div className="flex items-end gap-2 mb-2">
                      <span className="text-3xl font-extrabold text-slate-900">₹{plan.amount || 0}</span>
                      <span className="text-lg font-bold text-slate-400">| ${plan.amount_usd || 0}</span>
                    </div>
                  </div>

                  {/* ID Indicators */}
                  <div className="mb-6 space-y-1">
                      <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${plan.stripe_monthly_id ? 'bg-emerald-400' : 'bg-rose-400'}`}></div> Stripe IDs
                      </div>
                      <div className="text-xs font-bold text-slate-400 flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${plan.razorpay_monthly_id ? 'bg-blue-400' : 'bg-rose-400'}`}></div> Razorpay IDs
                      </div>
                  </div>
                  
                  <ul className="text-sm text-slate-600 space-y-2 mb-8 flex-1 border-t border-slate-50 pt-4">
                    {featuresList.map((text, idx) => (
                      <li key={idx} className="flex gap-2"><span className="text-indigo-500 shrink-0">✓</span><span>{text}</span></li>
                    ))}
                  </ul>
                  
                  <div className="flex gap-2">
                    <button onClick={() => handleEditPlan(plan)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors">Edit</button>
                    <button onClick={() => handleToggleStatus(plan, 'plan')} className={`flex-1 border py-2.5 rounded-lg text-sm font-bold transition-colors ${plan.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>{plan.status === 'active' ? 'Disable' : 'Enable'}</button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </>
      )}

      {/* ======================================= */}
      {/* BOOSTERS VIEW */}
      {/* ======================================= */}
      {activeTab === "boosters" && (
        <>
            {showBoosterForm && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-900">{isEditingBooster ? "Edit Booster Pack" : "Create New Booster Pack"}</h2>
                <button onClick={resetBoosterForm} className="text-slate-400 hover:text-rose-500 font-bold">✕ Cancel</button>
                </div>
                
                <form onSubmit={submitBooster} className="p-4 sm:p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <div className="md:col-span-2 lg:col-span-4"><label className="block text-sm font-bold text-slate-700 mb-2">Package Name</label><input required className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="e.g. 10k Extra Tokens" value={boosterFormData.name} onChange={e => setBoosterFormData({...boosterFormData, name: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Tokens Provided</label><input required type="number" className="w-full border px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-bold" value={boosterFormData.token_amount} onChange={e => setBoosterFormData({...boosterFormData, token_amount: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Price (INR ₹)</label><input required type="number" className="w-full border px-4 py-2 rounded-lg bg-white" value={boosterFormData.amount} onChange={e => setBoosterFormData({...boosterFormData, amount: e.target.value})} /></div>
                    <div><label className="block text-sm font-bold text-slate-700 mb-2">Price (USD $)</label><input required type="number" step="0.01" className="w-full border px-4 py-2 rounded-lg bg-white" value={boosterFormData.amount_usd} onChange={e => setBoosterFormData({...boosterFormData, amount_usd: e.target.value})} /></div>
                </div>
                <div className="flex justify-end gap-4 border-t border-slate-100 pt-6">
                    <button type="submit" className="w-full sm:w-auto bg-emerald-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-md text-lg">{isEditingBooster ? "Save Changes" : "Create Booster"}</button>
                </div>
                </form>
            </div>
            )}

            {!showBoosterForm && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {boosters.map(b => (
                <div key={b.booster_id} className={`bg-white rounded-3xl shadow-sm border p-6 flex flex-col ${b.status === 'inactive' ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold">{b.name}</h3>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{b.status}</span>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 mb-4">+{b.token_amount} Tokens</div>
                    <div className="flex justify-between items-center mb-6 text-sm font-bold text-slate-500">
                    <span>₹{b.amount}</span><span>${b.amount_usd}</span>
                    </div>
                    <div className="flex gap-2 mt-auto">
                    <button onClick={() => handleEditBooster(b)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200">Edit</button>
                    <button onClick={() => handleToggleStatus(b, 'booster')} className={`flex-1 border py-2.5 rounded-lg text-sm font-bold ${b.status === 'active' ? 'border-rose-200 text-rose-600' : 'border-emerald-200 text-emerald-600'}`}>{b.status === 'active' ? 'Disable' : 'Enable'}</button>
                    </div>
                </div>
                ))}
            </div>
            )}
        </>
      )}
    </div>
  );
}