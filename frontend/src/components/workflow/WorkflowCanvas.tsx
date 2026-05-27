import { useCallback, useEffect } from "react";
import ReactFlow, {
  Node,
  Connection,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  Panel,
  MiniMap,
} from "reactflow";
import "reactflow/dist/style.css";

import { WebhookNode } from "./nodes/WebhookNode";
import { TelegramNode } from "./nodes/TelegramNode";
import { GmailNode } from "./nodes/GmailNode";
import { SlackNode } from "./nodes/SlackNode";
import { Webhook, MessageCircle, Mail, Hash, Plus } from "lucide-react";
import { useWorkflowStore } from "@/store/workflowStore";
import { PlatformType } from "@/types/workflow";
import { cn } from "@/lib/utils";

const nodeTypes = {
  webhook: WebhookNode,
  telegram: TelegramNode,
  gmail: GmailNode,
  slack: SlackNode,
};

const toolbarItems: Array<{
  type: PlatformType;
  icon: typeof Webhook;
  label: string;
}> = [
  { type: "trigger", icon: Webhook, label: "Trigger" },
  { type: "telegram", icon: MessageCircle, label: "Telegram" },
  { type: "email", icon: Mail, label: "Email" },
  { type: "slack", icon: Hash, label: "Slack" },
];

export function WorkflowCanvas() {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    setNodes: setStoreNodes,
    setEdges: setStoreEdges,
    addNode,
    selectNode,
    selectedNodeId,
  } = useWorkflowStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(storeNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(storeEdges);

  useEffect(() => {
    setNodes(storeNodes);
  }, [storeNodes, setNodes]);

  useEffect(() => {
    setEdges(storeEdges);
  }, [storeEdges, setEdges]);

  useEffect(() => {
    setStoreNodes(nodes);
  }, [nodes, setStoreNodes]);

  useEffect(() => {
    setStoreEdges(edges);
  }, [edges, setStoreEdges]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: false,
            style: { stroke: "hsl(var(--foreground) / 0.5)", strokeWidth: 1.25 },
          },
          eds,
        ),
      );
    },
    [setEdges],
  );

  const handleAddNode = (type: PlatformType) => {
    addNode(type);
  };

  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      selectNode(node.id);
    },
    [selectNode],
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  return (
    <div className="h-full w-full bg-canvas-background">
      <ReactFlow
        nodes={nodes.map((node) => ({
          ...node,
          selected: node.id === selectedNodeId,
        }))}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        className="bg-canvas-background"
        defaultEdgeOptions={{
          animated: false,
          style: { stroke: "hsl(var(--foreground) / 0.5)", strokeWidth: 1.25 },
        }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="hsl(var(--canvas-grid))"
        />
        <Controls
          showInteractive={false}
          className="!rounded-md !border !border-border !bg-card !shadow-none [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground/70 hover:[&>button]:!text-foreground"
        />
        <MiniMap
          pannable
          zoomable
          className="!rounded-md !border !border-border !bg-card"
          maskColor="hsl(var(--background) / 0.6)"
          nodeColor="hsl(var(--foreground) / 0.4)"
          nodeStrokeWidth={0}
        />

        <Panel position="top-left" className="!m-4">
          <div className="flex items-center gap-1 rounded-md border border-border bg-card p-1 shadow-[0_1px_0_0_hsl(var(--foreground)/0.04)]">
            <span className="px-2 font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              add
            </span>
            <span aria-hidden className="h-4 w-px bg-border" />
            {toolbarItems.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => handleAddNode(item.type)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium",
                  "text-foreground/70 transition-colors hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="h-3.5 w-3.5" strokeWidth={1.5} />
                {item.label}
              </button>
            ))}
            <span aria-hidden className="h-4 w-px bg-border" />
            <span className="px-2 text-muted-foreground">
              <Plus className="h-3 w-3" strokeWidth={1.5} />
            </span>
          </div>
        </Panel>
      </ReactFlow>
    </div>
  );
}
