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
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if ((await getDoc(doc(db, "admins", user.uid))).exists()) return router.push("/admin/dashboard");
      if ((await getDoc(doc(db, "growth_students", user.uid))).exists()) return router.push("/student/dashboard");
      if ((await getDoc(doc(db, "job_seekers", user.uid))).exists()) return router.push("/job-seeker/dashboard");
      if ((await getDoc(doc(db, "mentors", user.uid))).exists()) return router.push("/mentor/dashboard");

      setError("Role not assigned. Contact Admin.");
    } catch (err: any) {
      console.error(err);
      setError("Invalid credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-black relative overflow-hidden">
      
      {/* 📱 MOBILE BACKGROUND GLOW (Visible only on mobile) */}
      <div className="absolute inset-0 lg:hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[80%] h-[40%] bg-blue-600/20 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[40%] bg-purple-600/20 rounded-full blur-[80px]" />
      </div>

      {/* 🎨 LEFT SIDE: Visual Branding (Desktop Only) */}
      <div className="hidden lg:flex w-1/2 relative bg-zinc-900 overflow-hidden items-center justify-center border-r border-white/5">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-900/20 via-black to-purple-900/20 z-0"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>
        
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
             One dashboard for learning, upskilling, and landing your dream job.
          </p>
        </div>
      </div>

      {/* 🔐 RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex flex-col items-center justify-center p-6 lg:p-12 z-10">
        <div className="w-full max-w-md space-y-8 backdrop-blur-xl bg-black/40 lg:bg-transparent p-6 rounded-2xl border border-white/5 lg:border-none">
          
          {/* Mobile Logo (Visible only on mobile to retain branding) */}
          <div className="lg:hidden text-center mb-4">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider">
               <Sparkles size={12} /> Pixalara
             </div>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-3xl font-bold text-white tracking-tight">Welcome back</h2>
            <p className="mt-2 text-gray-400">Please enter your details to sign in.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm text-center">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="email" required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder-zinc-700"
                  placeholder="name@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Password</label>
                <a href="#" className="text-xs text-blue-500 hover:text-blue-400">Forgot?</a>
              </div>
              <div className="relative group">
                <Lock className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-purple-500 transition-colors" size={18} />
                <input 
                  type="password" required
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-3 pl-10 pr-4 text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all placeholder-zinc-700"
                  placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3.5 rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <>Sign In <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            No account? <a href="#" className="text-white hover:underline">Contact Admin</a>
          </p>
        </div>
      </div>
    </div>
  );
}