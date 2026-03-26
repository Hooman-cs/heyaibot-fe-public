import { useState, useEffect } from "react";

const DEFAULT_SYSTEM_FEATURES = [
  { key: "Max Bot", value: "", isFixed: true },
  { key: "Token Count", value: "", isFixed: true },
  { key: "Overage Rate", value: "0.01", isFixed: true }
];

export default function AdminPlansTab() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);

  const [formData, setFormData] = useState({ 
    name: "", 
    amount_mrp_inr: "", amount_inr: "", 
    amount_mrp_usd: "", amount_usd: "", 
    duration: "30", grace_period: "7", 
    billing_category: "standard", // "standard" or "custom"
    yearly_discount: "20",
    system_features: [...DEFAULT_SYSTEM_FEATURES],
    display_features: [""] 
  });

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      setPlans(data.plans || []);
      setLoading(false);
    } catch (error) { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  const handleSystemFeatureChange = (index, field, value) => {
    const newFeatures = [...formData.system_features];
    newFeatures[index][field] = value;
    setFormData({ ...formData, system_features: newFeatures });
  };
  const addSystemFeatureRow = () => setFormData({ ...formData, system_features: [...formData.system_features, { key: "", value: "", isFixed: false }] });
  const removeSystemFeatureRow = (index) => setFormData({ ...formData, system_features: formData.system_features.filter((_, i) => i !== index) });

  const handleDisplayFeatureChange = (index, value) => {
    const newFeatures = [...formData.display_features];
    newFeatures[index] = value;
    setFormData({ ...formData, display_features: newFeatures });
  };
  const addDisplayFeatureRow = () => setFormData({ ...formData, display_features: [...formData.display_features, ""] });
  const removeDisplayFeatureRow = (index) => setFormData({ ...formData, display_features: formData.display_features.filter((_, i) => i !== index) });

  const resetForm = () => {
    setFormData({ 
      name: "", amount_mrp_inr: "", amount_inr: "", amount_mrp_usd: "", amount_usd: "", 
      duration: "30", grace_period: "7", billing_category: "standard", yearly_discount: "20",
      system_features: [...DEFAULT_SYSTEM_FEATURES.map(f => ({...f}))], display_features: [""]
    });
    setIsEditing(false); setCurrentPlanId(null); setShowForm(false);
  };

  const handleEdit = (plan) => {
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

    // Determine category based on arrays
    const isCustom = plan.allowed_billing_cycles?.includes("custom");

    setFormData({ 
      name: plan.plan_name, 
      amount_mrp_inr: plan.amount_mrp || plan.amount || "", amount_inr: plan.amount || "", 
      amount_mrp_usd: plan.amount_mrp_usd || plan.amount_usd || "", amount_usd: plan.amount_usd || "", 
      duration: plan.duration, grace_period: plan.grace_period || 7, 
      billing_category: isCustom ? "custom" : "standard",
      yearly_discount: plan.yearly_discount || "20",
      system_features: systemFeatureArray,
      display_features: plan.display_features?.length > 0 ? plan.display_features : [""]
    });
    
    setCurrentPlanId(plan.plan_id); setIsEditing(true); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const systemFeaturesObject = {};
    formData.system_features.forEach(f => { if (f.key.trim()) systemFeaturesObject[f.key.trim()] = f.value; });
    const cleanDisplayFeatures = formData.display_features.filter(f => f.trim() !== "");

    // Set the arrays based on the group
    const allowedCycles = formData.billing_category === "standard" ? ["monthly", "yearly"] : ["custom"];

    const payload = { 
      name: formData.name, 
      amount_mrp: formData.amount_mrp_inr, amount: formData.amount_inr, 
      amount_mrp_usd: formData.amount_mrp_usd, amount_usd: formData.amount_usd, 
      duration: formData.billing_category === "standard" ? "30" : formData.duration, 
      grace_period: formData.grace_period, 
      allowed_billing_cycles: allowedCycles,
      yearly_discount: formData.yearly_discount,
      system_features: systemFeaturesObject, display_features: cleanDisplayFeatures 
    };
    
    const method = isEditing ? "PUT" : "POST";
    const body = isEditing ? { id: currentPlanId, ...payload } : payload;

    const res = await fetch("/api/admin/plans", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (res.ok) { alert(isEditing ? "Updated!" : "Created!"); resetForm(); fetchPlans(); } 
    else { const err = await res.json(); alert("Error: " + err.error); }
  };

  const handleToggle = async (plan) => {
    const newStatus = plan.status === "active" ? "inactive" : "active";
    if(!confirm(`Change status to ${newStatus}?`)) return;
    const res = await fetch("/api/admin/plans", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: plan.plan_id, status: newStatus }) });
    if (res.ok) fetchPlans();
  };

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Loading Plans...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Plan Management</h2>
        {!showForm && <button onClick={() => { resetForm(); setShowForm(true); }} className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-all">+ Create New Plan</button>}
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">{isEditing ? "Edit Plan Details" : "Create a New Plan"}</h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-rose-500 font-bold">✕ Cancel</button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-2 lg:col-span-4"><label className="block text-sm font-bold text-slate-700 mb-2">Plan Name</label><input required className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="e.g. Pro" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Plan Price (INR ₹)</label><input required type="number" className="w-full border px-4 py-2 rounded-lg bg-white text-slate-500" placeholder="MRP" value={formData.amount_mrp_inr} onChange={e => setFormData({...formData, amount_mrp_inr: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (INR ₹)</label><input required type="number" className="w-full border px-4 py-2 rounded-lg bg-indigo-50 font-bold text-indigo-700" placeholder="Final Price" value={formData.amount_inr} onChange={e => setFormData({...formData, amount_inr: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Plan Price (USD $)</label><input required type="number" step="0.01" className="w-full border px-4 py-2 rounded-lg bg-white text-slate-500" placeholder="MRP" value={formData.amount_mrp_usd} onChange={e => setFormData({...formData, amount_mrp_usd: e.target.value})} /></div>
              <div><label className="block text-sm font-bold text-slate-700 mb-2">Selling Price (USD $)</label><input required type="number" step="0.01" className="w-full border px-4 py-2 rounded-lg bg-indigo-50 font-bold text-indigo-700" placeholder="Final Price" value={formData.amount_usd} onChange={e => setFormData({...formData, amount_usd: e.target.value})} /></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 border-t border-slate-100 pt-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-3">Plan Availability (Pricing Page Tabs)</label>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.billing_category === 'standard'} onChange={() => setFormData({...formData, billing_category: 'standard'})} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold">Standard (Monthly & Yearly)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={formData.billing_category === 'custom'} onChange={() => setFormData({...formData, billing_category: 'custom'})} className="w-4 h-4 text-indigo-600" />
                    <span className="text-sm font-bold">Custom Single Cycle</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className={formData.billing_category === 'custom' ? 'opacity-50' : ''}>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Yearly Discount %</label>
                  <input required type="number" disabled={formData.billing_category === 'custom'} className="w-full border px-4 py-2 rounded-lg bg-white" value={formData.yearly_discount} onChange={e => setFormData({...formData, yearly_discount: e.target.value})} />
                </div>
                <div className={formData.billing_category === 'standard' ? 'opacity-50' : ''}>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Duration (Days)</label>
                  <input required type="number" disabled={formData.billing_category === 'standard'} className="w-full border px-4 py-2 rounded-lg bg-white" value={formData.billing_category === 'standard' ? 30 : formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Grace (Days)</label>
                  <input required type="number" className="w-full border px-4 py-2 rounded-lg bg-white" value={formData.grace_period} onChange={e => setFormData({...formData, grace_period: e.target.value})} />
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 border-t border-slate-100 pt-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Pricing Page Features (Visible)</label>
                <p className="text-xs text-slate-500 mb-4">These lines will be displayed as checkmarks on the pricing page.</p>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {formData.display_features.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <input className="flex-1 border px-4 py-2 rounded-lg bg-white text-sm" placeholder="e.g. Priority 24/7 Support" value={item} onChange={e => handleDisplayFeatureChange(index, e.target.value)} />
                      <button type="button" onClick={() => removeDisplayFeatureRow(index)} className="text-rose-500 font-bold px-3 py-2 border border-transparent hover:bg-rose-50 rounded-lg shrink-0">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addDisplayFeatureRow} className="text-indigo-600 font-bold text-sm mt-2 px-2 py-1 hover:bg-indigo-50 rounded inline-flex items-center gap-1"><span>+</span> Add Text Line</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">System Limits (Hidden)</label>
                <p className="text-xs text-slate-500 mb-4">Variables used by the code to restrict the user. Not shown to customers.</p>
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  {formData.system_features.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-3">
                      <input className={`flex-1 border px-3 py-2 rounded-lg text-sm ${item.isFixed ? 'bg-slate-100 font-bold text-slate-500 cursor-not-allowed border-slate-200' : 'bg-white'}`} placeholder="Key" value={item.key} onChange={e => !item.isFixed && handleSystemFeatureChange(index, 'key', e.target.value)} readOnly={item.isFixed} required />
                      <input className="w-24 border px-3 py-2 rounded-lg bg-white text-sm" placeholder="Value" value={item.value} onChange={e => handleSystemFeatureChange(index, 'value', e.target.value)} required={item.isFixed} />
                      {item.isFixed ? <div className="px-2 py-2 w-10 flex justify-center text-slate-300">🔒</div> : <button type="button" onClick={() => removeSystemFeatureRow(index)} className="text-rose-500 font-bold px-2 py-2 hover:bg-rose-50 rounded-lg w-10 text-center">✕</button>}
                    </div>
                  ))}
                  <button type="button" onClick={addSystemFeatureRow} className="text-indigo-600 font-bold text-sm mt-2 px-2 py-1 hover:bg-indigo-50 rounded inline-flex items-center gap-1"><span>+</span> Add Variable</button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-4 border-t border-slate-100 pt-8 mt-6">
              <button type="submit" className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all text-lg">{isEditing ? "Save Changes" : "Create Plan"}</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map(plan => {
            const featuresList = plan.display_features?.length > 0 ? plan.display_features : Object.entries(plan.features || {}).map(([k,v]) => `${v} ${k}`);
            const isStandard = plan.allowed_billing_cycles?.includes("yearly");

            return (
            <div key={plan.plan_id} className={`bg-white rounded-3xl shadow-sm border p-6 flex flex-col ${plan.status === 'inactive' ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}>
              
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold capitalize">{plan.plan_name}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{plan.status}</span>
              </div>
              
              <div className="mt-2 mb-4">
                <div className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-1">INR Pricing</div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="text-3xl font-extrabold text-slate-900">₹{plan.amount || 0}</span>
                  {Number(plan.amount_mrp || 0) > Number(plan.amount || 0) && <span className="text-sm font-bold text-slate-400 line-through mb-1">₹{plan.amount_mrp}</span>}
                  <span className="text-sm font-medium text-slate-500 mb-1">/ {isStandard ? 'mo' : `${plan.duration}d`}</span>
                </div>

                <div className="text-xs text-slate-500 font-bold tracking-wider uppercase mb-1">USD Pricing</div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-extrabold text-slate-900">${plan.amount_usd || 0}</span>
                  {Number(plan.amount_mrp_usd || 0) > Number(plan.amount_usd || 0) && <span className="text-sm font-bold text-slate-400 line-through mb-1">${plan.amount_mrp_usd}</span>}
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-6">
                 {isStandard ? (
                   <span className="text-[10px] font-bold uppercase tracking-widest bg-blue-50 text-blue-600 px-2 py-1 rounded">Supports Monthly & Yearly ({plan.yearly_discount || 20}% Off)</span>
                 ) : (
                   <span className="text-[10px] font-bold uppercase tracking-widest bg-slate-100 text-slate-600 px-2 py-1 rounded">Custom Duration ({plan.duration} days)</span>
                 )}
                 <span className="text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-600 px-2 py-1 rounded">+{plan.grace_period || 7} Days Grace</span>
              </div>
              
              <ul className="text-sm text-slate-600 space-y-2 mb-8 flex-1 border-t border-slate-50 pt-4">
                {featuresList.map((text, idx) => (
                  <li key={idx} className="flex gap-2"><span className="text-indigo-500 shrink-0">✓</span><span>{text}</span></li>
                ))}
              </ul>
              
              <div className="flex gap-2">
                <button onClick={() => handleEdit(plan)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors">Edit</button>
                <button onClick={() => handleToggle(plan)} className={`flex-1 border py-2.5 rounded-lg text-sm font-bold transition-colors ${plan.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}>{plan.status === 'active' ? 'Disable' : 'Enable'}</button>
              </div>

            </div>
          )})}
        </div>
      )}
    </div>
  );
}
// import { useState, useEffect } from "react";

