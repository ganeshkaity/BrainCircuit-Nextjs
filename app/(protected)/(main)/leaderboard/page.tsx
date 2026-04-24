"use client";

import { useQuery } from "@tanstack/react-query";
import { getLeaderboard, getUserAttempts, getQuizSets } from "@/lib/firebase/firestore";
import { useUserStore } from "@/store/userStore";
import Header from "@/components/layout/Header";
import LoadingState from "@/components/ui/LoadingState";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Medal, Star, X, TrendingUp, Clock, Target, Award, ChevronRight } from "lucide-react";
import { cn } from "@/lib/helpers";
import { useState, useMemo } from "react";
import type { Attempt, QuizSet, UserProfile } from "@/types";

function Avatar({ src, name, className }: { src?: string, name: string, className?: string }) {
  const [error, setError] = useState(false);
  
  if (src && !error) {
    return (
      <div className={cn("overflow-hidden shrink-0", className)}>
        <img 
          src={src} 
          alt={name} 
          className="w-full h-full object-cover" 
          onError={() => setError(true)} 
        />
      </div>
    );
  }

  return (
    <div className={cn("bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-black shrink-0", className)}>
      {name?.[0]?.toUpperCase() || "U"}
    </div>
  );
}

export default function LeaderboardPage() {
  const { user, firebaseUid } = useUserStore();
  const [selectedProfile, setSelectedProfile] = useState<UserProfile | null>(null);

  const { data: leaders = [], isLoading } = useQuery<UserProfile[]>({
    queryKey: ["leaderboard", user?.targetExam],
    queryFn: () => getLeaderboard(user?.targetExam || "NEET") as any,
    enabled: !!(user || firebaseUid),
  });

  const activeLeaders = useMemo(() => leaders.filter(l => (l.points || 0) > 0), [leaders]);

  const { data: attempts = [], isLoading: isLoadingAttempts } = useQuery<Attempt[]>({
    queryKey: ["user_attempts", selectedProfile?.uid],
    queryFn: () => (selectedProfile ? getUserAttempts(selectedProfile.uid) : Promise.resolve([])) as any,
    enabled: !!selectedProfile,
  });

  const { data: quizzes = [] } = useQuery<QuizSet[]>({
    queryKey: ["quizzes"],
    queryFn: () => getQuizSets(),
    enabled: !!selectedProfile,
  });

  const userStats = useMemo(() => {
    if (!selectedProfile || attempts.length === 0) return null;

    const total = attempts.length;
    const sumPercent = attempts.reduce((acc, a) => acc + (a.percentage || 0), 0);
    const sumTime = attempts.reduce((acc, a) => acc + a.timeTaken, 0);
    const sortedByScore = [...attempts].sort((a, b) => (b.percentage || 0) - (a.percentage || 0));
    
    const bestAttempt = sortedByScore[0];
    const top5Attempts = sortedByScore.slice(0, 5);

    const formatTime = (seconds: number) => {
      const m = Math.floor(seconds / 60);
      const s = Math.floor(seconds % 60);
      return `${m}m ${s}s`;
    };

    return {
      avgScore: Math.round(sumPercent / total),
      avgTime: formatTime(Math.round(sumTime / total)),
      highestScore: `${Math.round(bestAttempt.percentage || 0)}%`,
      highestScoreRaw: `${bestAttempt.score}/${bestAttempt.maxScore}`,
      topQuizzes: top5Attempts.map(a => {
        const quiz = quizzes.find(q => q.id === a.quizId);
        return {
          title: quiz?.title || "Unknown Quiz",
          score: `${Math.round(a.percentage || 0)}%`,
          raw: `${a.score}/${a.maxScore}`,
          date: a.createdAt ? new Date((a.createdAt as any).seconds * 1000).toLocaleDateString() : "N/A"
        };
      })
    };
  }, [selectedProfile, attempts, quizzes]);

  return (
    <main className="min-h-dvh pb-24 pt-16">
      <Header title="Leaderboard" />
      
      <div className="px-5 max-w-md mx-auto mt-4">
        <div className="glass-md rounded-2xl p-4 flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm text-gray-400 font-medium">Target Exam</h2>
            <p className="text-lg font-bold text-white tracking-tight">{user?.targetExam || "Not Set"}</p>
          </div>
          <Trophy size={32} className="text-orange-400 drop-shadow-[0_0_10px_rgba(251,146,60,0.5)]" />
        </div>

        {isLoading ? (
          <LoadingState message="Fetching global rankings..." />
        ) : (
          <div className="space-y-3">
            {activeLeaders.length === 0 ? (
              <div className="glass rounded-2xl p-8 text-center border border-white/5">
                <Trophy size={32} className="mx-auto mb-3 text-gray-600" />
                <p className="text-gray-400 text-sm font-medium">No active participants yet for {user?.targetExam}.</p>
                <p className="text-gray-600 text-xs mt-1 uppercase font-bold tracking-widest">Be the first to take a quiz!</p>
              </div>
            ) : (
              activeLeaders.map((leader, index) => {
              const isTop3 = index < 3;
              const isMe = leader.uid === (user?.uid || firebaseUid);
              
              return (
                <motion.div
                  key={leader.uid}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedProfile(leader)}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-2xl transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98] group",
                    isMe ? "bg-purple-600/20 border border-purple-500/30" : "glass border border-white/5",
                    isTop3 && index === 0 && "ring-1 ring-yellow-500/30",
                    isTop3 && index === 1 && "ring-1 ring-gray-300/30",
                    isTop3 && index === 2 && "ring-1 ring-orange-400/30"
                  )}
                >
                  {/* Rank Badge */}
                  <div className="w-8 flex justify-center font-display font-bold">
                    {index === 0 ? <Medal className="text-yellow-400" size={24} /> :
                     index === 1 ? <Medal className="text-gray-300" size={24} /> :
                     index === 2 ? <Medal className="text-orange-400" size={24} /> :
                     <span className="text-gray-500 font-black">#{index + 1}</span>}
                  </div>

                  {/* Avatar */}
                  <Avatar 
                    src={leader.photoURL} 
                    name={leader.displayName} 
                    className="w-10 h-10 rounded-full border-2 border-white/10" 
                  />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-bold truncate text-sm">
                      {leader.displayName} {isMe && "(You)"}
                    </p>
                    <p className="text-[10px] text-purple-300 uppercase font-black tracking-widest">{leader.level}</p>
                  </div>

                  {/* Points */}
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-xl shrink-0 group-hover:bg-white/10 transition-colors">
                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                    <span className="font-black text-sm text-white">{leader.points}</span>
                  </div>
                </motion.div>
              );
            }))}
          </div>
        )}
      </div>

      {/* User Detail Modal */}
      <AnimatePresence>
        {selectedProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProfile(null)}
              className="absolute inset-0 bg-gray-950/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-sm glass-dark border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col max-h-[85dvh]"
            >
              {/* Header / Banner */}
              <div className="h-24 bg-gradient-to-r from-purple-600/30 to-blue-600/30 relative">
                 <button 
                  onClick={() => setSelectedProfile(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white/80 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Profile Main */}
              <div className="px-6 pb-6 -mt-10 flex flex-col items-center">
                 <div className="w-20 h-20 rounded-3xl overflow-hidden border-4 border-gray-950 shadow-xl mb-4">
                   <Avatar 
                      src={selectedProfile.photoURL} 
                      name={selectedProfile.displayName} 
                      className="w-full h-full"
                   />
                 </div>
                 <h2 className="text-xl font-black text-white">{selectedProfile.displayName}</h2>
                 <p className="text-xs font-black text-purple-400 uppercase tracking-widest mt-1">{selectedProfile.level}</p>
                 
                 <div className="mt-4 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex items-center gap-2">
                   <Star size={16} className="text-yellow-400 fill-yellow-400" />
                   <span className="text-lg font-black text-white">{selectedProfile.points}</span>
                   <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Points</span>
                 </div>
              </div>

              {/* Stats Grid */}
              <div className="px-6 pb-6 overflow-y-auto custom-scrollbar space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  <div className="glass-md p-3 rounded-2xl border border-white/5 space-y-1 text-center">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Avg Score</p>
                    <p className="text-lg font-black text-white">{isLoadingAttempts ? "..." : (userStats?.avgScore || 0) + "%"}</p>
                  </div>
                  <div className="glass-md p-3 rounded-2xl border border-white/5 space-y-1 text-center">
                    <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Best Score</p>
                    <p className="text-lg font-black text-white">{isLoadingAttempts ? "..." : (userStats?.highestScore || "0%")}</p>
                    {userStats && <p className="text-[8px] text-purple-400 font-bold">{userStats.highestScoreRaw}</p>}
                  </div>
                  <div className="col-span-2 glass-md p-3 rounded-2xl border border-white/5 flex items-center justify-between px-5">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                        <Clock size={16} />
                      </div>
                      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Avg Time</p>
                    </div>
                    <p className="text-sm font-black text-white">{isLoadingAttempts ? "..." : (userStats?.avgTime || "0s")}</p>
                  </div>
                </div>

                {/* Top Quizzes */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-purple-400" />
                    <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Top Performances</h3>
                  </div>
                  
                  <div className="space-y-2">
                    {isLoadingAttempts ? (
                      Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
                      ))
                    ) : userStats && userStats.topQuizzes.length > 0 ? (
                      userStats.topQuizzes.map((q, i) => (
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 transition-colors group">
                           <div className="flex-1 min-w-0 pr-3">
                             <p className="text-xs font-bold text-gray-200 truncate">{q.title}</p>
                             <p className="text-[9px] text-gray-500 font-medium">{q.date}</p>
                           </div>
                           <div className="text-right">
                             <div className="text-sm font-black text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-lg group-hover:bg-purple-500 group-hover:text-white transition-all">
                               {q.score}
                             </div>
                             <p className="text-[8px] text-gray-500 font-bold mt-1 group-hover:text-white/70">{(q as any).raw}</p>
                           </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-4 text-center text-[10px] text-gray-600 font-bold uppercase italic">
                        No quiz data available
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
