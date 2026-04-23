"use client";
import { cn } from "@/lib/helpers";

interface StatChipProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: "purple" | "blue" | "orange" | "green" | "red";
  className?: string;
}

const colorMap = {
  purple: "bg-purple-500/20 border-purple-500/40 text-purple-300",
  blue: "bg-blue-500/20 border-blue-500/40 text-blue-300",
  orange: "bg-orange-500/20 border-orange-500/40 text-orange-300",
  green: "bg-green-500/20 border-green-500/40 text-green-300",
  red: "bg-red-500/20 border-red-500/40 text-red-300",
};

export default function StatChip({
  label,
  value,
  icon,
  color = "purple",
  className,
}: StatChipProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium",
        colorMap[color],
        className
      )}
    >
      {icon && <span className="text-base">{icon}</span>}
      <span className="opacity-70">{label}:</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
