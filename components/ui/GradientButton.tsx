"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/helpers";

interface GradientButtonProps extends HTMLMotionProps<"button"> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "orange" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  isLoading?: boolean;
  className?: string;
}

const variantStyles = {
  primary: "bg-gradient-brand-vivid text-white shadow-glow hover:shadow-glow",
  secondary: "glass text-white border border-purple-500/40",
  orange: "bg-gradient-orange text-white shadow-glow-orange",
  ghost: "text-purple-300 hover:text-white hover:bg-white/10",
};

const sizeStyles = {
  sm: "px-4 py-2 text-sm rounded-xl",
  md: "px-6 py-3 text-base rounded-xl",
  lg: "px-8 py-4 text-lg rounded-2xl",
};

export default function GradientButton({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  isLoading = false,
  className,
  disabled,
  ...props
}: GradientButtonProps) {
  return (
    <motion.button
      className={cn(
        "font-semibold transition-all duration-200 flex items-center justify-center gap-2 select-none whitespace-nowrap",
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && "w-full",
        (disabled || isLoading) && "opacity-60 cursor-not-allowed",
        className
      )}
      whileHover={!disabled && !isLoading ? { scale: 1.03 } : undefined}
      whileTap={!disabled && !isLoading ? { scale: 0.97 } : undefined}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center gap-2 whitespace-nowrap">
          <svg
            className="animate-spin h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          Loading…
        </span>
      ) : (
        children
      )}
    </motion.button>
  );
}
