import { Handle, Position } from "reactflow";
import { MessageCircle } from "lucide-react";
import { useWorkflowStore } from "@/store/workflowStore";

interface TelegramNodeData {
  label?: string;
  config?: {
    chat_id?: string;
    message?: string;
  };
  credential_id?: string;
}

export function TelegramNode({ data, id }: { data: TelegramNodeData; id: string }) {
  const { selectedNodeId } = useWorkflowStore();
  const isSelected = selectedNodeId === id;

  return (
    <div
      className={`
      bg-card border-2 rounded-xl p-4 min-w-[200px] shadow-lg
      transition-all duration-200
      ${
        isSelected
          ? "border-blue-400 ring-2 ring-blue-400/20 shadow-blue-400/20"
          : "border-blue-400/50 hover:border-blue-400/80"
      }
    `}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 bg-gradient-to-br from-blue-400 to-blue-500 rounded-lg flex items-center justify-center shadow-md">
          <MessageCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-semibold text-card-foreground text-sm">
            {data.label || "Telegram"}
          </span>
          <p className="text-xs text-muted-foreground">Send message</p>
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        {data.config?.chat_id && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="opacity-60">Chat ID:</span>
            <span className="text-foreground/80">{data.config.chat_id}</span>
          </div>
        )}
        {data.config?.message && (
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="opacity-60">Message:</span>
            <span className="text-foreground/80 truncate max-w-[120px]">
              {data.config.message.substring(0, 20)}...
            </span>
          </div>
        )}
        {!data.config?.chat_id && !data.config?.message && (
          <p className="text-muted-foreground/60 italic">Click to configure</p>
        )}
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-background"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-blue-400 !border-2 !border-background"
      />
    </div>
  );
}
