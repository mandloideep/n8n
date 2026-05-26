import axios, { type AxiosRequestConfig, type AxiosError } from "axios";
import { z, ZodError } from "zod";

import { toast } from "sonner";

// Same-origin requests in both dev (Vite proxy) and prod (frontend served by FastAPI),
// so no absolute base URL is needed. Cookies are sent automatically.
export const apiCaller = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  // Default validateStatus (>=200 && <300) so the error interceptor sees 401s
  // and can drive the silent-refresh + redirect flow.
});

// Thrown when the API returns a non-2xx response. Carries the parsed `detail`
// so callers can surface a meaningful message without re-deriving it.
export class RequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "RequestError";
  }
}

let isHandling401 = false;
let refreshPromise: Promise<unknown> | null = null;

export const resetAuthGuard = (): void => {
  isHandling401 = false;
};

type RetryableConfig = AxiosRequestConfig & { _retry?: boolean };

apiCaller.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;
    const status = error.response?.status;
    const url = original?.url ?? "";
    // Auth-flow calls drive their own UX — skip the silent-refresh and the
    // session-expired redirect so wrong-password on signin doesn't loop.
    const isAuthCall =
      url.includes("/auth/signin") ||
      url.includes("/auth/signup") ||
      url.includes("/auth/refresh");

    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = apiCaller
          .post("/auth/refresh", {})
          .finally(() => {
            refreshPromise = null;
          });
      }
      try {
        await refreshPromise;
        return apiCaller.request(original);
      } catch {
        // Refresh failed — fall through to the redirect path below.
      }
    }

    if (status === 401 && !isAuthCall && !isHandling401) {
      isHandling401 = true;
      toast.warning("Session expired — please sign in again.");
      queueMicrotask(() => {
        if (!window.location.pathname.includes("/auth")) {
          window.location.assign("/auth");
        }
      });
    }

    return Promise.reject(error);
  },
);

// Typed axios wrapper that validates the response with a Zod schema.
// Throws RequestError on HTTP non-2xx, ZodError on shape mismatch.
export async function request<T>(
  schema: z.ZodType<T>,
  config: AxiosRequestConfig,
): Promise<T> {
  try {
    const res = await apiCaller.request<unknown>(config);
    const parsed = schema.safeParse(res.data);
    if (!parsed.success) throw parsed.error;
    return parsed.data;
  } catch (err) {
    if (err instanceof ZodError) throw err;
    if (axios.isAxiosError(err) && err.response) {
      const detail = (err.response.data as { detail?: string } | null)?.detail;
      throw new RequestError(
        detail ?? `Request failed (${err.response.status})`,
        err.response.status,
        err.response.data,
      );
    }
    throw err;
  }
}

// Toast helper that distinguishes server-shape drift (ZodError) from regular
// errors. Use everywhere a service call's failure should reach the user.
export function toastError(err: unknown, fallback: string): void {
  if (err instanceof ZodError) {
    toast.error("Server returned unexpected data — please refresh.");
    return;
  }
  if (err instanceof Error && err.message) {
    toast.error(err.message);
    return;
  }
  toast.error(fallback);
}
