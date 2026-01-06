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
  GraduationCap, 
  Code,
  FileText,
  Calendar,
  ExternalLink,
  Users, // Icon for Gender
  CreditCard // 💳 Icon for Fees
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
  
  // Create Form State
  const [newSeeker, setNewSeeker] = useState({
    name: "", email: "", password: "", phone: "", targetField: "", gender: "" 
  });

  // Edit Form State (✅ Added Fee Fields)
  const [editForm, setEditForm] = useState({
    id: "", name: "", phone: "", targetField: "", stage: "", remarks: "", gender: "",
    registrationFee: "Pending", finalFee: "Pending" 
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
          stage: aspirant.stage || "registered",
          remarks: aspirant.remarks || "",
          gender: aspirant.gender || "",
          // ✅ Load existing fees or default to Pending
          registrationFee: aspirant.registrationFee || "Pending",
          finalFee: aspirant.finalFee || "Pending"
      });
      setIsEditModalOpen(true);
      setActiveMenuId(null);
  };

  const toggleMenu = (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };

  // --- ACTIONS ---

  const handleCreateAspirant = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🛑 STRICT VALIDATION
    if (!newSeeker.name || !newSeeker.email || !newSeeker.password || !newSeeker.phone || !newSeeker.gender || !newSeeker.targetField) {
        alert("❌ All fields are mandatory. Please fill in all details.");
        return;
    }

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
            gender: newSeeker.gender,
            targetField: newSeeker.targetField,
            role: "job_seeker",
            stage: "registered",
            // ✅ Default Fees to Pending on Creation
            registrationFee: "Pending",
            finalFee: "Pending",
            createdAt: new Date(),
            highestEducation: "", dob: "", education: {}, skills: [], experience: []
        });

        alert(`✅ Job Aspirant Created!`);
        setIsCreateModalOpen(false);
        setNewSeeker({ name: "", email: "", password: "", phone: "", targetField: "", gender: "" });
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
              gender: editForm.gender,
              targetField: editForm.targetField,
              stage: editForm.stage,
              remarks: editForm.remarks,
              // ✅ Save Fee Status
              registrationFee: editForm.registrationFee,
              finalFee: editForm.finalFee
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

  // 🗑️ DELETE FUNCTION
  const handleDelete = async (id: string) => {
      if(!confirm("⚠️ Are you sure? This will delete the Login Credentials AND the Profile Data permanently.")) return;
      
      try {
          const response = await fetch('/api/delete-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ uid: id }),
          });

          if (!response.ok) {
              console.warn("User might already be deleted from Auth. Proceeding to delete Profile...");
          }

          await deleteDoc(doc(db, "job_seekers", id));
          
          alert("✅ User deleted successfully.");
          fetchAspirants(); 
      } catch (error: any) {
          console.error(error);
          alert("❌ Delete Failed: " + error.message);
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
                          <th className="p-4">Fees Status</th> {/* ✅ New Column */}
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
                              
                              {/* ✅ Fee Status Display in Table */}
                              <td className="p-4 text-xs">
                                  <div className="flex flex-col gap-1">
                                      <span className={`px-2 py-0.5 rounded border ${aspirant.registrationFee === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                          Reg: {aspirant.registrationFee || 'Pending'}
                                      </span>
                                      <span className={`px-2 py-0.5 rounded border ${aspirant.finalFee === 'Paid' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                          Final: {aspirant.finalFee || 'Pending'}
                                      </span>
                                  </div>
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

      {/* EDIT & STATUS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-2xl p-6 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Modify Aspirant</h2>
                    <button onClick={() => setIsEditModalOpen(false)} className="text-gray-500 hover:text-white"><X size={20}/></button>
                </div>
                <form onSubmit={handleUpdateAspirant} className="space-y-4">
                    {/* Basic Fields */}
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
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Gender</label>
                            <select className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white"
                                value={editForm.gender} onChange={e => setEditForm({...editForm, gender: e.target.value})}>
                                <option value="">Select</option><option value="Male">Male</option><option value="Female">Female</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Target Field</label>
                            <select className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white"
                                value={editForm.targetField} onChange={e => setEditForm({...editForm, targetField: e.target.value})}>
                                <option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="Both IT & Non-IT">Both</option>
                            </select>
                        </div>
                    </div>

                    {/* ✅ FEE STATUS SECTION */}
                    <div className="p-4 bg-zinc-800/30 rounded-xl border border-zinc-800">
                        <label className="text-xs font-bold text-green-400 uppercase block mb-3 flex items-center gap-2">
                             <CreditCard size={14}/> Fee Management
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase mb-1 block">Registration Fee</label>
                                <select 
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-sm"
                                    value={editForm.registrationFee} 
                                    onChange={e => setEditForm({...editForm, registrationFee: e.target.value})}
                                >
                                    <option value="Pending">Pending ❌</option>
                                    <option value="Paid">Paid ✅</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-[10px] text-gray-400 uppercase mb-1 block">Final Fee</label>
                                <select 
                                    className="w-full bg-black border border-zinc-700 rounded-lg p-2 text-white text-sm"
                                    value={editForm.finalFee} 
                                    onChange={e => setEditForm({...editForm, finalFee: e.target.value})}
                                >
                                    <option value="Pending">Pending ❌</option>
                                    <option value="Paid">Paid ✅</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Notes */}
                    <div>
                        <label className="text-xs font-bold text-yellow-500 uppercase block mb-1">Internal Admin Notes</label>
                        <textarea 
                            className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:border-yellow-500 outline-none min-h-[60px] text-sm" 
                            value={editForm.remarks}
                            onChange={e => setEditForm({...editForm, remarks: e.target.value})}
                        />
                    </div>

                    {/* Stage */}
                    <div className="pt-2 border-t border-zinc-800 mt-2">
                        <label className="text-xs font-bold text-blue-400 uppercase block mb-2">Update Stage</label>
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

      {/* VIEW FULL PROFILE MODAL (Same as before) */}
      {isProfileModalOpen && selectedAspirant && (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsProfileModalOpen(false)}></div>
            <div className="relative w-full max-w-2xl bg-zinc-900 border-l border-zinc-800 h-full overflow-y-auto shadow-2xl animate-in slide-in-from-right duration-300">
                <div className="sticky top-0 bg-zinc-900/95 backdrop-blur z-10 border-b border-zinc-800 p-6 flex justify-between items-start">
                    <div className="flex gap-4">
                        <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold text-gray-400 border-2 border-zinc-700">{selectedAspirant.name?.charAt(0)}</div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">{selectedAspirant.name}</h2>
                            <p className="text-gray-400 text-sm flex items-center gap-2"><Mail size={14}/> {selectedAspirant.email}</p>
                            <div className="flex gap-2 mt-2">
                                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20 uppercase font-bold">{selectedAspirant.stage || "Registered"}</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsProfileModalOpen(false)} className="p-2 hover:bg-zinc-800 rounded-full text-gray-500 hover:text-white"><X size={24} /></button>
                </div>
                {/* Simplified profile content to focus on changes */}
                <div className="p-6">
                    {/* Fee Status View in Profile */}
                    <div className="mb-6 grid grid-cols-2 gap-4">
                         <div className={`p-4 rounded-xl border flex items-center gap-3 ${selectedAspirant.registrationFee === 'Paid' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                             <div className={`p-2 rounded-full ${selectedAspirant.registrationFee === 'Paid' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}><CreditCard size={16}/></div>
                             <div>
                                 <p className="text-xs text-gray-400 uppercase">Registration Fee</p>
                                 <p className="font-bold text-white">{selectedAspirant.registrationFee || "Pending"}</p>
                             </div>
                         </div>
                         <div className={`p-4 rounded-xl border flex items-center gap-3 ${selectedAspirant.finalFee === 'Paid' ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                             <div className={`p-2 rounded-full ${selectedAspirant.finalFee === 'Paid' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'}`}><CreditCard size={16}/></div>
                             <div>
                                 <p className="text-xs text-gray-400 uppercase">Final Fee</p>
                                 <p className="font-bold text-white">{selectedAspirant.finalFee || "Pending"}</p>
                             </div>
                         </div>
                    </div>
                    {/* ... (Other sections like Resume, Personal, Skills can remain standard) */}
                </div>
            </div>
        </div>
      )}

      {/* CREATE MODAL (Standard - no fee fields needed here, defaults to Pending) */}
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
                    <div className="grid grid-cols-2 gap-4">
                        <select required className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white" value={newSeeker.gender} onChange={e => setNewSeeker({...newSeeker, gender: e.target.value})}>
                            <option value="">Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                        </select>
                        <select required className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white" value={newSeeker.targetField} onChange={e => setNewSeeker({...newSeeker, targetField: e.target.value})}>
                            <option value="">Target Field</option>
                            <option value="IT">IT</option><option value="Non-IT">Non-IT</option><option value="Both IT & Non-IT">Both IT & Non-IT</option>
                        </select>
                    </div>
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