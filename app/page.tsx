// // app/page.tsx
// import React from "react";
// import Link from "next/link";
// import Script from "next/script";
// import Navbar from "./Navbar";
// import Footer from "./Footer";

// // --- UI Icons ---
// const CheckCircle = () => (
//   <svg className="w-6 h-6 text-indigo-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
//   </svg>
// );

// const SparklesIcon = () => (
//   <svg className="w-8 h-8 text-amber-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
//   </svg>
// );

// const ShieldIcon = () => (
//   <svg className="w-8 h-8 text-emerald-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
//   </svg>
// );

// const ChartIcon = () => (
//   <svg className="w-8 h-8 text-blue-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
//   </svg>
// );

// export default function Home() {
//   return (
//     <div className="flex flex-col min-h-screen font-sans bg-slate-50">
//       <Navbar />

//       <main className="flex-grow">
        
//         {/* --- PREMIUM HERO SECTION --- */}
//         <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
//           {/* Abstract Premium Background Image (Unsplash) */}
//           <div 
//             className="absolute inset-0 z-0"
//             style={{
//               backgroundImage: 'url("https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop")',
//               backgroundSize: 'cover',
//               backgroundPosition: 'center',
//             }}
//           ></div>
          
//           {/* Dark Glass Overlay for Text Readability */}
//           <div className="absolute inset-0 z-0 bg-slate-900/80 backdrop-blur-[2px]"></div>

//           <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center pt-20 pb-16">
//             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 backdrop-blur-md mb-8">
//               <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
//               <span className="text-sm font-medium text-slate-200 tracking-wide uppercase">HeyAiBot 2.0 is Live</span>
//             </div>

//             <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-7xl mb-8 leading-tight drop-shadow-lg">
//               Automate Your Sales. <br />
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">
//                 Delight Your Customers.
//               </span>
//             </h1>
            
//             <p className="mt-4 text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed font-light">
//               Stop losing website visitors. Deploy a custom-trained AI assistant in 5 minutes to capture leads, book meetings, and resolve support tickets 24/7.
//             </p>
            
//             <div className="mt-12 flex flex-col sm:flex-row justify-center gap-5">
//               <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold rounded-full text-white bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_30px_rgba(79,70,229,0.5)] hover:shadow-[0_0_40px_rgba(79,70,229,0.7)] transition-all duration-300 scale-100 hover:scale-105">
//                 Build Your Free Bot
//               </Link>
//               <Link href="#features" className="inline-flex items-center justify-center px-8 py-4 border border-slate-500 text-lg font-medium rounded-full text-slate-300 bg-slate-800/50 backdrop-blur-sm hover:bg-slate-700 transition-all duration-200">
//                 See How It Works
//               </Link>
//             </div>
//           </div>
//         </section>

//         {/* --- SOCIAL PROOF / TRUST BAR --- */}
//         <div className="bg-white border-b border-slate-200 py-10">
//           <div className="max-w-7xl mx-auto px-4 text-center">
//             <p className="text-sm font-semibold text-slate-500 uppercase tracking-widest mb-6">Trusted by innovative agencies and startups</p>
//             <div className="flex flex-wrap justify-center gap-12 opacity-50 grayscale">
//               {/* Dummy Company Names for design feel */}
//               <span className="text-2xl font-black text-slate-800">AcmeCorp</span>
//               <span className="text-2xl font-bold text-slate-800 tracking-tighter">Globex</span>
//               <span className="text-2xl font-serif text-slate-800 italic">Soylent</span>
//               <span className="text-2xl font-mono text-slate-800">Initech</span>
//               <span className="text-2xl font-extrabold text-slate-800">Umbrella</span>
//             </div>
//           </div>
//         </div>

