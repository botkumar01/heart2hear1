import { useEffect, useRef, type ReactNode } from "react";
import { cn } from "../../lib/cn";

export function Modal({
  open,
  onClose,
  title,
  children,
  className,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={onClose}
      className={cn(
        "w-full max-w-md rounded-xl border border-ink/8 bg-surface p-6 shadow-[var(--shadow-soft-lg)] backdrop:bg-ink/40",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink">{title}</h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="text-ink-muted hover:text-ink"
        >
          &times;
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </dialog>
  );
}
