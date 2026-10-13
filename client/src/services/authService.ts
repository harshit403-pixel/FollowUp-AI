import { api } from "@/lib/api";
import type { User } from "@/types";

export const login = (email: string, password: string) =>
  api<{ token: string; user: User }>("/auth/login", { method: "POST", body: { email, password } });

export const me = () => api<{ user: User }>("/auth/me");
