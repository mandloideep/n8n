import { z } from "zod";

export const SigninSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const SignupSchema = SigninSchema.extend({
  name: z.string().min(1, "Name is required").max(80).optional().or(z.literal("")),
});

const telegramData = z.object({
  access_token: z.string().min(20, "Telegram bot token looks too short"),
});

const emailData = z.object({
  from_email: z.string().email("Invalid email address"),
  app_password: z.string().min(8, "Gmail app password must be at least 8 characters"),
});

const slackData = z.object({
  webhook_url: z.string().url("Invalid Slack webhook URL"),
});

export const CredentialFormSchema = z.discriminatedUnion("platform", [
  z.object({
    title: z.string().min(1, "Credential name is required").max(80),
    platform: z.literal("telegram"),
    data: telegramData,
  }),
  z.object({
    title: z.string().min(1, "Credential name is required").max(80),
    platform: z.literal("email"),
    data: emailData,
  }),
  z.object({
    title: z.string().min(1, "Credential name is required").max(80),
    platform: z.literal("slack"),
    data: slackData,
  }),
]);

export type SigninInput = z.infer<typeof SigninSchema>;
export type SignupInput = z.infer<typeof SignupSchema>;
export type CredentialFormInput = z.infer<typeof CredentialFormSchema>;
