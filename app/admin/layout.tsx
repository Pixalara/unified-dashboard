"use client";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/");
      } else {
        setLoading(false);
      }
    });

    return () => unsub();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Checking admin access...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-black text-white">
      {/* Sidebar */}
      <aside className="w-64 bg-zinc-900 p-4">
        <h2 className="text-xl font-bold mb-6">Pixalara Admin</h2>

        <nav className="flex flex-col gap-3">
          <Link href="/admin/dashboard">Dashboard</Link>
          <Link href="/admin/students">Students</Link>
          <Link href="/admin/jobs">Jobs</Link>
          <Link href="/admin/settings">Settings</Link>
        </nav>

        <button
          className="mt-10 bg-red-600 p-2 rounded"
          onClick={() => auth.signOut()}
        >
          Logout
        </button>
      </aside>

      {/* Page content */}
      <main className="flex-1 p-6">
        {children}
      </main>
    </div>
  );
}