//         {/* --- Z-PATTERN FEATURE 1: ZERO HALLUCINATIONS --- */}
//         <section id="features" className="py-24 bg-slate-50 overflow-hidden">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="grid lg:grid-cols-2 gap-16 items-center">
//               <div>
//                 <h3 className="text-indigo-600 font-bold tracking-wide uppercase mb-3">Enterprise Grade Safety</h3>
//                 <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">Zero Hallucinations. <br/> Total Brand Control.</h2>
//                 <p className="text-lg text-slate-600 mb-8 leading-relaxed">
//                   Unlike generic AI tools like ChatGPT that guess answers, HeyAiBot operates in a strict closed-domain environment. It only uses the services, products, and FAQs you explicitly provide.
//                 </p>
//                 <div className="space-y-4">
//                   <div className="flex items-start"><CheckCircle /><span className="text-slate-700 font-medium">Never makes up pricing or discounts.</span></div>
//                   <div className="flex items-start"><CheckCircle /><span className="text-slate-700 font-medium">Gracefully hands off unknown queries to humans.</span></div>
//                   <div className="flex items-start"><CheckCircle /><span className="text-slate-700 font-medium">Protects your brand reputation 24/7.</span></div>
//                 </div>
//               </div>
//               <div className="relative">
//                 <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
//                 <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" alt="Data Security Dashboard" className="relative rounded-3xl shadow-2xl border border-white/50" />
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* --- Z-PATTERN FEATURE 2: LEAD CAPTURE --- */}
//         <section className="py-24 bg-white overflow-hidden">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="grid lg:grid-cols-2 gap-16 items-center">
//               <div className="order-2 lg:order-1 relative">
//                 <div className="absolute inset-0 bg-gradient-to-tr from-pink-500 to-orange-400 rounded-3xl blur-2xl opacity-20 animate-pulse"></div>
//                 <img src="https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop" alt="Sales Growth" className="relative rounded-3xl shadow-2xl border border-white/50" />
//               </div>
//               <div className="order-1 lg:order-2">
//                 <h3 className="text-pink-600 font-bold tracking-wide uppercase mb-3">Growth Engine</h3>
//                 <h2 className="text-4xl font-extrabold text-slate-900 mb-6 leading-tight">Turn Casual Browsers <br/> Into Qualified Leads.</h2>
//                 <p className="text-lg text-slate-600 mb-8 leading-relaxed">
//                   Your website shouldn't be a static brochure. HeyAiBot proactively engages visitors, understands their intent, and naturally asks for contact information before delivering high-value answers.
//                 </p>
//                 <div className="space-y-4">
//                   <div className="flex items-start"><CheckCircle /><span className="text-slate-700 font-medium">Automatic Name, Email, and Phone collection.</span></div>
//                   <div className="flex items-start"><CheckCircle /><span className="text-slate-700 font-medium">Smart action triggers (Book a Demo, WhatsApp).</span></div>
//                   <div className="flex items-start"><CheckCircle /><span className="text-slate-700 font-medium">Leads instantly synced to your dashboard.</span></div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* --- 3-COLUMN HIGHLIGHTS --- */}
//         <section className="py-24 bg-slate-900 text-white relative overflow-hidden">
//           {/* Subtle background pattern */}
//           <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '30px 30px' }}></div>
          
//           <div className="max-w-7xl mx-auto px-4 relative z-10 text-center mb-16">
//             <h2 className="text-3xl font-extrabold sm:text-5xl mb-4">A Complete Business Solution</h2>
//             <p className="text-slate-400 text-xl max-w-2xl mx-auto">Everything you need to scale your customer interactions without scaling your payroll.</p>
//           </div>

//           <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8 relative z-10">
//             <div className="bg-slate-800/50 backdrop-blur-lg p-8 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors">
//               <SparklesIcon />
//               <h3 className="text-2xl font-bold mb-3">Instant Training</h3>
//               <p className="text-slate-400 leading-relaxed">Just add your services and products to the dashboard. The AI instantly understands your business logic in minutes, not weeks.</p>
//             </div>
            
