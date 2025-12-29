"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit 
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { Users, Briefcase, CheckCircle, Clock, TrendingUp, Calendar } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { userData } = useAuth();
  
  // 1️⃣ State for Real Data
  const [stats, setStats] = useState({
    students: 0,
    jobSeekers: 0,
    placed: 0,
    interviews: 0
  });
  
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // A. Fetch Growth Students Count & Recent List
        // Note: Ideally use aggregation queries for counts, but getting all docs is fine for small apps
        const studentsSnap = await getDocs(collection(db, "growth_students"));
        const studentsCount = studentsSnap.size;

        // Get 3 most recent students (assuming 'createdAt' exists, otherwise just takes first 3)
        // We try to order by 'createdAt' if you have indexes set up. 
        // If this crashes due to missing index, remove the orderBy for now.
        const recentQuery = query(
          collection(db, "growth_students"), 
          // orderBy("createdAt", "desc"), // Uncomment this once you create the Index in Firebase Console
          limit(3)
        );
        const recentSnap = await getDocs(recentQuery);
        const recentList = recentSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // B. Fetch Job Seekers Data
        const jobSeekersSnap = await getDocs(collection(db, "job_seekers"));
        const jobSeekers = jobSeekersSnap.docs.map(doc => doc.data());
        
        const totalSeekers = jobSeekers.length;
        const placedCount = jobSeekers.filter(js => js.stage === "Placed").length;
        const interviewCount = jobSeekers.filter(js => js.stage === "Interview").length;

        // C. Update State
        setStats({
          students: studentsCount,
          jobSeekers: totalSeekers,
          placed: placedCount,
          interviews: interviewCount
        });
        
        setRecentStudents(recentList);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  // Define cards config
  const cards = [
    { label: "Total Students", value: stats.students, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Job Seekers", value: stats.jobSeekers, icon: Briefcase, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Placed", value: stats.placed, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Interviews Active", value: stats.interviews, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* 👋 Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Welcome back, {userData?.name || "Admin"}
          </h1>
          <p className="text-gray-400 mt-1">Real-time overview of Pixalara Growth School.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/students" className="bg-zinc-800 text-white px-4 py-2 rounded-lg font-medium hover:bg-zinc-700 transition">
            Manage Students
          </Link>
        </div>
      </div>

      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat, index) => (
          <div key={index} className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl hover:border-zinc-700 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                <p className="text-3xl font-bold text-white mt-2">
                  {loading ? "..." : stat.value}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 📈 Activity Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Enrollments */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Enrollments</h3>
            <Link href="/admin/students" className="text-xs text-blue-400 cursor-pointer hover:underline">View All</Link>
          </div>
          
          <div className="space-y-4">
            {loading ? (
              <div className="text-gray-500 text-sm">Loading students...</div>
            ) : recentStudents.length === 0 ? (
              <div className="text-gray-500 text-sm">No students found.</div>
            ) : (
              recentStudents.map((student, i) => (
                <div key={student.id || i} className="flex items-center justify-between p-3 bg-black/40 rounded-lg hover:bg-zinc-800/50 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-sm font-bold text-gray-300">
                      {student.name?.charAt(0).toUpperCase() || "S"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{student.name || "Unknown Student"}</p>
                      <p className="text-xs text-gray-500">{student.course || "No Course Assigned"}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full border ${
                    student.status === 'Active' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-zinc-800 text-gray-400 border-zinc-700'
                  }`}>
                    {student.status || "Pending"}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Placement Pulse */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="text-green-500 w-5 h-5" />
              <h3 className="text-lg font-semibold text-white">Placement Pulse</h3>
            </div>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              You have <span className="text-white font-bold">{stats.interviews}</span> students currently in the interview stage. 
              {stats.interviews > 0 ? " Ensure they are prepared for their upcoming rounds." : " Keep adding more profiles to the pipeline."}
            </p>
          </div>
          
          <div className="space-y-3">
             <div className="flex items-center gap-3 text-sm text-gray-400 bg-black/20 p-3 rounded-lg">
                <Calendar size={16} />
                <span>Next Drive: <strong>HCL Tech</strong> (Tomorrow)</span>
             </div>
             <Link href="/admin/jobs" className="block text-center w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition">
              Manage Placements
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}