"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { updatePassword } from "firebase/auth"; // Import auth update
import { db, auth } from "@/lib/firebase";
import { Save, User, Lock, Mail, Phone } from "lucide-react";

export default function SettingsPage() {
  const { user, userData } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    newPassword: "" 
  });

  useEffect(() => {
    if (userData) {
      setFormData(prev => ({
        ...prev,
        name: userData.name || "",
        email: userData.email || "",
        phone: userData.phone || ""
      }));
    }
  }, [userData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg("");

    try {
      // 1. Update Firestore Profile
      if (user) {
        await updateDoc(doc(db, "admins", user.uid), {
          name: formData.name,
          phone: formData.phone
        });
      }

      // 2. Update Password (if provided)
      if (formData.newPassword && user) {
        await updatePassword(user, formData.newPassword);
      }

      setMsg("✅ Profile updated successfully!");
    } catch (error: any) {
      console.error(error);
      setMsg("❌ Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-gray-400 text-sm">Manage your admin profile & security</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8">
        {msg && (
          <div className={`p-3 mb-6 rounded-lg text-sm text-center ${msg.includes("Error") ? "bg-red-500/10 text-red-400" : "bg-green-500/10 text-green-400"}`}>
            {msg}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Full Name</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 py-2">
              <User size={18} className="text-gray-500 mr-3" />
              <input 
                type="text" 
                className="bg-transparent w-full text-white outline-none"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          {/* Email (Read Only) */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Email Address</label>
            <div className="flex items-center bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 cursor-not-allowed">
              <Mail size={18} className="text-gray-600 mr-3" />
              <input 
                type="email" 
                disabled
                className="bg-transparent w-full text-gray-500 outline-none"
                value={formData.email}
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-gray-500">Phone Number</label>
            <div className="flex items-center bg-black border border-zinc-800 rounded-lg px-3 py-2">
              <Phone size={18} className="text-gray-500 mr-3" />
              <input 
                type="text" 
                className="bg-transparent w-full text-white outline-none"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
              />
            </div>
          </div>

          <hr className="border-zinc-800 my-6" />

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-xs uppercase font-bold text-blue-400">Set New Password</label>
            <div className="flex items-center bg-black border border-blue-900/30 rounded-lg px-3 py-2">
              <Lock size={18} className="text-blue-500 mr-3" />
              <input 
                type="password" 
                placeholder="Leave blank to keep current password"
                className="bg-transparent w-full text-white outline-none placeholder-zinc-700"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-white hover:bg-gray-200 text-black font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Save size={18} />
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}