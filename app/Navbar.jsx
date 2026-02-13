"use client";
import Link from 'next/link';
import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession(); 

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex">
            <Link href="/" className="flex-shrink-0 flex items-center font-bold text-2xl text-blue-600">
              HeyAiBot
            </Link>
          </div>
          
          {/* DESKTOP MENU */}
          <div className="hidden sm:ml-6 sm:flex sm:space-x-8 items-center">
            <Link href="/" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Home</Link>
            <Link href="/features" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Features</Link>
            <Link href="/faq" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">FAQ</Link>
            <Link href="/contact" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Contact</Link>
            <Link href="/pricing" className="text-gray-500 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">Price</Link>

            {/* Dynamic Auth Buttons */}
            {session ? (
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="text-gray-900 font-medium hover:text-blue-600">
                  Dashboard
                </Link>
                <button 
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex space-x-4">
                <Link href="/login" className="text-gray-900 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium">
                  Sign In
                </Link>
                <Link href="/register" className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors">
                  Get Started
                </Link>
              </div>
            )}
          </div>
          
          {/* MOBILE MENU BUTTON */}
          <div className="-mr-2 flex items-center sm:hidden">
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {/* Simple Hamburger Icon */}
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
              </svg>
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
            <Link href="/faq" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">FAQ</Link>
            <Link href="/contact" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Contact</Link>
            <div className="border-t border-gray-200 mt-2 pt-2">
              {session ? (
                 <Link href="/dashboard" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">Dashboard</Link>
              ) : (
                <>
                  <Link href="/login" className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50">Sign In</Link>
                  <Link href="/register" className="block px-3 py-2 rounded-md text-base font-medium text-blue-600 hover:bg-blue-50">Get Started</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}




