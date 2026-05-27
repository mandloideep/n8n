import { Mail } from "lucide-react";
import { NodeCard } from "./NodeCard";

interface GmailNodeData {
  label?: string;
  config?: {
    to_email?: string;
    subject?: string;
    body?: string;
  };
  credential_id?: string;
}

export function GmailNode({ data, id }: { data: GmailNodeData; id: string }) {
  return (
    <NodeCard id={id}>
      <NodeCard.Header
        icon={<Mail className="h-3.5 w-3.5" strokeWidth={1.5} />}
        title={data.label || "Email"}
        kind="send · email"
      />
      <NodeCard.Meta
        entries={[
          { label: "to", value: data.config?.to_email },
          { label: "subj", value: data.config?.subject },
        ]}
      />
      <NodeCard.Handles />
    </NodeCard>
  );
}
