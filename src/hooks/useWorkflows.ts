// src/hooks/useWorkflows.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchWorkflows,
    fetchWorkflowDetail,
    startWorkflowExecution,
    fetchExecutions,
    fetchExecutionLogs,
    updateWorkflow, // Added
    deleteWorkflow, // Added
    updateStage,    // Added
    deleteStage,    // Added
    WorkflowSummary,
    WorkflowDetail,
    StageDetail,    // Added
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
  return useQuery<WorkflowSummary[], Error>({
    queryKey: workflowKeys.lists(),
    queryFn: fetchWorkflows,
    staleTime: 5 * 60 * 1000, // Example: Data is considered fresh for 5 minutes
    // Add other options like `refetchOnWindowFocus: false` if needed
  });
}

// Hook to fetch the detailed information for a specific workflow
export function useGetWorkflowDetail(workflowId: string | null | undefined) {
    return useQuery<WorkflowDetail, Error>({
        queryKey: workflowKeys.detail(workflowId!), // The '!' asserts workflowId is non-null when enabled
        queryFn: () => fetchWorkflowDetail(workflowId!),
        enabled: !!workflowId, // Only run the query if workflowId is a truthy value (not null, undefined, or empty string)
        staleTime: 10 * 60 * 1000, // Example: Details might be fresher longer
    });
}

// Hook for updating workflow metadata (Mutation)
export function useUpdateWorkflow() {
    const queryClient = useQueryClient();
    return useMutation<
        WorkflowDetail, // Return type
        Error,          // Error type
        { workflowId: string; data: Partial<Pick<WorkflowDetail, 'name' | 'description' | 'globalInputSchema'>> } // Input variables
    >({
        mutationFn: ({ workflowId, data }) => updateWorkflow(workflowId, data),
        onSuccess: (updatedWorkflow) => {
            console.log('Workflow updated successfully:', updatedWorkflow);
            // Invalidate both the list and the specific detail query
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            queryClient.invalidateQueries({ queryKey: workflowKeys.detail(updatedWorkflow.id) });
            // Optionally update the cache directly
            queryClient.setQueryData(workflowKeys.detail(updatedWorkflow.id), updatedWorkflow);
        },
        onError: (error, variables) => {
            console.error(`Error updating workflow ${variables.workflowId}:`, error);
            // Add user feedback (e.g., toast)
        },
    });
}

// Hook for deleting a workflow (Mutation)
export function useDeleteWorkflow() {
    const queryClient = useQueryClient();
    return useMutation<
        void,           // Return type (usually void for delete)
        Error,          // Error type
        string          // Input variable (workflowId)
    >({
        mutationFn: (workflowId) => deleteWorkflow(workflowId),
        onSuccess: (_, workflowId) => {
            console.log(`Workflow ${workflowId} deleted successfully`);
            // Invalidate the workflow list
            queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
            // Remove the deleted workflow's detail from cache if it exists
            queryClient.removeQueries({ queryKey: workflowKeys.detail(workflowId) });
        },
        onError: (error, workflowId) => {
            console.error(`Error deleting workflow ${workflowId}:`, error);
            // Add user feedback
        },
    });
}

// Hook for updating stage details (Mutation)
export function useUpdateStage() {
    const queryClient = useQueryClient();
    return useMutation<
        StageDetail,    // Return type
        Error,          // Error type
        { workflowId: string; stageId: string; data: Partial<Omit<StageDetail, 'id' | 'workflowId' | 'userId' | 'createdAt' | 'updatedAt'>> } // Input variables
    >({
        mutationFn: ({ workflowId, stageId, data }) => updateStage(workflowId, stageId, data),
        onSuccess: (updatedStage, variables) => {
            console.log(`Stage ${variables.stageId} updated successfully:`, updatedStage);
            // Invalidate the parent workflow's detail query to refetch stages
            queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) });
            // Optionally update the stage within the workflow detail cache directly (more complex)
        },
        onError: (error, variables) => {
            console.error(`Error updating stage ${variables.stageId} in workflow ${variables.workflowId}:`, error);
            // Add user feedback
        },
    });
}

// Hook for deleting a stage (Mutation)
export function useDeleteStage() {
    const queryClient = useQueryClient();
    return useMutation<
        void,           // Return type
        Error,          // Error type
        { workflowId: string; stageId: string } // Input variables
    >({
        mutationFn: ({ workflowId, stageId }) => deleteStage(workflowId, stageId),
        onSuccess: (_, variables) => {
            console.log(`Stage ${variables.stageId} deleted successfully from workflow ${variables.workflowId}`);
            // Invalidate the parent workflow's detail query to refetch stages
            queryClient.invalidateQueries({ queryKey: workflowKeys.detail(variables.workflowId) });
        },
        onError: (error, variables) => {
            console.error(`Error deleting stage ${variables.stageId} from workflow ${variables.workflowId}:`, error);
            // Add user feedback
        },
    });
}


// Hook to fetch the list of executions (summary), optionally filtered by workflowId
export function useGetExecutions(workflowId?: string) {
    const queryFilter = workflowId ? { workflowId } : 'all'; // Use 'all' or specific ID for key
    return useQuery<ExecutionSummary[], Error>({
        queryKey: executionKeys.list(queryFilter),
        queryFn: () => fetchExecutions(workflowId),
        staleTime: 1 * 60 * 1000, // Executions list might change more frequently
    });
}

// Hook to fetch logs for a specific execution
export function useGetExecutionLogs(executionId: string | null | undefined) {
    return useQuery<ExecutionLog[], Error>({
        queryKey: executionKeys.logs(executionId!),
        queryFn: () => fetchExecutionLogs(executionId!),
        enabled: !!executionId,
        staleTime: 30 * 1000, // Logs might update frequently during execution
        refetchInterval: (query) => {
            // Optional: Refetch logs periodically if the execution is still running
            // This requires knowing the execution status, which might need another query or be part of ExecutionSummary
            // const execution = queryClient.getQueryData<ExecutionSummary>(executionKeys.detail(executionId!));
            // return execution?.status === 'running' ? 5000 : false; // Refetch every 5s if running
            return false; // Disable interval refetching for now
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
