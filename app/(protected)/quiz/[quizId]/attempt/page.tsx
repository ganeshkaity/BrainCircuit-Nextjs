"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useQuizStore } from "@/store/quizStore";
import { useUserStore } from "@/store/userStore";
import { saveAttempt, getQuizSet, calculateRank, updateUser } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import { formatTime, calculateScore, getPointsForAttempt, cn } from "@/lib/helpers";
import { ChevronLeft, ChevronRight, Bookmark, Menu, X, Clock, AlertTriangle, Delete } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { motion, AnimatePresence } from "framer-motion";

export default function QuizEnginePage({ params }: { params: Promise<{ quizId: string }> }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { quizId } = use(params);
  const { user, firebaseUid, setUser } = useUserStore();
  
  const store = useQuizStore();
  const {
    questions, currentIndex, answers, remainingSeconds, isSubmitted,
    setAnswer, toggleMark, visitQuestion, next, prev, goTo, tickTimer, submitQuiz, getPaletteStatus
  } = store;

  const [paletteOpen, setPaletteOpen] = useState(false);
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
        score,
        maxScore: quiz.totalMarks,
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

      // In background or next step, we could calculate rank
      // For now we'll route to result page
      router.replace(`/quiz/${quizId}/result`);

    } catch (err) {
      console.error(err);
      alert("Failed to submit. Please try again.");
      setIsSubmitting(false);
    }
  };

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
      // We parse it to float, but we allow typing "2." by keeping it as string in state?
      // Wait, answers state is `number[]`. If we parse "2." it becomes `2`. The user won't see the decimal.
      // So let's store it as any and pass it as string for now if it ends with dot, or just parse float.
      // Wait, we can't store string if it's strictly number[]. Let's just use `any` casting since JS arrays are flexible.
      setAnswer(q.id, [currentStr as any]);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col bg-gray-950">
      <Header
        showBack={false}
        className="bg-gray-950/80 backdrop-blur-md border-b border-white/5 pb-2 pt-safe"
        timerElement={
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg text-red-400 font-bold tabular-nums">
            <Clock size={16} />
            {formatTime(remainingSeconds)}
          </div>
        }
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row mt-16 safe-pb pb-16 md:pb-0">
        
        {/* Left: Question Area */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto">
          <div className="max-w-3xl mx-auto space-y-6">
            
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
          className="md:hidden fixed bottom-20 right-4 z-40 bg-gray-800 p-3 rounded-full shadow-lg border border-gray-700"
          onClick={() => setPaletteOpen(true)}
        >
          <Menu className="text-white" />
        </button>

        <AnimatePresence>
          {(paletteOpen || typeof window !== "undefined" && window.innerWidth >= 768) && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className={cn(
                "fixed inset-y-0 right-0 z-50 w-80 bg-gray-900 border-l border-white/10 md:static md:w-80 md:z-0 md:transform-none flex flex-col pt-safe",
                !paletteOpen && "hidden md:flex"
              )}
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center md:pt-4 pt-16">
                <h3 className="font-bold text-white">Question Palette</h3>
                <button className="md:hidden text-gray-400" onClick={() => setPaletteOpen(false)}>
                  <X />
                </button>
              </div>

              {/* Palette Grid */}
              <div className="flex-1 overflow-y-auto p-4">
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

              {/* Legend */}
              <div className="p-4 border-t border-white/10 bg-gray-900/50 text-xs text-gray-400 space-y-2">
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded palette-unattempted" /> Unattempted</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded palette-skipped" /> Skipped</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded palette-answered" /> Answered</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded palette-marked" /> Marked for Review</div>
                <div className="flex items-center gap-2"><div className="w-3 h-3 rounded palette-marked-answered" /> Answered & Marked</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Bottom Control Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-900 border-t border-white/10 p-3 safe-pb md:right-80">
        <div className="flex items-center justify-between max-w-3xl mx-auto gap-2">
          
          <div className="flex gap-2">
            <button
              onClick={prev}
              disabled={currentIndex === 0}
              className="p-2.5 rounded-xl glass disabled:opacity-30 text-white"
            >
              <ChevronLeft />
            </button>
            <button
              onClick={next}
              disabled={currentIndex === questions.length - 1}
              className="p-2.5 rounded-xl glass disabled:opacity-30 text-white"
            >
              <ChevronRight />
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => toggleMark(q.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition-default font-medium text-sm",
                store.marked.includes(q.id) ? "bg-purple-600/30 text-purple-300 border border-purple-500/50" : "glass text-gray-300"
              )}
            >
              <Bookmark size={16} className={store.marked.includes(q.id) ? "fill-purple-300" : ""} />
              <span className="hidden sm:inline">{store.marked.includes(q.id) ? "Marked" : "Mark for Review"}</span>
            </button>
            
            <GradientButton
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="px-6"
            >
              Submit
            </GradientButton>
          </div>

        </div>
      </div>
    </main>
  );
}
