import { cn } from "@/lib/cn";

export function ProgressBar({
  completed,
  total,
  className,
}: {
  completed: number;
  total: number;
  className?: string;
}) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-medium text-ink-800">
          {completed} of {total} task{total === 1 ? "" : "s"} completed
        </span>
        <span className="text-ink-500">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={completed}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label="Follow-up progress"
        className="h-2 overflow-hidden rounded-full bg-ink-100"
      >
        <div
          className={cn("h-full rounded-full transition-all", pct === 100 ? "bg-emerald-500" : "bg-teal-600")}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
