"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function JobSeekerDashboard() {
  const { user, role, loading, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || role !== "job_seeker")) {
      router.push("/");
    }
  }, [user, role, loading, router]);

  if (loading) return <p className="text-white p-6">Loading...</p>;

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-2xl font-bold mb-2">
        💼 Job Seeker Dashboard
      </h1>

      <p className="text-gray-400 mb-6">
        Pixalara Job Assistance Program
      </p>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900 p-4 rounded">
          <h3 className="font-semibold">Profile Status</h3>
          <p className="text-gray-400">Completed</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <h3 className="font-semibold">Current Stage</h3>
          <p className="text-gray-400">Interview Scheduled</p>
        </div>

        <div className="bg-zinc-900 p-4 rounded">
          <h3 className="font-semibold">Consultant</h3>
          <p className="text-gray-400">Pixalara Vendor</p>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-4">
        <button
          className="bg-green-500 px-4 py-2 rounded"
        >
          Upload Resume
        </button>

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