// const DEFAULT_FEATURES = [
//   { key: "Max Bot", value: "", isFixed: true },
//   { key: "Token Count", value: "", isFixed: true }
// ];

// export default function AdminPlansTab() {
//   const [plans, setPlans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [showForm, setShowForm] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [currentPlanId, setCurrentPlanId] = useState(null);

//   const [formData, setFormData] = useState({ 
//     name: "", 
//     price_inr: "", 
//     price_usd: "", 
//     duration: "30", 
//     grace_period: "7", 
//     features: [...DEFAULT_FEATURES] 
//   });

//   const fetchPlans = async () => {
//     try {
//       const res = await fetch("/api/admin/plans");
//       const data = await res.json();
//       setPlans(data.plans || []);
//       setLoading(false);
//     } catch (error) { 
//       setLoading(false); 
//     }
//   };

//   useEffect(() => { 
//     fetchPlans(); 
//   }, []);

//   const handleFeatureChange = (index, field, value) => {
//     const newFeatures = [...formData.features];
//     newFeatures[index][field] = value;
//     setFormData({ ...formData, features: newFeatures });
//   };

//   const addFeatureRow = () => {
//     setFormData({ 
//       ...formData, 
//       features: [...formData.features, { key: "", value: "", isFixed: false }] 
//     });
//   };

