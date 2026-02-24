import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setError("");
    const res = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });
    if (res?.error) {
      setError("Invalid email or password");
    } else {
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-12">
      
      {/* Header with Larger Logo */}
      <Link href="/" className="mb-8 flex items-center gap-3">
        <Image 
          src="/logo.png" 
          alt="HeyAiBot Logo" 
          width={56} 
          height={56} 
          className="w-14 h-14 object-contain" 
        />
        <span className="text-3xl font-bold text-blue-600 tracking-tight">HeyAiBot</span>
      </Link>

      <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-lg">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-6">Sign In</h2>
        
        {(error || urlError) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
            {error || "Authentication failed"}
          </div>
        )}

        {/* Social Login Grid - Restored Apple & Microsoft */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <button 
            onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
            className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Sign in with Google"
          >
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-6 h-6" />
          </button>

          <button 
            onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })}
            className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Sign in with Microsoft"
          >
            <img src="https://www.svgrepo.com/show/448239/microsoft.svg" alt="Microsoft" className="w-6 h-6" />
          </button>

          <button 
            onClick={() => signIn("apple", { callbackUrl: "/dashboard" })}
            className="flex items-center justify-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            title="Sign in with Apple"
          >
            <img src="https://www.svgrepo.com/show/448234/apple.svg" alt="Apple" className="w-6 h-6" />
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-300"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with email</span></div>
        </div>

        {/* Email Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email address"
            required
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full border p-3 rounded-md focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700 font-medium">
            Sign In
          </button>
        </form>

        <div className="text-center text-sm mt-4">
          Don't have an account? <Link href="/register" className="text-blue-600 font-semibold">Sign up</Link>
        </div>
      </div>
    </div>
  );
}