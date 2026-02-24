import React from 'react';
import Navbar from '../app/Navbar';
import Footer from '../app/Footer';
import Link from 'next/link';

// --- Icons ---
const IconBrain = () => (
  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);
const IconChat = () => (
  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);
const IconRocket = () => (
  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);
const IconShield = () => (
  <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

export default function Features() {
  const features = [
    {
      title: "Zero Hallucinations",
      desc: "Unlike generic AI, HeyAiBot only answers based on the specific data you provide. It never invents facts, ensuring your brand reputation is safe.",
      icon: <IconShield />,
      color: "bg-blue-600"
    },
    {
      title: "Smart Action Triggers",
      desc: "Don't just chat—convert. Automatically guide users to book a demo, open WhatsApp, or visit a checkout page when they show interest.",
      icon: <IconRocket />,
      color: "bg-purple-600"
    },
    {
      title: "Automated Lead Capture",
      desc: "The bot naturally asks for names, emails, and phone numbers during conversations, sending qualified leads directly to your dashboard.",
      icon: <IconChat />,
      color: "bg-teal-600"
    },
    {
      title: "Business Logic Training",
      desc: "Train the AI on your specific services, pricing, and support policies. It acts like your best employee who knows everything about your company.",
      icon: <IconBrain />,
      color: "bg-indigo-600"
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Hero Section */}
      <div className="relative bg-white py-20 lg:py-28 overflow-hidden">
         <div className="absolute inset-0 opacity-30 pointer-events-none">
             <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-100 rounded-full blur-3xl"></div>
             <div className="absolute top-1/2 left-0 w-72 h-72 bg-purple-50 rounded-full blur-3xl"></div>
         </div>
         
        <div className="relative max-w-7xl mx-auto px-6 lg:px-8 text-center">
          <h2 className="text-base font-bold tracking-wide text-blue-600 uppercase">
            Powerful Capabilities
          </h2>
          <p className="mt-2 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Everything You Need to <br/> Automate & Grow
          </p>
          <p className="mt-6 text-xl text-gray-600 max-w-2xl mx-auto">
            HeyAiBot isn't just a chatbot. It's a conversion engine designed to replace static forms and slow support tickets.
          </p>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:gap-12">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                <div className={`inline-flex items-center justify-center p-3 rounded-xl shadow-lg ${feature.color} mb-6`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Additional "Table" or Comparison Section */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900">Why Use HeyAiBot?</h2>
                <p className="mt-4 text-gray-600">See the difference between traditional support and AI automation.</p>
            </div>
            
            <div className="overflow-hidden border border-gray-200 rounded-2xl shadow-sm">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">Feature</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-500 uppercase">Live Agent</th>
                            <th className="px-6 py-4 text-left text-sm font-bold text-blue-600 uppercase">HeyAiBot</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Availability</td>
                            <td className="px-6 py-4 text-sm text-gray-500">8-10 Hours / Day</td>
                            <td className="px-6 py-4 text-sm font-bold text-green-600">24/7/365</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Response Time</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Minutes to Hours</td>
                            <td className="px-6 py-4 text-sm font-bold text-green-600">Instant (0s)</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Cost</td>
                            <td className="px-6 py-4 text-sm text-gray-500">High Salary</td>
                            <td className="px-6 py-4 text-sm font-bold text-green-600">Fraction of cost</td>
                        </tr>
                        <tr>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">Consistency</td>
                            <td className="px-6 py-4 text-sm text-gray-500">Varies by mood</td>
                            <td className="px-6 py-4 text-sm font-bold text-green-600">100% Accurate</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Ready to upgrade your website?</h2>
            <Link href="/register" className="inline-block px-8 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors">
                Get Started Free
            </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}