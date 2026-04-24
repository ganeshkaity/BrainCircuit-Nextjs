"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { getUserAttempts } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import { User, Mail, Target, Award, LogOut, CheckCircle, Clock, Pencil, ChevronDown, Info } from "lucide-react";
import { auth, db } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { formatTime, cn } from "@/lib/helpers";
import EditAccountModal from "@/components/modals/EditAccountModal";
import LevelInfoModal from "@/components/modals/LevelInfoModal";
import { getOnboardingOptions } from "@/lib/firebase/firestore";
import { doc, updateDoc } from "firebase/firestore";

export default function ProfilePage() {
  const { user, clearUser, setUser, firebaseUid } = useUserStore();
  const router = useRouter();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLevelModalOpen, setIsLevelModalOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

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
              <img 
                src={user.photoURL} 
                alt={user.displayName}
                referrerPolicy="no-referrer"
                onError={() => setImgError(true)}
                className="w-16 h-16 rounded-2xl object-cover shadow-glow border-2 border-white/10 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-brand-vivid flex items-center justify-center shadow-glow text-2xl font-bold text-white shrink-0">
                {user.displayName[0].toUpperCase()}
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

            <div className="col-span-2 bg-gradient-to-r from-orange-500/20 to-orange-600/5 rounded-2xl p-3 border border-orange-500/20">
              <p className="text-xs text-orange-400/80 mb-1">Total Points</p>
              <p className="font-bold text-xl text-orange-400">{user.points} pts</p>
            </div>
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
      </div>

      <EditAccountModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />

      <LevelInfoModal 
        isOpen={isLevelModalOpen}
        onClose={() => setIsLevelModalOpen(false)}
      />
    </main>
  );
}
