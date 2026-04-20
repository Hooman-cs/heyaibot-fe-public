import { useState, useEffect, useRef } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "@/app/Navbar";
import Footer from "@/app/Footer";

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function Pricing() {
  const { data: session } = useSession();
  const router = useRouter();

  const [viewMode, setViewMode] = useState("subscriptions"); 
  const [plans, setPlans] = useState([]);
  const [boosterPlans, setBoosterPlans] = useState([]);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  
  const [userCurrency, setUserCurrency] = useState("USD"); 
  const [billingCycle, setBillingCycle] = useState("monthly");
  
  // ==========================================
  // UPDATED COUPON STATE (Isolated per card)
  // ==========================================
  const [activeInputId, setActiveInputId] = useState(null); // Tracks WHICH card's input is open
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null); // Now stores { code, discountType, discountValue, targetId }
  const [couponError, setCouponError] = useState("");
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

  // FETCH & CURRENCY LOGIC
  useEffect(() => {
    fetch("/api/admin/plans")
      .then((res) => res.json())
      .then((data) => {
        const activePlans = (data.plans || []).filter(p => p.status === 'active');
        activePlans.sort((a, b) => a.amount - b.amount);
        setPlans(activePlans);
      });

    fetch("/api/admin/booster-plans")
      .then((res) => res.json())
      .then((data) => {
        const activeBoosters = (data.plans || []).filter(p => p.status === 'active');
        activeBoosters.sort((a, b) => a.amount - b.amount);
        setBoosterPlans(activeBoosters);
      });

    fetch(`https://get.geojs.io/v1/ip/country.json?t=${new Date().getTime()}`)
      .then((res) => res.json())
      .then((data) => setUserCurrency(data.country === "IN" ? "INR" : "USD"))
      .catch(() => setUserCurrency("USD"));
  }, []);

  // Reset coupon state if user switches between Subscriptions & Boosters
  useEffect(() => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
    setActiveInputId(null);
  }, [viewMode]);

  // ==========================================
  // COUPON VALIDATION HANDLER
  // ==========================================
  const handleApplyCoupon = async (targetId) => {
    if (!couponInput) return;
    setIsValidatingCoupon(true);
    setCouponError("");
    
    const purchaseType = viewMode === "subscriptions" ? "subscription" : "booster";

    try {
      const res = await fetch("/api/payment/validate-coupon", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponInput, purchaseType, currency: userCurrency })
      });
      const data = await res.json();

      if (res.ok) {
        // ✅ NEW: We securely store the specific ID of the plan they applied it to
        setAppliedCoupon({ 
            code: data.code, 
            discountType: data.discountType,
            discountValue: data.discountValue,
            applicableTo: data.applicableTo,
            targetId: targetId // Locks the discount to this specific card
        });
        setCouponInput(""); 
        setActiveInputId(null);
      } else {
        setCouponError(data.error || "Invalid code");
      }
    } catch (err) {
      setCouponError("Validation failed");
    }
    setIsValidatingCoupon(false);
  };

  // ==========================================
  // SUBSCRIPTION CHECKOUT
  // ==========================================
  const handleCheckout = async (plan) => {
    if (!session) return signIn();
    setProcessingPlanId(plan.plan_id);

    // ✅ Ensure we only send the coupon if it was applied to THIS specific plan
    const isCouponForThisPlan = appliedCoupon && appliedCoupon.targetId === plan.plan_id;

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.plan_id,
          currency: userCurrency,
          billingCycle: billingCycle,
          couponCode: isCouponForThisPlan ? appliedCoupon.code : null 
        }),
      });

      const data = await res.json();
      
      if (data.gateway === "downgrade_scheduled") {
         alert(data.message);
         router.push("/dashboard");
         return;
      }

      if (data.gateway === "stripe") {
        window.location.href = data.url;
      } else if (data.gateway === "razorpay") {
        const success = await loadRazorpayScript();
        if (!success) return alert("Razorpay SDK failed to load");

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          name: "HeyAiBot",
          subscription_id: data.orderId, 
          handler: async function (response) {
            try {
              const verifyRes = await fetch("/api/payment/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_subscription_id: response.razorpay_subscription_id,
                  razorpay_signature: response.razorpay_signature,
                  planId: plan.plan_id,
                  billingCycle: billingCycle
                }),
              });
              const verifyData = await verifyRes.json();
              if (verifyRes.ok && verifyData.success) router.push("/dashboard?payment_success=true");
              else alert("Payment verification failed.");
            } catch (err) { alert("A network error occurred during verification."); }
          },
          prefill: { email: session.user.email },
          theme: { color: "#4f46e5" },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      }
    } catch (error) {
      alert("Checkout failed");
    }
    setProcessingPlanId(null);
  };

  // ==========================================
  // BOOSTER CHECKOUT
  // ==========================================
  const handleBoosterCheckout = async (booster) => {
    if (!session) return signIn();
    setProcessingPlanId(booster.booster_id);

    // ✅ Ensure we only send the coupon if it was applied to THIS specific booster
    const isCouponForThisBooster = appliedCoupon && appliedCoupon.targetId === booster.booster_id;

    try {
      const res = await fetch("/api/payment/create-booster-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
            boosterId: booster.booster_id, 
            currency: userCurrency,
            couponCode: isCouponForThisBooster ? appliedCoupon.code : null 
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booster order");

      if (data.gateway === "stripe") {
        if (data.url) window.location.assign(data.url);
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) return alert("Failed to load Razorpay.");

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "HeyAiBot",
        description: `${booster.name}`,
        order_id: data.orderId,
        handler: async function (response) {
          const verifyRes = await fetch("/api/payment/verify-booster", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, boosterId: booster.booster_id }),
          });
          if (verifyRes.ok) {
            alert("Tokens added to your wallet successfully!");
            router.push("/dashboard");
          } else alert("Verification failed");
        },
        prefill: { email: session?.user?.email || "" },
        theme: { color: "#10B981" },
        modal: { ondismiss: () => setProcessingPlanId(null) } 
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      rzp.on('payment.failed', () => { alert("Payment failed"); setProcessingPlanId(null); });

    } catch (err) {
      alert("Error initiating checkout: " + err.message);
      setProcessingPlanId(null);
    }
  };

  const currencySymbol = userCurrency === "USD" ? "$" : "₹";

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
      <Head>
        <title>Pricing | HeyAiBot</title>
      </Head>
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
        <div className="flex flex-col items-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight text-center">
            Pick your <span className="text-indigo-600">superpower.</span>
          </h1>
          
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex mb-8">
            <button onClick={() => setViewMode("subscriptions")} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${viewMode === "subscriptions" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}>Subscriptions</button>
            <button onClick={() => setViewMode("boosters")} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${viewMode === "boosters" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}>Token Boosters</button>
          </div>

          {viewMode === "subscriptions" && (
            <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-xl">
              <button onClick={() => setBillingCycle("monthly")} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Monthly</button>
              <button onClick={() => setBillingCycle("yearly")} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${billingCycle === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Yearly</button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* SUBSCRIPTIONS VIEW */}
        {/* ========================================================= */}
        {viewMode === "subscriptions" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => {
              const baseMonthly = userCurrency === "USD" ? plan.amount_usd : plan.amount;
              const baseYearly = userCurrency === "USD" ? plan.amount_yearly_usd : plan.amount_yearly;
              const price = billingCycle === "monthly" ? baseMonthly : baseYearly;
              const yearlySavingsPercent = baseMonthly > 0 ? Math.round(((baseMonthly * 12 - baseYearly) / (baseMonthly * 12)) * 100) : 0;

              // ✅ NEW MATH LOGIC: Flat vs Percentage, locked to THIS specific card
              let finalPrice = price;
              const isCouponForThisPlan = appliedCoupon && appliedCoupon.targetId === plan.plan_id;
              
              if (isCouponForThisPlan) {
                if (appliedCoupon.discountType === 'flat') {
                  finalPrice = Math.max(0, price - appliedCoupon.discountValue);
                } else {
                  finalPrice = Math.max(0, Math.round(price * (1 - appliedCoupon.discountValue / 100)));
                }
              }

              return (
                <div key={plan.plan_id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col relative overflow-hidden">
                  {billingCycle === "yearly" && yearlySavingsPercent > 0 && (
                    <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                      Save {yearlySavingsPercent}%
                    </div>
                  )}

                  <h3 className="text-xl font-black text-slate-900 mb-2">{plan.plan_name}</h3>
                  
                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-4xl font-black text-slate-900">{currencySymbol}{finalPrice}</span>
                    {finalPrice < price && (
                      <span className="text-lg text-slate-400 line-through ml-2">{currencySymbol}{price}</span>
                    )}
                    <span className="text-slate-500 font-bold">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
                  </div>

                  <ul className="space-y-4 mb-10 flex-1">
                    {plan.display_features?.map((f, i) => (
                      <li key={i} className="flex gap-3 text-slate-600 font-medium text-sm">
                        <span className="text-emerald-500 font-black">✓</span> {f}
                      </li>
                    ))}
                  </ul>

                  {/* ✅ ISOLATED COUPON UI */}
                  <div className="mb-4 h-12">
                    {isCouponForThisPlan ? (
                      <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                        <span className="text-xs font-bold text-emerald-700">CODE: {appliedCoupon.code}</span>
                        <button onClick={() => setAppliedCoupon(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">Remove</button>
                      </div>
                    ) : (
                      <>
                        {activeInputId !== plan.plan_id ? (
                          <button 
                            onClick={() => {
                              setActiveInputId(plan.plan_id);
                              setCouponInput("");
                              setCouponError("");
                            }}
                            className="text-indigo-600 text-xs font-bold hover:underline mb-2 block pt-2"
                          >
                            Have a promo code?
                          </button>
                        ) : (
                          <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Enter Code" 
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                              <button 
                                onClick={() => handleApplyCoupon(plan.plan_id)}
                                disabled={isValidatingCoupon}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                              >
                                {isValidatingCoupon ? "..." : "Apply"}
                              </button>
                            </div>
                            {couponError && activeInputId === plan.plan_id && (
                              <p className="text-[10px] text-rose-500 font-bold ml-1">{couponError}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button 
                    onClick={() => handleCheckout(plan)}
                    disabled={processingPlanId === plan.plan_id}
                    className={`w-full py-4 rounded-2xl font-black transition-all shadow-lg ${plan.plan_name.toLowerCase().includes("pro") ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}
                  >
                    {processingPlanId === plan.plan_id ? "Processing..." : "Get Started"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* TOKEN BOOSTERS VIEW */}
        {/* ========================================================= */}
        {viewMode === "boosters" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {boosterPlans.map((booster) => {
              const price = userCurrency === "USD" ? booster.amount_usd : booster.amount;

              // ✅ NEW MATH LOGIC: Flat vs Percentage, locked to THIS specific card
              let finalPrice = price;
              const isCouponForThisBooster = appliedCoupon && appliedCoupon.targetId === booster.booster_id;

              if (isCouponForThisBooster) {
                if (appliedCoupon.discountType === 'flat') {
                  finalPrice = Math.max(0, price - appliedCoupon.discountValue);
                } else {
                  finalPrice = Math.max(0, Math.round(price * (1 - appliedCoupon.discountValue / 100)));
                }
              }

              return (
                <div key={booster.booster_id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-6">⚡</div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">{booster.name}</h3>
                  <div className="text-4xl font-black text-emerald-600 mb-2">+{booster.token_amount}</div>
                  <div className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">Tokens</div>
                  
                  <div className="flex items-baseline gap-1 mb-8 mt-auto">
                    <span className="text-4xl font-black text-slate-900">{currencySymbol}{finalPrice}</span>
                    {finalPrice < price && (
                      <span className="text-lg text-slate-400 line-through ml-2">{currencySymbol}{price}</span>
                    )}
                    <span className="text-slate-500 font-bold ml-1">/ one-time</span>
                  </div>

                  {/* ✅ ISOLATED COUPON UI */}
                  <div className="w-full mb-4 h-12">
                    {isCouponForThisBooster ? (
                      <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-2.5 rounded-xl">
                        <span className="text-xs font-bold text-emerald-700">CODE: {appliedCoupon.code}</span>
                        <button onClick={() => setAppliedCoupon(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">Remove</button>
                      </div>
                    ) : (
                      <>
                        {activeInputId !== booster.booster_id ? (
                          <button 
                            onClick={() => {
                              setActiveInputId(booster.booster_id);
                              setCouponInput("");
                              setCouponError("");
                            }}
                            className="text-emerald-600 text-xs font-bold hover:underline mb-2 block pt-2 mx-auto"
                          >
                            Have a promo code?
                          </button>
                        ) : (
                          <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                placeholder="Enter Code" 
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 text-left"
                              />
                              <button 
                                onClick={() => handleApplyCoupon(booster.booster_id)}
                                disabled={isValidatingCoupon}
                                className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                              >
                                {isValidatingCoupon ? "..." : "Apply"}
                              </button>
                            </div>
                            {couponError && activeInputId === booster.booster_id && (
                              <p className="text-[10px] text-rose-500 font-bold ml-1 text-left">{couponError}</p>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <button 
                    onClick={() => handleBoosterCheckout(booster)} 
                    disabled={processingPlanId === booster.booster_id}
                    className="w-full py-4 rounded-2xl font-black transition-all shadow-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200"
                  >
                    {processingPlanId === booster.booster_id ? "Processing..." : "Buy Tokens"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
// import { useState, useEffect, useRef } from "react";
// import { useSession, signIn } from "next-auth/react";
// import { useRouter } from "next/router";
// import Head from "next/head";
// import Navbar from "@/app/Navbar";
// import Footer from "@/app/Footer";

// const loadRazorpayScript = () => {
//   return new Promise((resolve) => {
//     if (window.Razorpay) return resolve(true);
//     const script = document.createElement("script");
//     script.src = "https://checkout.razorpay.com/v1/checkout.js";
//     script.onload = () => resolve(true);
//     script.onerror = () => resolve(false);
//     document.body.appendChild(script);
//   });
// };

// export default function Pricing() {
//   const { data: session } = useSession();
//   const router = useRouter();

//   const [viewMode, setViewMode] = useState("subscriptions"); 
//   const [plans, setPlans] = useState([]);
//   const [boosterPlans, setBoosterPlans] = useState([]);
//   const [processingPlanId, setProcessingPlanId] = useState(null);
  
//   const [userCurrency, setUserCurrency] = useState("USD"); 
//   const [billingCycle, setBillingCycle] = useState("monthly");
  
//   // COUPON STATE
//   const [showCouponInput, setShowCouponInput] = useState(false); // ✅ Hide/Show Toggle
//   const [couponInput, setCouponInput] = useState("");
//   const [appliedCoupon, setAppliedCoupon] = useState(null); 
//   const [couponError, setCouponError] = useState("");
//   const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);

//   // FETCH & CURRENCY LOGIC
//   useEffect(() => {
//     fetch("/api/admin/plans")
//       .then((res) => res.json())
//       .then((data) => {
//         const activePlans = (data.plans || []).filter(p => p.status === 'active');
//         activePlans.sort((a, b) => a.amount - b.amount);
//         setPlans(activePlans);
//       });

//     fetch("/api/admin/booster-plans")
//       .then((res) => res.json())
//       .then((data) => {
//         const activeBoosters = (data.plans || []).filter(p => p.status === 'active');
//         activeBoosters.sort((a, b) => a.amount - b.amount);
//         setBoosterPlans(activeBoosters);
//       });

//     fetch(`https://get.geojs.io/v1/ip/country.json?t=${new Date().getTime()}`)
//       .then((res) => res.json())
//       .then((data) => setUserCurrency(data.country === "IN" ? "INR" : "USD"))
//       .catch(() => setUserCurrency("USD"));
//   }, []);

//   // Reset coupon state if user switches between tabs
//   useEffect(() => {
//     setAppliedCoupon(null);
//     setCouponInput("");
//     setCouponError("");
//     setShowCouponInput(false);
//   }, [viewMode]);

//   const handleApplyCoupon = async () => {
//     if (!couponInput) return;
//     setIsValidatingCoupon(true);
//     setCouponError("");
    
//     const purchaseType = viewMode === "subscriptions" ? "subscription" : "booster";

//     try {
//       const res = await fetch("/api/payment/validate-coupon", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ code: couponInput, purchaseType, currency: userCurrency })
//       });
//       const data = await res.json();

//       if (res.ok) {
//         // ✅ FIXED: Storing applicableTo so we can filter which cards show the discount
//         setAppliedCoupon({ 
//             code: data.code, 
//             percentage: data.percentage,
//             applicableTo: data.applicableTo 
//         });
//         setCouponInput(""); 
//         setShowCouponInput(false);
//       } else {
//         setCouponError(data.error || "Invalid code");
//       }
//     } catch (err) {
//       setCouponError("Validation failed");
//     }
//     setIsValidatingCoupon(false);
//   };

//   const handleCheckout = async (plan) => {
//     if (!session) return signIn();
//     setProcessingPlanId(plan.plan_id);

//     try {
//       const res = await fetch("/api/payment/create-order", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           planId: plan.plan_id,
//           currency: userCurrency,
//           billingCycle: billingCycle,
//           couponCode: appliedCoupon?.code || null 
//         }),
//       });

//       const data = await res.json();
      
//       if (data.gateway === "downgrade_scheduled") {
//          alert(data.message);
//          router.push("/dashboard");
//          return;
//       }

//       if (data.gateway === "stripe") {
//         window.location.href = data.url;
//       } else if (data.gateway === "razorpay") {
//         const success = await loadRazorpayScript();
//         if (!success) return alert("Razorpay SDK failed to load");

//         const options = {
//           key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//           name: "HeyAiBot",
//           subscription_id: data.orderId, 
//           // handler: (response) => {
//           //   router.push(`/api/payment/verify?razorpay_payment_id=${response.razorpay_payment_id}&razorpay_subscription_id=${response.razorpay_subscription_id}&razorpay_signature=${response.razorpay_signature}`);
//           // },
//           // ✅ FIXED: We securely POST to the API in the background instead of navigating to it
//           handler: async function (response) {
//             try {
//               const verifyRes = await fetch("/api/payment/verify", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({
//                   razorpay_payment_id: response.razorpay_payment_id,
//                   razorpay_subscription_id: response.razorpay_subscription_id,
//                   razorpay_signature: response.razorpay_signature,
//                   planId: plan.plan_id,
//                   billingCycle: billingCycle
//                 }),
//               });
              
//               const verifyData = await verifyRes.json();
              
//               if (verifyRes.ok && verifyData.success) {
//                 // Payment verified successfully! Now redirect to dashboard.
//                 router.push("/dashboard?payment_success=true");
//               } else {
//                 alert("Payment verification failed: " + (verifyData.error || "Please contact support."));
//               }
//             } catch (err) {
//               console.error(err);
//               alert("A network error occurred during verification.");
//             }
//           },
//           prefill: { email: session.user.email },
//           theme: { color: "#4f46e5" },
//         };
//         const rzp = new window.Razorpay(options);
//         rzp.open();
//       }
//     } catch (error) {
//       alert("Checkout failed");
//     }
//     setProcessingPlanId(null);
//   };

//   const handleBoosterCheckout = async (booster) => {
//     if (!session) return signIn();
//     setProcessingPlanId(booster.booster_id);

//     try {
//       const res = await fetch("/api/payment/create-booster-order", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ 
//             boosterId: booster.booster_id, 
//             currency: userCurrency,
//             couponCode: appliedCoupon?.code || null 
//         }),
//       });

//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Failed to create booster order");

//       if (data.gateway === "stripe") {
//         if (data.url) window.location.assign(data.url);
//         else { alert("Stripe Checkout URL missing from response."); setProcessingPlanId(null); }
//         return;
//       }

//       const isLoaded = await loadRazorpayScript();
//       if (!isLoaded) { alert("Failed to load Razorpay."); setProcessingPlanId(null); return; }

//       const options = {
//         key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
//         amount: data.amount,
//         currency: data.currency,
//         name: "HeyAiBot",
//         description: `${booster.name}`,
//         order_id: data.orderId,
//         handler: async function (response) {
//           const verifyRes = await fetch("/api/payment/verify-booster", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ ...response, boosterId: booster.booster_id }),
//           });
//           if (verifyRes.ok) {
//             alert("Tokens added to your wallet successfully!");
//             router.push("/dashboard");
//           } else alert("Verification failed");
//         },
//         prefill: { name: session?.user?.name || "", email: session?.user?.email || "" },
//         theme: { color: "#10B981" },
//         modal: { ondismiss: () => setProcessingPlanId(null) } 
//       };

//       const rzp = new window.Razorpay(options);
//       rzp.open();
//       rzp.on('payment.failed', () => { alert("Payment failed"); setProcessingPlanId(null); });

//     } catch (err) {
//       alert("Error initiating checkout: " + err.message);
//       setProcessingPlanId(null);
//     }
//   };

//   const currencySymbol = userCurrency === "USD" ? "$" : "₹";

//   return (
//     <div className="min-h-screen bg-slate-50 selection:bg-indigo-100">
//       <Head>
//         <title>Pricing | HeyAiBot</title>
//       </Head>
//       <Navbar />

//       <main className="max-w-7xl mx-auto px-6 pt-24 pb-32">
//         <div className="flex flex-col items-center mb-16">
//           <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight text-center">
//             Pick your <span className="text-indigo-600">superpower.</span>
//           </h1>
          
//           <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 flex mb-8">
//             <button onClick={() => setViewMode("subscriptions")} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${viewMode === "subscriptions" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}>Subscriptions</button>
//             <button onClick={() => setViewMode("boosters")} className={`px-6 py-2.5 rounded-xl font-bold transition-all ${viewMode === "boosters" ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:text-slate-800"}`}>Token Boosters</button>
//           </div>

//           {viewMode === "subscriptions" && (
//             <div className="flex items-center gap-4 bg-slate-100 p-1.5 rounded-xl">
//               <button onClick={() => setBillingCycle("monthly")} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${billingCycle === "monthly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Monthly</button>
//               <button onClick={() => setBillingCycle("yearly")} className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${billingCycle === "yearly" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>Yearly</button>
//             </div>
//           )}
//         </div>

//         {/* ========================================================= */}
//         {/* SUBSCRIPTIONS VIEW */}
//         {/* ========================================================= */}
//         {viewMode === "subscriptions" && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {plans.map((plan) => {
//               const baseMonthly = userCurrency === "USD" ? plan.amount_usd : plan.amount;
//               const baseYearly = userCurrency === "USD" ? plan.amount_yearly_usd : plan.amount_yearly;
//               const price = billingCycle === "monthly" ? baseMonthly : baseYearly;

//               const yearlySavingsPercent = baseMonthly > 0 ? Math.round(((baseMonthly * 12 - baseYearly) / (baseMonthly * 12)) * 100) : 0;

//               // ✅ LOGIC FIX: Only apply discount if the coupon is for subscriptions or 'all'
//               let finalPrice = price;
//               if (appliedCoupon && (appliedCoupon.applicableTo === 'all' || appliedCoupon.applicableTo === 'subscription')) {
//                 finalPrice = Math.round(price * (1 - appliedCoupon.percentage / 100));
//               }

//               return (
//                 <div key={plan.plan_id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col relative overflow-hidden">
//                   {billingCycle === "yearly" && yearlySavingsPercent > 0 && (
//                     <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider">
//                       Save {yearlySavingsPercent}%
//                     </div>
//                   )}

//                   <h3 className="text-xl font-black text-slate-900 mb-2">{plan.plan_name}</h3>
                  
//                   <div className="flex items-baseline gap-1 mb-8">
//                     <span className="text-4xl font-black text-slate-900">{currencySymbol}{finalPrice}</span>
//                     {finalPrice < price && (
//                       <span className="text-lg text-slate-400 line-through ml-2">{currencySymbol}{price}</span>
//                     )}
//                     <span className="text-slate-500 font-bold">/{billingCycle === "monthly" ? "mo" : "yr"}</span>
//                   </div>

//                   <ul className="space-y-4 mb-10 flex-1">
//                     {plan.display_features?.map((f, i) => (
//                       <li key={i} className="flex gap-3 text-slate-600 font-medium text-sm">
//                         <span className="text-emerald-500 font-black">✓</span> {f}
//                       </li>
//                     ))}
//                   </ul>

//                   {/* ✅ UI IMPROVEMENT: Click to show Coupon Input */}
//                   <div className="mb-4">
//                     {appliedCoupon && (appliedCoupon.applicableTo === 'all' || appliedCoupon.applicableTo === 'subscription') ? (
//                       <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
//                         <span className="text-xs font-bold text-emerald-700">CODE: {appliedCoupon.code} ({appliedCoupon.percentage}% OFF)</span>
//                         <button onClick={() => setAppliedCoupon(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">Remove</button>
//                       </div>
//                     ) : (
//                       <>
//                         {!showCouponInput ? (
//                           <button 
//                             onClick={() => setShowCouponInput(true)}
//                             className="text-indigo-600 text-xs font-bold hover:underline mb-2 block"
//                           >
//                             Have a promo code?
//                           </button>
//                         ) : (
//                           <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
//                             <input 
//                               type="text" 
//                               placeholder="Enter Code" 
//                               value={couponInput}
//                               onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
//                               className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
//                             />
//                             <button 
//                               onClick={handleApplyCoupon}
//                               disabled={isValidatingCoupon}
//                               className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
//                             >
//                               {isValidatingCoupon ? "..." : "Apply"}
//                             </button>
//                           </div>
//                         )}
//                       </>
//                     )}
//                     {couponError && <p className="text-[10px] text-rose-500 font-bold mt-1 ml-1">{couponError}</p>}
//                   </div>

//                   <button 
//                     onClick={() => handleCheckout(plan)}
//                     disabled={processingPlanId === plan.plan_id}
//                     className={`w-full py-4 rounded-2xl font-black transition-all shadow-lg ${plan.plan_name.toLowerCase().includes("pro") ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200" : "bg-slate-900 text-white hover:bg-slate-800"}`}
//                   >
//                     {processingPlanId === plan.plan_id ? "Processing..." : "Get Started"}
//                   </button>
//                 </div>
//               );
//             })}
//           </div>
//         )}

//         {/* ========================================================= */}
//         {/* TOKEN BOOSTERS VIEW */}
//         {/* ========================================================= */}
//         {viewMode === "boosters" && (
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {boosterPlans.map((booster) => {
//               const price = userCurrency === "USD" ? booster.amount_usd : booster.amount;

//               // ✅ LOGIC FIX: Only apply discount if the coupon is for boosters or 'all'
//               let finalPrice = price;
//               if (appliedCoupon && (appliedCoupon.applicableTo === 'all' || appliedCoupon.applicableTo === 'booster')) {
//                 finalPrice = Math.round(price * (1 - appliedCoupon.percentage / 100));
//               }

//               return (
//                 <div key={booster.booster_id} className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center">
//                   <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mb-6">⚡</div>
//                   <h3 className="text-xl font-black text-slate-900 mb-2">{booster.name}</h3>
//                   <div className="text-4xl font-black text-emerald-600 mb-2">+{booster.token_amount}</div>
//                   <div className="text-sm font-bold text-slate-400 mb-8 uppercase tracking-widest">Tokens</div>
                  
//                   <div className="flex items-baseline gap-1 mb-8 mt-auto">
//                     <span className="text-4xl font-black text-slate-900">{currencySymbol}{finalPrice}</span>
//                     {finalPrice < price && (
//                       <span className="text-lg text-slate-400 line-through ml-2">{currencySymbol}{price}</span>
//                     )}
//                     <span className="text-slate-500 font-bold ml-1">/ one-time</span>
//                   </div>

//                   {/* ✅ UI IMPROVEMENT: Click to show Coupon Input */}
//                   <div className="w-full mb-4">
//                     {appliedCoupon && (appliedCoupon.applicableTo === 'all' || appliedCoupon.applicableTo === 'booster') ? (
//                       <div className="flex justify-between items-center bg-emerald-50 border border-emerald-100 p-3 rounded-xl">
//                         <span className="text-xs font-bold text-emerald-700">CODE: {appliedCoupon.code} ({appliedCoupon.percentage}% OFF)</span>
//                         <button onClick={() => setAppliedCoupon(null)} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">Remove</button>
//                       </div>
//                     ) : (
//                       <>
//                         {!showCouponInput ? (
//                           <button 
//                             onClick={() => setShowCouponInput(true)}
//                             className="text-emerald-600 text-xs font-bold hover:underline mb-2 block"
//                           >
//                             Have a promo code?
//                           </button>
//                         ) : (
//                           <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
//                             <input 
//                               type="text" 
//                               placeholder="Enter Code" 
//                               value={couponInput}
//                               onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
//                               className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
//                             />
//                             <button 
//                               onClick={handleApplyCoupon}
//                               disabled={isValidatingCoupon}
//                               className="bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
//                             >
//                               {isValidatingCoupon ? "..." : "Apply"}
//                             </button>
//                           </div>
//                         )}
//                       </>
//                     )}
//                     {couponError && <p className="text-[10px] text-rose-500 font-bold mt-1 text-left ml-1">{couponError}</p>}
//                   </div>

//                   <button 
//                     onClick={() => handleBoosterCheckout(booster)} 
//                     disabled={processingPlanId === booster.booster_id}
//                     className="w-full py-4 rounded-2xl font-black transition-all shadow-lg bg-emerald-500 text-white hover:bg-emerald-600 shadow-emerald-200"
//                   >
//                     {processingPlanId === booster.booster_id ? "Processing..." : "Buy Tokens"}
//                   </button>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </main>
//       <Footer />
//     </div>
//   );
// }