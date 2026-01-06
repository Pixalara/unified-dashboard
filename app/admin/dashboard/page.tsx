"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  getDocs, 
  query, 
  limit, 
  orderBy 
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  Users, 
  Briefcase, 
  CheckCircle, 
  Clock,
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    jobAspirants: 0,
    placed: 0,
    interviews: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [courseData, setCourseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // 1. Fetch Students
        const studentsSnap = await getDocs(collection(db, "students"));
        const studentsCount = studentsSnap.size;

        // 2. Fetch Job Seekers (MATCHING PIPELINE LOGIC)
        // We use orderBy("createdAt") to ensure we count exactly what shows in the pipeline
        // This filters out "ghost" records that might be missing timestamps
        const aspirantsQuery = query(collection(db, "job_seekers"), orderBy("createdAt", "desc"));
        const aspirantsSnap = await getDocs(aspirantsQuery);
        const aspirantsCount = aspirantsSnap.size;

        // 3. Calculate Placed & Interviews based on the filtered list
        let placedCount = 0;
        let interviewCount = 0;
        aspirantsSnap.forEach(doc => {
            const data = doc.data();
            if (data.stage === "placed") placedCount++;
            if (data.stage === "interview") interviewCount++;
        });

        setStats({
            students: studentsCount,
            jobAspirants: aspirantsCount,
            placed: placedCount,
            interviews: interviewCount
        });

        // 4. Fetch Recent Students (Limit 5)
        const recentQuery = query(collection(db, "students"), orderBy("createdAt", "desc"), limit(5));
        const recentSnap = await getDocs(recentQuery);
        setRecentStudents(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        // 5. Prepare Course Data for Charts
        const courses = { "Full Stack": 0, "Data Science": 0, "DevOps": 0, "UI/UX": 0 };
        studentsSnap.forEach(doc => {
            const c = doc.data().course || "Full Stack";
            // @ts-ignore
            if (courses[c] !== undefined) courses[c]++;
        });
        
        const chartData = Object.keys(courses).map(key => ({
            name: key,
            // @ts-ignore
            value: courses[key]
        })).filter(item => item.value > 0);

        setCourseData(chartData.length > 0 ? chartData : [
            { name: "Full Stack", value: 40 },
            { name: "Data Science", value: 30 },
            { name: "DevOps", value: 20 },
            { name: "UI/UX", value: 10 }
        ]);

      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 text-sm animate-pulse">Loading Dashboard...</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans pb-20 selection:bg-blue-500/30">
      
      {/* 📱 HEADER */}
      <div className="sticky top-0 z-30 bg-black/80 backdrop-blur-md border-b border-white/10 p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">Admin Overview</h1>
              <p className="text-sm text-gray-400 mt-1">Real-time placement & student metrics.</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
              <Link href="/admin/pipeline" className="flex-1 md:flex-none text-center bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-lg shadow-blue-900/20 text-sm">
                  Manage Pipeline
              </Link>
          </div>
      </div>

      <main className="p-4 md:p-6 max-w-7xl mx-auto space-y-6 md:space-y-8">
          
          {/* 📊 STATS GRID (Responsive) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                  label="Total Students" 
                  value={stats.students} 
                  icon={<Users size={20} className="text-blue-400"/>} 
                  color="border-blue-500/30 bg-blue-500/5"
              />
              <StatCard 
                  label="Job Aspirants" 
                  value={stats.jobAspirants} 
                  icon={<Briefcase size={20} className="text-purple-400"/>} 
                  color="border-purple-500/30 bg-purple-500/5"
              />
              <StatCard 
                  label="Interviews Active" 
                  value={stats.interviews} 
                  icon={<Clock size={20} className="text-orange-400"/>} 
                  color="border-orange-500/30 bg-orange-500/5"
              />
              <StatCard 
                  label="Total Placed" 
                  value={stats.placed} 
                  icon={<CheckCircle size={20} className="text-green-400"/>} 
                  color="border-green-500/30 bg-green-500/5"
              />
          </div>

          {/* 📈 MAIN CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* LEFT COLUMN: CHARTS */}
              <div className="lg:col-span-2 space-y-6">
                  
                  {/* Distribution Chart */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-white flex items-center gap-2">
                              <TrendingUp size={18} className="text-blue-500"/> Course Distribution
                          </h3>
                      </div>
                      <div className="h-[250px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={courseData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#333" />
                                  <XAxis type="number" hide />
                                  <YAxis dataKey="name" type="category" width={80} tick={{fill: '#9ca3af', fontSize: 12}} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#fff' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{fill: 'rgba(255,255,255,0.05)'}}
                                  />
                                  <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>

                  {/* Placement Status (Pie) */}
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 shadow-xl">
                      <h3 className="text-lg font-bold text-white mb-4">Pipeline Status</h3>
                      <div className="h-[250px] w-full flex items-center justify-center">
                          <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                      data={[
                                          { name: 'Registered', value: stats.jobAspirants - stats.interviews - stats.placed },
                                          { name: 'Interviewing', value: stats.interviews },
                                          { name: 'Placed', value: stats.placed },
                                      ]}
                                      cx="50%"
                                      cy="50%"
                                      innerRadius={60}
                                      outerRadius={80}
                                      paddingAngle={5}
                                      dataKey="value"
                                  >
                                      <Cell fill="#3f3f46" /> {/* Registered */}
                                      <Cell fill="#f59e0b" /> {/* Interview */}
                                      <Cell fill="#10b981" /> {/* Placed */}
                                  </Pie>
                                  <Tooltip contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }} />
                                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                              </PieChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>

              {/* RIGHT COLUMN: RECENT LIST */}
              <div className="lg:col-span-1">
                  <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 md:p-6 h-full shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-bold text-white">Recent Students</h3>
                          <Link href="/admin/students" className="text-xs text-blue-400 hover:text-white flex items-center gap-1 transition">
                              View All <ChevronRight size={12}/>
                          </Link>
                      </div>
                      
                      <div className="space-y-4">
                          {recentStudents.length > 0 ? (
                              recentStudents.map((student) => (
                                  <div key={student.id} className="group flex items-center justify-between p-3 rounded-xl bg-black/40 border border-white/5 hover:border-blue-500/30 hover:bg-blue-500/5 transition">
                                      <div className="flex items-center gap-3 overflow-hidden">
                                          <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white shrink-0 text-sm border border-zinc-700">
                                              {student.name?.charAt(0)}
                                          </div>
                                          <div className="min-w-0">
                                              <p className="text-sm font-bold text-gray-200 truncate group-hover:text-blue-400 transition">{student.name}</p>
                                              <p className="text-xs text-gray-500 truncate">{student.course || "N/A"}</p>
                                          </div>
                                      </div>
                                      <div className="flex flex-col items-end">
                                          <span className="w-2 h-2 rounded-full bg-green-500 mb-1"></span>
                                          <span className="text-[10px] text-gray-600">Active</span>
                                      </div>
                                  </div>
                              ))
                          ) : (
                              <div className="text-center py-10">
                                  <p className="text-gray-600 text-sm">No recent activity.</p>
                              </div>
                          )}
                      </div>
                      
                      <button className="w-full mt-6 py-3 rounded-xl bg-zinc-800 text-gray-300 text-sm font-medium hover:bg-zinc-700 transition md:hidden">
                          View All Student Records
                      </button>
                  </div>
              </div>

          </div>
      </main>
    </div>
  );
}

// 🧱 Sub-component
function StatCard({ label, value, icon, color }: { label: string, value: number, icon: any, color: string }) {
    return (
        <div className={`p-5 rounded-2xl border ${color} bg-opacity-10 backdrop-blur-sm flex flex-col justify-between h-28 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300`}>
            <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition"></div>
            <div className="flex justify-between items-start z-10">
                <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">{label}</span>
                <div className="p-2 bg-black/20 rounded-lg">{icon}</div>
            </div>
            <h2 className="text-3xl font-black text-white z-10">{value}</h2>
        </div>
    );
}