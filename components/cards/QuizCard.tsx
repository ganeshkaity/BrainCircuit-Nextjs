"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Clock, CheckCircle, HelpCircle, ArrowRight, Loader2, Activity, Bookmark } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatChip from "@/components/ui/StatChip";
import type { QuizSet, Attempt } from "@/types";
import { formatTime, stripMarkdown, formatDuration } from "@/lib/helpers";
import { useUserStore } from "@/store/userStore";
import { useUIStore } from "@/store/uiStore";
import { toggleSavedQuiz } from "@/lib/firebase/firestore";

interface QuizCardProps {
  quiz: QuizSet;
  attempts?: Attempt[];
  compact?: boolean;
}

export default function QuizCard({ quiz, attempts = [], compact = false }: QuizCardProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { user, setUser } = useUserStore();
  const { showAlert } = useUIStore();

  const isSaved = user?.savedQuizzes?.includes(quiz.id) || false;

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || isSaving) return;
    
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

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    const slug = quiz.title.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '');
    setTimeout(() => {
      router.push(`/quiz/${slug}`);
    }, 50);
  };

  const isPerfect = attempts.some(a => a.score === quiz.totalMarks);

  return (
    <div onClick={handleClick} className="block h-full cursor-pointer group">
      <GlassCard hover className={`h-full flex flex-col relative ${compact ? 'pt-7 pb-4' : 'pt-8'}`}>
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

        {/* Top Right Action Icons */}
        <div className={`absolute top-4 ${isPerfect ? 'right-12' : 'right-4'} flex items-center gap-2 z-30`}>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`p-1.5 rounded-full transition-all ${
              isSaved 
                ? "bg-purple-500/20 text-purple-400" 
                : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
            }`}
          >
            {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />}
          </button>
          {!isPerfect && (
            <div className="text-gray-500 group-hover:text-purple-400 transition-colors ml-1">
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-purple-400" />
              ) : (
                <ArrowRight size={18} className="transform group-hover:translate-x-1 transition-transform" />
              )}
            </div>
          )}
        </div>

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
            {Array.isArray(quiz.exam) ? (quiz.exam.length > 1 ? "General" : quiz.exam[0]) : quiz.exam}
          </span>
          <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
            {quiz.language}
          </span>
          {quiz.subjects && quiz.subjects.length > 0 && (
            <span className="bg-teal-500/20 text-teal-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {quiz.subjects.length > 1 ? "Mixed" : quiz.subjects[0]}
            </span>
          )}
        </div>

        <h3 className="font-display font-semibold text-base text-white mb-2 line-clamp-2 pr-6">
          {quiz.title}
        </h3>

        {!compact && quiz.description && (
          <p className="text-gray-400 text-xs mb-4 line-clamp-2">
            {stripMarkdown(quiz.description)}
          </p>
        )}

        {!compact && (
          <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-1.5">
            <StatChip
              label="Qns"
              value={quiz.questionCount}
              icon={<HelpCircle size={13} className="text-purple-400" />}
              color="purple"
              className="flex-1 justify-center px-0.5 py-1 text-[10px]"
            />
            <StatChip
              label=""
              value={formatDuration(quiz.durationMinutes)}
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
        )}

        {/* User Attempt Details */}
        {!compact && (
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
        )}
      </GlassCard>
    </div>
  );
}
