import { apiCaller } from "./api-caller";
import { Workflow, WorkflowCreate, WorkflowUpdate, ExecutionResult } from "@/types/workflow";

interface Paginated<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export const getWorkflows = async (limit = 50, offset = 0): Promise<Workflow[]> => {
  const response = await apiCaller.get<Paginated<Workflow>>("/workf/workflow", {
    params: { limit, offset },
  });
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Failed to fetch workflows");
  }
  return response.data.items;
};

export const getWorkflow = async (id: number): Promise<Workflow> => {
  const response = await apiCaller.get<Workflow>(`/workf/workflow/${id}`);
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Failed to fetch workflow");
  }
  return response.data;
};

export const createWorkflow = async (workflow: WorkflowCreate): Promise<Workflow> => {
  const response = await apiCaller.post<Workflow>("/workf/workflow", workflow);
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Failed to create workflow");
  }
  return response.data;
};

export const updateWorkflow = async (id: number, workflow: WorkflowUpdate): Promise<Workflow> => {
  const response = await apiCaller.put<Workflow>(`/workf/workflow/${id}`, workflow);
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Failed to update workflow");
  }
  return response.data;
};

export const deleteWorkflow = async (id: number): Promise<void> => {
  const response = await apiCaller.delete(`/workf/workflow/${id}`);
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Failed to delete workflow");
  }
};

export const executeWorkflow = async (id: number): Promise<ExecutionResult> => {
  if (!id || isNaN(id)) {
    throw new Error("Invalid workflow ID");
  }
  const response = await apiCaller.post(`/webh/webhook/test/${id}`, {});
  if (response.status !== 200) {
    throw new Error((response.data as any)?.detail || "Execution failed");
  }
  return response.data as ExecutionResult;
};
