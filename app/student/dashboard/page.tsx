"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function StudentDashboard() {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== "student")) {
      router.push("/");
    }
  }, [user, role, loading, router]);

  if (loading) return <p className="text-white p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-2">
        🎓 Student Dashboard
      </h1>

      <p className="text-gray-400 mb-6">
        Welcome to Pixalara Growth School
      </p>

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded">
          <h3 className="font-semibold">Enrolled Course</h3>
          <p className="text-gray-400">Cloud & DevOps</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <h3 className="font-semibold">Progress</h3>
          <p className="text-gray-400">35% completed</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <h3 className="font-semibold">Mentor</h3>
          <p className="text-gray-400">Janaki Raman</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8">
        <button
          onClick={logout}
          className="bg-red-500 px-4 py-2 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
