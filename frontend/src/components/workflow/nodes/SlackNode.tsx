import { Hash } from "lucide-react";
import { NodeCard } from "./NodeCard";

interface SlackNodeData {
  label?: string;
  config?: {
    channel?: string;
    message?: string;
  };
  credential_id?: string;
}

export function SlackNode({ data, id }: { data: SlackNodeData; id: string }) {
  const message = data.config?.message;
  const messagePreview = message ? message.slice(0, 28) + (message.length > 28 ? "…" : "") : "";

  return (
    <NodeCard id={id}>
      <NodeCard.Header
        icon={<Hash className="h-3.5 w-3.5" strokeWidth={1.5} />}
        title={data.label || "Slack"}
        kind="send · slack"
      />
      <NodeCard.Meta
        entries={[
          { label: "ch", value: data.config?.channel },
          { label: "msg", value: messagePreview },
        ]}
      />
      <NodeCard.Handles />
    </NodeCard>
  );
}
