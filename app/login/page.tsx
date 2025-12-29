"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // 1. Authenticate with Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Determine Role (Check all collections)
      if ((await getDoc(doc(db, "admins", user.uid))).exists()) {
        router.push("/admin/dashboard");
        return;
      }
      if ((await getDoc(doc(db, "growth_students", user.uid))).exists()) {
        router.push("/student/dashboard");
        return;
      }
      if ((await getDoc(doc(db, "job_seekers", user.uid))).exists()) {
        router.push("/job-seeker/dashboard");
        return;
      }
      if ((await getDoc(doc(db, "mentors", user.uid))).exists()) {
        router.push("/mentor/dashboard");
        return;
      }

      setError("Account valid, but no role assigned. Contact Admin.");
    } catch (err: any) {
      console.error("Login error:", err);
      setError("Invalid email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black">
      
      {/* 🎨 LEFT SIDE: Visual Branding (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden items-center justify-center">
        {/* Background Gradients */}
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20 z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-300 text-xs font-medium mb-6">
            <Sparkles size={14} /> Pixalara Growth School
          </div>
          <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
            Accelerate your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
              Career Growth
            </span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto">
            Access your courses, track placement opportunities, and connect with mentors in one unified dashboard.
          </p>
          
          {/* Decorative Code Block */}
          <div className="mt-12 mx-auto max-w-sm bg-black/50 border border-white/10 rounded-xl p-4 text-left shadow-2xl backdrop-blur-sm">
            <div className="flex gap-1.5 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
            </div>
            <div className="space-y-2">
              <div className="h-2 w-3/4 bg-zinc-800 rounded"></div>
              <div className="h-2 w-1/2 bg-zinc-800 rounded"></div>
              <div className="h-2 w-5/6 bg-blue-900/30 rounded"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 🔐 RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-black">
        <div className="w-full max-w-md space-y-8">
          
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-gray-400">Please enter your details to sign in.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-center gap-2">
                <span className="block w-1.5 h-1.5 rounded-full bg-red-500"></span>
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-zinc-600"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <a href="#" className="text-xs text-blue-500 hover:text-blue-400">Forgot password?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-zinc-600"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3.5 rounded-xl transition-all transform active:scale-[0.99] flex items-center justify-center gap-2 shadow-lg shadow-white/10"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>Sign In <ArrowRight size={18} /></>
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-gray-500">
            Don't have an account?{" "}
            <a href="#" className="text-white font-medium hover:underline">Contact Admissions</a>
          </p>
        </div>
      </div>
    </div>
  );
}