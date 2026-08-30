import { type InputHTMLAttributes, type LabelHTMLAttributes, type SelectHTMLAttributes, forwardRef } from "react";
import { cn } from "../../lib/cn";

export function Label({ className, ...props }: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("mb-1.5 block text-sm font-medium text-ink", className)} {...props} />;
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          "w-full rounded-md border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink",
          "placeholder:text-ink-faint",
          "focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20",
          "disabled:cursor-not-allowed disabled:bg-paper-dim disabled:opacity-70",
          className,
        )}
        {...props}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select
        ref={ref}
        className={cn(
          "w-full rounded-md border border-ink/15 bg-surface px-3 py-2.5 text-sm text-ink",
          "focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20",
          className,
        )}
        {...props}
      >
        {children}
      </select>
    );
  },
);

export function FieldError({ children }: { children?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-sm text-danger-500">
      {children}
    </p>
  );
}

export function FieldHint({ children }: { children?: string }) {
  if (!children) return null;
  return <p className="mt-1.5 text-sm text-ink-muted">{children}</p>;
}
