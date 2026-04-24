"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, CheckCircle, HelpCircle, ArrowRight, Loader2, Activity } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatChip from "@/components/ui/StatChip";
import type { QuizSet, Attempt } from "@/types";
import { formatTime } from "@/lib/helpers";

interface QuizCardProps {
  quiz: QuizSet;
  attempts?: Attempt[];
}

export default function QuizCard({ quiz, attempts = [] }: QuizCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    // Add a tiny delay to ensure the UI updates before the main thread blocks on navigation
    setTimeout(() => {
      router.push(`/quiz/${quiz.id}`);
    }, 50);
  };

  const isPerfect = attempts.some(a => a.score === quiz.totalMarks);

  return (
    <div onClick={handleClick} className="block h-full cursor-pointer group">
      <GlassCard hover className="h-full flex flex-col relative pt-8">
        {/* Top Right 45deg Completed Ribbon */}
        {isPerfect && (
          <div className="absolute top-0 right-0 w-20 h-20 overflow-hidden rounded-tr-2xl z-20 pointer-events-none">
            <div className="absolute top-[14px] -right-[24px] w-[100px] py-0.5 bg-gradient-to-r from-emerald-600 via-green-500 to-emerald-600 shadow-lg transform rotate-45 flex items-center justify-center border-y border-white/20">
              <span className="text-[8px] font-black uppercase tracking-[0.05em] text-white drop-shadow-sm">
                Full Scored
              </span>
            </div>
          </div>
        )}

        {/* Top Right Action Icon - Hidden if Completed */}
        {!isPerfect && (
          <div className="absolute top-4 right-4 text-gray-500 group-hover:text-purple-400 transition-colors">
            {isLoading ? (
              <Loader2 size={18} className="animate-spin text-purple-400" />
            ) : (
              <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
            )}
          </div>
        )}

        {/* Left Edge Banner Badge */}
        {quiz.badge && (
          <div className="absolute -top-1 -left-2 z-20 drop-shadow-md">
            <div 
              className={`relative px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${quiz.badge.color}`}
              style={{ clipPath: "polygon(0 0, 100% 0, 85% 50%, 100% 100%, 0 100%)", paddingRight: "1.25rem" }}
            >
              {quiz.badge.label}
            </div>
            {/* Side Fold Shadow - Darkened version of badge color */}
            <div 
              className={`absolute top-full left-0 w-2 h-2 bg-gradient-to-r ${quiz.badge.color} brightness-[0.3] contrast-[1.2] [clip-path:polygon(0_0,100%_0,100%_100%)]`} 
            />
          </div>
        )}

        {/* Tags row */}
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {quiz.exam}
          </span>
          <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {quiz.language}
          </span>
          {quiz.subjects?.[0] && (
            <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {quiz.subjects[0]}
            </span>
          )}
        </div>

        <h3 className="font-display font-semibold text-base text-white mb-2 line-clamp-2 pr-6">
          {quiz.title}
        </h3>

        {quiz.description && (
          <p className="text-gray-400 text-xs mb-4 line-clamp-2">
            {quiz.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-1.5">
          <StatChip
            label="Qns"
            value={quiz.questionCount}
            icon={<HelpCircle size={13} className="text-purple-400" />}
            color="purple"
            className="flex-1 justify-center px-0.5 py-1 text-[10px]"
          />
          <StatChip
            label="Mins"
            value={quiz.durationMinutes}
            icon={<Clock size={13} className="text-blue-400" />}
            color="blue"
            className="flex-1 justify-center px-0.5 py-1 text-[10px]"
          />
          <StatChip
            label="Marks"
            value={quiz.totalMarks}
            icon={<CheckCircle size={13} className="text-green-400" />}
            color="green"
            className="flex-1 justify-center px-0.5 py-1 text-[10px]"
          />
        </div>

        {/* User Attempt Details */}
        <div className="mt-3 pt-3 border-t border-white/5 bg-gradient-to-r from-blue-500/5 to-purple-500/5 -mx-5 -mb-5 px-5 pb-5 pt-3 rounded-b-2xl">
          {attempts.length > 0 ? (() => {
            const avgScore = Math.round(attempts.reduce((acc, a) => acc + a.score, 0) / attempts.length);
            const avgTime = Math.round(attempts.reduce((acc, a) => acc + a.timeTaken, 0) / attempts.length);
            const highScore = Math.max(...attempts.map(a => a.score));
            
            return (
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-1.5 text-blue-300">
                  <Activity size={12} />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Attempted: {attempts.length}x</span>
                </div>
                <div className="flex justify-between items-center text-right">
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase text-left">High Score</p>
                    <p className="text-xs font-black text-green-400 text-left">{highScore}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase text-center">Avg Score</p>
                    <p className="text-xs font-black text-white text-center">{avgScore}</p>
                  </div>
                  <div>
                    <p className="text-[9px] text-gray-500 font-bold uppercase">Avg Time</p>
                    <p className="text-xs font-black text-white">{formatTime(avgTime)}</p>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div className="flex items-center justify-center py-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500/80">Not Attempted till now</span>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
