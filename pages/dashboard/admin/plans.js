import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router"; // Changed from navigation

export default function AdminPlans() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Plan Form State
  const [isCreating, setIsCreating] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name: "",
    price: "",
    currency: "USD",
    interval: "month",
    stripeId: "", 
    features: [] 
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
    } else if (status === "authenticated" && session?.user?.isSuperAdmin === false) {
      router.push("/dashboard"); // Kick out non-admins
    } else if (session?.user?.isSuperAdmin) {
      fetchPlans();
    }
  }, [session, status, router]);

  const fetchPlans = async () => {
    try {
      const res = await fetch("/api/admin/plans");
      const data = await res.json();
      if (data.plans) setPlans(data.plans);
    } catch (e) {
      console.error("Failed to fetch plans", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPlan)
      });
      
      if (res.ok) {
        setIsCreating(false);
        setNewPlan({ name: "", price: "", currency: "USD", interval: "month", stripeId: "", features: [] });
        fetchPlans(); // Refresh list
      } else {
        alert("Failed to create plan");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePlan = async (planId) => {
    if(!confirm("Are you sure? This might affect existing subscribers.")) return;

    try {
        const res = await fetch(`/api/admin/plans?id=${planId}`, {
            method: "DELETE"
        });
        if(res.ok) fetchPlans();
    } catch (e) {
        console.error(e);
    }
  }

  if (status === "loading" || loading) return <div className="p-10">Loading admin panel...</div>;
  if (!session?.user?.isSuperAdmin) return null; // Security fallback

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Subscription Plans</h1>
        <button 
          onClick={() => setIsCreating(!isCreating)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          {isCreating ? "Cancel" : "Create New Plan"}
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleCreatePlan} className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
          <h3 className="font-semibold mb-4">New Plan Details</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
                <label className="block text-sm font-medium text-gray-700">Plan Name</label>
                <input 
                    type="text" 
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={newPlan.name}
                    onChange={(e) => setNewPlan({...newPlan, name: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Price (in cents, e.g. 1000 = $10)</label>
                <input 
                    type="number" 
                    required
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({...newPlan, price: e.target.value})}
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Interval</label>
                <select 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    value={newPlan.interval}
                    onChange={(e) => setNewPlan({...newPlan, interval: e.target.value})}
                >
                    <option value="month">Month</option>
                    <option value="year">Year</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Stripe Price ID (Optional)</label>
                <input 
                    type="text" 
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"
                    placeholder="price_12345..."
                    value={newPlan.stripeId}
                    onChange={(e) => setNewPlan({...newPlan, stripeId: e.target.value})}
                />
            </div>
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">Save Plan</button>
        </form>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Interval</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stripe ID</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {plans.map((plan) => (
              <tr key={plan.plan_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{plan.plan_name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {(plan.price_amount / 100).toLocaleString("en-US", {style:"currency", currency: plan.currency || "USD"})}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{plan.interval_unit}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{plan.stripe_price_id || "-"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => handleDeletePlan(plan.plan_id)} className="text-red-600 hover:text-red-900">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}