import React from 'react';
import Navbar from '../app/Navbar';
import Footer from '../app/Footer';
import Link from 'next/link';

// --- Premium Icons ---
const ClockIcon = () => <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const MagnetIcon = () => <svg className="h-8 w-8 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14 10l-2 1m0 0l-2-1m2 1v2.5M20 7l-2 1m2-1l-2-1m2 1v2.5M14 4l-2-1-2 1M4 7l2-1M4 7l2 1M4 7v2.5M12 21l-2-1m2 1l2-1m-2 1v-2.5M6 18l-2-1v-2.5M18 18l2-1v-2.5" /></svg>;
const ChatIcon = () => <svg className="h-8 w-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>;
const ServerIcon = () => <svg className="h-8 w-8 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" /></svg>;
const LinkIcon = () => <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
const ChartIcon = () => <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>;
const PaletteIcon = () => <svg className="h-8 w-8 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>;
const RocketIcon = () => <svg className="h-8 w-8 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;

const MiniCheck = () => <svg className="w-4 h-4 text-emerald-500 mt-1 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>;
const TableCheck = () => <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-1 rounded font-bold text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg> Yes</span>;
const TableCross = () => <span className="inline-flex items-center gap-1 text-rose-700 bg-rose-100 px-2 py-1 rounded font-bold text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" /></svg> No</span>;
const TableWarn = () => <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-100 px-2 py-1 rounded font-bold text-xs"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg> Limited</span>;

