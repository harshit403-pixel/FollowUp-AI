import { api } from "@/lib/api";
import type { CalendarData, DashboardData, Task, TaskPatch, TaskStatus } from "@/types";

export const listTasks = (filters: { status?: TaskStatus; q?: string; patientId?: string; planId?: string }) =>
  api<{ tasks: Task[] }>("/follow-up-tasks", { query: filters }).then((r) => r.tasks);

export const updateTask = (id: string, patch: TaskPatch) =>
  api<Task>(`/follow-up-tasks/${id}`, { method: "PATCH", body: patch });

export const getCalendar = (month: string) => api<CalendarData>("/calendar", { query: { month } });

export const getDashboard = () => api<DashboardData>("/dashboard");
