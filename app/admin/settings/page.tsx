"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";

export default function AdminSettingsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // 🔐 Auth listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) return;

      setUser(u);
      setEmail(u.email || "");

      const ref = doc(db, "admins", u.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        const data = snap.data();
        setName(data.name || "");
        setPhone(data.phone || "");
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  // 💾 SAVE PROFILE (FIXED)
  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError("");

    try {
      await setDoc(
        doc(db, "admins", user.uid),
        {
          name,
          email: user.email,
          phone,
          role: "admin",
          updatedAt: serverTimestamp(),
        },
        { merge: true } // 🔥 CRITICAL FIX
      );

      alert("Profile updated successfully ✅");
    } catch (err: any) {
      console.error(err);
      setError("Failed to save changes");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-white p-6">Loading settings...</div>
    );
  }

  return (
    <div className="p-6 text-white max-w-xl">
      <h1 className="text-2xl font-bold mb-1">Settings</h1>
      <p className="text-gray-400 mb-6">
        Admin profile configuration
      </p>

      <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 rounded-xl shadow-xl">
        {error && (
          <p className="text-red-400 mb-3">{error}</p>
        )}

        <label className="block mb-4">
          <span className="text-sm text-gray-300">
            Admin Name
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 w-full p-3 rounded bg-black border border-gray-700 text-white"
          />
        </label>

        <label className="block mb-4">
          <span className="text-sm text-gray-300">
            Email
          </span>
          <input
            value={email}
            disabled
            className="mt-1 w-full p-3 rounded bg-gray-800 border border-gray-700 text-gray-400"
          />
        </label>

        <label className="block mb-6">
          <span className="text-sm text-gray-300">
            Phone Number
          </span>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="mt-1 w-full p-3 rounded bg-black border border-gray-700 text-white"
          />
        </label>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 rounded bg-gradient-to-r from-orange-500 to-pink-500 hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
