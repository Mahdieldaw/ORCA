// src/hooks/useWorkflows.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    fetchWorkflows,
    fetchWorkflowDetail,
    startWorkflowExecution,
    fetchExecutions,
    fetchExecutionLogs,
    // Import other API functions as needed (createWorkflow, updateWorkflow, etc.)
    WorkflowSummary,
    WorkflowDetail,
    ExecutionSummary,
    ExecutionLog,
    // Import other interfaces as needed
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

// Hook for starting a workflow execution (Mutation)
export function useStartExecution() {
    const queryClient = useQueryClient();
    return useMutation<
        ExecutionSummary, // Type of data returned on success
        Error,            // Type of error
        { workflowId: string; inputs: any } // Type of variables passed to the mutation function
    >({
        mutationFn: ({ workflowId, inputs }) => startWorkflowExecution(workflowId, inputs),
        onSuccess: (data) => {
            console.log('Execution started successfully:', data);
            // Invalidate queries related to executions list to refetch
            queryClient.invalidateQueries({ queryKey: executionKeys.lists() });
            // Optionally, you could pre-populate the cache for the new execution's details
            // queryClient.setQueryData(executionKeys.detail(data.id), data);
        },
        onError: (error) => {
            console.error('Error starting execution:', error);
            // Handle error display to the user here (e.g., using a toast notification)
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