import { MessageCircle } from "lucide-react";
import { NodeCard } from "./NodeCard";

interface TelegramNodeData {
  label?: string;
  config?: {
    chat_id?: string;
    message?: string;
  };
  credential_id?: string;
}

export function TelegramNode({ data, id }: { data: TelegramNodeData; id: string }) {
  const message = data.config?.message;
  const messagePreview = message ? message.slice(0, 28) + (message.length > 28 ? "…" : "") : "";

  return (
    <NodeCard id={id}>
      <NodeCard.Header
        icon={<MessageCircle className="h-3.5 w-3.5" strokeWidth={1.5} />}
        title={data.label || "Telegram"}
        kind="send · telegram"
      />
      <NodeCard.Meta
        entries={[
          { label: "chat", value: data.config?.chat_id },
          { label: "msg", value: messagePreview },
        ]}
      />
      <NodeCard.Handles />
    </NodeCard>
  );
}