//   const removeFeatureRow = (index) => {
//     setFormData({ 
//       ...formData, 
//       features: formData.features.filter((_, i) => i !== index) 
//     });
//   };

//   const resetForm = () => {
//     setFormData({ 
//       name: "", 
//       price_inr: "", 
//       price_usd: "", 
//       duration: "30", 
//       grace_period: "7", 
//       features: [...DEFAULT_FEATURES.map(f => ({...f}))] 
//     });
//     setIsEditing(false); 
//     setCurrentPlanId(null); 
//     setShowForm(false);
//   };

//   const handleEdit = (plan) => {
//     const featureArray = [];
//     let hasMaxBot = false;
//     let hasTokenCount = false;

//     if (plan.features) {
//       Object.entries(plan.features).forEach(([key, value]) => {
//         if (key === "Max Bot" || key.toLowerCase() === "max bot" || key === "MaxBot") {
//           featureArray.push({ key: "Max Bot", value, isFixed: true }); 
//           hasMaxBot = true;
//         } else if (key === "Token Count" || key.toLowerCase() === "token count") {
//           featureArray.push({ key: "Token Count", value, isFixed: true }); 
//           hasTokenCount = true;
//         } else {
//           featureArray.push({ key, value, isFixed: false });
//         }
//       });
//     }

