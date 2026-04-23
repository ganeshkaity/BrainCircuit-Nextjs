"use client";

import { useQuery } from "@tanstack/react-query";
import { getQuizSet } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, BookOpen, AlertCircle, ChevronRight } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { motion } from "framer-motion";
import { use } from "react"; // For unwrap

export default function QuizDetailPage({
  params,
}: {
  params: Promise<{ quizId: string }>;
}) {
  const router = useRouter();
  const unwrappedParams = use(params);
  const quizId = unwrappedParams.quizId;

  const { data: quiz, isLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizSet(quizId),
  });

  const { initQuiz, quizId: currentQuizId, isSubmitted } = useQuizStore();

  const handleStart = () => {
    if (!quiz) return;
    if (!quiz.questions?.length) return alert("Quiz has no questions yet!");

    // Only reset if it's a new quiz or previous one was submitted
    if (currentQuizId !== quizId || isSubmitted) {
      // Shuffle all questions, then pick questionCount of them
      const shuffled = [...quiz.questions].sort(() => Math.random() - 0.5);
      const picked = shuffled.slice(0, quiz.questionCount);
      initQuiz({ quizId, questions: picked, durationMinutes: quiz.durationMinutes });
    }
    router.push(`/quiz/${quizId}/attempt`);
  };

  if (isLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!quiz) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Quiz not found</h1>
        <GradientButton onClick={() => router.push("/home")}>Go Home</GradientButton>
      </main>
    );
  }

  const isResume = currentQuizId === quizId && !isSubmitted;

  return (
    <main className="min-h-dvh pb-10 pt-16">
      <Header showBack />

      <div className="max-w-xl mx-auto px-5 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-md rounded-3xl p-6 relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full" />
          
          <div className="flex gap-2 mb-4">
            <span className="bg-purple-500/20 border border-purple-500/40 text-purple-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              {quiz.exam}
            </span>
            <span className="bg-blue-500/20 border border-blue-500/40 text-blue-300 text-xs font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              Class {quiz.classLevel}
            </span>
          </div>

          <h1 className="font-display font-black text-2xl md:text-3xl text-white mb-3 leading-tight">
            {quiz.title}
          </h1>
          
          {quiz.description && (
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {quiz.description}
            </p>
          )}

          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Clock className="text-blue-400 mb-2" size={20} />
              <p className="text-xs text-gray-400 mb-1">Duration</p>
              <p className="font-bold text-white">{quiz.durationMinutes} Mins</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <CheckCircle className="text-green-400 mb-2" size={20} />
              <p className="text-xs text-gray-400 mb-1">Total Marks</p>
              <p className="font-bold text-white">{quiz.totalMarks}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <BookOpen className="text-orange-400 mb-2" size={20} />
              <p className="text-xs text-gray-400 mb-1">Questions</p>
              <p className="font-bold text-white">{quiz.questionCount}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <AlertCircle className="text-red-400 mb-2" size={20} />
              <p className="text-xs text-gray-400 mb-1">Negative Marking</p>
              <p className="font-bold text-white">-{quiz.negativeMarks}</p>
            </div>
          </div>

          {/* Subjects tags */}
          <div className="mb-8">
            <h3 className="text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">Subjects Covered</h3>
            <div className="flex flex-wrap gap-2">
              {quiz.subjects.map((sub) => (
                <span key={sub} className="bg-white/10 text-gray-300 text-xs px-3 py-1.5 rounded-lg border border-white/10">
                  {sub}
                </span>
              ))}
            </div>
          </div>

          <GradientButton size="lg" fullWidth onClick={handleStart}>
            {isResume ? "Resume Quiz" : "Start Quiz"} <ChevronRight size={18} />
          </GradientButton>
        </motion.div>
      </div>
    </main>
  );
}
