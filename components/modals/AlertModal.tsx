"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { useUIStore } from "@/store/uiStore";

export default function AlertModal() {
  const state = useUIStore();
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    if (state.isOpen) {
      setInputValue(state.defaultValue || "");
    }
  }, [state.isOpen, state.defaultValue]);

  if (!state.isOpen) return null;

  const config = {
    success: {
      icon: <CheckCircle className="text-green-400" size={32} />,
      color: "text-green-400",
      bg: "bg-green-400/10",
      border: "border-green-400/20",
      button: "bg-green-500",
      defaultTitle: "Success"
    },
    error: {
      icon: <AlertCircle className="text-red-400" size={32} />,
      color: "text-red-400",
      bg: "bg-red-400/10",
      border: "border-red-400/20",
      button: "bg-red-500",
      defaultTitle: "Error"
    },
    warning: {
      icon: <AlertTriangle className="text-yellow-400" size={32} />,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      border: "border-yellow-400/20",
      button: "bg-yellow-500",
      defaultTitle: "Warning"
    },
    info: {
      icon: <Info className="text-blue-400" size={32} />,
      color: "text-blue-400",
      bg: "bg-blue-400/10",
      border: "border-blue-400/20",
      button: "bg-blue-500",
      defaultTitle: "Information"
    }
  };

  const current = config[state.type];

  const handleConfirm = () => {
    state.onConfirm?.(inputValue);
    state.closeAlert();
  };

  const handleCancel = () => {
    state.onCancel?.();
    state.closeAlert();
  };

  return (
    <AnimatePresence>
      <motion.div 
        key={state.title + state.message}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      >
        <motion.div 
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-[#0f0c29] border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl"
        >
          <div className="p-8 flex flex-col items-center text-center">
            <div className={`w-20 h-20 rounded-full ${current.bg} flex items-center justify-center mb-6 border ${current.border}`}>
              {current.icon}
            </div>
            
            <h2 className={`text-xl font-bold mb-2 ${current.color}`}>
              {state.title || current.defaultTitle}
            </h2>
            
            <p className="text-gray-400 leading-relaxed text-sm mb-6">
              {state.message}
            </p>

            {state.showInput && (
              <div className="w-full mb-6">
                <input 
                  type="text" 
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={state.placeholder || "Type here..."}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all text-center text-lg font-medium"
                  autoFocus
                />
              </div>
            )}

            <div className="flex flex-col gap-3 w-full">
              <button 
                onClick={handleConfirm}
                className={`w-full py-3.5 rounded-2xl text-white font-bold shadow-lg transition-transform active:scale-95 ${current.button}`}
              >
                {state.confirmText || (state.showInput ? 'Submit' : 'Dismiss')}
              </button>
              
              {state.showCancel && (
                <button 
                  onClick={handleCancel}
                  className="w-full py-3.5 rounded-2xl bg-white/5 text-gray-300 font-bold hover:bg-white/10 transition-all active:scale-95 border border-white/5"
                >
                  {state.cancelText || 'Cancel'}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

