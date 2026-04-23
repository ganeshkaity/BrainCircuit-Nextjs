"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cookie, X, Shield, BarChart2, Zap } from "lucide-react";

const STORAGE_KEY = "bc-cookie-consent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Slight delay so it doesn't pop in instantly on page load
      const t = setTimeout(() => setVisible(true), 1200);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    close();
  };

  const decline = () => {
    localStorage.setItem(STORAGE_KEY, "declined");
    close();
  };

  const close = () => {
    setClosing(true);
    setTimeout(() => setVisible(false), 400);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop blur overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px] pointer-events-none"
          />

          {/* Cookie Banner */}
          <motion.div
            initial={{ y: 120, opacity: 0, scale: 0.95 }}
            animate={closing
              ? { y: 120, opacity: 0, scale: 0.95 }
              : { y: 0, opacity: 1, scale: 1 }
            }
            transition={{ type: "spring", stiffness: 260, damping: 24 }}
            className="fixed bottom-6 left-4 right-4 z-[9999] mx-auto max-w-lg"
          >
            {/* Glass card */}
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gray-900/80 backdrop-blur-2xl shadow-2xl shadow-purple-900/30 p-5">

              {/* Animated gradient top border */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-[length:200%_100%] animate-[shimmer_2s_linear_infinite]" />

              {/* Floating decorative orbs */}
              <div className="pointer-events-none absolute -top-12 -right-12 w-36 h-36 rounded-full bg-purple-600/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 w-24 h-24 rounded-full bg-blue-600/20 blur-2xl" />

              {/* Close button */}
              <button
                onClick={decline}
                className="absolute top-4 right-4 p-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Dismiss"
              >
                <X size={16} />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-3">
                <div className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 shrink-0 shadow-lg shadow-purple-900/30">
                  <Cookie size={20} className="text-white" />
                  {/* Ping dot */}
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-400 animate-ping opacity-75" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-purple-400" />
                </div>
                <div>
                  <h2 className="font-bold text-white text-base leading-tight">We use cookies 🍪</h2>
                  <p className="text-xs text-gray-400">Brain Circuit respects your privacy</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-300 mb-4 leading-relaxed">
                We use cookies to personalize your experience, analyze quiz performance, and keep you signed in.
                No data is sold to third parties.
              </p>

              {/* Feature pills */}
              <div className="flex flex-wrap gap-2 mb-5">
                {[
                  { icon: <Shield size={11} />, label: "Secure Auth" },
                  { icon: <BarChart2 size={11} />, label: "Analytics" },
                  { icon: <Zap size={11} />, label: "Performance" },
                ].map(({ icon, label }) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1.5 bg-white/5 border border-white/10 text-gray-400 text-xs px-3 py-1 rounded-full"
                  >
                    {icon}
                    {label}
                  </span>
                ))}
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={decline}
                  className="w-full sm:flex-1 py-2.5 rounded-2xl border border-white/10 text-gray-400 text-sm font-medium hover:bg-white/5 hover:text-white transition-all order-2 sm:order-1"
                >
                  Decline
                </button>
                <button
                  onClick={accept}
                  className="w-full sm:flex-[2] relative py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-bold shadow-lg shadow-purple-900/40 hover:shadow-purple-700/50 hover:scale-[1.02] active:scale-[0.98] transition-all overflow-hidden group order-1 sm:order-2"
                >
                  {/* Shine effect */}
                  <span className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                  Accept All Cookies
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
