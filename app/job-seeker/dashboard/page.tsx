"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, getDoc, updateDoc } from "firebase/firestore";
// We import Storage but wrap it in try/catch so it doesn't crash if not set up
import { getApp } from "firebase/app"; 
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db } from "@/lib/firebase"; 
import { 
  Briefcase, 
  User, 
  GraduationCap, 
  Code, 
  Save, 
  Loader2,
  LogOut,
  Mail,
  Phone,
  Calendar,
  Award,
  FileText, 
  UploadCloud, 
  CheckCircle2,
  Users,
  Plus,
  Trash2,
  Check,
  Clock,
  Link as LinkIcon, // Icon for Link
  AlertCircle
} from "lucide-react";
import { useRouter } from "next/navigation";

// 🎨 AVATARS
const AVATAR_MALE = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Man%20Office%20Worker.png";
const AVATAR_FEMALE = "https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/People/Woman%20Office%20Worker.png";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 40 }, (_, i) => (CURRENT_YEAR - i).toString());

const SKILL_OPTIONS = [
  "Java", "Python", "C++", "C#", "JavaScript", "TypeScript", "Go", "Rust", "Swift", "Kotlin", "PHP", "Ruby",
  "React.js", "Next.js", "Node.js", "Angular", "Vue.js", "HTML/CSS", "Tailwind CSS", "Django", "Flask", "Spring Boot", "Laravel", "ASP.NET",
  "Flutter", "React Native", "Android Dev", "iOS Dev",
  "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Firebase",
  "AWS", "Azure", "Google Cloud", "DevOps", "Docker", "Kubernetes", "Terraform", "Jenkins", "Linux", "Git/GitHub",
  "Data Science", "Machine Learning", "Deep Learning", "Artificial Intelligence", "Power BI", "Tableau", "Big Data",
  "Cyber Security", "Ethical Hacking", "Network Security",
  "UI/UX Design", "Figma", "Communication", "Project Management", "Agile/Scrum"
];

const STATUS_STEPS = [
  { id: "registered", label: "Registered", sub: "Profile Under Review" },
  { id: "interview", label: "Interview", sub: "Screening In Progress" },
  { id: "placed", label: "Hired / Placed", sub: "Offer Letter Released" }
];

