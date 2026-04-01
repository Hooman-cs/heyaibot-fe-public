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

  const [viewMode, setViewMode] = useState("subscriptions"); // "subscriptions" | "boosters"
  const [plans, setPlans] = useState([]);
  const [boosterPlans, setBoosterPlans] = useState([]);
  const [processingPlanId, setProcessingPlanId] = useState(null);
  const [userCurrency, setUserCurrency] = useState(null);
  const [billingCycle, setBillingCycle] = useState("monthly");
  const carouselRef = useRef(null);

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

  const handleCheckout = async (plan) => {
    if (!session) return signIn();
    setProcessingPlanId(plan.plan_id);

    try {
      const res = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.plan_id,
          currency: userCurrency,
          billingCycle: billingCycle
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create order");

      if (data.gateway === "downgrade_scheduled") {
        alert(data.message);
        router.push("/dashboard");
        setProcessingPlanId(null);
        return;
      }

      if (data.gateway === "stripe") {
        if (data.url) window.location.assign(data.url);
        else { alert("Stripe Checkout URL missing from response."); setProcessingPlanId(null); }
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) { alert("Failed to load Razorpay."); setProcessingPlanId(null); return; }

      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        amount: data.amount,
        currency: data.currency,
        name: "HeyAiBot",
        description: `${plan.plan_name} Plan (${billingCycle})`,
        // order_id: data.orderId,
        order_id: data.gateway === 'razorpay_subscription' ? undefined : data.orderId,
        subscription_id: data.gateway === 'razorpay_subscription' ? data.subscriptionId : undefined,

        handler: async function (response) {
          const verifyRes = await fetch("/api/payment/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...response, planId: plan.plan_id, billingCycle: billingCycle }),
          });
          if (verifyRes.ok) router.push("/dashboard");
          else alert("Verification failed");
        },
        prefill: { name: session?.user?.name || "", email: session?.user?.email || "" },
        theme: { color: "#4F46E5" },
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

  const handleBoosterCheckout = async (booster) => {
    if (!session) return signIn();
    setProcessingPlanId(booster.booster_id);

    try {
      const res = await fetch("/api/payment/create-booster-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ boosterId: booster.booster_id, currency: userCurrency }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create booster order");

      if (data.gateway === "stripe") {
        if (data.url) window.location.assign(data.url);
        else { alert("Stripe Checkout URL missing from response."); setProcessingPlanId(null); }
        return;
      }

      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) { alert("Failed to load Razorpay."); setProcessingPlanId(null); return; }

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
        prefill: { name: session?.user?.name || "", email: session?.user?.email || "" },
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

  const scroll = (direction) => {
    if (carouselRef.current) {
      const scrollAmount = 350;
      carouselRef.current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <>
      <Head>
        <title>AI Chatbot Pricing Plans | Affordable & Scalable</title>
        <meta name="title" content="AI Chatbot Pricing Plans | Affordable & Scalable" />
        <meta
          name="description"
          content="Choose flexible AI chatbot pricing packages for websites. Increase conversions, automate responses, and scale your business with smart AI tools."
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        {/* ADD CANONICAL TAG */}
        <link rel="canonical" href="https://www.heyaibot.com/pricing" />
      </Head>

      <div className="min-h-screen bg-slate-50 font-sans flex flex-col">
        <Navbar />

        <main className="flex-grow pt-20 pb-24 relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-500 rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-6">Simple, Transparent Pricing</h1>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium">Upgrade, downgrade, or cancel anytime. No hidden fees.</p>

            {/* MAIN TOGGLE: Subscriptions vs Boosters */}
            <div className="flex justify-center mb-10">
              <div className="bg-slate-200/60 p-1.5 rounded-full inline-flex items-center">
                <button
                  onClick={() => setViewMode("subscriptions")}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${viewMode === "subscriptions" ? "bg-white text-indigo-600 shadow-md" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Subscription Plans
                </button>
                <button
                  onClick={() => setViewMode("boosters")}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all ${viewMode === "boosters" ? "bg-white text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-800"}`}
                >
                  Token Boosters
                </button>
              </div>
            </div>

            {/* LOADING STATE */}
            {(!userCurrency || (plans.length === 0 && boosterPlans.length === 0)) ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
              </div>
            ) : (
              <>
                {/* =============================== */}
                {/* VIEW 1: SUBSCRIPTION PLANS      */}
                {/* =============================== */}
                {viewMode === "subscriptions" && (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    {/* Monthly / Yearly Sub-Toggle */}
                    <div className="flex justify-center mb-10">
                      <div className="bg-white border border-slate-200 p-1 rounded-full inline-flex items-center shadow-sm relative">
                        <button onClick={() => setBillingCycle("monthly")} className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-all ${billingCycle === "monthly" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}>Monthly</button>
                        <button onClick={() => setBillingCycle("yearly")} className={`relative z-10 px-6 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-2 ${billingCycle === "yearly" ? "bg-slate-900 text-white" : "text-slate-500 hover:text-slate-800"}`}>
                          Yearly <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">Save 20%</span>
                        </button>
                      </div>
                    </div>

                    {plans.length === 0 ? (
                      <div className="text-slate-500 font-bold p-10">No subscription plans available right now.</div>
                    ) : (
                      <div className="relative group max-w-6xl mx-auto">
                        <button onClick={() => scroll('left')} className="absolute -left-4 md:-left-12 top-1/2 -translate-y-1/2 z-20 bg-white border border-slate-200 text-slate-600 p-3 lg:p-4 rounded-full shadow-xl hover:bg-slate-50 hover:text-indigo-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center focus:outline-none">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"></path></svg>
                        </button>

                        <div ref={carouselRef} className="flex gap-6 overflow-x-auto snap-x snap-mandatory py-6 px-4 sm:px-8 items-stretch [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                          {plans.map((plan, index) => {
                            const isPopular = index === 1;
                            const isINR = userCurrency === "INR";
                            const currencySymbol = isINR ? "₹" : "$";

                            let mrp = Number(isINR ? (plan.amount_mrp || plan.amount) : (plan.amount_mrp_usd || plan.amount_usd));
                            let sellingPrice = Number(isINR ? plan.amount : plan.amount_usd);

                            if (billingCycle === 'yearly') {
                              const discountPercent = Number(plan.yearly_discount) || 20;
                              mrp = mrp * 12;
                              sellingPrice = (sellingPrice * 12) * ((100 - discountPercent) / 100);
                              sellingPrice = isINR ? Math.round(sellingPrice) : parseFloat(sellingPrice.toFixed(2));
                            }

                            const hasDiscount = mrp > sellingPrice;
                            const featuresList = plan.display_features?.length > 0 ? plan.display_features : Object.entries(plan.features || {}).map(([k, v]) => `${v} ${k}`);

                            return (
                              <div key={plan.plan_id} className={`relative min-w-[300px] max-w-[340px] w-full shrink-0 snap-center flex flex-col bg-white rounded-3xl transition-transform duration-300 hover:-translate-y-2 ${isPopular ? "border-2 border-indigo-600 shadow-2xl shadow-indigo-600/20" : "border border-slate-200 shadow-xl shadow-slate-200/50"}`}>
                                {isPopular && <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2"><span className="bg-indigo-600 text-white text-xs font-bold uppercase tracking-widest py-1.5 px-4 rounded-full shadow-md">Most Popular</span></div>}

                                <div className="p-8 border-b border-slate-100 text-left flex-1">
                                  <h2 className="text-2xl font-black text-slate-900 capitalize mb-4">{plan.plan_name}</h2>
                                  <div className="mb-6 h-16 flex flex-col justify-end">
                                    {hasDiscount && <span className="text-lg font-bold text-slate-400 line-through mb-1 block">{currencySymbol}{mrp}</span>}
                                    <div><span className="text-5xl font-black text-slate-900">{currencySymbol}{sellingPrice}</span><span className="text-slate-500 font-medium ml-1">/{billingCycle === 'yearly' ? 'yr' : 'mo'}</span></div>
                                  </div>
                                  <button onClick={() => handleCheckout(plan)} disabled={processingPlanId !== null} className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all flex justify-center items-center shadow-md ${isPopular ? "bg-indigo-600 text-white hover:bg-indigo-700" : "bg-slate-900 text-white hover:bg-slate-800"} ${processingPlanId === plan.plan_id ? "opacity-75 cursor-wait" : ""}`}>
                                    {processingPlanId === plan.plan_id ? "Processing..." : "Get Started"}
                                  </button>
                                </div>
                                <div className="p-8 bg-slate-50/50 rounded-b-3xl text-left flex-1">
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">What&apos;s included</p>
                                  <ul className="space-y-4">
                                    {featuresList.map((text, idx) => <li key={idx} className="flex items-start gap-3"><svg className="h-6 w-6 text-indigo-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg><span className="text-slate-600 font-medium">{text}</span></li>)}
                                  </ul>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        <button onClick={() => scroll('right')} className="absolute -right-4 md:-right-12 top-1/2 -translate-y-1/2 z-20 bg-white border border-slate-200 text-slate-600 p-3 lg:p-4 rounded-full shadow-xl hover:bg-slate-50 hover:text-indigo-600 hover:scale-110 transition-all opacity-0 group-hover:opacity-100 hidden md:flex items-center justify-center focus:outline-none">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M9 5l7 7-7 7"></path></svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* =============================== */}
                {/* VIEW 2: TOKEN BOOSTERS          */}
                {/* =============================== */}
                {viewMode === "boosters" && (
                  <div className="animate-in fade-in zoom-in-95 duration-300 max-w-5xl mx-auto pt-6">
                    {boosterPlans.length === 0 ? (
                      <div className="text-slate-500 font-bold p-10">No booster packs available right now.</div>
                    ) : (
                      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center">
                        {boosterPlans.map((booster) => {
                          const isINR = userCurrency === "INR";
                          const currencySymbol = isINR ? "₹" : "$";
                          const price = isINR ? booster.amount : booster.amount_usd;

                          return (
                            <div key={booster.booster_id} className="bg-white border border-emerald-100 shadow-lg shadow-emerald-900/5 rounded-3xl p-8 flex flex-col hover:-translate-y-1 transition-transform">
                              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mb-4 mx-auto">🚀</div>
                              <h3 className="text-xl font-bold text-slate-900 mb-2">{booster.name}</h3>
                              <div className="text-3xl font-black text-emerald-600 mb-6">+{booster.token_amount?.toLocaleString()} <span className="text-lg text-emerald-700/70 font-bold">Tokens</span></div>

                              <div className="mt-auto mb-6">
                                <span className="text-4xl font-black text-slate-900">{currencySymbol}{price}</span>
                                <span className="text-slate-500 font-medium ml-1">/ one-time</span>
                              </div>

                              <button onClick={() => handleBoosterCheckout(booster)} disabled={processingPlanId !== null} className={`w-full py-3.5 px-6 rounded-xl font-bold transition-all flex justify-center items-center shadow-md bg-emerald-600 text-white hover:bg-emerald-700 ${processingPlanId === booster.booster_id ? "opacity-75 cursor-wait" : ""}`}>
                                {processingPlanId === booster.booster_id ? "Processing..." : "Buy Tokens"}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            <div className="mt-16 flex justify-center items-center gap-2 text-slate-500 font-medium text-sm">
              <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Secure payments processed by Razorpay & Stripe
            </div>

          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}