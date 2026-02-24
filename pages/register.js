import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Image from "next/image";

export default function Register() {
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        router.push("/login?success=Account created");
      } else {
        const data = await res.json();
        setError(data.message || "Registration failed");
      }
    } catch (err) {
      setError("Something went wrong");
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

      <div className="w-full max-w-md space-y-8 bg-white p-8 shadow-lg rounded-lg">
        <h2 className="text-center text-3xl font-bold text-gray-900">Create Account</h2>
        {error && <div className="text-red-500 text-center text-sm">{error}</div>}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Full Name"
            required
            className="w-full border p-3 rounded-md"
            onChange={(e) => setFormData({...formData, name: e.target.value})}
          />
          <input
            type="email"
            placeholder="Email address"
            required
            className="w-full border p-3 rounded-md"
            onChange={(e) => setFormData({...formData, email: e.target.value})}
          />
          <input
            type="password"
            placeholder="Password"
            required
            className="w-full border p-3 rounded-md"
            onChange={(e) => setFormData({...formData, password: e.target.value})}
          />
          <button type="submit" className="w-full bg-blue-600 text-white p-3 rounded-md hover:bg-blue-700">
            Sign Up
          </button>
        </form>
        
        <div className="text-center text-sm">
          Already have an account? <Link href="/login" className="text-blue-600 font-semibold">Sign in</Link>
        </div>
      </div>
    </div>
  );
}