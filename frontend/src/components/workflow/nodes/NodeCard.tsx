import { createContext, useContext, type ReactNode } from "react";
import { Handle, Position } from "reactflow";
import { useWorkflowStore } from "@/store/workflowStore";
import { cn } from "@/lib/utils";

type NodeCardContextValue = {
  selected: boolean;
};

const NodeCardContext = createContext<NodeCardContextValue | null>(null);

function useNodeCard() {
  const ctx = useContext(NodeCardContext);
  if (!ctx) throw new Error("NodeCard.* must be rendered inside <NodeCard>");
  return ctx;
}

type RootProps = {
  id: string;
  children: ReactNode;
};

function NodeCardRoot({ id, children }: RootProps) {
  const { selectedNodeId } = useWorkflowStore();
  const selected = selectedNodeId === id;

  return (
    <NodeCardContext.Provider value={{ selected }}>
      <div
        className={cn(
          "min-w-[220px] rounded-md border bg-card px-4 py-3 transition-colors",
          selected
            ? "border-foreground shadow-[0_1px_0_0_hsl(var(--foreground)/0.04)]"
            : "border-border hover:border-foreground/40",
        )}
      >
        {children}
      </div>
    </NodeCardContext.Provider>
  );
}

type HeaderProps = {
  icon: ReactNode;
  title: string;
  kind: string;
};

function NodeCardHeader({ icon, title, kind }: HeaderProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded border border-border bg-background text-foreground/80">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium leading-tight text-foreground">{title}</p>
        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {kind}
        </p>
      </div>
    </div>
  );
}

type MetaProps = {
  entries: Array<{ label: string; value?: string }>;
  emptyHint?: string;
};

function NodeCardMeta({ entries, emptyHint = "click to configure" }: MetaProps) {
  const present = entries.filter((e) => e.value && e.value.length > 0);

  return (
    <div className="mt-3 border-t border-border/70 pt-3 space-y-1">
      {present.length === 0 ? (
        <p className="font-display text-xs italic text-muted-foreground">{emptyHint}</p>
      ) : (
        present.map((entry) => (
          <div key={entry.label} className="flex items-baseline gap-2 text-[11px]">
            <span className="shrink-0 uppercase tracking-[0.12em] text-muted-foreground">
              {entry.label}
            </span>
            <span className="truncate font-mono text-foreground/80">{entry.value}</span>
          </div>
        ))
      )}
    </div>
  );
}

type HandlesProps = {
  source?: boolean;
  target?: boolean;
};

function NodeCardHandles({ source = true, target = true }: HandlesProps) {
  const { selected } = useNodeCard();
  const handleClass = cn(
    "!h-2 !w-2 !rounded-full !border-0 transition-colors",
    selected ? "!bg-foreground" : "!bg-foreground/40",
  );

  return (
    <>
      {target && <Handle type="target" position={Position.Left} className={handleClass} />}
      {source && <Handle type="source" position={Position.Right} className={handleClass} />}
    </>
  );
}

export const NodeCard = Object.assign(NodeCardRoot, {
  Header: NodeCardHeader,
  Meta: NodeCardMeta,
  Handles: NodeCardHandles,
});
