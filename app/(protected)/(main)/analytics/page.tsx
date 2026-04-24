"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserAttempts, getQuizSets } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { CheckCircle, Clock, ClipboardList, Timer } from "lucide-react";
import Header from "@/components/layout/Header";
import type { Attempt, QuizSet } from "@/types";

export default function AnalyticsPage() {
  const { user } = useUserStore();

  const { data: attempts = [], isLoading: isLoadingAttempts } = useQuery<Attempt[]>({
    queryKey: ["user_attempts", user?.uid],
    queryFn: () => (user?.uid ? getUserAttempts(user.uid) : Promise.resolve([])) as any,
    enabled: !!user?.uid,
  });

  const { data: quizzes = [] } = useQuery<QuizSet[]>({
    queryKey: ["quizzes"],
    queryFn: () => getQuizSets(),
  });

  const stats = useMemo(() => {
    if (!attempts || attempts.length === 0) return null;

    const total = attempts.length;
    const sumPercent = attempts.reduce((acc, a) => acc + (a.percentage || 0), 0);
    const sumScore = attempts.reduce((acc, a) => acc + (a.score || 0), 0);
    const sumTime = attempts.reduce((acc, a) => acc + (a.timeTaken || 0), 0);

    const bestAttempt = [...attempts].sort((a, b) => (b.percentage || 0) - (a.percentage || 0))[0];

    // Subject Performance
    const subjectMap: Record<string, { totalPercent: number, count: number }> = {};
    attempts.forEach(attempt => {
      const quiz = quizzes.find(q => q.id === attempt.quizId);
      if (quiz && quiz.subjects) {
        quiz.subjects.forEach(sub => {
          if (!subjectMap[sub]) subjectMap[sub] = { totalPercent: 0, count: 0 };
          subjectMap[sub].totalPercent += (attempt.percentage || 0);
          subjectMap[sub].count += 1;
        });
      }
    });

    const subjectData = Object.entries(subjectMap).map(([name, data], i) => ({
      name,
      score: Math.round(data.totalPercent / data.count),
      color: ["bg-blue-500", "bg-purple-500", "bg-green-500", "bg-red-500", "bg-orange-500"][i % 5]
    })).sort((a, b) => b.score - a.score);

    // Chart Data (Percentages over time)
    const chartData = [...attempts]
      .reverse() // chronological order
      .map(a => a.percentage || 0);

    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}m ${s}s`;
    };

    return {
      total,
      avgScore: Math.round(sumPercent / total),
      avgScoreRaw: (sumScore / total).toFixed(1),
      bestScore: Math.round(bestAttempt.percentage || 0),
      bestScoreRaw: bestAttempt.score,
      bestScoreMax: bestAttempt.maxScore,
      avgTime: formatTime(Math.round(sumTime / total)),
      subjectData,
      chartData: chartData.length > 0 ? chartData : [0]
    };
  }, [attempts, quizzes]);

  // SVG Chart Calculation
  const width = 600;
  const height = 200;
  const maxScore = 100;
  
  const chartPoints = stats?.chartData || [0, 0];
  const points = chartPoints.map((val, idx) => {
    const x = (idx / (Math.max(1, chartPoints.length - 1))) * width;
    const y = height - (val / maxScore) * height;
    return `${x},${y}`;
  }).join(" ");

  const fillPoints = `${points} ${width},${height} 0,${height}`;

  return (
    <div className="min-h-screen pb-24">
      <Header title="Analytics" />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-screen-xl mx-auto px-4 md:px-8 pt-36 space-y-6"
      >
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard 
            title="Quizzes Taken" 
            value={isLoadingAttempts ? "..." : (stats?.total || 0).toString()} 
            icon={<ClipboardList className="text-purple-400" size={20} />} 
          />
          <StatCard 
            title="Average Score" 
            value={isLoadingAttempts ? "..." : `${stats?.avgScore || 0}%`} 
            subValue={stats ? `Avg: ${stats.avgScoreRaw}` : undefined}
            icon={<Timer className="text-blue-400" size={20} />} 
          />
          <StatCard 
            title="Best Score" 
            value={isLoadingAttempts ? "..." : `${stats?.bestScore || 0}%`} 
            subValue={stats ? `Score: ${stats.bestScoreRaw}/${stats.bestScoreMax}` : undefined}
            icon={<CheckCircle className="text-green-400" size={20} />} 
          />
          <StatCard 
            title="Avg Time Taken" 
            value={isLoadingAttempts ? "..." : (stats?.avgTime || "0m 0s")} 
            icon={<Clock className="text-purple-400" size={20} />} 
          />
        </div>

        {/* Main Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Line Chart */}
          <div className="lg:col-span-2 glass-dark p-6 rounded-2xl flex flex-col min-h-[400px]">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-lg font-semibold text-white">Performance Overview</h2>
              <div className="bg-purple-500/10 text-purple-400 text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-widest border border-purple-500/20">
                Score Trend (%)
              </div>
            </div>
            
            {!stats || stats.total === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <Timer size={24} />
                </div>
                <p className="text-sm font-medium">No performance data yet</p>
              </div>
            ) : (
              <div className="flex-1 w-full h-[250px] mt-2 ml-4">
                <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(168, 85, 247, 0.4)" />
                      <stop offset="100%" stopColor="rgba(168, 85, 247, 0.0)" />
                    </linearGradient>
                  </defs>
                  
                  {/* Grid Lines */}
                  {[0, 25, 50, 75, 100].map(val => {
                    const y = height - (val / 100) * height;
                    return (
                      <g key={val}>
                        <line x1="0" y1={y} x2={width} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                        <text x="-10" y={y + 4} fill="#6b7280" fontSize="10" textAnchor="end">{val}</text>
                      </g>
                    );
                  })}

                  {/* Area Fill */}
                  <motion.polygon 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    points={fillPoints} 
                    fill="url(#chartGradient)" 
                  />
                  
                  {/* Line */}
                  <motion.polyline 
                    initial={{ pathLength: 0, opacity: 0 }}
                    animate={{ pathLength: 1, opacity: 1 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    points={points} 
                    fill="none" 
                    stroke="#a855f7" 
                    strokeWidth="2.5" 
                    strokeLinejoin="round" 
                  />
                  
                  {/* Points */}
                  {stats.chartData.map((val, idx) => {
                    const x = (idx / (Math.max(1, stats.chartData.length - 1))) * width;
                    const y = height - (val / maxScore) * height;
                    return (
                      <motion.circle 
                        key={idx} 
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: idx * 0.05 }}
                        cx={x} cy={y} r="4" 
                        fill="#a855f7" 
                        stroke="#0f172a" 
                        strokeWidth="2" 
                        className="transition-all hover:r-6 cursor-pointer" 
                      />
                    );
                  })}
                </svg>
              </div>
            )}
          </div>

          {/* Subject Performance */}
          <div className="glass-dark p-6 rounded-2xl flex flex-col min-h-[400px]">
            <h2 className="text-lg font-semibold text-white mb-6">Subject Performance</h2>
            {!stats || stats.subjectData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <ClipboardList size={24} />
                </div>
                <p className="text-sm font-medium">No subject data yet</p>
              </div>
            ) : (
              <div className="space-y-6 flex-1 justify-center flex flex-col">
                {stats.subjectData.map((sub, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-200 font-medium">{sub.name}</span>
                      <span className="text-gray-400">{sub.score}%</span>
                    </div>
                    <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${sub.score}%` }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                        className={`h-full ${sub.color} rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)]`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon }: { title: string, value: string, subValue?: string, icon: React.ReactNode }) {
  return (
    <div className="glass-dark p-4 md:p-5 rounded-2xl flex flex-col gap-2 relative overflow-hidden transition-all hover:border-white/20 border border-white/5">
      <div className="flex items-center gap-2">
        <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 shrink-0">
          {icon}
        </div>
        <p className="text-[10px] md:text-xs text-gray-400 font-bold uppercase tracking-widest truncate">{title}</p>
      </div>
      <div>
        <p className="text-2xl md:text-3xl font-black text-white tracking-tight">{value}</p>
        {subValue && <p className="text-[10px] font-bold text-purple-400/80 mt-0.5">{subValue}</p>}
      </div>
    </div>
  );
}
