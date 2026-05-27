import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { WorkflowCanvas } from "@/components/workflow/WorkflowCanvas";
import { NodeConfigPanel } from "@/components/workflow/NodeConfigPanel";
import { useWorkflowStore } from "@/store/workflowStore";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Play, ArrowLeft, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function WorkflowEditor() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const {
    currentWorkflow,
    workflowTitle,
    setWorkflowTitle,
    selectedNodeId,
    isLoading,
    isSaving,
    isExecuting,
    loadWorkflow,
    saveWorkflow,
    createWorkflow,
    executeWorkflow,
    resetWorkflow,
  } = useWorkflowStore();

  useEffect(() => {
    if (id) {
      loadWorkflow(parseInt(id)).catch(() => {
        toast.error("Couldn't load workflow");
        navigate("/workflows");
      });
    } else {
      resetWorkflow();
    }
  }, [id]);

  const handleSave = async () => {
    try {
      const workflow = await (currentWorkflow ? saveWorkflow() : createWorkflow());
      toast.success("Saved");

      if (!id && workflow.id) {
        navigate(`/workflows/${workflow.id}/edit`, { replace: true });
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save");
    }
  };

  const handleExecute = async () => {
    if (!currentWorkflow) {
      toast.error("Save the workflow first");
      return;
    }

    try {
      const result = await executeWorkflow();
      if (result.status === "success") {
        toast.success(`Ran in ${result.execution_time_ms}ms`);
      } else {
        toast.error(`Failed: ${result.error}`);
      }
    } catch (error: any) {
      toast.error(error.message || "Run failed");
    }
  };

  const copyWebhookUrl = () => {
    if (currentWorkflow?.webhook_path) {
      // Assumes SPA and API share an origin. If they ever split, swap
      // window.location.origin for a VITE_PUBLIC_BASE_URL env value.
      const webhookUrl = `${window.location.origin}/webh/webhook/${currentWorkflow.webhook_path}`;
      navigator.clipboard.writeText(webhookUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      toast.success("Webhook URL copied");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      <header className="flex items-center justify-between border-b border-border bg-card px-5 py-3">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/workflows")}
            className="h-8 w-8 text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </Button>

          <Input
            value={workflowTitle}
            onChange={(e) => setWorkflowTitle(e.target.value)}
            placeholder="Untitled workflow"
            className="h-8 w-64 border-transparent bg-transparent px-2 font-display text-lg italic focus-visible:border-border focus-visible:bg-card"
          />

          {currentWorkflow?.webhook_path && (
            <button
              type="button"
              onClick={copyWebhookUrl}
              className="ml-2 inline-flex items-center gap-1.5 rounded border border-border bg-background px-2.5 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3 w-3 text-primary" strokeWidth={2} />
              ) : (
                <Copy className="h-3 w-3" strokeWidth={1.5} />
              )}
              /webh/webhook/{currentWorkflow.webhook_path}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={handleSave}
            disabled={isSaving}
            className="h-9 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving
              </>
            ) : (
              "Save"
            )}
          </Button>

          <Button
            onClick={handleExecute}
            disabled={isExecuting || !currentWorkflow}
            className="h-9 bg-foreground px-4 text-background hover:bg-primary"
          >
            {isExecuting ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Running
              </>
            ) : (
              <>
                <Play className="mr-1.5 h-3.5 w-3.5" strokeWidth={1.5} />
                Run
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1">
          <WorkflowCanvas />
        </div>

        {selectedNodeId && (
          <div className="w-80 border-l border-border">
            <NodeConfigPanel />
          </div>
        )}
      </div>
    </div>
  );
}
