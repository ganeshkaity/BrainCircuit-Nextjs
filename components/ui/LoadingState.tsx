"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Lightbulb, BrainCircuit } from "lucide-react";

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
    }, 4500);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center p-6 bg-gray-950/80 backdrop-blur-2xl">
      {/* Background ambient light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-purple-600/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="relative mb-16">
        {/* Pulsing Neural Rings */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.6, opacity: 0.8 }}
            animate={{ scale: 2.2, opacity: 0 }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              delay: i * 1,
              ease: "easeOut" 
            }}
            className="absolute inset-0 border border-purple-500/40 rounded-full"
          />
        ))}
        
        {/* Floating Data Particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`p-${i}`}
            initial={{ opacity: 0, y: 0, x: 0 }}
            animate={{ 
              opacity: [0, 1, 0], 
              y: -80,
              x: (i % 2 === 0 ? 1 : -1) * (15 + i * 5)
            }}
            transition={{ 
              duration: 2.5, 
              repeat: Infinity, 
              delay: i * 0.4,
              ease: "easeOut" 
            }}
            className="absolute top-1/2 left-1/2 w-1 h-1 bg-blue-400 rounded-full blur-[0.5px]"
          />
        ))}

        {/* Core Animated Brain */}
        <motion.div
          animate={{ 
            scale: [1, 1.05, 1],
            y: [0, -4, 0]
          }}
          transition={{ 
            duration: 3, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
          className="relative z-10 w-20 h-20 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 rounded-[2rem] flex items-center justify-center shadow-[0_0_40px_rgba(168,85,247,0.3)] border border-white/20"
        >
          <BrainCircuit className="text-white w-10 h-10" />
          
          {/* Inner Glow */}
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-t from-white/10 to-transparent pointer-events-none" />
        </motion.div>
      </div>

      <div className="max-w-xs w-full text-center space-y-8 relative z-20">
        <div className="space-y-3">
          <motion.h3 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white font-bold text-xl tracking-tight"
          >
            {message}
          </motion.h3>
          <div className="flex items-center justify-center gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.span 
                key={i}
                animate={{ 
                  scale: [1, 1.5, 1],
                  opacity: [0.3, 1, 0.3]
                }}
                transition={{ 
                  duration: 1.2, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
                className="w-1.5 h-1.5 bg-purple-500 rounded-full"
              />
            ))}
          </div>
        </div>

        {/* Fact Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative group"
        >
          {/* Card Glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-10 group-hover:opacity-20 transition duration-1000" />
          
          <div className="relative glass-dark rounded-2xl p-6 border border-white/10 overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50" />
            
            <div className="flex flex-col gap-3 items-center">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 rounded-lg">
                  <Lightbulb className="text-yellow-400 w-3.5 h-3.5" />
                </div>
                <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em]">Learning Byte</p>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={factIndex}
                  initial={{ opacity: 0, scale: 0.95, filter: "blur(4px)" }}
                  animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                  exit={{ opacity: 0, scale: 1.05, filter: "blur(4px)" }}
                  transition={{ duration: 0.6 }}
                  className="text-sm text-gray-200 leading-relaxed font-medium text-center"
                >
                  {FACTS[factIndex]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 opacity-40">
        <div className="text-[9px] text-gray-400 font-black uppercase tracking-[0.3em]">Neural Engine</div>
        <div className="w-12 h-[1px] bg-gradient-to-r from-transparent via-gray-500 to-transparent" />
      </div>
    </div>
  );
}
