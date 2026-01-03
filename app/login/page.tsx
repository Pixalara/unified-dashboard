"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  onAuthStateChanged 
} from "firebase/auth"; 
import { doc, getDoc } from "firebase/firestore"; 
import { db } from "@/lib/firebase"; 
import { Lock, Mail, ArrowRight } from "lucide-react"; // ❌ Removed Sparkles import

export default function LoginPage() {
  const router = useRouter();
  const auth = getAuth(db.app);

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isResetMode, setIsResetMode] = useState(false);
  const [resetMessage, setResetMessage] = useState("");

  // 🛡️ ROUTE GUARD
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        await checkRoleAndRedirect(user.uid);
      } else {
        setCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const checkRoleAndRedirect = async (uid: string) => {
    try {
        const adminSnap = await getDoc(doc(db, "admins", uid));
        if (adminSnap.exists()) { router.replace("/admin/dashboard"); return; }
        const studentSnap = await getDoc(doc(db, "growth_students", uid));
        if (studentSnap.exists()) { router.replace("/student/dashboard"); return; }
        const mentorSnap = await getDoc(doc(db, "mentors", uid));
        if (mentorSnap.exists()) { router.replace("/mentor/dashboard"); return; }
        const seekerSnap = await getDoc(doc(db, "job_seekers", uid));
        if (seekerSnap.exists()) { router.replace("/job-seeker/dashboard"); return; }
        router.replace("/admin/dashboard");
    } catch (err) {
        setCheckingAuth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, formData.email, formData.password);
      await checkRoleAndRedirect(userCredential.user.uid);
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') setError("Invalid email or password.");
      else if (err.code === 'auth/user-not-found') setError("No account found.");
      else setError("Login Failed: " + err.message);
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, formData.email);
      setResetMessage("✅ Reset link sent! Check your inbox.");
    } catch (err: any) {
        setError("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-black font-sans selection:bg-purple-500/30 overflow-hidden relative">
      
      {/* 🎨 BACKGROUND GLOWS (Subtle & Premium) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
         <div className="absolute top-[-20%] left-[-10%] w-[80vw] h-[80vh] bg-blue-900/20 rounded-full blur-[120px] opacity-40"></div>
         <div className="absolute bottom-[-20%] right-[-10%] w-[80vw] h-[80vh] bg-purple-900/20 rounded-full blur-[120px] opacity-40"></div>
      </div>

      {/* 👈 LEFT SIDE: Marketing */}
      <div className="w-full lg:w-1/2 relative flex flex-col justify-center items-center p-8 lg:p-12 z-10 lg:min-h-screen pt-20 lg:pt-0">
         <div className="relative text-center max-w-lg space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            
            {/* Pill Badge (No Icon) */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm text-blue-200 shadow-xl mx-auto">
                <span className="font-medium tracking-wide">Pixalara Growth School</span>
            </div>
            
            {/* Headline */}
            <h1 className="text-4xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
               Accelerate your <br/>
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                 Career Growth
               </span>
            </h1>
            
            {/* Subtext */}
            <p className="text-gray-400 text-sm lg:text-lg leading-relaxed max-w-md mx-auto">
               One dashboard for learning, upskilling, and landing your dream job.
            </p>
         </div>
      </div>

      {/* 👉 RIGHT SIDE: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative z-20 bg-black/0 lg:bg-black">
         <div className="w-full max-w-md space-y-8">
            
            {/* Header */}
            <div className="text-left">
               <h2 className="text-3xl font-bold text-white mb-2">
                 {isResetMode ? "Reset password" : "Welcome back"}
               </h2>
               <p className="text-gray-500 text-sm">
                 {isResetMode ? "Enter email to recover account." : "Please enter your details to sign in."}
               </p>
            </div>

            {/* Messages */}
            {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm font-medium">{error}</div>}
            {resetMessage && <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-4 rounded-lg text-sm font-medium">{resetMessage}</div>}

            {!isResetMode ? (
                // --- LOGIN FORM ---
                <form onSubmit={handleSubmit} className="space-y-5">
                   
                   <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Email</label>
                      <div className="relative">
                          <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                          <input 
                            type="email" 
                            required
                            className="w-full bg-zinc-100 text-black border-none rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder:text-gray-400"
                            placeholder="admin@pixalara.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                      </div>
                   </div>

                   <div className="space-y-1.5">
                      <div className="flex justify-between items-center pl-1">
                          <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest">Password</label>
                          <button type="button" onClick={() => setIsResetMode(true)} className="text-xs text-blue-500 hover:text-blue-400 font-medium">Forgot?</button>
                      </div>
                      <div className="relative">
                          <Lock className="absolute left-4 top-3.5 text-gray-500" size={18} />
                          <input 
                            type="password" 
                            required
                            className="w-full bg-zinc-100 text-black border-none rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder:text-gray-400"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                          />
                      </div>
                   </div>

                   <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-white hover:bg-zinc-200 text-black font-bold text-lg py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                   >
                      {loading ? <span className="opacity-70">Signing In...</span> : <>Sign In <ArrowRight size={20} /></>}
                   </button>
                </form>
            ) : (
                // --- RESET FORM ---
                <form onSubmit={handleReset} className="space-y-5">
                   <div className="space-y-1.5">
                      <label className="text-[10px] uppercase font-bold text-gray-500 tracking-widest pl-1">Registered Email</label>
                      <div className="relative">
                          <Mail className="absolute left-4 top-3.5 text-gray-500" size={18} />
                          <input 
                            type="email" 
                            required
                            className="w-full bg-zinc-100 text-black border-none rounded-xl py-3.5 pl-11 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all font-medium placeholder:text-gray-400"
                            placeholder="name@company.com"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                      </div>
                   </div>

                   <button 
                      type="submit" 
                      disabled={loading}
                      className="w-full bg-white hover:bg-zinc-200 text-black font-bold text-lg py-3.5 rounded-xl transition-all"
                   >
                      {loading ? "Sending..." : "Send Reset Link"}
                   </button>

                   <button 
                      type="button" 
                      onClick={() => setIsResetMode(false)}
                      className="w-full text-zinc-500 hover:text-white text-sm py-2 font-medium"
                   >
                      Back to Login
                   </button>
                </form>
            )}
            
            <div className="pt-6 text-center">
                <p className="text-xs text-zinc-600">
                    No account? <a href="#" className="text-zinc-400 hover:text-white transition-colors">Contact Admin</a>
                </p>
            </div>

         </div>
      </div>
    </div>
  );
}