//             <div className="bg-slate-800/50 backdrop-blur-lg p-8 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors">
//               <ShieldIcon />
//               <h3 className="text-2xl font-bold mb-3">24/7 Availability</h3>
//               <p className="text-slate-400 leading-relaxed">Nights, weekends, and holidays are fully covered. Provide instant answers when your competitors are offline.</p>
//             </div>

//             <div className="bg-slate-800/50 backdrop-blur-lg p-8 rounded-2xl border border-slate-700 hover:bg-slate-800 transition-colors">
//               <ChartIcon />
//               <h3 className="text-2xl font-bold mb-3">Rich Analytics</h3>
//               <p className="text-slate-400 leading-relaxed">Track conversation volumes, view complete chat transcripts, and analyze exactly what your customers are asking for.</p>
//             </div>
//           </div>
//         </section>

//         {/* --- FINAL CALL TO ACTION WITH IMAGE BACKGROUND --- */}
//         <section className="relative py-32 overflow-hidden">
//           <div 
//             className="absolute inset-0 z-0"
//             style={{
//               backgroundImage: 'url("https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop")',
//               backgroundSize: 'cover',
//               backgroundPosition: 'center',
//             }}
//           ></div>
//           <div className="absolute inset-0 z-0 bg-indigo-900/80 backdrop-blur-sm"></div>

//           <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
//             <h2 className="text-4xl font-extrabold text-white sm:text-6xl mb-6 tracking-tight">
//               Ready to Upgrade Your Website?
//             </h2>
//             <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed">
//               You are already paying for traffic. Ensure every visitor gets a VIP experience. Join the businesses growing faster with HeyAiBot.
//             </p>
//             <div className="flex flex-col sm:flex-row justify-center gap-4">
//               <Link href="/register" className="inline-block px-10 py-4 bg-white text-indigo-900 font-bold rounded-full text-xl hover:bg-slate-100 shadow-2xl transition-all duration-300 scale-100 hover:scale-105">
//                 Start Free 14-Day Trial
//               </Link>
//               <Link href="/pricing" className="inline-block px-10 py-4 border-2 border-white/30 text-white font-bold rounded-full text-xl hover:bg-white/10 backdrop-blur-sm transition-all duration-300">
//                 View Pricing
//               </Link>
//             </div>
//           </div>
//         </section>

//       </main>
//       <Footer />
      
//       {/* Widget Script */}
//       <Script
//         src="https://www.heyaibot.com/widget.js"
//         data-app-id="b9808aa0-863a-47be-8824-b3b7b37a09ce"
//         strategy="afterInteractive"
//       />
//     </div>
//   );
// }


// app/page.tsx
import React from "react";
import Link from "next/link";
import Script from "next/script";
import Navbar from "./Navbar";
import Footer from "./Footer";

// --- Icons for UI ---
const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
  </svg>
);