export default function JobSeekerDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [seeker, setSeeker] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // 🟢 RESUME STATE
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeType, setResumeType] = useState<"file" | "link">("link"); // Default to 'link' for safety
  const [uploadingResume, setUploadingResume] = useState(false);

  const [personal, setPersonal] = useState({ phone: "", dob: "", gender: "" });
  
  const [experience, setExperience] = useState<any[]>([
    { id: 1, role: "", company: "", startMonth: "", startYear: "", endMonth: "", endYear: "", isCurrent: false, description: "" }
  ]);

  const [education, setEducation] = useState({
    college: "", year: "", degree: "", cgpa: "",
    pgCollege: "", pgYear: "", pgDegree: "", pgCgpa: ""
  });

  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState(""); 
  const [customSkill, setCustomSkill] = useState(""); 

  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const docRef = doc(db, "job_seekers", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSeeker(data);
          if (data.education) setEducation(data.education);
          if (data.skills) setSelectedSkills(data.skills);
          if (data.experience && Array.isArray(data.experience)) setExperience(data.experience);
          if (data.resumeUrl) setResumeUrl(data.resumeUrl);
          setPersonal({ phone: data.phone || "", dob: data.dob || "", gender: data.gender || "" });
        }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    }
    fetchProfile();
  }, [user]);

  // ✅ VALIDATION & SAVE LOGIC
  const handleSave = async () => {
    if (!user) return;

    const missingFields = [];
    if (!personal.phone) missingFields.push("Phone Number");
    if (!personal.dob) missingFields.push("Date of Birth");
    if (!personal.gender) missingFields.push("Gender");
    if (!education.college) missingFields.push("UG College");
    if (!education.degree) missingFields.push("UG Degree");
    if (!education.year) missingFields.push("UG Year");
    if (!education.cgpa) missingFields.push("UG CGPA");
    if (selectedSkills.length === 0) missingFields.push("At least 1 Skill");
    
    // Resume Validation
    if (!resumeUrl) missingFields.push("Resume (Link or Upload)");

    if (missingFields.length > 0) {
        alert(`❌ Please fill the following MANDATORY fields:\n\n- ${missingFields.join("\n- ")}`);
        return;
    }

    setSaving(true);
    try {
      const docRef = doc(db, "job_seekers", user.uid);
      await updateDoc(docRef, {
        phone: personal.phone,
        dob: personal.dob,
        gender: personal.gender,
        education: education,
        experience: experience,
        skills: selectedSkills,
        resumeUrl: resumeUrl, // This saves the Link OR the Firebase URL
        lastUpdated: new Date()
      });
      setSeeker((prev: any) => ({ ...prev, phone: personal.phone, dob: personal.dob, gender: personal.gender }));
      alert("✅ Profile Updated Successfully!");
    } catch (err) { console.error(err); alert("❌ Failed to update."); } finally { setSaving(false); }
  };

  // ✅ FILE UPLOAD LOGIC (Safely wrapped)
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (file.type !== "application/pdf") { alert("❌ PDF only."); return; }

    setUploadingResume(true);
    try {
        const app = getApp(); 
        const storage = getStorage(app);
        const storageRef = ref(storage, `resumes/${user.uid}/resume.pdf`);
        
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        setResumeUrl(downloadURL);
        alert("✅ Resume Uploaded!");
    } catch (error: any) { 
        console.error("Upload Error:", error);
        alert("⚠️ Storage not enabled. Please switch to 'Paste Link' tab to save your resume."); 
    } finally { 
        setUploadingResume(false); 
    }
  };

  const handleDobChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, ''); 
    if (val.length > 8) val = val.substring(0, 8);
    let formattedDate = val;
    if (val.length > 2) formattedDate = val.substring(0, 2) + '/' + val.substring(2);
    if (val.length > 4) formattedDate = val.substring(0, 2) + '/' + val.substring(2, 4) + '/' + val.substring(4);
    setPersonal({ ...personal, dob: formattedDate });
  };

  const addExperience = () => {
    setExperience([...experience, { id: Date.now(), role: "", company: "", startMonth: "", startYear: "", endMonth: "", endYear: "", isCurrent: false, description: "" }]);
  };
  const removeExperience = (id: number) => { setExperience(experience.filter(exp => exp.id !== id)); };
  const updateExperience = (id: number, field: string, value: any) => {
    setExperience(experience.map(exp => {
        if (exp.id === id) {
            if (field === 'isCurrent' && value === true) return { ...exp, isCurrent: true, endMonth: "", endYear: "" };
            return { ...exp, [field]: value };
        }
        return exp;
    }));
  };

  const addSkill = (skill: string) => {
    if (selectedSkills.length >= 5) return alert("Max 5 skills allowed."); 
    if (skill && !selectedSkills.includes(skill)) {
      setSelectedSkills([...selectedSkills, skill]);
      setSkillInput(""); setCustomSkill(""); 
    }
  };
  const removeSkill = (skill: string) => { setSelectedSkills(selectedSkills.filter(s => s !== skill)); };

  const getCurrentStepIndex = () => {
      const stage = (seeker?.stage || "registered").toLowerCase();
      if (stage === "placed") return 2;
      if (stage === "interview") return 1;
      return 0; 
  };
  const currentStepIndex = getCurrentStepIndex();
  const progressHeight = currentStepIndex === 0 ? "0%" : currentStepIndex === 1 ? "50%" : "100%";

  if (loading) return <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white"><Loader2 className="animate-spin" size={40} /><p className="mt-4 text-gray-400">Loading...</p></div>;
  if (!seeker) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Profile not found.</div>;

  const getAvatar = () => {
    const g = (personal.gender || "").toLowerCase().trim();
    if (g === "male") return AVATAR_MALE;
    if (g === "female") return AVATAR_FEMALE;
    return null; 
  };
  const currentAvatar = getAvatar();

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30 pb-20">
      <nav className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white shadow-lg"><Briefcase size={16} strokeWidth={3} /></div>
             <span className="font-bold text-white tracking-tight hidden sm:block">Pixalara Career Hub</span>
          </div>
          <button onClick={() => { logout(); router.push("/login"); }} className="flex items-center gap-2 px-4 py-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white text-sm font-medium"><LogOut size={16} /> Sign Out</button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN */}
        <div className="lg:col-span-4 space-y-6">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl group-hover:bg-blue-600/20 transition-all duration-700"></div>
                <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="w-32 h-32 rounded-full bg-zinc-800 border-4 border-zinc-900 shadow-xl flex items-center justify-center mb-4 overflow-hidden relative">
                        {currentAvatar ? <img src={currentAvatar} alt="Avatar" className="w-full h-full object-contain p-2 animate-in fade-in zoom-in duration-500"/> : <span className="text-4xl font-bold text-gray-500">{seeker.name?.charAt(0)}</span>}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{seeker.name}</h2>
                    <p className="text-blue-400 font-medium text-sm mt-1">{seeker.highestEducation || "Student"}</p>
                    <div className="mt-6 w-full space-y-4 text-left bg-black/40 p-4 rounded-xl border border-white/5">
                        <div className="flex items-center gap-3 text-sm text-gray-300"><Mail size={16} className="text-gray-500"/> <span className="truncate">{seeker.email}</span></div>
                        <div className="flex items-center gap-3 text-sm text-gray-300"><Phone size={16} className="text-gray-500"/> <span>{personal.phone || "N/A"}</span></div>
                        <div className="flex items-center gap-3 text-sm text-gray-300"><Calendar size={16} className="text-gray-500"/> <span>{personal.dob || "N/A"}</span></div>
                        <div className="flex items-center gap-3 text-sm text-gray-300"><Briefcase size={16} className="text-gray-500"/> <span>Target: {seeker.targetField || "Not Set"}</span></div>
                    </div>
                </div>
            </div>

            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2 uppercase tracking-wider">
                        <Award size={16} className="text-blue-500"/> Application Status
                    </h3>
                    <span className="text-[10px] bg-blue-500/10 text-blue-400 px-2 py-1 rounded border border-blue-500/20">Live</span>
                </div>
                <div className="relative pl-2 pb-2">
                    <div className="absolute left-[11px] top-3 bottom-8 w-[2px] bg-zinc-800 rounded-full"></div>
                    <div className="absolute left-[11px] top-3 w-[2px] bg-gradient-to-b from-blue-500 via-purple-500 to-green-500 rounded-full transition-all duration-1000" style={{ height: progressHeight, maxHeight: '80%' }}></div>
                    <div className="space-y-8 relative z-10">
                        {STATUS_STEPS.map((step, index) => {
                            const isCompleted = index < currentStepIndex;
                            const isCurrent = index === currentStepIndex;
                            const isActive = index <= currentStepIndex;
                            return (
                                <div key={step.id} className="flex items-start gap-4 group">
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 transition-all duration-500 z-10 ${isCompleted ? "bg-green-500 border-green-500 text-black shadow-lg shadow-green-500/20" : isCurrent ? "bg-black border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-110" : "bg-black border-zinc-700 text-zinc-600"}`}>
                                        {isCompleted ? <Check size={14} strokeWidth={4} /> : isCurrent ? <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div> : <Clock size={12} />}
                                    </div>
                                    <div className={`transition-all duration-500 ${isActive ? "opacity-100" : "opacity-40"}`}>
                                        <p className={`text-sm font-bold ${isCurrent ? "text-white" : isCompleted ? "text-gray-300" : "text-zinc-500"}`}>{step.label}</p>
                                        <p className={`text-xs mt-0.5 font-medium ${isCurrent ? "text-blue-400" : "text-zinc-600"}`}>{step.sub}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-8 space-y-8">
           
           {/* PERSONAL DETAILS */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
               <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-white flex items-center gap-2"><User className="text-orange-500" /> Personal Details <span className="text-red-500 text-sm">*</span></h3></div>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                       <label className="text-xs text-gray-400 mb-1 block">Phone Number</label>
                       <div className="relative">
                            <Phone className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none" size={16} />
                            <input type="tel" className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none" placeholder="+91..." value={personal.phone} onChange={(e) => setPersonal({...personal, phone: e.target.value})} />
                       </div>
                   </div>
                   <div>
                       <label className="text-xs text-gray-400 mb-1 block">Date of Birth (DD/MM/YYYY)</label>
                       <div className="relative">
                            <Calendar className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none" size={16} />
                            <input type="text" className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none" placeholder="DD/MM/YYYY" value={personal.dob} onChange={handleDobChange} maxLength={10} />
                       </div>
                   </div>
                   <div>
                       <label className="text-xs text-gray-400 mb-1 block">Gender</label>
                       <div className="relative">
                            <Users className="absolute left-3 top-2.5 text-zinc-500 pointer-events-none" size={16} />
                            <select className="w-full bg-black border border-zinc-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:border-blue-500 outline-none appearance-none cursor-pointer" value={personal.gender} onChange={(e) => setPersonal({...personal, gender: e.target.value})}>
                                <option value="" disabled>Select Gender</option><option value="Male">Male</option><option value="Female">Female</option><option value="Other">Other</option>
                            </select>
                            <div className="absolute right-4 top-3 pointer-events-none text-zinc-500 text-xs">▼</div>
                       </div>
                   </div>
               </div>
           </div>

           {/* 📄 RESUME SECTION (DUAL MODE FIX) */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
               <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-bold text-white flex items-center gap-2">
                       <FileText className="text-pink-500" /> Resume / CV <span className="text-red-500 text-sm">*</span>
                   </h3>
                   {resumeUrl && <span className="text-xs px-2 py-1 rounded bg-green-500/10 text-green-400 border border-green-500/20 flex items-center gap-1"><CheckCircle2 size={12}/> {resumeType === 'link' ? 'Link Added' : 'Uploaded'}</span>}
               </div>

               {/* Tabs */}
               <div className="flex gap-4 mb-4 border-b border-zinc-800 pb-2">
                   <button onClick={() => setResumeType("link")} className={`text-sm font-medium pb-2 transition-colors ${resumeType === "link" ? "text-pink-500 border-b-2 border-pink-500" : "text-gray-500 hover:text-white"}`}>Paste Link (Recommended)</button>
                   <button onClick={() => setResumeType("file")} className={`text-sm font-medium pb-2 transition-colors ${resumeType === "file" ? "text-pink-500 border-b-2 border-pink-500" : "text-gray-500 hover:text-white"}`}>Upload PDF</button>
               </div>

               <div className="flex flex-col md:flex-row items-start gap-6">
                   {/* Input Area */}
                   <div className="w-full md:w-2/3">
                       {resumeType === "file" ? (
                           <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer hover:bg-zinc-800/50 transition ${uploadingResume ? "border-blue-500 bg-blue-500/5 cursor-wait" : "border-zinc-700 hover:border-blue-500"}`}>
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    {uploadingResume ? <Loader2 className="w-8 h-8 mb-3 text-blue-500 animate-spin" /> : <UploadCloud className="w-8 h-8 mb-3 text-gray-400" />}
                                    <p className="mb-2 text-sm text-gray-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p><p className="text-xs text-gray-500">PDF only (Max 5MB)</p>
                                </div>
                                <input type="file" className="hidden" accept="application/pdf" onChange={handleResumeUpload} disabled={uploadingResume} />
                           </label>
                       ) : (
                           <div className="space-y-2">
                               <div className="relative">
                                   <LinkIcon className="absolute left-3 top-3 text-gray-500" size={18} />
                                   <input 
                                     type="url" 
                                     className="w-full bg-black border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-white text-sm focus:border-pink-500 outline-none" 
                                     placeholder="e.g. https://drive.google.com/file/..." 
                                     value={resumeUrl}
                                     onChange={(e) => setResumeUrl(e.target.value)}
                                   />
                               </div>
                               <p className="text-xs text-gray-500 ml-1">Paste a link to your Google Drive, Dropbox, or Portfolio.</p>
                           </div>
                       )}
                   </div>

                   {/* Status / View */}
                   <div className="w-full md:w-1/3 flex flex-col gap-2">
                       {resumeUrl ? (
                           <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="w-full bg-zinc-800 hover:bg-zinc-700 text-white py-3 rounded-xl font-medium text-center transition flex items-center justify-center gap-2 border border-zinc-700">
                               <FileText size={18} /> View Resume
                           </a>
                       ) : (
                           <div className="text-center p-4 bg-red-500/10 border border-red-500/20 rounded-xl"><p className="text-red-400 text-sm font-medium">No Resume Added</p></div>
                       )}
                   </div>
               </div>
           </div>

           {/* EDUCATION & SKILLS */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
               <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-white flex items-center gap-2"><GraduationCap className="text-blue-500" /> Academic Details <span className="text-red-500 text-sm">*</span></h3></div>
               <div className="space-y-8">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="col-span-2 text-sm font-bold text-gray-500 border-b border-zinc-800 pb-1 mb-1">Graduation (UG)</div>
                        <input type="text" className="bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm" placeholder="College" value={education.college} onChange={e => setEducation({...education, college: e.target.value})} />
                        <input type="text" className="bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm" placeholder="Degree" value={education.degree} onChange={e => setEducation({...education, degree: e.target.value})} />
                        <input type="text" className="bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm" placeholder="Year" value={education.year} onChange={e => setEducation({...education, year: e.target.value})} />
                        <input type="text" className="bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm" placeholder="CGPA" value={education.cgpa} onChange={e => setEducation({...education, cgpa: e.target.value})} />
                        
                        <div className="col-span-2 text-sm font-bold text-gray-500 border-b border-zinc-800 pb-1 mb-1 mt-2">Post Graduation (Optional)</div>
                        <input type="text" className="bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm" placeholder="College" value={education.pgCollege} onChange={e => setEducation({...education, pgCollege: e.target.value})} />
                        <input type="text" className="bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm" placeholder="Degree" value={education.pgDegree} onChange={e => setEducation({...education, pgDegree: e.target.value})} />
                        <input type="text" className="bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm" placeholder="Year" value={education.pgYear} onChange={e => setEducation({...education, pgYear: e.target.value})} />
                        <input type="text" className="bg-black border border-zinc-700 rounded-lg p-2.5 text-white text-sm" placeholder="CGPA" value={education.pgCgpa} onChange={e => setEducation({...education, pgCgpa: e.target.value})} />
                   </div>
               </div>
           </div>

           {/* 💼 EXPERIENCE (Optional) */}
           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
               <div className="flex items-center justify-between mb-6">
                   <h3 className="text-xl font-bold text-white flex items-center gap-2"><Briefcase className="text-green-500" /> Work Experience <span className="text-xs text-zinc-600 ml-2 font-normal">(Optional)</span></h3>
                   <button onClick={addExperience} className="text-xs flex items-center gap-1 px-3 py-1.5 rounded bg-green-500/10 text-green-400 border border-green-500/20"><Plus size={14} /> Add New</button>
               </div>
               <div className="space-y-6">
                   {experience.map((exp, index) => (
                       <div key={exp.id} className="p-5 bg-black rounded-xl border border-zinc-800 space-y-4 relative">
                           <button onClick={() => removeExperience(exp.id)} className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2 size={16} /></button>
                           <h4 className="text-xs font-bold text-gray-500 uppercase">Experience #{index + 1}</h4>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               <div>
                                   <label className="text-xs text-gray-400 mb-1 block">Role / Job Title</label>
                                   <input type="text" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none" placeholder="e.g. Developer" value={exp.role} onChange={(e) => updateExperience(exp.id, 'role', e.target.value)} />
                               </div>
                               <div>
                                   <label className="text-xs text-gray-400 mb-1 block">Company Name</label>
                                   <input type="text" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none" placeholder="e.g. Google" value={exp.company} onChange={(e) => updateExperience(exp.id, 'company', e.target.value)} />
                               </div>
                               <div>
                                   <label className="text-xs text-gray-400 mb-1 block">Start Date</label>
                                   <div className="flex gap-2">
                                       <select className="w-1/2 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-white text-sm focus:border-green-500 outline-none" value={exp.startMonth} onChange={(e) => updateExperience(exp.id, 'startMonth', e.target.value)}>
                                           <option value="">Month</option>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                       </select>
                                       <select className="w-1/2 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-white text-sm focus:border-green-500 outline-none" value={exp.startYear} onChange={(e) => updateExperience(exp.id, 'startYear', e.target.value)}>
                                           <option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                       </select>
                                   </div>
                               </div>
                               <div>
                                   <div className="flex justify-between items-center mb-1">
                                       <label className="text-xs text-gray-400">End Date</label>
                                       <label className="flex items-center gap-2 cursor-pointer hover:bg-zinc-800 px-2 py-0.5 rounded transition">
                                            <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${exp.isCurrent ? 'bg-green-500 border-green-500' : 'border-zinc-500'}`}>
                                                {exp.isCurrent && <Check size={10} className="text-black" strokeWidth={4} />}
                                            </div>
                                            <input type="checkbox" className="hidden" checked={exp.isCurrent} onChange={(e) => updateExperience(exp.id, 'isCurrent', e.target.checked)} />
                                            <span className={`text-[10px] uppercase font-bold tracking-wider ${exp.isCurrent ? 'text-green-400' : 'text-zinc-500'}`}>Present</span>
                                       </label>
                                   </div>
                                   <div className={`flex gap-2 transition-opacity duration-200 ${exp.isCurrent ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                                       <select className="w-1/2 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-white text-sm focus:border-green-500 outline-none" value={exp.endMonth} onChange={(e) => updateExperience(exp.id, 'endMonth', e.target.value)}>
                                           <option value="">Month</option>{MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                                       </select>
                                       <select className="w-1/2 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-2 text-white text-sm focus:border-green-500 outline-none" value={exp.endYear} onChange={(e) => updateExperience(exp.id, 'endYear', e.target.value)}>
                                           <option value="">Year</option>{YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                                       </select>
                                   </div>
                               </div>
                               <div className="col-span-1 md:col-span-2">
                                   <label className="text-xs text-gray-400 mb-1 block">Description</label>
                                   <input type="text" className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-green-500 outline-none" placeholder="Short description..." value={exp.description} onChange={(e) => updateExperience(exp.id, 'description', e.target.value)} />
                               </div>
                           </div>
                       </div>
                   ))}
                   {experience.length === 0 && <p className="text-gray-500 text-sm text-center py-4">No experience added yet.</p>}
               </div>
           </div>

           <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 md:p-8">
               <div className="flex items-center justify-between mb-6"><h3 className="text-xl font-bold text-white flex items-center gap-2"><Code className="text-purple-500" /> Top Skills (Max 5) <span className="text-red-500 text-sm">*</span></h3><span className="text-xs text-gray-500">{selectedSkills.length}/5</span></div>
               <div className="relative mb-3">
                  <select className="w-full bg-black border border-zinc-700 text-white p-3 rounded-xl appearance-none outline-none focus:border-purple-500" onChange={(e) => addSkill(e.target.value)} value={skillInput}>
                    <option value="" disabled>Select a skill...</option>{SKILL_OPTIONS.map(skill => (<option key={skill} value={skill}>{skill}</option>))}
                  </select>
                  <div className="absolute right-4 top-3.5 pointer-events-none text-gray-500">▼</div>
               </div>
               <div className="flex gap-2 mb-6">
                  <input type="text" className="flex-1 bg-black border border-zinc-700 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none" placeholder="Or type custom..." value={customSkill} onChange={(e) => setCustomSkill(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addSkill(customSkill)} />
                  <button onClick={() => addSkill(customSkill)} className="px-4 py-2 bg-purple-500/10 text-purple-400 rounded-lg text-sm font-bold border border-purple-500/20">Add</button>
               </div>
               <div className="flex flex-wrap gap-2 min-h-[50px]">
                   {selectedSkills.map((skill) => (<div key={skill} className="flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 px-3 py-1.5 rounded-full text-purple-300 text-sm"><span>{skill}</span><button onClick={() => removeSkill(skill)} className="hover:text-white">×</button></div>))}
               </div>
           </div>

           <div className="flex justify-end pt-4">
                <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-white text-black px-8 py-3 rounded-xl font-bold hover:bg-gray-200 transition-all disabled:opacity-50">
                    {saving ? <Loader2 className="animate-spin" size={20}/> : <Save size={20} />} {saving ? "Saving..." : "Save Profile Updates"}
                </button>
           </div>

        </div>
      </main>
    </div>
  );
}