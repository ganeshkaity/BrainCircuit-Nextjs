"use client";

import { use, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getQuizSet, getUserAttempts, getAttempt } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import { CheckCircle, XCircle, MinusCircle, BookOpen, Lightbulb } from "lucide-react";
import { cn } from "@/lib/helpers";
import { motion, AnimatePresence } from "framer-motion";

type FilterTab = "all" | "correct" | "wrong" | "unattempted";

export default function AnalysisPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const { firebaseUid } = useUserStore();
  const [activeFilter, setActiveFilter] = useState<FilterTab>("all");

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizSet(quizId),
  });

  const { data: directAttempt, isLoading: directLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => getAttempt(attemptId!),
    enabled: !!attemptId,
  });

  const { data: attempts, isLoading: attemptsLoading } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => getUserAttempts(firebaseUid!),
    enabled: !!firebaseUid && !attemptId,
  });

  const attempt = directAttempt || attempts?.find(a => a.quizId === quizId);

  // Only show questions that were actually in this attempt.
  // Use stored questionIds (new attempts) or fall back to answered question IDs (old attempts).
  const attemptQuestionIds: string[] = attempt?.questionIds
    ?? Object.keys(attempt?.answers ?? {});

  // Preserve the original order from the attempt
  const allQuestions = attemptQuestionIds
    .map(id => (quiz?.questions ?? []).find(q => q.id === id))
    .filter(Boolean) as NonNullable<typeof quiz>["questions"];

  const isLoading = quizLoading || (attemptId ? directLoading : attemptsLoading);

  if (isLoading || !attempt || !quiz) {
    return (
      <main className="min-h-dvh flex items-center justify-center bg-gray-950">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  // Pre-compute statuses
  const questionData = allQuestions.map((q) => {
    const userAns = attempt.answers[q.id] || [];
    const isAttempted = userAns.length > 0;
    const userAnsStr = [...userAns].sort().join(",");
    const correctAnsStr = [...q.correctOptions].sort().join(",");
    const isCorrect = isAttempted && userAnsStr === correctAnsStr;
    const isWrong = isAttempted && !isCorrect;
    return { q, userAns, isAttempted, isCorrect, isWrong };
  });

  const correctCount = questionData.filter(d => d.isCorrect).length;
  const wrongCount = questionData.filter(d => d.isWrong).length;
  const unattemptedCount = questionData.filter(d => !d.isAttempted).length;

  const filteredQuestions = questionData.filter(d => {
    if (activeFilter === "correct") return d.isCorrect;
    if (activeFilter === "wrong") return d.isWrong;
    if (activeFilter === "unattempted") return !d.isAttempted;
    return true;
  });

  const tabs: { key: FilterTab; label: string; count: number; color: string }[] = [
    { key: "all", label: "All", count: allQuestions.length, color: "text-white" },
    { key: "correct", label: "Correct", count: correctCount, color: "text-green-400" },
    { key: "wrong", label: "Wrong", count: wrongCount, color: "text-red-400" },
    { key: "unattempted", label: "Skipped", count: unattemptedCount, color: "text-gray-400" },
  ];

  return (
    <main className="min-h-dvh pb-16 pt-16">
      <Header showBack title="Detailed Analysis" />

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-5">

        {/* Summary Row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass rounded-2xl p-4 text-center border border-green-500/20 bg-green-500/5">
            <CheckCircle size={20} className="text-green-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-green-400">{correctCount}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Correct</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center border border-red-500/20 bg-red-500/5">
            <XCircle size={20} className="text-red-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-red-400">{wrongCount}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Wrong</p>
          </div>
          <div className="glass rounded-2xl p-4 text-center border border-white/10 bg-white/5">
            <MinusCircle size={20} className="text-gray-400 mx-auto mb-1" />
            <p className="text-2xl font-black text-gray-400">{unattemptedCount}</p>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Skipped</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key)}
              className={cn(
                "flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all duration-200 flex items-center justify-center gap-1.5 whitespace-nowrap min-w-fit",
                activeFilter === tab.key
                  ? "bg-gray-800 text-white shadow-md"
                  : "text-gray-500 hover:text-gray-300"
              )}
            >
              <span className={activeFilter === tab.key ? tab.color : ""}>{tab.count}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Question Cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            {filteredQuestions.length === 0 && (
              <div className="text-center py-16 text-gray-500">
                <BookOpen size={40} className="mx-auto mb-3 opacity-30" />
                <p className="font-medium">No questions in this category</p>
              </div>
            )}

            {filteredQuestions.map(({ q, userAns, isAttempted, isCorrect, isWrong }, index) => {
              // Card border & glow by status
              const cardStyle = isCorrect
                ? "border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)]"
                : isWrong
                ? "border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.08)]"
                : "border-white/5";

              const originalIndex = allQuestions.findIndex(aq => aq.id === q.id);

              return (
                <motion.div
                  key={q.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className={cn("glass rounded-2xl p-5 border", cardStyle)}
                >
                  {/* Question Header */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-gray-400 font-bold text-sm">Q{originalIndex + 1}.</span>
                      <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-gray-300 font-semibold uppercase tracking-wider">
                        {q.subject}
                      </span>
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider",
                        q.difficulty === "easy" ? "bg-green-500/10 text-green-400" :
                        q.difficulty === "hard" ? "bg-red-500/10 text-red-400" :
                        "bg-yellow-500/10 text-yellow-400"
                      )}>
                        {q.difficulty}
                      </span>
                    </div>

                    {/* Status Badge */}
                    {isCorrect ? (
                      <span className="shrink-0 flex items-center gap-1.5 text-green-400 text-xs font-bold bg-green-400/10 border border-green-500/30 px-3 py-1.5 rounded-full">
                        <CheckCircle size={13} /> +{quiz.marksPerQuestion}
                      </span>
                    ) : isWrong ? (
                      <span className="shrink-0 flex items-center gap-1.5 text-red-400 text-xs font-bold bg-red-400/10 border border-red-500/30 px-3 py-1.5 rounded-full">
                        <XCircle size={13} /> −{quiz.negativeMarks}
                      </span>
                    ) : (
                      <span className="shrink-0 flex items-center gap-1.5 text-gray-400 text-xs font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-full">
                        <MinusCircle size={13} /> 0
                      </span>
                    )}
                  </div>

                  {/* Question Text */}
                  <p className="text-white mb-4 whitespace-pre-wrap leading-relaxed text-sm">{q.text}</p>
                  {q.imageUrl && <img src={q.imageUrl} alt="Figure" className="rounded-xl max-w-full h-auto mb-4 border border-white/10" />}

                  {/* Options */}
                  <div className="space-y-2 mb-4">
                    {q.type === "integer" ? (
                      <div className="flex gap-3">
                        <div className={cn("flex-1 p-4 rounded-xl text-center border", isAttempted ? (isCorrect ? "bg-green-500/10 border-green-500/40" : "bg-red-500/10 border-red-500/40") : "bg-white/5 border-white/10")}>
                          <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Your Answer</p>
                          <p className={cn("text-2xl font-black", isCorrect ? "text-green-400" : isWrong ? "text-red-400" : "text-gray-500")}>
                            {isAttempted ? userAns[0] : "—"}
                          </p>
                        </div>
                        <div className="flex-1 bg-green-500/10 border border-green-500/40 p-4 rounded-xl text-center">
                          <p className="text-[10px] text-green-300 font-bold uppercase mb-1">Correct Answer</p>
                          <p className="text-2xl font-black text-green-400">{q.correctOptions[0]}</p>
                        </div>
                      </div>
                    ) : (
                      q.options.map((opt, i) => {
                        const isUserSelection = userAns.includes(i);
                        const isActuallyCorrect = q.correctOptions.includes(i);
                        const isMulti = q.type === "multi";

                        const optStyle = isActuallyCorrect
                          ? "bg-green-500/15 border-green-500/60 text-green-100 ring-1 ring-green-500/40"
                          : isUserSelection && !isActuallyCorrect
                          ? "bg-red-500/15 border-red-500/60 text-red-100 ring-1 ring-red-500/40"
                          : "bg-white/3 border-white/8 text-gray-400";

                        return (
                          <div key={i} className={cn("p-3 rounded-xl border transition-all flex items-start gap-3", optStyle)}>
                            <div className={cn("mt-0.5 shrink-0 flex items-center justify-center", isMulti ? "w-5 h-5 rounded border border-current" : "w-5 h-5 rounded-full border border-current")}>
                              {isActuallyCorrect && <CheckCircle size={14} className="text-green-400" />}
                              {isUserSelection && !isActuallyCorrect && <XCircle size={14} className="text-red-400" />}
                            </div>
                            <span className="text-sm leading-relaxed">{opt}</span>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Explanation — always visible for wrong/unattempted, collapsible for correct */}
                  {q.explanation && (
                    <div className={cn(
                      "mt-2 rounded-xl p-4 border",
                      isWrong || !isAttempted
                        ? "bg-red-900/20 border-red-500/30"
                        : "bg-blue-900/15 border-blue-500/20"
                    )}>
                      <h4 className={cn(
                        "text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5",
                        isWrong || !isAttempted ? "text-red-400" : "text-blue-300"
                      )}>
                        <Lightbulb size={12} />
                        {isWrong ? "Why your answer was wrong" : !isAttempted ? "You missed this one — here's why" : "Explanation"}
                      </h4>
                      <p className={cn(
                        "text-sm whitespace-pre-wrap leading-relaxed",
                        isWrong || !isAttempted ? "text-red-100/80" : "text-blue-100/80"
                      )}>
                        {q.explanation}
                      </p>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}
