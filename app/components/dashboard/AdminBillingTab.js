
import { useState, useEffect } from "react";

const DEFAULT_SYSTEM_FEATURES = [
  { key: "Max Bot", value: "", isFixed: true },
  { key: "Token Count", value: "", isFixed: true }
];

export default function AdminBillingTab() {
  const [activeTab, setActiveTab] = useState("plans"); 
  
  // ==========================================
  // STATE MANAGEMENT
  // ==========================================
  const [plans, setPlans] = useState([]);
  const [boosters, setBoosters] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [showPlanForm, setShowPlanForm] = useState(false);
  const [isEditingPlan, setIsEditingPlan] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);
  const [planFormData, setPlanFormData] = useState({ 
    name: "", amount_mrp_inr: "", amount_inr: "", amount_yearly_inr: "", 
    amount_mrp_usd: "", amount_usd: "", amount_yearly_usd: "", 
    grace_period: "7", 
    stripe_monthly_id: "", stripe_yearly_id: "", razorpay_monthly_id: "", razorpay_yearly_id: "",
    system_features: [...DEFAULT_SYSTEM_FEATURES], display_features: [""] 
  });

  const [showBoosterForm, setShowBoosterForm] = useState(false);
  const [isEditingBooster, setIsEditingBooster] = useState(false);
  const [currentBoosterId, setCurrentBoosterId] = useState(null);
  const [boosterFormData, setBoosterFormData] = useState({
    name: "", amount_inr: "", amount_usd: "", token_amount: ""
  });

  const [showCouponForm, setShowCouponForm] = useState(false);
  const [couponFormData, setCouponFormData] = useState({ 
    code: "", 
    discountType: "percentage", // ✅ NEW: 'percentage' or 'flat'
    discountValue: "",          // ✅ NEW: Replaces 'percentage'
    gateway: "stripe", 
    applicableTo: "subscription", // ✅ NEW: Removed 'all'
    duration: "once", 
    durationInMonths: "", 
    razorpayOfferId: "" 
  });

  // ==========================================
  // FETCH DATA
  // ==========================================
  // useEffect(() => {
  //   const fetchData = async () => {
  //     setIsLoading(true);
  //     try {
  //       const [plansRes, boostersRes, couponsRes] = await Promise.all([
  //         fetch("/api/admin/plans"),
  //         fetch("/api/admin/booster-plans"),
  //         fetch("/api/admin/coupons")
  //       ]);
  //       const plansData = await plansRes.json();
  //       const boostersData = await boostersRes.json();
  //       const couponsData = await couponsRes.json();

  //       setPlans(plansData.plans || []);
  //       setBoosters(boostersData.plans || []);
  //       setCoupons(couponsData.coupons || []);
  //     } catch (error) {
  //       console.error("Failed to fetch billing data", error);
  //     }
  //     setIsLoading(false);
  //   };
  //   fetchData();
  // }, []);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [plansRes, boostersRes, couponsRes] = await Promise.all([
          fetch("/api/admin/plans"),
          fetch("/api/admin/booster-plans"),
          fetch("/api/admin/coupons")
        ]);

        // ✅ SAFE PARSING: Check if response is OK before parsing JSON. 
        // If it fails, fallback to an empty object to prevent crashes.
        const plansData = plansRes.ok ? await plansRes.json().catch(() => ({})) : {};
        const boostersData = boostersRes.ok ? await boostersRes.json().catch(() => ({})) : {};
        const couponsData = couponsRes.ok ? await couponsRes.json().catch(() => ({})) : {};

        // Safely set state with fallbacks
        setPlans(plansData.plans || []);
        setBoosters(boostersData.plans || []);
        setCoupons(couponsData.coupons || []);
        
      } catch (error) {
        console.error("Failed to fetch billing data", error);
      }
      setIsLoading(false);
    };
    
    fetchData();
  }, []);

  // ==========================================
  // HANDLERS: PLANS
  // ==========================================
  const handleFeatureChange = (index, type, field, value) => {
    const updated = [...planFormData[type]];
    if (type === "system_features") updated[index][field] = value;
    else updated[index] = value;
    setPlanFormData({ ...planFormData, [type]: updated });
  };

  const addFeature = (type) => {
    if (type === "system_features") setPlanFormData({ ...planFormData, system_features: [...planFormData.system_features, { key: "", value: "", isFixed: false }] });
    else setPlanFormData({ ...planFormData, display_features: [...planFormData.display_features, ""] });
  };

  const removeFeature = (index, type) => {
    const updated = [...planFormData[type]];
    updated.splice(index, 1);
    setPlanFormData({ ...planFormData, [type]: updated });
  };

  const handlePlanSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditingPlan ? `/api/admin/plans?id=${currentPlanId}` : "/api/admin/plans";
    const method = isEditingPlan ? "PUT" : "POST";
    
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(planFormData),
      });
      if (res.ok) {
        const fetchRes = await fetch("/api/admin/plans");
        const data = await fetchRes.json();
        setPlans(data.plans || []);
        setShowPlanForm(false);
        resetPlanForm();
      }
    } catch (error) {
      alert("Failed to save plan");
    }
  };

  const resetPlanForm = () => {
    setPlanFormData({ 
      name: "", amount_mrp_inr: "", amount_inr: "", amount_yearly_inr: "", 
      amount_mrp_usd: "", amount_usd: "", amount_yearly_usd: "", grace_period: "7", 
      stripe_monthly_id: "", stripe_yearly_id: "", razorpay_monthly_id: "", razorpay_yearly_id: "",
      system_features: [...DEFAULT_SYSTEM_FEATURES], display_features: [""] 
    });
    setIsEditingPlan(false);
    setCurrentPlanId(null);
  };

  const handleEditPlan = (plan) => {
    let parsedSystem = plan.system_features || {};
    let parsedDisplay = plan.display_features || [];
    
    const sysArray = Object.keys(parsedSystem).map(k => ({ key: k, value: parsedSystem[k], isFixed: DEFAULT_SYSTEM_FEATURES.some(df => df.key === k) }));
    DEFAULT_SYSTEM_FEATURES.forEach(df => { if (!sysArray.find(s => s.key === df.key)) sysArray.unshift({ ...df }); });

    setPlanFormData({
      name: plan.plan_name,
      amount_mrp_inr: plan.amount_mrp || "", amount_inr: plan.amount || "", amount_yearly_inr: plan.amount_yearly || "",
      amount_mrp_usd: plan.amount_mrp_usd || "", amount_usd: plan.amount_usd || "", amount_yearly_usd: plan.amount_yearly_usd || "",
      grace_period: plan.grace_period || "7",
      stripe_monthly_id: plan.stripe_monthly_id || "", stripe_yearly_id: plan.stripe_yearly_id || "",
      razorpay_monthly_id: plan.razorpay_monthly_id || "", razorpay_yearly_id: plan.razorpay_yearly_id || "",
      system_features: sysArray,
      display_features: parsedDisplay.length ? parsedDisplay : [""]
    });
    setCurrentPlanId(plan.plan_id);
    setIsEditingPlan(true);
    setShowPlanForm(true);
  };

  // ==========================================
  // HANDLERS: BOOSTERS
  // ==========================================
  const handleBoosterSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isEditingBooster ? `/api/admin/booster-plans?id=${currentBoosterId}` : "/api/admin/booster-plans";
    const method = isEditingBooster ? "PUT" : "POST";
    
    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(boosterFormData),
      });
      if (res.ok) {
        const fetchRes = await fetch("/api/admin/booster-plans");
        const data = await fetchRes.json();
        setBoosters(data.plans || []);
        setShowBoosterForm(false);
        resetBoosterForm();
      }
    } catch (error) { alert("Failed to save booster"); }
  };

  const resetBoosterForm = () => {
    setBoosterFormData({ name: "", amount_inr: "", amount_usd: "", token_amount: "" });
    setIsEditingBooster(false);
    setCurrentBoosterId(null);
  };

  const handleEditBooster = (b) => {
    setBoosterFormData({ name: b.name, amount_inr: b.amount, amount_usd: b.amount_usd, token_amount: b.token_amount });
    setCurrentBoosterId(b.booster_id);
    setIsEditingBooster(true);
    setShowBoosterForm(true);
  };

  const handleToggleStatus = async (item, type) => {
    const newStatus = item.status === 'active' ? 'inactive' : 'active';
    const endpoint = type === 'plan' ? '/api/admin/plans' : type === 'booster' ? '/api/admin/booster-plans' : '/api/admin/coupons';
    const payload = type === 'coupon' ? { code: item.coupon_code, status: newStatus } : { id: item.plan_id || item.booster_id, status: newStatus };

    try {
      const res = await fetch(endpoint, { method: 'PATCH', headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      if (res.ok) {
        if (type === 'plan') setPlans(plans.map(p => p.plan_id === item.plan_id ? { ...p, status: newStatus } : p));
        else if (type === 'booster') setBoosters(boosters.map(b => b.booster_id === item.booster_id ? { ...b, status: newStatus } : b));
        else setCoupons(coupons.map(c => c.coupon_code === item.coupon_code ? { ...c, status: newStatus } : c));
      }
    } catch (error) { alert("Failed to toggle status"); }
  };

  // ==========================================
  // HANDLERS: COUPONS
  // ==========================================
  const handleCouponSubmit = async (e) => {
    e.preventDefault();
    if (couponFormData.gateway === 'razorpay' && !couponFormData.razorpayOfferId) {
       return alert("Please paste the Razorpay Offer ID created in your Razorpay Dashboard.");
    }

    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // ✅ SECURE: Send strictly formatted data to API
        body: JSON.stringify({
            code: couponFormData.code,
            discountType: couponFormData.discountType,
            discountValue: couponFormData.discountValue,
            gateway: couponFormData.gateway,
            applicableTo: couponFormData.applicableTo,
            duration: couponFormData.applicableTo === "booster" ? "once" : couponFormData.duration,
            durationInMonths: couponFormData.durationInMonths,
            razorpayOfferId: couponFormData.gateway === "razorpay" ? couponFormData.razorpayOfferId.trim() : null
        }),
      });
      const data = await res.json();
      if (res.ok) {
        const fetchRes = await fetch("/api/admin/coupons");
        const fetchArray = await fetchRes.json();
        setCoupons(fetchArray.coupons || []);
        setShowCouponForm(false);
        setCouponFormData({ 
            code: "", discountType: "percentage", discountValue: "", 
            gateway: "stripe", applicableTo: "subscription", 
            duration: "once", durationInMonths: "", razorpayOfferId: "" 
        });
      } else alert(data.error);
    } catch (error) { alert("Failed to save gateway offer"); }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-bold animate-pulse">Loading billing configuration...</div>;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto">
      
      {/* HEADER & TABS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Billing & Pricing Management</h2>
          <p className="text-sm text-slate-500 font-medium mt-1">Configure subscription plans, token boosters, and gateway coupons.</p>
        </div>
      </div>

      <div className="flex border-b border-slate-200">
        <button onClick={() => setActiveTab("plans")} className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === "plans" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Subscription Plans</button>
        <button onClick={() => setActiveTab("boosters")} className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === "boosters" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Token Boosters</button>
        <button onClick={() => setActiveTab("coupons")} className={`pb-3 px-4 font-bold text-sm transition-all border-b-2 ${activeTab === "coupons" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>Coupons & Offers</button>
      </div>

      {/* ========================================================================= */}
      {/* PLANS TAB */}
      {/* ========================================================================= */}
      {activeTab === "plans" && (
         <div className="space-y-6">
            {!showPlanForm ? (
               <button onClick={() => setShowPlanForm(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-all">
                  + Create New Plan
               </button>
            ) : (
               <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl relative animate-in slide-in-from-top-4">
                  <button onClick={() => { setShowPlanForm(false); resetPlanForm(); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  <h3 className="text-xl font-black text-slate-900 mb-6">{isEditingPlan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}</h3>
                  <form onSubmit={handlePlanSubmit} className="space-y-8">
                     
                     <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Core Details</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Plan Name</label>
                              <input required type="text" value={planFormData.name} onChange={e => setPlanFormData({...planFormData, name: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. Pro Plan" />
                           </div>
                           <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Grace Period (Days)</label>
                              <input required type="number" min="0" value={planFormData.grace_period} onChange={e => setPlanFormData({...planFormData, grace_period: e.target.value})} className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100/50">
                           <h4 className="text-xs font-black text-emerald-600 uppercase tracking-widest mb-4 flex items-center gap-2"><span>🇮🇳</span> INR Pricing (Razorpay)</h4>
                           <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                 <div><label className="block text-xs font-bold text-slate-700 mb-1">Monthly MRP (₹)</label><input type="number" value={planFormData.amount_mrp_inr} onChange={e => setPlanFormData({...planFormData, amount_mrp_inr: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                                 <div><label className="block text-xs font-bold text-slate-700 mb-1">Monthly Active (₹)</label><input required type="number" value={planFormData.amount_inr} onChange={e => setPlanFormData({...planFormData, amount_inr: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                              </div>
                              <div><label className="block text-xs font-bold text-slate-700 mb-1">Yearly Active (₹)</label><input required type="number" value={planFormData.amount_yearly_inr} onChange={e => setPlanFormData({...planFormData, amount_yearly_inr: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                              <div className="pt-2 border-t border-emerald-100/50 space-y-3">
                                 <div><label className="block text-xs font-bold text-slate-500 mb-1">Razorpay Monthly Plan ID</label><input required type="text" value={planFormData.razorpay_monthly_id} onChange={e => setPlanFormData({...planFormData, razorpay_monthly_id: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-slate-600 placeholder-slate-300" placeholder="plan_xyz123" /></div>
                                 <div><label className="block text-xs font-bold text-slate-500 mb-1">Razorpay Yearly Plan ID</label><input required type="text" value={planFormData.razorpay_yearly_id} onChange={e => setPlanFormData({...planFormData, razorpay_yearly_id: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-slate-600 placeholder-slate-300" placeholder="plan_xyz456" /></div>
                              </div>
                           </div>
                        </div>

                        <div className="bg-blue-50/50 p-5 rounded-2xl border border-blue-100/50">
                           <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2"><span>🌎</span> USD Pricing (Stripe)</h4>
                           <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-3">
                                 <div><label className="block text-xs font-bold text-slate-700 mb-1">Monthly MRP ($)</label><input type="number" value={planFormData.amount_mrp_usd} onChange={e => setPlanFormData({...planFormData, amount_mrp_usd: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                                 <div><label className="block text-xs font-bold text-slate-700 mb-1">Monthly Active ($)</label><input required type="number" value={planFormData.amount_usd} onChange={e => setPlanFormData({...planFormData, amount_usd: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                              </div>
                              <div><label className="block text-xs font-bold text-slate-700 mb-1">Yearly Active ($)</label><input required type="number" value={planFormData.amount_yearly_usd} onChange={e => setPlanFormData({...planFormData, amount_yearly_usd: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                              <div className="pt-2 border-t border-blue-100/50 space-y-3">
                                 <div><label className="block text-xs font-bold text-slate-500 mb-1">Stripe Monthly Price ID</label><input required type="text" value={planFormData.stripe_monthly_id} onChange={e => setPlanFormData({...planFormData, stripe_monthly_id: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-600 placeholder-slate-300" placeholder="price_xyz123" /></div>
                                 <div><label className="block text-xs font-bold text-slate-500 mb-1">Stripe Yearly Price ID</label><input required type="text" value={planFormData.stripe_yearly_id} onChange={e => setPlanFormData({...planFormData, stripe_yearly_id: e.target.value})} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none font-mono text-slate-600 placeholder-slate-300" placeholder="price_xyz456" /></div>
                              </div>
                           </div>
                        </div>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                           <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">System Capabilities</h4>
                              <button type="button" onClick={() => addFeature("system_features")} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100">+ Add</button>
                           </div>
                           <div className="space-y-3">
                              {planFormData.system_features.map((f, i) => (
                                 <div key={i} className="flex gap-2">
                                    <input type="text" value={f.key} readOnly={f.isFixed} onChange={e => handleFeatureChange(i, "system_features", "key", e.target.value)} placeholder="Feature (e.g. Max Bot)" className={`w-1/2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold outline-none ${f.isFixed ? 'bg-slate-100 text-slate-500' : 'focus:ring-2 focus:ring-indigo-500'}`} />
                                    <input required type="number" value={f.value} onChange={e => handleFeatureChange(i, "system_features", "value", e.target.value)} placeholder="Limit (e.g. 3)" className="w-1/2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    {!f.isFixed && <button type="button" onClick={() => removeFeature(i, "system_features")} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                                 </div>
                              ))}
                           </div>
                        </div>

                        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                           <div className="flex justify-between items-center mb-4">
                              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest">Public Display Features</h4>
                              <button type="button" onClick={() => addFeature("display_features")} className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md hover:bg-indigo-100">+ Add</button>
                           </div>
                           <div className="space-y-3">
                              {planFormData.display_features.map((f, i) => (
                                 <div key={i} className="flex gap-2">
                                    <input required type="text" value={f} onChange={e => handleFeatureChange(i, "display_features", null, e.target.value)} placeholder={`Feature ${i + 1}`} className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" />
                                    {planFormData.display_features.length > 1 && <button type="button" onClick={() => removeFeature(i, "display_features")} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>}
                                 </div>
                              ))}
                           </div>
                        </div>
                     </div>

                     <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all text-sm">{isEditingPlan ? 'Save Changes' : 'Create Plan'}</button>
                     </div>
                  </form>
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {plans.map(plan => (
                  <div key={plan.plan_id} className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col relative transition-all ${plan.status === 'active' ? 'border-slate-200' : 'border-slate-200 opacity-60 grayscale'}`}>
                     <div className={`absolute top-4 right-4 px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{plan.status}</div>
                     <h3 className="text-lg font-black text-slate-900 mb-4 pr-16">{plan.plan_name}</h3>
                     <div className="flex items-baseline gap-1 mb-1"><span className="text-2xl font-black text-slate-900">₹{plan.amount}</span><span className="text-xs font-bold text-slate-500">/mo</span></div>
                     <div className="flex items-baseline gap-1 mb-6"><span className="text-2xl font-black text-slate-900">${plan.amount_usd}</span><span className="text-xs font-bold text-slate-500">/mo</span></div>
                     
                     <div className="bg-slate-50 rounded-xl p-3 mb-6 flex-1 border border-slate-100">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">System Config</div>
                        {Object.entries(plan.system_features || {}).map(([key, val]) => (
                           <div key={key} className="flex justify-between items-center py-1 border-b border-slate-200 last:border-0"><span className="text-xs font-semibold text-slate-600">{key}</span><span className="text-xs font-black text-indigo-600">{val}</span></div>
                        ))}
                     </div>

                     <div className="flex gap-2">
                        <button onClick={() => handleToggleStatus(plan, 'plan')} className={`flex-1 border py-2 rounded-lg text-xs font-bold transition-all ${plan.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>{plan.status === 'active' ? 'Disable' : 'Enable'}</button>
                        <button onClick={() => handleEditPlan(plan)} className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">Edit Details</button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* ========================================================================= */}
      {/* BOOSTERS TAB */}
      {/* ========================================================================= */}
      {activeTab === "boosters" && (
         <div className="space-y-6">
            {!showBoosterForm ? (
               <button onClick={() => setShowBoosterForm(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-all">
                  + Create Token Booster
               </button>
            ) : (
               <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl relative animate-in slide-in-from-top-4">
                  <button onClick={() => { setShowBoosterForm(false); resetBoosterForm(); }} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  <h3 className="text-xl font-black text-slate-900 mb-6">{isEditingBooster ? 'Edit Booster' : 'Create New Token Booster'}</h3>
                  <form onSubmit={handleBoosterSubmit} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Booster Name</label><input required type="text" value={boosterFormData.name} onChange={e => setBoosterFormData({...boosterFormData, name: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. +50k Tokens" /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Tokens Provided</label><input required type="number" min="1" value={boosterFormData.token_amount} onChange={e => setBoosterFormData({...boosterFormData, token_amount: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 50000" /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Price (₹ INR) - Razorpay</label><input required type="number" min="1" value={boosterFormData.amount_inr} onChange={e => setBoosterFormData({...boosterFormData, amount_inr: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold focus:ring-2 focus:ring-emerald-500 outline-none" /></div>
                        <div><label className="block text-xs font-bold text-slate-700 mb-1">Price ($ USD) - Stripe</label><input required type="number" min="1" value={boosterFormData.amount_usd} onChange={e => setBoosterFormData({...boosterFormData, amount_usd: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-semibold focus:ring-2 focus:ring-blue-500 outline-none" /></div>
                     </div>
                     <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all text-sm">{isEditingBooster ? 'Save Changes' : 'Create Booster'}</button>
                     </div>
                  </form>
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
               {boosters.map(b => (
                  <div key={b.booster_id} className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col relative transition-all text-center items-center ${b.status === 'active' ? 'border-slate-200' : 'border-slate-200 opacity-60 grayscale'}`}>
                     <div className={`absolute top-4 right-4 px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{b.status}</div>
                     <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center text-xl mb-4 mt-2">⚡</div>
                     <h3 className="text-sm font-black text-slate-900 mb-1">{b.name}</h3>
                     <div className="text-2xl font-black text-indigo-600 mb-4">+{b.token_amount}</div>
                     <div className="flex gap-4 mb-6">
                        <div className="text-center"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">INR</div><div className="text-sm font-black text-slate-900">₹{b.amount}</div></div>
                        <div className="text-center"><div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">USD</div><div className="text-sm font-black text-slate-900">${b.amount_usd}</div></div>
                     </div>
                     <div className="flex gap-2 w-full mt-auto">
                        <button onClick={() => handleToggleStatus(b, 'booster')} className={`flex-1 border py-2 rounded-lg text-xs font-bold transition-all ${b.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>{b.status === 'active' ? 'Disable' : 'Enable'}</button>
                        <button onClick={() => handleEditBooster(b)} className="flex-1 bg-slate-900 text-white py-2 rounded-lg text-xs font-bold hover:bg-slate-800 transition-all">Edit</button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

      {/* ========================================================================= */}
      {/* COUPONS TAB */}
      {/* ========================================================================= */}
      {activeTab === "coupons" && (
         <div className="space-y-6">
            {!showCouponForm ? (
               <button onClick={() => setShowCouponForm(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-indigo-700 shadow-sm transition-all">
                  + Create New Coupon / Offer
               </button>
            ) : (
               <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-200 shadow-xl relative animate-in slide-in-from-top-4">
                  <button onClick={() => setShowCouponForm(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600"><svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                  <h3 className="text-xl font-black text-slate-900 mb-6">Create Gateway Promo Code</h3>
                  
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 text-sm text-amber-800 font-medium">
                     Codes are created directly inside your connected payment gateway. They will instantly work on checkout.
                  </div>

                  <form onSubmit={handleCouponSubmit} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        
                        {/* THE CODE */}
                        <div className="col-span-1 lg:col-span-3">
                           <label className="block text-xs font-bold text-slate-700 mb-1">Promo Code Name</label>
                           <input required type="text" value={couponFormData.code} onChange={e => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-black text-slate-900 uppercase tracking-widest focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-300" placeholder="e.g. SUMMER50" />
                        </div>

                        {/* GATEWAY */}
                        <div>
                           <label className="block text-xs font-bold text-slate-700 mb-1">Gateway</label>
                           <select value={couponFormData.gateway} onChange={e => setCouponFormData({...couponFormData, gateway: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none">
                              <option value="stripe">Stripe Coupon (USD)</option>
                              <option value="razorpay">Razorpay Offer (INR)</option>
                           </select>
                        </div>

                        {/* TARGET */}
                        <div>
                           <label className="block text-xs font-bold text-slate-700 mb-1">Applicable To</label>
                           <select value={couponFormData.applicableTo} onChange={e => setCouponFormData({...couponFormData, applicableTo: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none">
                              <option value="subscription">Subscription Plans</option>
                              <option value="booster">Token Boosters</option>
                           </select>
                        </div>

                        {/* DURATION (Hide if Booster) */}
                        {couponFormData.applicableTo !== "booster" && (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Duration</label>
                            <select value={couponFormData.duration} onChange={e => setCouponFormData({...couponFormData, duration: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none">
                                <option value="once">Once (First Month Only)</option>
                                <option value="repeating">Repeating (Multi-Month)</option>
                                <option value="forever">Forever</option>
                            </select>
                          </div>
                        )}

                        {/* REPEATING MONTHS */}
                        {couponFormData.applicableTo !== "booster" && couponFormData.duration === 'repeating' && (
                           <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Duration (Months)</label>
                              <input required type="number" min="2" max="12" value={couponFormData.durationInMonths} onChange={e => setCouponFormData({...couponFormData, durationInMonths: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="e.g. 3" />
                           </div>
                        )}

                        {/* DISCOUNT TYPE */}
                        <div>
                           <label className="block text-xs font-bold text-slate-700 mb-1">Discount Type</label>
                           <select value={couponFormData.discountType} onChange={e => setCouponFormData({...couponFormData, discountType: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none">
                              <option value="percentage">Percentage (%)</option>
                              <option value="flat">Flat Amount ($, ₹)</option>
                           </select>
                        </div>

                        {/* DISCOUNT VALUE */}
                        <div>
                           <label className="block text-xs font-bold text-slate-700 mb-1">
                              Discount Value {couponFormData.discountType === 'percentage' ? '(%)' : `(${couponFormData.gateway === 'stripe' ? 'USD $' : 'INR ₹'})`}
                           </label>
                           <input required type="number" min="1" max={couponFormData.discountType === 'percentage' ? "100" : undefined} value={couponFormData.discountValue} onChange={e => setCouponFormData({...couponFormData, discountValue: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-semibold focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={couponFormData.discountType === 'percentage' ? "e.g. 20" : "e.g. 50"} />
                        </div>
                     </div>

                     {/* RAZORPAY MANUAL ID INPUT */}
                     {couponFormData.gateway === 'razorpay' && (
                        <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200">
                           <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-2">
                             Razorpay Offer ID <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-[10px]">Required</span>
                           </label>
                           <p className="text-xs text-slate-500 mb-3">Since Razorpay disabled API creation, you must create the offer in your Razorpay Dashboard first, then paste the ID here.</p>
                           <input 
                             required 
                             type="text" 
                             value={couponFormData.razorpayOfferId} 
                             onChange={e => setCouponFormData({...couponFormData, razorpayOfferId: e.target.value})} 
                             className="w-full bg-white border border-slate-300 rounded-xl px-4 py-3 font-mono text-sm focus:ring-2 focus:ring-indigo-500 outline-none" 
                             placeholder="offer_xyz123abc" 
                           />
                        </div>
                     )}

                     <div className="flex justify-end pt-4">
                        <button type="submit" className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-black hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all text-sm">Create & Sync Code</button>
                     </div>
                  </form>
               </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {coupons.map(c => (
                  <div key={c.coupon_code} className={`bg-white rounded-3xl p-6 border shadow-sm flex flex-col relative transition-all ${c.status === 'active' ? 'border-slate-200' : 'border-slate-200 opacity-60 grayscale'}`}>
                     <div className={`absolute top-4 right-4 px-2 py-1 text-[10px] font-black uppercase tracking-wider rounded-md ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{c.status}</div>
                     
                     <div className="flex items-center gap-2 mb-4">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs ${c.gateway === 'stripe' ? 'bg-blue-500' : 'bg-emerald-500'}`}>
                           {c.gateway === 'stripe' ? 'S' : 'R'}
                        </div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">{c.coupon_code}</h3>
                     </div>
                     
                     <div className="text-3xl font-black text-indigo-600 mb-6">
                        {c.discount_type === 'flat' && c.gateway === 'stripe' ? '$' : ''}
                        {c.discount_type === 'flat' && c.gateway === 'razorpay' ? '₹' : ''}
                        {c.discount_value}
                        {c.discount_type === 'percentage' ? '%' : ''} OFF
                     </div>

                     <div className="space-y-2 text-xs font-semibold text-slate-500 bg-slate-50 p-4 rounded-xl border border-slate-100 flex-1">
                        <div className="flex justify-between"><span>Target:</span> <span className="text-slate-900 capitalize">{c.applicable_to}</span></div>
                        <div className="flex justify-between">
                           <span>Duration:</span> 
                           <span className="text-indigo-600 font-black">
                              {c.duration === 'repeating' ? `${c.duration_in_months} Mo` : c.duration}
                           </span>
                        </div>
                        {c.gateway === 'razorpay' && c.razorpay_offer_id && (
                           <div className="flex flex-col mt-2 pt-2 border-t border-slate-200">
                              <span>Razorpay ID:</span> 
                              <span className="text-[10px] break-all text-blue-600 font-mono mt-0.5">{c.razorpay_offer_id}</span>
                           </div>
                        )}
                     </div>

                     <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
                        <button onClick={() => handleToggleStatus(c, 'coupon')} className={`flex-1 border py-2 rounded-lg text-xs font-bold transition-all ${c.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
                           {c.status === 'active' ? 'Disable Code' : 'Enable Code'}
                        </button>
                     </div>
                  </div>
               ))}
            </div>
         </div>
      )}

    </div>
  );
}
// import { useState, useEffect } from "react";

// const DEFAULT_SYSTEM_FEATURES = [
//   { key: "Max Bot", value: "", isFixed: true },
//   { key: "Token Count", value: "", isFixed: true }
// ];

// export default function AdminBillingTab() {
//   const [activeTab, setActiveTab] = useState("plans"); 
  
//   // ==========================================
//   // STATE MANAGEMENT
//   // ==========================================
//   const [plans, setPlans] = useState([]);
//   const [boosters, setBoosters] = useState([]);
//   const [coupons, setCoupons] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);

//   const [showPlanForm, setShowPlanForm] = useState(false);
//   const [isEditingPlan, setIsEditingPlan] = useState(false);
//   const [currentPlanId, setCurrentPlanId] = useState(null);
//   const [planFormData, setPlanFormData] = useState({ 
//     name: "", amount_mrp_inr: "", amount_inr: "", amount_yearly_inr: "", 
//     amount_mrp_usd: "", amount_usd: "", amount_yearly_usd: "", 
//     grace_period: "7", 
//     stripe_monthly_id: "", stripe_yearly_id: "", razorpay_monthly_id: "", razorpay_yearly_id: "",
//     system_features: [...DEFAULT_SYSTEM_FEATURES], display_features: [""] 
//   });

//   const [showBoosterForm, setShowBoosterForm] = useState(false);
//   const [isEditingBooster, setIsEditingBooster] = useState(false);
//   const [currentBoosterId, setCurrentBoosterId] = useState(null);
//   const [boosterFormData, setBoosterFormData] = useState({
//     name: "", amount_inr: "", amount_usd: "", token_amount: ""
//   });

//   const [showCouponForm, setShowCouponForm] = useState(false);
//   const [isSavingCoupon, setIsSavingCoupon] = useState(false);

//   // ✅ NEW: State to hold fetched Razorpay offers
//   const [razorpayOffersList, setRazorpayOffersList] = useState([]); 
//   const [isLoadingOffers, setIsLoadingOffers] = useState(false);
//   // ✅ NEW: Tracks if Razorpay blocked the API
//   const [offerFetchFailed, setOfferFetchFailed] = useState(false);
  
//   const [couponFormData, setCouponFormData] = useState({ 
//     code: "", 
//     percentage: "", 
//     gateway: "stripe", 
//     type: "coupon",    
//     applicableTo: "all",
//     duration: "forever",
//     durationInMonths: "",
//     razorpayOfferId: "" // ✅ NEW: Admin pastes this from the Razorpay Dashboard
//   });

//   // ==========================================
//   // DATA FETCHING
//   // ==========================================
//   const fetchBillingData = async () => {
//     setIsLoading(true);
//     try {
//       const pRes = await fetch("/api/admin/plans");
//       const pData = await pRes.json();
//       if (pData.plans) setPlans(pData.plans);

//       const bRes = await fetch("/api/admin/booster-plans");
//       const bData = await bRes.json();
//       if (bData.plans) setBoosters(bData.plans);

//       const cRes = await fetch("/api/admin/coupons");
//       const cData = await cRes.json();
//       if (cData.coupons) setCoupons(cData.coupons);

//     } catch (error) {
//       console.error("Failed to fetch billing data", error);
//     }
//     setIsLoading(false);
//   };

//   useEffect(() => { fetchBillingData(); }, []);

//   // ✅ NEW: Function to fetch Razorpay Offers from our new API
//   // const fetchRazorpayOffers = async () => {
//   //   setIsLoadingOffers(true);
//   //   try {
//   //     const res = await fetch("/api/admin/razorpay-offers");
//   //     const data = await res.json();
//   //     if (res.ok) setRazorpayOffersList(data.offers);
//   //   } catch (error) {
//   //     console.error("Error fetching Razorpay offers:", error);
//   //   }
//   //   setIsLoadingOffers(false);
//   // };
//   const fetchRazorpayOffers = async () => {
//     setIsLoadingOffers(true);
//     setOfferFetchFailed(false); // Reset on new attempt
//     try {
//       const res = await fetch("/api/admin/razorpay-offers");
//       const data = await res.json();
//       if (res.ok) {
//           setRazorpayOffersList(data.offers);
//       } else {
//           setOfferFetchFailed(true); // Trigger fallback UI
//       }
//     } catch (error) {
//       console.error("Error fetching Razorpay offers:", error);
//       setOfferFetchFailed(true); // Trigger fallback UI
//     }
//     setIsLoadingOffers(false);
//   };

//   // ✅ NEW: Auto-fetch offers if user selects Razorpay
//   useEffect(() => {
//     if (couponFormData.gateway === 'razorpay' && razorpayOffersList.length === 0) {
//       fetchRazorpayOffers();
//     }
//   }, [couponFormData.gateway]);

//   const formatSystemFeaturesForEdit = (dbFeatures) => {
//     const editFeatures = [];
//     DEFAULT_SYSTEM_FEATURES.forEach(df => {
//       const matchKey = Object.keys(dbFeatures).find(k => k.toLowerCase() === df.key.toLowerCase());
//       editFeatures.push({ key: df.key, value: matchKey ? dbFeatures[matchKey] : "", isFixed: true });
//     });
//     Object.entries(dbFeatures).forEach(([k, v]) => {
//       if (!DEFAULT_SYSTEM_FEATURES.find(df => df.key.toLowerCase() === k.toLowerCase())) {
//         editFeatures.push({ key: k, value: v, isFixed: false });
//       }
//     });
//     return editFeatures;
//   };

//   const transformSystemFeaturesForApi = (uiFeatures) => {
//     const finalObj = {};
//     uiFeatures.forEach(f => {
//       if (f.key.trim() !== "" && f.value.trim() !== "") finalObj[f.key.trim()] = f.value.trim();
//     });
//     return finalObj;
//   };

//   // ==========================================
//   // PLAN HANDLERS 
//   // ==========================================
//   const handleEditPlan = (p) => {
//     setIsEditingPlan(true);
//     setCurrentPlanId(p.plan_id);
//     setPlanFormData({
//       name: p.plan_name || "", amount_mrp_inr: p.amount_mrp || "", amount_inr: p.amount || "", amount_yearly_inr: p.amount_yearly || "", 
//       amount_mrp_usd: p.amount_mrp_usd || "", amount_usd: p.amount_usd || "", amount_yearly_usd: p.amount_yearly_usd || "", 
//       grace_period: p.grace_period || "7", stripe_monthly_id: p.stripe_monthly_id || "", stripe_yearly_id: p.stripe_yearly_id || "",
//       razorpay_monthly_id: p.razorpay_monthly_id || "", razorpay_yearly_id: p.razorpay_yearly_id || "",
//       system_features: formatSystemFeaturesForEdit(p.system_features),
//       display_features: p.display_features?.length ? p.display_features : [""]
//     });
//     setShowPlanForm(true);
//   };

//   const handleSavePlan = async (e) => {
//     e.preventDefault();
//     const payload = {
//       ...planFormData,
//       system_features: transformSystemFeaturesForApi(planFormData.system_features),
//       display_features: planFormData.display_features.filter(f => f.trim() !== "")
//     };

//     const method = isEditingPlan ? "PUT" : "POST";
//     if (isEditingPlan) payload.id = currentPlanId;

//     const res = await fetch("/api/admin/plans", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
//     if (res.ok) { setShowPlanForm(false); fetchBillingData(); } 
//     else alert("Error saving plan");
//   };

//   const resetPlanForm = () => {
//     setIsEditingPlan(false);
//     setCurrentPlanId(null);
//     setPlanFormData({ 
//       name: "", amount_mrp_inr: "", amount_inr: "", amount_yearly_inr: "", amount_mrp_usd: "", amount_usd: "", amount_yearly_usd: "", 
//       grace_period: "7", stripe_monthly_id: "", stripe_yearly_id: "", razorpay_monthly_id: "", razorpay_yearly_id: "",
//       system_features: [...DEFAULT_SYSTEM_FEATURES], display_features: [""] 
//     });
//     setShowPlanForm(true);
//   };

//   // ==========================================
//   // BOOSTER HANDLERS
//   // ==========================================
//   const handleEditBooster = (b) => {
//     setIsEditingBooster(true);
//     setCurrentBoosterId(b.booster_id);
//     setBoosterFormData({ name: b.name || "", amount_inr: b.amount || "", amount_usd: b.amount_usd || "", token_amount: b.token_amount || "" });
//     setShowBoosterForm(true);
//   };

//   const handleSaveBooster = async (e) => {
//     e.preventDefault();
//     const payload = { ...boosterFormData };
//     const method = isEditingBooster ? "PUT" : "POST";
//     if (isEditingBooster) payload.id = currentBoosterId;

//     const res = await fetch("/api/admin/booster-plans", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
//     if (res.ok) { setShowBoosterForm(false); fetchBillingData(); } 
//     else alert("Error saving booster");
//   };

//   const resetBoosterForm = () => {
//     setIsEditingBooster(false);
//     setCurrentBoosterId(null);
//     setBoosterFormData({ name: "", amount_inr: "", amount_usd: "", token_amount: "" });
//     setShowBoosterForm(true);
//   };

//   // ==========================================
//   // COUPON HANDLERS
//   // ==========================================
//   const handleSaveCoupon = async (e) => {
//     e.preventDefault();
//     setIsSavingCoupon(true);
//     const res = await fetch("/api/admin/coupons", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(couponFormData)
//     });

//     if (res.ok) {
//       setShowCouponForm(false);
//       setCouponFormData({ 
//         code: "", percentage: "", gateway: "stripe", type: "coupon", 
//         applicableTo: "all", duration: "forever", durationInMonths: "", razorpayOfferId: "" 
//       });
//       fetchBillingData();
//     } else {
//       const err = await res.json();
//       alert(`Error: ${err.error}`);
//     }
//     setIsSavingCoupon(false);
//   };

//   const handleToggleStatus = async (item, type) => {
//     let endpoint, body;
//     const newStatus = item.status === 'active' ? 'inactive' : 'active';

//     if (type === 'plan') {
//       endpoint = '/api/admin/plans';
//       body = JSON.stringify({ id: item.plan_id, status: newStatus });
//     } else if (type === 'booster') {
//       endpoint = '/api/admin/booster-plans';
//       body = JSON.stringify({ id: item.booster_id, status: newStatus });
//     } else if (type === 'coupon') {
//       endpoint = '/api/admin/coupons';
//       body = JSON.stringify({ code: item.coupon_code, status: newStatus });
//     }

//     const res = await fetch(endpoint, { method: "PATCH", headers: { "Content-Type": "application/json" }, body });
//     if (res.ok) fetchBillingData();
//   };

//   if (isLoading) return <div className="p-8 text-center text-slate-500 font-medium">Loading Billing Configuration...</div>;

//   return (
//     <div className="w-full max-w-6xl mx-auto pb-24">
//       {/* HEADER & TABS */}
//       <div className="mb-8">
//         <h2 className="text-3xl font-black text-indigo-950 tracking-tight mb-6">Billing & Packages</h2>
//         <div className="flex gap-4 border-b border-slate-200">
//           <button onClick={() => setActiveTab("plans")} className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all border-b-2 ${activeTab === "plans" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
//             Subscription Plans
//           </button>
//           <button onClick={() => setActiveTab("boosters")} className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all border-b-2 ${activeTab === "boosters" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
//             Token Boosters
//           </button>
//           <button onClick={() => setActiveTab("coupons")} className={`pb-4 px-2 text-sm font-bold tracking-wide transition-all border-b-2 ${activeTab === "coupons" ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}>
//             Coupons & Offers
//           </button>
//         </div>
//       </div>

//       {/* ========================================================= */}
//       {/* PLANS TAB CONTENT */}
//       {/* ========================================================= */}
//       {activeTab === "plans" && (
//         <div className="animate-in fade-in duration-300">
//           <div className="flex justify-between items-center mb-6">
//             <h3 className="text-xl font-bold text-slate-800">Active Subscriptions</h3>
//             {!showPlanForm && (
//               <button onClick={resetPlanForm} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm">
//                 + Create New Plan
//               </button>
//             )}
//           </div>

//           {showPlanForm ? (
//             <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
//               <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
//                 <h3 className="text-xl font-black text-indigo-950">{isEditingPlan ? "Edit Plan" : "Create New Plan"}</h3>
//                 <button onClick={() => setShowPlanForm(false)} className="text-slate-400 hover:text-rose-500 font-bold transition-colors">✕ Cancel</button>
//               </div>

//               <form onSubmit={handleSavePlan} className="space-y-8">
//                 {/* 1. Basic Info */}
//                 <div>
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">1. Basic Info</h4>
//                   <input type="text" placeholder="Plan Name (e.g., Starter)" value={planFormData.name} onChange={e => setPlanFormData({...planFormData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-bold text-lg" required />
//                 </div>

//                 {/* 2. Pricing */}
//                 <div>
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">2. Pricing & Billing</h4>
//                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//                     <input type="number" placeholder="Monthly MRP (INR)" value={planFormData.amount_mrp_inr} onChange={e => setPlanFormData({...planFormData, amount_mrp_inr: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" required />
//                     <input type="number" placeholder="Monthly Price (INR)" value={planFormData.amount_inr} onChange={e => setPlanFormData({...planFormData, amount_inr: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" required />
//                     <input type="number" placeholder="Yearly Price (INR)" value={planFormData.amount_yearly_inr} onChange={e => setPlanFormData({...planFormData, amount_yearly_inr: e.target.value})} className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-indigo-300" required />

//                     <input type="number" placeholder="Monthly MRP (USD)" value={planFormData.amount_mrp_usd} onChange={e => setPlanFormData({...planFormData, amount_mrp_usd: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" required />
//                     <input type="number" placeholder="Monthly Price (USD)" value={planFormData.amount_usd} onChange={e => setPlanFormData({...planFormData, amount_usd: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none" required />
//                     <input type="number" placeholder="Yearly Price (USD)" value={planFormData.amount_yearly_usd} onChange={e => setPlanFormData({...planFormData, amount_yearly_usd: e.target.value})} className="w-full px-4 py-3 bg-indigo-50 border border-indigo-100 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none placeholder-indigo-300" required />

//                     <input type="number" placeholder="Grace Period (Days)" value={planFormData.grace_period} onChange={e => setPlanFormData({...planFormData, grace_period: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none md:col-span-3" required />
//                   </div>
//                 </div>

//                 {/* 3. Gateway IDs */}
//                 <div>
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">3. Gateway Product IDs</h4>
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
//                       <div className="text-xs font-bold text-slate-500 uppercase">Stripe (USD)</div>
//                       <input type="text" placeholder="Monthly Price ID (price_...)" value={planFormData.stripe_monthly_id} onChange={e => setPlanFormData({...planFormData, stripe_monthly_id: e.target.value})} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none" required />
//                       <input type="text" placeholder="Yearly Price ID (price_...)" value={planFormData.stripe_yearly_id} onChange={e => setPlanFormData({...planFormData, stripe_yearly_id: e.target.value})} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none" required />
//                     </div>
//                     <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
//                       <div className="text-xs font-bold text-slate-500 uppercase">Razorpay (INR)</div>
//                       <input type="text" placeholder="Monthly Plan ID (plan_...)" value={planFormData.razorpay_monthly_id} onChange={e => setPlanFormData({...planFormData, razorpay_monthly_id: e.target.value})} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none" required />
//                       <input type="text" placeholder="Yearly Plan ID (plan_...)" value={planFormData.razorpay_yearly_id} onChange={e => setPlanFormData({...planFormData, razorpay_yearly_id: e.target.value})} className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none" required />
//                     </div>
//                   </div>
//                 </div>

//                 {/* 4. System Logic */}
//                 <div>
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">4. Backend Logic Limits</h4>
//                   <div className="space-y-2">
//                     {planFormData.system_features.map((f, i) => (
//                       <div key={i} className="flex gap-2">
//                         <input type="text" placeholder="System Key (e.g., maxBots)" value={f.key} disabled={f.isFixed} onChange={e => { const newF = [...planFormData.system_features]; newF[i].key = e.target.value; setPlanFormData({...planFormData, system_features: newF}); }} className={`w-1/2 px-4 py-2 border border-slate-200 rounded-lg focus:outline-none ${f.isFixed ? 'bg-slate-100 text-slate-500' : 'bg-white'}`} />
//                         <input type="text" placeholder="Value (e.g., 5)" value={f.value} onChange={e => { const newF = [...planFormData.system_features]; newF[i].value = e.target.value; setPlanFormData({...planFormData, system_features: newF}); }} className="w-1/2 px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
//                         {!f.isFixed && (
//                           <button type="button" onClick={() => { const newF = planFormData.system_features.filter((_, idx) => idx !== i); setPlanFormData({...planFormData, system_features: newF}); }} className="px-3 text-rose-500 hover:bg-rose-50 rounded-lg font-bold">✕</button>
//                         )}
//                       </div>
//                     ))}
//                     <button type="button" onClick={() => setPlanFormData({...planFormData, system_features: [...planFormData.system_features, { key: "", value: "", isFixed: false }]})} className="text-sm text-indigo-600 font-bold hover:text-indigo-800 mt-2">+ Add Logic Limit</button>
//                   </div>
//                 </div>

//                 {/* 5. UI Features */}
//                 <div>
//                   <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">5. Features Displayed to User</h4>
//                   <div className="space-y-2">
//                     {planFormData.display_features.map((f, i) => (
//                       <div key={i} className="flex gap-2">
//                         <input type="text" placeholder="e.g., Unlimited Custom Prompts" value={f} onChange={e => { const newF = [...planFormData.display_features]; newF[i] = e.target.value; setPlanFormData({...planFormData, display_features: newF}); }} className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:outline-none" />
//                         <button type="button" onClick={() => { const newF = planFormData.display_features.filter((_, idx) => idx !== i); setPlanFormData({...planFormData, display_features: newF}); }} className="px-3 text-rose-500 hover:bg-rose-50 rounded-lg font-bold">✕</button>
//                       </div>
//                     ))}
//                     <button type="button" onClick={() => setPlanFormData({...planFormData, display_features: [...planFormData.display_features, ""]})} className="text-sm text-indigo-600 font-bold hover:text-indigo-800 mt-2">+ Add UI Feature</button>
//                   </div>
//                 </div>

//                 <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
//                   <button type="button" onClick={() => setShowPlanForm(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
//                   <button type="submit" className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-md">
//                     {isEditingPlan ? "Save Changes" : "Publish Plan"}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//               {plans.map(p => (
//                 <div key={p.plan_id} className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col ${p.status === 'inactive' ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}>
//                   <div className="flex justify-between items-start mb-2">
//                     <h3 className="text-xl font-bold">{p.plan_name}</h3>
//                     <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${p.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{p.status}</span>
//                   </div>
                  
//                   <div className="flex flex-col gap-1 my-4 text-sm font-bold text-slate-500 bg-slate-50 p-3 rounded-lg border border-slate-100">
//                     <div className="flex justify-between">
//                         <span>Monthly:</span> <span className="text-slate-800">₹{p.amount} / ${p.amount_usd}</span>
//                     </div>
//                     <div className="flex justify-between">
//                         <span>Yearly:</span> <span className="text-indigo-600">₹{p.amount_yearly || 0} / ${p.amount_yearly_usd || 0}</span>
//                     </div>
//                   </div>

//                   <div className="text-xs text-slate-400 font-medium mb-6 flex-1 space-y-1">
//                     {p.display_features?.slice(0, 4).map((f, i) => <div key={i}>✓ {f}</div>)}
//                     {p.display_features?.length > 4 && <div>+ {p.display_features.length - 4} more</div>}
//                   </div>
//                   <div className="flex gap-2 mt-auto pt-4 border-t border-slate-100">
//                     <button onClick={() => handleEditPlan(p)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200">Edit</button>
//                     <button onClick={() => handleToggleStatus(p, 'plan')} className={`flex-1 border py-2.5 rounded-lg text-sm font-bold ${p.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
//                       {p.status === 'active' ? 'Disable' : 'Enable'}
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* ========================================================= */}
//       {/* BOOSTERS TAB CONTENT */}
//       {/* ========================================================= */}
//       {activeTab === "boosters" && (
//         <div className="animate-in fade-in duration-300">
//           <div className="flex justify-between items-center mb-6">
//             <h3 className="text-xl font-bold text-slate-800">Token Boosters (One-Time)</h3>
//             {!showBoosterForm && (
//               <button onClick={resetBoosterForm} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm">
//                 + Create Booster
//               </button>
//             )}
//           </div>

//           {showBoosterForm ? (
//             <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
//               <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
//                 <h3 className="text-xl font-black text-indigo-950">{isEditingBooster ? "Edit Booster" : "Create New Booster"}</h3>
//                 <button onClick={() => setShowBoosterForm(false)} className="text-slate-400 hover:text-rose-500 font-bold transition-colors">✕ Cancel</button>
//               </div>

//               <form onSubmit={handleSaveBooster} className="space-y-6">
//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                   <div>
//                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Booster Name</label>
//                     <input type="text" placeholder="e.g., 5,000 Tokens" value={boosterFormData.name} onChange={e => setBoosterFormData({...boosterFormData, name: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Tokens Granted</label>
//                     <input type="number" placeholder="5000" value={boosterFormData.token_amount} onChange={e => setBoosterFormData({...boosterFormData, token_amount: e.target.value})} className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700" required />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Price (INR)</label>
//                     <input type="number" placeholder="499" value={boosterFormData.amount_inr} onChange={e => setBoosterFormData({...boosterFormData, amount_inr: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Price (USD)</label>
//                     <input type="number" placeholder="9.99" value={boosterFormData.amount_usd} onChange={e => setBoosterFormData({...boosterFormData, amount_usd: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
//                   </div>
//                 </div>

//                 <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
//                   <button type="button" onClick={() => setShowBoosterForm(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-all">Cancel</button>
//                   <button type="submit" className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-md">
//                     {isEditingBooster ? "Save Changes" : "Publish Booster"}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
//               {boosters.map(b => (
//                 <div key={b.booster_id} className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col ${b.status === 'inactive' ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}>
//                   <div className="flex justify-between items-start mb-2">
//                     <h3 className="text-xl font-bold">{b.name}</h3>
//                     <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{b.status}</span>
//                   </div>
//                   <div className="text-3xl font-black text-emerald-600 mb-4">+{b.token_amount} Tokens</div>
//                   <div className="flex justify-between items-center mb-6 text-sm font-bold text-slate-500">
//                     <span>₹{b.amount}</span><span>${b.amount_usd}</span>
//                   </div>
//                   <div className="flex gap-2 mt-auto">
//                     <button onClick={() => handleEditBooster(b)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200">Edit</button>
//                     <button onClick={() => handleToggleStatus(b, 'booster')} className={`flex-1 border py-2.5 rounded-lg text-sm font-bold ${b.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
//                       {b.status === 'active' ? 'Disable' : 'Enable'}
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}

//       {/* ========================================================= */}
//       {/* COUPONS TAB CONTENT */}
//       {/* ========================================================= */}
//       {activeTab === "coupons" && (
//         <div className="animate-in fade-in duration-300">
//           <div className="flex justify-between items-center mb-6">
//             <h3 className="text-xl font-bold text-slate-800">Gateway-Specific Discounts</h3>
//             {!showCouponForm && (
//               <button onClick={() => setShowCouponForm(true)} className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all text-sm">
//                 + Create New Code
//               </button>
//             )}
//           </div>

//           {showCouponForm ? (
//             <div className="bg-white p-6 lg:p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
//               <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
//                 <h3 className="text-xl font-black text-indigo-950">New {couponFormData.gateway === 'stripe' ? 'Stripe Coupon' : 'Razorpay Offer'}</h3>
//                 <button onClick={() => setShowCouponForm(false)} className="text-slate-400 hover:text-rose-500 font-bold transition-colors">✕ Cancel</button>
//               </div>

//               <form onSubmit={handleSaveCoupon} className="space-y-6">
//                 {/* SHARED FIELDS */}
//                 <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                   <div className="md:col-span-2">
//                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Target Gateway</label>
//                     <div className="flex gap-2">
//                         <button type="button" onClick={() => setCouponFormData({...couponFormData, gateway: 'stripe', type: 'coupon'})} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${couponFormData.gateway === 'stripe' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}>Stripe (USD)</button>
//                         <button type="button" onClick={() => setCouponFormData({...couponFormData, gateway: 'razorpay', type: 'offer'})} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${couponFormData.gateway === 'razorpay' ? 'bg-indigo-50 border-indigo-600 text-indigo-700' : 'bg-white border-slate-200 text-slate-400'}`}>Razorpay (INR)</button>
//                     </div>
//                   </div>
//                   <div>
//                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Code Name</label>
//                     <input type="text" placeholder="SUMMER50" value={couponFormData.code} onChange={e => setCouponFormData({...couponFormData, code: e.target.value.toUpperCase()})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 font-black tracking-widest" required />
//                   </div>
//                   <div>
//                     <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Discount (%)</label>
//                     <input type="number" placeholder="20" value={couponFormData.percentage} onChange={e => setCouponFormData({...couponFormData, percentage: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold" required />
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                     <div>
//                         <label className="block text-xs font-bold uppercase text-slate-500 mb-2">Applicable To</label>
//                         <select 
//                           value={couponFormData.applicableTo} 
//                           onChange={e => setCouponFormData({...couponFormData, applicableTo: e.target.value})} 
//                           className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold"
//                         >
//                             <option value="all">All Products</option>
//                             <option value="subscription">Subscriptions Only</option>
//                             <option value="booster">Boosters Only</option>
//                         </select>
//                     </div>
                    
//                     {/* STRIPE SPECIFIC: Duration */}
//                     {couponFormData.gateway === 'stripe' && (
//                         <div>
//                             <label className="block text-xs font-bold uppercase text-indigo-600 mb-2">Stripe Duration</label>
//                             <div className="flex gap-2">
//                                 <select value={couponFormData.duration} onChange={e => setCouponFormData({...couponFormData, duration: e.target.value})} className="flex-1 px-4 py-3 bg-white border border-slate-200 rounded-xl font-bold">
//                                     <option value="forever">Forever</option>
//                                     <option value="once">First Month</option>
//                                     <option value="repeating">Multiple Months</option>
//                                 </select>
//                                 {couponFormData.duration === 'repeating' && (
//                                     <input type="number" placeholder="Months" value={couponFormData.durationInMonths} onChange={e => setCouponFormData({...couponFormData, durationInMonths: e.target.value})} className="w-24 px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-700" required />
//                                 )}
//                             </div>
//                         </div>
//                     )}

//                     {/* RAZORPAY SPECIFIC: Dashboard Offer Dropdown */}
//                     {/* RAZORPAY SPECIFIC: Dashboard Offer Dropdown OR Fallback Input */}
//                     {couponFormData.gateway === 'razorpay' && (
//                         <div className="animate-in slide-in-from-left-2 duration-300">
//                             <div className="flex justify-between items-end mb-2">
//                               <label className="block text-xs font-bold uppercase text-indigo-600">
//                                   Link to Razorpay Offer
//                               </label>
//                               {!offerFetchFailed && (
//                                   <button type="button" onClick={fetchRazorpayOffers} className="text-[10px] font-bold text-indigo-500 hover:text-indigo-700">
//                                     {isLoadingOffers ? "Refreshing..." : "↻ Refresh Offers"}
//                                   </button>
//                               )}
//                             </div>

//                             {offerFetchFailed ? (
//                                 // 🚨 FALLBACK UI: Manual Input Box
//                                 <>
//                                     <input 
//                                         type="text" 
//                                         placeholder="offer_... (Paste from Dashboard)" 
//                                         value={couponFormData.razorpayOfferId} 
//                                         onChange={e => setCouponFormData({...couponFormData, razorpayOfferId: e.target.value})} 
//                                         className="w-full px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl font-bold text-rose-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
//                                         required={couponFormData.applicableTo === 'subscription'}
//                                     />
//                                     <p className="text-[10px] font-bold text-rose-500 mt-1.5">
//                                         ⚠️ Auto-fetch restricted by Razorpay. Please create the offer in your dashboard and paste the ID manually.
//                                     </p>
//                                 </>
//                             ) : (
//                                 // ✅ PRIMARY UI: Dynamic Dropdown
//                                 <>
//                                     <select 
//                                         value={couponFormData.razorpayOfferId} 
//                                         onChange={e => setCouponFormData({...couponFormData, razorpayOfferId: e.target.value})} 
//                                         className="w-full px-4 py-3 bg-indigo-50 border border-indigo-200 rounded-xl font-bold text-indigo-800"
//                                         required={couponFormData.applicableTo === 'subscription'}
//                                     >
//                                         <option value="">-- Select an active offer --</option>
//                                         {razorpayOffersList.map(offer => (
//                                             <option key={offer.id} value={offer.id}>
//                                                 {offer.name} ({offer.id})
//                                             </option>
//                                         ))}
//                                     </select>
//                                     <p className="text-[10px] font-medium text-indigo-500 mt-1">
//                                         Create new offers in the Razorpay Dashboard, then refresh this list.
//                                     </p>
//                                 </>
//                             )}
//                         </div>
//                     )}
//                 </div>

//                 <div className="pt-6 border-t border-slate-100 flex justify-end gap-3">
//                   <button type="button" onClick={() => setShowCouponForm(false)} className="px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 rounded-xl">Cancel</button>
//                   <button type="submit" disabled={isSavingCoupon} className={`text-white px-8 py-3 rounded-xl font-bold transition-all ${isSavingCoupon ? 'bg-slate-400' : 'bg-indigo-600 hover:bg-indigo-700 shadow-md'}`}>
//                     {isSavingCoupon ? "Processing..." : `Save Razorpay Offer`}
//                   </button>
//                 </div>
//               </form>
//             </div>
//           ) : (
//             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
//               {coupons.map(c => (
//                 <div key={c.coupon_code} className={`bg-white rounded-2xl shadow-sm border p-6 flex flex-col relative overflow-hidden ${c.status === 'inactive' ? 'opacity-60 grayscale' : 'border-slate-200'}`}>
//                   {/* Gateway Badge */}
//                   <div className={`absolute top-0 right-0 px-3 py-1 text-[10px] font-black uppercase tracking-tighter rounded-bl-lg ${c.gateway === 'stripe' ? 'bg-indigo-600 text-white' : 'bg-blue-500 text-white'}`}>
//                     {c.gateway}
//                   </div>

//                   <div className="flex justify-between items-start mb-2">
//                     <h3 className="text-xl font-black tracking-widest text-indigo-900">{c.coupon_code}</h3>
//                     <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{c.status}</span>
//                   </div>
                  
//                   <div className="text-3xl font-black text-emerald-600 mb-4">{c.discount_percentage}% OFF</div>
                  
//                   <div className="text-[11px] font-bold text-slate-500 space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100 flex-1">
//                     <div className="flex justify-between"><span>Type:</span> <span className="text-slate-900 uppercase">{c.type}</span></div>
//                     <div className="flex justify-between"><span>Target:</span> <span className="text-slate-900 capitalize">{c.applicable_to}</span></div>
//                     {c.gateway === 'stripe' && <div className="flex justify-between"><span>Duration:</span> <span className="text-indigo-600 font-black">{c.duration === 'repeating' ? `${c.duration_in_months} Mo` : c.duration}</span></div>}
//                     {c.gateway === 'razorpay' && c.razorpay_offer_id && <div className="flex flex-col mt-2 pt-2 border-t border-slate-200"><span>Dashboard ID:</span> <span className="text-[9px] break-all text-blue-600 font-mono mt-0.5">{c.razorpay_offer_id}</span></div>}
//                   </div>

//                   <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
//                     <button onClick={() => handleToggleStatus(c, 'coupon')} className={`flex-1 border py-2 rounded-lg text-xs font-bold transition-all ${c.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>
//                       {c.status === 'active' ? 'Disable' : 'Enable'}
//                     </button>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>
//       )}
//     </div>
//   );
// }