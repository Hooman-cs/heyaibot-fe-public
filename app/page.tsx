import React from "react";
import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";

// --- Minimal UI Icons ---
const CheckIcon = () => (
  <svg className="w-5 h-5 text-indigo-500 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
  </svg>
);

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-white text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 overflow-hidden">
      <Navbar />

      <main className="flex-grow">
        
        {/* =========================================
            1. HERO SECTION (Mesh Gradient & Orbs)
        ========================================== */}
        <section className="relative pt-20 pb-16 lg:pt-28 lg:pb-20 overflow-hidden bg-slate-50">
          
          {/* Animated/Glowing Mesh Gradient Background */}
          <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-300/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>
          <div className="absolute top-10 right-1/4 w-[400px] h-[400px] bg-purple-300/40 rounded-full mix-blend-multiply filter blur-[100px] opacity-70"></div>
          <div className="absolute -bottom-32 left-1/3 w-[600px] h-[600px] bg-pink-200/40 rounded-full mix-blend-multiply filter blur-[120px] opacity-70"></div>
          
          {/* Subtle dot pattern overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 mix-blend-multiply"></div>

          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-sm border border-indigo-100 text-indigo-700 font-bold text-xs sm:text-sm uppercase tracking-widest mb-8 shadow-sm">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
              Best AI Chatbot for Websites to Capture Leads Automatically
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight mb-6 drop-shadow-sm">
              Turn Your Website Into a <br className="hidden sm:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
                24/7 AI Sales Assistant
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 font-medium leading-relaxed mb-10 max-w-3xl mx-auto">
              <strong className="text-slate-900">Convert Website Visitors Into Qualified Leads Automatically.</strong> <br/>
              HeyAiBot is a powerful AI chatbot for websites that understands your business, answers visitor questions instantly, and captures leads automatically — even while you sleep.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-16">
              <Link href="/register" className="w-full sm:w-auto px-8 py-3.5 text-base font-bold rounded-xl text-white bg-slate-900 hover:bg-indigo-600 hover:-translate-y-1 shadow-xl shadow-indigo-900/20 transition-all duration-300">
                Start Free Setup &rarr;
              </Link>
              <Link href="#demo" className="w-full sm:w-auto px-8 py-3.5 text-base font-bold rounded-xl text-slate-700 bg-white/80 backdrop-blur-md border border-slate-200 hover:bg-white hover:border-slate-300 transition-all duration-300 shadow-sm">
                See Demo
              </Link>
            </div>

            {/* Dashboard Mockup - Centered & Clean */}
            {/* <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-white/40 bg-white/50 backdrop-blur-sm p-2">
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-inner bg-white">
                <img src="/images/dashboard-mockup.jpg" alt="Dashboard Preview" className="w-full h-auto object-cover" />
              </div>
              <div className="absolute top-10 -right-4 md:right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-100 flex items-center gap-4 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl shadow-inner">✨</div>
                <div className="text-left pr-2">
                  <p className="font-bold text-slate-900 text-sm">New Lead Captured!</p>
                  <p className="text-xs text-slate-500 font-medium">John Doe requested a demo.</p>
                </div>
              </div>
            </div> */}

          </div>
        </section>

        {/* =========================================
            2. WHAT IS HEYAIBOT? (Grid Pattern Background)
        ========================================== */}
        <section className="py-24 relative border-t border-slate-100 bg-white">
          {/* Engineering Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:2rem_2rem]"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl font-black text-slate-900 sm:text-4xl mb-6 bg-white px-4 inline-block">What is HeyAiBot?</h2>
              <p className="text-lg text-slate-600 leading-relaxed font-medium bg-white/80 backdrop-blur-sm inline-block px-4 py-2 rounded-xl">
                HeyAiBot is a smart, business-trained AI chatbot for lead generation designed specifically for websites, SaaS platforms, and service businesses.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Card 1 */}
              <div className="bg-white/90 backdrop-blur-md p-10 rounded-3xl border border-slate-200/80 shadow-xl shadow-slate-200/40 transition-transform hover:-translate-y-1 duration-300">
                <div className="w-12 h-12 bg-slate-100 text-slate-700 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-sm border border-slate-200">🛡️</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-4">Safe, Business-Controlled AI</h3>
                <p className="text-slate-600 font-medium mb-8">
                  Unlike generic AI tools that give random or inaccurate answers, HeyAiBot responds only based on the information you provide. That means:
                </p>
                <ul className="space-y-4 font-bold text-slate-700">
                  <li className="flex items-center"><CheckIcon /> Accurate responses</li>
                  <li className="flex items-center"><CheckIcon /> No hallucinations</li>
                  <li className="flex items-center"><CheckIcon /> No misleading promises</li>
                  <li className="flex items-center"><CheckIcon /> Full control from your dashboard</li>
                </ul>
              </div>

              {/* Card 2 */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-10 rounded-3xl border border-indigo-100 shadow-xl shadow-indigo-100/50 transition-transform hover:-translate-y-1 duration-300 relative overflow-hidden">
                <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-400 rounded-full blur-[60px] opacity-20"></div>
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center text-2xl mb-6 shadow-md shadow-indigo-200 relative z-10">🤖</div>
                <h3 className="text-2xl font-bold text-indigo-950 mb-4 relative z-10">Your Full-Time Assistant</h3>
                <p className="text-indigo-800/80 font-medium mb-8 relative z-10">
                  Once you configure your services and products, the chatbot works like a real support and sales assistant. It can:
                </p>
                <ul className="space-y-4 font-bold text-indigo-950 relative z-10">
                  <li className="flex items-center"><CheckIcon /> Answer customer questions instantly</li>
                  <li className="flex items-center"><CheckIcon /> Guide visitors to the right service/product</li>
                  <li className="flex items-center"><CheckIcon /> Capture name, email, and contact details</li>
                  <li className="flex items-center"><CheckIcon /> Offer WhatsApp or demo booking</li>
                  <li className="flex items-center"><CheckIcon /> Work 24/7 without human staff</li>
                  <li className="flex items-center text-indigo-600"><CheckIcon /> Never miss a potential lead</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================
            3. HOW HEYAIBOT WORKS (Dark Radial Glow)
        ========================================== */}
        <section id="how-it-works" className="py-24 relative bg-slate-950 text-white overflow-hidden">
          {/* Deep Space Radial Gradient Background */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <span className="text-indigo-400 font-bold tracking-widest uppercase mb-4 block text-sm px-4 py-1.5 border border-indigo-500/20 bg-indigo-500/10 rounded-full inline-block backdrop-blur-sm">Simple Setup – No Coding Required</span>
              <h2 className="text-3xl font-black sm:text-4xl mb-6">How HeyAiBot Works</h2>
              <p className="text-lg text-slate-400 font-medium">Setting up your website chatbot for lead capture takes just a few minutes.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { step: "01", title: "Add Categories", desc: "Define your business areas to tell the chatbot what topics it should handle.", items: ["Software Services", "Products", "Support", "Pricing"] },
                { step: "02", title: "Add Offerings", desc: "Explain what you offer. The AI learns your services and answers visitors accurately.", items: ["Web Development", "SEO Services", "SaaS Solutions"] },
                { step: "03", title: "Action Flow", desc: "Decide what happens when a visitor shows interest to turn them into a lead.", items: ["Ask for Name & Email", "Offer WhatsApp Contact", "Book a Demo"] },
                { step: "04", title: "Launch", desc: "Test everything instantly. If it looks good — click publish. Your 24/7 bot is live.", items: ["Live on Website instantly", "No coding needed"] },
              ].map((item, i) => (
                <div key={i} className="bg-slate-900/80 backdrop-blur-md p-8 rounded-3xl border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all duration-300 relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl opacity-0 group-hover:opacity-10 transition duration-500 blur-sm"></div>
                  <div className="text-6xl font-black text-slate-800 mb-6 group-hover:text-indigo-900/50 transition-colors">{item.step}</div>
                  <h4 className="text-xl font-bold mb-3 text-slate-100">{item.title}</h4>
                  <p className="text-sm text-slate-400 font-medium mb-6">{item.desc}</p>
                  <ul className="space-y-2 text-sm font-bold text-slate-300">
                    {item.items.map((li, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-indigo-500 mt-0.5">&rarr;</span> {li}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* =========================================
            4. BUSINESS GROWTH BENEFITS
        ========================================== */}
        <section className="py-24 relative bg-slate-50 border-b border-slate-200">
          
          {/* Subtle Diagonal Stripe Background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IiNFMkU4RjAiLz48L3N2Zz4=')] opacity-60"></div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid lg:grid-cols-2 gap-10">
              
              {/* Always Available */}
              <div className="p-10 rounded-3xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-slate-100 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">⏰</div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">Always Available — Even When You’re Offline</h3>
                <p className="text-slate-600 font-medium leading-relaxed mb-6">
                  Visitors don’t wait for office hours. HeyAiBot works exactly when you can't:
                </p>
                <div className="flex flex-wrap gap-3 mb-8">
                  <span className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-sm shadow-sm">🌙 Nights</span>
                  <span className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-sm shadow-sm">🎉 Weekends</span>
                  <span className="bg-white px-5 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-800 text-sm shadow-sm">🏖️ Holidays</span>
                </div>
                <div className="bg-indigo-50/80 backdrop-blur-sm p-6 rounded-2xl border border-indigo-100 shadow-inner">
                    <p className="text-indigo-900 font-bold text-sm leading-relaxed">
                    Every visitor gets instant attention. No delays. No missed inquiries. No lost opportunities. Your business keeps generating leads — even when your team is not online.
                    </p>
                </div>
              </div>

              {/* Built for Growth */}
              <div className="p-10 rounded-3xl bg-white/80 backdrop-blur-sm border border-slate-200 shadow-xl shadow-slate-200/50 hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden">
                <div className="absolute -left-20 -top-20 w-64 h-64 bg-purple-50 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="w-14 h-14 bg-purple-50 border border-purple-100 text-purple-600 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-sm">🚀</div>
                <h3 className="text-3xl font-black text-slate-900 mb-4">Built for Business Growth</h3>
                <p className="text-slate-600 font-medium leading-relaxed mb-8">
                  HeyAiBot is more than just a chatbot. It’s a business-aware AI sales assistant built to increase conversions and reduce workload.
                </p>
                <ul className="space-y-5 text-slate-800 font-bold">
                  <li className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><span className="text-2xl bg-slate-50 p-2 rounded-lg">💼</span> Convert visitors into paying customers</li>
                  <li className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><span className="text-2xl bg-slate-50 p-2 rounded-lg">📊</span> Capture high-intent leads automatically</li>
                  <li className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><span className="text-2xl bg-slate-50 p-2 rounded-lg">🧠</span> Provide consistent, accurate responses</li>
                  <li className="flex items-center gap-4 bg-white p-3 rounded-xl border border-slate-100 shadow-sm"><span className="text-2xl bg-slate-50 p-2 rounded-lg">📈</span> Scale without hiring more staff</li>
                </ul>
              </div>

            </div>
          </div>
        </section>

        {/* =========================================
            5. WHO IS HEYAIBOT FOR? (Text Pills)
        ========================================== */}
        <section className="py-24 bg-white relative">
          <div className="max-w-5xl mx-auto px-4 text-center">
            
            <h2 className="text-3xl font-black text-slate-900 sm:text-4xl mb-6">Who Is HeyAiBot For?</h2>
            <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-12 font-medium">
              If your business has a website and you want more leads — HeyAiBot is built for you.
            </p>
            
            {/* Clean Floating Pill Grid */}
            <div className="flex flex-wrap justify-center gap-4">
              {[
                'Digital Agencies', 
                'SaaS Companies', 
                'Service Businesses', 
                'Startups', 
                'E-commerce Stores', 
                'Consultants', 
                'Online Coaches'
              ].map(role => (
                <div 
                  key={role} 
                  className="px-8 py-4 bg-white border-2 border-slate-100 rounded-full shadow-[0_4px_20px_rgb(0,0,0,0.03)] text-slate-700 font-extrabold text-base hover:-translate-y-1 hover:border-indigo-200 hover:shadow-indigo-100 hover:text-indigo-700 transition-all duration-300 cursor-default"
                >
                  {role}
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* =========================================
            6. WHY CHOOSE HEYAIBOT?
        ========================================== */}
        <section className="py-24 bg-slate-50 border-y border-slate-100">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-black text-slate-900 mb-6">Why Choose HeyAiBot Over Generic Chatbots?</h2>
            <p className="text-lg text-slate-500 font-medium mb-12 max-w-2xl mx-auto">
              Most chatbots only answer questions. HeyAiBot is designed specifically for conversion and lead generation. It combines:
            </p>
            
            <div className="flex flex-wrap justify-center gap-3 mb-16">
              {[
                  "Business-specific AI responses",
                  "Smart action triggers",
                  "Automatic lead capture",
                  "Easy integration",
                  "24/7 automation"
              ].map((feature, idx) => (
                  <span key={idx} className="px-5 py-2.5 bg-white border border-slate-200 shadow-sm rounded-xl font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="text-indigo-600">✔</span> {feature}
                  </span>
              ))}
            </div>
            
            <div className="inline-block px-10 py-5 bg-indigo-600 rounded-3xl shadow-xl shadow-indigo-600/30">
                <p className="text-2xl font-black tracking-tight text-white">
                    It doesn’t just chat. <span className="text-indigo-200">It converts.</span>
                </p>
            </div>
          </div>
        </section>

        {/* =========================================
            7. FINAL CTA
        ========================================== */}
        <section className="relative py-28 bg-slate-900 text-center px-4 overflow-hidden">
          {/* Background Glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600 rounded-full blur-[150px] opacity-30 pointer-events-none"></div>

          <div className="max-w-3xl mx-auto relative z-10">
            <h2 className="text-3xl font-black text-white sm:text-5xl mb-6 tracking-tight drop-shadow-lg">
              Don’t Let Visitors Leave <br className="hidden sm:block"/> Without Talking to You
            </h2>
            <p className="text-lg text-indigo-100/80 mb-10 font-medium leading-relaxed max-w-2xl mx-auto">
              You are already spending money on ads, SEO, and marketing. Now make sure every visitor gets guided properly. Activate your AI assistant in minutes and start converting more website traffic into real business leads.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-5">
              <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 bg-white text-indigo-900 font-black rounded-xl text-lg hover:bg-slate-100 shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 transition-all duration-300">
                Start Free Setup &rarr;
              </Link>
              <Link href="/register" className="inline-flex items-center justify-center px-8 py-4 border-2 border-slate-700 text-white font-bold rounded-xl text-lg hover:bg-slate-800 transition-all duration-300">
                Launch Your Bot Today
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}