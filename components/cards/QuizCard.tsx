"use client";

import Link from "next/link";
import { Clock, CheckCircle, Flame } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatChip from "@/components/ui/StatChip";
import type { QuizSet } from "@/types";

interface QuizCardProps {
  quiz: QuizSet;
}

export default function QuizCard({ quiz }: QuizCardProps) {
  return (
    <Link href={`/quiz/${quiz.id}`} className="block">
      <GlassCard hover className="h-full flex flex-col">
        <div className="flex items-start justify-between mb-3">
          <div className="flex flex-wrap gap-2">
            <span className="bg-purple-500/20 text-purple-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {quiz.exam}
            </span>
            <span className="bg-blue-500/20 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              {quiz.language}
            </span>
          </div>
          <Flame size={18} className="text-orange-500" />
        </div>

        <h3 className="font-display font-semibold text-lg text-white mb-2 line-clamp-2">
          {quiz.title}
        </h3>
        
        {quiz.description && (
          <p className="text-gray-400 text-xs mb-4 line-clamp-2">
            {quiz.description}
          </p>
        )}

        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between gap-2">
          <StatChip
            label="Mins"
            value={quiz.durationMinutes}
            icon={<Clock size={14} className="text-blue-400" />}
            color="blue"
            className="flex-1 justify-center px-1 py-1"
          />
          <StatChip
            label="Marks"
            value={quiz.totalMarks}
            icon={<CheckCircle size={14} className="text-green-400" />}
            color="green"
            className="flex-1 justify-center px-1 py-1"
          />
        </div>
      </GlassCard>
    </Link>
  );
}
