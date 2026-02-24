import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import Image from "next/image"; 
import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subStatus, setSubStatus] = useState("Loading...");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetch("/api/user/subscription")
        .then(res => res.json())
        .then(data => {
          if (data.subscription) {
            setSubStatus(data.subscription.status);
          } else {
            setSubStatus("No Active Subscription");
          }
        })
        .catch(() => setSubStatus("Error fetching status"));
    }
  }, [status, router]);

  if (status === "loading") return <div className="p-10">Loading...</div>;
  if (!session) return null;

  const isAdmin = session?.user?.isSuperAdmin === true;

  let statusColor = "text-gray-600";
  if (subStatus === "Active") statusColor = "text-green-600";
  else if (subStatus === "Action Required") statusColor = "text-yellow-600";
  else if (subStatus === "Expired" || subStatus === "No Active Subscription") statusColor = "text-red-600";

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Bar with Larger Logo */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="HeyAiBot Logo" 
              width={48} 
              height={48} 
              className="w-12 h-12 object-contain" /* Increased Size */
            />
            <span className="font-bold text-2xl text-blue-600 tracking-tight">HeyAiBot</span>
          </Link>
          
          <button 
            onClick={() => signOut({ callbackUrl: '/' })}
            className="text-red-600 hover:text-red-800 font-medium text-sm border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-all"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto py-10 px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {session?.user?.name}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? "Super Admin Access Enabled" : "Manage your subscription and access your chatbot studio."}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Card 1: Current Plan Info */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Plan</h2>
            <div className="text-3xl font-bold text-blue-600 capitalize mb-4">
              {session?.user?.planName || "Free Plan"}
            </div>
            <p className="text-gray-700 mb-6 text-sm font-medium">
              Status: <span className={`${statusColor} font-bold`}>{subStatus}</span>
            </p>
            <Link href="/pricing" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
              Upgrade / Renew Plan &rarr;
            </Link>
          </div>

          {/* Card 2: Studio Launch */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
            <div className="p-4 bg-blue-50 rounded-full mb-4">
              <span className="text-4xl">🤖</span>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Chatbot Studio</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Configure your bots, upload knowledge, and view chat logs.
            </p>
            <a 
              href="/api/launch-studio" 
              target="_self" 
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all text-white ${
                isAdmin ? 'bg-purple-700 hover:bg-purple-800' : 'bg-gray-900 hover:bg-gray-800'
              }`}
            >
              Launch Studio &rarr;
            </a>
          </div>

          {/* Card 3: SUPER ADMIN CONTROLS */}
          {isAdmin && (
            <div className="bg-purple-50 p-6 rounded-xl shadow-sm border border-purple-200">
              <div className="flex items-center gap-2 mb-4">
                 <span className="text-2xl">⚙️</span>
                 <h2 className="text-lg font-semibold text-purple-900">Admin Controls</h2>
              </div>
              <div className="space-y-3">
                <Link href="/admin-plans" className="block w-full text-left bg-white p-3 rounded shadow-sm hover:shadow transition text-gray-700 font-medium border border-purple-100">
                  📝 Manage Plans
                </Link>
                <Link href="/subscription-history" className="block w-full text-left bg-white p-3 rounded shadow-sm hover:shadow transition text-gray-700 font-medium border border-purple-100">
                  💰 View Revenue & History
                </Link>
              </div>
            </div>
          )}

          {/* Card 3: NORMAL USER HISTORY (If not Admin) */}
          {!isAdmin && (
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col">
              <div className="flex items-center gap-2 mb-4">
                 <span className="text-2xl">🧾</span>
                 <h2 className="text-lg font-semibold text-gray-900">Billing</h2>
              </div>
              <p className="text-gray-500 mb-6 text-sm flex-grow">
                View your past payments, download receipts, and track your subscription history.
              </p>
              <Link 
                href="/subscription-history" 
                className="w-full py-3 px-4 bg-gray-100 text-gray-800 rounded-lg hover:bg-gray-200 font-medium transition-all text-center"
              >
                View History &rarr;
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}