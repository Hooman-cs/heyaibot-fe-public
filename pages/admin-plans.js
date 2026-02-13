import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Link from "next/link";

export default function AdminPlans() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlanId, setCurrentPlanId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    duration: "30",
    features: [{ key: "", value: "" }] // Array for UI inputs
  });

  // 1. Auth & Data Fetching
  useEffect(() => {
    if (status === "loading") return;
    
    // Redirect if not Super Admin
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
    setFormData({ name: "", price: "", duration: "30", features: [{ key: "", value: "" }] });
    setIsEditing(false);
    setCurrentPlanId(null);
  };

  const handleEdit = (plan) => {
    // Convert object { "Bots": "3" } -> array [{ key: "Bots", value: "3" }]
    const featureArray = plan.features 
      ? Object.entries(plan.features).map(([key, value]) => ({ key, value }))
      : [{ key: "", value: "" }];

    setFormData({
      name: plan.plan_name,
      price: plan.amount,
      duration: plan.duration,
      features: featureArray
    });
    setCurrentPlanId(plan.plan_id);
    setIsEditing(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // 3. Submit Handler (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Convert array -> object for API
    const featuresObject = {};
    formData.features.forEach(f => {
      if (f.key.trim()) featuresObject[f.key] = f.value;
    });

    const payload = {
      name: formData.name,
      price: formData.price,
      duration: formData.duration,
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
      alert(isEditing ? "Plan updated!" : "Plan created!");
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

  if (loading) return <div className="p-8 text-center">Loading Admin...</div>;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Plan Management</h1>
        <Link href="/dashboard" className="text-gray-600 hover:text-blue-600">
          &larr; Back to Dashboard
        </Link>
      </div>

      {/* --- Create/Edit Form --- */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-10">
        <h2 className="text-xl font-bold mb-4 border-b pb-2">
          {isEditing ? "Edit Plan" : "Create New Plan"}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Plan Name</label>
              <input required className="w-full border p-2 rounded" placeholder="e.g. Pro Plan"
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Price (₹)</label>
              <input required type="number" className="w-full border p-2 rounded" placeholder="999"
                value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Duration (Days)</label>
              <input required type="number" className="w-full border p-2 rounded" placeholder="30"
                value={formData.duration} onChange={e => setFormData({...formData, duration: e.target.value})} />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold mb-2">Features</label>
            <div className="bg-gray-50 p-4 rounded border">
              {formData.features.map((item, index) => (
                <div key={index} className="flex gap-2 mb-2">
                  <input className="flex-1 border p-2 rounded" placeholder="Feature Name (e.g. Max Bots)"
                    value={item.key} onChange={e => handleFeatureChange(index, 'key', e.target.value)} />
                  <input className="flex-1 border p-2 rounded" placeholder="Value (e.g. 5)"
                    value={item.value} onChange={e => handleFeatureChange(index, 'value', e.target.value)} />
                  <button type="button" onClick={() => removeFeatureRow(index)} className="text-red-500 font-bold px-2">✕</button>
                </div>
              ))}
              <button type="button" onClick={addFeatureRow} className="text-sm text-blue-600 font-semibold mt-2">+ Add Feature</button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            {isEditing && <button type="button" onClick={resetForm} className="px-4 py-2 text-gray-500">Cancel</button>}
            <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 font-medium">
              {isEditing ? "Update Plan" : "Create Plan"}
            </button>
          </div>
        </form>
      </div>

      {/* --- Plans List --- */}
      <div className="grid md:grid-cols-3 gap-6">
        {plans.map(plan => (
          <div key={plan.plan_id} className={`bg-white p-6 rounded-xl shadow-sm border ${plan.status === 'inactive' ? 'opacity-75 bg-gray-50' : 'border-gray-200'}`}>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-bold">{plan.plan_name}</h3>
              <span className={`text-xs px-2 py-1 rounded font-bold uppercase ${plan.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {plan.status}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-4">₹{plan.amount} <span className="text-sm font-normal text-gray-500">/ {plan.duration} days</span></div>
            
            <div className="text-sm text-gray-600 mb-6 space-y-1">
              {plan.features && Object.entries(plan.features).map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-gray-100 py-1">
                  <span>{k}</span>
                  <span className="font-medium text-gray-900">{v}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-auto">
              <button onClick={() => handleEdit(plan)} className="flex-1 bg-gray-100 py-2 rounded text-sm font-medium hover:bg-gray-200">Edit</button>
              <button onClick={() => handleToggle(plan)} className="flex-1 border border-gray-300 py-2 rounded text-sm font-medium hover:bg-gray-50">
                {plan.status === 'active' ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}