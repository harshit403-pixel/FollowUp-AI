import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "./Button";

export function ErrorBanner({
  message,
  onRetry,
  onDismiss,
}: {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p className="flex-1">{message}</p>
      {onRetry && (
        <Button size="sm" variant="secondary" onClick={onRetry}>
          Retry
        </Button>
      )}
      {onDismiss && (
        <Button size="sm" variant="ghost" onClick={onDismiss}>
          Dismiss
        </Button>
      )}
    </div>
  );
}

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      <div className="mb-3 rounded-full bg-ink-100 p-3 text-ink-400">
        <Inbox className="h-5 w-5" aria-hidden />
      </div>
      <p className="text-sm font-medium text-ink-800">{title}</p>
      {hint && <p className="mt-1 max-w-sm text-sm text-ink-500">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
