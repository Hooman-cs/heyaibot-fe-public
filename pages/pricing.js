import { useState, useEffect } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router"; 
import Navbar from '../app/Navbar'; // Import added
import Footer from '../app/Footer'; // Import added

export default function Pricing() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState([]);
  const router = useRouter(); 

  useEffect(() => {
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) => setPlans(data.plans || [])); // Ensure we handle the {plans: []} structure
  }, []);

  const handleCheckout = async (plan) => {
    if (!session) {
      router.push("login");
      return;
    }
    
    setLoading(true);

    try {
      // CALL THE MOCK API
      const res = await fetch("/api/payment/test-subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.plan_id }), 
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // On success, redirect to dashboard
      alert("Test Payment Successful! Redirecting...");
      router.push("/dashboard");

    } catch (error) {
      console.error("Checkout Error:", error);
      alert("Payment failed: " + error.message);
      setLoading(false);
    }
  };

  return (
    <div className="bg-white min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-grow py-24 sm:py-32">
          <div className="max-w-7xl mx-auto px-6">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold">Simple, Transparent Pricing (Test Mode)</h2>
              <p className="text-gray-500 mt-2">Clicking purchase will instantly activate the plan.</p>
            </div>

            {loading && <div className="text-center py-4 text-blue-600 font-bold">Processing Mock Payment...</div>}

            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan) => (
                <div key={plan.plan_id} className="p-8 bg-white border rounded-2xl shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold">{plan.plan_name}</h3>
                  <div className="text-4xl font-bold mt-4">
                    {/* Display formatted price */}
                    {(plan.price_amount / 100).toLocaleString("en-US", { style: "currency", currency: plan.currency || "USD" })}
                  </div>
                  <div className="text-sm text-gray-500 mt-1">per {plan.interval_unit || "month"}</div>
                  
                  <ul className="mt-8 space-y-3 flex-1">
                    {plan.features?.map((f, i) => (
                      <li key={i} className="flex gap-2">✓ {f}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleCheckout(plan)}
                    disabled={loading}
                    className="mt-8 w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? "Processing..." : "Choose Plan"}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
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
// import Footer from '../app/Footer'; // Import added

// export default function Pricing() {
//   const { data: session } = useSession();
//   const [loading, setLoading] = useState(false);
//   const [plans, setPlans] = useState([]);
//   const router = useRouter(); 

//   useEffect(() => {
//     fetch("/api/admin/plans")
//       .then((res) => res.json())
//       .then((data) => setPlans(data));
//   }, []);

//   const handleCheckout = async (plan) => {
//     if (!session) return signIn();
//     setLoading(true);

//     try {
//       // FIX 1: Send 'plan.plan_id' (Correct DB Field)
//       const res = await fetch("/api/payment/create-order", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ planId: plan.plan_id }), 
//       });
      
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error);

//       const options = {
//         key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//         amount: data.amount,
//         currency: "INR",
//         name: "HeyAiBot",
//         description: `${plan.plan_name} Subscription`, // FIX 2: Correct Name
//         order_id: data.orderId,
//         handler: async function (response) {
//           await fetch("/api/payment/verify", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//               razorpay_order_id: response.razorpay_order_id,
//               razorpay_payment_id: response.razorpay_payment_id,
//               razorpay_signature: response.razorpay_signature,
//               plan: plan.plan_id // FIX 3: Correct ID
//             })
//           });
          
//           alert("Payment Successful! Your plan is active.");
//           router.push("/dashboard");
//         },
//         prefill: {
//           name: session.user.name,
//           email: session.user.email,
//         },
//         theme: { color: "#2563eb" },
//       };

//       const rzp1 = new window.Razorpay(options);
//       rzp1.open();

//     } catch (error) {
//       alert("Payment failed: " + error.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="flex flex-col min-h-screen">
//       <Navbar />
//       <div className="py-24 bg-slate-50 flex-grow">
//         <Script src="https://checkout.razorpay.com/v1/checkout.js" />
//         <div className="max-w-7xl mx-auto px-6">
//           <div className="text-center mb-16">
//             <h2 className="text-3xl font-bold">Simple, Transparent Pricing</h2>
//           </div>

//           <div className="grid md:grid-cols-3 gap-8">
//             {plans.map((plan) => (
//               // FIX 4: Use 'plan.plan_id' for unique key
//               <div key={plan.plan_id} className="p-8 bg-white border rounded-2xl shadow-sm flex flex-col">
//                 {/* FIX 5: Use 'plan_name' */}
//                 <h3 className="text-lg font-bold">{plan.plan_name}</h3>
//                 {/* FIX 6: Use 'amount' */}
//                 <div className="text-4xl font-bold mt-4">₹{plan.amount}</div>
//                 <div className="text-sm text-gray-500 mt-1">for {plan.duration || 30} days</div>
                
//                 <ul className="mt-8 space-y-3 flex-1">
//                   {/* Features are now provided by the updated API */}
//                   {plan.features?.map((f, i) => (
//                     <li key={i} className="flex gap-2">✓ {f}</li>
//                   ))}
//                 </ul>
//                 <button
//                   onClick={() => handleCheckout(plan)}
//                   className="mt-8 w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
//                 >
//                   {loading ? "Processing..." : "Subscribe"}
//                 </button>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//       <Footer />
//     </div>
//   );
// }