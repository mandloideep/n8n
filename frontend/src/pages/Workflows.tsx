import { useState } from "react";
import { Play, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button, buttonVariants } from "@/components/ui/button";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import { deleteWorkflow, executeWorkflow, getWorkflowsPage } from "@/services/workflow.service";
import { toastError } from "@/services/api-caller";
import { toast } from "sonner";

const PAGE_SIZE = 20;

export default function Workflows() {
  const [page, setPage] = useState(0);
  const [executingId, setExecutingId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const queryKey = ["workflows", page] as const;
  const { data, isPending, isError } = useQuery({
    queryKey,
    queryFn: () => getWorkflowsPage(PAGE_SIZE, page * PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteWorkflow,
    onSuccess: () => {
      toast.success("Workflow deleted");
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
    onError: (err: unknown) => toastError(err, "Failed to delete workflow"),
  });

  const handleExecute = async (workflowId: number) => {
    setExecutingId(workflowId);
    try {
      const result = await executeWorkflow(workflowId);
      if (result.status === "success") {
        toast.success(`Ran in ${result.execution_time_ms}ms`);
      } else {
        toast.error(`Failed: ${result.error ?? "unknown error"}`);
      }
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    } catch (err: unknown) {
      toastError(err, "Failed to run workflow");
    } finally {
      setExecutingId(null);
    }
  };

  const handleDelete = (workflowId: number) => {
    if (!confirm("Delete this workflow?")) return;
    deleteMutation.mutate(workflowId);
  };

  if (isPending) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-8">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="mx-auto flex min-h-[60vh] w-full max-w-4xl items-center justify-center px-8 text-sm text-muted-foreground">
        Couldn't load workflows.
      </div>
    );
  }

  const workflows = data.items;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  return (
    <div className="mx-auto w-full max-w-4xl px-8 py-16">
      <div className="mb-12 flex items-end justify-between">
        <div>
          <h1 className="font-display text-5xl italic leading-none">Workflows.</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Everything you've wired up. {data.total} {data.total === 1 ? "flow" : "flows"} in all.
          </p>
        </div>
        <Link
          to="/workflows/new"
          className="group inline-flex items-center gap-1.5 text-sm font-medium text-foreground"
        >
          New workflow
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {workflows.length === 0 ? (
        <div className="border-t border-border py-24 text-center">
          <p className="font-display text-2xl italic text-foreground/80">Nothing here yet.</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Sketch your first flow when you're ready.
          </p>
          <Link
            to="/workflows/new"
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-foreground hover:text-primary"
          >
            Start one
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <ul className="border-t border-border">
          {workflows.map((workflow) => (
            <li
              key={workflow.id}
              className="group flex items-center justify-between border-b border-border py-5"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-3">
                  <Link
                    to={`/workflows/${workflow.id}/edit`}
                    className="truncate text-base font-medium text-foreground transition-colors hover:text-primary"
                  >
                    {workflow.title}
                  </Link>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 text-xs",
                      workflow.enabled ? "text-foreground/70" : "text-muted-foreground",
                    )}
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        workflow.enabled ? "bg-primary" : "bg-muted-foreground/50",
                      )}
                    />
                    {workflow.enabled ? "active" : "paused"}
                  </span>
                  {workflow.webhook_path && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      /{workflow.webhook_path}
                    </span>
                  )}
                </div>
                <div className="mt-1.5 flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    {workflow.nodes?.length || 0} nodes · {workflow.connections?.length || 0} edges
                  </span>
                  {workflow.last_executed_at && (
                    <span>last run {new Date(workflow.last_executed_at).toLocaleString()}</span>
                  )}
                </div>
              </div>
              <div className="ml-6 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleExecute(workflow.id)}
                  disabled={executingId === workflow.id}
                  title="Run"
                  className="h-8 w-8 p-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {executingId === workflow.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
                  )}
                </Button>
                <Link
                  to={`/workflows/${workflow.id}/edit`}
                  title="Edit"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  <Edit className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(workflow.id)}
                  title="Delete"
                  className="h-8 w-8 p-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data.total > PAGE_SIZE && (
        <Pagination className="mt-10">
          <PaginationContent>
            <PaginationItem>
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={!hasPrev}
                aria-label="Previous page"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-xs text-muted-foreground">
                {page + 1} / {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext}
                aria-label="Next page"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "disabled:pointer-events-none disabled:opacity-40",
                )}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
