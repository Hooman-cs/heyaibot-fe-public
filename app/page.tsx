"use client";

import React from "react";
import Link from "next/link";
import Script from "next/script";
import Navbar from '../app/Navbar'; // Import added
import Footer from '../app/Footer';

const ChatPage = () => {
  return (
    <>
      <Navbar />
      <div className="bg-white">
        <section className="relative overflow-hidden bg-gray-50 py-20 sm:py-32">
          <div className="max-w-7xl mx-auto px-4 text-center">
            <h1 className="text-4xl font-extrabold sm:text-6xl mb-6">
              AI Chatbot That Understands <br />
              <span className="text-blue-600">Your Business</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto">
              Configure your categories, services, and products once.
              HeyAiBot responds accurately, triggers actions, and captures leads 24×7.
            </p>
            <div className="mt-10 flex justify-center gap-6">
              <Link href="/pricing" className="bg-blue-600 px-6 py-3 text-white rounded-md">
                Start Free Trial
              </Link>
              <Link href="/features" className="font-semibold">
                View Features →
              </Link>
            </div>
          </div>
        </section>

        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl mb-4">⚡</div>
              <h3 className="text-xl font-bold">Easy Setup</h3>
              <p className="text-gray-600">Copy & paste one line of code.</p>
            </div>
            <div>
              <div className="text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold">Zero Hallucinations</h3>
              <p className="text-gray-600">Responds only from your data.</p>
            </div>
            <div>
              <div className="text-4xl mb-4">📈</div>
              <h3 className="text-xl font-bold">Lead Capture</h3>
              <p className="text-gray-600">Automatically collects leads.</p>
            </div>
          </div>
        </section>
      </div>
 <Footer />
      <Script
        src="https://www.heyaibot.com/widget.js"
        data-app-id="b9808aa0-863a-47be-8824-b3b7b37a09ce"
        strategy="afterInteractive"
      />
    </>
  );
};

export default ChatPage;
