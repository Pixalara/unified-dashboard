"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  Briefcase, 
  CheckCircle, 
  Clock, 
  Building2, 
  MapPin, 
  LogOut,
  ChevronRight,
  User
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function JobSeekerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [seeker, setSeeker] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 🔥 Fetch Job Seeker Profile
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const docRef = doc(db, "job_seekers", user.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setSeeker(docSnap.data());
        } else {
          console.error("No job seeker profile found!");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading placement hub...</div>;
  if (!seeker) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Profile not found. Contact Placement Cell.</div>;

  // 📊 Pipeline Stages Logic
  const stages = ["registered", "interview", "placed"];
  const currentStageIndex = stages.indexOf(seeker.stage) !== -1 ? stages.indexOf(seeker.stage) : 0;
  
  const getStageLabel = (stage: string) => {
      if (stage === 'registered') return 'Application Received';
      if (stage === 'interview') return 'Interview Scheduled';
      if (stage === 'placed') return 'Offer Letter Released';
      return 'Processing';
  };

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-purple-500/30">
      
      {/* 🟣 Navigation Bar */}
      <nav className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center text-white">
                <Briefcase size={18} fill="currentColor" />
             </div>
             <span className="font-bold text-white tracking-tight">Pixalara Placement Cell</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{seeker.name}</p>
                <span className="text-xs text-gray-400">{seeker.domain || "Candidate"}</span>
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
      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Hello, {seeker.name.split(" ")[0]}</h1>
            <p className="text-gray-400">Track your opportunities and interview status here.</p>
          </div>
          <div className="hidden md:block text-right">
             <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                <span className="text-sm font-bold uppercase tracking-wider">{seeker.stage}</span>
             </div>
          </div>
        </div>

        {/* 🛤️ STATUS TIMELINE (Visual Pipeline) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-8">Application Status</h3>
            <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto">
                {/* Connecting Line */}
                <div className="absolute top-1/2 left-0 w-full h-1 bg-zinc-800 -z-0 -translate-y-1/2 rounded"></div>
                <div 
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-purple-600 to-blue-600 -z-0 -translate-y-1/2 rounded transition-all duration-1000"
                    style={{ width: `${(currentStageIndex / (stages.length - 1)) * 100}%` }}
                ></div>

                {/* Stages */}
                {stages.map((stage, index) => {
                    const isCompleted = index <= currentStageIndex;
                    const isCurrent = index === currentStageIndex;

                    return (
                        <div key={stage} className="relative z-10 flex flex-col items-center gap-3">
                            <div className={`
                                w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-500
                                ${isCompleted ? 'bg-zinc-900 border-purple-500 text-purple-500' : 'bg-zinc-900 border-zinc-700 text-zinc-600'}
                                ${isCurrent ? 'scale-125 shadow-[0_0_20px_rgba(168,85,247,0.4)]' : ''}
                            `}>
                                {index < currentStageIndex ? <CheckCircle size={18} /> : (index + 1)}
                            </div>
                            <span className={`text-xs font-bold uppercase tracking-wider ${isCompleted ? 'text-white' : 'text-gray-600'}`}>
                                {stage}
                            </span>
                        </div>
                    );
                })}
            </div>
            
            <div className="mt-10 text-center">
                <p className="text-gray-400 text-sm">Current Status:</p>
                <p className="text-xl font-bold text-white mt-1">{getStageLabel(seeker.stage)}</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           
           {/* 🏢 Target Company Card */}
           <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-3xl"></div>
                
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <Building2 size={20} className="text-purple-500"/> Target Opportunity
                </h3>

                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-gray-400 text-sm">Company</span>
                        <span className="text-white font-bold text-lg">{seeker.company || "Finding match..."}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-white/5 rounded-xl border border-white/5">
                        <span className="text-gray-400 text-sm">Domain</span>
                        <span className="text-white font-bold">{seeker.domain || "IT"}</span>
                    </div>
                </div>

                {seeker.stage === 'interview' && (
                     <div className="mt-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center">
                        <p className="text-purple-300 text-sm font-medium mb-2">Interview Scheduled</p>
                        <button className="bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg text-sm font-bold w-full transition">
                            View Details
                        </button>
                     </div>
                )}
           </div>

           {/* 📄 Profile Summary */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <User size={20} className="text-blue-500"/> Candidate Profile
                </h3>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-gray-400 font-bold text-lg">
                            {seeker.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-white font-bold">{seeker.name}</p>
                            <p className="text-sm text-gray-500">{seeker.email}</p>
                        </div>
                    </div>
                    <div className="h-px bg-zinc-800 w-full my-4"></div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                         <Clock size={16} /> <span>Join Date: {seeker.createdAt ? new Date(seeker.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-gray-400">
                         <MapPin size={16} /> <span>Location: India (Remote)</span>
                    </div>
                </div>

                <button className="mt-6 w-full border border-zinc-700 text-gray-300 hover:bg-zinc-800 py-2.5 rounded-xl text-sm font-medium transition">
                    Edit Profile
                </button>
           </div>
        </div>
      </main>
    </div>
  );
}