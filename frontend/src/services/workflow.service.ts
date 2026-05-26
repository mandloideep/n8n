import { request } from "./api-caller";
import {
  DeleteResponseSchema,
  ExecutionResultSchema,
  WorkflowSchema,
  paginated,
} from "@/lib/schemas";
import type {
  Workflow,
  WorkflowCreate,
  WorkflowUpdate,
  ExecutionResult,
} from "@/types/workflow";

const PaginatedWorkflowSchema = paginated(WorkflowSchema);
export type WorkflowsPage = {
  items: Workflow[];
  total: number;
  limit: number;
  offset: number;
};

export const getWorkflows = async (limit = 50, offset = 0): Promise<Workflow[]> => {
  const data = await request(PaginatedWorkflowSchema, {
    method: "GET",
    url: "/workf/workflow",
    params: { limit, offset },
  });
  return data.items as Workflow[];
};

export const getWorkflowsPage = async (limit = 20, offset = 0): Promise<WorkflowsPage> => {
  const data = await request(PaginatedWorkflowSchema, {
    method: "GET",
    url: "/workf/workflow",
    params: { limit, offset },
  });
  return data as WorkflowsPage;
};

export const getWorkflow = async (id: number): Promise<Workflow> => {
  const data = await request(WorkflowSchema, {
    method: "GET",
    url: `/workf/workflow/${id}`,
  });
  return data as Workflow;
};

export const createWorkflow = async (workflow: WorkflowCreate): Promise<Workflow> => {
  const data = await request(WorkflowSchema, {
    method: "POST",
    url: "/workf/workflow",
    data: workflow,
  });
  return data as Workflow;
};

export const updateWorkflow = async (
  id: number,
  workflow: WorkflowUpdate,
): Promise<Workflow> => {
  const data = await request(WorkflowSchema, {
    method: "PUT",
    url: `/workf/workflow/${id}`,
    data: workflow,
  });
  return data as Workflow;
};

export const deleteWorkflow = async (id: number): Promise<void> => {
  await request(DeleteResponseSchema, {
    method: "DELETE",
    url: `/workf/workflow/${id}`,
  });
};

export const executeWorkflow = async (id: number): Promise<ExecutionResult> => {
  if (!id || isNaN(id)) {
    throw new Error("Invalid workflow ID");
  }
  const data = await request(ExecutionResultSchema, {
    method: "POST",
    url: `/webh/webhook/test/${id}`,
    data: {},
  });
  return data as ExecutionResult;
};
