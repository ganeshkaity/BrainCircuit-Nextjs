import Link from "next/link";
import { ArrowLeft, Cpu } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4">
      <div className="glass-dark max-w-md w-full p-8 rounded-3xl text-center space-y-6 shadow-2xl shadow-purple-900/20 border border-white/10">
        
        {/* Animated Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500/20 blur-xl rounded-full" />
            <Cpu size={64} className="text-purple-400 relative z-10 animate-pulse" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
            404
          </h1>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Lost in the Circuit?
          </h2>
          <p className="text-gray-400 text-sm leading-relaxed">
            The page you're looking for doesn't exist or has been moved. Let's get you back to the main grid.
          </p>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href="/home"
            className="w-full inline-flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-gradient-brand-vivid text-white font-semibold transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-purple-600/30"
          >
            <ArrowLeft size={18} />
            Back to Dashboard
          </Link>
        </div>

      </div>
    </div>
  );
}
