import { cn } from "@/lib/cn";
import { STATUS_STYLES } from "@/lib/status";
import type { TaskStatus } from "@/types";

export function StatusBadge({ status }: { status: TaskStatus }) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        s.badge,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", s.dot)} aria-hidden />
      {status}
    </span>
  );
}

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: "neutral" | "teal" | "amber" | "violet" | "rose";
  children: React.ReactNode;
}) {
  const tones = {
    neutral: "bg-ink-100 text-ink-700 ring-ink-200",
    teal: "bg-teal-50 text-teal-800 ring-teal-200",
    amber: "bg-amber-50 text-amber-800 ring-amber-200",
    violet: "bg-violet-50 text-violet-800 ring-violet-200",
    rose: "bg-rose-50 text-rose-800 ring-rose-200",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}
