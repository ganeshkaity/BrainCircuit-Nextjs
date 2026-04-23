"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { Users, Star } from "lucide-react";
import type { UserProfile } from "@/types";

export default function ManageUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      try {
        const q = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(50));
        const snap = await getDocs(q);
        setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as UserProfile)));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  return (
    <div className="p-6 md:p-10 pb-24">
      <div className="flex items-center gap-2 mb-6">
        <Users className="text-blue-400" />
        <h1 className="text-2xl font-bold text-white">Recent Users</h1>
      </div>

      <div className="glass rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white/5 text-gray-400 uppercase text-xs">
              <tr>
                <th className="px-6 py-4 font-medium">User</th>
                <th className="px-6 py-4 font-medium">Exam & Class</th>
                <th className="px-6 py-4 font-medium">Level</th>
                <th className="px-6 py-4 font-medium">Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-200">
              {loading ? (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : users.map(u => (
                <tr key={u.uid} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-white">{u.displayName}</p>
                    <p className="text-xs text-gray-400">{u.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p>{u.targetExam}</p>
                    <p className="text-xs text-gray-400">Class {u.classLevel}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-purple-500/20 text-purple-300 px-2 py-1 rounded text-xs">
                      {u.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 font-bold text-orange-400">
                      <Star size={14} className="fill-orange-400" /> {u.points}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
