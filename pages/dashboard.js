"use client";
import { useSession, signOut } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();

  return (
    <div className="max-w-4xl mx-auto">
      {/* <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome, {session?.user?.name}</h1>
      <p className="text-gray-600 mb-8">Manage your subscription and access your chatbot studio.</p> */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {session?.user?.name}</h1>
          <p className="text-gray-600">Manage your subscription and access your chatbot studio.</p>
        </div>
        <button 
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-red-600 hover:text-red-800 font-medium text-sm border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
        >
          Sign Out
        </button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Card 1: Current Plan */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Plan</h2>
          <div className="text-3xl font-bold text-blue-600 capitalize mb-4">
            {session?.user?.plan || "starter"}
          </div>
          <p className="text-gray-500 mb-6">
            You are currently on the {session?.user?.plan || "starter"} tier.
          </p>
          <a href="/pricing" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
            Upgrade Plan &rarr;
          </a>
        </div>

        {/* Card 2: Launch Studio */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <div className="bg-blue-50 p-4 rounded-full mb-4">
            <span className="text-4xl">🤖</span>
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Chatbot Studio</h2>
          <p className="text-gray-500 mb-6 text-sm">
            Configure your bots, upload knowledge, and view chat logs.
          </p>
          {/* Replace this URL with your actual Chatbot App URL */}
          {/* <a 
            href="https://dashboard.heyaibot.com" 
            target="_blank" 
            className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all"
          >
            Launch Studio &rarr;
          </a> */}
          <a 
            href="/api/launch-studio" 
            target="_self" 
            className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all"
          >
            Launch Studio &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}