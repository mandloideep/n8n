import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCredential } from "@/services/credential.service";
import { toastError } from "@/services/api-caller";
import { PlatformType } from "@/types/workflow";
import { CredentialFormSchema } from "@/lib/schemas";
import { toast } from "sonner";

const platformConfigs: Record<
  PlatformType,
  {
    label: string;
    fields: { key: string; label: string; type: string; placeholder: string }[];
  }
> = {
  telegram: {
    label: "Telegram",
    fields: [
      {
        key: "access_token",
        label: "Bot access token",
        type: "password",
        placeholder: "Telegram bot token",
      },
    ],
  },
  email: {
    label: "Email (Gmail)",
    fields: [
      { key: "from_email", label: "From email", type: "email", placeholder: "you@example.com" },
      {
        key: "app_password",
        label: "App password",
        type: "password",
        placeholder: "Gmail app password",
      },
    ],
  },
  slack: {
    label: "Slack",
    fields: [
      {
        key: "webhook_url",
        label: "Webhook URL",
        type: "url",
        placeholder: "https://hooks.slack.com/...",
      },
    ],
  },
  trigger: {
    label: "Trigger",
    fields: [],
  },
};

export function CredentialForm() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [platform, setPlatform] = useState<PlatformType | "">("");
  const [data, setData] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = CredentialFormSchema.safeParse({ title, platform, data });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "Invalid credential form");
      return;
    }

    setIsLoading(true);

    try {
      await createCredential(parsed.data);
      toast.success("Credential created");
      navigate("/credentials");
    } catch (error: unknown) {
      toastError(error, "Failed to create credential");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (key: string, value: string) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const selectedConfig = platform ? platformConfigs[platform] : null;

  return (
    <div className="mx-auto w-full max-w-xl px-8 py-16">
      <Button
        variant="ghost"
        onClick={() => navigate("/credentials")}
        className="mb-10 -ml-2 h-auto px-2 py-1 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
      >
        <ArrowLeft className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
        Back to credentials
      </Button>

      <div className="mb-10">
        <h1 className="font-display text-4xl italic leading-tight">New credential.</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Stored encrypted. Used only when a workflow asks for it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-1.5">
          <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">
            Name
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. My Telegram bot"
            className="h-11 bg-card border-border"
            autoComplete="off"
            required
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Platform</Label>
          <Select value={platform} onValueChange={(v) => setPlatform(v as PlatformType)}>
            <SelectTrigger className="h-11 bg-card border-border">
              <SelectValue placeholder="Choose one" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(platformConfigs)
                .filter(([key]) => key !== "trigger")
                .map(([key, config]) => (
                  <SelectItem key={key} value={key}>
                    {config.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        {selectedConfig && selectedConfig.fields.length > 0 && (
          <div className="space-y-5 border-t border-border pt-6">
            {selectedConfig.fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label
                  htmlFor={field.key}
                  className="text-xs uppercase tracking-wider text-muted-foreground"
                >
                  {field.label}
                </Label>
                <Input
                  id={field.key}
                  type={field.type}
                  value={data[field.key] || ""}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  className="h-11 bg-card border-border font-mono text-sm"
                  autoComplete={field.type === "password" ? "new-password" : "off"}
                />
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="submit"
            disabled={isLoading}
            className="h-11 bg-foreground px-6 text-background hover:bg-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating
              </>
            ) : (
              "Create credential"
            )}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate("/credentials")}
            className="h-11 text-sm text-muted-foreground hover:bg-transparent hover:text-foreground"
          >
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CredentialForm;
