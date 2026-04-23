"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { updateUser, getUser } from "@/lib/firebase/firestore";
import GradientButton from "@/components/ui/GradientButton";
import { motion } from "framer-motion";

export default function CompleteProfilePage() {
  const router = useRouter();
  const { user, setUser, firebaseUid } = useUserStore();
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({
    language: "English" as "English" | "Hindi",
    classLevel: "12" as "11" | "12" | "Dropper",
    targetExam: "NEET" as "NEET" | "JEE Mains" | "JEE Advanced",
    dob: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUid) return;
    if (!form.dob) return alert("Please enter your date of birth.");

    setLoading(true);
    try {
      await updateUser(firebaseUid, {
        language: form.language,
        classLevel: form.classLevel,
        targetExam: form.targetExam,
        dob: form.dob,
        profileComplete: true,
      });
      const updated = await getUser(firebaseUid);
      if (updated) setUser(updated);
      router.push("/home");
    } catch (error) {
      console.error(error);
      alert("Failed to update profile. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!firebaseUid) return null; // let middleware or auth provider handle

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm glass-md rounded-3xl p-6"
      >
        <h1 className="font-display font-bold text-2xl text-white mb-2">Complete Profile</h1>
        <p className="text-gray-400 text-sm mb-6">Tell us about your preparation to personalize your experience.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Target Exam</label>
            <select
              name="targetExam"
              value={form.targetExam}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none"
            >
              <option value="NEET" className="bg-gray-900">NEET</option>
              <option value="JEE Mains" className="bg-gray-900">JEE Mains</option>
              <option value="JEE Advanced" className="bg-gray-900">JEE Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Class</label>
            <select
              name="classLevel"
              value={form.classLevel}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none"
            >
              <option value="11" className="bg-gray-900">Class 11</option>
              <option value="12" className="bg-gray-900">Class 12</option>
              <option value="Dropper" className="bg-gray-900">Dropper</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Preferred Language</label>
            <select
              name="language"
              value={form.language}
              onChange={handleChange}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none"
            >
              <option value="English" className="bg-gray-900">English</option>
              <option value="Hindi" className="bg-gray-900">Hindi</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">Date of Birth</label>
            <input
              type="date"
              name="dob"
              value={form.dob}
              onChange={handleChange}
              max={new Date().toISOString().split("T")[0]}
              className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm text-white focus:border-purple-500 outline-none [color-scheme:dark]"
            />
          </div>

          <GradientButton type="submit" fullWidth isLoading={loading} className="mt-4">
            Continue to App
          </GradientButton>
        </form>
      </motion.div>
    </main>
  );
}
