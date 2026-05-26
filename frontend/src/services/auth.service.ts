import { request, resetAuthGuard } from "./api-caller";
import { AuthResponseSchema, AuthUserSchema } from "@/lib/schemas";
import { z } from "zod";

export type AuthUser = z.infer<typeof AuthUserSchema>;

export const signIn = async (email: string, password: string): Promise<AuthUser> => {
  const { user } = await request(AuthResponseSchema, {
    method: "POST",
    url: "/auth/signin",
    data: { email, password },
  });
  resetAuthGuard();
  return user;
};

export const signUp = async (email: string, password: string, name?: string): Promise<AuthUser> => {
  const { user } = await request(AuthResponseSchema, {
    method: "POST",
    url: "/auth/signup",
    data: { email, password, name },
  });
  resetAuthGuard();
  return user;
};

export const signOut = async (): Promise<void> => {
  await request(z.object({ message: z.string() }), {
    method: "POST",
    url: "/auth/signout",
  });
};

export const getMe = async (): Promise<AuthUser | null> => {
  try {
    const { user } = await request(AuthResponseSchema, {
      method: "GET",
      url: "/auth/me",
    });
    return user;
  } catch {
    return null;
  }
};
