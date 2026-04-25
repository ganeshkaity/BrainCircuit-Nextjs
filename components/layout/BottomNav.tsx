"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Trophy, User, BarChart2 } from "lucide-react";
import { cn } from "@/lib/helpers";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/profile", label: "Profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 safe-pb"
      aria-label="Bottom navigation"
    >
      <div className="glass-dark border-t border-white/10 px-4 pt-2 pb-3 md:px-8">
        <div className="flex items-center justify-around w-full max-w-screen-2xl mx-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-default"
                aria-current={isActive ? "page" : undefined}
              >
                <span className="relative">
                  {isActive && (
                    <motion.span
                      layoutId="bottom-nav-indicator"
                      className="absolute inset-0 -m-1.5 bg-purple-600/30 rounded-xl"
                    />
                  )}
                  <Icon
                    size={22}
                    className={cn(
                      "relative z-10 transition-default",
                      isActive ? "text-purple-400" : "text-gray-400"
                    )}
                  />
                </span>
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-purple-400" : "text-gray-500"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
