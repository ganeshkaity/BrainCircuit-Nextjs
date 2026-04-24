"use client";

import Link from "next/link";
import { Clock, CheckCircle, HelpCircle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatChip from "@/components/ui/StatChip";
import type { QuizSet } from "@/types";

interface QuizCardProps {
  quiz: QuizSet;
}

export default function QuizCard({ quiz }: QuizCardProps) {
  return (
    <Link href={`/quiz/${quiz.id}`} className="block h-full">
      <GlassCard hover className="h-full flex flex-col relative pt-8">
        {/* Left Edge Banner Badge - Overlapping Top Border */}
        {quiz.badge && (
          <div className="absolute -top-1 -left-2 z-20 drop-shadow-md">
            <div 
              className={`relative px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r ${quiz.badge.color}`}
              style={{ clipPath: "polygon(0 0, 100% 0, 85% 50%, 100% 100%, 0 100%)", paddingRight: "1.25rem" }}
            >
              {quiz.badge.label}
            </div>
            {/* Side Fold Shadow */}
            <div className="absolute top-full left-0 w-2 h-2 bg-black/60 [clip-path:polygon(0_0,100%_0,100%_100%)]" />
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
      </GlassCard>
    </Link>
  );
}
