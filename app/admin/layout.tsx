"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  Settings, 
  LogOut, 
  Menu, 
  X 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRequireAdmin } from "@/lib/requireAdmin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  
  // Protect the route
  const { isAuthorized, loading } = useRequireAdmin();

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading...</div>;
  if (!isAuthorized) return null;

  const navItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Students", href: "/admin/students", icon: Users },
    { name: "Jobs & Placements", href: "/admin/jobs", icon: Briefcase },
    { name: "Settings", href: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-black text-gray-100 flex font-sans">
      
      {/* 📱 Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 🟢 Sidebar Navigation */}
      <aside 
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-zinc-900 border-r border-zinc-800 transform transition-transform duration-300 ease-in-out
          flex flex-col 
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0 md:static md:block
        `}
      >
        {/* Header */}
        <div className="p-6 flex items-center justify-between shrink-0">
          <h1 className="text-xl font-bold bg-gradient-to-r from-red-500 to-orange-500 bg-clip-text text-transparent">
            Pixalara Admin
          </h1>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Nav Items (Takes all available space) */}
        <nav className="mt-4 px-4 space-y-2 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? "bg-red-600/10 text-red-500 border border-red-600/20" 
                    : "text-gray-400 hover:bg-zinc-800 hover:text-white"
                  }
                `}
              >
                <item.icon size={20} />
                <span className="font-medium">{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer (Pinned to bottom naturally) */}
        <div className="p-4 border-t border-zinc-800 shrink-0 bg-zinc-900">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* 🔵 Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* 📱 Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-black shrink-0">
          <h1 className="text-lg font-bold text-white">Dashboard</h1>
          <button onClick={() => setSidebarOpen(true)} className="text-white">
            <Menu size={24} />
          </button>
        </header>

        {/* Content Wrapper */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-black">
          {children}
        </main>
      </div>
    </div>
  );
}