"use client";

import { useUserStore } from "@/store/userStore";
import { useQuery } from "@tanstack/react-query";
import { getUserAttempts } from "@/lib/firebase/firestore";
import Header from "@/components/layout/Header";
import { User, Mail, Target, Award, LogOut, CheckCircle, Clock } from "lucide-react";
import { auth } from "@/lib/firebase/config";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { formatTime } from "@/lib/helpers";

export default function ProfilePage() {
  const { user, clearUser } = useUserStore();
  const router = useRouter();

  const { data: attempts = [], isLoading } = useQuery({
    queryKey: ["attempts", user?.uid],
    queryFn: () => getUserAttempts(user!.uid),
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut(auth);
    clearUser();
    router.push("/login");
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-brand-vivid flex items-center justify-center shadow-glow text-2xl font-bold text-white shrink-0">
              {user.displayName[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{user.displayName}</h2>
              <p className="text-sm text-gray-400 flex items-center gap-1">
                <Mail size={12} /> {user.email}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Target size={12} /> Exam
              </p>
              <p className="font-semibold text-white">{user.targetExam}</p>
            </div>
            <div className="bg-white/5 rounded-2xl p-3">
              <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                <Award size={12} /> Level
              </p>
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
          <h3 className="font-display font-bold text-lg mb-3 px-1 text-white">Recent Tests</h3>
          {isLoading ? (
            <p className="text-gray-500 text-sm px-1">Loading history...</p>
          ) : attempts.length > 0 ? (
            <div className="space-y-3">
              {attempts.map(a => (
                <div key={a.id} className="glass-md rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-white mb-1">Score: {a.score} / {a.maxScore}</p>
                    <div className="flex gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><CheckCircle size={12}/> {Math.round((a.score/a.maxScore)*100)}%</span>
                      <span className="flex items-center gap-1"><Clock size={12}/> {formatTime(a.timeTaken)}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">
                      +{a.pointsEarned} pts
                    </span>
                  </div>
                </div>
              ))}
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
    </main>
  );
}
