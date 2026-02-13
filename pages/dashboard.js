import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/router";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") return <div className="p-10">Loading...</div>;
  if (!session) return null;

  const isAdmin = session?.user?.isSuperAdmin === true;

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome, {session?.user?.name}
          </h1>
          <p className="text-gray-600">
            {isAdmin ? "Super Admin Access Enabled" : "Manage your subscription and access your chatbot studio."}
          </p>
        </div>
        
        <button 
          onClick={() => signOut({ callbackUrl: '/' })}
          className="text-red-600 hover:text-red-800 font-medium text-sm border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-all"
        >
          Sign Out
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Card 1: Plan Info */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Plan</h2>
          {/* ✅ FIX: Display Human Readable Plan Name */}
          <div className="text-3xl font-bold text-blue-600 capitalize mb-4">
            {session?.user?.planName || "Free Plan"}
          </div>
          <p className="text-gray-500 mb-6 text-sm">
            Status: <span className="text-green-600 font-bold">Active</span>
          </p>
          <Link href="/pricing" className="text-blue-600 hover:text-blue-800 font-medium text-sm flex items-center gap-1">
            Upgrade Plan &rarr;
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
            className="w-full py-3 px-4 bg-gray-900 hover:bg-gray-800 rounded-lg font-medium transition-all text-white"
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
              {/* Link to Plan Management */}
              <Link href="/admin-plans" className="block w-full text-left bg-white p-3 rounded shadow-sm hover:shadow transition text-gray-700 font-medium border border-purple-100">
                📝 Manage Plans
              </Link>
              
              {/* ✅ NEW Link to Subscription History */}
              <Link href="/admin-subscriptions" className="block w-full text-left bg-white p-3 rounded shadow-sm hover:shadow transition text-gray-700 font-medium border border-purple-100">
                💰 View Revenue & History
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
// "use client";
// import { useSession, signOut } from "next-auth/react";
// import Link from "next/link"; // Import Link for internal navigation

// export default function Dashboard() {
//   const { data: session } = useSession();
  
//   // Check if user is Super Admin
//   const isSuperAdmin = session?.user?.isSuperAdmin;

//   return (
//     <div className="max-w-4xl mx-auto py-10 px-4">
//       <div className="flex justify-between items-center mb-8">
//         <div>
//           <h1 className="text-3xl font-bold text-gray-900">Welcome, {session?.user?.name}</h1>
//           <p className="text-gray-600">Manage your subscription and access your chatbot studio.</p>
//         </div>
//         <button 
//           onClick={() => signOut({ callbackUrl: '/' })}
//           className="text-red-600 hover:text-red-800 font-medium text-sm border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50"
//         >
//           Sign Out
//         </button>
//       </div>

//       <div className="grid md:grid-cols-2 gap-6">
//         {/* Card 1: Current Plan */}
//         {/* <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//           <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Plan</h2>
//           <div className="text-3xl font-bold text-blue-600 capitalize mb-4">
//             {session?.user?.plan || "starter"}
//           </div>
//           <p className="text-gray-500 mb-6">
//             You are currently on the {session?.user?.plan || "starter"} tier.
//           </p> */}
//           <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
//           <h2 className="text-lg font-semibold text-gray-900 mb-2">Your Plan</h2>
          
//           {/* FIX: Use 'planName' instead of 'plan' (which is the ID) */}
//           <div className="text-3xl font-bold text-blue-600 capitalize mb-4">
//             {session?.user?.planName || "Free Plan"}
//           </div>
          
//           {/* Optional: You can keep the ID in a tooltip or small text if needed */}
//           <p className="text-gray-500 mb-6 text-sm">
//              Status: <span className="text-green-600 font-bold">Active</span>
//           </p>
//           <a href="/pricing" className="text-blue-600 hover:text-blue-800 font-medium text-sm">
//             Upgrade Plan &rarr;
//           </a>
//         </div>

//         {/* Card 2: Launch Studio */}
//         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
//           <div className="bg-blue-50 p-4 rounded-full mb-4">
//             <span className="text-4xl">🤖</span>
//           </div>
//           <h2 className="text-lg font-semibold text-gray-900">Chatbot Studio</h2>
//           <p className="text-gray-500 mb-6 text-sm">
//             Configure your bots, upload knowledge, and view chat logs.
//           </p>
//           <a 
//             href="/api/launch-studio" 
//             target="_self" 
//             className="w-full py-3 px-4 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium transition-all"
//           >
//             Launch Studio &rarr;
//           </a>
//         </div>

//         {/* Card 3: Admin Controls (Visible only to Super Admin) */}
//         {isSuperAdmin && (
//           <div className="md:col-span-2 bg-purple-50 p-6 rounded-xl shadow-sm border border-purple-200 flex items-center justify-between">
//             <div>
//               <h2 className="text-lg font-bold text-purple-900">Super Admin Controls</h2>
//               <p className="text-purple-700 text-sm">Manage SaaS plans, pricing, and features.</p>
//             </div>
//             <Link 
//               href="/admin-plans" 
//               className="bg-purple-600 text-white px-5 py-2.5 rounded-lg hover:bg-purple-700 font-medium transition-all shadow-sm"
//             >
//               Manage Plans &rarr;
//             </Link>

//             {/* NEW Link to Subscription History */}
//               <Link href="/admin-subscriptions" className="block w-full text-left bg-white p-3 rounded shadow-sm hover:shadow transition text-gray-700 font-medium border border-purple-100">
//                 💰 View Revenue & History
//               </Link>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }