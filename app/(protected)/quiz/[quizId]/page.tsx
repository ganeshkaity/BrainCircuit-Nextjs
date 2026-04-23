"use client";

import { useQuery } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import { getQuizSet, getUserAttempts } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import GradientButton from "@/components/ui/GradientButton";
import { useRouter } from "next/navigation";
import { Clock, CheckCircle, BookOpen, AlertCircle, ChevronRight } from "lucide-react";
import { useQuizStore } from "@/store/quizStore";
import { useUserStore } from "@/store/userStore";
import { shuffleArray } from "@/lib/helpers";
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

  const { firebaseUid } = useUserStore();
  const { data: attempts } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => getUserAttempts(firebaseUid!),
    enabled: !!firebaseUid,
  });

  const { initQuiz, quizId: currentQuizId, isSubmitted } = useQuizStore();

  const handleStart = () => {
    if (!quiz) return;
    if (!quiz.questions?.length) return alert("Quiz has no questions yet!");

    // Only reset if it's a new quiz or previous one was submitted
    if (currentQuizId !== quizId || isSubmitted) {
      // 1. Force uniqueness of the source questions by ID
      const uniqueSourcePool = Array.from(new Map(quiz.questions.map(q => [q.id, q])).values());

      // 2. Find all previously answered question IDs for THIS quiz
      const seenQuestionIds = new Set<string>();
      if (attempts) {
        attempts.forEach(a => {
          if (a.quizId === quizId && a.answers) {
            Object.keys(a.answers).forEach(qId => seenQuestionIds.add(qId));
          }
        });
      }

      // 3. Categorize into unseen and seen
      const unseenQuestions = uniqueSourcePool.filter(q => !seenQuestionIds.has(q.id));
      const seenQuestions = uniqueSourcePool.filter(q => seenQuestionIds.has(q.id));

      let finalQuestions: any[] = [];
      
      // 4. Prioritize brand new questions
      const shuffledUnseen = shuffleArray(unseenQuestions);
      
      if (shuffledUnseen.length >= quiz.questionCount) {
        // We have plenty of unseen questions
        finalQuestions = shuffledUnseen.slice(0, quiz.questionCount);
      } else {
        // Take all unseen questions and fill the rest from the seen pool
        finalQuestions = [...shuffledUnseen];
        const shuffledSeen = shuffleArray(seenQuestions);
        const needed = quiz.questionCount - finalQuestions.length;
        finalQuestions = [...finalQuestions, ...shuffledSeen.slice(0, Math.min(needed, shuffledSeen.length))];
      }

      // 5. Final shuffle of the selected subset for variety
      const picked = shuffleArray(finalQuestions);
      
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
