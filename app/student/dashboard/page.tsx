"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  addDoc, 
  onSnapshot,
  serverTimestamp,
  orderBy,
  setDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  BookOpen, Clock, Trophy, Video, Lock, Download, Calendar, CheckCircle, 
  LogOut, Sparkles, MessageCircle, Send, X, User
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // 💬 Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [mentor, setMentor] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // 1. Fetch Student Profile & Find Mentor
  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      try {
        // Fetch Student
        const studentSnap = await getDoc(doc(db, "growth_students", user.uid));
        if (studentSnap.exists()) {
          const sData = studentSnap.data();
          setStudent(sData);

          // Find Mentor for this Course
          if (sData.course) {
             const q = query(collection(db, "mentors"), where("course", "==", sData.course));
             const mentorSnap = await getDocs(q);
             if (!mentorSnap.empty) {
                // Just take the first assigned mentor for now
                setMentor({ id: mentorSnap.docs[0].id, ...mentorSnap.docs[0].data() });
             }
          }
        }
      } catch (err) { console.error(err); } 
      finally { setLoading(false); }
    }
    fetchData();
  }, [user]);

  // 2. Listen for Real-time Messages
  useEffect(() => {
    if (!user || !mentor || !isChatOpen) return;
    
    // Conversation ID: studentUID_mentorUID
    const chatId = `${user.uid}_${mentor.id}`;
    
    const q = query(
      collection(db, `chats/${chatId}/messages`), 
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      // Scroll to bottom
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    return () => unsubscribe();
  }, [user, mentor, isChatOpen]);

  // 3. Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !mentor) return;

    const chatId = `${user.uid}_${mentor.id}`;
    const msg = newMessage;
    setNewMessage(""); // Clear input early

    // A. Add Message to Subcollection
    await addDoc(collection(db, `chats/${chatId}/messages`), {
      text: msg,
      senderId: user.uid,
      senderName: student.name,
      createdAt: serverTimestamp()
    });

    // B. Update Parent Chat Document (For Mentor's List)
    await setDoc(doc(db, "chats", chatId), {
      studentId: user.uid,
      studentName: student.name,
      mentorId: mentor.id,
      lastMessage: msg,
      lastUpdated: serverTimestamp(),
      isReadByMentor: false // 🔥 Triggers Notification for Mentor
    }, { merge: true });
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!student) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Access Denied.</div>;

  const isCompleted = student.status === "Completed";
  const progressValue = isCompleted ? 100 : 45;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30 relative">
      
      {/* 🟢 Navigation Bar */}
      <nav className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center text-white"><Sparkles size={18}/></div>
             <span className="font-bold text-white">Pixalara Growth School</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-white">{student.name}</p>
                <span className="text-xs bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded border border-blue-500/20 font-mono">{student.studentId}</span>
             </div>
             <button onClick={() => { logout(); router.push("/login"); }} className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      {/* 🚀 Main Content */}
      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {student.name.split(" ")[0]} 👋</h1>
            <p className="text-gray-400">Continue your progress in <strong>{student.course}</strong>.</p>
          </div>
        </div>

        {/* Course Card (Reused from previous step) */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800 rounded-2xl overflow-hidden p-8 relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <h2 className="text-3xl font-bold text-white mb-2 relative z-10">{student.course}</h2>
                <div className="w-full h-3 bg-zinc-800 rounded-full overflow-hidden mt-6 mb-2">
                    <div className="h-full bg-gradient-to-r from-blue-600 to-purple-600 rounded-full" style={{ width: `${progressValue}%` }}></div>
                </div>
                <div className="flex justify-between text-sm"><span className="text-gray-400">Progress</span><span className="text-white font-bold">{progressValue}%</span></div>
            </div>
        </div>
      </main>

      {/* 💬 FLOATING CHAT WIDGET */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isChatOpen && (
          <button 
            onClick={() => setIsChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-2xl shadow-blue-600/20 flex items-center gap-2 transition transform hover:scale-105"
          >
            <MessageCircle size={24} />
            <span className="font-bold pr-2">Ask Mentor</span>
          </button>
        )}

        {isChatOpen && (
          <div className="bg-zinc-900 border border-zinc-700 w-80 md:w-96 h-[500px] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-10 fade-in duration-300">
             
             {/* Header */}
             <div className="bg-zinc-950 p-4 border-b border-zinc-800 flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold border border-blue-500/30">
                        {mentor ? mentor.name.charAt(0) : "M"}
                    </div>
                    <div>
                        <h4 className="text-white font-bold text-sm">{mentor ? mentor.name : "Course Mentor"}</h4>
                        <p className="text-xs text-green-400 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsChatOpen(false)} className="text-gray-400 hover:text-white"><X size={20}/></button>
             </div>

             {/* Messages Area */}
             <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/20">
                {messages.length === 0 && (
                    <div className="text-center text-gray-500 text-sm mt-10">
                        <p>👋 Hi {student.name.split(" ")[0]}!</p>
                        <p className="mt-1">I am your mentor for {student.course}.</p>
                        <p className="mt-1">Ask me anything about the class.</p>
                    </div>
                )}
                
                {messages.map((msg) => {
                    const isMe = msg.senderId === user.uid;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                                isMe 
                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                : 'bg-zinc-800 text-gray-200 rounded-tl-none border border-zinc-700'
                            }`}>
                                {msg.text}
                            </div>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
             </div>

             {/* Input Area */}
             <form onSubmit={handleSendMessage} className="p-3 bg-zinc-950 border-t border-zinc-800 flex gap-2">
                <input 
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white text-sm outline-none focus:border-blue-500 transition"
                    placeholder="Type your question..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition">
                    <Send size={18} />
                </button>
             </form>
          </div>
        )}
      </div>

    </div>
  );
}