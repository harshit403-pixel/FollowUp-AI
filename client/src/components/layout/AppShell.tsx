"use client";

import { Activity, CalendarDays, LayoutDashboard, LogOut, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/StatusBadge";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/cn";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/patients", label: "Patients", icon: Users },
];

function NavLinks({ orientation }: { orientation: "vertical" | "horizontal" }) {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Main"
      className={cn(orientation === "vertical" ? "flex flex-col gap-1" : "flex gap-1 overflow-x-auto")}
    >
      {NAV.map(({ href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active ? "bg-teal-50 text-teal-800" : "text-ink-600 hover:bg-ink-100 hover:text-ink-900",
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, signOut } = useAuth();
  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="hidden border-r border-ink-200 bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2 px-5 py-5">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-teal-700 text-white">
            <Activity className="h-4 w-4" aria-hidden />
          </span>
          <span className="text-base font-semibold text-ink-950">FollowUp AI</span>
        </div>
        <div className="px-3">
          <NavLinks orientation="vertical" />
        </div>
        <p className="mt-auto px-5 py-4 text-xs text-ink-400">
          Synthetic demo data only. Not for clinical use.
        </p>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 border-b border-ink-200 bg-white/95 backdrop-blur">
          <div className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-2 lg:hidden">
              <span className="grid h-7 w-7 place-items-center rounded-md bg-teal-700 text-white">
                <Activity className="h-4 w-4" aria-hidden />
              </span>
              <span className="text-sm font-semibold text-ink-950">FollowUp AI</span>
            </div>
            <div className="ml-auto flex items-center gap-3">
              {user && (
                <div className="text-right">
                  <p className="text-sm font-medium leading-tight text-ink-900">{user.name}</p>
                  <p className="text-xs capitalize leading-tight text-ink-500">{user.role}</p>
                </div>
              )}
              {user?.email?.endsWith("@demo.test") && <Badge tone="amber">Demo account</Badge>}
              <button
                type="button"
                onClick={signOut}
                className="inline-flex items-center gap-2 rounded-lg border border-ink-200 px-3 py-1.5 text-sm text-ink-700 hover:bg-ink-50"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline">Sign out</span>
                <span className="sr-only sm:hidden">Sign out</span>
              </button>
            </div>
          </div>
          <div className="border-t border-ink-100 px-3 py-2 lg:hidden">
            <NavLinks orientation="horizontal" />
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
