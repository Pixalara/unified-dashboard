"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  setDoc, 
  serverTimestamp 
} from "firebase/firestore";
import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { db } from "@/lib/firebase"; 
import { Search, Trash2, Plus, X, Phone, Edit2, Mail, Lock, Building2, LockKeyhole } from "lucide-react";

interface JobSeeker {
  id: string;
  name: string;
  email: string;
  phone: string;
  domain: string; 
  company: string;
  stage: string; 
}

export default function JobsPage() {
  const [seekers, setSeekers] = useState<JobSeeker[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSeeker, setEditingSeeker] = useState<JobSeeker | null>(null);
  const [creating, setCreating] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: "", 
    email: "", 
    phone: "", 
    password: "", 
    domain: "IT", 
    company: "", 
    stage: "registered"
  });

  // 🔥 Fetch Data
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "job_seekers"), (snapshot) => {
      setSeekers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobSeeker)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 🔐 Helper 1: Create Auth User (Invisible App)
  const createAuthUser = async (email: string, pass: string) => {
    const config = db.app.options; 
    const secondaryAppName = "secondaryAppJob";
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

  // 🔐 Helper 2: Send Password Reset Email
  const handleResetPassword = async (email: string) => {
    if (!email) return alert("No email found for this user.");
    if (!confirm(`Send password reset link to ${email}?`)) return;

    try {
      const auth = getAuth(); // Uses the main app instance
      await sendPasswordResetEmail(auth, email);
      alert(`✅ Reset link sent successfully to ${email}`);
    } catch (error: any) {
      console.error(error);
      alert("Error sending reset link: " + error.message);
    }
  };

  // ➕ Add Candidate (Auth + DB)
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    // ✅ MANDATORY FIELDS CHECK
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        alert("⚠️ Mandatory: Name, Email, Phone, and Password are required.");
        setCreating(false);
        return;
    }

    try {
      // 1. Create Login
      const uid = await createAuthUser(formData.email, formData.password);

      // 2. Create Profile linked to UID
      await setDoc(doc(db, "job_seekers", uid), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        domain: formData.domain,
        company: formData.company,
        stage: "registered",
        role: "job_seeker",
        createdAt: serverTimestamp()
      });

      setIsAddModalOpen(false);
      setFormData({ name: "", email: "", phone: "", password: "", domain: "IT", company: "", stage: "registered" });
      alert(`✅ Candidate Added!\nLogin: ${formData.email}`);
    } catch (error: any) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        alert("Error: Email already registered.");
      } else {
        alert("Error: " + error.message);
      }
    } finally {
        setCreating(false);
    }
  };

  // ✏️ Update Candidate
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeeker) return;
    
    await updateDoc(doc(db, "job_seekers", editingSeeker.id), {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        domain: formData.domain,
        company: formData.company,
        stage: formData.stage
    });
    
    setIsEditModalOpen(false);
    setEditingSeeker(null);
  };

  const openEditModal = (seeker: JobSeeker) => {
    setEditingSeeker(seeker);
    setFormData({ 
        name: seeker.name, 
        email: seeker.email, 
        phone: seeker.phone, 
        password: "", // Password not editable here
        domain: seeker.domain, 
        company: seeker.company,
        stage: seeker.stage 
    });
    setIsEditModalOpen(true);
  };

  // 🔄 Stage Change
  const handleStageChange = async (id: string, newStage: string) => {
    await updateDoc(doc(db, "job_seekers", id), { stage: newStage });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this candidate? Profile will be removed.")) {
      await deleteDoc(doc(db, "job_seekers", id));
    }
  };

  // Filter & Styles
  const filtered = seekers.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));
  
  const getStageColor = (stage: string) => {
    if(stage === 'placed') return 'bg-green-500/20 text-green-500 border-green-500/30';
    if(stage === 'interview') return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    if(stage === 'rejected') return 'bg-red-500/20 text-red-500 border-red-500/30';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div>
           <h1 className="text-2xl font-bold text-white">Candidate Pipeline</h1>
           <p className="text-gray-400 text-sm">Track placement progress & logins</p>
        </div>
        <div className="flex gap-2">
          <input 
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-white text-sm w-full md:w-64 outline-none focus:border-purple-500 transition"
            placeholder="Search candidate..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
          <button onClick={() => setIsAddModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
            <Plus size={18} /> Add Candidate
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="hidden md:block bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-gray-400">
          <thead className="bg-zinc-950 text-gray-200 uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Candidate</th>
              <th className="px-6 py-4">Domain</th>
              <th className="px-6 py-4">Target Company</th>
              <th className="px-6 py-4">Stage</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {!loading && filtered.map((s) => (
              <tr key={s.id} className="hover:bg-zinc-800/50 transition">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                  <p className="text-xs text-gray-600">{s.phone}</p>
                </td>
                <td className="px-6 py-4"><span className="bg-zinc-800 px-2 py-1 rounded text-xs">{s.domain}</span></td>
                <td className="px-6 py-4 text-white">{s.company || "—"}</td>
                <td className="px-6 py-4">
                  <select 
                    value={s.stage}
                    onChange={(e) => handleStageChange(s.id, e.target.value)}
                    className={`px-2 py-1 rounded text-xs font-bold border uppercase outline-none cursor-pointer ${getStageColor(s.stage)}`}
                  >
                    <option value="registered" className="bg-zinc-900 text-gray-400">Registered</option>
                    <option value="interview" className="bg-zinc-900 text-orange-500">Interview</option>
                    <option value="placed" className="bg-zinc-900 text-green-500">Placed</option>
                    <option value="rejected" className="bg-zinc-900 text-red-500">Rejected</option>
                  </select>
                </td>
                <td className="px-6 py-4 text-right flex justify-end gap-2">
                  {/* 🆕 Reset Password Button */}
                  <button 
                    onClick={() => handleResetPassword(s.email)} 
                    className="text-yellow-500 hover:bg-yellow-900/30 p-2 rounded"
                    title="Send Password Reset Email"
                  >
                    <LockKeyhole size={16} />
                  </button>

                  <button onClick={() => openEditModal(s)} className="text-blue-400 hover:bg-blue-900/30 p-2 rounded"><Edit2 size={16}/></button>
                  <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:bg-red-900/30 p-2 rounded"><Trash2 size={16}/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 📱 Mobile View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filtered.map(s => (
          <div key={s.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-xl space-y-3">
             <div className="flex justify-between">
                <h3 className="text-white font-bold">{s.name}</h3>
                <div className="flex gap-2">
                    {/* Mobile Reset Button */}
                    <button onClick={() => handleResetPassword(s.email)} className="text-yellow-500 text-xs"><LockKeyhole size={16}/></button>
                    <button onClick={() => openEditModal(s)} className="text-blue-400 text-xs">Edit</button>
                </div>
             </div>
             <div className="flex items-center gap-2">
                <select 
                    value={s.stage}
                    onChange={(e) => handleStageChange(s.id, e.target.value)}
                    className={`w-full px-2 py-2 rounded text-xs font-bold border uppercase ${getStageColor(s.stage)}`}
                  >
                    <option value="registered" className="bg-zinc-900">Registered</option>
                    <option value="interview" className="bg-zinc-900">Interview</option>
                    <option value="placed" className="bg-zinc-900">Placed</option>
                    <option value="rejected" className="bg-zinc-900">Rejected</option>
                </select>
             </div>
          </div>
        ))}
      </div>

      {/* 🏳️ MODAL: Add & Edit (Compact & Scrollable) */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          {/* ✅ UPDATED CONTAINER: Scrollable with max-h and overflow */}
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={20}/></button>
            <h2 className="text-xl font-bold text-white mb-4">{isEditModalOpen ? "Edit Candidate" : "Add Candidate"}</h2>
            
            <form onSubmit={isEditModalOpen ? handleUpdate : handleAdd} className="space-y-3"> {/* Compact spacing */}
              
              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Full Name <span className="text-red-500">*</span></label>
                <input required className="w-full bg-black border border-zinc-800 rounded p-2.5 text-white mt-1 outline-none focus:border-purple-500" 
                    placeholder="John Doe" 
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>

              {/* Login Details Group (Compact) */}
              <div className="p-3 bg-zinc-950/50 border border-zinc-800 rounded-lg space-y-2">
                  <p className="text-xs text-purple-400 font-bold uppercase">Login Credentials</p>
                  <div>
                    <label className="text-xs text-gray-500 flex items-center gap-1"><Mail size={12}/> Email <span className="text-red-500">*</span></label>
                    <input required type="email" className="w-full bg-black border border-zinc-800 rounded p-2 text-white mt-1 text-sm outline-none focus:border-purple-500" 
                        placeholder="john@example.com" 
                        value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} 
                    />
                  </div>
                  {/* Show Password only in Add Mode */}
                  {!isEditModalOpen && (
                      <div>
                        <label className="text-xs text-gray-500 flex items-center gap-1"><Lock size={12}/> Set Password <span className="text-red-500">*</span></label>
                        <input required type="text" className="w-full bg-black border border-zinc-800 rounded p-2 text-white mt-1 text-sm outline-none focus:border-purple-500" 
                            placeholder="Password123" 
                            value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} 
                        />
                      </div>
                  )}
              </div>

              <div>
                <label className="text-xs uppercase font-bold text-gray-500">Phone <span className="text-red-500">*</span></label>
                <input required className="w-full bg-black border border-zinc-800 rounded p-2.5 text-white mt-1 outline-none focus:border-purple-500" 
                    placeholder="+91..." 
                    value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-xs uppercase font-bold text-gray-500">Domain</label>
                   <select className="w-full bg-black border border-zinc-800 rounded p-2.5 text-white mt-1 outline-none focus:border-purple-500" 
                    value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})}>
                        <option>IT</option><option>Non-IT</option>
                   </select>
                </div>
                <div>
                   <label className="text-xs uppercase font-bold text-gray-500">Target Company</label>
                   <input className="w-full bg-black border border-zinc-800 rounded p-2.5 text-white mt-1 outline-none focus:border-purple-500" 
                    placeholder="e.g. Google" 
                    value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} 
                   />
                </div>
              </div>

              <button type="submit" disabled={creating} className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded mt-2 transition">
                {creating ? "Creating..." : (isEditModalOpen ? "Update Details" : "Create Candidate")}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}