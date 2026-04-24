"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Zap, Trophy, BookOpen, ChevronRight, Star } from "lucide-react";
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
];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5 },
  }),
};

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

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="inline-flex items-center gap-4 px-8 py-3 rounded-2xl border border-white/10 bg-white/5 text-white font-black text-xs uppercase tracking-[0.3em] mb-12 backdrop-blur-xl shadow-2xl"
        >
          <span className="text-purple-400">Practice</span>
          <div className="w-1 h-1 bg-white/20 rounded-full" />
          <span className="text-blue-400">Rank</span>
          <div className="w-1 h-1 bg-white/20 rounded-full" />
          <span className="text-green-400">Succeed</span>
        </motion.div>

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
          <Link href="/login" className="flex-1">
            <GradientButton variant="secondary" size="lg" fullWidth>
              Log In
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
    </main>
  );
}
