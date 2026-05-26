import axios from "axios";

import { toast } from "sonner";

// Same-origin requests in both dev (Vite proxy) and prod (frontend served by FastAPI),
// so no absolute base URL is needed. Cookies are sent automatically.
export const apiCaller = axios.create({
  baseURL: "",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: (status) => status >= 200 && status < 500,
});

apiCaller.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!window.location.pathname.includes("/auth")) {
        toast.warning("Session expired — please sign in again.");
        window.location.href = "/auth";
      }
    }
    return Promise.reject(error);
  },
);
