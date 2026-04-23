"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQuizSets } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import QuizCard from "@/components/cards/QuizCard";
import { motion } from "framer-motion";

export default function HomePage() {
  const { user } = useUserStore();
  const [filterExam, setFilterExam] = useState(user?.targetExam || "");

  const { data: quizzes = [], isLoading } = useQuery({
    queryKey: ["quizzes"],
    queryFn: () => getQuizSets(),
  });

  const filtered = quizzes.filter(
    (q) => !filterExam || q.exam === filterExam
  );

  return (
    <main className="min-h-dvh pb-24 pt-16">
      <Header />
      
      <div className="px-5 max-w-4xl mx-auto mt-4">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          {user ? (
            <>
              <h1 className="text-2xl font-display font-bold text-white mb-1">
                Hello, <span className="gradient-text">{user.displayName?.split(" ")[0] || "Student"}</span>!
              </h1>
              <p className="text-gray-400 text-sm">Ready to crack {user.targetExam || "your exam"}?</p>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-display font-bold text-white mb-1">
                Welcome to <span className="gradient-text">Brain Circuit</span>!
              </h1>
              <p className="text-gray-400 text-sm">Please log in to start practicing quizzes and track your progress.</p>
            </>
          )}
        </motion.div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-4">
          {["All", "NEET", "JEE Mains", "JEE Advanced"].map((exam) => {
            const val = exam === "All" ? "" : exam;
            const active = filterExam === val;
            return (
              <button
                key={exam}
                onClick={() => setFilterExam(val)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-default border ${
                  active
                    ? "bg-purple-600 border-purple-500 text-white"
                    : "glass text-gray-300 border-transparent hover:bg-white/10"
                }`}
              >
                {exam}
              </button>
            );
          })}
        </div>

        {/* Quiz Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((quiz, i) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
              >
                <QuizCard quiz={quiz} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 glass rounded-2xl">
            <p className="text-gray-400">No quizzes available for this category yet.</p>
          </div>
        )}
      </div>
    </main>
  );
}
