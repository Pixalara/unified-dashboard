"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  updateDoc, // 🆕 Import updateDoc
  doc, 
  serverTimestamp,
  getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { Plus, Trash2, BookOpen, Clock, Calendar, X, DownloadCloud, RefreshCcw, Edit2 } from "lucide-react";

interface Course {
  id: string;
  title: string;
  duration: string;
  mode: string;
  fees: string;
}

const PIXALARA_DEFAULTS = [
  {
    title: "DevOps Masterclass",
    duration: "3.5 Months",
    mode: "Live Interactive",
    fees: "₹ 30,000"
  },
  {
    title: "AWS Cloud Architect",
    duration: "2.5 Months",
    mode: "Live Classes",
    fees: "₹ 25,000"
  },
  {
    title: "RedHat Linux Administration",
    duration: "1.5 Months",
    mode: "Live + Recorded",
    fees: "₹ 15,000"
  },
  {
    title: "Cyber Security Specialist",
    duration: "4 Months",
    mode: "Live Bootcamp",
    fees: "₹ 35,000"
  }
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  
  // 🆕 Edit State
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    duration: "",
    mode: "Live Classes",
    fees: ""
  });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "courses"), (snapshot) => {
      setCourses(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Course)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 📝 Handle Submit (Add or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      if (editingId) {
        // Update Existing
        await updateDoc(doc(db, "courses", editingId), {
          ...formData,
          updatedAt: serverTimestamp()
        });
        alert("✅ Course updated!");
      } else {
        // Create New
        await addDoc(collection(db, "courses"), {
          ...formData,
          createdAt: serverTimestamp()
        });
        alert("✅ Course created!");
      }
      closeModal();
    } catch (error) {
      console.error(error);
      alert("Error saving course");
    }
  };

  // ✏️ Open Edit Modal
  const handleEdit = (course: Course) => {
    setEditingId(course.id);
    setFormData({
      title: course.title,
      duration: course.duration,
      mode: course.mode,
      fees: course.fees
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: "", duration: "", mode: "Live Classes", fees: "" });
  };

  const handleLoadDefaults = async () => {
    setImporting(true);
    try {
      for (const course of PIXALARA_DEFAULTS) {
        await addDoc(collection(db, "courses"), { ...course, createdAt: serverTimestamp() });
      }
      alert("✅ Courses imported!");
    } catch (error) {
      console.error(error);
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this course?")) await deleteDoc(doc(db, "courses", id));
  };

  const handleDeleteAll = async () => {
    if (confirm("🚨 Delete ALL courses?")) {
      setImporting(true);
      const snap = await getDocs(collection(db, "courses"));
      for (const docItem of snap.docs) await deleteDoc(doc(db, "courses", docItem.id));
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-white">Course Manager</h1>
           <p className="text-gray-400 text-sm">Manage curriculum & fee structures.</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            {courses.length > 0 && (
                <button onClick={handleDeleteAll} disabled={importing} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-3 py-2 rounded-lg font-bold text-xs flex items-center gap-2 border border-red-500/20 transition">
                    <RefreshCcw size={14} /> Reset DB
                </button>
            )}
            <button onClick={handleLoadDefaults} disabled={importing} className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 border border-zinc-700 transition">
                <DownloadCloud size={18} /> Load Defaults
            </button>
            <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                <Plus size={18} /> Add Course
            </button>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && courses.map((course) => (
          <div key={course.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl flex flex-col justify-between hover:border-zinc-700 transition group relative">
             
             {/* Action Buttons */}
             <div className="absolute top-4 right-4 flex gap-2">
               {/* ✏️ Edit Button */}
               <button onClick={() => handleEdit(course)} className="text-zinc-600 hover:text-blue-400 transition p-1 bg-zinc-950/50 rounded-md">
                   <Edit2 size={16}/>
               </button>
               {/* 🗑️ Delete Button */}
               <button onClick={() => handleDelete(course.id)} className="text-zinc-600 hover:text-red-500 transition p-1 bg-zinc-950/50 rounded-md">
                   <Trash2 size={16}/>
               </button>
             </div>

             <div>
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/10 to-purple-500/10 flex items-center justify-center text-blue-400 mb-4">
                    <BookOpen size={20} />
                </div>
                
                <h3 className="text-lg font-bold text-white mb-2 leading-tight pr-12">
                    {course.title || "Untitled Course"}
                </h3>
                
                <div className="flex flex-wrap gap-2 mt-3">
                    <span className="text-xs bg-zinc-950 border border-zinc-800 text-gray-400 px-2 py-1 rounded flex items-center gap-1.5">
                        <Clock size={12} className="text-gray-500" /> {course.duration || "N/A"}
                    </span>
                    <span className="text-xs bg-zinc-950 border border-zinc-800 text-gray-400 px-2 py-1 rounded flex items-center gap-1.5">
                        <Calendar size={12} className="text-gray-500" /> {course.mode || "Online"}
                    </span>
                </div>
             </div>
             
             <div className="mt-5 pt-4 border-t border-zinc-800/50 flex justify-between items-center">
                <span className="text-gray-500 text-xs font-medium uppercase tracking-wider">Fees</span>
                <span className="text-white font-bold bg-white/5 px-2 py-0.5 rounded text-sm">
                    {course.fees || "₹ 0"}
                </span>
             </div>
          </div>
        ))}
      </div>

      {!loading && courses.length === 0 && (
         <div className="flex flex-col items-center justify-center py-20 text-gray-500 bg-zinc-900/30 rounded-xl border border-dashed border-zinc-800">
            <BookOpen size={40} className="mb-4 opacity-20" />
            <p>Database is clean.</p>
         </div>
      )}

      {/* 🏳️ MODAL (Shared for Add & Edit) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl p-6 relative shadow-2xl">
            <button onClick={closeModal} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            
            <h2 className="text-xl font-bold text-white mb-1">
                {editingId ? "Edit Course" : "Add New Course"}
            </h2>
            <p className="text-gray-400 text-sm mb-6">
                {editingId ? "Update course details." : "Create a new curriculum entry."}
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Course Title</label>
                 <input required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white mt-1 focus:border-blue-500 outline-none" 
                    placeholder="e.g. Data Science Pro" 
                    value={formData.title} 
                    onChange={e => setFormData({...formData, title: e.target.value})} 
                 />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Duration</label>
                    <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white mt-1 focus:border-blue-500 outline-none" 
                        placeholder="e.g. 3 Months" 
                        value={formData.duration} 
                        onChange={e => setFormData({...formData, duration: e.target.value})} 
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">Fees</label>
                    <input className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white mt-1 focus:border-blue-500 outline-none" 
                        placeholder="e.g. ₹25,000" 
                        value={formData.fees} 
                        onChange={e => setFormData({...formData, fees: e.target.value})} 
                    />
                 </div>
              </div>
              <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Mode</label>
                 <select className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white mt-1 focus:border-blue-500 outline-none" 
                    value={formData.mode} 
                    onChange={e => setFormData({...formData, mode: e.target.value})}
                 >
                    <option>Live Classes</option>
                    <option>Recorded Sessions</option>
                    <option>Hybrid (Live + Recorded)</option>
                    <option>Offline Campus</option>
                 </select>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 transition">
                {editingId ? "Update Course" : "Save Course"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}