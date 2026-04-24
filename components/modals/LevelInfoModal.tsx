"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Star, Zap, Crown, Shield } from "lucide-react";

interface LevelInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const LEVELS = [
  { name: "Rookie", points: "0 - 500", icon: <Zap size={20} className="text-blue-400" />, desc: "Starting your journey in the circuit." },
  { name: "Scholar", points: "501 - 2,000", icon: <Star size={20} className="text-green-400" />, desc: "Gaining momentum and deep knowledge." },
  { name: "Expert", points: "2,001 - 5,000", icon: <Shield size={20} className="text-purple-400" />, desc: "A proven master of multiple subjects." },
  { name: "Master", points: "5,001 - 15,000", icon: <Trophy size={20} className="text-orange-400" />, desc: "One of the top minds on the platform." },
  { name: "Legend", points: "15,000+", icon: <Crown size={20} className="text-yellow-400" />, desc: "Elite status. The ultimate circuit master." },
];

export default function LevelInfoModal({ isOpen, onClose }: LevelInfoModalProps) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-[#0f0c29] border border-white/10 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
        >
          <div className="flex items-center justify-between p-5 border-b border-white/10 shrink-0">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="text-yellow-400" size={22} />
              Level System
            </h2>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
            <p className="text-sm text-gray-400 leading-relaxed">
              Earn points by taking quizzes and ranking high on the leaderboard. Each milestone unlocks a new rank and special badges!
            </p>

            <div className="space-y-3 pt-2">
              {LEVELS.map((level, i) => (
                <div key={i} className="glass-md p-4 rounded-2xl flex items-center gap-4 border border-white/5">
                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
                    {level.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white">{level.name}</h3>
                      <span className="text-[10px] font-black text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded-full uppercase tracking-tighter">
                        {level.points} PTS
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5">{level.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-5 border-t border-white/10 shrink-0">
            <button 
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-brand-vivid text-white font-bold shadow-glow transition-transform active:scale-95"
            >
              Got it!
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
