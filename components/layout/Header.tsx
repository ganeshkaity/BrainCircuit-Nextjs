"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, User, Search, X } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useUserStore } from "@/store/userStore";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/helpers";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  timerElement?: React.ReactNode;
  className?: string;
  onSearch?: (query: string) => void;
}

export default function Header({
  title,
  showBack = false,
  timerElement,
  className,
  onSearch,
}: HeaderProps) {
  const router = useRouter();
  const { user, clearUser } = useUserStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    await signOut(auth);
    clearUser();
    router.push("/login");
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    onSearch?.(val);
  };

  const handleCloseSearch = () => {
    setSearchOpen(false);
    setSearchQuery("");
    onSearch?.("");
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 safe-pt",
        className
      )}
    >
      {/* Main nav bar */}
      <div className="glass-dark border-b border-white/10 px-4 md:px-8 py-3 flex items-center justify-between gap-3 w-full max-w-screen-2xl mx-auto">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1">
          {showBack && (
            <button
              onClick={() => router.back()}
              className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 transition-default shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          {title ? (
            <h1 className="font-display font-bold text-lg gradient-text truncate">
              {title}
            </h1>
          ) : (
            <div
              onClick={() => router.push("/home")}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <img src="/logo.png" alt="Brain Circuit Logo" className="w-8 h-8 object-contain" />
              <span className="font-display font-bold text-xl text-white hidden sm:block tracking-tight">
                Brain<span className="text-purple-400">Circuit</span>
              </span>
            </div>
          )}
        </div>

        {/* Center – timer */}
        {timerElement && (
          <div className="flex-shrink-0">{timerElement}</div>
        )}

        {/* Search icon */}
        {onSearch && (
          <button
            onClick={() => setSearchOpen((v) => !v)}
            className={cn(
              "p-2 rounded-xl transition-default shrink-0",
              searchOpen
                ? "bg-purple-600/30 text-purple-300"
                : "hover:bg-white/10 text-gray-300"
            )}
            aria-label="Search"
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
        )}

        {/* Right – avatar menu or login */}
        <div className="relative flex-shrink-0">
          {user ? (
            <>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="w-9 h-9 rounded-full bg-gradient-brand-vivid flex items-center justify-center text-white font-bold text-sm ring-2 ring-purple-500/40"
                aria-label="User menu"
              >
                {user?.displayName?.[0]?.toUpperCase() ?? "?"}
              </button>

              <AnimatePresence>
                {menuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-48 glass-md rounded-2xl overflow-hidden shadow-glass-lg border border-white/20"
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.displayName ?? "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-default"
                    >
                      <User size={15} /> Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-default"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : (
            <button
              onClick={() => router.push("/login?from=/home")}
              className="px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white text-sm font-medium transition-colors"
            >
              Log In
            </button>
          )}
        </div>
      </div>

      {/* Floating search bar – slides down below the nav */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            key="search-pill"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="px-4 py-2.5 bg-gray-950 border-b border-white/10"
          >
            <div className="flex items-center max-w-screen-2xl mx-auto">
              <div
                tabIndex={-1}
                className="flex items-center w-full rounded-2xl bg-gray-800/80 border border-purple-500/50 px-4 py-2.5 gap-3 shadow-xl shadow-purple-950/40 outline-none"
              >
                <Search size={17} className="text-purple-400 shrink-0" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Search quizzes by name or topic..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="flex-1 bg-transparent text-white placeholder-gray-500 text-sm outline-none border-none focus:outline-none focus:ring-0 focus:shadow-none"
                  style={{ outline: "none", boxShadow: "none" }}
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange("")}
                    className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white transition-all shrink-0"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
