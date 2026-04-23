"use client";

import { use } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQuizSet, getUserAttempts } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import { CheckCircle, XCircle, MinusCircle } from "lucide-react";
import { cn } from "@/lib/helpers";

export default function AnalysisPage({ params }: { params: Promise<{ quizId: string }> }) {
  const { quizId } = use(params);
  const { firebaseUid } = useUserStore();

  const { data: quiz } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizSet(quizId),
  });

  const { data: attempts } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => getUserAttempts(firebaseUid!),
    enabled: !!firebaseUid,
  });

  const attempt = attempts?.find(a => a.quizId === quizId);

  // Questions are stored inline on the quiz set.
  // We only show the subset that was included in this attempt (via answers keys).
  const questions = (quiz?.questions ?? []).filter(q =>
    attempt ? q.id in attempt.answers || Object.keys(attempt.answers).length === 0 : true
  );
  const isLoading = !quiz || !attempts;

  if (isLoading || !attempt) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main className="min-h-dvh pb-10 pt-16 bg-gray-950">
      <Header showBack title="Analysis" />

      <div className="max-w-3xl mx-auto px-4 mt-6 space-y-6">
        {questions.map((q, index) => {
          const userAns = attempt.answers[q.id] || [];
          const isAttempted = userAns.length > 0;
          const userAnsStr = [...userAns].sort().join(",");
          const correctAnsStr = [...q.correctOptions].sort().join(",");
          const isCorrect = isAttempted && userAnsStr === correctAnsStr;

          return (
            <div key={q.id} className="glass rounded-2xl p-5 border border-white/5">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 font-bold">Q{index + 1}.</span>
                  <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">
                    {q.subject}
                  </span>
                </div>
                {isCorrect ? (
                  <span className="flex items-center gap-1 text-green-400 text-xs font-bold bg-green-400/10 px-2 py-1 rounded">
                    <CheckCircle size={14} /> Correct (+{quiz?.marksPerQuestion})
                  </span>
                ) : isAttempted ? (
                  <span className="flex items-center gap-1 text-red-400 text-xs font-bold bg-red-400/10 px-2 py-1 rounded">
                    <XCircle size={14} /> Incorrect (-{quiz?.negativeMarks})
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-gray-400 text-xs font-bold bg-white/10 px-2 py-1 rounded">
                    <MinusCircle size={14} /> Unattempted (0)
                  </span>
                )}
              </div>

              <p className="text-white mb-4 whitespace-pre-wrap leading-relaxed">{q.text}</p>
              {q.imageUrl && <img src={q.imageUrl} alt="Figure" className="rounded-xl max-w-full h-auto mb-4" />}

              <div className="space-y-2 mb-4">
                {q.type === "integer" ? (
                  <div className="flex gap-4">
                    <div className="flex-1 glass p-4 rounded-xl text-center">
                      <p className="text-xs text-gray-400 mb-1">Your Answer</p>
                      <p className={cn("text-xl font-bold", isCorrect ? "text-green-400" : isAttempted ? "text-red-400" : "text-gray-500")}>
                        {isAttempted ? userAns[0] : "—"}
                      </p>
                    </div>
                    <div className="flex-1 glass border-green-500/30 bg-green-500/10 p-4 rounded-xl text-center">
                      <p className="text-xs text-green-300 mb-1">Correct Answer</p>
                      <p className="text-xl font-bold text-green-400">
                        {q.correctOptions[0]}
                      </p>
                    </div>
                  </div>
                ) : (
                  q.options.map((opt, i) => {
                    const isUserSelection = userAns.includes(i);
                    const isActuallyCorrect = q.correctOptions.includes(i);
                    const isMulti = q.type === "multi";
                    
                    let optStyle = "glass border-transparent text-gray-300";
                    if (isActuallyCorrect) {
                      optStyle = "bg-green-500/20 border-green-500 text-green-100 ring-1 ring-green-500";
                    } else if (isUserSelection && !isActuallyCorrect) {
                      optStyle = "bg-red-500/20 border-red-500 text-red-100 ring-1 ring-red-500";
                    }

                    return (
                      <div key={i} className={cn("p-3 rounded-xl border transition-all flex items-start gap-3", optStyle)}>
                        <div className={cn(
                          "mt-0.5 flex items-center justify-center shrink-0",
                          isMulti ? "w-5 h-5 rounded" : "w-5 h-5 rounded-full"
                        )}>
                          {isActuallyCorrect && <CheckCircle size={16} className="text-green-400" />}
                          {isUserSelection && !isActuallyCorrect && <XCircle size={16} className="text-red-400" />}
                          {!isActuallyCorrect && !isUserSelection && <span className={cn("bg-gray-600", isMulti ? "w-2 h-2 rounded-sm" : "w-1.5 h-1.5 rounded-full")} />}
                        </div>
                        <span>{opt}</span>
                      </div>
                    );
                  })
                )}
              </div>

              {q.explanation && (
                <div className="mt-4 bg-blue-900/20 border border-blue-500/30 rounded-xl p-4">
                  <h4 className="text-xs font-bold text-blue-300 uppercase mb-1">Explanation</h4>
                  <p className="text-sm text-blue-100/80 whitespace-pre-wrap">{q.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
