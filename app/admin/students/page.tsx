"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  deleteDoc, 
  doc, 
  setDoc, // ✅ Imported correctly now
  serverTimestamp 
} from "firebase/firestore";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db } from "@/lib/firebase"; 
import { Search, Plus, Trash2, Phone, BookOpen, X, Eye, Mail, Lock } from "lucide-react";
import Link from "next/link"; 

interface Student {
  id: string;
  studentId: string;
  name: string;
  email: string;
  phone: string;
  course: string;
  status: string;
  track: string;
}

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
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
    course: "DevOps Masterclass",
    track: "IT"
  });

  // 🔥 1. Real-time Data
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "growth_students"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Student[];
      setStudents(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🆔 Helper: Generate Unique ID
  const generateStudentId = () => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `PGS-${year}-${randomNum}`;
  };

  // 🔐 Helper: Create User without logging out Admin
  const createAuthUser = async (email: string, pass: string) => {
    // 1. Get current config from the existing DB connection
    const config = db.app.options; 
    
    // 2. Initialize a "Secondary" App (Invisible)
    const secondaryAppName = "secondaryApp";
    let secondaryApp: FirebaseApp;
    
    if (getApps().length > 1) {
       secondaryApp = getApps().find(app => app.name === secondaryAppName) || initializeApp(config, secondaryAppName);
    } else {
       secondaryApp = initializeApp(config, secondaryAppName);
    }

    // 3. Create User on Secondary App
    const secondaryAuth = getAuth(secondaryApp);
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    
    // 4. Cleanup: Sign out immediately & return UID
    await signOut(secondaryAuth);
    return userCredential.user.uid;
  };

  // ➕ 2. Add Student (Auth + DB)
  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      alert("⚠️ All fields (including Password) are required.");
      setCreating(false);
      return;
    }

    try {
      // Step A: Create Authentication User
      const uid = await createAuthUser(formData.email, formData.password);

      // Step B: Create Database Profile linked to that UID
      const newStudentId = generateStudentId();
      
      // ✅ FIX: Using setDoc with the correct 'doc' import from top of file
      await setDoc(doc(db, "growth_students", uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        course: formData.course,
        track: formData.track,
        studentId: newStudentId,
        status: "Active",
        role: "student", 
        createdAt: serverTimestamp()
      });
      
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "", password: "", course: "DevOps Masterclass", track: "IT" });
      alert(`✅ Student Created!\n\nID: ${newStudentId}\nLogin: ${formData.email}`);
      
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Error: This email is already registered.");
      } else {
        alert("Error adding student: " + error.message);
      }
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? This deletes the profile (but keeps the login account for safety).")) {
      await deleteDoc(doc(db, "growth_students", id));
    }
  };

  // 🔍 Filter
  const filteredStudents = students.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Enrolled Students</h1>
          <p className="text-gray-400 text-sm">Manage Growth School admissions</p>
        </div>
        
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 flex-1 focus-within:border-blue-500 transition-colors">
            <Search className="text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="Search by Name or ID..." 
              className="bg-transparent border-none outline-none text-white text-sm w-full md:w-48 placeholder-gray-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
          >
            <Plus size={18} /> <span className="hidden md:inline">Add Student</span>
          </button>
        </div>
      </div>

      {/* Table View */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-zinc-950 text-gray-200 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Student ID</th>
              <th className="px-6 py-4">Student</th>
              <th className="px-6 py-4">Course</th>
              <th className="px-6 py-4">Phone</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {!loading && filteredStudents.map((student) => (
              <tr key={student.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 font-mono text-xs text-blue-400">
                  {student.studentId || "—"}
                </td>
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white">
                    {student.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-white font-medium">{student.name}</p>
                    <p className="text-xs text-gray-500">{student.email}</p>
                  </div>
                </td>
                <td className="px-6 py-4 text-white">{student.course}</td>
                <td className="px-6 py-4 text-gray-400">{student.phone || "—"}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/10 text-green-400 border border-green-500/20">
                    {student.status || "Active"}
                  </span>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-3">
                  <Link href={`/admin/students/${student.id}`} className="text-blue-400 hover:text-blue-300 transition">
                    <Eye size={16} />
                  </Link>
                  <button onClick={() => handleDelete(student.id)} className="text-zinc-500 hover:text-red-400 transition">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && filteredStudents.length === 0 && <div className="p-8 text-center text-gray-500">No students found.</div>}
      </div>

      {/* 📱 Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {!loading && filteredStudents.map((s) => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-white font-medium">{s.name}</h3>
                   <span className="text-xs font-mono bg-blue-500/10 text-blue-400 px-1.5 py-0.5 rounded border border-blue-500/20">{s.studentId}</span>
                </div>
                <p className="text-xs text-gray-500">{s.email}</p>
              </div>
               <div className="flex gap-3">
                <Link href={`/admin/students/${s.id}`} className="text-blue-400"><Eye size={18}/></Link>
                <button onClick={() => handleDelete(s.id)} className="text-zinc-600 hover:text-red-500"><Trash2 size={18}/></button>
              </div>
            </div>
            <div className="text-sm text-gray-400 flex items-center gap-2"><Phone size={14}/> {s.phone}</div>
            <div className="text-sm text-gray-400 flex items-center gap-2"><BookOpen size={14}/> {s.course}</div>
          </div>
        ))}
      </div>

      {/* 🏳️ MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl p-6 shadow-2xl relative">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-bold text-white mb-1">Add Student & Create Login</h2>
            <p className="text-sm text-gray-400 mb-6">Create profile and set temporary password.</p>
            
            <form onSubmit={handleAddStudent} className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Full Name <span className="text-red-500">*</span></label>
                <input required className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-1" 
                  value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs uppercase font-bold text-gray-500">Email (Login ID) <span className="text-red-500">*</span></label>
                    <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 mt-1 focus-within:border-blue-500">
                      <Mail size={16} className="text-gray-500 mr-2" />
                      <input required type="email" className="w-full bg-transparent py-3 text-white outline-none" 
                        value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
                    </div>
                 </div>
                 <div>
                    <label className="text-xs uppercase font-bold text-gray-500">Set Password <span className="text-red-500">*</span></label>
                    <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 mt-1 focus-within:border-blue-500">
                      <Lock size={16} className="text-gray-500 mr-2" />
                      <input required type="text" className="w-full bg-transparent py-3 text-white outline-none" 
                        placeholder="e.g. Pass@123"
                        value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
                    </div>
                 </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Phone <span className="text-red-500">*</span></label>
                <input required type="tel" className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-1" 
                  value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500">Track</label>
                  <select className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white mt-1"
                    value={formData.track} onChange={(e) => setFormData({...formData, track: e.target.value})}>
                    <option value="IT">IT</option>
                    <option value="Non-IT">Non-IT</option>
                  </select>
                </div>
                <div>
                   <label className="text-xs uppercase font-bold text-gray-500">Course</label>
                   <select className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white mt-1"
                    value={formData.course} onChange={(e) => setFormData({...formData, course: e.target.value})}>
                    <option>DevOps Masterclass</option>
                    <option>AWS Cloud Architect</option>
                    <option>Linux Administration</option>
                    <option>Cyber Security Masterclass</option>
                   </select>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={creating}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 flex items-center justify-center gap-2"
              >
                {creating ? "Creating Account..." : "Create Student Account"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}