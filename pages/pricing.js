import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Script from "next/script";
import Navbar from "@/app/Navbar"; 
import Footer from "@/app/Footer"; 

export default function Pricing() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [plans, setPlans] = useState([]);
  const [processingPlanId, setProcessingPlanId] = useState(null);

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) => {
        const allPlans = data.plans || [];
        const activePlans = allPlans.filter(p => p.status === 'active');
        // Sort by price
        activePlans.sort((a, b) => a.amount - b.amount);
        setPlans(activePlans);
      })
      .catch((err) => console.error("Failed to fetch plans:", err));
  }, []);

  const handleCheckout = async (plan) => {
    if (!session) {
      signIn(); 
      return; 
    }
    setProcessingPlanId(plan.plan_id);

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.plan_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "HeyAiBot",
        description: `Subscription for ${plan.plan_name}`,
        order_id: data.orderId,
        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.plan_id 
              })
            });
            
            if(verifyRes.ok) {
                alert("Payment Successful! Your plan is active.");
                router.push("/dashboard");
            } else {
                alert("Payment verification failed.");
            }
          } catch (e) {
            console.error("Verification error:", e);
            alert("Payment verification failed.");
          } finally {
            setProcessingPlanId(null);
          }
        },
        prefill: {
          name: session.user.name,
          email: session.user.email,
        },
        theme: { color: "#2563eb" },
        modal: {
          ondismiss: function(){ setProcessingPlanId(null); }
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();

    } catch (error) {
      console.error("Payment Error:", error);
      alert("Payment failed: " + error.message);
      setProcessingPlanId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <Navbar />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="flex-grow">
        {/* Header Section */}
        <div className="bg-blue-600 py-20 px-4 text-center">
          <h1 className="text-4xl font-extrabold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Choose the perfect plan for your business. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="max-w-7xl mx-auto px-4 -mt-16 pb-20">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => {
              // Highlight the middle plan or explicitly marked plans (optional logic)
              const isPopular = index === 1 && plans.length >= 3; 

              return (
                <div 
                  key={plan.plan_id} 
                  className={`bg-white rounded-2xl shadow-xl flex flex-col relative overflow-hidden transition-transform duration-300 hover:-translate-y-2
                    ${isPopular ? 'border-4 border-blue-500 scale-105 z-10' : 'border border-gray-100'}
                  `}
                >
                  {isPopular && (
                    <div className="bg-blue-500 text-white text-xs font-bold uppercase tracking-wider text-center py-1">
                      Most Popular
                    </div>
                  )}

                  <div className="p-8 flex-1 flex flex-col">
                    {/* 1. Plan Name */}
                    <div className="mb-4">
                      <h3 className="text-2xl font-bold text-gray-900 capitalize">{plan.plan_name}</h3>
                      <div className="h-1 w-12 bg-blue-500 mt-2 rounded"></div>
                    </div>

                    {/* 2. Features */}
                    <div className="flex-1 mb-8">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-4">
                        Everything you get:
                      </p>
                      <ul className="space-y-4">
                        <li className="flex items-center">
                            <div className="w-6 h-6 rounded-full bg-blue-50 flex items-center justify-center mr-3 flex-shrink-0">
                                <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className="text-gray-700 font-medium">{plan.duration} Days Validity</span>
                        </li>
                        {plan.features && Object.entries(plan.features).map(([key, value]) => (
                          <li key={key} className="flex items-start">
                             <div className="w-6 h-6 rounded-full bg-green-50 flex items-center justify-center mr-3 flex-shrink-0">
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                             </div>
                            <span className="text-gray-600">
                              <span className="font-bold text-gray-900">{value}</span> {key}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 3. Price & Button */}
                    <div className="border-t border-gray-100 pt-6 mt-auto">
                        <div className="flex items-baseline mb-6">
                            <span className="text-5xl font-extrabold text-gray-900">₹{plan.amount}</span>
                            <span className="text-gray-500 ml-2">/ month</span>
                        </div>
                        
                        <button 
                          onClick={() => handleCheckout(plan)}
                          disabled={processingPlanId !== null}
                          className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg flex items-center justify-center ${
                             processingPlanId === plan.plan_id
                             ? "bg-blue-800 text-white cursor-wait"
                             : processingPlanId !== null
                                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                                : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200 hover:shadow-blue-300"
                          }`}
                        >
                          {processingPlanId === plan.plan_id ? (
                            <>
                              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Processing...
                            </>
                          ) : (
                            "Choose Plan"
                          )}
                        </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}