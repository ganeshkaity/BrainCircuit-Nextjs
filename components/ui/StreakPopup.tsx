"use client";

import { motion, AnimatePresence } from "framer-motion";

interface StreakPopupProps {
  isVisible: boolean;
  streak: number;
  shieldUsed?: boolean;
}

export default function StreakPopup({ isVisible, streak, shieldUsed }: StreakPopupProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 80, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -40, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 350, damping: 28 }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[300] pointer-events-none select-none"
        >
          <div className="relative flex flex-col items-center">
            {/* Glow ring */}
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-orange-500/30 blur-2xl"
            />

            {/* Card */}
            <div className="relative bg-[#0d0d1a]/95 border border-orange-500/40 rounded-3xl px-8 py-5 text-center shadow-2xl shadow-orange-900/50">
              {/* Floating fire particles */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${15 + i * 15}%`,
                    bottom: "100%",
                  }}
                  initial={{ y: 0, opacity: 1, scale: 0.5 }}
                  animate={{
                    y: [-10, -50 - Math.random() * 30],
                    opacity: [1, 0],
                    scale: [0.5, 1.2, 0],
                    x: [(Math.random() - 0.5) * 20],
                  }}
                  transition={{
                    duration: 1 + Math.random() * 0.8,
                    repeat: Infinity,
                    delay: i * 0.15,
                    ease: "easeOut",
                  }}
                >
                  <svg viewBox="0 0 20 24" className="w-4 h-4 text-orange-400" fill="currentColor">
                    <path d="M10 2C10 2 14 6 14 10C14 12 12.5 13.5 11 13C11.5 11 10.5 9.5 9.5 9C9.5 9 10 12 8.5 13.5C7.5 12 7 10.5 7 9C6 10 6 11.5 6.5 12.5C5.5 11.5 4 10 4 8.5C4 5 10 2 10 2Z" />
                  </svg>
                </motion.div>
              ))}

              {/* Main Flame */}
              <motion.svg
                viewBox="0 0 60 60"
                className="w-16 h-16 mx-auto mb-3"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                animate={{ scaleY: [1, 1.1, 0.95, 1.08, 1] }}
                transition={{ duration: 0.8, repeat: 3, ease: "easeInOut" }}
              >
                <path
                  d="M30 6C30 6 42 16 42 28C42 34 39 38 35.5 38C37 33 34 30 32.5 28C32.5 28 34 38 27 43C26 38 23 35 21 28C18 31 18 36 19.5 39.5C17 37 12 33.5 12 27C12 16 30 6 30 6Z"
                  fill="url(#pf1)"
                />
                <path
                  d="M30 21C30 21 37 28 37 34C37 37.5 34.5 40 30 41.5C25.5 40 23 37.5 23 34C23 28 30 21 30 21Z"
                  fill="url(#pf2)"
                />
                <defs>
                  <linearGradient id="pf1" x1="30" y1="6" x2="30" y2="44" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#ff9a00" />
                    <stop offset="60%" stopColor="#ff4500" />
                    <stop offset="100%" stopColor="#ff2200" />
                  </linearGradient>
                  <linearGradient id="pf2" x1="30" y1="21" x2="30" y2="42" gradientUnits="userSpaceOnUse">
                    <stop offset="0%" stopColor="#fff7aa" />
                    <stop offset="100%" stopColor="#ff9a00" />
                  </linearGradient>
                </defs>
              </motion.svg>

              {/* Streak Number */}
              <motion.p
                className="text-5xl font-black text-white leading-none"
                animate={{ scale: [0.5, 1.2, 1] }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                {streak}
              </motion.p>
              <p className="text-orange-400 font-black text-sm uppercase tracking-widest mt-1">
                Day Streak!
              </p>

              {shieldUsed && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 flex items-center justify-center gap-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl px-3 py-1.5"
                >
                  <svg viewBox="0 0 36 36" className="w-5 h-5" xmlns="http://www.w3.org/2000/svg">
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
                  <span className="text-orange-400 text-xs font-bold">Wood used to keep your fire burning!</span>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
