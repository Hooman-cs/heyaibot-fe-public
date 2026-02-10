import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <div className="flex justify-center space-x-6">
          <Link href="/" className="text-gray-400 hover:text-gray-300">Home</Link>
          <Link href="/features" className="text-gray-400 hover:text-gray-300">Features</Link>
          <Link href="/contact" className="text-gray-400 hover:text-gray-300">Contact</Link>
        </div>
        <p className="mt-8 text-center text-base text-gray-400">
          &copy; {new Date().getFullYear()} HeyAiBot. All rights reserved.
        </p>
      </div>
    </footer>
  );
}