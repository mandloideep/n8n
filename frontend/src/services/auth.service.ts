import { apiCaller } from "./api-caller";

export interface AuthUser {
  id: number;
  email: string;
  name?: string;
}

export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  const res = await apiCaller.post("/auth/signin", { email, password });
  if (res.status !== 200) {
    throw new Error(res.data?.detail || "Sign in failed");
  }
  return res.data.user as AuthUser;
};

export const signUp = async (email: string, password: string, name?: string): Promise<AuthUser> => {
  const res = await apiCaller.post("/auth/signup", { email, password, name });
  if (res.status !== 200) {
    throw new Error(res.data?.detail || "Sign up failed");
  }
  return res.data.user as AuthUser;
};

export const signOut = async (): Promise<void> => {
  await apiCaller.post("/auth/signout");
};

export const getMe = async (): Promise<AuthUser | null> => {
  const res = await apiCaller.get("/auth/me");
  if (res.status !== 200) {
    return null;
  }
  return res.data.user as AuthUser;
};
