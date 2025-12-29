"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  deleteDoc, 
  doc,
  serverTimestamp 
} from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth"; // Note: This requires client-side auth handling or a cloud function ideally
import { db, auth } from "@/lib/firebase"; 
import { 
  Search, 
  Plus, 
  Trash2, 
  UserCheck, 
  Mail, 
  Phone,
  BookOpen,
  X
} from "lucide-react";

// Define Mentor Shape based on likely needs
interface Mentor {
  id: string;
  name: string;
  email: string;
  phone: string;
  expertise: string; // e.g., "DevOps", "Cloud"
  status: "Active" | "Inactive";
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    expertise: "",
    password: "" // Temporary password for creating auth user
  });

  // 🔥 1. Real-time Data Fetching
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "mentors"), (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Mentor[];
      setMentors(list);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ➕ 2. Add New Mentor
  const handleAddMentor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) return;

    try {
      // Step A: Create Auth User (Note: This logs you in as the new user immediately in client-side auth. 
      // Ideally, use a secondary app instance or Cloud Function. For this demo, we'll just add to DB)
      
      // ✅ Best Practice: Just add to DB first. 
      // You should create the Auth account via the Firebase Console or a specific Admin SDK script 
      // to avoid logging out the current Admin.
      
      await addDoc(collection(db, "mentors"), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        expertise: formData.expertise,
        status: "Active",
        role: "mentor",
        createdAt: serverTimestamp()
      });

      setFormData({ name: "", email: "", phone: "", expertise: "", password: "" });
      setIsModalOpen(false);
      alert("Mentor added to database successfully! (Don't forget to create their Auth account in Firebase Console)");
    } catch (error: any) {
      console.error("Error adding mentor:", error);
      alert("Error: " + error.message);
    }
  };

  // 🗑️ 3. Delete Mentor
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to remove this mentor?")) {
      await deleteDoc(doc(db, "mentors", id));
    }
  };

  // 🔍 4. Filter
  const filteredMentors = mentors.filter((m) =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.expertise?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* 🟢 Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Mentors & Faculty</h1>
          <p className="text-gray-400 text-sm">Manage Pixalara Growth School instructors</p>
        </div>
        
        <div className="flex gap-2">
           {/* Search */}
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
          
          {/* Add Button */}
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition"
          >
            <Plus size={18} /> <span className="hidden md:inline">Add Mentor</span>
          </button>
        </div>
      </div>

      {/* 🔄 Loading */}
      {loading && <div className="text-center py-20 text-gray-500 animate-pulse">Loading mentors...</div>}

      {/* 📱 Mobile View: Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {!loading && filteredMentors.map((mentor) => (
          <div key={mentor.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold">
                  {mentor.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-white font-medium">{mentor.name}</h3>
                  <p className="text-xs text-blue-400">{mentor.expertise}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(mentor.id)} className="text-zinc-600 hover:text-red-500">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="space-y-2 pt-2 border-t border-zinc-800/50">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} /> {mentor.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Phone size={14} /> {mentor.phone || "N/A"}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 💻 Desktop View: Table */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-zinc-950 text-gray-200 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Mentor Name</th>
              <th className="px-6 py-4">Expertise</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {!loading && filteredMentors.map((mentor) => (
              <tr key={mentor.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="px-6 py-4 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-white">
                    {mentor.name?.charAt(0)}
                  </div>
                  <span className="text-white font-medium">{mentor.name}</span>
                </td>
                <td className="px-6 py-4 text-blue-400">{mentor.expertise}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col text-xs gap-0.5">
                    <span>{mentor.email}</span>
                    <span className="text-gray-500">{mentor.phone}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                   <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                    Active
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <button 
                    onClick={() => handleDelete(mentor.id)}
                    className="text-gray-500 hover:text-red-400 transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {!loading && filteredMentors.length === 0 && (
          <div className="p-8 text-center text-gray-500">No mentors found. Add one to get started.</div>
        )}
      </div>

      {/* 🏳️ MODAL: Add Mentor */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-bold text-white mb-1">Add New Mentor</h2>
            <p className="text-sm text-gray-400 mb-6">Enter details to onboard a new faculty member.</p>
            
            <form onSubmit={handleAddMentor} className="space-y-4">
              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Full Name</label>
                <input 
                  required
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-1"
                  placeholder="e.g. Dr. Emily Chen"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase font-bold text-gray-500">Expertise</label>
                  <input 
                    required
                    className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-1"
                    placeholder="e.g. AI/ML"
                    value={formData.expertise}
                    onChange={(e) => setFormData({...formData, expertise: e.target.value})}
                  />
                </div>
                <div>
                   <label className="text-xs uppercase font-bold text-gray-500">Phone</label>
                  <input 
                    className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-1"
                    placeholder="+91..."
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Email Address</label>
                <input 
                  type="email" required
                  className="w-full bg-black border border-zinc-800 rounded-lg p-3 text-white focus:border-blue-500 outline-none mt-1"
                  placeholder="mentor@pixalara.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                />
              </div>

               {/* Note about Password */}
               <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg text-xs text-yellow-200">
                  ⚠️ <strong>Note:</strong> This form adds the mentor to the database. You must also create an account for them in 
                  <span className="font-mono bg-black/50 px-1 rounded mx-1">Firebase Auth</span> 
                  with the email above.
               </div>

              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-2 transition"
              >
                Save Mentor
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}