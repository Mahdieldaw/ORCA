// src/hooks/useWorkflows.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/nextjs';
import {
    fetchWorkflows,
    fetchWorkflowDetail,
    startWorkflowExecution,
    fetchExecutions,
    fetchExecutionLogs,
    updateWorkflow,
    deleteWorkflow,
    updateStage,
    deleteStage,
    WorkflowSummary,
    WorkflowDetail,
    StageDetail,
    ExecutionSummary,
    ExecutionLog,
} from '@/services/apiClient'; // Adjust path if needed

// Define query keys for workflow-related data
// This helps with caching, invalidation, and refetching
export const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (filters: string | Record<string, any>) => [...workflowKeys.lists(), { filters }] as const, // Allow object filters
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
};

// Define query keys for execution-related data
export const executionKeys = {
    all: ['executions'] as const,
    lists: () => [...executionKeys.all, 'list'] as const,
    list: (filters: string | Record<string, any>) => [...executionKeys.lists(), { filters }] as const,
    details: () => [...executionKeys.all, 'detail'] as const,
    detail: (id: string) => [...executionKeys.details(), id] as const,
    logs: (executionId: string) => [...executionKeys.detail(executionId), 'logs'] as const,
};

// Hook to fetch the list of all workflows (summary)
export function useGetWorkflows() {
  const { getToken } = useAuth();
  return useQuery<WorkflowSummary[], Error>({
    queryKey: workflowKeys.lists(),
    queryFn: async () => {
      const token = await getToken();
      return fetchWorkflows(token);
    },
    staleTime: 5 * 60 * 1000,
  });
}

// Hook to fetch the detailed information for a specific workflow
export function useGetWorkflowDetail(workflowId: string | null | undefined) {
  const { getToken } = useAuth();
  return useQuery<WorkflowDetail, Error>({
    queryKey: workflowKeys.detail(workflowId!),
    queryFn: async () => {
      const token = await getToken();
      return fetchWorkflowDetail(workflowId!, token);
    },
    enabled: !!workflowId,
    staleTime: 10 * 60 * 1000,
  });
}

// Hook for updating workflow metadata (Mutation)
export function useUpdateWorkflow() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation<
    WorkflowDetail,
    Error,
    { workflowId: string; data: Partial<Pick<WorkflowDetail, 'name' | 'description' | 'globalInputSchema'>> }
  >({
    mutationFn: async ({ workflowId, data }) => {
      const token = await getToken();
      return updateWorkflow(workflowId, data, token);
    },
    onSuccess: (updatedWorkflow) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(updatedWorkflow.id) });
      queryClient.setQueryData(workflowKeys.detail(updatedWorkflow.id), updatedWorkflow);
    },
    onError: (error, variables) => {
      console.error(`Error updating workflow ${variables.workflowId}:`, error);
    },
  });
}

// Hook for deleting a workflow (Mutation)
export function useDeleteWorkflow() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation<
    void,
    Error,
    string
  >({
    mutationFn: async (workflowId) => {
      const token = await getToken();
      return deleteWorkflow(workflowId, token);
    },
    onSuccess: (_, workflowId) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
      queryClient.removeQueries({ queryKey: workflowKeys.detail(workflowId) });
    },
    onError: (error, workflowId) => {
      console.error(`Error deleting workflow ${workflowId}:`, error);
    },
  });
}

// Hook for updating stage details (Mutation)
export function useUpdateStage() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation<
    StageDetail,
    Error,
    { workflowId: string; stageId: string; data: Partial<Omit<StageDetail, 'id' | 'workflowId' | 'userId' | 'createdAt' | 'updatedAt'>> }
  >({
    mutationFn: async ({ workflowId, stageId, data }) => {
      const token = await getToken();
      return updateStage(workflowId, stageId, data, token);
    },
    onSuccess: (updatedStage, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) });
    },
    onError: (error, variables) => {
      console.error(`Error updating stage ${variables.stageId} in workflow ${variables.workflowId}:`, error);
    },
  });
}

// Hook for deleting a stage (Mutation)
export function useDeleteStage() {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  return useMutation<
    void,
    Error,
    { workflowId: string; stageId: string }
  >({
    mutationFn: async ({ workflowId, stageId }) => {
      const token = await getToken();
      return deleteStage(workflowId, stageId, token);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) });
    },
    onError: (error, variables) => {
      console.error(`Error deleting stage ${variables.stageId} from workflow ${variables.workflowId}:`, error);
    },
  });
}

// Hook to fetch the list of executions (summary), optionally filtered by workflowId
export function useGetExecutions(workflowId?: string) {
  const { getToken } = useAuth();
  const queryFilter = workflowId ? { workflowId } : 'all';
  return useQuery<ExecutionSummary[], Error>({
    queryKey: executionKeys.list(queryFilter),
    queryFn: async () => {
      const token = await getToken();
      return fetchExecutions(workflowId, token);
    },
    staleTime: 1 * 60 * 1000,
  });
}

// Hook to fetch logs for a specific execution
export function useGetExecutionLogs(executionId: string | null | undefined) {
  const { getToken } = useAuth();
  return useQuery<ExecutionLog[], Error>({
    queryKey: executionKeys.logs(executionId!),
    queryFn: async () => {
      const token = await getToken();
      return fetchExecutionLogs(executionId!, token);
    },
    enabled: !!executionId,
    staleTime: 30 * 1000,
    refetchInterval: (query) => {
      return false;
    },
  });
}

// --- Placeholder Hooks for Future Implementation --- //

// Example Mutation Hook for Creating a Workflow
// export function useCreateWorkflow() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: createWorkflow, // Assumes createWorkflow API function exists
//     onSuccess: (newWorkflow) => {
//       // Invalidate and refetch workflow list after creation
//       queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
//       // Optional: Navigate to the new workflow's editor page
//     },
//     onError: (error) => {
//         console.error('Error creating workflow:', error);
//     }
//   });
// }

// Add hooks for other mutations: updateWorkflow, deleteWorkflow, createStage, updateStage, deleteStage, etc.
// Add hooks for other queries: fetchSnapshots, fetchSnapshotDetail, fetchModels, etc.
