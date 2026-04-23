"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/helpers";

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  glow?: boolean;
}

export default function GlassCard({
  children,
  className,
  hover = false,
  glow = false,
  ...props
}: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        "glass rounded-2xl p-4",
        hover && "cursor-pointer",
        glow && "shadow-glow",
        className
      )}
      whileHover={hover ? { scale: 1.02, y: -2 } : undefined}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
