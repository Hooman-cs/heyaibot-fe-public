import React, { useState } from 'react';
import Navbar from '../app/Navbar';
import Footer from '../app/Footer';
import Link from 'next/link';

const AccordionItem = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className={`border border-slate-200 rounded-2xl mb-4 overflow-hidden transition-all duration-300 ${isOpen ? 'bg-indigo-50 border-indigo-200 shadow-md' : 'bg-white hover:border-indigo-300 hover:shadow-sm'}`}>
      <button 
        className="w-full text-left px-6 py-5 flex justify-between items-center focus:outline-none"
        onClick={onClick}
      >
        <span className={`font-bold text-lg pr-4 ${isOpen ? 'text-indigo-900' : 'text-slate-800'}`}>
          {question}
        </span>
        <span className={`transform transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : 'text-slate-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>
      <div 
        className={`transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <div className="px-6 pb-6 text-slate-600 leading-relaxed font-medium">
          {answer}
        </div>
      </div>
    </div>
  );
};

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(0); // First one open by default

  const faqs = [
    { 
      q: "1. What is an AI chatbot for a website?", 
      a: "An AI chatbot for a website is an automated virtual assistant powered by artificial intelligence that interacts with visitors in real time. It answers questions, captures leads, provides customer support, and helps guide users through your sales funnel 24/7 without human intervention." 
    },
    { 
      q: "2. How does an AI chatbot help with lead generation?", 
      a: "An AI chatbot for lead generation automatically engages visitors, collects contact details, qualifies prospects, schedules appointments, and integrates with your CRM. This improves conversion rates and ensures you never miss potential customers." 
    },
    { 
      q: "3. Can an AI chatbot replace human customer support?", 
      a: "An AI chatbot can handle repetitive queries, FAQs, and basic support tasks efficiently. However, the best solution is a hybrid system that combines AI chatbot automation with live human support for complex or sensitive cases." 
    },
    { 
      q: "4. Is AI chatbot integration difficult for my website?", 
      a: "No, professional AI chatbot development services offer easy website integration. The chatbot can be added to WordPress, Shopify, custom websites, or landing pages with minimal technical effort." 
    },
    { 
      q: "5. Does an AI chatbot work 24/7?", 
      a: "Yes. One of the biggest benefits of an AI customer support chatbot is 24/7 availability. It responds instantly to customer queries anytime, improving engagement and reducing response time." 
    },
    { 
      q: "6. How much does an AI chatbot service cost?", 
      a: "AI chatbot pricing depends on features such as automation level, CRM integration, multilingual support, and customization. Compared to hiring a full support team, AI chatbot solutions are highly cost-effective and scalable." 
    },
    { 
      q: "7. Can AI chatbots improve website conversion rates?", 
      a: "Yes. An AI chatbot improves website conversion rates by engaging visitors instantly, answering objections, recommending products or services, and guiding users toward taking action like booking, purchasing, or submitting inquiries." 
    },
    { 
      q: "8. Is AI chatbot automation secure for business use?", 
      a: "Professional AI chatbot services follow secure data handling practices, encryption standards, and privacy compliance to protect customer information. Always choose a trusted AI chatbot provider for secure implementation." 
    },
  ];

  const handleToggle = (index) => {
    setOpenIndex(openIndex === index ? -1 : index);
  };

  return (
    <div className="flex flex-col min-h-screen font-sans bg-slate-50">
      <Navbar />
      
      <main className="flex-grow">
        
        {/* Header Section */}
        <section className="bg-white border-b border-slate-200 py-20 text-center">
            <div className="max-w-3xl mx-auto px-6">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
                    Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Questions</span>
                </h1>
                <p className="text-xl text-slate-500 font-light">
                    Everything you need to know about setting up and scaling your business with HeyAiBot.
                </p>
            </div>
        </section>

        {/* FAQ Accordion Section */}
        <section className="py-20">
            <div className="max-w-4xl mx-auto px-6 lg:px-8">
                <div className="bg-white p-8 md:p-12 rounded-3xl shadow-xl border border-slate-100">
                    {faqs.map((faq, index) => (
                        <AccordionItem 
                            key={index}
                            question={faq.q}
                            answer={faq.a}
                            isOpen={openIndex === index}
                            onClick={() => handleToggle(index)}
                        />
                    ))}
                </div>
            </div>
        </section>

        {/* Support CTA Banner */}
        <section className="py-16 bg-slate-50">
          <div className="max-w-5xl mx-auto px-6 lg:px-8">
              <div className="bg-indigo-900 rounded-3xl p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl">
                  {/* Decorative blur */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/2"></div>
                  
                  <div className="relative z-10">
                      <h2 className="text-3xl font-extrabold text-white mb-4 tracking-tight">Still have questions?</h2>
                      <p className="text-indigo-200 text-lg mb-8 max-w-2xl mx-auto">
                          Our team is happy to help you get started with your AI automation journey. Let's build something great together.
                      </p>
                      <Link href="/contact" className="inline-block px-8 py-4 bg-white text-indigo-900 font-bold rounded-xl shadow-lg hover:bg-slate-100 hover:-translate-y-1 transition-all duration-300">
                          Contact Support &rarr;
                      </Link>
                  </div>
              </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}