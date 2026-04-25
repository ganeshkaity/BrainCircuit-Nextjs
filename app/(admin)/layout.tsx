"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Header from "@/components/layout/Header";
import { FilePlus, LayoutDashboard, Users, List, Settings, Flag } from "lucide-react";
import { cn } from "@/lib/helpers";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/quizzes", label: "Manage Quizzes", icon: List },
  { href: "/admin/create-quiz", label: "Create Quiz", icon: FilePlus },
  { href: "/admin/test-groups", label: "Test Groups", icon: LayoutDashboard },
  { href: "/admin/manage-users", label: "Users", icon: Users },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/options", label: "App Options", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-dvh flex flex-col md:flex-row bg-gray-950">
      <Header className="md:hidden" title="Admin Panel" showBack />
      
      {/* Desktop Sidebar / Mobile Top Nav */}
      <nav className="hidden md:flex flex-col w-64 glass-dark border-r border-white/10 p-4 shrink-0">
        <div className="mb-8 px-4 py-2">
          <h2 className="font-display font-black text-xl gradient-text">Admin Panel</h2>
        </div>
        <div className="flex flex-col gap-2">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-default font-medium",
                  isActive ? "bg-purple-600/30 text-white" : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <Icon size={18} className={isActive ? "text-purple-400" : ""} />
                {label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="flex-1 pt-16 md:pt-0 overflow-y-auto">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-dark border-t border-white/10 px-2 py-2 safe-pb">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-col items-center justify-center p-3 rounded-2xl transition-default",
                  isActive ? "text-purple-400 bg-purple-500/10" : "text-gray-400"
                )}
              >
                <Icon size={22} />
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