export default function Features() {
  const features = [
    { title: "24/7 Automated Support", desc: "Instant replies anytime, anywhere.", points: ["Real-time responses", "Handles FAQs & inquiries", "Reduces wait time", "Improves user experience"], icon: <ClockIcon />, bg: "bg-indigo-50", border: "border-indigo-100" },
    { title: "Smart Lead Generation", desc: "Turn visitors into qualified leads automatically.", points: ["Collects name, email, phone", "Captures requirements", "AI-based lead qualification", "Direct CRM sync"], icon: <MagnetIcon />, bg: "bg-pink-50", border: "border-pink-100" },
    { title: "AI-Powered Conversations", desc: "Human-like, intelligent interactions.", points: ["Context-based replies", "Multi-step conversations", "Personalized responses", "Reduces bounce rate"], icon: <ChatIcon />, bg: "bg-amber-50", border: "border-amber-100" },
    { title: "High Traffic Handling", desc: "Built for scale and performance.", points: ["100+ users simultaneously", "No performance drop", "Ideal for ads traffic", "Smooth customer experience"], icon: <ServerIcon />, bg: "bg-emerald-50", border: "border-emerald-100" },
    { title: "CRM & Integration", desc: "Connect with your business tools easily.", points: ["WordPress & Shopify support", "CRM automation", "Email marketing sync", "WhatsApp integration"], icon: <LinkIcon />, bg: "bg-blue-50", border: "border-blue-100" },
    { title: "Advanced Analytics", desc: "Track performance in real-time.", points: ["Chat reports", "Lead tracking", "Behavior insights", "Conversion data"], icon: <ChartIcon />, bg: "bg-purple-50", border: "border-purple-100" },
    { title: "Custom Branding", desc: "Match your brand identity.", points: ["Custom colors & themes", "Logo integration", "Welcome messages", "Fully customizable widget"], icon: <PaletteIcon />, bg: "bg-rose-50", border: "border-rose-100" },
    { title: "Growth Automation", desc: "Scale smarter, not harder.", points: ["Reduce support cost", "Automate repetitive tasks", "Faster response time", "Higher conversions"], icon: <RocketIcon />, bg: "bg-teal-50", border: "border-teal-100" },
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative py-24 bg-gradient-to-b from-slate-900 to-indigo-950 text-white overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-10"></div>
          <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10 text-center">
            <h2 className="text-indigo-400 font-bold tracking-widest uppercase mb-4">AI Chatbot for Website</h2>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">Powerful Features to <br className="hidden md:block" /> Grow Your Business</h1>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto font-light leading-relaxed">
              In the current competitive digital environment, businesses require immediate engagement, automated lead generation, and round-the-clock customer service. This intelligent automation tool converts website visitors into qualified leads and enhances customer satisfaction.
            </p>
          </div>
        </section>

        {/* Core Features Grid */}
        <section className="py-24 bg-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">Core Features of Our AI Chatbot</h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div key={idx} className={`p-8 rounded-3xl border ${feature.border} ${feature.bg} bg-opacity-40 hover:bg-opacity-100 transition-all duration-300 shadow-sm hover:shadow-lg flex flex-col`}>
                  <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center mb-6">
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
                  <p className="text-slate-600 text-sm font-medium mb-6 pb-6 border-b border-slate-200/60 flex-1">
                    {feature.desc}
                  </p>
                  <ul className="space-y-3">
                    {feature.points.map((point, i) => (
                      <li key={i} className="flex items-start text-sm text-slate-700 font-medium">
                        <MiniCheck /> {point}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="py-24 bg-slate-50 border-t border-slate-200">
          <div className="max-w-6xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl mb-4">Comparison: AI Chatbot vs Human Support</h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">Choosing between an AI Chatbot and Human Support is critical for business growth. Below is a detailed comparison to help you decide.</p>
            </div>
            
            <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                      <thead>
                          <tr className="bg-slate-900 text-white">
                              <th className="px-8 py-6 text-sm font-bold uppercase tracking-wider w-1/4">Feature</th>
                              <th className="px-8 py-6 text-sm font-bold uppercase tracking-wider bg-indigo-600 w-2/5">AI Chatbot for Website</th>
                              <th className="px-8 py-6 text-sm font-bold uppercase tracking-wider bg-slate-800 text-slate-300 w-2/5">Human Support Team</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                          <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-900">24/7 Availability</td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-700"><TableCheck /> Operates 24/7 without breaks or holidays</td>
                              <td className="px-8 py-5 text-sm text-slate-500"><TableCross /> Limited to office hours</td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-900">Response Time</td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-700"><TableCheck /> Instant replies within seconds</td>
                              <td className="px-8 py-5 text-sm text-slate-500"><TableCross /> May delay during peak hours</td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-900">Cost Efficiency</td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-700"><TableCheck /> Fixed cost, no salary or HR expense</td>
                              <td className="px-8 py-5 text-sm text-slate-500"><TableCross /> Salaries, training & overhead costs</td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-900">Lead Automation</td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-700"><TableCheck /> Automatic data capture & CRM sync</td>
                              <td className="px-8 py-5 text-sm text-slate-500"><TableCross /> Manual lead collection</td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-900">Scalability</td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-700"><TableCheck /> Easily scalable during high traffic</td>
                              <td className="px-8 py-5 text-sm text-slate-500"><TableCross /> Requires hiring more staff</td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-900">Handles Multiple Users</td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-700"><TableCheck /> Unlimited simultaneous conversations</td>
                              <td className="px-8 py-5 text-sm text-slate-500"><TableCross /> Limited per agent</td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-900">Accuracy & Consistency</td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-700"><TableCheck /> Structured, consistent answers</td>
                              <td className="px-8 py-5 text-sm text-slate-500"><TableCross /> Human error possible</td>
                          </tr>
                          <tr className="hover:bg-slate-50 transition-colors">
                              <td className="px-8 py-5 text-sm font-bold text-slate-900">Emotional Intelligence</td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-700"><TableWarn /> Handles structured queries well</td>
                              <td className="px-8 py-5 text-sm text-slate-500"><TableCheck /> Strong emotional understanding</td>
                          </tr>
                          <tr className="bg-indigo-50/50">
                              <td className="px-8 py-5 text-sm font-bold text-indigo-900">Best For</td>
                              <td className="px-8 py-5 text-sm font-bold text-indigo-700">Lead generation, automation, FAQs, and bookings</td>
                              <td className="px-8 py-5 text-sm font-medium text-slate-600">Complex, sensitive conversations</td>
                          </tr>
                      </tbody>
                  </table>
                </div>
            </div>
          </div>
        </section>

        {/* Benefits & CTA */}
        <section className="bg-indigo-600 py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="max-w-5xl mx-auto px-6 relative z-10 text-center text-white">
              <h2 className="text-4xl font-extrabold mb-8">Which is Better for Business Growth?</h2>
              
              <div className="grid sm:grid-cols-2 md:grid-cols-5 gap-4 mb-12 text-sm font-bold">
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">Increase Engagement</div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">Capture Leads Automatically</div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">Reduce Support Cost</div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">Scale Without Hiring</div>
                <div className="bg-white/10 backdrop-blur rounded-xl p-4 border border-white/20">Improve Response Speed</div>
              </div>

              <p className="text-indigo-100 text-xl mb-6 max-w-3xl mx-auto leading-relaxed">
                If your goal is any of the above, <strong>AI Chatbot for Website</strong> is the smarter, scalable, and cost-effective solution. 
                However, combining AI Chatbot with Human Support creates a powerful hybrid system for maximum efficiency and customer satisfaction.
              </p>
              
              <p className="text-white text-lg font-bold mb-10">
                Implementing an AI chatbot on your website is no longer optional — it’s a strategic growth decision.
              </p>

              <Link href="/register" className="inline-block px-10 py-4 bg-white text-indigo-900 font-extrabold rounded-full text-lg hover:bg-slate-100 shadow-2xl hover:scale-105 transition-all duration-300">
                  Build Your Free Bot Now
              </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}