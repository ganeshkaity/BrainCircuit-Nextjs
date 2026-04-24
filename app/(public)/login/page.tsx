"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
} from "firebase/auth";
import { auth } from "@/lib/firebase/config";
import { getUser, createUser } from "@/lib/firebase/firestore";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import GradientButton from "@/components/ui/GradientButton";
import { motion } from "framer-motion";

const googleProvider = new GoogleAuthProvider();

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.password) return setError("Please fill in all fields.");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, form.email, form.password);
      // AuthProvider will pick up the state change and set cookies.
      // Check profile completion:
      const fbUser = auth.currentUser;
      if (fbUser) {
        const profile = await getUser(fbUser.uid);
        if (!profile || !profile.profileComplete) {
          router.push("/complete-profile");
        } else {
          router.push("/home");
        }
      }
    } catch (err: unknown) {
      setError(getFriendlyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      const existing = await getUser(cred.user.uid);
      if (!existing) {
        await createUser(cred.user.uid, {
          email: cred.user.email ?? "",
          displayName: cred.user.displayName ?? "",
          photoURL: cred.user.photoURL ?? "",
          profileComplete: false,
        } as Parameters<typeof createUser>[1]);
        router.push("/complete-profile");
      } else if (!existing.profileComplete) {
        router.push("/complete-profile");
      } else {
        router.push("/home");
      }
    } catch (err: unknown) {
      setError(getFriendlyError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center px-5 py-10">
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-purple-700/25 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-700/25 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-20 h-20 rounded-[2rem] bg-white flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
            <img src="/images/only_logo.png" alt="Logo" className="w-14 h-14 object-contain" />
          </div>
          <h1 className="font-display font-black text-3xl gradient-text">Brain Circuit</h1>
          <p className="text-gray-400 text-sm mt-1">Welcome back! Let&apos;s keep going.</p>
        </div>

        <div className="glass-md rounded-3xl p-6">
          {error && (
            <div className="bg-red-500/20 border border-red-500/40 text-red-300 text-sm rounded-xl px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-xs font-medium text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="email" name="email" type="email" autoComplete="email"
                  value={form.email} onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-default"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-medium text-gray-400 mb-1.5">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  id="password" name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={form.password} onChange={handleChange}
                  placeholder="Your password"
                  className="w-full bg-white/5 border border-white/15 rounded-xl pl-10 pr-11 py-3 text-sm text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-default"
                />
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <GradientButton type="submit" fullWidth isLoading={loading} className="mt-2">
              Log In
            </GradientButton>
          </form>

          <div className="flex items-center gap-3 my-4">
            <hr className="flex-1 border-white/10" />
            <span className="text-gray-500 text-xs">OR</span>
            <hr className="flex-1 border-white/10" />
          </div>

          <GradientButton variant="secondary" fullWidth isLoading={googleLoading} onClick={handleGoogle} type="button">
            <svg viewBox="0 0 24 24" className="w-4 h-4">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Continue with Google
          </GradientButton>

          <p className="text-center text-sm text-gray-400 mt-5">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-purple-400 hover:text-purple-300 font-medium">Sign up</Link>
          </p>
        </div>
      </motion.div>
    </main>
  );
}

function getFriendlyError(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  const map: Record<string, string> = {
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password.",
    "auth/invalid-credential": "Invalid email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/popup-closed-by-user": "Google sign-in was cancelled.",
  };
  return map[code] ?? "Something went wrong. Please try again.";
}
