"use client";

import { useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getQuizSet, getUserAttempts, calculateRank } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import confetti from "canvas-confetti";
import Header from "@/components/layout/Header";
import GradientButton from "@/components/ui/GradientButton";
import { Trophy, Clock, Target, ArrowRight, BarChart2 } from "lucide-react";
import { formatTime } from "@/lib/helpers";
import { motion } from "framer-motion";

export default function ResultPage({ params }: { params: Promise<{ quizId: string }> }) {
  const router = useRouter();
  const { quizId } = use(params);
  const { user, firebaseUid } = useUserStore();

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizSet(quizId),
  });

  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => getUserAttempts(firebaseUid!),
    enabled: !!firebaseUid,
  });

  // Latest attempt for this quiz
  const attempt = attempts?.find(a => a.quizId === quizId);

  const { data: rank } = useQuery({
    queryKey: ["rank", quizId, attempt?.id],
    queryFn: () => calculateRank({ quizId, score: attempt!.score, timeTaken: attempt!.timeTaken }),
    enabled: !!attempt,
  });

  useEffect(() => {
    if (attempt && quiz && attempt.score === quiz.totalMarks) {
      const duration = 3 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 5,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#a855f7', '#3b82f6', '#f97316']
        });
        confetti({
          particleCount: 5,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#a855f7', '#3b82f6', '#f97316']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [attempt, quiz]);

  if (quizLoading || attemptsLoading) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  if (!attempt || !quiz) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <p className="text-gray-400 mb-4">No attempt found.</p>
        <GradientButton onClick={() => router.push("/home")}>Go Home</GradientButton>
      </main>
    );
  }

  const percentage = Math.round((attempt.score / quiz.totalMarks) * 100);

  return (
    <main className="min-h-dvh pb-10 pt-16">
      <Header title="Result" />

      <div className="max-w-md mx-auto px-5 mt-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-md rounded-3xl p-8 text-center relative overflow-hidden mb-6"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center mb-6 shadow-glow border-4 border-gray-900 z-10 relative">
            <span className="text-3xl font-black text-white">{percentage}%</span>
          </div>

          <h1 className="text-3xl font-black text-white mb-2">
            {attempt.score} <span className="text-lg text-gray-400 font-medium">/ {quiz.totalMarks}</span>
          </h1>
          <p className="text-purple-300 font-medium mb-8">+ {attempt.pointsEarned} Points Earned!</p>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/5 rounded-2xl p-4">
              <Trophy className="text-yellow-400 mb-2" size={20} />
              <p className="text-xs text-gray-400 mb-1">Rank</p>
              <p className="font-bold text-white text-lg">{rank ? `#${rank}` : "-"}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <Clock className="text-blue-400 mb-2" size={20} />
              <p className="text-xs text-gray-400 mb-1">Time Taken</p>
              <p className="font-bold text-white text-lg">{formatTime(attempt.timeTaken)}</p>
            </div>
          </div>
        </motion.div>

        <div className="space-y-3">
          <GradientButton fullWidth size="lg" onClick={() => router.push(`/quiz/${quizId}/analysis`)}>
            <BarChart2 size={18} /> View Detailed Analysis
          </GradientButton>
          <GradientButton variant="secondary" fullWidth size="lg" onClick={() => router.push("/home")}>
            Back to Home
          </GradientButton>
        </div>
      </div>
    </main>
  );
}
