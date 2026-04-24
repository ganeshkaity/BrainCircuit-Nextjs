"use client";

import { useEffect, use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { getQuizSet, getUserAttempts, calculateRank, getAttempt } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import confetti from "canvas-confetti";
import Header from "@/components/layout/Header";
import GradientButton from "@/components/ui/GradientButton";
import { Trophy, Clock, Target, ArrowRight, BarChart2 } from "lucide-react";
import { formatTime, cn } from "@/lib/helpers";
import { motion } from "framer-motion";

export default function ResultPage({ params }: { params: Promise<{ quizId: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const attemptId = searchParams.get("attemptId");
  const { quizId } = use(params);
  const { user, firebaseUid } = useUserStore();

  const { data: quiz, isLoading: quizLoading } = useQuery({
    queryKey: ["quiz", quizId],
    queryFn: () => getQuizSet(quizId),
  });

  const { data: directAttempt, isLoading: directLoading } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => getAttempt(attemptId!),
    enabled: !!attemptId,
  });

  const { data: allAttempts, isLoading: allAttemptsLoading } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => getUserAttempts(firebaseUid!),
    enabled: !!firebaseUid,
  });

  // Priority: directAttempt > find in allAttempts list
  const attempt = directAttempt || allAttempts?.find(a => a.quizId === quizId && a.id === attemptId) || allAttempts?.find(a => a.quizId === quizId);

  const previousAttempt = allAttempts
    ?.filter(a => a.quizId === quizId && a.id !== attempt?.id)
    ?.sort((a, b) => {
      const timeA = a.createdAt && 'toMillis' in a.createdAt ? a.createdAt.toMillis() : (a.createdAt as any)?.seconds * 1000 || 0;
      const timeB = b.createdAt && 'toMillis' in b.createdAt ? b.createdAt.toMillis() : (b.createdAt as any)?.seconds * 1000 || 0;
      return timeB - timeA;
    })[0];

  const { data: rank, isLoading: rankLoading } = useQuery({
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

  if (quizLoading || (attemptId ? directLoading : allAttemptsLoading) || (attempt && rankLoading)) {
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

  const percentage = parseFloat(((attempt.score / quiz.totalMarks) * 100).toFixed(1));

  // Only use the questions that were actually in this attempt
  const attemptQuestionIds: string[] = attempt.questionIds ?? Object.keys(attempt.answers);
  const attemptQuestions = attemptQuestionIds
    .map(id => quiz.questions.find(q => q.id === id))
    .filter(Boolean) as typeof quiz.questions;

  const avgTimePerQ = Math.round(attempt.timeTaken / Math.max(attemptQuestions.length, 1));
  
  // Comparison logic
  const scoreDiff = previousAttempt ? attempt.score - previousAttempt.score : null;
  const timeDiff = previousAttempt ? previousAttempt.timeTaken - attempt.timeTaken : null;

  return (
    <main className="min-h-dvh pb-10 pt-16 bg-gray-950">
      <Header title="Quiz Result" />

      <div className="max-w-xl mx-auto px-5 mt-6 space-y-6">
        {/* Main Score Card */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-md rounded-3xl p-8 text-center relative overflow-hidden shadow-2xl border border-white/10"
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-purple-600/20 blur-[60px] rounded-full pointer-events-none" />
          
          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center mb-6 shadow-glow border-4 border-gray-900 z-10 relative">
            <span className="text-3xl font-black text-white">{percentage}%</span>
          </div>

          <h1 className="text-4xl font-black text-white mb-1">
            {attempt.score} <span className="text-lg text-gray-500 font-medium">/ {quiz.totalMarks}</span>
          </h1>
          <p className="text-purple-400 font-bold tracking-wide uppercase text-xs mb-8">Performance Summary</p>

          <div className="grid grid-cols-2 gap-4 text-left">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <Trophy className="text-yellow-400 mb-2" size={18} />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Current Rank</p>
              <p className="font-black text-white text-xl font-display">{rank ? `#${rank}` : "-"}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
              <Clock className="text-blue-400 mb-2" size={18} />
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1">Total Time</p>
              <p className="font-black text-white text-xl font-display">{formatTime(attempt.timeTaken)}</p>
            </div>
          </div>

          {/* Comparison Stats */}
          {previousAttempt && (
            <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between px-2">
              <div className="text-left">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">VS Last Attempt</p>
                <div className="flex items-center gap-3 mt-1">
                  <div className={cn("text-sm font-bold flex items-center gap-1", scoreDiff! >= 0 ? "text-green-400" : "text-red-400")}>
                    {scoreDiff! >= 0 ? "+" : ""}{scoreDiff} Marks
                  </div>
                  <div className={cn("text-sm font-bold flex items-center gap-1", timeDiff! >= 0 ? "text-green-400" : "text-red-400")}>
                    {timeDiff! >= 0 ? "-" : "+"}{Math.abs(timeDiff!)}s faster
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Avg Time/Q</p>
                <p className="text-sm font-bold text-white mt-1">{avgTimePerQ}s</p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Time Analysis Graph – SVG Line Chart */}
        {attempt.questionTimes && (() => {
          const times = attemptQuestions.map(q => attempt.questionTimes?.[q.id] || 0);
          const maxT = Math.max(...times, 1);
          const W = 500, H = 160, padL = 36, padR = 12, padT = 12, padB = 28;
          const chartW = W - padL - padR;
          const chartH = H - padT - padB;
          const xStep = chartW / Math.max(times.length - 1, 1);
          const yGrid = [0, 25, 50, 75, 100];

          const pts = times.map((t, i) => ({
            x: padL + i * xStep,
            y: padT + chartH - (t / maxT) * chartH,
          }));

          const linePath = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ");
          const areaPath = `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(padT + chartH).toFixed(1)} L ${pts[0].x.toFixed(1)} ${(padT + chartH).toFixed(1)} Z`;

          // X-axis label step: show ~6 labels max
          const labelStep = Math.max(1, Math.ceil(times.length / 6));

          return (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-md rounded-3xl p-6 border border-white/10"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <BarChart2 size={16} className="text-purple-400" /> Time Distribution
                </h3>
                <span className="text-[10px] text-gray-500 font-bold uppercase">Seconds per question</span>
              </div>

              <svg
                viewBox={`0 0 ${W} ${H}`}
                className="w-full h-auto"
                style={{ overflow: "visible" }}
              >
                <defs>
                  {/* Area gradient */}
                  <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a855f7" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#a855f7" stopOpacity="0.02" />
                  </linearGradient>
                  {/* Line glow filter */}
                  <filter id="glow">
                    <feGaussianBlur stdDeviation="2.5" result="coloredBlur" />
                    <feMerge>
                      <feMergeNode in="coloredBlur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                  {/* Clip path */}
                  <clipPath id="chartArea">
                    <rect x={padL} y={padT} width={chartW} height={chartH} />
                  </clipPath>
                </defs>

                {/* Y-axis grid lines + labels */}
                {yGrid.map(pct => {
                  const y = padT + chartH - (pct / 100) * chartH;
                  return (
                    <g key={pct}>
                      <line
                        x1={padL} y1={y} x2={padL + chartW} y2={y}
                        stroke="rgba(255,255,255,0.06)" strokeWidth="1"
                      />
                      <text
                        x={padL - 6} y={y + 4}
                        fontSize="9" fill="rgba(255,255,255,0.25)"
                        textAnchor="end" fontFamily="monospace"
                      >
                        {pct}
                      </text>
                    </g>
                  );
                })}

                {/* Area fill */}
                <path d={areaPath} fill="url(#areaGrad)" clipPath="url(#chartArea)" />

                {/* Line */}
                <path
                  d={linePath}
                  fill="none"
                  stroke="#a855f7"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  filter="url(#glow)"
                  clipPath="url(#chartArea)"
                />

                {/* Dots + tooltips */}
                {pts.map((p, i) => (
                  <g key={i}>
                    <circle cx={p.x} cy={p.y} r="3.5" fill="#7c3aed" stroke="#c084fc" strokeWidth="1.5" filter="url(#glow)" />
                    {/* Hover area */}
                    <circle cx={p.x} cy={p.y} r="10" fill="transparent">
                      <title>Q{i + 1}: {times[i]}s</title>
                    </circle>
                  </g>
                ))}

                {/* X-axis labels */}
                {pts.map((p, i) => {
                  if (i % labelStep !== 0 && i !== times.length - 1) return null;
                  return (
                    <text
                      key={i}
                      x={p.x} y={H - 4}
                      fontSize="9" fill="rgba(255,255,255,0.3)"
                      textAnchor="middle" fontFamily="monospace"
                    >
                      Q{i + 1}
                    </text>
                  );
                })}
              </svg>

              {/* Stats row below graph */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  Avg: <span className="text-white">{avgTimePerQ}s</span>
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  Max: <span className="text-red-400">{Math.max(...times)}s</span>
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  Min: <span className="text-green-400">{Math.min(...times.filter(t => t > 0))}s</span>
                </span>
                <span className="text-[10px] text-gray-500 font-bold uppercase">
                  {times.length} Questions
                </span>
              </div>
            </motion.div>
          );
        })()}

        <div className="grid grid-cols-2 gap-3">
          <GradientButton fullWidth size="lg" onClick={() => router.push(`/quiz/${quizId}/analysis?attemptId=${attempt?.id}`)}>
            <BarChart2 size={18} /> Analysis
          </GradientButton>
          <GradientButton variant="secondary" fullWidth size="lg" onClick={() => router.push("/home")}>
            Exit
          </GradientButton>
        </div>
      </div>
    </main>
  );
}
