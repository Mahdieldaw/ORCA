// src/hooks/useExecutions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Added useMutation, useQueryClient
import {
  fetchExecutions,
  fetchExecutionDetail,
  fetchExecutionLogs,
  recordManualValidation,
  retryStage,
  updateExecutionStatus,
  startWorkflowExecution, // Added startWorkflowExecution
  ExecutionSummary,
  ExecutionDetail,
  ExecutionLog,
} from '@/services/apiClient';

// Define query keys
const executionKeys = {
  all: ['executions'] as const,
  lists: () => [...executionKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...executionKeys.lists(), filters] as const,
  details: () => [...executionKeys.all, 'detail'] as const,
  detail: (id: string) => [...executionKeys.details(), id] as const,
  logs: () => [...executionKeys.all, 'logs'] as const,
  log: (executionId: string) => [...executionKeys.logs(), executionId] as const,
};

// Hook to fetch a list of execution summaries with optional filters
export const useGetExecutions = (filters: { workflowId?: string } = {}) => {
  return useQuery<ExecutionSummary[], Error>({
    queryKey: executionKeys.list(filters),
    queryFn: () => fetchExecutions(filters.workflowId),
    // Optional: Add staleTime, cacheTime, etc.
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

// Hook to fetch details for a specific execution
export const useGetExecutionDetail = (executionId: string | null | undefined) => {
  return useQuery<ExecutionDetail, Error>({
    queryKey: executionKeys.detail(executionId!),
    queryFn: () => fetchExecutionDetail(executionId!),
    enabled: !!executionId,
    staleTime: 5 * 1000, // Fetch details relatively frequently if needed
  });
};

// Hook to fetch logs for a specific execution, with polling based on execution status
export const useGetExecutionLogs = (executionId: string | null | undefined, options?: { enabled?: boolean }) => {
  // Fetch execution details to determine if polling should be active
  const { data: executionDetail } = useGetExecutionDetail(executionId);
  const isExecutionRunning = executionDetail?.status === 'RUNNING' || executionDetail?.status === 'PENDING';

  return useQuery<ExecutionLog[], Error>({
    queryKey: executionKeys.log(executionId!),
    queryFn: () => fetchExecutionLogs(executionId!),
    enabled: (options?.enabled ?? !!executionId) && !!executionDetail, // Only run if executionId is provided, enabled, and details are loaded
    staleTime: 10 * 1000, // Logs can be slightly stale (10s)
    refetchInterval: (query) => {
      // Check the fetched execution status
      return isExecutionRunning ? 5000 : false; // Refetch every 5 seconds ONLY if status is RUNNING/PENDING
    },
    refetchIntervalInBackground: isExecutionRunning, // Allow background refetching if running
    refetchOnWindowFocus: isExecutionRunning, // Refetch on focus only if running
  });
};

// Hook for recording manual validation result (Mutation)
export const useRecordManualValidation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ExecutionLog, // Return type
    Error,        // Error type
    { executionId: string; stageId: string; validationResult: 'pass' | 'fail'; comments?: string } // Updated input variables
  >({
    mutationFn: (variables) => recordManualValidation(variables.executionId, variables.stageId, variables.validationResult),
    onSuccess: (updatedLog, variables) => {
      console.log(`Manual validation recorded for stage ${variables.stageId}: ${variables.validationResult}`, updatedLog);
      // Invalidate logs for this execution to show the updated status
      queryClient.invalidateQueries({ queryKey: executionKeys.log(variables.executionId) });
      // Optionally invalidate the execution detail if status changes
      queryClient.invalidateQueries({ queryKey: executionKeys.detail(variables.executionId) });
    },
    onError: (error, variables) => {
      console.error(`Error recording validation for stage ${variables.stageId}:`, error);
      // Add user feedback
    },
  });
};

// Hook for retrying a failed stage (Mutation)
export const useRetryStage = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ExecutionLog, // Return type (might be different based on API, e.g., StageExecution)
    Error,        // Error type
    { executionId: string; stageId: string } // Input variables
  >({
    mutationFn: ({ executionId, stageId }) => retryStage(executionId, stageId),
    onSuccess: (result, variables) => {
      console.log(`Stage ${variables.stageId} retry initiated:`, result);
      // Invalidate logs to show the new attempt
      queryClient.invalidateQueries({ queryKey: executionKeys.log(variables.executionId) });
      // Invalidate execution detail as status/current stage might change
      queryClient.invalidateQueries({ queryKey: executionKeys.detail(variables.executionId) });
    },
    onError: (error, variables) => {
      console.error(`Error retrying stage ${variables.stageId}:`, error);
      // Add user feedback
    },
  });
};

// Hook for updating execution status (Mutation)
export const useUpdateExecutionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ExecutionSummary, // Return type
    Error,            // Error type
    { executionId: string; status: string } // Input variables
  >({
    mutationFn: ({ executionId, status }) => updateExecutionStatus(executionId, status),
    onSuccess: (updatedExecution, variables) => {
      console.log(`Execution ${variables.executionId} status updated to ${variables.status}`, updatedExecution);
      // Invalidate execution list and detail
      queryClient.invalidateQueries({ queryKey: executionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: executionKeys.detail(variables.executionId) });
      // Optionally update cache directly
      queryClient.setQueryData(executionKeys.detail(variables.executionId), updatedExecution);
    },
    onError: (error, variables) => {
      console.error(`Error updating status for execution ${variables.executionId}:`, error);
      // Add user feedback
    },
  });
};

// Hook for starting a workflow execution (Mutation)
export const useStartExecution = () => {
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
};

// Note: Mutations for starting/stopping/retrying executions would go here
// export const useStopExecution = () => { ... }; // Potentially use useUpdateExecutionStatus with 'cancelled' status
// export const useRetryStage = () => { ... }; // Implemented above
