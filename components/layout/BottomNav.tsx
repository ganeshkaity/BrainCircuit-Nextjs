"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, User, BarChart2, LayoutList, CircuitBoard } from "lucide-react";
import { cn } from "@/lib/helpers";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/tests", label: "Tests", icon: LayoutList },
  { href: "/circuit", label: "Circuit", icon: CircuitBoard, center: true },
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
      <div className="bottom-nav-cutout relative px-3 pt-3 pb-3 md:px-8">
        <div className="grid grid-cols-5 items-end w-full max-w-screen-2xl mx-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`);
            const isCenter = href === "/circuit";

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 rounded-xl transition-default",
                  isCenter
                    ? "-mt-10 pb-0"
                    : "px-1 py-1 min-w-0 hover:bg-white/5"
                )}
                aria-current={isActive ? "page" : undefined}
                aria-label={label}
              >
                {isCenter ? (
                  <motion.span
                    whileTap={{ scale: 0.94 }}
                    className={cn(
                      "relative grid place-items-center w-16 h-16 rounded-full border shadow-2xl transition-default",
                      "bg-gradient-brand-vivid border-purple-300/40 shadow-purple-950/60",
                      isActive && "ring-4 ring-purple-500/20"
                    )}
                  >
                    <span className="absolute inset-1 rounded-full border border-white/15" />
                    <Icon size={29} className="relative z-10 text-white drop-shadow" />
                  </motion.span>
                ) : (
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
                )}
                <span
                  className={cn(
                    "text-[10px] font-medium truncate max-w-full",
                    isCenter
                      ? "mt-1 text-purple-200"
                      : isActive
                        ? "text-purple-400"
                        : "text-gray-500"
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
