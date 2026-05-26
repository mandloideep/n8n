import { z } from "zod";

// ---------- API response schemas ----------

export const AuthUserSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  name: z.string().nullish(),
});

export const AuthResponseSchema = z.object({
  user: AuthUserSchema,
});

const PlatformSchema = z.enum(["telegram", "email", "slack", "trigger"]);

const NodeSchema = z.object({
  id: z.string(),
  platform: PlatformSchema,
  name: z.string(),
  data: z.record(z.unknown()),
  credential_id: z.string().nullish(),
  position: z.object({ x: z.number(), y: z.number() }).nullish(),
  type: z.string().nullish(),
});

const ConnectionSchema = z.object({
  source: z.string(),
  target: z.string(),
});

export const WorkflowSchema = z.object({
  id: z.number(),
  title: z.string(),
  enabled: z.boolean(),
  nodes: z.array(NodeSchema).nullable(),
  connections: z.array(ConnectionSchema).nullable(),
  user_id: z.number(),
  webhook_path: z.string().nullish(),
  created_at: z.string().nullish(),
  updated_at: z.string().nullish(),
  last_executed_at: z.string().nullish(),
});

export const CredentialSchema = z.object({
  id: z.number(),
  title: z.string(),
  platform: PlatformSchema,
  data: z.record(z.unknown()),
  user_id: z.number(),
  created_at: z.string().nullish(),
});

const ExecutedNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["success", "skipped", "error"]),
  error: z.string().optional(),
});

export const ExecutionResultSchema = z.object({
  workflow_id: z.number(),
  webhook_path: z.string().optional(),
  status: z.enum(["success", "failed"]),
  test_mode: z.boolean(),
  execution_time_ms: z.number(),
  result: z
    .object({
      status: z.string(),
      executed_nodes: z.array(ExecutedNodeSchema),
      context: z.record(z.unknown()),
    })
    .optional(),
  error: z.string().optional(),
});

export const paginated = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.number(),
    limit: z.number(),
    offset: z.number(),
  });

export const DeleteResponseSchema = z.object({
  message: z.string(),
});

// ---------- Form-input schemas ----------

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
