"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { getUserAttempts } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import { User, Mail, Target, Award, LogOut, CheckCircle, Clock, Pencil, ChevronDown, Info, ChevronRight } from "lucide-react";
import { auth, db } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { formatTime, cn } from "@/lib/helpers";
import EditAccountModal from "@/components/modals/EditAccountModal";
import LevelInfoModal from "@/components/modals/LevelInfoModal";
import StreakModal from "@/components/ui/StreakModal";
import { getOnboardingOptions } from "@/lib/firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";
import { usePWA } from "@/hooks/usePWA";
import { Download } from "lucide-react";

export default function ProfilePage() {
  const { user, clearUser, setUser, firebaseUid } = useUserStore();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [isStreakModalOpen, setIsStreakModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const { canInstall, installPWA } = usePWA();

  // Reset imgError when user changes
  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["attempts", firebaseUid],
    queryFn: () => getUserAttempts(firebaseUid!),
    enabled: !!firebaseUid,
    staleTime: 0, // always refetch to get the latest attempt
  });

  const { data: options } = useQuery({
    queryKey: ["onboarding_options"],
    queryFn: getOnboardingOptions,
  });

  const handleLogout = async () => {
    await signOut(auth);
    clearUser();
    router.push("/login");
  };

  const handleQuickExamChange = async (newExam: string) => {
    if (!user || newExam === user.targetExam) return;
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { targetExam: newExam });
      setUser({ ...user, targetExam: newExam });
    } catch (err) {
      console.error("Failed to update exam:", err);
    }
  };

  if (!user) return null;

  return (
    <main className="min-h-dvh pb-24 pt-16">
      <Header title="Profile" />
      
      <div className="px-5 max-w-md mx-auto mt-6 space-y-6">
        
        {/* User Card */}
        <div className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 blur-3xl rounded-full" />
          
          <div className="flex items-center gap-4 mb-4">
            {user.photoURL && !imgError ? (
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-900 border-2 border-white/10 shrink-0 shadow-glow">
                <img 
                  src={user.photoURL} 
                  alt={user.displayName}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-brand-vivid flex items-center justify-center shadow-glow text-2xl font-bold text-white shrink-0 border-2 border-white/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-black/10" />
                <span className="relative z-10">{user.displayName[0].toUpperCase()}</span>
              </div>
            )}
            <div className="flex-1 relative z-10">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
                <button 
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditModalOpen(true);
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all active:scale-90 cursor-pointer shadow-lg border border-white/10"
                  aria-label="Edit Profile"
                >
                  <Pencil size={16} className="text-purple-400" />
                </button>
              </div>
              <p className="text-sm text-gray-400 flex items-center gap-1 mt-0.5">
                <Mail size={12} /> {user.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            {/* Exam Card with Quick Change */}
            <div className="bg-white/5 rounded-2xl p-3 relative group overflow-hidden">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Target size={12} /> Exam
              </p>
              <div className="flex items-center justify-between">
                <p className="font-semibold text-white truncate mr-1">{user.targetExam}</p>
                <div className="relative">
                  <ChevronDown size={14} className="text-gray-500 group-hover:text-purple-400 transition-colors" />
                  <select 
                    value={user.targetExam}
                    onChange={(e) => handleQuickExamChange(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    aria-label="Quick change exam"
                  >
                    {options?.exams.map(exam => (
                      <option key={exam} value={exam} className="bg-gray-900 text-white">{exam}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Level Card with Info */}
            <div className="bg-white/5 rounded-2xl p-3 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-gray-400 flex items-center gap-1">
                  <Award size={12} /> Level
                </p>
                <button 
                  onClick={() => setIsLevelModalOpen(true)}
                  className="text-gray-500 hover:text-blue-400 transition-colors"
                >
                  <Info size={14} />
                </button>
              </div>
              <p className="font-semibold text-purple-300">{user.level}</p>
            </div>

            <button 
              onClick={() => router.push("/leaderboard")}
              className="bg-gradient-to-br from-orange-500/20 to-orange-600/5 rounded-2xl p-3 border border-orange-500/20 text-left transition-all active:scale-95 group relative"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-orange-400/80">Total Points</p>
                <ChevronRight size={14} className="text-orange-400/40 group-hover:text-orange-400 transition-colors" />
              </div>
              <p className="font-bold text-lg text-orange-400">{user.points} pts</p>
            </button>

            <button 
              onClick={() => setIsStreakModalOpen(true)}
              className="bg-gradient-to-br from-orange-500/20 to-red-600/5 rounded-2xl p-3 border border-orange-500/20 text-left transition-all active:scale-95 group relative"
            >
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-orange-400/80">Streak</p>
                <ChevronRight size={14} className="text-orange-400/40 group-hover:text-orange-400 transition-colors" />
              </div>
              <div className="flex items-center gap-2">
                <p className="font-bold text-lg text-white">{user.streak || 0} Days</p>
                <svg 
                  viewBox="0 0 611.999 611.999" 
                  className="w-5 h-5" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <linearGradient id="profileFlameGrad" x1="306" y1="0" x2="306" y2="612" gradientUnits="userSpaceOnUse">
                      <stop offset="0%" stopColor="#ff9a00" />
                      <stop offset="60%" stopColor="#ff4500" />
                      <stop offset="100%" stopColor="#ff2200" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M216.02,611.195c5.978,3.178,12.284-3.704,8.624-9.4c-19.866-30.919-38.678-82.947-8.706-149.952 c49.982-111.737,80.396-169.609,80.396-169.609s16.177,67.536,60.029,127.585c42.205,57.793,65.306,130.478,28.064,191.029 c-3.495,5.683,2.668,12.388,8.607,9.349c46.1-23.582,97.806-70.885,103.64-165.017c2.151-28.764-1.075-69.034-17.206-119.851 c-20.741-64.406-46.239-94.459-60.992-107.365c-4.413-3.861-11.276-0.439-10.914,5.413c4.299,69.494-21.845,87.129-36.726,47.386 c-5.943-15.874-9.409-43.33-9.409-76.766c0-55.665-16.15-112.967-51.755-159.531c-9.259-12.109-20.093-23.424-32.523-33.073 c-4.5-3.494-11.023,0.018-10.611,5.7c2.734,37.736,0.257,145.885-94.624,275.089c-86.029,119.851-52.693,211.896-40.864,236.826 C153.666,566.767,185.212,594.814,216.02,611.195z"
                    fill={(user.streak || 0) > 0 ? "url(#profileFlameGrad)" : "#374151"}
                  />
                </svg>
              </div>
            </button>
          </div>
        </div>

        {/* History */}
        <div>
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="font-display font-bold text-lg text-white">Recent Tests</h3>
            {attempts.length > 5 && (
              <button 
                onClick={() => router.push("/recent-tests")}
                className="text-sm font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                View All
              </button>
            )}
          </div>
          {isLoading ? (
            <p className="text-gray-500 text-sm px-1">Loading history...</p>
          ) : attempts.length > 0 ? (
            <div className="space-y-3">
              {attempts.slice(0, 5).map(a => {
                const pct = a.percentage ?? parseFloat(((a.score / a.maxScore) * 100).toFixed(1));
                let scoreColor = "text-red-400";
                let ringColor = "hover:border-red-500/30";
                if (pct === 100) { scoreColor = "text-yellow-400"; ringColor = "hover:border-yellow-500/50 ring-1 ring-yellow-500/20"; }
                else if (pct >= 80) { scoreColor = "text-green-400"; ringColor = "hover:border-green-500/40"; }
                else if (pct >= 50) { scoreColor = "text-orange-400"; ringColor = "hover:border-orange-500/40"; }

                return (
                  <div 
                    key={a.id} 
                    onClick={() => router.push(`/quiz/${a.quizId}/result?attemptId=${a.id}`)}
                    className={cn(
                      "glass-md rounded-2xl p-4 flex items-center justify-between cursor-pointer transition-all active:scale-[0.98] border border-white/5",
                      ringColor
                    )}
                  >
                    <div>
                      <p className="font-medium text-white mb-1">Score: {a.score} / {a.maxScore}</p>
                      <div className="flex gap-3 text-xs text-gray-400">
                        <span className={cn("flex items-center gap-1 font-bold", scoreColor)}>
                          <CheckCircle size={12}/> {pct}%
                        </span>
                        <span className="flex items-center gap-1"><Clock size={12}/> {formatTime(a.timeTaken)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                        +{a.pointsEarned} pts
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="glass rounded-2xl p-6 text-center text-gray-400 text-sm">
              You haven't taken any tests yet. Head to home to start practicing!
            </div>
          )}
        </div>

        <button 
          onClick={handleLogout}
          className="w-full flex justify-center items-center gap-2 py-4 text-red-400 hover:bg-red-500/10 rounded-2xl transition-default font-medium mt-4"
        >
          <LogOut size={18} /> Log Out
        </button>

        {canInstall && (
          <div className="glass rounded-2xl p-4 mt-6 border border-purple-500/30 flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-sm mb-1">Install App</h3>
              <p className="text-gray-400 text-xs">Add Brain Circuit to your home screen</p>
            </div>
            <button 
              onClick={installPWA}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
            >
              <Download size={16} /> Install
            </button>
          </div>
        )}

        <div className="flex flex-col items-center gap-1 opacity-25 mt-4">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white mb-0.5">
            Brain Circuit
          </p>
          <div className="flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-purple-500/50" />
            <p className="text-[9px] font-bold text-purple-400">
              v 1.0.4.7
            </p>
            <span className="w-1 h-1 rounded-full bg-purple-500/50" />
          </div>
          <p className="text-[8px] font-bold text-white/40 uppercase tracking-widest mt-1">
            Build by Ganesh
          </p>
        </div>
      </div>

      <EditAccountModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />

      <LevelInfoModal 
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
      />

      <StreakModal
        isOpen={isStreakModalOpen}
        onClose={() => setIsStreakModalOpen(false)}
        streak={user.streak || 0}
        longestStreak={user.longestStreak || 0}
        shields={user.shields ?? 2}
      />
    </main>
  );
}
