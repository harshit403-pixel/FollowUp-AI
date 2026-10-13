"use client";

import { Activity } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ErrorBanner } from "@/components/ui/Feedback";
import { Field, Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/auth";

export default function LoginPage() {
  const { user, ready, signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (ready && user) router.replace("/dashboard");
  }, [ready, user, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center justify-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-700 text-white">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xl font-semibold text-ink-950">FollowUp AI</span>
        </div>
        <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-ink-200 bg-white p-6 shadow-card">
          <h1 className="text-lg font-semibold text-ink-950">Staff sign in</h1>
          {error && <ErrorBanner message={error} />}
          <Field label="Email">
            {(id) => (
              <Input id={id} type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            )}
          </Field>
          <Field label="Password">
            {(id) => (
              <Input id={id} type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            )}
          </Field>
          <Button type="submit" loading={busy} className="w-full">
            Sign in
          </Button>
        </form>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <Badge tone="amber">Demo only</Badge>
          <p className="mt-2">
            Synthetic data. Try <code>coordinator@demo.test</code> (can approve plans) or{" "}
            <code>staff@demo.test</code> with the demo password from the README.
          </p>
        </div>
      </div>
    </main>
  );
}
