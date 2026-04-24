"use client";
import { useEffect, useState } from "react";
import { collection, getCountFromServer, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Users, Layers, Trophy, TrendingUp, BookOpen } from "lucide-react";
import type { UserProfile, QuizSet } from "@/types";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, quizzes: 0 });
  const [topUsers, setTopUsers] = useState<UserProfile[]>([]);
  const [topQuizzes, setTopQuizzes] = useState<{name: string, count: number}[]>([]);
  const [topSubjects, setTopSubjects] = useState<{name: string, count: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Basic Stats
        const u = await getCountFromServer(collection(db, "users"));
        const qs = await getCountFromServer(collection(db, "quiz_sets"));
        setStats({ users: u.data().count, quizzes: qs.data().count });

        // 2. Top Users (Scorers)
        const topUsersSnap = await getDocs(query(collection(db, "users"), orderBy("points", "desc"), limit(5)));
        const usersList: UserProfile[] = [];
        topUsersSnap.forEach(doc => usersList.push(doc.data() as UserProfile));
        setTopUsers(usersList);

        // 3. Aggregate Quizzes and Attempts
        const quizzesSnap = await getDocs(collection(db, "quiz_sets"));
        const quizMap: Record<string, QuizSet> = {};
        quizzesSnap.forEach(doc => {
          quizMap[doc.id] = { id: doc.id, ...doc.data() } as QuizSet;
        });

        const attemptsSnap = await getDocs(collection(db, "attempts"));
        const quizCounts: Record<string, number> = {};
        const subjectCounts: Record<string, number> = {};

        attemptsSnap.forEach(doc => {
          const quizId = doc.data().quizId;
          quizCounts[quizId] = (quizCounts[quizId] || 0) + 1;
          
          const subjects = quizMap[quizId]?.subjects || [];
          subjects.forEach(sub => {
            subjectCounts[sub] = (subjectCounts[sub] || 0) + 1;
          });
        });

        // Sort Top Quizzes
        const sortedQuizzes = Object.entries(quizCounts)
          .map(([id, count]) => ({ name: quizMap[id]?.title || "Unknown Quiz", count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopQuizzes(sortedQuizzes);

        // Sort Top Subjects
        const sortedSubjects = Object.entries(subjectCounts)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);
        setTopSubjects(sortedSubjects);

      } catch (e) {
        console.error("Failed to fetch dashboard data:", e);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-6 md:p-10 pb-24 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin Dashboard</h1>
        <p className="text-gray-400 text-sm">Platform overview and analytics</p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2].map(i => <div key={i} className="h-32 w-full glass rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* Top Level Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total Users" value={stats.users} icon={<Users className="text-blue-400" />} />
            <StatCard title="Active Quizzes" value={stats.quizzes} icon={<Layers className="text-orange-400" />} />
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Top Scorer Chart */}
            <div className="glass p-6 rounded-2xl flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <Trophy className="text-yellow-400" size={20} />
                <h2 className="font-semibold text-white">Top Scorers</h2>
              </div>
              <div className="space-y-5 flex-1">
                {topUsers.length === 0 ? <p className="text-gray-500 text-sm">No user data yet.</p> : topUsers.map((u, i) => {
                  const maxPoints = topUsers[0]?.points || 1;
                  const percentage = Math.max((u.points / maxPoints) * 100, 5); // min 5% width
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-medium truncate pr-4">{u.displayName || "Unknown User"}</span>
                        <span className="text-purple-400 font-bold">{u.points} pts</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-600 to-blue-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Most Taken Quizzes Chart */}
            <div className="glass p-6 rounded-2xl flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="text-green-400" size={20} />
                <h2 className="font-semibold text-white">Most Taken Quizzes</h2>
              </div>
              <div className="space-y-5 flex-1">
                {topQuizzes.length === 0 ? <p className="text-gray-500 text-sm">No attempt data yet.</p> : topQuizzes.map((q, i) => {
                  const maxCount = topQuizzes[0]?.count || 1;
                  const percentage = Math.max((q.count / maxCount) * 100, 5);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-medium truncate pr-4">{q.name}</span>
                        <span className="text-green-400 font-bold">{q.count}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-600 to-teal-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Subjects Chart */}
            <div className="glass p-6 rounded-2xl flex flex-col h-full">
              <div className="flex items-center gap-2 mb-6">
                <BookOpen className="text-orange-400" size={20} />
                <h2 className="font-semibold text-white">Popular Subjects</h2>
              </div>
              <div className="space-y-5 flex-1">
                {topSubjects.length === 0 ? <p className="text-gray-500 text-sm">No subject data yet.</p> : topSubjects.map((s, i) => {
                  const maxCount = topSubjects[0]?.count || 1;
                  const percentage = Math.max((s.count / maxCount) * 100, 5);
                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-300 font-medium truncate pr-4">{s.name}</span>
                        <span className="text-orange-400 font-bold">{s.count}</span>
                      </div>
                      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-orange-600 to-red-500 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
  return (
    <div className="glass p-6 rounded-2xl flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-400 mb-1">{title}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
      <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shrink-0">
        {icon}
      </div>
    </div>
  );
}
