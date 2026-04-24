"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, Loader2, BrainCircuit } from "lucide-react";

const FACTS = [
  "Your brain has about 86 billion neurons working together.",
  "Spaced repetition is the secret to moving knowledge into long-term memory.",
  "Active learning is up to 10x more effective than passive reading.",
  "Your brain uses 20% of your body's total energy to think.",
  "The 'forgetting curve' shows we lose 70% of new info in 24 hours without review.",
  "Teaching someone else is one of the best ways to master a topic yourself.",
  "A single bolt of lightning contains enough energy to toast 100,000 slices of bread.",
  "There are more trees on Earth than stars in our galaxy.",
  "Taking short breaks during study sessions actually improves focus and retention.",
  "Your brain generates enough electricity to power a small light bulb.",
  "The average person has about 6,200 thoughts every single day.",
  "Sleeping after studying helps consolidate memories and improves performance."
];

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = "Loading your experience..." }: LoadingStateProps) {
  const [factIndex, setFactIndex] = useState(0);

  useEffect(() => {
    setFactIndex(Math.floor(Math.random() * FACTS.length));
    
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % FACTS.length);
    }, 4000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-gray-950/80 backdrop-blur-xl">
      <div className="relative mb-12">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-purple-500/20 blur-[60px] rounded-full scale-150 animate-pulse" />
        
        {/* Animated Logo Container */}
        <motion.div
          animate={{ 
            rotate: 360,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            rotate: { duration: 4, repeat: Infinity, ease: "linear" },
            scale: { duration: 2, repeat: Infinity, ease: "easeInOut" }
          }}
          className="relative w-20 h-20 bg-gradient-to-tr from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center shadow-2xl border border-white/20"
        >
          <BrainCircuit className="text-white w-10 h-10" />
        </motion.div>
        
        {/* Orbiting dots */}
        <div className="absolute inset-0 -m-4 border border-white/5 rounded-full animate-[spin_10s_linear_infinite]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -mt-1 w-2 h-2 bg-purple-400 rounded-full blur-[1px]" />
      </div>

      <div className="max-w-xs w-full text-center space-y-6">
        <div className="space-y-1">
          <h3 className="text-white font-black text-xl tracking-tight">{message}</h3>
          <div className="flex items-center justify-center gap-1">
            <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-bounce" />
          </div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-md rounded-2xl p-5 border border-white/10 relative overflow-hidden group"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-purple-500 to-blue-500" />
          
          <div className="flex items-start gap-3 text-left">
            <div className="p-2 bg-purple-500/10 rounded-lg shrink-0">
              <Lightbulb className="text-yellow-400 w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-purple-400 font-black uppercase tracking-widest mb-1">Did you know?</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={factIndex}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="text-xs text-gray-300 leading-relaxed font-medium"
                >
                  {FACTS[factIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 text-[9px] text-gray-600 font-bold uppercase tracking-[0.2em] pointer-events-none">
        Brain Circuit Engine v1.0.0
      </div>
    </div>
  );
}
