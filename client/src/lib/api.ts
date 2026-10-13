const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const TOKEN_KEY = "followup.token";

// sessionStorage keeps the demo token per tab. A production build should prefer an httpOnly cookie.
export const tokenStore = {
  get(): string | null {
    try {
      return sessionStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string) {
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* storage unavailable: the session lasts until reload */
    }
  },
  clear() {
    try {
      sessionStorage.removeItem(TOKEN_KEY);
    } catch {
      /* ignore */
    }
  },
};

export const UNAUTHORIZED_EVENT = "followup:unauthorized";

export class ApiRequestError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

interface Options {
  method?: "GET" | "POST" | "PUT" | "PATCH";
  body?: unknown;
  /** Query-string params; undefined and empty values are skipped. */
  query?: Record<string, string | undefined>;
}

export async function api<T>(path: string, { method = "GET", body, query }: Options = {}): Promise<T> {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v) qs.set(k, v);
  const url = `${BASE}${path}${qs.size ? `?${qs}` : ""}`;

  const token = tokenStore.get();
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiRequestError(0, "Cannot reach the server. Check that the API is running.");
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    if (res.status === 401 && path !== "/auth/login") {
      tokenStore.clear();
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    const first = Array.isArray(data?.details) ? data.details[0]?.message : undefined;
    throw new ApiRequestError(res.status, [data?.error ?? "Request failed", first].filter(Boolean).join(": "));
  }
  return data as T;
}