const LockIcon = () => (
  <svg className="w-12 h-12 text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-12 h-12 text-purple-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const GrowthIcon = () => (
  <svg className="w-12 h-12 text-teal-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
      <Navbar />

      <main className="flex-grow">
        
        {/* --- HERO SECTION (NEW FULL-WIDTH BACKGROUND LAYOUT) --- */}
        <section className="relative min-h-[85vh] flex items-center overflow-hidden bg-blue-50 py-20 lg:py-0">
          
          {/* Background Image: Anchored to the right so the robot never gets cut off */}
          <div 
            className="absolute inset-0 z-0"
            style={{
              backgroundImage: 'url("/banner2.webp")',
              backgroundSize: 'cover',
              backgroundPosition: 'right center', // Focuses on the right side
              backgroundRepeat: 'no-repeat'
            }}
          ></div>
          
          {/* Gradient overlay on the LEFT side only to make text readable over the clouds */}
          <div className="absolute inset-0 z-0 bg-gradient-to-r from-white via-white/90 to-transparent lg:via-transparent">
             {/* Desktop specific tighter gradient */}
             <div className="hidden lg:block absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent w-2/3"></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
            {/* 2-Column Grid: Left has text, Right is completely empty for the robot */}
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              
              {/* LEFT SIDE: Hero Text */}
              <div className="max-w-2xl pt-10 lg:pt-0">
                <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl mb-6 leading-tight">
                  Turn Your Website Into a <br className="hidden sm:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 drop-shadow-sm">
                    24/7 AI Sales Assistant
                  </span>
                </h1>
                
                <p className="mt-6 text-xl text-gray-800 font-medium leading-relaxed drop-shadow-sm">
                  Convert website visitors into qualified leads automatically. 
                  HeyAiBot is a powerful AI chatbot that understands your business, 
                  answers visitor questions instantly, and captures leads automatically — even while you sleep.
                </p>
                
                <div className="mt-10 flex flex-col sm:flex-row gap-4">
                  <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
                    Start Free Setup
                  </Link>
                  <Link href="#how-it-works" className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-900 text-lg font-bold rounded-full text-gray-900 bg-white/50 backdrop-blur-sm hover:bg-white transition-all duration-200">
                    See How It Works
                  </Link>
                </div>
                
                <p className="mt-6 text-sm text-gray-700 font-medium">
                  Instead of losing visitors, turn conversations into real business opportunities.
                </p>
              </div>
              
              {/* RIGHT SIDE: Intentionally empty so the robot and "Hi!" are perfectly visible */}
              <div className="hidden lg:block h-[500px]"></div>

            </div>
          </div>
        </section>

        {/* --- WHAT IS HEYAIBOT? (REVERTED TO ORIGINAL) --- */}
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-6">
                  What is HeyAiBot?
                </h2>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  HeyAiBot is a smart, business-trained AI chatbot for lead generation designed specifically for websites, SaaS platforms, and service businesses.
                </p>
                <p className="text-lg text-gray-600 mb-6 leading-relaxed">
                  Unlike generic AI tools that give random answers, HeyAiBot responds <strong>only based on the information you provide</strong>.
                </p>
                
                <div className="space-y-3 mt-8">
                  <div className="flex items-center"><CheckIcon /><span className="text-gray-700">Accurate responses & No hallucinations</span></div>
                  <div className="flex items-center"><CheckIcon /><span className="text-gray-700">No misleading promises</span></div>
                  <div className="flex items-center"><CheckIcon /><span className="text-gray-700">Full control from your dashboard</span></div>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm">
                <h3 className="text-xl font-bold text-gray-900 mb-4">It works like a real assistant:</h3>
                <ul className="space-y-4">
                  <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Answer customer questions instantly</span></li>
                  <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Guide visitors to the right service or product</span></li>
                  <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Capture name, email, and contact details</span></li>
                  <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Offer WhatsApp or demo booking</span></li>
                  <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Work 24/7 without human staff</span></li>
                  <li className="flex items-start"><CheckIcon /><span className="text-gray-600 font-semibold text-blue-600">Never miss a potential lead</span></li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section id="how-it-works" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-base font-bold text-blue-600 tracking-wide uppercase mb-2">Simple Setup</h2>
              <p className="text-3xl font-extrabold text-gray-900 sm:text-5xl">
                How HeyAiBot Works
              </p>
              <p className="mt-4 text-xl text-gray-600">
                No coding required. Set up your lead capture bot in minutes.
              </p>
            </div>

            <div className="grid md:grid-cols-4 gap-8">
              {/* Step 1 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">1</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Add Categories</h3>
                <p className="text-sm text-gray-600">
                  Define your business areas like Services, Pricing, or Support. This keeps responses focused.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">2</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Add Services</h3>
                <p className="text-sm text-gray-600">
                  Explain what you offer (e.g., SEO, App Dev). The AI learns your offerings without guessing.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">3</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Create Action Flow</h3>
                <p className="text-sm text-gray-600">
                  Decide what happens next: Capture email, trigger demo booking, or offer WhatsApp contact.
                </p>
              </div>

              {/* Step 4 */}
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">4</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Preview & Launch</h3>
                <p className="text-sm text-gray-600">
                  Test instantly. If it looks good, click publish. Your 24/7 AI chatbot is live!
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- BENEFITS SECTION --- */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-3 gap-12 text-center">
              {/* Feature 1 */}
              <div className="p-8 rounded-2xl bg-blue-50 border border-blue-100 transition-transform hover:-translate-y-1 duration-300">
                <div className="flex justify-center"><ClockIcon /></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Always Available 24/7</h3>
                <p className="text-gray-600 leading-relaxed">
                  Visitors don’t wait for office hours. HeyAiBot works nights, weekends, and holidays. Every visitor gets instant attention. No lost opportunities.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="p-8 rounded-2xl bg-teal-50 border border-teal-100 transition-transform hover:-translate-y-1 duration-300">
                <div className="flex justify-center"><GrowthIcon /></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Built for Growth</h3>
                <p className="text-gray-600 leading-relaxed">
                  Scale your business without hiring more staff. Reduce repetitive questions and capture high-intent leads automatically.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="p-8 rounded-2xl bg-indigo-50 border border-indigo-100 transition-transform hover:-translate-y-1 duration-300">
                <div className="flex justify-center"><LockIcon /></div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Safe & Controlled AI</h3>
                <p className="text-gray-600 leading-relaxed">
                  No random AI guesses. The bot only responds based on the data you provide. You stay in full control of your business communication.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- WHO IS IT FOR? --- */}
        <section className="py-16 bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-10">Who Is HeyAiBot For?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {["Digital Agencies", "SaaS Companies", "Service Businesses", "Startups", "E-commerce Stores", "Consultants", "Online Coaches"].map((item) => (
                <span key={item} className="px-6 py-3 bg-gray-800 rounded-full text-lg font-medium border border-gray-700">
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-10 text-xl text-gray-400 max-w-2xl mx-auto">
              If your business has a website and you want more leads — HeyAiBot is built for you.
            </p>
          </div>
        </section>

        {/* --- COMPARISON --- */}
        <section className="py-20 bg-white border-t border-gray-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose HeyAiBot Over Generic Chatbots?</h2>
            <p className="text-lg text-gray-600 mb-10">
              Most chatbots only answer questions. HeyAiBot is designed specifically for <strong>conversion</strong>.
            </p>
            
            <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
              <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckIcon /> <span className="font-semibold text-gray-800">Business-specific AI responses</span>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckIcon /> <span className="font-semibold text-gray-800">Smart action triggers</span>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckIcon /> <span className="font-semibold text-gray-800">Automatic lead capture</span>
              </div>
              <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
                <CheckIcon /> <span className="font-semibold text-gray-800">Easy 24/7 automation</span>
              </div>
            </div>
            
            <div className="mt-8 text-2xl font-bold text-blue-600">
              It doesn’t just chat. It converts.
            </div>
          </div>
        </section>

        {/* --- FINAL CALL TO ACTION --- */}
        <section className="py-24 bg-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-10">
            <svg className="absolute right-0 bottom-0 h-full w-1/2 translate-x-1/3 translate-y-1/4 transform text-white" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
              <polygon points="50,0 100,0 50,100 0,100" />
            </svg>
          </div>
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl font-extrabold text-white sm:text-5xl mb-6">
              Don’t Let Visitors Leave Without Talking to You
            </h2>
            <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              You are already spending money on ads and SEO. Now make sure every visitor gets guided properly.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/register" className="inline-block px-10 py-4 bg-white text-blue-600 font-bold rounded-full text-xl hover:bg-gray-50 shadow-xl transition-all duration-200">
                Start Free Setup
              </Link>
              <Link href="/register" className="inline-block px-10 py-4 border-2 border-white text-white font-bold rounded-full text-xl hover:bg-blue-700 transition-all duration-200">
                Launch Your Bot Today
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
      
      {/* Widget Script */}
      <Script
        src="https://www.heyaibot.com/widget.js"
        data-app-id="b9808aa0-863a-47be-8824-b3b7b37a09ce"
        strategy="afterInteractive"
      />
    </div>
  );
}




// // app/page.tsx
// import React from "react";
// import Link from "next/link";
// import Script from "next/script";
// import Navbar from "./Navbar";
// import Footer from "./Footer";

// // --- Icons for UI ---
// const CheckIcon = () => (
//   <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
//   </svg>
// );

// const LockIcon = () => (
//   <svg className="w-12 h-12 text-blue-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
//   </svg>
// );

// const ClockIcon = () => (
//   <svg className="w-12 h-12 text-purple-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
//   </svg>
// );

// const GrowthIcon = () => (
//   <svg className="w-12 h-12 text-teal-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
//     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
//   </svg>
// );

// export default function Home() {
//   return (
//     <div className="flex flex-col min-h-screen font-sans bg-white">
//       <Navbar />

//       <main className="flex-grow">
        
//         {/* --- HERO SECTION --- */}
//         <section className="relative py-20 lg:py-32 bg-gradient-to-b from-blue-50 via-white to-white overflow-hidden">
//           <div className="absolute inset-0 pointer-events-none opacity-30">
//             <svg className="absolute left-0 top-0 h-full w-full" width="100%" height="100%" fill="none">
//               <defs>
//                 <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
//                   <path d="M0 40L40 0H0V40Z" fill="currentColor" className="text-blue-100" />
//                 </pattern>
//               </defs>
//               <rect width="100%" height="100%" fill="url(#grid-pattern)" />
//             </svg>
//           </div>

//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
//             <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl mb-6">
//               Turn Your Website Into a <br className="hidden sm:block" />
//               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
//                 24/7 AI Sales Assistant
//               </span>
//             </h1>
            
//             <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
//               Convert website visitors into qualified leads automatically. 
//               HeyAiBot is a powerful AI chatbot that understands your business, 
//               answers visitor questions instantly, and captures leads automatically — even while you sleep.
//             </p>
            
//             <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
//               <Link href="/login" className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-bold rounded-full text-white bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-xl transition-all duration-200">
//                 Start Free Setup
//               </Link>
//               {/* If you have a demo link, replace #demo with the actual URL */}
//               <Link href="#how-it-works" className="inline-flex items-center justify-center px-8 py-4 border-2 border-gray-300 text-lg font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 hover:border-gray-400 transition-all duration-200">
//                 See How It Works
//               </Link>
//             </div>
            
//             <p className="mt-4 text-sm text-gray-500">
//               Instead of losing visitors, turn conversations into real business opportunities.
//             </p>
//           </div>
//         </section>

//         {/* --- WHAT IS HEYAIBOT? --- */}
//         <section className="py-20 bg-white">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="grid md:grid-cols-2 gap-12 items-center">
//               <div>
//                 <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl mb-6">
//                   What is HeyAiBot?
//                 </h2>
//                 <p className="text-lg text-gray-600 mb-6 leading-relaxed">
//                   HeyAiBot is a smart, business-trained AI chatbot for lead generation designed specifically for websites, SaaS platforms, and service businesses.
//                 </p>
//                 <p className="text-lg text-gray-600 mb-6 leading-relaxed">
//                   Unlike generic AI tools that give random answers, HeyAiBot responds <strong>only based on the information you provide</strong>.
//                 </p>
                
//                 <div className="space-y-3 mt-8">
//                   <div className="flex items-center"><CheckIcon /><span className="text-gray-700">Accurate responses & No hallucinations</span></div>
//                   <div className="flex items-center"><CheckIcon /><span className="text-gray-700">No misleading promises</span></div>
//                   <div className="flex items-center"><CheckIcon /><span className="text-gray-700">Full control from your dashboard</span></div>
//                 </div>
//               </div>
              
//               <div className="bg-gray-50 rounded-2xl p-8 border border-gray-100 shadow-sm">
//                 <h3 className="text-xl font-bold text-gray-900 mb-4">It works like a real assistant:</h3>
//                 <ul className="space-y-4">
//                   <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Answer customer questions instantly</span></li>
//                   <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Guide visitors to the right service or product</span></li>
//                   <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Capture name, email, and contact details</span></li>
//                   <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Offer WhatsApp or demo booking</span></li>
//                   <li className="flex items-start"><CheckIcon /><span className="text-gray-600">Work 24/7 without human staff</span></li>
//                   <li className="flex items-start"><CheckIcon /><span className="text-gray-600 font-semibold text-blue-600">Never miss a potential lead</span></li>
//                 </ul>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* --- HOW IT WORKS --- */}
//         <section id="how-it-works" className="py-20 bg-gray-50">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="text-center max-w-3xl mx-auto mb-16">
//               <h2 className="text-base font-bold text-blue-600 tracking-wide uppercase mb-2">Simple Setup</h2>
//               <p className="text-3xl font-extrabold text-gray-900 sm:text-5xl">
//                 How HeyAiBot Works
//               </p>
//               <p className="mt-4 text-xl text-gray-600">
//                 No coding required. Set up your lead capture bot in minutes.
//               </p>
//             </div>

//             <div className="grid md:grid-cols-4 gap-8">
//               {/* Step 1 */}
//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
//                 <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">1</div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-2">Add Categories</h3>
//                 <p className="text-sm text-gray-600">
//                   Define your business areas like Services, Pricing, or Support. This keeps responses focused.
//                 </p>
//               </div>

//               {/* Step 2 */}
//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
//                 <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">2</div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-2">Add Services</h3>
//                 <p className="text-sm text-gray-600">
//                   Explain what you offer (e.g., SEO, App Dev). The AI learns your offerings without guessing.
//                 </p>
//               </div>

//               {/* Step 3 */}
//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
//                 <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">3</div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-2">Create Action Flow</h3>
//                 <p className="text-sm text-gray-600">
//                   Decide what happens next: Capture email, trigger demo booking, or offer WhatsApp contact.
//                 </p>
//               </div>

//               {/* Step 4 */}
//               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
//                 <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-bold text-lg mb-4">4</div>
//                 <h3 className="text-lg font-bold text-gray-900 mb-2">Preview & Launch</h3>
//                 <p className="text-sm text-gray-600">
//                   Test instantly. If it looks good, click publish. Your 24/7 AI chatbot is live!
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* --- BENEFITS SECTION --- */}
//         <section className="py-24 bg-white">
//           <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//             <div className="grid md:grid-cols-3 gap-12 text-center">
//               {/* Feature 1 */}
//               <div className="p-8 rounded-2xl bg-blue-50 border border-blue-100 transition-transform hover:-translate-y-1 duration-300">
//                 <div className="flex justify-center"><ClockIcon /></div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Always Available 24/7</h3>
//                 <p className="text-gray-600 leading-relaxed">
//                   Visitors don’t wait for office hours. HeyAiBot works nights, weekends, and holidays. Every visitor gets instant attention. No lost opportunities.
//                 </p>
//               </div>

