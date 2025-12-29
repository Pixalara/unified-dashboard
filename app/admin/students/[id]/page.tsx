"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  deleteDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { 
  Save, 
  Trash2, 
  ArrowLeft, 
  Phone, 
  Mail, 
  User, 
  BookOpen, 
  Layers, 
  Fingerprint 
} from "lucide-react";

export default function StudentDetailPage() {
  const { id } = useParams();
  const router = useRouter();

  const [student, setStudent] = useState<any>(null);
  const [courseList, setCourseList] = useState<string[]>([]); // 🆕 Dynamic Course List
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        if (!id) return;

        // 1. Fetch Student Details
        const studentSnap = await getDoc(doc(db, "growth_students", id as string));
        if (studentSnap.exists()) {
          setStudent(studentSnap.data());
        }

        // 2. Fetch Dynamic Courses from 'courses' collection
        const coursesSnap = await getDocs(collection(db, "courses"));
        const courses = coursesSnap.docs.map(doc => doc.data().title);
        setCourseList(courses);

      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id]);

  // 💾 Update Logic
  const handleChange = (field: string, value: string) => {
    setStudent((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, "growth_students", id as string), student);
      alert("✅ Student profile updated successfully!");
    } catch (e: any) {
      alert("Error updating: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (confirm("🚨 Are you sure? This will permanently delete the student.")) {
      await deleteDoc(doc(db, "growth_students", id as string));
      router.push("/admin/students");
    }
  };

  if (loading) return <div className="p-10 text-gray-400">Loading profile...</div>;
  if (!student) return <div className="p-10 text-red-400">Student not found.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center text-gray-400 hover:text-white transition">
          <ArrowLeft size={18} className="mr-2" /> Back to List
        </button>
        <button onClick={handleDelete} className="text-red-500 hover:bg-red-500/10 px-3 py-2 rounded-lg flex items-center gap-2 transition">
          <Trash2 size={18} /> Delete Student
        </button>
      </div>

      {/* Main Edit Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 shadow-xl">
        <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Edit Student Profile</h1>
            <p className="text-sm text-gray-500">Database ID: {id}</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 transition">
            <Save size={18} /> {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* 🆔 Student ID (Read Only) */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs uppercase font-bold text-blue-400">Pixalara Student ID (Auto-Generated)</label>
            <div className="flex items-center bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-3 cursor-not-allowed">
              <Fingerprint size={18} className="text-blue-500 mr-3" />
              <input 
                className="bg-transparent w-full text-blue-400 font-mono font-bold outline-none"
                value={student.studentId || "Not Assigned"}
                disabled
              />
            </div>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Full Name</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 py-3 focus-within:border-blue-500 transition">
              <User size={18} className="text-gray-500 mr-3" />
              <input className="bg-transparent w-full text-white outline-none" value={student.name || ""} onChange={(e) => handleChange("name", e.target.value)} />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Email Address</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 py-3 focus-within:border-blue-500 transition">
              <Mail size={18} className="text-gray-500 mr-3" />
              <input className="bg-transparent w-full text-white outline-none" value={student.email || ""} onChange={(e) => handleChange("email", e.target.value)} />
            </div>
          </div>

           {/* Phone */}
           <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Phone</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 py-3 focus-within:border-blue-500 transition">
              <Phone size={18} className="text-gray-500 mr-3" />
              <input className="bg-transparent w-full text-white outline-none" value={student.phone || ""} onChange={(e) => handleChange("phone", e.target.value)} />
            </div>
          </div>

          {/* 🎓 Course (Now Dynamic!) */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Course</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 py-3 focus-within:border-blue-500 transition">
              <BookOpen size={18} className="text-gray-500 mr-3" />
              <select 
                className="bg-black w-full text-white outline-none cursor-pointer"
                value={student.course || ""}
                onChange={(e) => handleChange("course", e.target.value)}
              >
                <option value="" disabled>Select a Course</option>
                {/* Dynamically map real courses from DB */}
                {courseList.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Status</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 py-3 focus-within:border-blue-500 transition">
              <select className="bg-black w-full text-white outline-none cursor-pointer" value={student.status || "Active"} onChange={(e) => handleChange("status", e.target.value)}>
                <option value="Enrolled">Enrolled</option>
                <option value="Active">Active</option>
                <option value="Completed">Completed</option>
                <option value="Dropped">Dropped</option>
              </select>
            </div>
          </div>

           {/* Track */}
           <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Track</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 py-3 focus-within:border-blue-500 transition">
              <Layers size={18} className="text-gray-500 mr-3" />
              <select className="bg-black w-full text-white outline-none cursor-pointer" value={student.track || "IT"} onChange={(e) => handleChange("track", e.target.value)}>
                 <option value="IT">IT</option>
                 <option value="Non-IT">Non-IT</option>
              </select>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}