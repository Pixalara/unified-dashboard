"use client";

import { useEffect, useState, useRef } from "react";
import { 
  collection, 
  getDocs, 
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query, 
  orderBy 
} from "firebase/firestore";
// Auth imports
import { initializeApp, getApp, deleteApp } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { db } from "@/lib/firebase"; 
import { 
  Plus, 
  X, 
  Loader2, 
  Search,
  MoreVertical,
  Mail,
  Phone,
  Target,
  Eye, 
  Briefcase,
  User,
  Trash2,
  Edit,
  GraduationCap, // Added Icon
  Code,          // Added Icon
  FileText,
  Calendar,      // Added Icon
  ExternalLink   // Added Icon
} from "lucide-react";

export default function CandidatePipelinePage() {
  const [aspirants, setAspirants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // --- UI STATES ---
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null); 
  const menuRef = useRef<HTMLDivElement>(null); 

  // --- MODAL STATES ---
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  
  const [selectedAspirant, setSelectedAspirant] = useState<any>(null); 
  
  // --- FORM STATES ---
  const [isProcessing, setIsProcessing] = useState(false);
  
  const [newSeeker, setNewSeeker] = useState({
    name: "", email: "", password: "", phone: "", targetField: "IT"
  });

  const [editForm, setEditForm] = useState({
    id: "", name: "", phone: "", targetField: "", stage: ""
  });

  useEffect(() => {
    fetchAspirants();
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function fetchAspirants() {
    try {
        const q = query(collection(db, "job_seekers"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        setAspirants(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e) {
        console.error("Error fetching pipeline:", e);
    } finally {
        setLoading(false);
    }
  }

  const handleViewProfile = (aspirant: any) => {
      setSelectedAspirant(aspirant);
      setIsProfileModalOpen(true);
      setActiveMenuId(null);
  };

  const openEditModal = (aspirant: any) => {
      setEditForm({
          id: aspirant.id,
          name: aspirant.name,
          phone: aspirant.phone,
          targetField: aspirant.targetField,
          stage: aspirant.stage || "registered"
      });
      setIsEditModalOpen(true);
      setActiveMenuId(null);
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };

  const handleCreateAspirant = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    let secondaryApp;
    try {
        const config = getApp().options; 
        secondaryApp = initializeApp(config, "SecondaryApp");
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, newSeeker.email, newSeeker.password);
        const uid = userCredential.user.uid;

        await setDoc(doc(db, "job_seekers", uid), {
            name: newSeeker.name,
            email: newSeeker.email,
            phone: newSeeker.phone,
            targetField: newSeeker.targetField,
            role: "job_seeker",
            stage: "registered",
            createdAt: new Date(),
            highestEducation: "", dob: "", gender: "", education: {}, skills: [], experience: []
        });

        alert(`✅ Job Aspirant Created!`);
        setIsCreateModalOpen(false);
        setNewSeeker({ name: "", email: "", password: "", phone: "", targetField: "IT" });
        fetchAspirants();
    } catch (error: any) {
        alert("❌ Error: " + error.message);
    } finally {
        if (secondaryApp) await deleteApp(secondaryApp);
        setIsProcessing(false);
    }
  };

  const handleUpdateAspirant = async (e: React.FormEvent) => {
      e.preventDefault();
      if(!editForm.id) return;
      setIsProcessing(true);
      try {
          const docRef = doc(db, "job_seekers", editForm.id);
          await updateDoc(docRef, {
              name: editForm.name,
              phone: editForm.phone,
              targetField: editForm.targetField,
              stage: editForm.stage 
          });
          alert("✅ Profile & Status Updated!");
          setIsEditModalOpen(false);
          fetchAspirants();
      } catch (error: any) {
          console.error("Update error:", error);
          alert("❌ Update Failed");
      } finally {
          setIsProcessing(false);
      }
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Are you sure you want to delete this candidate? This cannot be undone.")) return;
      try {
          await deleteDoc(doc(db, "job_seekers", id));
          alert("🗑️ Candidate Deleted");
          fetchAspirants();
      } catch (error) {
          alert("❌ Delete Failed");
      }
  };

  const filteredAspirants = aspirants.filter(a => 
      a.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
              <h1 className="text-3xl font-bold text-white">Candidate Pipeline</h1>
              <p className="text-gray-400">Manage, track, and update candidate status.</p>
          </div>
          <button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-bold hover:bg-blue-500 transition flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
                <Plus size={20} /> Add Job Aspirant
          </button>
      </div>

      {/* SEARCH BAR */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-2 flex items-center max-w-md">
         <Search className="text-gray-500 ml-3" size={20} />
         <input 
            type="text" 
            placeholder="Search aspirants..." 
            className="bg-transparent text-white p-2.5 w-full outline-none placeholder:text-gray-600"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
         />
      </div>

      {/* TABLE */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-visible min-h-[400px]">
          {loading ? (
             <div className="p-10 text-center text-gray-500">Loading pipeline...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-black/50 text-gray-400 text-xs uppercase font-bold border-b border-zinc-800">
                      <tr>
                          <th className="p-4">Name</th>
                          <th className="p-4">Contact</th>
                          <th className="p-4">Target Field</th>
                          <th className="p-4">Stage</th>
                          <th className="p-4">View</th>
                          <th className="p-4 text-right">Action</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                      {filteredAspirants.map((aspirant) => (
                          <tr key={aspirant.id} className="hover:bg-white/5 transition relative group">
                              <td className="p-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-gray-300 text-sm">
                                          {aspirant.name?.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="text-white font-medium text-sm">{aspirant.name}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-4 text-sm text-gray-400">
                                  <div className="flex flex-col gap-1">
                                      <span>{aspirant.email}</span>
                                      <span className="text-xs text-zinc-600">{aspirant.phone}</span>
                                  </div>
                              </td>
                              <td className="p-4 text-sm text-gray-300">
                                  <span className="px-2 py-1 bg-zinc-800 rounded text-xs border border-zinc-700">
                                    {aspirant.targetField || "Not Set"}
                                  </span>
                              </td>
                              <td className="p-4">
                                  <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wide border ${
                                      aspirant.stage === 'placed' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                                      aspirant.stage === 'interview' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                                      'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                  }`}>
                                      {aspirant.stage || 'Registered'}
                                  </span>
                              </td>
                              <td className="p-4">
                                  <button 
                                    onClick={() => handleViewProfile(aspirant)}
                                    className="p-2 hover:bg-blue-500/20 text-blue-400 rounded-lg transition"
                                    title="View Profile"
                                  >
                                      <Eye size={18} />
                                  </button>
                              </td>
                              <td className="p-4 text-right relative">
                                  <button 
                                    onClick={(e) => toggleMenu(aspirant.id, e)}
                                    className={`p-2 rounded-lg transition ${activeMenuId === aspirant.id ? 'bg-zinc-800 text-white' : 'text-gray-500 hover:text-white hover:bg-zinc-800'}`}
                                  >
                                      <MoreVertical size={18} />
                                  </button>
                                  {activeMenuId === aspirant.id && (
                                      <div 
                                        ref={menuRef}
                                        className="absolute right-8 top-8 w-48 bg-zinc-950 border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100"
                                      >
                                          <button 
                                            onClick={() => openEditModal(aspirant)}
                                            className="w-full text-left px-4 py-3 text-sm text-gray-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 border-b border-zinc-900"
                                          >
                                              <Edit size={14} /> Edit / Change Status
                                          </button>
                                          <button 
                                            onClick={() => handleDelete(aspirant.id)}
                                            className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2"
                                          >
                                              <Trash2 size={14} /> Delete Aspirant
                                          </button>
                                      </div>
                                  )}
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
            </div>
          )}
      </div>

      {/* 🟢 EDIT & STATUS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Modify Aspirant</h2>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                </div>
                <form onSubmit={handleUpdateAspirant} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Full Name</label>
                        <input className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" 
                            value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Phone</label>
                        <input className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none" 
                            value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Target Field</label>
                        <select className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-blue-500 outline-none"
                            value={editForm.targetField} onChange={e => setEditForm({...editForm, targetField: e.target.value})}>
                            <option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="Both IT & Non-IT">Both</option>
                        </select>
                    </div>
                    <div className="pt-2 border-t border-zinc-800 mt-2">
                        <label className="text-xs font-bold text-blue-400 uppercase block mb-2">Update Application Stage</label>
                        <div className="grid grid-cols-3 gap-2">
                            {['registered', 'interview', 'placed'].map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setEditForm({...editForm, stage: s})}
                                    className={`py-2 rounded-lg text-xs font-bold border transition ${
                                        editForm.stage === s 
                                        ? 'bg-blue-600 text-white border-blue-500' 
                                        : 'bg-zinc-800 text-gray-400 border-zinc-700 hover:bg-zinc-700'
                                    }`}
                                >
                                    {s.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <button type="submit" disabled={isProcessing} className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg mt-4">
                        {isProcessing ? "Saving..." : "Save Changes"}
                    </button>
                </form>
            </div>
        </div>
      )}

      {/* 👁️ VIEW FULL PROFILE MODAL */}
      {isProfileModalOpen && selectedAspirant && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
                
                {/* Header */}
                <div className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10 border-b border-zinc-800 p-6 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-gray-400 border-2 border-zinc-700">{selectedAspirant.name?.charAt(0)}</div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedAspirant.name}</h2>
                            <p className="text-gray-400 text-sm flex items-center gap-2"><Mail size={14}/> {selectedAspirant.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 uppercase font-bold">{selectedAspirant.stage || "Registered"}</span>
                                <span className="text-xs bg-zinc-800 text-gray-300 px-2 py-1 rounded border border-zinc-700 flex items-center gap-1"><Target size={12}/> {selectedAspirant.targetField || "Any"}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-gray-500 hover:text-white"><X size={24} /></button>
                </div>

                <div className="p-6 space-y-8">
                    
                    {/* 1. Resume */}
                    <div className="bg-black/40 border border-zinc-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase mb-3 flex items-center gap-2">
                            <FileText size={16} className="text-pink-500"/> Resume / Link
                        </h3>
                        {selectedAspirant.resumeUrl ? (
                            <a href={selectedAspirant.resumeUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between bg-zinc-800 hover:bg-zinc-700 p-3 rounded-lg group transition">
                                <span className="text-sm text-white font-medium truncate max-w-[200px]">{selectedAspirant.name}_Resume</span>
                                <span className="text-xs text-blue-400 flex items-center gap-1 group-hover:underline">Open Document <ExternalLink size={12}/></span>
                            </a>
                        ) : <p className="text-sm text-gray-500 italic">No resume provided.</p>}
                    </div>

                    {/* 2. Personal Details */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><User className="text-orange-500" size={20}/> Personal Details</h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-800"><p className="text-xs text-gray-500 mb-1">Phone</p><p className="text-sm text-white">{selectedAspirant.phone || "N/A"}</p></div>
                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-800"><p className="text-xs text-gray-500 mb-1">DOB</p><p className="text-sm text-white">{selectedAspirant.dob || "N/A"}</p></div>
                            <div className="bg-zinc-800/50 p-3 rounded-lg border border-zinc-800"><p className="text-xs text-gray-500 mb-1">Gender</p><p className="text-sm text-white">{selectedAspirant.gender || "N/A"}</p></div>
                        </div>
                    </div>

                    {/* 3. Skills */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Code className="text-purple-500" size={20}/> Top Skills</h3>
                        <div className="flex flex-wrap gap-2">
                            {selectedAspirant.skills && selectedAspirant.skills.length > 0 ? (
                                selectedAspirant.skills.map((skill: string) => (
                                    <span key={skill} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-full text-sm">{skill}</span>
                                ))
                            ) : <p className="text-sm text-gray-500 italic">No skills added.</p>}
                        </div>
                    </div>

                    {/* 4. Education */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><GraduationCap className="text-blue-500" size={20}/> Education</h3>
                        <div className="space-y-3">
                            {/* UG */}
                            <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800">
                                <div className="flex justify-between items-start">
                                    <div><p className="text-white font-bold">{selectedAspirant.education?.degree || "Degree Not Set"}</p><p className="text-sm text-gray-400">{selectedAspirant.education?.college || "College Not Set"}</p></div>
                                    <span className="text-xs bg-zinc-700 text-white px-2 py-1 rounded">{selectedAspirant.education?.year || "Year"}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">CGPA: <span className="text-white">{selectedAspirant.education?.cgpa || "N/A"}</span></p>
                            </div>
                            {/* PG */}
                            {selectedAspirant.education?.pgCollege && (
                                <div className="bg-zinc-800/30 p-4 rounded-xl border border-zinc-800">
                                    <div className="flex justify-between items-start">
                                        <div><p className="text-white font-bold">{selectedAspirant.education?.pgDegree}</p><p className="text-sm text-gray-400">{selectedAspirant.education?.pgCollege}</p></div>
                                        <span className="text-xs bg-zinc-700 text-white px-2 py-1 rounded">{selectedAspirant.education?.pgYear}</span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">CGPA: <span className="text-white">{selectedAspirant.education?.pgCgpa}</span></p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. Experience */}
                    <div>
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><Briefcase className="text-green-500" size={20}/> Experience</h3>
                        <div className="space-y-4">
                            {selectedAspirant.experience && selectedAspirant.experience.length > 0 ? (
                                selectedAspirant.experience.map((exp: any, idx: number) => (
                                    <div key={idx} className="relative pl-4 border-l-2 border-zinc-800">
                                        <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                        <h4 className="text-white font-bold">{exp.role}</h4>
                                        <p className="text-sm text-blue-400 font-medium">{exp.company}</p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {exp.startMonth} {exp.startYear} - {exp.isCurrent ? "Present" : `${exp.endMonth} ${exp.endYear}`}
                                        </p>
                                        {exp.description && <p className="text-sm text-gray-400 mt-2">{exp.description}</p>}
                                    </div>
                                ))
                            ) : <p className="text-sm text-gray-500 italic">No experience added.</p>}
                        </div>
                    </div>

                </div>
            </div>
        </div>
      )}

      {/* CREATE MODAL (Standard) */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl">
                <button onClick={() => setIsCreateModalOpen(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={24} /></button>
                <h2 className="text-2xl font-bold text-white mb-6">Add Job Aspirant</h2>
                <form onSubmit={handleCreateAspirant} className="space-y-4">
                    <input required className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white" placeholder="Full Name" value={newSeeker.name} onChange={e => setNewSeeker({...newSeeker, name: e.target.value})} />
                    <input required type="email" className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white" placeholder="Email" value={newSeeker.email} onChange={e => setNewSeeker({...newSeeker, email: e.target.value})} />
                    <input required type="text" className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white" placeholder="Password" value={newSeeker.password} onChange={e => setNewSeeker({...newSeeker, password: e.target.value})} />
                    <input required type="tel" className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white" placeholder="Phone" value={newSeeker.phone} onChange={e => setNewSeeker({...newSeeker, phone: e.target.value})} />
                    <select className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white" value={newSeeker.targetField} onChange={e => setNewSeeker({...newSeeker, targetField: e.target.value})}>
                        <option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="Both IT & Non-IT">Both</option>
                    </select>
                    <button type="submit" disabled={isProcessing} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg mt-4 flex justify-center items-center gap-2">
                        {isProcessing ? <Loader2 className="animate-spin"/> : <Plus size={20}/>} {isProcessing ? "Creating..." : "Create Aspirant"}
                    </button>
                </form>
            </div>
        </div>
      )}

    </div>
  );
}