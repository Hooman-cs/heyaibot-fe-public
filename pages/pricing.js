"use client";
import Script from "next/script";
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Navbar from '../app/Navbar'; // Import added
import Footer from '../app/Footer';

export default function Pricing() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const router = useRouter();

  // useEffect(() => {
  //   fetch("/api/admin/plans")
  //     .then((res) => res.json())
  //     .then((data) => setPlans(data));
  // }, []);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) => {
        // ✅ Fix: Access the 'plans' property from the response object
        setPlans(data.plans || []); 
      })
      .catch(err => console.error("Failed to fetch plans:", err));
  }, []);
  
  const handleCheckout = async (plan) => {
    if (!session) return signIn();
    setLoading(true);

    try {
      // FIX 1: Send 'plan.plan_id' (Correct DB Field)
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.plan_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "HeyAiBot",
        description: `${plan.plan_name} Subscription`, // FIX 2: Correct Name
        order_id: data.orderId,
        handler: async function (response) {
          await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              plan: plan.plan_id // FIX 3: Correct ID
            })
          });

          alert("Payment Successful! Your plan is active.");
          router.push("/dashboard");
        },
        prefill: {
          name: session.user.name,
          email: session.user.email,
        },
        theme: { color: "#2563eb" },
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) {
      alert("Payment failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <><Navbar />
      <div className="flex flex-col min-h-screen">
        <div className="py-24 bg-slate-50 flex-grow">
          <Script src="https://checkout.razorpay.com/v1/checkout.js" />
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                // FIX 4: Use 'plan.plan_id' for unique key
                <div key={plan.plan_id} className="p-8 bg-white border rounded-2xl shadow-sm flex flex-col">
                  {/* FIX 5: Use 'plan_name' */}
                  <h3 className="text-lg font-bold">{plan.plan_name}</h3>
                  {/* FIX 6: Use 'amount' */}
                  <div className="text-4xl font-bold mt-4">₹{plan.amount}</div>
                  <div className="text-sm text-gray-500 mt-1">for {plan.duration || 30} days</div>

                  <ul className="mt-8 space-y-3 flex-1">
                    {/* Features are now provided by the updated API */}
                    {plan.features?.map((f, i) => (
                      <li key={i} className="flex gap-2">✓ {f}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleCheckout(plan)}
                    className="mt-8 w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {loading ? "Processing..." : "Subscribe"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}