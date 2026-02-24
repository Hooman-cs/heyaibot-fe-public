"use client";
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname } from 'next/navigation'; // ✅ Import this

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession(); 
  const pathname = usePathname(); // ✅ Get current path

  // Helper to determine link class
  const getLinkClass = (path) => {
    const isActive = pathname === path;
    return isActive 
      ? "text-blue-600 font-bold px-3 py-2 rounded-md text-sm transition-colors" // Active Style
      : "text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"; // Inactive Style
  };

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          {/* Logo Section */}
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center gap-3">
              <Image 
                src="/logo.png" 
                alt="HeyAiBot Logo" 
                width={48} 
                height={48} 
                className="w-12 h-12 object-contain"
              />
              <span className="font-bold text-2xl text-blue-600 tracking-tight">HeyAiBot</span>
            </Link>
          </div>
          
          {/* DESKTOP MENU */}
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
            <Link href="/" className={getLinkClass('/')}>Home</Link>
            <Link href="/features" className={getLinkClass('/features')}>Features</Link>
            <Link href="/pricing" className={getLinkClass('/pricing')}>Pricing</Link>
            <Link href="/faq" className={getLinkClass('/faq')}>FAQ</Link>
            <Link href="/contact" className={getLinkClass('/contact')}>Contact</Link>
            
            {session ? (
              <div className="flex items-center space-x-4 ml-4">
                 <Link href="/dashboard" className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
                    Dashboard
                 </Link>
                 <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                 >
                    Sign Out
                 </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 ml-4">
                <Link href="/login" className={getLinkClass('/login')}>Login</Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
                  Get Started
                </Link>
              </div>
            )}
          </div>
          
          {/* MOBILE MENU BUTTON */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* MOBILE MENU DROPDOWN */}
      {isOpen && (
        <div className="sm:hidden bg-white border-t border-gray-200">
          <div className="pt-2 pb-3 space-y-1 px-2">
            <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Home</Link>
            <Link href="/features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Features</Link>
            <Link href="/pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Pricing</Link>
            <Link href="/faq" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">FAQ</Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Contact</Link>
            <div className="border-t border-gray-200 mt-2 pt-2">
              {session ? (
                <>
                 <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">Dashboard</Link>
                 <button 
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                 >
                    Sign Out
                 </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Login</Link>
                  <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">Sign Up</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}



// "use client";
// import Link from 'next/link';
// import Image from 'next/image';
// import { useState } from 'react';
// import { useSession, signOut } from 'next-auth/react';

// export default function Navbar() {
//   const [isOpen, setIsOpen] = useState(false);
//   const { data: session } = useSession(); 

//   return (
//     <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//         <div className="flex justify-between h-20"> {/* Increased height slightly */}
//           {/* Logo Section */}
//           <div className="flex">
//             <Link href="/" className="flex-shrink-0 flex items-center gap-3">
//               <Image 
//                 src="/logo.png" 
//                 alt="HeyAiBot Logo" 
//                 width={48} 
//                 height={48} 
//                 className="w-12 h-12 object-contain" /* Increased Size */
//               />
//               <span className="font-bold text-2xl text-blue-600 tracking-tight">HeyAiBot</span>
//             </Link>
//           </div>
          
//           {/* DESKTOP MENU */}
//           <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
//             <Link href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
//             <Link href="/features" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Features</Link>
//             <Link href="/pricing" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Pricing</Link>
//             <Link href="/faq" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">FAQ</Link>
//             <Link href="/contact" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Contact</Link>
            
//             {session ? (
//               <div className="flex items-center space-x-4 ml-4">
//                  <Link href="/dashboard" className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-100 transition-colors">
//                     Dashboard
//                  </Link>
//                  {/* ✅ Added Sign Out Button */}
//                  <button 
//                     onClick={() => signOut({ callbackUrl: '/' })}
//                     className="text-gray-500 hover:text-red-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
//                  >
//                     Sign Out
//                  </button>
//               </div>
//             ) : (
//               <div className="flex items-center space-x-2 ml-4">
//                 <Link href="/login" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Login</Link>
//                 <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm">
//                   Get Started
//                 </Link>
//               </div>
//             )}
//           </div>
          
//           {/* MOBILE MENU BUTTON */}
//           <div className="-mr-2 flex items-center sm:hidden">
//             <button
//               onClick={() => setIsOpen(!isOpen)}
//               className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
//             >
//               <span className="sr-only">Open main menu</span>
//               {!isOpen ? (
//                 <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
//                 </svg>
//               ) : (
//                 <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
//                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
//                 </svg>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
      
//       {/* MOBILE MENU DROPDOWN */}
//       {isOpen && (
//         <div className="sm:hidden bg-white border-t border-gray-200">
//           <div className="pt-2 pb-3 space-y-1 px-2">
//             <Link href="/" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Home</Link>
//             <Link href="/features" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Features</Link>
//             <Link href="/pricing" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Pricing</Link>
//             <Link href="/faq" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">FAQ</Link>
//             <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Contact</Link>
//             <div className="border-t border-gray-200 mt-2 pt-2">
//               {session ? (
//                 <>
//                  <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">Dashboard</Link>
//                  <button 
//                     onClick={() => signOut({ callbackUrl: '/' })}
//                     className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
//                  >
//                     Sign Out
//                  </button>
//                 </>
//               ) : (
//                 <>
//                   <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Login</Link>
//                   <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">Sign Up</Link>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </nav>
//   );
// }