"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Brain, Zap, Trophy, BookOpen, ChevronRight, Star } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";

const features = [
  {
    icon: <BookOpen size={24} />,
    title: "10,000+ Questions",
    desc: "Curated NEET & JEE questions with detailed explanations.",
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
    <main className="min-h-dvh flex flex-col">
      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-10 text-center relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-purple-700/30 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 rounded-full bg-blue-700/30 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: "spring" }}
          className="mb-6"
        >
          <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-brand-vivid flex items-center justify-center shadow-glow">
            <Brain size={48} className="text-white" />
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
          className="text-gray-300 text-lg max-w-sm mb-10 leading-relaxed"
        >
          The smartest way to crack <strong className="text-white">NEET</strong>{" "}
          &amp; <strong className="text-white">JEE</strong>. Practice. Rank.
          Succeed.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 w-full max-w-xs sm:max-w-sm"
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
