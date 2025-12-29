"use client";

import { useState } from "react";

export default function Home() {
  const [role, setRole] = useState<"admin" | "student" | "job_seeker">("student");

  return (
    <main className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md bg-zinc-900 p-8 rounded-xl shadow-lg">
        
        <h1 className="text-2xl font-bold text-center mb-2">
          Pixalara Dashboard
        </h1>
        <p className="text-center text-gray-400 mb-6">
          Growth School & Job Assistance
        </p>

        {/* Role Selector */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setRole("admin")}
            className={`flex-1 py-2 rounded ${
              role === "admin" ? "bg-orange-500" : "bg-zinc-700"
            }`}
          >
            Admin
          </button>
          <button
            onClick={() => setRole("student")}
            className={`flex-1 py-2 rounded ${
              role === "student" ? "bg-orange-500" : "bg-zinc-700"
            }`}
          >
            Student
          </button>
          <button
            onClick={() => setRole("job_seeker")}
            className={`flex-1 py-2 rounded ${
              role === "job_seeker" ? "bg-orange-500" : "bg-zinc-700"
            }`}
          >
            Job Seeker
          </button>
        </div>

        {/* Login Form */}
        <input
          type="text"
          placeholder="User ID"
          className="w-full mb-3 px-4 py-2 rounded bg-black border border-zinc-700"
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-4 px-4 py-2 rounded bg-black border border-zinc-700"
        />

        <button className="w-full bg-gradient-to-r from-orange-500 to-pink-500 py-2 rounded font-semibold">
          Login as {role.replace("_", " ")}
        </button>
      </div>
    </main>
  );
}
