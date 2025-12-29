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
  onSnapshot,
  orderBy,
  addDoc,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase"; 
import { 
  Users, Video, Calendar, FileText, LogOut, MessageSquare, Send, X, Bell
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function MentorDashboard() {
  const { user, logout } = useAuth();
  const router = useRouter();
  
  const [mentor, setMentor] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 💬 Chat Features
  const [chats, setChats] = useState<any[]>([]);
  const [activeChat, setActiveChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [reply, setReply] = useState("");
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // 1. Fetch Mentor Profile
  useEffect(() => {
    async function fetchMentorData() {
      if (!user) return;
      const docSnap = await getDoc(doc(db, "mentors", user.uid));
      if (docSnap.exists()) setMentor(docSnap.data());
      setLoading(false);
    }
    fetchMentorData();
  }, [user]);

  // 2. Listen for Incoming Chats (Queries)
  useEffect(() => {
    if (!user) return;
    
    // Listen to 'chats' where mentorId == current user
    const q = query(collection(db, "chats"), where("mentorId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Sort by last updated (newest on top)
        chatList.sort((a:any, b:any) => (b.lastUpdated?.seconds || 0) - (a.lastUpdated?.seconds || 0));
        setChats(chatList);
    });
    return () => unsubscribe();
  }, [user]);

  // 3. Listen to Messages when a Chat is Active
  useEffect(() => {
    if (!activeChat) return;
    
    const q = query(collection(db, `chats/${activeChat.id}/messages`), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    });

    // Mark as Read
    if (!activeChat.isReadByMentor) {
        updateDoc(doc(db, "chats", activeChat.id), { isReadByMentor: true });
    }

    return () => unsubscribe();
  }, [activeChat]);

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reply.trim() || !activeChat) return;

    await addDoc(collection(db, `chats/${activeChat.id}/messages`), {
        text: reply,
        senderId: user?.uid,
        senderName: mentor.name, // Mentor Name
        createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, "chats", activeChat.id), {
        lastMessage: reply,
        lastUpdated: serverTimestamp()
        // We don't change 'isReadByMentor' here, but we could add 'isReadByStudent'
    });

    setReply("");
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Portal...</div>;

  // Count Unread
  const unreadCount = chats.filter(c => !c.isReadByMentor).length;

  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-blue-500/30 flex flex-col h-screen">
      
      {/* 🔵 Navbar */}
      <nav className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md shrink-0">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">M</div>
             <span className="font-bold text-white">Pixalara Faculty</span>
          </div>
          <div className="flex items-center gap-4">
             <div className="relative">
                <Bell size={20} className="text-gray-400" />
                {unreadCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold text-white">{unreadCount}</span>}
             </div>
             <p className="text-sm font-bold text-white hidden md:block">{mentor?.name}</p>
             <button onClick={() => { logout(); router.push("/login"); }} className="p-2 hover:bg-zinc-800 rounded-full text-gray-400 hover:text-white"><LogOut size={20}/></button>
          </div>
        </div>
      </nav>

      {/* 🚀 Main Content */}
      <div className="flex flex-1 overflow-hidden">
        
        {/* LEFT: Dashboard & Chat List */}
        <div className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
            <h1 className="text-3xl font-bold text-white mb-6">Instructor Dashboard</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
                
                {/* 📊 Stats Column */}
                <div className="space-y-6">
                   <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl flex items-center gap-5">
                      <div className="p-4 bg-blue-500/10 rounded-xl text-blue-500"><Users size={28} /></div>
                      <div>
                         <p className="text-xs text-gray-500 uppercase font-bold">Course</p>
                         <p className="text-xl font-bold text-white">{mentor?.course}</p>
                      </div>
                   </div>
                   
                   {/* Student Queries List */}
                   <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex flex-col h-[500px]">
                      <div className="p-4 border-b border-zinc-800 flex justify-between items-center">
                         <h3 className="font-bold text-white flex items-center gap-2">
                            <MessageSquare size={18} className="text-blue-500"/> Student Queries
                         </h3>
                         {unreadCount > 0 && <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{unreadCount} New</span>}
                      </div>
                      <div className="flex-1 overflow-y-auto p-2 space-y-2">
                         {chats.length === 0 && <p className="text-center text-gray-500 text-sm mt-10">No queries yet.</p>}
                         {chats.map(chat => (
                            <div 
                                key={chat.id} 
                                onClick={() => setActiveChat(chat)}
                                className={`p-3 rounded-lg cursor-pointer transition flex justify-between items-start ${
                                    activeChat?.id === chat.id ? 'bg-blue-900/20 border border-blue-500/30' : 'bg-black/20 hover:bg-zinc-800 border border-transparent'
                                }`}
                            >
                                <div>
                                    <p className={`text-sm font-bold ${!chat.isReadByMentor ? 'text-white' : 'text-gray-400'}`}>
                                        {chat.studentName}
                                    </p>
                                    <p className="text-xs text-gray-500 truncate w-40">{chat.lastMessage}</p>
                                </div>
                                {!chat.isReadByMentor && <div className="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>}
                            </div>
                         ))}
                      </div>
                   </div>
                </div>

                {/* 💬 RIGHT: Chat Window (Takes up 2 columns) */}
                <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col h-[650px]">
                    {activeChat ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950 rounded-t-xl">
                                <div>
                                    <h3 className="font-bold text-white">{activeChat.studentName}</h3>
                                    <p className="text-xs text-blue-400">Student • {mentor?.course}</p>
                                </div>
                                <button onClick={() => setActiveChat(null)} className="md:hidden text-gray-400"><X size={20}/></button>
                            </div>

                            {/* Chat Messages */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-black/40">
                                {messages.map(msg => {
                                    const isMe = msg.senderId === user?.uid;
                                    return (
                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[70%] rounded-xl px-4 py-3 text-sm ${
                                                isMe 
                                                ? 'bg-blue-600 text-white rounded-tr-none' 
                                                : 'bg-zinc-800 text-gray-200 rounded-tl-none border border-zinc-700'
                                            }`}>
                                                <p>{msg.text}</p>
                                                <p className="text-[10px] opacity-50 mt-1 text-right">
                                                    {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                                </p>
                                            </div>
                                        </div>
                                    )
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSendReply} className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-3 rounded-b-xl">
                                <input 
                                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-white text-sm outline-none focus:border-blue-500 transition"
                                    placeholder="Type your reply..."
                                    value={reply}
                                    onChange={(e) => setReply(e.target.value)}
                                />
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-lg font-bold flex items-center gap-2">
                                    <Send size={18} /> Reply
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            <MessageSquare size={48} className="mb-4 opacity-20" />
                            <p>Select a student query to view the conversation.</p>
                        </div>
                    )}
                </div>

            </div>
        </div>
      </div>

    </div>
  );
}