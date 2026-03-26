import { useState, useEffect } from "react";

export default function AdminBoosterTab() {
  const [boosters, setBoosters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const [formData, setFormData] = useState({ 
    name: "", token_amount: "", amount: "", amount_usd: "" 
  });

  const fetchBoosters = async () => {
    try {
      const res = await fetch("/api/admin/booster-plans");
      const data = await res.json();
      setBoosters(data.plans || []);
      setLoading(false);
    } catch (error) { setLoading(false); }
  };

  useEffect(() => { fetchBoosters(); }, []);

  const resetForm = () => {
    setFormData({ name: "", token_amount: "", amount: "", amount_usd: "" });
    setIsEditing(false); setCurrentId(null); setShowForm(false);
  };

  const handleEdit = (booster) => {
    setFormData({ 
      name: booster.name, 
      token_amount: booster.token_amount, 
      amount: booster.amount, 
      amount_usd: booster.amount_usd 
    });
    setCurrentId(booster.booster_id); setIsEditing(true); setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = isEditing ? "PUT" : "POST";
    const body = isEditing ? { id: currentId, ...formData } : formData;

    const res = await fetch("/api/admin/booster-plans", { 
        method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) 
    });
    
    if (res.ok) { alert(isEditing ? "Updated!" : "Created!"); resetForm(); fetchBoosters(); } 
    else { const err = await res.json(); alert("Error: " + err.error); }
  };

  const handleToggle = async (booster) => {
    const newStatus = booster.status === "active" ? "inactive" : "active";
    if(!confirm(`Change status to ${newStatus}?`)) return;
    const res = await fetch("/api/admin/booster-plans", { 
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: booster.booster_id, status: newStatus }) 
    });
    if (res.ok) fetchBoosters();
  };

  if (loading) return <div className="p-10 text-center text-slate-500 animate-pulse">Loading Boosters...</div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h2 className="text-2xl font-bold text-slate-900">Token Booster Packs</h2>
        {!showForm && <button onClick={() => { resetForm(); setShowForm(true); }} className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg font-bold shadow-sm hover:bg-emerald-700 transition-all">+ Create Booster Pack</button>}
      </div>

      {showForm && (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 mb-8 overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-8 py-5 flex justify-between items-center">
            <h2 className="text-lg font-bold text-slate-900">{isEditing ? "Edit Booster Pack" : "Create New Booster Pack"}</h2>
            <button onClick={resetForm} className="text-slate-400 hover:text-rose-500 font-bold">✕ Cancel</button>
          </div>
          
          <form onSubmit={handleSubmit} className="p-4 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="md:col-span-2 lg:col-span-4">
                <label className="block text-sm font-bold text-slate-700 mb-2">Package Name</label>
                <input required className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="e.g. 10k Extra Tokens" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Tokens Provided</label>
                <input required type="number" className="w-full border px-4 py-2 rounded-lg bg-emerald-50 text-emerald-700 font-bold" placeholder="e.g. 10000" value={formData.token_amount} onChange={e => setFormData({...formData, token_amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price (INR ₹)</label>
                <input required type="number" className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="e.g. 499" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Price (USD $)</label>
                <input required type="number" step="0.01" className="w-full border px-4 py-2 rounded-lg bg-white" placeholder="e.g. 5.99" value={formData.amount_usd} onChange={e => setFormData({...formData, amount_usd: e.target.value})} />
              </div>
            </div>
            
            <div className="flex justify-end gap-4 border-t border-slate-100 pt-6">
              <button type="submit" className="w-full sm:w-auto bg-emerald-600 text-white px-10 py-3 rounded-lg font-bold hover:bg-emerald-700 shadow-md transition-all text-lg">{isEditing ? "Save Changes" : "Create Booster"}</button>
            </div>
          </form>
        </div>
      )}

      {!showForm && (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {boosters.map(b => (
            <div key={b.booster_id} className={`bg-white rounded-3xl shadow-sm border p-6 flex flex-col ${b.status === 'inactive' ? 'opacity-60 bg-slate-50' : 'border-slate-200'}`}>
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold">{b.name}</h3>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${b.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{b.status}</span>
              </div>
              <div className="text-3xl font-black text-emerald-600 mb-4">+{b.token_amount} Tokens</div>
              <div className="flex justify-between items-center mb-6 text-sm font-bold text-slate-500">
                <span>₹{b.amount}</span>
                <span>${b.amount_usd}</span>
              </div>
              <div className="flex gap-2 mt-auto">
                <button onClick={() => handleEdit(b)} className="flex-1 bg-slate-100 py-2.5 rounded-lg text-sm font-bold text-slate-700 hover:bg-slate-200">Edit</button>
                <button onClick={() => handleToggle(b)} className={`flex-1 border py-2.5 rounded-lg text-sm font-bold ${b.status === 'active' ? 'border-rose-200 text-rose-600' : 'border-emerald-200 text-emerald-600'}`}>{b.status === 'active' ? 'Disable' : 'Enable'}</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}