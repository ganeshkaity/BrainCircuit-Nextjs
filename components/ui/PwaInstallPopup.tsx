"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download } from "lucide-react";
import { usePWA } from "@/hooks/usePWA";
import { useUserStore } from "@/store/userStore";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import dayjs from "dayjs";

export default function PwaInstallPopup() {
  const { canInstall, installPWA } = usePWA();
  const { user, setUser } = useUserStore();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!user || !canInstall) return;

    // Check last prompted time
    const lastPrompt = user.lastPwaPromptAt;
    let shouldShow = true;

    if (lastPrompt) {
      const daysSinceLastPrompt = dayjs().diff(dayjs(lastPrompt), 'day');
      if (daysSinceLastPrompt < 3) {
        shouldShow = false;
      }
    }

    if (shouldShow) {
      // Small delay so it pops up after page load smoothly
      const timer = setTimeout(() => setShow(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [user, canInstall]);

  const handleDismiss = async () => {
    setShow(false);
    if (!user) return;
    
    try {
      const now = new Date().toISOString();
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { lastPwaPromptAt: now });
      setUser({ ...user, lastPwaPromptAt: now });
    } catch (err) {
      console.error("Failed to update PWA prompt timestamp", err);
    }
  };

  const handleInstall = async () => {
    await installPWA();
    handleDismiss(); // Update timestamp so we don't bother them again if they cancel
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed top-20 right-5 z-50 w-72 bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-purple-500/30 overflow-hidden"
        >
          <div className="p-4 relative">
            <button 
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={14} />
            </button>
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-xl bg-gradient-brand-vivid flex items-center justify-center shrink-0 shadow-glow">
                <Download size={20} className="text-white" />
              </div>
              <div className="pr-4">
                <h4 className="text-sm font-bold text-white mb-0.5">Install App</h4>
                <p className="text-xs text-gray-400 leading-tight mb-3">
                  Add Brain Circuit to your home screen for faster access.
                </p>
              </div>
            </div>
            <button 
              onClick={handleInstall}
              className="w-full py-2 bg-purple-600 hover:bg-purple-500 text-white text-sm font-bold rounded-xl transition-colors shadow-lg"
            >
              Install Now
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