//               {/* Feature 2 */}
//               <div className="p-8 rounded-2xl bg-teal-50 border border-teal-100 transition-transform hover:-translate-y-1 duration-300">
//                 <div className="flex justify-center"><GrowthIcon /></div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Built for Growth</h3>
//                 <p className="text-gray-600 leading-relaxed">
//                   Scale your business without hiring more staff. Reduce repetitive questions and capture high-intent leads automatically.
//                 </p>
//               </div>

//               {/* Feature 3 */}
//               <div className="p-8 rounded-2xl bg-indigo-50 border border-indigo-100 transition-transform hover:-translate-y-1 duration-300">
//                 <div className="flex justify-center"><LockIcon /></div>
//                 <h3 className="text-2xl font-bold text-gray-900 mb-4">Safe & Controlled AI</h3>
//                 <p className="text-gray-600 leading-relaxed">
//                   No random AI guesses. The bot only responds based on the data you provide. You stay in full control of your business communication.
//                 </p>
//               </div>
//             </div>
//           </div>
//         </section>

//         {/* --- WHO IS IT FOR? --- */}
//         <section className="py-16 bg-gray-900 text-white">
//           <div className="max-w-7xl mx-auto px-4 text-center">
//             <h2 className="text-3xl font-bold mb-10">Who Is HeyAiBot For?</h2>
//             <div className="flex flex-wrap justify-center gap-4">
//               {["Digital Agencies", "SaaS Companies", "Service Businesses", "Startups", "E-commerce Stores", "Consultants", "Online Coaches"].map((item) => (
//                 <span key={item} className="px-6 py-3 bg-gray-800 rounded-full text-lg font-medium border border-gray-700">
//                   {item}
//                 </span>
//               ))}
//             </div>
//             <p className="mt-10 text-xl text-gray-400 max-w-2xl mx-auto">
//               If your business has a website and you want more leads — HeyAiBot is built for you.
//             </p>
//           </div>
//         </section>

