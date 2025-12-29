"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { Lock, Mail, Loader2 } from "lucide-react";

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
      // 1. Authenticate
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Check Role in all collections
      // Admin?
      if ((await getDoc(doc(db, "admins", user.uid))).exists()) {
        router.push("/admin/dashboard");
        return;
      }
      // Student?
      if ((await getDoc(doc(db, "growth_students", user.uid))).exists()) {
        router.push("/student/dashboard");
        return;
      }
      // Job Seeker?
      if ((await getDoc(doc(db, "job_seekers", user.uid))).exists()) {
        router.push("/job-seeker/dashboard");
        return;
      }
       // Mentor?
       if ((await getDoc(doc(db, "mentors", user.uid))).exists()) {
        router.push("/mentor/dashboard");
        return;
      }

      setError("User exists, but no role assigned. Contact Admin.");
      
    } catch (err: any) {
      console.error(err);
      setError("Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">Pixalara Login</h1>
          <p className="text-gray-400 text-sm">Welcome back</p>
        </div>

        {error && <div className="mb-4 p-3 bg-red-500/10 text-red-400 text-sm rounded-lg text-center">{error}</div>}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-3 text-gray-500" size={18} />
            <input 
              type="email" required placeholder="Email"
              className="w-full bg-black border border-zinc-800 rounded-lg py-2.5 pl-10 text-white focus:border-blue-500 outline-none"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-3 text-gray-500" size={18} />
            <input 
              type="password" required placeholder="Password"
              className="w-full bg-black border border-zinc-800 rounded-lg py-2.5 pl-10 text-white focus:border-blue-500 outline-none"
              value={password} onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg flex justify-center">
            {loading ? <Loader2 className="animate-spin" /> : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}