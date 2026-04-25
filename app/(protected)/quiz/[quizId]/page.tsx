"use client";

import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { getQuizSet, getUserAttempts, toggleSavedQuiz } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import BottomNav from "@/components/layout/BottomNav";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, BookOpen, AlertCircle, ChevronRight, Loader2, Target, Calendar, Bookmark } from "lucide-react";
import { formatDuration } from "@/lib/helpers";
import { useQuizStore } from "@/store/quizStore";
import { useUserStore } from "@/store/userStore";
import { useUIStore } from "@/store/uiStore";
import { shuffleArray, formatTime } from "@/lib/helpers";
import { motion } from "framer-motion";
import { use, useState } from "react"; // For unwrap
import LoadingState from "@/components/ui/LoadingState";

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

  const { firebaseUid } = useUserStore();
  const { data: attempts } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => getUserAttempts(firebaseUid!),
    enabled: !!firebaseUid,
  });

  const { initQuiz, quizId: currentQuizId, isSubmitted } = useQuizStore();
  const { user, setUser } = useUserStore();
  const { showAlert } = useUIStore();
  const [isStarting, setIsStarting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isSaved = quiz && user?.savedQuizzes?.includes(quiz.id) || false;

  const handleSave = async () => {
    if (!user || !quiz || isSaving) return;
    setIsSaving(true);
    try {
      const newSaved = await toggleSavedQuiz(user.uid, quiz.id, user.savedQuizzes || []);
      setUser({ ...user, savedQuizzes: newSaved });
      showAlert({ message: isSaved ? "Removed from saved tests" : "Saved to your tests", type: "success" });
    } catch (error) {
      showAlert({ message: "Failed to save test", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStart = () => {
    if (!quiz || isStarting) return;
    if (!quiz.questions?.length) {
      showAlert({ 
        message: "This quiz has no questions yet. Please try another one.", 
        type: "warning",
        title: "Empty Quiz" 
      });
      return;
    }

    setIsStarting(true);

    // Only reset if it's a new quiz or previous one was submitted
    if (currentQuizId !== quizId || isSubmitted) {
      // 1. Force uniqueness of the source questions by ID
      const uniqueSourcePool = Array.from(new Map(quiz.questions.map(q => [q.id, q])).values());

      // 2. Pick N random questions from the entire pool
      const selectedPool = shuffleArray(uniqueSourcePool).slice(0, quiz.questionCount);

      // 3. Shuffle both the picking order and the internal options
      const picked = shuffleArray(selectedPool).map(q => {
        if (q.type === "integer" || !q.options) return q;

        // Deduplicate options while preserving correctness
        const seenOptions = new Set<string>();
        const uniqueOptionsWithCorrectness = q.options.reduce((acc: any[], opt: string, idx: number) => {
          const trimmedOpt = opt.trim();
          if (!seenOptions.has(trimmedOpt)) {
            seenOptions.add(trimmedOpt);
            acc.push({ text: trimmedOpt, isCorrect: q.correctOptions.includes(idx) });
          } else if (q.correctOptions.includes(idx)) {
            // If this duplicate was correct, ensure the existing unique one is also marked correct
            const existing = acc.find(o => o.text === trimmedOpt);
            if (existing) existing.isCorrect = true;
          }
          return acc;
        }, []);

        const shuffledOptions = shuffleArray(uniqueOptionsWithCorrectness);

        return {
          ...q,
          options: shuffledOptions.map((o: any) => o.text),
          correctOptions: shuffledOptions
            .map((o: any, idx: number) => o.isCorrect ? idx : -1)
            .filter((idx: number) => idx !== -1)
        };
      });
      
      initQuiz({ quizId, questions: picked, durationMinutes: quiz.durationMinutes });
    }
    
    // Tiny delay to ensure React state updates before blocking navigation
    setTimeout(() => {
      router.push(`/quiz/${quizId}/attempt`);
    }, 50);
  };

  if (isLoading) {
    return <LoadingState message="Fetching quiz details..." />;
  }

  if (!quiz) {
    return (
      <main className="min-h-dvh flex flex-col items-center justify-center p-6 text-center">
        <h1 className="text-xl font-bold text-white mb-2">Test not found</h1>
        <GradientButton onClick={() => router.push("/home")}>Go Home</GradientButton>
      </main>
    );
  }

  const isResume = currentQuizId === quizId && !isSubmitted;

    const hasAttempted = attempts && attempts.some(a => a.quizId === quizId);
  
    return (
      <main className="min-h-dvh pb-24 pt-16">
        <Header showBack onBack={() => router.replace("/home")} />
  
        <div className="max-w-xl mx-auto px-5 mt-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-md rounded-3xl p-6 relative overflow-hidden"
        >
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-purple-600/20 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-2 mb-4 flex-wrap">
            <span className="bg-purple-500/20 border border-purple-500/40 text-purple-300 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              {Array.isArray(quiz.exam) ? (quiz.exam.length > 1 ? "GENERAL" : quiz.exam[0]) : quiz.exam}
            </span>
            <span className="bg-blue-500/20 border border-blue-500/40 text-blue-300 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              Class {quiz.classLevel}
            </span>
            <span className="bg-teal-500/20 border border-teal-500/40 text-teal-300 text-[10px] font-bold px-2.5 py-1 rounded-md uppercase tracking-wider">
              {quiz.language}
            </span>
            
            <div className="ml-auto flex items-center gap-2 relative z-30">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`p-1.5 rounded-lg transition-all relative ${
                  isSaved 
                    ? "bg-purple-500/20 border border-purple-500/40 text-purple-400" 
                    : "bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
                title={isSaved ? "Remove from saved" : "Save for later"}
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Bookmark size={16} fill={isSaved ? "currentColor" : "none"} />}
              </button>
              
              {quiz.badge && (
                <span className={`bg-gradient-to-r ${quiz.badge.color} text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-[0.1em] shadow-lg`}>
                  {quiz.badge.label}
                </span>
              )}
            </div>
          </div>

          <h1 className="font-display font-black text-2xl md:text-3xl text-white mb-3 leading-tight">
            {quiz.title}
          </h1>
          
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
              <Clock className="text-blue-400 mb-2" size={20} />
              <p className="text-xs text-gray-400 mb-1">Duration</p>
              <p className="font-bold text-white">{formatDuration(quiz.durationMinutes)}</p>
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

          {quiz.description && (
            <div className="text-gray-400 text-sm mb-6 leading-relaxed">
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                  a: ({node, ...props}) => <a className="text-purple-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
                  ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                  ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                  strong: ({node, ...props}) => <strong className="font-bold text-gray-200" {...props} />,
                  em: ({node, ...props}) => <em className="italic text-gray-300" {...props} />,
                  h1: ({node, ...props}) => <h1 className="text-xl font-bold text-white mb-2 mt-4" {...props} />,
                  h2: ({node, ...props}) => <h2 className="text-lg font-bold text-white mb-2 mt-3" {...props} />,
                  h3: ({node, ...props}) => <h3 className="text-md font-bold text-white mb-2 mt-2" {...props} />,
                  code: ({node, className, children, ...props}: any) => {
                    const match = /language-(\w+)/.exec(className || '');
                    return !match ? (
                      <code className="bg-white/10 text-purple-300 px-1.5 py-0.5 rounded text-xs" {...props}>
                        {children}
                      </code>
                    ) : (
                      <code className="block bg-black/40 p-3 rounded-lg overflow-x-auto text-xs my-2 border border-white/5" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {quiz.description}
              </ReactMarkdown>
            </div>
          )}

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

          {/* Previous Attempts Section */}
          {attempts && attempts.filter(a => a.quizId === quizId).length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-medium text-gray-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Target size={14} className="text-purple-400" /> Your Performance History
              </h3>
              <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 no-scrollbar">
                {attempts
                  .filter(a => a.quizId === quizId)
                  .sort((a, b) => {
                    const timeA = (a.createdAt as any)?.seconds || 0;
                    const timeB = (b.createdAt as any)?.seconds || 0;
                    return timeB - timeA;
                  })
                  .map((attempt, idx) => (
                    <div key={idx} className="glass border border-white/5 hover:border-white/15 rounded-2xl p-3 flex items-center justify-between transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex flex-col items-center justify-center border",
                          attempt.score === quiz.totalMarks ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-white/5 border-white/10 text-white"
                        )}>
                          <span className="text-xs font-black leading-none">{attempt.score}</span>
                          <span className="text-[7px] font-bold uppercase tracking-tighter opacity-60">Marks</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-bold text-gray-300">Attempt #{attempts.filter(a => a.quizId === quizId).length - idx}</span>
                            <span className="w-1 h-1 rounded-full bg-gray-600" />
                            <span className="text-[9px] text-gray-500 flex items-center gap-1">
                              <Calendar size={10} /> {new Date((attempt.createdAt as any)?.seconds * 1000).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex gap-3">
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Target size={11} className="text-orange-400/80" />
                              <span className="font-medium">{attempt.percentage}% Acc.</span>
                            </div>
                            <div className="flex items-center gap-1 text-[10px] text-gray-400">
                              <Clock size={11} className="text-blue-400/80" />
                              <span className="font-medium">{formatTime(attempt.timeTaken)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => router.push(`/quiz/${quizId}/result?attemptId=${attempt.id}`)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                        title="View Full Result"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          )}

          <GradientButton size="lg" fullWidth onClick={handleStart} disabled={isStarting}>
            {isStarting ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Starting...
              </>
            ) : (
              <>
                {isResume ? "Resume Test" : (hasAttempted ? "Retake Test" : "Start Test")} <ChevronRight size={18} />
              </>
            )}
          </GradientButton>
        </motion.div>
      </div>
      <BottomNav />
    </main>
  );
}

// Helper for conditional classes
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