//         {/* --- COMPARISON --- */}
//         <section className="py-20 bg-white border-t border-gray-100">
//           <div className="max-w-4xl mx-auto px-4 text-center">
//             <h2 className="text-3xl font-bold text-gray-900 mb-6">Why Choose HeyAiBot Over Generic Chatbots?</h2>
//             <p className="text-lg text-gray-600 mb-10">
//               Most chatbots only answer questions. HeyAiBot is designed specifically for <strong>conversion</strong>.
//             </p>
            
//             <div className="grid sm:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
//               <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
//                 <CheckIcon /> <span className="font-semibold text-gray-800">Business-specific AI responses</span>
//               </div>
//               <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
//                 <CheckIcon /> <span className="font-semibold text-gray-800">Smart action triggers</span>
//               </div>
//               <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
//                 <CheckIcon /> <span className="font-semibold text-gray-800">Automatic lead capture</span>
//               </div>
//               <div className="flex items-center p-4 bg-green-50 rounded-lg border border-green-100">
//                 <CheckIcon /> <span className="font-semibold text-gray-800">Easy 24/7 automation</span>
//               </div>
//             </div>
            
//             <div className="mt-8 text-2xl font-bold text-blue-600">
//               It doesn’t just chat. It converts.
//             </div>
//           </div>
//         </section>

