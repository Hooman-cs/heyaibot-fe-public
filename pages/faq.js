import React from 'react';
import Navbar from '../app/Navbar';
import Footer from '../app/Footer';
import Link from 'next/link';

export default function FAQ() {
  const generalFaqs = [
    { 
      q: "What exactly is HeyAiBot?", 
      a: "HeyAiBot is an intelligent chatbot widget you add to your website. Unlike standard support chats that require a human, HeyAiBot uses AI to answer questions, explain your products, and collect leads automatically, 24/7." 
    },
    { 
      q: "Will the AI make up false information?", 
      a: "No. This is our key feature. HeyAiBot is a 'Closed Domain' AI. It is strictly trained only on the business data, services, and pricing you provide in the dashboard. If it doesn't know an answer, it will ask for the user's contact info instead of guessing." 
    },
    { 
      q: "How does the Lead Generation work?", 
      a: "When a visitor asks about pricing or services, the bot can intelligently ask for their name and email before providing details, or offer to book a demo. These leads are saved instantly in your dashboard." 
    },
  ];

  const technicalFaqs = [
    { 
      q: "Do I need coding skills to install it?", 
      a: "Absolutely not. When you create your bot, we give you a small snippet of code (like Google Analytics). You just copy and paste it into your website's header or footer, and the chat widget appears instantly." 
    },
    { 
      q: "Does it work on WordPress / Shopify / Wix?", 
      a: "Yes! HeyAiBot works on ANY website platform that allows you to add custom JavaScript. This includes WordPress, Shopify, Wix, Squarespace, Webflow, React, and custom HTML sites." 
    },
    { 
      q: "Can I customize the look?", 
      a: "Yes. You can customize the chatbot's avatar, brand name, welcome message, and accent colors to perfectly match your website's design." 
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-2xl mx-auto">
            Have questions? We have answers. If you can't find what you're looking for, feel free to contact our support team.
          </p>
        </div>
      </div>

      {/* FAQ Sections */}
      <div className="mx-auto max-w-4xl px-6 py-12 lg:px-8 space-y-16">
        
        {/* Section 1: General */}
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-2">General Questions</h2>
            <div className="space-y-8">
                {generalFaqs.map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold leading-7 text-gray-900 mb-2">{faq.q}</h3>
                    <p className="text-base leading-7 text-gray-600">{faq.a}</p>
                </div>
                ))}
            </div>
        </section>

        {/* Section 2: Technical & Setup */}
        <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-8 border-b pb-2">Setup & Technical</h2>
            <div className="space-y-8">
                {technicalFaqs.map((faq, index) => (
                <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-lg font-semibold leading-7 text-gray-900 mb-2">{faq.q}</h3>
                    <p className="text-base leading-7 text-gray-600">{faq.a}</p>
                </div>
                ))}
            </div>
        </section>

      </div>

      {/* Still have questions banner */}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
            <div className="bg-blue-600 rounded-2xl p-10 sm:p-16 text-center">
                <h2 className="text-3xl font-bold text-white mb-4">Still have questions?</h2>
                <p className="text-blue-100 text-lg mb-8">We are happy to help you get started with your AI automation journey.</p>
                <Link href="/contact" className="inline-block bg-white text-blue-600 font-bold py-3 px-8 rounded-lg hover:bg-gray-100 transition-colors">
                    Contact Support
                </Link>
            </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}