import { cn } from "@/lib/cn";

export function StatCard({
  label,
  value,
  accent,
  onSelect,
  hint,
}: {
  label: string;
  value: number;
  accent: string; // tailwind text color class for the number
  onSelect?: () => void;
  hint?: string;
}) {
  const body = (
    <>
      <p className="text-sm font-medium text-ink-600">{label}</p>
      <p className={cn("mt-1 text-3xl font-semibold tabular-nums", accent)}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </>
  );
  const base = "rounded-xl border border-ink-200 bg-white p-4 text-left shadow-card";
  return onSelect ? (
    <button type="button" onClick={onSelect} className={cn(base, "transition-colors hover:border-teal-300")}>
      {body}
    </button>
  ) : (
    <div className={base}>{body}</div>
  );
}