//         {/* --- FINAL CALL TO ACTION --- */}
//         <section className="py-24 bg-blue-600 relative overflow-hidden">
//           <div className="absolute inset-0 pointer-events-none opacity-10">
//             <svg className="absolute right-0 bottom-0 h-full w-1/2 translate-x-1/3 translate-y-1/4 transform text-white" fill="currentColor" viewBox="0 0 100 100" preserveAspectRatio="none">
//               <polygon points="50,0 100,0 50,100 0,100" />
//             </svg>
//           </div>
//           <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
//             <h2 className="text-3xl font-extrabold text-white sm:text-5xl mb-6">
//               Don’t Let Visitors Leave Without Talking to You
//             </h2>
//             <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
//               You are already spending money on ads and SEO. Now make sure every visitor gets guided properly.
//             </p>
//             <div className="flex flex-col sm:flex-row justify-center gap-4">
//               <Link href="/login" className="inline-block px-10 py-4 bg-white text-blue-600 font-bold rounded-full text-xl hover:bg-gray-50 shadow-xl transition-all duration-200">
//                 Start Free Setup
//               </Link>
//               <Link href="/login" className="inline-block px-10 py-4 border-2 border-white text-white font-bold rounded-full text-xl hover:bg-blue-700 transition-all duration-200">
//                 Launch Your Bot Today
//               </Link>
//             </div>
//           </div>
//         </section>

//       </main>
//       <Footer />
      
//       {/* Widget Script */}
//       <Script
//         src="https://www.heyaibot.com/widget.js"
//         data-app-id="b9808aa0-863a-47be-8824-b3b7b37a09ce"
//         strategy="afterInteractive"
//       />
//     </div>
//   );
// }