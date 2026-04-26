"use client";

import { useQuery } from "@tanstack/react-query";
import { getUserAttempts, getQuizSets } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, Clock, ClipboardList, Timer, X } from "lucide-react";
import Header from "@/components/layout/Header";
import type { Attempt, QuizSet } from "@/types";

const COLORS = ["#3b82f6", "#a855f7", "#22c55e", "#ef4444", "#f97316"];

export default function AnalyticsPage() {
  const { user } = useUserStore();
  const [selectedSubject, setSelectedSubject] = useState<any>(null);

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
    const subjectMap: Record<string, { totalPercent: number, count: number, bestScore: number }> = {};
    attempts.forEach(attempt => {
      const quiz = quizzes.find(q => q.id === attempt.quizId);
      if (quiz && quiz.subjects) {
        quiz.subjects.forEach(sub => {
          if (!subjectMap[sub]) subjectMap[sub] = { totalPercent: 0, count: 0, bestScore: 0 };
          subjectMap[sub].totalPercent += (attempt.percentage || 0);
          subjectMap[sub].count += 1;
          subjectMap[sub].bestScore = Math.max(subjectMap[sub].bestScore, attempt.percentage || 0);
        });
      }
    });

    const subjectData = Object.entries(subjectMap).map(([name, data], i) => ({
      name,
      score: Math.round(data.totalPercent / data.count),
      count: data.count,
      bestScore: Math.round(data.bestScore),
      color: COLORS[i % COLORS.length]
    })).sort((a, b) => b.count - a.count); // Sort by attempt count for pie chart prominence

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
              <div className="flex-1 w-full mt-2 ml-4 overflow-x-auto no-scrollbar">
                <div className="min-w-[600px] h-[250px]">
                  <svg viewBox={`0 -20 ${width} ${height + 40}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
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
                      <g key={idx}>
                        <motion.circle 
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: idx * 0.05 }}
                          cx={x} cy={y} r="4" 
                          fill="#a855f7" 
                          stroke="#0f172a" 
                          strokeWidth="2" 
                          className="transition-all hover:r-6 cursor-pointer" 
                        />
                        <motion.text
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: idx * 0.05 + 0.4 }}
                          x={x}
                          y={y - 12}
                          textAnchor="middle"
                          fill="white"
                          fontSize="11"
                          fontWeight="900"
                          className="pointer-events-none select-none"
                        >
                          {Math.round(val)}%
                        </motion.text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            </div>
          )}
          </div>

          {/* Subject Performance Pie Chart */}
          <div className="glass-dark p-6 rounded-2xl flex flex-col min-h-[400px]">
            <h2 className="text-lg font-semibold text-white mb-6">Subject Distribution</h2>
            {!stats || stats.subjectData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-gray-500 space-y-3">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                  <ClipboardList size={24} />
                </div>
                <p className="text-sm font-medium">No subject data yet</p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col">
                <div className="flex-1 flex items-center justify-center relative min-h-[200px]">
                  <svg viewBox="0 0 100 100" className="w-48 h-48 sm:w-56 sm:h-56 transform -rotate-90 overflow-visible">
                    {(() => {
                      let cumulativePercent = 0;
                      const totalCount = stats.subjectData.reduce((acc, s) => acc + s.count, 0);
                      
                      return stats.subjectData.map((sub, i) => {
                        const percent = sub.count / totalCount;
                        const startX = Math.cos(2 * Math.PI * cumulativePercent);
                        const startY = Math.sin(2 * Math.PI * cumulativePercent);
                        
                        cumulativePercent += percent;
                        
                        const endX = Math.cos(2 * Math.PI * cumulativePercent);
                        const endY = Math.sin(2 * Math.PI * cumulativePercent);
                        
                        const largeArcFlag = percent > 0.5 ? 1 : 0;
                        
                        const pathData = [
                          `M 50 50`,
                          `L ${50 + startX * 46} ${50 + startY * 46}`,
                          `A 46 46 0 ${largeArcFlag} 1 ${50 + endX * 46} ${50 + endY * 46}`,
                          `Z`
                        ].join(" ");
                        
                        return (
                          <motion.path
                            key={i}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: selectedSubject?.name === sub.name ? 1.05 : 1 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            d={pathData}
                            fill={sub.color}
                            stroke={selectedSubject?.name === sub.name ? "white" : "#0f172a"}
                            strokeWidth={selectedSubject?.name === sub.name ? 2 : 1.5}
                            whileHover={{ scale: 1.05, strokeWidth: 2 }}
                            onClick={() => setSelectedSubject(sub)}
                            className="cursor-pointer transition-all"
                          />
                        );
                      });
                    })()}
                    {/* Inner hole for Donut look */}
                    <circle cx="50" cy="50" r="26" fill="#0f172a" />
                    <text 
                      x="50" y="50" 
                      transform="rotate(90 50 50)" 
                      textAnchor="middle" 
                      dominantBaseline="middle" 
                      fill={selectedSubject ? selectedSubject.color : "white"} 
                      className="text-[8px] font-black transition-colors uppercase"
                    >
                      {selectedSubject ? selectedSubject.name.slice(0, 10) : "Subjects"}
                    </text>
                  </svg>
                </div>
                
                {/* Detailed View / Legend */}
                <div className="mt-8">
                  <AnimatePresence mode="wait">
                    {selectedSubject ? (
                      <motion.div
                        key="details"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="glass-md p-4 rounded-xl border border-white/10 relative overflow-hidden group"
                      >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/10 to-transparent rounded-bl-full -mr-8 -mt-8 opacity-50" />
                        
                        <div className="flex justify-between items-start mb-4 relative z-10">
                          <div>
                            <h3 className="text-white font-black text-lg leading-tight uppercase tracking-tight">{selectedSubject.name}</h3>
                            <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Subject Breakdown</p>
                          </div>
                          <button 
                            onClick={() => setSelectedSubject(null)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>

                        <div className="grid grid-cols-3 gap-3 relative z-10">
                          <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                            <span className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Avg Score</span>
                            <span className="text-sm font-black text-white">{selectedSubject.score}%</span>
                          </div>
                          <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                            <span className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Attempts</span>
                            <span className="text-sm font-black text-white">{selectedSubject.count}</span>
                          </div>
                          <div className="bg-white/5 p-2.5 rounded-lg border border-white/5">
                            <span className="block text-[9px] font-bold text-gray-500 uppercase mb-1">Best</span>
                            <span className="text-sm font-black text-green-400">{selectedSubject.bestScore}%</span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="legend"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="grid grid-cols-2 gap-x-4 gap-y-3"
                      >
                        {stats.subjectData.slice(0, 6).map((sub, i) => (
                          <button 
                            key={i} 
                            onClick={() => setSelectedSubject(sub)}
                            className="flex items-center gap-2 text-left hover:bg-white/5 p-1 rounded-lg transition-colors group"
                          >
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: sub.color }} />
                            <div className="flex flex-col min-w-0">
                              <span className="text-[11px] font-bold text-gray-200 truncate group-hover:text-white">{sub.name}</span>
                              <span className="text-[10px] text-gray-500 font-medium">{sub.score}% Avg</span>
                            </div>
                          </button>
                        ))}
                        <p className="col-span-2 text-[9px] text-center text-gray-500 mt-2 font-bold uppercase tracking-widest">
                          Tip: Tap a slice to see detailed stats
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
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
