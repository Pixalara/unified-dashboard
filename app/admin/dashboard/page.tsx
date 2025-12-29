"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  collection, 
  getDocs, 
  query, 
  limit, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { Users, Briefcase, CheckCircle, Clock, TrendingUp, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { 
  PieChart, Pie, Cell, 
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

export default function AdminDashboard() {
  const { userData } = useAuth();
  
  // State
  const [stats, setStats] = useState({
    students: 0,
    jobSeekers: 0,
    placed: 0,
    interviews: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 📊 Chart Data State
  const [courseData, setCourseData] = useState<any[]>([]);
  const [placementData, setPlacementData] = useState<any[]>([]);

  // Chart Colors
  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444'];

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        // 1. Fetch Students
        const studentsSnap = await getDocs(collection(db, "growth_students"));
        const students = studentsSnap.docs.map(doc => doc.data());
        
        // 2. Fetch Job Seekers
        const seekersSnap = await getDocs(collection(db, "job_seekers"));
        const seekers = seekersSnap.docs.map(doc => doc.data());

        // --- 🔢 Calculate Stats ---
        const totalSeekers = seekers.length;
        const placedCount = seekers.filter(s => s.stage === "placed").length;
        const interviewCount = seekers.filter(s => s.stage === "interview").length;
        
        setStats({
          students: students.length,
          jobSeekers: totalSeekers,
          placed: placedCount,
          interviews: interviewCount
        });

        // --- 🥧 Process Course Distribution (Pie Chart) ---
        const courseCounts: Record<string, number> = {};
        students.forEach(s => {
          const course = s.course || "Unknown";
          courseCounts[course] = (courseCounts[course] || 0) + 1;
        });
        
        const pData = Object.keys(courseCounts).map(key => ({
          name: key,
          value: courseCounts[key]
        }));
        setCourseData(pData);

        // --- 📊 Process Placement Pipeline (Bar Chart) ---
        const stageCounts = {
            registered: 0,
            interview: 0,
            placed: 0,
            rejected: 0
        };
        seekers.forEach(s => {
            const st = s.stage as keyof typeof stageCounts;
            if (stageCounts[st] !== undefined) stageCounts[st]++;
        });

        setPlacementData([
            { name: 'Registered', count: stageCounts.registered },
            { name: 'Interview', count: stageCounts.interview },
            { name: 'Placed', count: stageCounts.placed },
            { name: 'Rejected', count: stageCounts.rejected },
        ]);

        // 3. Recent Enrollments (Limit 3)
        // Note: For strict ordering, ensure you have a 'createdAt' field and index
        setRecentStudents(students.slice(0, 3)); 

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const cards = [
    { label: "Total Students", value: stats.students, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Job Seekers", value: stats.jobSeekers, icon: Briefcase, color: "text-purple-500", bg: "bg-purple-500/10" },
    { label: "Placed", value: stats.placed, icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10" },
    { label: "Interviews", value: stats.interviews, icon: Clock, color: "text-orange-500", bg: "bg-orange-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* 👋 Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <p className="text-gray-400 text-sm">Real-time metrics for Pixalara Growth School.</p>
        </div>
        <Link href="/admin/students" className="bg-white text-black px-4 py-2 rounded-lg font-bold text-sm hover:bg-gray-200 transition">
            Manage Students
        </Link>
      </div>

      {/* 📊 Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((stat, index) => (
          <div key={index} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase">{stat.label}</p>
                <h3 className="text-3xl font-bold text-white mt-1">{loading ? "..." : stat.value}</h3>
              </div>
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 📈 CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* 1. Placement Success Chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-6">Placement Pipeline</h3>
            <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={placementData}>
                        <XAxis dataKey="name" stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#525252" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                            cursor={{ fill: '#27272a' }}
                        />
                        <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>

        {/* 2. Course Distribution Chart */}
        <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
            <h3 className="text-lg font-bold text-white mb-6">Course Enrollment</h3>
            <div className="h-64 w-full flex items-center justify-center">
                {courseData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={courseData}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {courseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px' }}
                                itemStyle={{ color: '#fff' }}
                            />
                            <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <p className="text-gray-500 text-sm">No enrollment data yet.</p>
                )}
            </div>
        </div>
      </div>

      {/* 📋 Bottom Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Enrollments */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white">Recent Students</h3>
            <Link href="/admin/students" className="text-xs text-blue-400 hover:text-blue-300">View All</Link>
          </div>
          <div className="space-y-4">
            {recentStudents.map((s, i) => (
               <div key={i} className="flex items-center justify-between p-3 bg-black/20 rounded-lg border border-white/5">
                  <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                        {s.name?.charAt(0).toUpperCase()}
                     </div>
                     <div>
                        <p className="text-sm font-medium text-white">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.course}</p>
                     </div>
                  </div>
                  <span className="text-xs text-gray-400">{s.status}</span>
               </div>
            ))}
            {recentStudents.length === 0 && <p className="text-gray-500 text-sm">No recent enrollments.</p>}
          </div>
        </div>

        {/* Action Card */}
        <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 border border-zinc-800 rounded-xl p-6 flex flex-col justify-between">
           <div>
              <div className="flex items-center gap-2 mb-2 text-green-500">
                 <TrendingUp size={20} />
                 <span className="font-bold">Placement Drive</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">HCL Tech</h3>
              <p className="text-sm text-gray-400">Scheduled for tomorrow at 10:00 AM. 5 candidates are shortlisted.</p>
           </div>
           <Link href="/admin/jobs" className="mt-6 w-full py-3 bg-white text-black rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-200 transition">
              View Candidates <ArrowRight size={16} />
           </Link>
        </div>
      </div>

    </div>
  );
}