"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useQuizStore } from "@/store/quizStore";
import { useUserStore } from "@/store/userStore";
import { useUIStore } from "@/store/uiStore";
import { saveAttempt, getQuizSet, calculateRank, updateUser } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import { formatTime, calculateScore, getPointsForAttempt, cn } from "@/lib/helpers";
import { ChevronLeft, ChevronRight, ChevronDown, Bookmark, Menu, X, Clock, AlertTriangle, Delete } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizEnginePage({ params }: { params: Promise<{ quizId: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { quizId } = use(params);
  const { user, firebaseUid, setUser } = useUserStore();
  
  const store = useQuizStore();
  const { showAlert } = useUIStore();
  const {
    questions, currentIndex, answers, remainingSeconds, isSubmitted,
    setAnswer, toggleMark, visitQuestion, next, prev, goTo, tickTimer, submitQuiz, getPaletteStatus
  } = store;

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [legendOpen, setLegendOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Timer
  useEffect(() => {
    if (isSubmitted || isSubmitting) return;
    const interval = setInterval(() => {
      tickTimer();
      if (store.remainingSeconds <= 1) {
        clearInterval(interval);
        handleSubmit();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isSubmitted, isSubmitting, store.remainingSeconds]);

  // Visit on mount/index change
  useEffect(() => {
    if (questions[currentIndex]) {
      visitQuestion(questions[currentIndex].id);
    }
  }, [currentIndex, questions]);

  const handleSubmit = async () => {
    if (isSubmitting || isSubmitted) return;
    if (!firebaseUid || !user) return;
    
    setIsSubmitting(true);
    submitQuiz();

    try {
      const quiz = await getQuizSet(quizId);
      if (!quiz) throw new Error("Quiz not found");

      const score = calculateScore({
        answers,
        questions,
        marksPerQuestion: quiz.marksPerQuestion,
        negativeMarks: quiz.negativeMarks,
      });

      const timeTaken = quiz.durationMinutes * 60 - store.remainingSeconds;

      // For points logic, let's assume it's their first attempt for now.
      // A more robust system would check getUserAttempts to see if `isFirstAttempt` is true.
      // For MVP, we'll treat all as first.
      const pointsEarned = getPointsForAttempt({ score, maxScore: quiz.totalMarks, isFirstAttempt: true });

      const attemptRef = await saveAttempt({
        uid: firebaseUid,
        quizId,
        answers,
        questionTimes: store.questionTimes,
        questionIds: questions.map(q => q.id),
        score,
        maxScore: quiz.totalMarks,
        percentage: parseFloat(((score / quiz.totalMarks) * 100).toFixed(3)),
        timeTaken,
        pointsEarned,
        isFirstAttempt: true,
      });

      // Update user points
      const newPoints = user.points + pointsEarned;
      await updateUser(firebaseUid, { points: newPoints });
      setUser({ ...user, points: newPoints });

      // Invalidate attempts cache so the result page fetches the fresh attempt
      await queryClient.invalidateQueries({ queryKey: ["attempts", firebaseUid] });

      // Route to result page with the specific attempt ID to avoid race conditions
      router.replace(`/quiz/${quizId}/result?attemptId=${attemptRef.id}`);

    } catch (err) {
      console.error(err);
      showAlert({ 
        message: "Failed to submit. Please try again.",
        type: "error",
        title: "Submission Error"
      });
      setIsSubmitting(false);
    }
  };

  const handleExitAttempt = () => {
    if (isSubmitted || isSubmitting) return;

    showAlert({
      title: "Discard Attempt?",
      message: "Are you sure you want to leave the quiz? Your current progress will be lost.",
      type: "warning",
      showCancel: true,
      confirmText: "Exit Quiz",
      cancelText: "Continue Test",
      onConfirm: () => {
        // Force navigate without the guard
        router.push(`/quiz/${quizId}`);
      }
    });
  };

  // Navigation guard
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitted || isSubmitting) return;
      e.preventDefault();
      e.returnValue = ""; 
    };

    if (!isSubmitted) {
      window.history.pushState(null, "", window.location.href);
    }

    const handlePopState = () => {
      if (isSubmitted || isSubmitting) return;
      window.history.pushState(null, "", window.location.href);
      handleExitAttempt();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.addEventListener("popstate", handlePopState);
    
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isSubmitted, isSubmitting, quizId, router, showAlert]);

  if (!questions.length) {
    return (
      <main className="min-h-dvh flex items-center justify-center p-6 text-center">
        <div>
          <p className="text-gray-400 mb-4">Quiz session not found or expired.</p>
          <GradientButton onClick={() => router.push(`/quiz/${quizId}`)}>Go Back</GradientButton>
        </div>
      </main>
    );
  }

  const q = questions[currentIndex];
  const selectedOptions = answers[q.id] || [];

  const handleOptionClick = (index: number) => {
    if (q.type === "single") {
      setAnswer(q.id, [index]);
    } else if (q.type === "multi") {
      const isSelected = selectedOptions.includes(index);
      const updated = isSelected
        ? selectedOptions.filter((i) => i !== index)
        : [...selectedOptions, index];
      setAnswer(q.id, updated);
    }
  };

  const handleKeypadPress = (key: string) => {
    // Current string value from the array or empty
    let currentStr = selectedOptions.length > 0 && selectedOptions[0] !== undefined 
      ? String(selectedOptions[0]) 
      : "";

    if (key === "BACKSPACE") {
      currentStr = currentStr.slice(0, -1);
    } else {
      // Prevent multiple decimals
      if (key === "." && currentStr.includes(".")) return;
      currentStr += key;
    }

    if (currentStr === "" || currentStr === ".") {
      setAnswer(q.id, []);
    } else {
      setAnswer(q.id, [currentStr as any]);
    }
  };

  const handleSubmitClick = () => {
    showAlert({
      message: "Are you sure you want to submit the quiz? You won't be able to change your answers after this.",
      type: "warning",
      title: "Submit Quiz?",
      showCancel: true,
      confirmText: "Submit Now",
      cancelText: "Keep Working",
      onConfirm: handleSubmit
    });
  };

  const allAnswered = Object.values(answers).filter(a => a.length > 0).length === questions.length;
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <main className="h-dvh flex flex-col bg-gray-950 overflow-hidden">
      <Header
        showBack={true}
        onBack={handleExitAttempt}
        isQuizMode={true}
        className="bg-gray-950/80 backdrop-blur-md border-b border-white/5 pb-2 pt-safe relative z-40"
        timerElement={
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-red-400 font-bold tabular-nums">
            <Clock size={16} />
            {formatTime(remainingSeconds)}
          </div>
        }
        rightElement={
          <GradientButton
            onClick={handleSubmitClick}
            isLoading={isSubmitting}
            className="px-4 py-1.5 h-auto text-xs md:text-sm md:px-6 md:py-2.5"
          >
            Submit
          </GradientButton>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-20 md:pb-0">
        
        {/* Left: Question Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto custom-scrollbar pt-4 md:pt-6">
          <div className="max-w-3xl mx-auto space-y-6 pb-24">
            
            {/* Question Header */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-gray-400 uppercase tracking-wider">
                Question {currentIndex + 1} <span className="text-gray-600 font-normal">of {questions.length}</span>
              </span>
              <div className="flex gap-2 text-xs">
                <span className="bg-white/5 px-2 py-1 rounded text-gray-300">{q.subject}</span>
                <span className={cn(
                  "px-2 py-1 rounded",
                  q.difficulty === "easy" ? "bg-green-500/20 text-green-300" :
                  q.difficulty === "medium" ? "bg-yellow-500/20 text-yellow-300" :
                  "bg-red-500/20 text-red-300"
                )}>
                  {q.difficulty}
                </span>
              </div>
            </div>

            {q.type === "multi" && (
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 flex items-start gap-3">
                <AlertTriangle className="text-yellow-500 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-bold text-yellow-500">Multiple Correct Options</p>
                  <p className="text-xs text-yellow-200/70">More than one option may be correct. Select all that apply.</p>
                </div>
              </div>
            )}
            
            {q.type === "integer" && (
              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3 flex items-start gap-3">
                <AlertTriangle className="text-blue-400 shrink-0 mt-0.5" size={18} />
                <div>
                  <p className="text-sm font-bold text-blue-400">Integer Type</p>
                  <p className="text-xs text-blue-200/70">Use the virtual keypad below to enter your numeric answer.</p>
                </div>
              </div>
            )}

            {/* Question Content */}
            <div className="glass-md p-5 rounded-2xl">
              <p className="text-white text-lg leading-relaxed whitespace-pre-wrap">{q.text}</p>
              {q.imageUrl && (
                <img src={q.imageUrl} alt="Question figure" className="mt-4 rounded-xl max-w-full h-auto" />
              )}
            </div>

            {/* Options or Virtual Keypad */}
            {q.type === "integer" ? (
              <div className="space-y-4 max-w-sm mx-auto">
                <input
                  type="text"
                  readOnly
                  value={selectedOptions.length > 0 ? selectedOptions[0] : ""}
                  placeholder="Enter answer..."
                  className="w-full text-center text-2xl font-bold bg-gray-900 border-2 border-purple-500/50 rounded-2xl py-4 text-white focus:outline-none focus:border-purple-500 shadow-glow pointer-events-none"
                />
                
                <div className="grid grid-cols-3 gap-2">
                  {["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "BACKSPACE"].map((key) => (
                    <button
                      key={key}
                      onClick={() => handleKeypadPress(key)}
                      className={cn(
                        "h-14 rounded-xl font-bold text-lg transition-colors flex items-center justify-center",
                        key === "BACKSPACE" ? "bg-red-500/20 text-red-400 hover:bg-red-500/30" : "glass text-white hover:bg-white/10"
                      )}
                    >
                      {key === "BACKSPACE" ? <Delete size={20} /> : key}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {q.options.map((opt, i) => {
                  const isSelected = selectedOptions.includes(i);
                  const isMulti = q.type === "multi";
                  return (
                    <button
                      key={i}
                      onClick={() => handleOptionClick(i)}
                      className={cn(
                        "w-full text-left p-4 rounded-xl border transition-default flex gap-3",
                        isSelected
                          ? "bg-purple-600/20 border-purple-500"
                          : "glass border-transparent hover:bg-white/5"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-center shrink-0 mt-0.5",
                        isMulti ? "w-6 h-6 rounded border-2" : "w-6 h-6 rounded-full border-2",
                        isSelected ? "border-purple-400 bg-purple-500/20" : "border-gray-500"
                      )}>
                        {isSelected && (
                          isMulti 
                            ? <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            : <div className="w-2.5 h-2.5 bg-purple-400 rounded-full" />
                        )}
                      </div>
                      <span className={isSelected ? "text-white" : "text-gray-300"}>{opt}</span>
                    </button>
                  );
                })}
              </div>
            )}

          </div>
        </div>

        {/* Right: Palette Sidebar (Desktop) / Drawer (Mobile) */}
        {/* Mobile Palette Toggle */}
        <button
          className="md:hidden fixed bottom-28 right-4 z-[45] bg-gray-800 p-3.5 rounded-full shadow-2xl border border-white/10 active:scale-90 transition-all shadow-purple-500/20"
          onClick={() => setPaletteOpen(true)}
        >
          <Menu className="text-white" size={24} />
        </button>

        <AnimatePresence>
          {(paletteOpen || typeof window !== "undefined" && window.innerWidth >= 768) && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className={cn(
                "fixed inset-y-0 right-0 z-50 w-80 bg-gray-900 border-l border-white/10 md:static md:w-80 md:z-0 md:transform-none flex flex-col h-full",
                !paletteOpen && "hidden md:flex"
              )}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center md:pt-4 pt-16">
                <h3 className="font-bold text-white">Question Palette</h3>
                <button className="md:hidden text-gray-400" onClick={() => setPaletteOpen(false)}>
                  <X />
                </button>
              </div>

              {/* Scrollable Body */}
              <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar min-h-0">
                {/* Palette Grid */}
                <div className="p-4">
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((qItem, i) => {
                      const status = getPaletteStatus(qItem.id);
                      const isActive = i === currentIndex;
                      return (
                        <button
                          key={qItem.id}
                          onClick={() => goTo(i)}
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm transition-all",
                            `palette-${status}`,
                            isActive && "ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-110"
                          )}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Legend – Collapsible */}
                <div className="border-t border-white/10 bg-gray-950/50">
                  <button 
                    onClick={() => setLegendOpen(!legendOpen)}
                    className="w-full p-4 flex items-center justify-between hover:bg-white/5 transition-default group"
                  >
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Colour Code meaning</h4>
                    <ChevronDown 
                      size={16} 
                      className={cn("text-gray-500 transition-transform duration-300", legendOpen && "rotate-180")} 
                    />
                  </button>
                  
                  <AnimatePresence>
                    {legendOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-5 pt-1 space-y-2.5 text-xs text-gray-400">
                          <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded palette-unattempted" /> Unattempted</div>
                          <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded palette-skipped" /> Skipped</div>
                          <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded palette-answered" /> Answered</div>
                          <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded palette-marked" /> Marked for Review</div>
                          <div className="flex items-center gap-2.5"><div className="w-3 h-3 rounded palette-marked-answered" /> Answered & Marked</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Stats / Details */}
                <div className="p-4 border-t border-white/10 bg-gray-950">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-white text-sm">Attempt Details</h4>
                    <span className="text-[10px] bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full border border-purple-500/30 font-bold uppercase tracking-wider">Live Stats</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: "Attempted", value: Object.values(answers).filter(a => a.length > 0).length, color: "text-green-400", bg: "bg-green-400/5" },
                      { label: "Not Attempted", value: questions.filter(q => questions.some(vq => vq.id === q.id && store.visited.includes(q.id)) && (!answers[q.id] || answers[q.id].length === 0)).length, color: "text-yellow-400", bg: "bg-yellow-400/5" },
                      { label: "Not Visited", value: questions.length - store.visited.length, color: "text-gray-500", bg: "bg-gray-500/5" },
                      { label: "Marked", value: store.marked.filter(id => !answers[id] || answers[id].length === 0).length, color: "text-purple-400", bg: "bg-purple-400/5" },
                      { label: "Ans & Marked", value: store.marked.filter(id => answers[id] && answers[id].length > 0).length, color: "text-blue-400", bg: "bg-blue-400/5" },
                      { label: "Avg Time/Q", value: (Object.values(answers).filter(a => a.length > 0).length > 0) 
                          ? `${Math.round(((questions.length * 0) + (store.startedAt ? (Date.now() - store.startedAt) / 1000 : 0)) / Object.values(answers).filter(a => a.length > 0).length)}s`
                          : "0s", 
                        color: "text-white", bg: "bg-white/5" 
                      },
                    ].map((stat, i) => (
                      <div key={i} className={cn("p-2 rounded-xl border border-white/5", stat.bg)}>
                        <p className="text-[10px] text-gray-500 font-medium uppercase mb-0.5">{stat.label}</p>
                        <p className={cn("text-lg font-bold font-display", stat.color)}>{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="text-[10px] text-gray-500 font-medium uppercase">Overall Progress</div>
                    <div className="text-xs font-bold text-white">
                      {Math.round((Object.values(answers).filter(a => a.length > 0).length / questions.length) * 100)}%
                    </div>
                  </div>
                  <div className="mt-1.5 w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(Object.values(answers).filter(a => a.length > 0).length / questions.length) * 100}%` }}
                      className="h-full bg-gradient-to-r from-purple-500 to-blue-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Floating Final Submit Button */}
      <AnimatePresence>
        {(allAnswered || isLastQuestion) && !isSubmitted && (
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-24 left-4 right-4 md:right-[340px] z-30 flex justify-center pointer-events-none"
          >
            <button
              onClick={handleSubmitClick}
              className="pointer-events-auto flex items-center gap-2 px-10 py-4 rounded-2xl bg-emerald-600 text-white font-bold shadow-[0_0_35px_rgba(5,150,105,0.5)] hover:shadow-[0_0_45px_rgba(5,150,105,0.7)] transition-all hover:scale-105 active:scale-95 border border-emerald-400/30"
            >
              <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
              Submit Answers
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-950 border-t border-white/10 px-4 py-4 md:py-3 md:right-80 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-2">
          
          <div className="flex gap-2">
            <button
              onClick={() => setAnswer(q.id, [])}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl glass text-red-400 transition-all font-medium border border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.2)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95"
            >
              <Delete size={18} />
              <span className="text-[11px] sm:text-xs">Clear</span>
            </button>

            <button
              onClick={() => toggleMark(q.id)}
              className={cn(
                "flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl transition-all font-medium border",
                store.marked.includes(q.id) 
                  ? "bg-purple-600/30 text-purple-300 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.4)]" 
                  : "glass text-purple-400 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
              )}
            >
              <Bookmark size={18} className={store.marked.includes(q.id) ? "fill-purple-300" : ""} />
              <span className="text-[11px] sm:text-xs">Mark</span>
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="w-14 h-12 flex items-center justify-center rounded-xl glass disabled:opacity-10 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)] hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all active:scale-95"
            >
              <ChevronLeft size={24} />
            </button>
            <button
              onClick={next}
              disabled={currentIndex === questions.length - 1}
              className="w-14 h-12 flex items-center justify-center rounded-xl glass disabled:opacity-10 text-green-400 border border-green-500/30 shadow-[0_0_15px_rgba(34,197,94,0.2)] hover:shadow-[0_0_20px_rgba(34,197,94,0.4)] transition-all active:scale-95"
            >
              <ChevronRight size={24} />
            </button>
          </div>

        </div>
      </div>

      {/* Full-screen Loading Overlay during submission */}
      <AnimatePresence>
        {isSubmitting && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-950/80 backdrop-blur-md cursor-wait"
          >
            <div className="flex flex-col items-center gap-6 p-8 rounded-3xl glass-dark border border-white/10 shadow-glow-purple max-w-sm w-full text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin" />
                <img src="/logo.png" className="absolute inset-0 m-auto w-8 h-8 object-contain animate-pulse" alt="Logo" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-white">Calculating Results</h2>
                <p className="text-sm text-gray-400">Please wait while we secure your attempt and analyze your performance...</p>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
