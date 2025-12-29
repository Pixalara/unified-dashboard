"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  BookOpen, 
  Clock, 
  Trophy, 
  Video, 
  Lock, 
  Download, 
  Calendar, 
  CheckCircle,
  LogOut,
  Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch Student Profile
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const docRef = doc(db, "growth_students", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setStudent(docSnap.data());
        } else {
          console.error("No student profile found!");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading dashboard...</div>;
  if (!student) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Profile not found. Contact Admin.</div>;

  // 🎨 Logic for Progress & Certificate
  const isCompleted = student.status === "Completed";
  const progressValue = isCompleted ? 100 : 45; // Default 45% for demo

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30">
      
      {/* 🟢 Navigation Bar */}
      <nav className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white">
                <Sparkles size={18} fill="currentColor" />
             </div>
             <span className="font-bold text-white tracking-tight">Pixalara Growth School</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{student.name}</p>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">
                  {student.studentId || "PENDING"}
                </span>
             </div>
             <button 
                onClick={() => { logout(); router.push("/login"); }}
                className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
                title="Sign Out"
             >
                <LogOut size={20} />
             </button>
          </div>
        </div>
      </nav>

      {/* 🚀 Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {student.name.split(" ")[0]} 👋</h1>
            <p className="text-gray-400">Continue your progress in <strong>{student.course}</strong>.</p>
          </div>
          <div className="hidden md:block text-right">
             <p className="text-xs text-gray-500 uppercase font-bold">Current Track</p>
             <p className="text-xl font-bold text-white">{student.track || "IT"}</p>
          </div>
        </div>

        {/* 📊 Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           {/* Stat 1 */}
           <div className="bg-zinc-900 border border-white/5 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><BookOpen size={24} /></div>
              <div>
                 <p className="text-xs text-gray-500 uppercase font-bold">Course</p>
                 <p className="text-white font-bold truncate max-w-[150px]">{student.course}</p>
              </div>
           </div>
           {/* Stat 2 */}
           <div className="bg-zinc-900 border border-white/5 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500"><Clock size={24} /></div>
              <div>
                 <p className="text-xs text-gray-500 uppercase font-bold">Attendance</p>
                 <p className="text-white font-bold">85% Present</p>
              </div>
           </div>
           {/* Stat 3 */}
           <div className="bg-zinc-900 border border-white/5 p-5 rounded-xl flex items-center gap-4">
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><Trophy size={24} /></div>
              <div>
                 <p className="text-xs text-gray-500 uppercase font-bold">Status</p>
                 <span className={`text-xs px-2 py-0.5 rounded-full border ${
                    isCompleted 
                    ? "bg-green-500/20 text-green-400 border-green-500/30" 
                    : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                 }`}>
                    {student.status || "Active"}
                 </span>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* 🎓 LEFT: Active Course Card */}
           <div className="lg:col-span-2 space-y-6">
              <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl overflow-hidden relative group">
                 {/* Decorative Glow */}
                 <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-blue-600/20 transition duration-700"></div>

                 <div className="p-8 relative z-10">
                    <div className="flex justify-between items-start mb-6">
                       <div>
                          <span className="inline-block px-3 py-1 rounded-full bg-blue-600/20 text-blue-400 text-xs font-bold border border-blue-600/30 mb-3">
                             LIVE BATCH
                          </span>
                          <h2 className="text-3xl font-bold text-white mb-2">{student.course}</h2>
                          <p className="text-gray-400 text-sm max-w-md">
                             Master the tools and concepts to become a high-paid professional. 
                             Your next live session is scheduled soon.
                          </p>
                       </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                       <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-400">Course Completion</span>
                          <span className="text-white font-bold">{progressValue}%</span>
                       </div>
                       <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-1000" 
                            style={{ width: `${progressValue}%` }}
                          ></div>
                       </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-4">
                       <button className="flex-1 bg-white text-black hover:bg-gray-200 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                          <Video size={18} /> Join Live Class
                       </button>
                       <button className="flex-1 bg-zinc-800 text-white hover:bg-zinc-700 border border-zinc-700 px-6 py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition">
                          <Calendar size={18} /> View Schedule
                       </button>
                    </div>
                 </div>
              </div>
           </div>

           {/* 🔐 RIGHT: Certificate & Tools */}
           <div className="space-y-6">
              
              {/* Certificate Card */}
              <div className={`border rounded-2xl p-6 relative overflow-hidden transition-all ${
                 isCompleted 
                 ? "bg-gradient-to-br from-green-900/20 to-black border-green-500/30" 
                 : "bg-zinc-900 border-zinc-800"
              }`}>
                 <h3 className="text-lg font-bold text-white mb-2">Course Certificate</h3>
                 <p className="text-sm text-gray-400 mb-6">
                    {isCompleted 
                      ? "Congratulations! You have successfully completed the course." 
                      : "Complete all modules and assignments to unlock your certificate."}
                 </p>

                 <div className="flex items-center justify-center h-32 bg-black/40 rounded-xl border border-white/5 mb-6 relative">
                    {isCompleted ? (
                       <CheckCircle size={48} className="text-green-500 animate-bounce" />
                    ) : (
                       <Lock size={48} className="text-zinc-700" />
                    )}
                 </div>

                 <button 
                    disabled={!isCompleted}
                    className={`w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition ${
                       isCompleted 
                       ? "bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20" 
                       : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                    }`}
                 >
                    {isCompleted ? <><Download size={18} /> Download PDF</> : <><Lock size={16} /> Locked</>}
                 </button>
              </div>

              {/* Help Card */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                 <h4 className="font-bold text-white mb-2">Need Help?</h4>
                 <div className="flex items-center gap-3 text-sm text-gray-300">
                    <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-400 font-bold">S</div>
                    <span>support@pixalara.com</span>
                 </div>
              </div>

           </div>
        </div>
      </main>
    </div>
  );
}