//     if (!hasTokenCount) {
//       featureArray.unshift({ key: "Token Count", value: "", isFixed: true });
//     }
//     if (!hasMaxBot) {
//       featureArray.unshift({ key: "Max Bot", value: "", isFixed: true });
//     }

//     setFormData({ 
//       name: plan.plan_name, 
//       price_inr: plan.amount || "", 
//       price_usd: plan.amount_usd || "", 
//       duration: plan.duration, 
//       grace_period: plan.grace_period || 7, 
//       features: featureArray 
//     });
    
//     setCurrentPlanId(plan.plan_id); 
//     setIsEditing(true); 
//     setShowForm(true);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const featuresObject = {};
    
//     formData.features.forEach(f => { 
//       if (f.key.trim()) {
//         featuresObject[f.key.trim()] = f.value; 
//       }
//     });

//     const payload = { 
//       name: formData.name, 
//       price: formData.price_inr, 
//       price_usd: formData.price_usd, 
//       duration: formData.duration, 
//       grace_period: formData.grace_period, 
//       features: featuresObject 
//     };
    
//     const method = isEditing ? "PUT" : "POST";
//     const body = isEditing ? { id: currentPlanId, ...payload } : payload;

//     const res = await fetch("/api/admin/plans", { 
//       method, 
//       headers: { "Content-Type": "application/json" }, 
//       body: JSON.stringify(body) 
//     });

//     if (res.ok) { 
//       alert(isEditing ? "Updated!" : "Created!"); 
//       resetForm(); 
//       fetchPlans(); 
//     } else { 
//       const err = await res.json(); 
//       alert("Error: " + err.error); 
//     }
//   };

