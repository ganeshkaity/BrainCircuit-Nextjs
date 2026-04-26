"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut, User, Search, X, ShieldCheck, History, Flag, Trophy, Download } from "lucide-react";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { useUserStore } from "@/store/userStore";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/helpers";
import { processLoginStreak } from "@/lib/firebase/streak";
import StreakModal from "@/components/ui/StreakModal";
import StreakPopup from "@/components/ui/StreakPopup";
import PwaInstallPopup from "@/components/ui/PwaInstallPopup";
import { usePWA } from "@/hooks/usePWA";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  timerElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  className?: string;
  onSearch?: (query: string) => void;
  onBack?: () => void;
  isQuizMode?: boolean;
}

export default function Header({
  title,
  showBack = false,
  timerElement,
  rightElement,
  className,
  onSearch,
  onBack,
  isQuizMode = false,
}: HeaderProps) {
  const router = useRouter();
  const { user, clearUser, setUser } = useUserStore();
  const [imgError, setImgError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const { canInstall, installPWA } = usePWA();

  // Streak state
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [streakPopupVisible, setStreakPopupVisible] = useState(false);
  const [streakPopupData, setStreakPopupData] = useState({ streak: 0, shieldUsed: false });
  const streakProcessed = useRef(false);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  // Reset imgError when user changes
  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);

  // Process login streak once per session when user is available
  useEffect(() => {
    if (!user?.uid || isQuizMode || streakProcessed.current) return;
    streakProcessed.current = true;

    processLoginStreak(user.uid).then((result) => {
      // Update local user store with fresh streak data
      setUser({
        ...user,
        streak: result.streak,
        longestStreak: result.longestStreak,
        shields: result.shields,
      });

      // Show popup only if this is the first login of a new day
      if (result.isNewDay) {
        setStreakPopupData({ streak: result.streak, shieldUsed: result.shieldUsed });
        setTimeout(() => {
          setStreakPopupVisible(true);
          // Auto-dismiss after 3.5 seconds
          setTimeout(() => setStreakPopupVisible(false), 3500);
        }, 800); // Slight delay after page load
      }
    }).catch(console.error);
  }, [user?.uid, isQuizMode]);

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

  const logoClasses = cn(
    "flex items-center gap-2 select-none shrink-0",
    !isQuizMode && "cursor-pointer"
  );

  const streak = user?.streak || 0;
  const longestStreak = user?.longestStreak || 0;
  const shields = user?.shields ?? 2;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] safe-pt",
        className
      )}
    >
      {/* Main nav bar */}
      <div className="glass-dark border-b border-white/10 px-4 md:px-8 py-3 flex items-center justify-between gap-3 w-full max-w-screen-2xl mx-auto">
        {/* Left */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          {showBack && (
            <button
              onClick={() => onBack ? onBack() : router.back()}
              className="p-1.5 rounded-xl hover:bg-white/10 text-gray-300 transition-default shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          <div className="flex items-center gap-3 overflow-hidden">
            <div
              onClick={() => !isQuizMode && router.push("/home")}
              className={logoClasses}
            >
              <img src="/images/only_logo.png" alt="Brain Circuit Logo" className="w-8 h-8 object-contain" />
              {!isQuizMode && (
                <span className={cn(
                  "font-display font-bold text-white tracking-tight shrink-0",
                  title ? "hidden sm:inline-block text-sm opacity-80" : "text-base sm:text-lg inline-block"
                )}>
                  Brain<span className="text-purple-400">Circuit</span>
                </span>
              )}
            </div>

            {title && (
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-px h-4 bg-white/10 shrink-0" />
                <h1 className="font-display font-bold text-lg gradient-text truncate">
                  {title}
                </h1>
              </div>
            )}
          </div>
        </div>

        {/* Center – timer */}
        {timerElement && (
          <div className="flex-shrink-0">{timerElement}</div>
        )}

        {/* Right Element (for custom buttons like Submit in Quiz Mode) */}
        {rightElement && (
          <div className="flex-shrink-0">{rightElement}</div>
        )}

        {/* Search icon */}
        {onSearch && !isQuizMode && (
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

        {/* Streak Flame Button */}
        {user && !isQuizMode && (
          <button
            onClick={() => setStreakModalOpen(true)}
            className="relative flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-orange-500/30 bg-orange-500/10 hover:bg-orange-500/20 hover:border-orange-500/50 transition-all group shrink-0 shadow-sm shadow-orange-900/20"
            aria-label="Streak"
          >
            {/* Subtle glow behind flame */}
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-600/10 to-red-600/5 pointer-events-none" />

            {/* Flame SVG */}
            <motion.svg
              viewBox="0 0 611.999 611.999"
              className="w-4 h-4 relative z-10"
              xmlns="http://www.w3.org/2000/svg"
              animate={streak > 0 ? { scaleY: [1, 1.1, 1] } : {}}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <defs>
                <linearGradient id="flameGrad" x1="306" y1="0" x2="306" y2="612" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#ff9a00" />
                  <stop offset="60%" stopColor="#ff4500" />
                  <stop offset="100%" stopColor="#ff2200" />
                </linearGradient>
              </defs>
              <path 
                d="M216.02,611.195c5.978,3.178,12.284-3.704,8.624-9.4c-19.866-30.919-38.678-82.947-8.706-149.952 c49.982-111.737,80.396-169.609,80.396-169.609s16.177,67.536,60.029,127.585c42.205,57.793,65.306,130.478,28.064,191.029 c-3.495,5.683,2.668,12.388,8.607,9.349c46.1-23.582,97.806-70.885,103.64-165.017c2.151-28.764-1.075-69.034-17.206-119.851 c-20.741-64.406-46.239-94.459-60.992-107.365c-4.413-3.861-11.276-0.439-10.914,5.413c4.299,69.494-21.845,87.129-36.726,47.386 c-5.943-15.874-9.409-43.33-9.409-76.766c0-55.665-16.15-112.967-51.755-159.531c-9.259-12.109-20.093-23.424-32.523-33.073 c-4.5-3.494-11.023,0.018-10.611,5.7c2.734,37.736,0.257,145.885-94.624,275.089c-86.029,119.851-52.693,211.896-40.864,236.826 C153.666,566.767,185.212,594.814,216.02,611.195z"
                fill={streak > 0 ? "url(#flameGrad)" : "#374151"}
              />
            </motion.svg>
            <span className={cn(
              "text-sm font-black tabular-nums leading-none relative z-10",
              streak > 0 ? "text-orange-400" : "text-gray-500"
            )}>
              {streak}
            </span>
          </button>
        )}

        {/* Right – avatar menu or login */}
        <div className="relative flex-shrink-0" ref={menuRef}>
          {user && !isQuizMode ? (
            <>
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="w-9 h-9 rounded-full overflow-hidden border-2 border-white/10 hover:border-purple-500/50 transition-all focus:ring-2 focus:ring-purple-500/50"
              >
                {user.photoURL && !imgError ? (
                  <img
                    src={user.photoURL}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-purple-600 to-blue-600 flex items-center justify-center text-sm font-bold text-white">
                    {user.displayName?.[0]?.toUpperCase() || "U"}
                  </div>
                )}
              </button>

              <AnimatePresence>
                {menuOpen && !isQuizMode && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-12 w-56 bg-gray-950/95 backdrop-blur-xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-white/5"
                  >
                    <div className="p-3 border-b border-white/10">
                      <p className="text-sm font-semibold text-white truncate">
                        {user?.displayName ?? "User"}
                      </p>
                      <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                    </div>
                    {user?.isAdmin && (
                      <button
                        onClick={() => { setMenuOpen(false); window.open("/admin", "_blank"); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-purple-400 hover:bg-purple-500/10 transition-default font-semibold"
                      >
                        <ShieldCheck size={15} /> Admin Panel
                      </button>
                    )}
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/profile"); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-default"
                    >
                      <User size={15} /> Profile
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/leaderboard"); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-default"
                    >
                      <Trophy size={15} /> Leaderboard
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/recent-tests"); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-default"
                    >
                      <History size={15} /> Recent Tests
                    </button>
                    <button
                      onClick={() => { setMenuOpen(false); router.push("/reports"); }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-200 hover:bg-white/10 transition-default border-b border-white/5"
                    >
                      <Flag size={15} /> My Reports
                    </button>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-default"
                    >
                      <LogOut size={15} /> Logout
                    </button>
                    {canInstall && (
                      <button
                        onClick={() => { setMenuOpen(false); installPWA(); }}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-purple-400 hover:bg-purple-500/10 transition-default border-t border-white/5"
                      >
                        <Download size={15} /> Install App
                      </button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          ) : !isQuizMode && (
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

      {/* Streak Modal */}
      <StreakModal
        isOpen={streakModalOpen}
        onClose={() => setStreakModalOpen(false)}
        streak={streak}
        longestStreak={longestStreak}
        shields={shields}
      />

      <StreakPopup
        isVisible={streakPopupVisible}
        streak={streakPopupData.streak}
        shieldUsed={streakPopupData.shieldUsed}
      />
      
      <PwaInstallPopup />
    </header>
  );
}
