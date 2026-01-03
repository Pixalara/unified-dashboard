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
  Clock
} from "lucide-react";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Legend, 
  Tooltip 
} from "recharts";
import Link from "next/link";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    students: 0,
    jobSeekers: 0,
    placed: 0,
    interviews: 0
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
  const [courseData, setCourseData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 📱 Responsive State
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // 1. Handle Window Resize for Chart Alignment
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // Check on load
    window.addEventListener("resize", handleResize);

    // 2. Fetch Data
    async function fetchStats() {
      try {
        const studentsSnap = await getDocs(collection(db, "growth_students"));
        const seekersSnap = await getDocs(collection(db, "job_seekers"));
        
        const totalStudents = studentsSnap.size;
        const totalSeekers = seekersSnap.size;
        
        const placedCount = seekersSnap.docs.filter(d => d.data().stage === 'placed').length;
        const interviewCount = seekersSnap.docs.filter(d => d.data().stage === 'interview').length;

        setStats({
            students: totalStudents,
            jobSeekers: totalSeekers,
            placed: placedCount,
            interviews: interviewCount
        });

        const recentQuery = query(collection(db, "growth_students"), orderBy("createdAt", "desc"), limit(5));
        const recentSnap = await getDocs(recentQuery);
        setRecentStudents(recentSnap.docs.map(d => ({ id: d.id, ...d.data() })));

        const courses: any = {};
        studentsSnap.docs.forEach(doc => {
            const course = doc.data().course || "Unknown";
            courses[course] = (courses[course] || 0) + 1;
        });

        const chartData = Object.keys(courses).map(name => ({
            name,
            value: courses[name]
        }));
        setCourseData(chartData);

      } catch (error) {
        console.error("Error fetching dashboard:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b'];

  if (loading) return <div className="p-10 text-white text-center">Loading Analytics...</div>;

  return (
    <div className="space-y-8 pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
           <p className="text-gray-400">Real-time metrics for Pixalara Growth School.</p>
        </div>
        <Link href="/admin/students" className="bg-white text-black px-4 py-2 rounded-lg font-bold hover:bg-gray-200 transition text-center">
            Manage Students
        </Link>
      </div>

      {/* 📊 Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Total Students</p>
                  <h2 className="text-3xl font-bold text-white">{stats.students}</h2>
              </div>
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-500"><Users size={24} /></div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Job Seekers</p>
                  <h2 className="text-3xl font-bold text-white">{stats.jobSeekers}</h2>
              </div>
              <div className="p-3 bg-purple-500/10 rounded-lg text-purple-500"><Briefcase size={24} /></div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Placed</p>
                  <h2 className="text-3xl font-bold text-white">{stats.placed}</h2>
              </div>
              <div className="p-3 bg-green-500/10 rounded-lg text-green-500"><CheckCircle size={24} /></div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex items-center justify-between">
              <div>
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">Interviews</p>
                  <h2 className="text-3xl font-bold text-white">{stats.interviews}</h2>
              </div>
              <div className="p-3 bg-orange-500/10 rounded-lg text-orange-500"><Clock size={24} /></div>
          </div>
      </div>

      {/* 📉 Charts & Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Pie Chart Card */}
          <div className="lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-xl p-6 flex flex-col">
              <h3 className="text-lg font-bold text-white mb-2">Course Enrollment</h3>
              
              {/* Responsive Container Height: Taller on Mobile, Standard on Desktop */}
              <div className="w-full h-[400px] md:h-[350px] flex-shrink-0 -ml-4 md:ml-0">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={courseData}
                              cx="50%"
                              cy={isMobile ? "30%" : "50%"} // ✅ SMART FIX: High on Mobile, Centered on Desktop
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
                            contentStyle={{ backgroundColor: '#000', borderColor: '#333', borderRadius: '8px' }}
                            itemStyle={{ color: '#fff' }}
                          />
                          <Legend 
                            verticalAlign="bottom" 
                            align="center"
                            height={isMobile ? 100 : 36} // More space for legend on mobile
                            iconType="circle"
                          />
                      </PieChart>
                  </ResponsiveContainer>
              </div>
          </div>

          {/* Recent Students List */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6 overflow-hidden">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-white">Recent Students</h3>
                  <Link href="/admin/students" className="text-sm text-blue-400 hover:text-blue-300">View All</Link>
              </div>
              
              <div className="space-y-4">
                  {recentStudents.map((student) => (
                      <div key={student.id} className="flex items-center justify-between p-4 bg-black/40 rounded-lg border border-zinc-800/50">
                          <div className="flex items-center gap-4 overflow-hidden">
                              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white shrink-0">
                                  {student.name?.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                  <p className="text-white font-medium truncate">{student.name}</p>
                                  <p className="text-xs text-gray-500 truncate">{student.course}</p>
                              </div>
                          </div>
                          <span className="text-xs px-2 py-1 rounded bg-green-900/30 text-green-400 border border-green-500/20 shrink-0">
                              Active
                          </span>
                      </div>
                  ))}
                  {recentStudents.length === 0 && <p className="text-gray-500 text-sm">No students found.</p>}
              </div>
          </div>

      </div>
    </div>
  );
}