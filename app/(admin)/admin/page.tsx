"use client";
import { useEffect, useState } from "react";
import { collection, getCountFromServer } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Users, FileQuestion, Layers } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, questions: 0, quizzes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const u = await getCountFromServer(collection(db, "users"));
        const qs = await getCountFromServer(collection(db, "quiz_sets"));
        setStats({ users: u.data().count, quizzes: qs.data().count, questions: 0 });
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="p-6 md:p-10 pb-24">
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard Overview</h1>
      
      {loading ? (
        <div className="flex gap-4">
          {[1,2,3].map(i => <div key={i} className="h-32 w-full glass rounded-2xl animate-pulse" />)}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard title="Total Users" value={stats.users} icon={<Users className="text-blue-400" />} />
          <StatCard title="Active Quizzes" value={stats.quizzes} icon={<Layers className="text-orange-400" />} />
        </div>
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
