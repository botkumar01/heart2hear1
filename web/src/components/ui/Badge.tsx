import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Tone = "teal" | "blue" | "coral" | "yellow" | "neutral" | "danger";

const toneClasses: Record<Tone, string> = {
  teal: "bg-teal-100 text-teal-700",
  blue: "bg-blue-100 text-blue-600",
  coral: "bg-coral-100 text-coral-600",
  yellow: "bg-yellow-100 text-yellow-500",
  neutral: "bg-paper-dim text-ink-muted",
  danger: "bg-danger-100 text-danger-600",
};

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
}

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
        toneClasses[tone],
        className,
      )}
      {...props}
    />
  );
}
