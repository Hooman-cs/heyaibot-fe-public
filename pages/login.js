import { signIn, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Login() {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [localError, setLocalError] = useState("");
  const router = useRouter();
  const { data: session } = useSession();

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (session) {
      router.push("/dashboard");
    }
  }, [session, router]);

  // Capture error from URL (e.g., ?error=CredentialsSignin)
  const { error: urlError } = router.query; 

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    setLocalError("");
    
    const res = await signIn("credentials", {
      email: formData.email,
      password: formData.password,
      redirect: false,
    });
    
    if (res?.error) {
      setLocalError("Invalid email or password");
    } else {
      router.push("/dashboard");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 shadow-lg rounded-lg">
        <h2 className="text-center text-3xl font-bold text-gray-900 mb-6">Sign In</h2>
        
        {(localError || urlError) && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md text-sm text-center">
            {localError || "Authentication failed"}
          </div>
        )}

        {/* Social Login Grid */}
        <div className="flex flex-col gap-3 mb-6">
           <button onClick={() => signIn("google", { callbackUrl: "/dashboard" })} className="flex items-center justify-center gap-2 border p-3 rounded hover:bg-gray-50 transition-all">
             <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
             <span className="font-semibold text-gray-700">Continue with Google</span>
           </button>
           <button onClick={() => signIn("azure-ad", { callbackUrl: "/dashboard" })} className="flex items-center justify-center gap-2 border p-3 rounded hover:bg-gray-50 transition-all">
             <img src="https://www.svgrepo.com/show/448239/microsoft.svg" className="w-5 h-5" alt="Microsoft" />
             <span className="font-semibold text-gray-700">Continue with Microsoft</span>
           </button>
           <button onClick={() => signIn("apple", { callbackUrl: "/dashboard" })} className="flex items-center justify-center gap-2 bg-black text-white p-3 rounded hover:bg-gray-800 transition-all">
             <img src="https://www.svgrepo.com/show/448234/apple.svg" className="w-5 h-5 invert" alt="Apple" />
             <span className="font-semibold">Continue with Apple</span>
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