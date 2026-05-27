import { useState, useEffect } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { getCredentialsByPlatform } from "@/services/credential.service";
import { Credential, PlatformType } from "@/types/workflow";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Webhook, MessageCircle, Mail, Hash } from "lucide-react";

interface NodeData {
  label: string;
  platform: PlatformType;
  config: Record<string, any>;
  credential_id: string | null;
}

const platformLabel: Record<PlatformType, string> = {
  trigger: "Webhook trigger",
  telegram: "Telegram message",
  email: "Email message",
  slack: "Slack message",
};

function PlatformIcon({ platform }: { platform: PlatformType }) {
  const props = { className: "h-3.5 w-3.5", strokeWidth: 1.5 } as const;
  switch (platform) {
    case "trigger":
      return <Webhook {...props} />;
    case "telegram":
      return <MessageCircle {...props} />;
    case "email":
      return <Mail {...props} />;
    case "slack":
      return <Hash {...props} />;
    default:
      return null;
  }
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}

export function NodeConfigPanel() {
  const { nodes, selectedNodeId, updateNodeData, selectNode } = useWorkflowStore();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loadingCredentials, setLoadingCredentials] = useState(false);

  const selectedNode = nodes.find((n) => n.id === selectedNodeId);
  const nodeData = selectedNode?.data as NodeData | undefined;

  useEffect(() => {
    if (nodeData?.platform && nodeData.platform !== "trigger") {
      setLoadingCredentials(true);
      getCredentialsByPlatform(nodeData.platform)
        .then(setCredentials)
        .catch(() => setCredentials([]))
        .finally(() => setLoadingCredentials(false));
    }
  }, [nodeData?.platform]);

  if (!selectedNode || !nodeData) {
    return null;
  }

  const updateConfig = (key: string, value: any) => {
    updateNodeData(selectedNode.id, {
      config: { ...nodeData.config, [key]: value },
    });
  };

  const updateLabel = (label: string) => {
    updateNodeData(selectedNode.id, { label });
  };

  const updateCredential = (credentialId: string) => {
    updateNodeData(selectedNode.id, { credential_id: credentialId });
  };

  const inputClass = "h-10 bg-card border-border";

  return (
    <div className="flex h-full flex-col bg-card">
      <div className="flex items-start justify-between border-b border-border px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded border border-border bg-background text-foreground/80">
            <PlatformIcon platform={nodeData.platform} />
          </div>
          <div>
            <p className="text-sm font-medium leading-tight">{platformLabel[nodeData.platform]}</p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              node config
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => selectNode(null)}
          className="h-7 w-7 text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.5} />
        </Button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-5 py-6">
        <Field label="Name" htmlFor="label">
          <Input
            id="label"
            value={nodeData.label || ""}
            onChange={(e) => updateLabel(e.target.value)}
            placeholder="Untitled node"
            className={inputClass}
          />
        </Field>

        {nodeData.platform !== "trigger" && (
          <Field label="Credential">
            <Select value={nodeData.credential_id || ""} onValueChange={updateCredential}>
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder={loadingCredentials ? "Loading…" : "Choose credential"} />
              </SelectTrigger>
              <SelectContent>
                {credentials.map((cred) => (
                  <SelectItem key={cred.id} value={String(cred.id)}>
                    {cred.title}
                  </SelectItem>
                ))}
                {credentials.length === 0 && !loadingCredentials && (
                  <SelectItem value="__none__" disabled>
                    No credentials yet
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </Field>
        )}

        {nodeData.platform === "trigger" && (
          <p className="border-l-2 border-border pl-3 text-xs text-muted-foreground">
            This webhook fires the workflow when it receives an HTTP request. Copy the URL from the
            header once saved.
          </p>
        )}

        {nodeData.platform === "telegram" && (
          <>
            <Field label="Chat ID">
              <Input
                value={nodeData.config?.chat_id || ""}
                onChange={(e) => updateConfig("chat_id", e.target.value)}
                placeholder="e.g. 1234567890"
                className={`${inputClass} font-mono text-sm`}
              />
            </Field>
            <Field label="Message">
              <Textarea
                value={nodeData.config?.message || ""}
                onChange={(e) => updateConfig("message", e.target.value)}
                placeholder="What should the bot say?"
                className="min-h-[120px] bg-card border-border"
              />
            </Field>
          </>
        )}

        {nodeData.platform === "email" && (
          <>
            <Field label="To">
              <Input
                value={nodeData.config?.to_email || ""}
                onChange={(e) => updateConfig("to_email", e.target.value)}
                placeholder="recipient@example.com"
                className={`${inputClass} font-mono text-sm`}
              />
            </Field>
            <Field label="Subject">
              <Input
                value={nodeData.config?.subject || ""}
                onChange={(e) => updateConfig("subject", e.target.value)}
                placeholder="Subject line"
                className={inputClass}
              />
            </Field>
            <Field label="Body">
              <Textarea
                value={nodeData.config?.body || ""}
                onChange={(e) => updateConfig("body", e.target.value)}
                placeholder="Write the email body…"
                className="min-h-[140px] bg-card border-border"
              />
            </Field>
          </>
        )}

        {nodeData.platform === "slack" && (
          <>
            <Field label="Channel">
              <Input
                value={nodeData.config?.channel || ""}
                onChange={(e) => updateConfig("channel", e.target.value)}
                placeholder="#general"
                className={`${inputClass} font-mono text-sm`}
              />
            </Field>
            <Field label="Message">
              <Textarea
                value={nodeData.config?.message || ""}
                onChange={(e) => updateConfig("message", e.target.value)}
                placeholder="What should Slack say?"
                className="min-h-[120px] bg-card border-border"
              />
            </Field>
          </>
        )}
      </div>
    </div>
  );
}
