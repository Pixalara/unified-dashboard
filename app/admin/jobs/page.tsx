"use client";

import { useEffect, useState } from "react";
import { 
  collection, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc,
  addDoc,
  serverTimestamp 
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { Search, Trash2, Plus, X, Phone, Edit2 } from "lucide-react";

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

  const [formData, setFormData] = useState({
    name: "", email: "", phone: "", domain: "IT", company: "", stage: "registered"
  });

  // 🔥 Fetch Data
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "job_seekers"), (snapshot) => {
      setSeekers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as JobSeeker)));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ➕ Add Candidate
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return alert("Name/Email required");
    await addDoc(collection(db, "job_seekers"), { ...formData, role: "job_seeker", createdAt: serverTimestamp() });
    setIsAddModalOpen(false);
    setFormData({ name: "", email: "", phone: "", domain: "IT", company: "", stage: "registered" });
  };

  // ✏️ Edit Candidate (Full Control)
  const openEditModal = (seeker: JobSeeker) => {
    setEditingSeeker(seeker);
    setFormData({ 
        name: seeker.name, 
        email: seeker.email, 
        phone: seeker.phone, 
        domain: seeker.domain, 
        company: seeker.company,
        stage: seeker.stage 
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSeeker) return;
    await updateDoc(doc(db, "job_seekers", editingSeeker.id), formData);
    setIsEditModalOpen(false);
    setEditingSeeker(null);
  };

  // 🔄 Stage Change (Instant Dropdown)
  const handleStageChange = async (id: string, newStage: string) => {
    await updateDoc(doc(db, "job_seekers", id), { stage: newStage });
  };

  const handleDelete = async (id: string) => {
    if (confirm("Delete this candidate?")) await deleteDoc(doc(db, "job_seekers", id));
  };

  // Filter
  const filtered = seekers.filter(s => s.name?.toLowerCase().includes(searchTerm.toLowerCase()));

  // Style helper
  const getStageColor = (stage: string) => {
    if(stage === 'placed') return 'bg-green-500/20 text-green-500 border-green-500/30';
    if(stage === 'interview') return 'bg-orange-500/20 text-orange-500 border-orange-500/30';
    if(stage === 'rejected') return 'bg-red-500/20 text-red-500 border-red-500/30';
    return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">Candidate Pipeline</h1>
        <div className="flex gap-2">
          <input 
            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 text-white text-sm w-full md:w-64"
            placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          />
          <button onClick={() => setIsAddModalOpen(true)} className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex gap-2">
            <Plus size={18} /> Add
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
              <th className="px-6 py-4">Stage (Full Control)</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {!loading && filtered.map((s) => (
              <tr key={s.id} className="hover:bg-zinc-800/50">
                <td className="px-6 py-4">
                  <p className="text-white font-medium">{s.name}</p>
                  <p className="text-xs text-gray-500">{s.email}</p>
                  <p className="text-xs text-gray-600">{s.phone}</p>
                </td>
                <td className="px-6 py-4"><span className="bg-zinc-800 px-2 py-1 rounded text-xs">{s.domain}</span></td>
                <td className="px-6 py-4 text-white">{s.company || "—"}</td>
                <td className="px-6 py-4">
                  {/* 🔥 FULL CONTROL DROPDOWN */}
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
                <button onClick={() => openEditModal(s)} className="text-blue-400 text-xs">Edit</button>
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

      {/* 🏳️ MODAL: Add & Edit (Reused Structure) */}
      {(isAddModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-xl p-6 relative">
            <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); }} className="absolute top-4 right-4 text-gray-500"><X size={20}/></button>
            <h2 className="text-xl font-bold text-white mb-4">{isEditModalOpen ? "Edit Candidate" : "Add Candidate"}</h2>
            <form onSubmit={isEditModalOpen ? handleUpdate : handleAdd} className="space-y-4">
              <input required className="w-full bg-black border border-zinc-800 rounded p-3 text-white" placeholder="Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              <input required className="w-full bg-black border border-zinc-800 rounded p-3 text-white" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
              <input required className="w-full bg-black border border-zinc-800 rounded p-3 text-white" placeholder="Phone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
              <div className="grid grid-cols-2 gap-4">
                <select className="bg-black border border-zinc-800 rounded p-3 text-white" value={formData.domain} onChange={e => setFormData({...formData, domain: e.target.value})}><option>IT</option><option>Non-IT</option></select>
                <input className="bg-black border border-zinc-800 rounded p-3 text-white" placeholder="Company" value={formData.company} onChange={e => setFormData({...formData, company: e.target.value})} />
              </div>
              <button type="submit" className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded mt-2">{isEditModalOpen ? "Update" : "Save"}</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}