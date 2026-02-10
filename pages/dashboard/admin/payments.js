import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";

export default function AdminPayments() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && session?.user?.isSuperAdmin === false) {
      router.push("/dashboard"); 
    } else if (session?.user?.isSuperAdmin) {
      fetchPayments();
    }
  }, [session, status, router]);

  const fetchPayments = async () => {
    try {
      const res = await fetch("/api/admin/payments");
      const data = await res.json();
      if (data.payments) setPayments(data.payments);
    } catch (e) {
      console.error("Failed to fetch payments", e);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) return <div className="p-10">Loading payments...</div>;
  if (!session?.user?.isSuperAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-6">Payment History</h1>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.map((pay) => (
              <tr key={pay.payment_id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {pay.user_email} <br/>
                  <span className="text-gray-400 font-normal text-xs">{pay.user_id}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pay.plan_id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {(pay.amount / 100).toLocaleString("en-US", {style:"currency", currency: pay.currency})}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    pay.status === 'succeeded' || pay.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {pay.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(pay.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}