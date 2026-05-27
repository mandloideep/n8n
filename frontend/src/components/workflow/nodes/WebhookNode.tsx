import { Webhook } from "lucide-react";
import { NodeCard } from "./NodeCard";

interface WebhookNodeData {
  label?: string;
}

export function WebhookNode({ data, id }: { data: WebhookNodeData; id: string }) {
  return (
    <NodeCard id={id}>
      <NodeCard.Header
        icon={<Webhook className="h-3.5 w-3.5" strokeWidth={1.5} />}
        title={data.label || "Webhook trigger"}
        kind="trigger"
      />
      <NodeCard.Meta entries={[{ label: "on", value: "http request" }]} emptyHint="fires on http" />
      <NodeCard.Handles source target={false} />
    </NodeCard>
  );
}
