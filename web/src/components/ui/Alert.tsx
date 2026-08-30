import type { HTMLAttributes } from "react";
import { cn } from "../../lib/cn";

type Tone = "info" | "success" | "warning" | "danger";

const toneClasses: Record<Tone, string> = {
  info: "bg-blue-100 text-blue-600 border-blue-400/30",
  success: "bg-teal-100 text-teal-700 border-teal-500/25",
  warning: "bg-yellow-100 text-ink border-yellow-500/40",
  danger: "bg-danger-100 text-danger-600 border-danger-500/30",
};

interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  tone?: Tone;
  title?: string;
}

export function Alert({ tone = "info", title, className, children, ...props }: AlertProps) {
  return (
    <div
      role={tone === "danger" || tone === "warning" ? "alert" : "status"}
      className={cn("rounded-lg border px-4 py-3 text-sm", toneClasses[tone], className)}
      {...props}
    >
      {title && <p className="font-semibold">{title}</p>}
      <div className={title ? "mt-1" : undefined}>{children}</div>
    </div>
  );
}
