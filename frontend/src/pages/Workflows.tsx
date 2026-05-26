import { useState } from "react";
import { Play, Edit, Trash2, Plus, Loader2, Zap, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pagination, PaginationContent, PaginationItem } from "@/components/ui/pagination";
import { buttonVariants } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
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
      toast.success("Workflow deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    },
    onError: (err: unknown) => toastError(err, "Failed to delete workflow"),
  });

  const handleExecute = async (workflowId: number) => {
    setExecutingId(workflowId);
    try {
      const result = await executeWorkflow(workflowId);
      if (result.status === "success") {
        toast.success(`Executed in ${result.execution_time_ms}ms`);
      } else {
        toast.error(`Execution failed: ${result.error ?? "unknown error"}`);
      }
      queryClient.invalidateQueries({ queryKey: ["workflows"] });
    } catch (err: unknown) {
      toastError(err, "Failed to execute workflow");
    } finally {
      setExecutingId(null);
    }
  };

  const handleDelete = (workflowId: number) => {
    if (!confirm("Are you sure you want to delete this workflow?")) return;
    deleteMutation.mutate(workflowId);
  };

  if (isPending) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px] text-muted-foreground">
        Failed to load workflows.
      </div>
    );
  }

  const workflows = data.items;
  const totalPages = Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  const hasPrev = page > 0;
  const hasNext = page + 1 < totalPages;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Workflows
          </h1>
          <p className="text-muted-foreground mt-1">Build and manage your automation workflows</p>
        </div>
        <Link to="/workflows/new">
          <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4 mr-2" />
            Create Workflow
          </Button>
        </Link>
      </div>

      <div className="grid gap-4">
        {workflows.length === 0 ? (
          <Card className="border-dashed border-2 bg-card/30">
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/50 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">No workflows yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first workflow to start automating
              </p>
              <Link to="/workflows/new">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Workflow
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          workflows.map((workflow) => (
            <Card
              key={workflow.id}
              className="group hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{workflow.title}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge
                        variant={workflow.enabled ? "default" : "secondary"}
                        className={
                          workflow.enabled
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : ""
                        }
                      >
                        {workflow.enabled ? "Active" : "Disabled"}
                      </Badge>
                      {workflow.webhook_path && (
                        <Badge variant="outline" className="text-xs">
                          webhook
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExecute(workflow.id)}
                    disabled={executingId === workflow.id}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    {executingId === workflow.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                  </Button>
                  <Link to={`/workflows/${workflow.id}/edit`}>
                    <Button variant="ghost" size="sm" className="hover:bg-secondary">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(workflow.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-6 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-primary/50"></span>
                    {workflow.nodes?.length || 0} nodes
                  </span>
                  <span>{workflow.connections?.length || 0} connections</span>
                  {workflow.last_executed_at && (
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Last run: {new Date(workflow.last_executed_at).toLocaleString()}
                    </span>
                  )}
                  {workflow.created_at && (
                    <span>Created: {new Date(workflow.created_at).toLocaleDateString()}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {data.total > PAGE_SIZE && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <button
                type="button"
                onClick={() => setPage((p) => p - 1)}
                disabled={!hasPrev}
                aria-label="Previous page"
                className={cn(
                  buttonVariants({ variant: "ghost", size: "icon" }),
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </PaginationItem>
            <PaginationItem>
              <span className="px-3 text-sm text-muted-foreground">
                Page {page + 1} of {totalPages}
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
                  "disabled:pointer-events-none disabled:opacity-50",
                )}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
