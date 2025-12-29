"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  GraduationCap, 
  Briefcase,     
  Settings, 
  LogOut, 
  Menu, 
  X,
  UserCheck,
  BookOpen // ✅ Imported for Course Manager
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRequireAdmin } from "@/lib/requireAdmin";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();
  
  const { isAuthorized, loading } = useRequireAdmin();

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-white">Loading Portal...</div>;
  if (!isAuthorized) return null;

  // 🗂️ SEPARATED NAVIGATION SECTIONS
  const navSections = [
    {
      title: "Overview",
      items: [
        { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      ]
    },
    {
      title: "Growth School", 
      items: [
        { name: "Enrolled Students", href: "/admin/students", icon: GraduationCap },
        { name: "Mentors & Faculty", href: "/admin/mentors", icon: UserCheck },
        { name: "Course Manager", href: "/admin/courses", icon: BookOpen }, // ✅ Added Course Manager Here
      ]
    },
    {
      title: "Placement Cell", 
      items: [
        { name: "Candidate Pipeline", href: "/admin/jobs", icon: Briefcase },
      ]
    },
    {
      title: "System",
      items: [
        { name: "Settings", href: "/admin/settings", icon: Settings },
      ]
    }
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
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">Pixalara Admin</h1>
            <p className="text-xs text-gray-500">Unified Management</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Scrollable Nav Items */}
        <nav className="mt-2 px-4 space-y-6 flex-1 overflow-y-auto">
          {navSections.map((section, idx) => (
            <div key={idx}>
              {/* SECTION HEADER */}
              {section.title && (
                <h3 className="px-4 mb-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
                  {section.title}
                </h3>
              )}
              
              {/* LINKS */}
              <div className="space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link 
                      key={item.href} 
                      href={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 text-sm font-medium
                        ${isActive 
                          ? "bg-blue-600/10 text-blue-400 border border-blue-600/20" 
                          : "text-gray-400 hover:bg-zinc-800 hover:text-white"
                        }
                      `}
                    >
                      <item.icon size={18} />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 shrink-0 bg-zinc-900/50">
          <button 
            onClick={logout}
            className="flex items-center gap-3 w-full px-4 py-3 text-gray-400 hover:text-red-400 hover:bg-red-950/30 rounded-lg transition-all text-sm font-medium"
          >
            <LogOut size={18} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* 🔵 Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        
        {/* 📱 Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-zinc-800 bg-black shrink-0">
          <h1 className="text-sm font-bold text-white uppercase tracking-wider">
            {navSections.find(s => s.items.some(i => i.href === pathname))?.items.find(i => i.href === pathname)?.name || "Dashboard"}
          </h1>
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