"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  Briefcase, 
  Settings, 
  LogOut,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/context/AuthContext"; // Assuming you have this

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const menuItems = [
    {
      category: "Overview",
      items: [
        { name: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
      ]
    },
    {
      category: "Growth School",
      items: [
        { name: "Enrolled Students", icon: Users, href: "/admin/students" },
        { name: "Mentors & Faculty", icon: GraduationCap, href: "/admin/mentors" },
        { name: "Course Manager", icon: BookOpen, href: "/admin/courses" },
      ]
    },
    {
      category: "Placement Cell",
      items: [
        // ✅ LINKED TO YOUR NEW PIPELINE PAGE
        { name: "Candidate Pipeline", icon: Briefcase, href: "/admin/pipeline" },
      ]
    },
    {
      category: "System",
      items: [
        { name: "Settings", icon: Settings, href: "/admin/settings" },
      ]
    }
  ];

  const handleLogout = async () => {
      await logout();
      router.push("/login");
  };

  return (
    <div className="min-h-screen bg-black flex font-sans selection:bg-blue-500/30 text-gray-100">
      
      {/* 🟢 SIDEBAR */}
      <aside className="w-64 border-r border-zinc-800 bg-black flex-shrink-0 fixed h-full z-10 hidden md:flex flex-col">
        
        {/* Brand */}
        <div className="h-16 flex items-center px-6 border-b border-zinc-800">
             <div className="flex items-center gap-2 text-white font-bold text-xl tracking-tight">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <Sparkles size={16} fill="white" />
                </div>
                Pixalara Admin
             </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto py-6 px-4 space-y-8">
            {menuItems.map((section, idx) => (
                <div key={idx}>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-2">
                        {section.category}
                    </h3>
                    <div className="space-y-1">
                        {section.items.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link 
                                    key={item.href} 
                                    href={item.href}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                                        isActive 
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" 
                                        : "text-gray-400 hover:text-white hover:bg-white/5"
                                    }`}
                                >
                                    <item.icon size={18} />
                                    {item.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-zinc-800">
            <button 
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 w-full transition-all"
            >
                <LogOut size={18} />
                Sign Out
            </button>
        </div>
      </aside>

      {/* 🔵 MAIN CONTENT AREA */}
      <div className="flex-1 md:ml-64">
          {/* Top Bar (Mobile Toggle placeholder could go here) */}
          <div className="p-8">
             {children}
          </div>
      </div>

    </div>
  );
}