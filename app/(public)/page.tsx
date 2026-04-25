"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Trophy, BookOpen, ChevronRight, Star, BarChart3, Globe, Lightbulb, Target } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";

const features = [
  {
    icon: <BookOpen size={24} />,
    title: "10,000+ Questions",
    desc: "Curated competitive exam questions with detailed explanations.",
  },
  {
    icon: <Zap size={24} />,
    title: "Real Exam Feel",
    desc: "Timed mock tests with JEE-style question palette.",
  },
  {
    icon: <Trophy size={24} />,
    title: "Live Leaderboard",
    desc: "Compete with students across India in real-time.",
  },
  {
    icon: <Star size={24} />,
    title: "Gamified Learning",
    desc: "Earn points, level up from Rookie to Legend.",
  },
  {
    icon: <BarChart3 size={24} />,
    title: "In-depth Analytics",
    desc: "Track your progress with detailed performance reports.",
  },
  {
    icon: <Globe size={24} />,
    title: "Multi-language",
    desc: "Prepare in your preferred language (English, Hindi, Bengali).",
  },
  {
    icon: <Lightbulb size={24} />,
    title: "Instant Solutions",
    desc: "Get step-by-step explanations for every question immediately.",
  },
  {
    icon: <Target size={24} />,
    title: "Daily Challenges",
    desc: "Solve hand-picked questions every day to maintain your streak.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

function TypewriterSlogan() {
  const words = ["Practice", "Rank", "Succeed", "Master", "Analyze", "Excel"];
  const colors = [
    "text-purple-400", 
    "text-blue-400", 
    "text-green-400", 
    "text-orange-400", 
    "text-pink-400", 
    "text-cyan-400"
  ];
  
  const [index, setIndex] = useState(0);
  const [subIndex, setSubIndex] = useState(0);
  const [reverse, setReverse] = useState(false);
  const [blink, setBlink] = useState(true);

  // Blinking cursor
  useEffect(() => {
    const timeout2 = setTimeout(() => {
      setBlink((prev) => !prev);
    }, 500);
    return () => clearTimeout(timeout2);
  }, [blink]);

  // Typing effect
  useEffect(() => {
    if (subIndex === words[index].length + 1 && !reverse) {
      setTimeout(() => setReverse(true), 2000);
      return;
    }

    if (subIndex === 0 && reverse) {
      setReverse(false);
      setIndex((prev) => (prev + 1) % words.length);
      return;
    }

    const timeout = setTimeout(() => {
      setSubIndex((prev) => prev + (reverse ? -1 : 1));
    }, reverse ? 75 : 150);

    return () => clearTimeout(timeout);
  }, [subIndex, index, reverse]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5 }}
      className="inline-flex items-center justify-center min-w-[240px] h-14 px-8 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl mb-12"
    >
      <span className={cn("font-black text-lg uppercase tracking-[0.3em] transition-colors duration-500", colors[index])}>
        {words[index].substring(0, subIndex)}
        <span className={cn("ml-1 transition-opacity duration-100", blink ? "opacity-100" : "opacity-0")}>|</span>
      </span>
    </motion.div>
  );
}

// Simple cn helper for the component
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export default function LandingPage() {
  return (
    <main className="min-h-dvh flex flex-col relative overflow-hidden bg-gray-950">
      {/* Moving Neon Gradient Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute inset-0 opacity-20 blur-[120px]"
          style={{
            background: "linear-gradient(-45deg, #7e22ce, #3b82f6, #06b6d4, #9333ea)",
            backgroundSize: "400% 400%",
          }}
        />
        {/* Ambient Overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(126,34,206,0.1),transparent_70%)]" />
      </div>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-10 text-center relative">

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-6"
        >
          <div className="w-28 h-28 mx-auto rounded-[2.5rem] bg-white flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.15)]">
            <img src="/images/only_logo.png" alt="Brain Circuit Logo" className="w-20 h-20 object-contain" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="font-display font-black text-5xl sm:text-6xl mb-4"
        >
          <span className="gradient-text">Brain</span>{" "}
          <span className="text-white">Circuit</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-gray-300 text-lg max-w-md mb-8 leading-relaxed px-6"
        >
          The smartest way to crack any <strong className="text-white">Competitive Exam</strong>.
        </motion.p>

        <TypewriterSlogan />

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-md px-6"
        >
          <Link href="/home" className="flex-1">
            <GradientButton size="lg" fullWidth>
              Get Started <ChevronRight size={18} />
            </GradientButton>
          </Link>
          <Link href="/signup" className="flex-1">
            <GradientButton variant="secondary" size="lg" fullWidth>
              Sign Up
            </GradientButton>
          </Link>
        </motion.div>
      </section>

      {/* Features */}
      <section className="px-6 pb-16 max-w-2xl mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center font-display font-bold text-2xl mb-8 text-white"
        >
          Why Brain Circuit?
        </motion.h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              custom={i}
              variants={fadeUp}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="glass rounded-2xl p-5 flex gap-4"
            >
              <span className="text-purple-400 flex-shrink-0">{f.icon}</span>
              <div>
                <h3 className="font-semibold text-white mb-1">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 border-t border-white/5 bg-black/20 backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center gap-3">
              <img src="/images/only_logo.png" className="w-8 h-8 object-contain" alt="Logo" />
              <span className="font-display font-black text-xl text-white tracking-tight">BrainCircuit</span>
            </div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.3em] mt-1">Practice. Rank. Succeed.</p>
          </div>
          
          <div className="flex gap-8 text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">
            <Link href="/signup" className="hover:text-purple-400 transition-colors">Sign Up</Link>
            <Link href="/home" className="hover:text-purple-400 transition-colors">Join Now</Link>
            <a href="mailto:support@braincircuit.in" className="hover:text-purple-400 transition-colors">Support</a>
          </div>

          <div className="flex flex-col items-center gap-2 pt-4 border-t border-white/5 w-full">
            <p className="text-[10px] text-gray-600 font-medium">
              © {new Date().getFullYear()} Brain Circuit. All rights reserved.
            </p>
            <div className="flex items-center gap-2 opacity-30">
              <span className="text-[9px] font-bold text-white uppercase tracking-widest">
                Build by Ganesh
              </span>
              <span className="w-1 h-1 rounded-full bg-purple-500" />
              <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest">
                v 1.0.4.7
              </span>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
