"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  doc,
  deleteDoc, 
  setDoc, 
  getDocs, // ✅ Added to fetch courses
  serverTimestamp 
} from "firebase/firestore";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db } from "@/lib/firebase"; 
import { Search, Plus, Trash2, Mail, Phone, BookOpen, X, UserCheck } from "lucide-react";

interface Mentor {
  id: string;
  name: string;
  email: string;
  phone: string;
  course: string; // 🔄 Changed from expertise to course
  status: string;
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [courseList, setCourseList] = useState<string[]>([]); // 🆕 Store available courses
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "", 
    course: "" // 🔄 Course Selection
  });

  // 🔥 1. Fetch Mentors Real-time
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "mentors"), (snapshot) => {
      setMentors(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Mentor)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🔥 2. Fetch Courses for Dropdown
  useEffect(() => {
    async function fetchCourses() {
      const querySnapshot = await getDocs(collection(db, "courses"));
      const list = querySnapshot.docs.map(doc => doc.data().title);
      setCourseList(list);
    }
    fetchCourses();
  }, []);

  // 🔐 Helper: Create Auth User
  const createAuthUser = async (email: string, pass: string) => {
    const config = db.app.options; 
    const secondaryAppName = "secondaryAppMentor";
    let secondaryApp: FirebaseApp;
    
    if (getApps().length > 1) {
       secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(config, secondaryAppName);
    } else {
       secondaryApp = initializeApp(config, secondaryAppName);
    }

    const secondaryAuth = getAuth(secondaryApp);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    await signOut(secondaryAuth);
    return userCredential.user.uid;
  };

  // ➕ Add Mentor
  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.course) {
      alert("⚠️ All fields are required.");
      setCreating(false);
      return;
    }

    try {
      // 1. Create Login
      const uid = await createAuthUser(formData.email, formData.password);

      // 2. Create Profile linked to UID
      await setDoc(doc(db, "mentors", uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        course: formData.course, // ✅ Saving selected course
        status: "Active",
        role: "mentor",
        createdAt: serverTimestamp()
      });
      
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "", password: "", course: "" });
      alert(`✅ Mentor Onboarded!\nLogin created for: ${formData.email}`);

    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Error: This email is already registered.");
      } else {
        alert("Error adding mentor: " + error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this mentor profile?")) {
      await deleteDoc(doc(db, "mentors", id));
    }
  };

  const filteredMentors = mentors.filter((m) =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.course?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mentors & Faculty</h1>
          <p className="text-gray-400 text-sm">Manage teaching staff and course assignments.</p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 flex-1 focus-within:border-blue-500 transition-colors">
            <Search className="text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search mentors..." 
              className="bg-transparent border-none outline-none text-white text-sm w-full md:w-48 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
          >
            <Plus size={18} /> <span className="hidden md:inline">Add Mentor</span>
          </button>
        </div>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {!loading && filteredMentors.map((mentor) => (
          <div key={mentor.id} className="bg-zinc-900 border border-zinc-800 p-5 rounded-xl hover:border-zinc-700 transition group relative">
             
             {/* Delete Button */}
             <button onClick={() => handleDelete(mentor.id)} className="absolute top-4 right-4 text-zinc-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                <Trash2 size={18}/>
             </button>

             <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white text-lg border border-zinc-700">
                    {mentor.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                    <h3 className="text-white font-bold">{mentor.name}</h3>
                    {/* Display Course with Icon */}
                    <p className="text-xs text-blue-400 flex items-center gap-1 mt-0.5">
                        <BookOpen size={10} /> {mentor.course || "No Course Assigned"}
                    </p>
                </div>
             </div>
             
             <div className="space-y-2 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Mail size={14} /> {mentor.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-400">
                    <Phone size={14} /> {mentor.phone}
                </div>
             </div>
          </div>
        ))}
      </div>

      {!loading && filteredMentors.length === 0 && (
         <div className="text-center py-20 text-gray-500">No mentors found.</div>
      )}

      {/* 🏳️ MODAL (Compact & Scrollable) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            
            <h2 className="text-xl font-bold text-white mb-1">Add New Mentor</h2>
            <p className="text-sm text-gray-400 mb-5">Create profile & assign course.</p>
            
            <form onSubmit={handleAddMentor} className="space-y-3">
              
              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Full Name <span className="text-red-500">*</span></label>
                <input required className="w-full bg-black border border-zinc-800 rounded p-2.5 text-white mt-1 outline-none focus:border-blue-500" 
                  placeholder="e.g. Dr. Emily Chen" 
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              {/* Login Credentials Group */}
              <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg space-y-2">
                 <p className="text-xs text-blue-400 font-bold uppercase flex items-center gap-1"><UserCheck size={12}/> Login Credentials</p>
                 <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1">Email (Login ID) <span className="text-red-500">*</span></label>
                    <input required type="email" className="w-full bg-black border border-zinc-800 rounded p-2 text-white mt-1 text-sm outline-none focus:border-blue-500" 
                      placeholder="mentor@pixalara.com" 
                      value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} 
                    />
                 </div>
                 <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1">Set Password <span className="text-red-500">*</span></label>
                    <input required type="text" className="w-full bg-black border border-zinc-800 rounded p-2 text-white mt-1 text-sm outline-none focus:border-blue-500" 
                      placeholder="MentorPass@123" 
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* 🆕 COURSE DROPDOWN */}
                 <div>
                    <label className="text-xs uppercase font-bold text-gray-500">Assign Course <span className="text-red-500">*</span></label>
                    <select 
                        required
                        className="w-full bg-black border border-zinc-800 rounded p-2.5 text-white mt-1 outline-none focus:border-blue-500 cursor-pointer"
                        value={formData.course} 
                        onChange={(e) => setFormData({...formData, course: e.target.value})}
                    >
                        <option value="" disabled>Select Course</option>
                        {courseList.length > 0 ? (
                             courseList.map((course, idx) => (
                                <option key={idx} value={course}>{course}</option>
                             ))
                        ) : (
                             <option disabled>No courses found</option>
                        )}
                    </select>
                 </div>
                 <div>
                    <label className="text-xs uppercase font-bold text-gray-500">Phone <span className="text-red-500">*</span></label>
                    <input required type="tel" className="w-full bg-black border border-zinc-800 rounded p-2.5 text-white mt-1 outline-none focus:border-blue-500" 
                      placeholder="+91..." 
                      value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                    />
                 </div>
              </div>

              <button type="submit" disabled={creating} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 transition">
                {creating ? "Creating Account..." : "Save Mentor"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}