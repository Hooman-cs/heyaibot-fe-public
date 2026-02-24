import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AdminPlans() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form Visibility & Edit State
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);

  // Form Data State
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "30",
    grace_period: "7", 
    features: [{ key: "", value: "" }]
  });

  // 1. Auth & Data Fetching
  useEffect(() => {
    if (status === "loading") return;
    
    if (!session?.user?.isSuperAdmin) {
      router.push("/dashboard");
      return;
    }

    fetchPlans();
  }, [session, status, router]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      setPlans(data.plans || []);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch plans", error);
      setLoading(false);
    }
  };

  // 2. Form Handlers
  const handleFeatureChange = (index, field, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index][field] = value;
    setFormData({ ...formData, features: newFeatures });
  };

  const addFeatureRow = () => {
    setFormData({ ...formData, features: [...formData.features, { key: "", value: "" }] });
  };

  const removeFeatureRow = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData({ ...formData, features: newFeatures });
  };

  const resetForm = () => {
    setFormData({ name: "", price: "", duration: "30", grace_period: "7", features: [{ key: "", value: "" }] });
    setIsEditing(false);
    setCurrentPlanId(null);
    setShowForm(false); // Hide form on cancel/reset
  };

  const handleEdit = (plan) => {
    const featureArray = plan.features 
      ? Object.entries(plan.features).map(([key, value]) => ({ key, value }))
      : [{ key: "", value: "" }];

    setFormData({
      name: plan.plan_name,
      price: plan.amount,
      duration: plan.duration,
      grace_period: plan.grace_period || 7,
      features: featureArray
    });
    setCurrentPlanId(plan.plan_id);
    setIsEditing(true);
    setShowForm(true); // Show form when editing
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 3. Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const featuresObject = {};
    formData.features.forEach(f => {
      if (f.key.trim()) featuresObject[f.key] = f.value;
    });

    const payload = {
      name: formData.name,
      price: formData.price,
      duration: formData.duration,
      grace_period: formData.grace_period, 
      features: featuresObject
    };

    const method = isEditing ? "PUT" : "POST";
    const body = isEditing ? { id: currentPlanId, ...payload } : payload;

    const res = await fetch("/api/admin/plans", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (res.ok) {
      alert(isEditing ? "Plan updated successfully!" : "Plan created successfully!");
      resetForm();
      fetchPlans();
    } else {
      const err = await res.json();
      alert("Error: " + err.error);
    }
  };

  // 4. Toggle Status
  const handleToggle = async (plan) => {
    const newStatus = plan.status === "active" ? "inactive" : "active";
    if(!confirm(`Change status to ${newStatus}?`)) return;

    const res = await fetch("/api/admin/plans", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: plan.plan_id, status: newStatus })
    });

    if (res.ok) fetchPlans();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl font-medium text-gray-500 animate-pulse">Loading Plans...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      
      {/* Header Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-6 mb-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Plan Management</h1>
            <p className="text-sm text-gray-500 mt-1">Create, edit, and manage your subscription tiers.</p>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-gray-600 hover:text-blue-600 font-medium text-sm transition-colors">
              &larr; Back to Dashboard
            </Link>
            {!showForm && (
              <button 
                onClick={() => { resetForm(); setShowForm(true); }}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-blue-700 hover:shadow transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Create New Plan
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4">
        
        {/* --- Create/Edit Form (Collapsible) --- */}
        {showForm && (
          <div className="bg-white rounded-2xl shadow-xl border border-blue-100 mb-10 overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
            <div className="bg-blue-50/50 border-b border-blue-100 px-8 py-5 flex justify-between items-center">
                <h2 className="text-xl font-extrabold text-gray-900">
                {isEditing ? "Edit Plan Details" : "Create a New Plan"}
                </h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-red-500 transition-colors">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Plan Name</label>
                  <input required className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="e.g. Pro Plan"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Price (₹)</label>
                  <input required type="number" className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="999"
                    value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Duration (Days)</label>
                  <input required type="number" className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="30"
                    value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Grace Period (Days)</label>
                  <input required type="number" className="w-full border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="7"
                    value={formData.grace_period} onChange={e => setFormData({...formData, grace_period: e.target.value})} />
                </div>
              </div>

              <div className="mb-8">
                <label className="block text-sm font-bold text-gray-700 mb-3">Features</label>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  {formData.features.map((item, index) => (
                    <div key={index} className="flex gap-3 mb-3">
                      <input className="flex-1 border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Feature Name (e.g. Max Bots)"
                        value={item.key} onChange={e => handleFeatureChange(index, 'key', e.target.value)} />
                      <input className="flex-1 border border-gray-300 px-4 py-2.5 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Value (e.g. 5)"
                        value={item.value} onChange={e => handleFeatureChange(index, 'value', e.target.value)} />
                      <button type="button" onClick={() => removeFeatureRow(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 px-3 rounded-lg font-bold transition-colors" title="Remove Feature">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addFeatureRow} className="mt-2 inline-flex items-center text-sm text-blue-600 font-bold hover:text-blue-800 transition-colors">
                     <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                     Add Another Feature
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-4 border-t border-gray-100">
                <button type="button" onClick={resetForm} className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="bg-blue-600 text-white px-8 py-2.5 rounded-lg hover:bg-blue-700 shadow-md font-bold transition-all">
                  {isEditing ? "Save Changes" : "Create Plan"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- Plans List Grid --- */}
        {plans.length === 0 && !showForm && !loading ? (
            <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                <p className="text-gray-500 text-lg mb-4">No plans found.</p>
                <button onClick={() => setShowForm(true)} className="text-blue-600 font-bold hover:underline">Create your first plan</button>
            </div>
        ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map(plan => (
                <div key={plan.plan_id} className={`bg-white rounded-2xl shadow-sm border flex flex-col transition-all duration-300 hover:shadow-md ${plan.status === 'inactive' ? 'opacity-70 border-gray-200 bg-gray-50' : 'border-gray-200 hover:-translate-y-1'}`}>
                
                <div className="p-6 border-b border-gray-100">
                    <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-extrabold text-gray-900 capitalize tracking-tight">{plan.plan_name}</h3>
                        <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wide ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {plan.status}
                        </span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-extrabold text-gray-900">₹{plan.amount}</span>
                        <span className="text-gray-500 font-medium pb-1">/ {plan.duration} days</span>
                    </div>
                    <div className="mt-2 text-sm font-medium text-blue-600 bg-blue-50 inline-block px-3 py-1 rounded-md">
                        + {plan.grace_period || 7} Days Grace Period
                    </div>
                </div>
                
                <div className="p-6 flex-1">
                    <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Features</h4>
                    <ul className="text-sm text-gray-600 space-y-3">
                    {plan.features && Object.entries(plan.features).map(([k, v]) => (
                        <li key={k} className="flex justify-between items-center border-b border-gray-50 pb-2 last:border-0 last:pb-0">
                            <span className="flex items-center gap-2">
                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                                {k}
                            </span>
                            <span className="font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded text-xs">{v}</span>
                        </li>
                    ))}
                    </ul>
                </div>

                <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-3 rounded-b-2xl">
                    <button onClick={() => handleEdit(plan)} className="flex-1 bg-white border border-gray-300 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-colors">
                        Edit Plan
                    </button>
                    <button onClick={() => handleToggle(plan)} className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-colors ${plan.status === 'active' ? 'bg-white border border-red-200 text-red-600 hover:bg-red-50' : 'bg-white border border-green-200 text-green-600 hover:bg-green-50'}`}>
                        {plan.status === 'active' ? 'Disable' : 'Enable'}
                    </button>
                </div>

                </div>
            ))}
            </div>
        )}
      </div>
    </div>
  );
}
// import { useState, useEffect } from "react";
// import { useSession } from "next-auth/react";
// import { useRouter } from "next/router";
// import Link from "next/link";

// export default function AdminPlans() {
//   const { data: session, status } = useSession();
//   const router = useRouter();
  
//   const [plans, setPlans] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [isEditing, setIsEditing] = useState(false);
//   const [currentPlanId, setCurrentPlanId] = useState(null);

//   // Form State - Added grace_period
//   const [formData, setFormData] = useState({
//     name: "",
//     price: "",
//     duration: "30",
//     grace_period: "7", 
//     features: [{ key: "", value: "" }] // Array for UI inputs
//   });

//   // 1. Auth & Data Fetching
//   useEffect(() => {
//     if (status === "loading") return;
    
//     // Redirect if not Super Admin
//     if (!session?.user?.isSuperAdmin) {
//       router.push("/dashboard");
//       return;
//     }

//     fetchPlans();
//   }, [session, status, router]);

//   const fetchPlans = async () => {
//     try {
//       const res = await fetch("/api/admin/plans");
//       const data = await res.json();
//       setPlans(data.plans || []);
//       setLoading(false);
//     } catch (error) {
//       console.error("Failed to fetch plans", error);
//       setLoading(false);
//     }
//   };

//   // 2. Form Handlers
//   const handleFeatureChange = (index, field, value) => {
//     const newFeatures = [...formData.features];
//     newFeatures[index][field] = value;
//     setFormData({ ...formData, features: newFeatures });
//   };

//   const addFeatureRow = () => {
//     setFormData({ ...formData, features: [...formData.features, { key: "", value: "" }] });
//   };

//   const removeFeatureRow = (index) => {
//     const newFeatures = formData.features.filter((_, i) => i !== index);
//     setFormData({ ...formData, features: newFeatures });
//   };

//   const resetForm = () => {
//     setFormData({ name: "", price: "", duration: "30", grace_period: "7", features: [{ key: "", value: "" }] });
//     setIsEditing(false);
//     setCurrentPlanId(null);
//   };

//   const handleEdit = (plan) => {
//     // Convert object { "Bots": "3" } -> array [{ key: "Bots", value: "3" }]
//     const featureArray = plan.features 
//       ? Object.entries(plan.features).map(([key, value]) => ({ key, value }))
//       : [{ key: "", value: "" }];

//     setFormData({
//       name: plan.plan_name,
//       price: plan.amount,
//       duration: plan.duration,
//       grace_period: plan.grace_period || 7, // Added to edit state
//       features: featureArray
//     });
//     setCurrentPlanId(plan.plan_id);
//     setIsEditing(true);
//     window.scrollTo({ top: 0, behavior: "smooth" });
//   };

//   // 3. Submit Handler (Create or Update)
//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     // Convert array -> object for API
//     const featuresObject = {};
//     formData.features.forEach(f => {
//       if (f.key.trim()) featuresObject[f.key] = f.value;
//     });

//     const payload = {
//       name: formData.name,
//       price: formData.price,
//       duration: formData.duration,
//       grace_period: formData.grace_period, // Added to API payload
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
//       alert(isEditing ? "Plan updated!" : "Plan created!");
//       resetForm();
//       fetchPlans();
//     } else {
//       const err = await res.json();
//       alert("Error: " + err.error);
//     }
//   };

//   // 4. Toggle Status
//   const handleToggle = async (plan) => {
//     const newStatus = plan.status === "active" ? "inactive" : "active";
//     if(!confirm(`Change status to ${newStatus}?`)) return;

//     const res = await fetch("/api/admin/plans", {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ id: plan.plan_id, status: newStatus })
//     });

//     if (res.ok) fetchPlans();
//   };

//   if (loading) return <div className="p-8 text-center">Loading Admin...</div>;

//   return (
//     <div className="max-w-6xl mx-auto py-10 px-4">
//       <div className="flex items-center justify-between mb-8">
//         <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
//         <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
//           &larr; Back to Dashboard
//         </Link>
//       </div>

//       {/* --- Create/Edit Form --- */}
//       <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10">
//         <h2 className="text-xl font-bold mb-4 border-b pb-2">
//           {isEditing ? "Edit Plan" : "Create New Plan"}
//         </h2>
//         <form onSubmit={handleSubmit}>
//           <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
//             <div>
//               <label className="block text-sm font-semibold mb-1">Plan Name</label>
//               <input required className="w-full border p-2 rounded" placeholder="e.g. Pro Plan"
//                 value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold mb-1">Price (₹)</label>
//               <input required type="number" className="w-full border p-2 rounded" placeholder="999"
//                 value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold mb-1">Duration (Days)</label>
//               <input required type="number" className="w-full border p-2 rounded" placeholder="30"
//                 value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
//             </div>
//             <div>
//               <label className="block text-sm font-semibold mb-1">Grace Period (Days)</label>
//               <input required type="number" className="w-full border p-2 rounded" placeholder="7"
//                 value={formData.grace_period} onChange={e => setFormData({...formData, grace_period: e.target.value})} />
//             </div>
//           </div>

//           <div className="mb-4">
//             <label className="block text-sm font-semibold mb-2">Features</label>
//             <div className="bg-gray-50 p-4 rounded border">
//               {formData.features.map((item, index) => (
//                 <div key={index} className="flex gap-2 mb-2">
//                   <input className="flex-1 border p-2 rounded" placeholder="Feature Name (e.g. Max Bots)"
//                     value={item.key} onChange={e => handleFeatureChange(index, 'key', e.target.value)} />
//                   <input className="flex-1 border p-2 rounded" placeholder="Value (e.g. 5)"
//                     value={item.value} onChange={e => handleFeatureChange(index, 'value', e.target.value)} />
//                   <button type="button" onClick={() => removeFeatureRow(index)} className="text-red-500 font-bold px-2">✕</button>
//                 </div>
//               ))}
//               <button type="button" onClick={addFeatureRow} className="text-sm text-blue-600 font-semibold mt-2">+ Add Feature</button>
//             </div>
//           </div>

//           <div className="flex justify-end gap-3">
//             {isEditing && <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-500">Cancel</button>}
//             <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
//               {isEditing ? "Update Plan" : "Create Plan"}
//             </button>
//           </div>
//         </form>
//       </div>

//       {/* --- Plans List --- */}
//       <div className="grid md:grid-cols-3 gap-6">
//         {plans.map(plan => (
//           <div key={plan.plan_id} className={`bg-white p-6 rounded-xl shadow-sm border ${plan.status === 'inactive' ? 'opacity-75 bg-gray-50' : 'border-gray-200'}`}>
//             <div className="flex justify-between items-start mb-2">
//               <h3 className="text-lg font-bold">{plan.plan_name}</h3>
//               <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
//                 {plan.status}
//               </span>
//             </div>
//             <div className="text-2xl font-bold text-gray-900 mb-1">₹{plan.amount} <span className="text-sm font-normal text-gray-500">/ {plan.duration} days</span></div>
//             <div className="text-xs text-gray-500 mb-4">+ {plan.grace_period || 7} days grace period</div>
            
//             <div className="text-sm text-gray-600 mb-6 space-y-1">
//               {plan.features && Object.entries(plan.features).map(([k, v]) => (
//                 <div key={k} className="flex justify-between border-b border-gray-100 py-1">
//                   <span>{k}</span>
//                   <span className="font-medium text-gray-900">{v}</span>
//                 </div>
//               ))}
//             </div>

//             <div className="flex gap-2 mt-auto">
//               <button onClick={() => handleEdit(plan)} className="flex-1 bg-gray-100 py-2 rounded text-sm font-medium hover:bg-gray-200">Edit</button>
//               <button onClick={() => handleToggle(plan)} className="flex-1 border border-gray-300 py-2 rounded text-sm font-medium hover:bg-gray-50">
//                 {plan.status === 'active' ? 'Disable' : 'Enable'}
//               </button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }