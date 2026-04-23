"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaderboard } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import { motion } from "framer-motion";
import { Trophy, Medal, Star } from "lucide-react";
import { cn } from "@/lib/helpers";

export default function LeaderboardPage() {
  const { user } = useUserStore();

  const { data: leaders = [], isLoading } = useQuery({
    queryKey: ["leaderboard", user?.targetExam],
    queryFn: () => getLeaderboard(user?.targetExam || "NEET"),
    enabled: !!user,
  });

  return (
    <main className="min-h-dvh pb-24 pt-16">
      <Header title="Leaderboard" />
      
      <div className="px-5 max-w-md mx-auto mt-4">
        <div className="glass-md rounded-2xl p-4 flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm text-gray-400">Target Exam</h2>
            <p className="text-lg font-bold text-white">{user?.targetExam}</p>
          </div>
          <Trophy size={32} className="text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
        </div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {leaders.map((leader, index) => {
              const isTop3 = index < 3;
              const isMe = leader.uid === user?.uid;
              
              return (
                <motion.div
                  key={leader.uid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl transition-default",
                    isMe ? "bg-purple-600/20 border border-purple-500/30" : "glass",
                    isTop3 && index === 0 && "ring-1 ring-yellow-500/50",
                    isTop3 && index === 1 && "ring-1 ring-gray-300/50",
                    isTop3 && index === 2 && "ring-1 ring-orange-400/50"
                  )}
                >
                  {/* Rank Badge */}
                  <div className="w-8 flex justify-center font-display font-bold">
                    {index === 0 ? <Medal className="text-yellow-400" size={24} /> :
                     index === 1 ? <Medal className="text-gray-300" size={24} /> :
                     index === 2 ? <Medal className="text-orange-400" size={24} /> :
                     <span className="text-gray-500">#{index + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold shrink-0">
                    {leader.displayName[0].toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold truncate text-sm">
                      {leader.displayName} {isMe && "(You)"}
                    </p>
                    <p className="text-xs text-purple-300">{leader.level}</p>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg shrink-0">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-bold text-sm text-white">{leader.points}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