//   const handleToggle = async (plan) => {
//     const newStatus = plan.status === "active" ? "inactive" : "active";
//     if(!confirm(`Change status to ${newStatus}?`)) return;
    
//     const res = await fetch("/api/admin/plans", { 
//       method: "PATCH", 
//       headers: { "Content-Type": "application/json" }, 
//       body: JSON.stringify({ id: plan.plan_id, status: newStatus }) 
//     });

//     if (res.ok) {
//       fetchPlans();
//     }
//   };

//   if (loading) {
//     return <div className="p-10 text-center text-slate-500 animate-pulse">Loading Plans...</div>;
//   }

//   return (
//     <div>
//       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
//         <h2 className="text-2xl font-bold text-slate-900">Plan Management</h2>
//         {!showForm && (
//           <button 
//             onClick={() => { resetForm(); setShowForm(true); }} 
//             className="w-full sm:w-auto bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-indigo-700 transition-all"
//           >
//             + Create New Plan
//           </button>
//         )}
//       </div>

//       {showForm && (
//         <div className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
//           <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex justify-between items-center">
//             <h2 className="text-lg font-bold text-slate-900">
//               {isEditing ? "Edit Plan Details" : "Create a New Plan"}
//             </h2>
//             <button onClick={resetForm} className="text-slate-400 hover:text-rose-500 font-bold">
//               ✕ Cancel
//             </button>
//           </div>
          
//           <form onSubmit={handleSubmit} className="p-4 sm:p-8">
//             {/* UPDATED GRID: Now safely holds all 5 inputs in one clean row on large screens */}
//             <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-6">
//               <div className="md:col-span-3 lg:col-span-2">
//                 <label className="block text-sm font-bold text-slate-700 mb-2">Plan Name</label>
//                 <input 
//                   required 
//                   className="w-full border px-4 py-2 rounded-lg bg-white" 
//                   value={formData.name} 
//                   onChange={e => setFormData({...formData, name: e.target.value})} 
//                 />
//               </div>
              
//               <div>
//                 <label className="block text-sm font-bold text-slate-700 mb-2">Price (INR ₹)</label>
//                 <input 
//                   required 
//                   type="number" 
//                   className="w-full border px-4 py-2 rounded-lg bg-white" 
//                   value={formData.price_inr} 
//                   onChange={e => setFormData({...formData, price_inr: e.target.value})} 
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-slate-700 mb-2">Price (USD $)</label>
//                 <input 
//                   required 
//                   type="number" 
//                   step="0.01" 
//                   className="w-full border px-4 py-2 rounded-lg bg-white" 
//                   value={formData.price_usd} 
//                   onChange={e => setFormData({...formData, price_usd: e.target.value})} 
//                 />
//               </div>

//               <div>
//                 <label className="block text-sm font-bold text-slate-700 mb-2">Duration (Days)</label>
//                 <input 
//                   required 
//                   type="number" 
//                   className="w-full border px-4 py-2 rounded-lg bg-white" 
//                   value={formData.duration} 
//                   onChange={e => setFormData({...formData, duration: e.target.value})} 
//                 />
//               </div>

//               {/* RESTORED: Grace Period Input */}
//               <div>
//                 <label className="block text-sm font-bold text-slate-700 mb-2">Grace (Days)</label>
//                 <input 
//                   required 
//                   type="number" 
//                   className="w-full border px-4 py-2 rounded-lg bg-white" 
//                   value={formData.grace_period} 
//                   onChange={e => setFormData({...formData, grace_period: e.target.value})} 
//                 />
//               </div>
//             </div>
            
//             <div className="mb-6">
//               <label className="block text-sm font-bold text-slate-700 mb-2">Features</label>
//               <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100 mb-2">
                
//                 {formData.features.map((item, index) => (
//                   <div key={index} className="flex flex-col sm:flex-row gap-3 mb-3">
//                     <input 
//                       className={`flex-1 border px-4 py-2 rounded-lg ${
//                         item.isFixed ? 'bg-slate-100 font-bold text-slate-500 cursor-not-allowed border-slate-200' : 'bg-white'
//                       }`} 
//                       placeholder="Feature Name" 
//                       value={item.key} 
//                       onChange={e => !item.isFixed && handleFeatureChange(index, 'key', e.target.value)} 
//                       readOnly={item.isFixed} 
//                       required 
//                     />
                    
