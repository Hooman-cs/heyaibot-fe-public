// pages/pricing.js
import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router"; // Changed from next/navigation for Pages Router compatibility
import Script from "next/script";
import Navbar from '../app/Navbar'; // Import added
import Footer from '../app/Footer';

export default function Pricing() {
  const { data: session } = useSession();
  const router = useRouter();
  
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Active Plans
  useEffect(() => {
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) => {
        const allPlans = data.plans || [];
        // Filter only active plans
        const activePlans = allPlans.filter(p => p.status === 'active');
        setPlans(activePlans);
      })
      .catch((err) => console.error("Failed to fetch plans:", err));
  }, []);

  // 2. Handle Payment Logic (Razorpay)
  const handleCheckout = async (plan) => {
    if (!session) {
      signIn(); // Redirect to login if not authenticated
      return; 
    }
    
    setLoading(true);

    try {
      // Step A: Create Order on Backend
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.plan_id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Order creation failed");

      // Step B: Initialize Razorpay
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: "INR",
        name: "HeyAiBot",
        description: `Subscription for ${plan.plan_name}`,
        order_id: data.orderId,
        
        // Step C: Handle Success
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
          }
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
      console.error("Payment Error:", error);
      alert("Payment failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      
      {/* Load Razorpay Script */}
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <main className="flex-grow py-20 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600 mb-12">Choose the plan that fits your business needs.</p>

          <div className="grid md:grid-cols-3 gap-8 text-left">
            {plans.map((plan) => (
              <div key={plan.plan_id} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col hover:scale-105 transition-transform duration-300">
                
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.plan_name}</h3>
                
                <div className="text-5xl font-extrabold text-blue-600 mb-2">
                  ₹{plan.amount}
                  <span className="text-lg text-gray-500 font-medium">/{plan.duration} days</span>
                </div>
                
                {/* Features List (Iterating over Object Entries) */}
                <ul className="mt-6 mb-8 space-y-4 flex-1">
                  {plan.features && Object.entries(plan.features).map(([key, value]) => (
                    <li key={key} className="flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">
                        <strong>{value}</strong> {key}
                      </span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={() => handleCheckout(plan)}
                  disabled={loading}
                  className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg ${
                     loading 
                     ? "bg-gray-400 cursor-not-allowed text-gray-200"
                     : "bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200"
                  }`}
                >
                  {loading ? "Processing..." : "Subscribe Now"}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}


// "use client";
// import Script from "next/script";
// import { useState, useEffect } from "react";
// import { useSession, signIn } from "next-auth/react";
// import { useRouter } from "next/navigation";
// import Navbar from '../app/Navbar'; // Import added
// import Footer from '../app/Footer';

// export default function Pricing() {
//   const { data: session } = useSession();
//   const router = useRouter();
//   const [plans, setPlans] = useState([]);

//   useEffect(() => {
//     fetch("/api/admin/plans")
//       .then((res) => res.json())
//       .then((data) => {
//         // 1. Get plans array
//         const allPlans = data.plans || [];
        
//         // 2. Filter only ACTIVE plans
//         const activePlans = allPlans.filter(p => p.status === 'active');
        
//         setPlans(activePlans);
//       })
//       .catch((err) => console.error("Failed to fetch plans:", err));
//   }, []);

//   const handleSubscribe = async (planId) => {
//     if (!session) {
//       router.push("/login");
//       return;
//     }
//     // Add your payment logic here
//     alert(`Subscribe to plan: ${planId}`);
//   };

//   return (
//     <>
//     <Navbar />
//     <div className="min-h-screen bg-gray-50">
      
//       <div className="max-w-7xl mx-auto py-20 px-4 text-center">
//         <h1 className="text-4xl font-extrabold text-gray-900 mb-4">Simple, Transparent Pricing</h1>
//         <p className="text-xl text-gray-600 mb-12">Choose the plan that fits your business needs.</p>

//         <div className="grid md:grid-cols-3 gap-8">
//           {plans.map((plan) => (
//             <div key={plan.plan_id} className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 flex flex-col hover:scale-105 transition-transform duration-300">
//               <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.plan_name}</h3>
//               <div className="text-5xl font-extrabold text-blue-600 mb-2">
//                 ₹{plan.amount}
//                 <span className="text-lg text-gray-500 font-medium">/{plan.duration} days</span>
//               </div>
              
//               {/* Features List */}
//               <ul className="mt-6 mb-8 space-y-4 text-left flex-1">
//                 {/* ✅ FIX: Convert features Object { "Bots": "3" } -> Array for mapping */}
//                 {plan.features && Object.entries(plan.features).map(([key, value]) => (
//                   <li key={key} className="flex items-start">
//                     <svg className="w-5 h-5 text-green-500 mr-2 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//                     </svg>
//                     <span className="text-gray-600">
//                       <strong>{value}</strong> {key}
//                     </span>
//                   </li>
//                 ))}
//               </ul>

//               <button 
//                 onClick={() => handleSubscribe(plan.plan_id)}
//                 className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
//               >
//                 Get Started
//               </button>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//     <Footer />
//     </>
//   );
// }