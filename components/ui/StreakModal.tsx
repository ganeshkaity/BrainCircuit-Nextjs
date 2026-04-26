"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface StreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streak: number;
  longestStreak: number;
  shields: number;
}

export default function StreakModal({ isOpen, onClose, streak, longestStreak, shields }: StreakModalProps) {
  const days = ["S", "M", "T", "W", "T", "F", "S"];
  const today = new Date().getDay(); // 0=Sun ... 6=Sat

  // Build last 7 days – mark as "active" if within current streak count
  const last7 = days.map((d, i) => {
    const dayIndex = (today - (6 - i) + 7) % 7;
    const daysAgo = 6 - i;
    const isActive = daysAgo < streak;
    const isToday = i === 6;
    return { label: d, isActive, isToday };
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 60, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 35 }}
            className="fixed bottom-0 left-0 right-0 z-[201] sm:inset-0 sm:flex sm:items-center sm:justify-center sm:p-4 pointer-events-none"
          >
            <div
              className="pointer-events-auto w-full sm:max-w-sm bg-[#0d0d1a] border border-white/10 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative px-6 pt-8 pb-4 text-center overflow-hidden">
                {/* Glow bg */}
                <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent pointer-events-none" />

                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                >
                  <X size={16} />
                </button>

                {/* Giant Flame */}
                <motion.div
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-block mb-2"
                >
                  <svg viewBox="0 0 80 80" className="w-20 h-20 mx-auto" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="flameGlow" cx="50%" cy="80%" r="60%">
                        <stop offset="0%" stopColor="#ff6a00" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#ff6a00" stopOpacity="0" />
                      </radialGradient>
                    </defs>
                    <ellipse cx="40" cy="70" rx="32" ry="10" fill="url(#flameGlow)" />
                    <path
                      d="M40 8C40 8 56 22 56 38C56 46 52 50 48 50C50 44 46 40 44 38C44 38 46 52 36 58C34 50 30 46 28 38C24 42 24 48 26 52C22 48 18 44 18 36C18 22 40 8 40 8Z"
                      fill="url(#flameColors)"
                    />
                    <path
                      d="M40 28C40 28 48 36 48 44C48 48 45 52 40 54C35 52 32 48 32 44C32 36 40 28 40 28Z"
                      fill="url(#innerFlame)"
                    />
                    <defs>
                      <linearGradient id="flameColors" x1="40" y1="8" x2="40" y2="60" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#ff9a00" />
                        <stop offset="50%" stopColor="#ff4500" />
                        <stop offset="100%" stopColor="#ff2200" />
                      </linearGradient>
                      <linearGradient id="innerFlame" x1="40" y1="28" x2="40" y2="54" gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor="#fff7aa" />
                        <stop offset="100%" stopColor="#ff9a00" />
                      </linearGradient>
                    </defs>
                  </svg>
                </motion.div>

                <h2 className="text-4xl font-black text-white mb-1">{streak}<span className="text-orange-400"> day</span></h2>
                <p className="text-gray-400 text-sm font-medium">Login Streak</p>
              </div>

              {/* Week view */}
              <div className="px-6 py-4 border-t border-white/5">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-3">This Week</p>
                <div className="flex justify-between gap-1">
                  {last7.map((d, i) => (
                    <div key={i} className="flex flex-col items-center gap-1.5 flex-1">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
                        d.isActive
                          ? "bg-gradient-to-b from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30"
                          : "bg-white/5 text-gray-600"
                      } ${d.isToday ? "ring-2 ring-orange-400 ring-offset-1 ring-offset-[#0d0d1a]" : ""}`}>
                        {d.isActive ? (
                          <svg viewBox="0 0 20 20" className="w-4 h-4" fill="currentColor">
                            <path d="M10 2C10 2 14 5.5 14 9.5C14 11.5 13 13 11.5 13C12 11.5 11 10.5 10.5 9.5C10.5 9.5 11 12.5 9 14C8.5 12.5 7.5 11.5 7 9.5C6 10.5 6 12 6.5 13C5.5 12 4 10.5 4 9C4 5.5 10 2 10 2Z" />
                          </svg>
                        ) : (
                          <span className="text-xs">{d.label}</span>
                        )}
                      </div>
                      <span className="text-[9px] text-gray-500 font-bold">{d.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Stats */}
              <div className="px-6 py-4 grid grid-cols-2 gap-3 border-t border-white/5">
                <div className="bg-white/5 rounded-2xl p-4 text-center">
                  <p className="text-2xl font-black text-white">{longestStreak}</p>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1">Best Streak</p>
                </div>
                {/* Woods */}
                <div className="bg-white/5 rounded-2xl p-4 text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    {[0, 1].map((i) => (
                      <svg key={i} viewBox="0 0 36 36" className={`w-7 h-7 ${i < shields ? "opacity-100" : "opacity-20 grayscale"}`} xmlns="http://www.w3.org/2000/svg">
                        <path fill="#662113" d="M17.34 1.835C11.231 2.323 9 5.399 9 8.34c0 2.101-.348 17.904-.348 20.005s2.071 4.385 4.946 5.703c4.186 1.919 14.663 1.074 14.569-5.926c-.107-7.999.045-18.757.045-18.757c-.001-5.213-4.845-8.012-10.872-7.53z"></path>
                        <path fill="#C1694F" d="M10.948 10.993c3.768 3.14 9.956 2.961 13.601 1.026c3.5-1.858 3.796-4.882 1.488-7.288C24.07 2.68 19.365 1.6 15.311 2.524c-4.561 1.04-8.058 5.389-4.363 8.469z"></path>
                        <path fill="#FFE8B6" d="M11.949 10.568c3.271 2.726 8.37 2.407 11.807.891c3.147-1.389 3.52-4.01 1.292-6.327c-1.71-1.778-5.792-2.718-9.312-1.916c-3.959.902-6.995 4.678-3.787 7.352z"></path>
                        <path fill="#662113" d="M9.142 15.03c-1.223-.876-3.315-2.484-3.81-2.804c-.81-.525-2.583 1.725-1.219 3.512s4.088 4.296 4.746 7.729c.659 3.433.283-8.437.283-8.437z"></path>
                        <ellipse transform="rotate(-75.345 4.875 13.817)" fill="#C1694F" cx="4.876" cy="13.818" rx="1.167" ry=".706"></ellipse>
                        <path fill="#D99E82" d="M18.666 11.588c-2.247 0-4.511-.762-5.608-1.658c-.808-.66-1.223-1.544-1.138-2.425c.068-.703.489-1.723 2.109-2.591c2.326-1.247 4.73-1.616 6.949-1.069c2.296.564 4.698 2.357 4.477 4.026c-.236 1.768-3.604 3.299-5.267 3.59a8.84 8.84 0 0 1-1.522.127zm.273-6.988c-1.451 0-2.958.403-4.438 1.196c-.973.521-1.521 1.146-1.585 1.806c-.053.542.23 1.109.775 1.554c1.183.966 4.009 1.728 6.326 1.32c1.747-.306 4.313-1.742 4.447-2.737c.128-.962-1.752-2.438-3.724-2.923a7.491 7.491 0 0 0-1.801-.216z"></path>
                        <path fill="#D99E82" d="M18.432 9.424c-.986 0-1.906-.24-2.423-.663c-.433-.354-.654-.835-.607-1.321c.037-.38.255-.926 1.084-1.371c.629-.337 2.067-.645 3.043-.544c1.105.111 2.625.869 2.589 1.853c-.059 1.524-1.646 1.789-2.697 1.964a6.026 6.026 0 0 1-.989.082zm.687-2.918c-.79 0-1.784.243-2.162.445c-.337.181-.542.394-.56.585c-.014.145.077.313.244.45c.402.329 1.489.556 2.615.37c1.406-.234 1.841-.472 1.861-1.016c-.039-.213-.846-.736-1.688-.82a3.4 3.4 0 0 0-.31-.014z"></path>
                        <path fill="#292F33" d="M14.213 34.188l.401-6.282l.49 6.594zm11.985-1.648l.178-7.352l.49 6.594z"></path>
                        <path fill="#C1694F" d="M15.639 22.827l.712-4.589l.09 4.99l.445 4.722zm5.257 11.138l-.178-9.98l.846 7.396zm2.762-13.812l.134-6.327l.511 3.574a.832.832 0 0 1-.019.333l-.626 2.42z"></path>
                      </svg>
                    ))}
                  </div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Woods Left</p>
                  <p className="text-[9px] text-gray-600 mt-0.5">2 per month</p>
                </div>
              </div>

              {/* Tip */}
              <div className="px-6 pb-8 pt-2">
                <p className="text-center text-[10px] text-gray-500 leading-relaxed">
                  {shields > 0
                    ? `🪵 You have ${shields} wood${shields > 1 ? "s" : ""} this month. Woods help keep your fire burning if you miss a day.`
                    : "🔥 Keep logging in daily to maintain your streak!"}
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