//                     <input 
//                       className="flex-1 border px-4 py-2 rounded-lg bg-white" 
//                       placeholder={item.isFixed ? `Enter ${item.key} value` : "Value"} 
//                       value={item.value} 
//                       onChange={e => handleFeatureChange(index, 'value', e.target.value)} 
//                       required={item.isFixed} 
//                     />
                    
//                     {item.isFixed ? (
//                       <div className="flex items-center justify-center px-4 py-2 w-full sm:w-[88px] text-xs font-black uppercase text-slate-400 tracking-wider bg-slate-100 rounded-lg border border-slate-200">
//                         Required
//                       </div>
//                     ) : (
//                       <button 
//                         type="button" 
//                         onClick={() => removeFeatureRow(index)} 
//                         className="text-rose-500 font-bold px-3 py-2 border border-transparent hover:border-rose-200 hover:bg-rose-50 rounded-lg w-full sm:w-[88px] transition-colors"
//                       >
//                         Remove
//                       </button>
//                     )}
//                   </div>
//                 ))}

//                 <button 
//                   type="button" 
//                   onClick={addFeatureRow} 
//                   className="text-indigo-600 font-bold text-sm mt-2 px-2 py-1 hover:bg-indigo-50 rounded inline-flex items-center gap-1 transition-colors"
//                 >
//                   <span>+</span> Add Custom Feature
//                 </button>
//               </div>
//             </div>
            
//             <div className="flex justify-end gap-4 border-t border-slate-100 pt-6">
//               <button 
//                 type="submit" 
//                 className="w-full sm:w-auto bg-indigo-600 text-white px-8 py-2.5 rounded-lg font-bold hover:bg-indigo-700 shadow-md transition-all"
//               >
//                 {isEditing ? "Save Changes" : "Create Plan"}
//               </button>
//             </div>
//           </form>
//         </div>
//       )}

//       {!showForm && (
//         <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {plans.map(plan => (
//             <div key={plan.plan_id} className={`bg-white rounded-3xl shadow-sm border p-6 flex flex-col ${plan.status === 'inactive' ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}>
              
//               <div className="flex justify-between items-start mb-2">
//                 <h3 className="text-xl font-bold capitalize">{plan.plan_name}</h3>
//                 <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${plan.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
//                   {plan.status}
//                 </span>
//               </div>
              
//               <div className="text-3xl font-extrabold text-slate-900 mb-1">
//                 ₹{plan.amount} <span className="text-lg text-slate-400 font-normal">|</span> ${plan.amount_usd}
//                 <span className="text-sm font-medium text-slate-500 block">/ {plan.duration}d</span>
//               </div>
              
//               <div className="text-xs text-indigo-600 font-bold mb-6 bg-indigo-50 inline-block px-2 py-1 rounded w-max">
//                 +{plan.grace_period || 7} Days Grace
//               </div>
              
//               <ul className="text-sm text-slate-600 space-y-2 mb-8 flex-1">
//                 {plan.features && Object.entries(plan.features).map(([k, v]) => {
//                   const isCompulsory = k === "Max Bot" || k === "Token Count";
//                   return (
//                     <li key={k} className="flex justify-between items-center border-b border-slate-50 pb-1.5">
//                       <span className={isCompulsory ? "font-bold text-indigo-900" : ""}>{k}</span>
//                       <span className={`font-bold ${isCompulsory ? "text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded" : "text-slate-900"}`}>{v}</span>
//                     </li>
//                   );
//                 })}
//               </ul>
              
//               <div className="flex gap-2">
//                 <button 
//                   onClick={() => handleEdit(plan)} 
//                   className="flex-1 bg-slate-100 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200 transition-colors"
//                 >
//                   Edit
//                 </button>
//                 <button 
//                   onClick={() => handleToggle(plan)} 
//                   className={`flex-1 border py-2.5 rounded-lg text-sm font-bold transition-colors ${plan.status === 'active' ? 'border-rose-200 text-rose-600 hover:bg-rose-50' : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'}`}
//                 >
//                   {plan.status === 'active' ? 'Disable' : 'Enable'}
//                 </button>
//               </div>

//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }