// src/hooks/useExecutions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; // Added useMutation, useQueryClient
import {
  fetchExecutions,
  fetchExecutionLogs,
  recordManualValidation, // Added
  retryStage,             // Added
  updateExecutionStatus,  // Added
  ExecutionSummary,
  ExecutionLog,
} from '@/services/apiClient';

// Define query keys
const executionKeys = {
  all: ['executions'] as const,
  lists: () => [...executionKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...executionKeys.lists(), filters] as const,
  details: () => [...executionKeys.all, 'detail'] as const, // Added details key
  detail: (id: string) => [...executionKeys.details(), id] as const, // Added detail key
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

// Hook to fetch logs for a specific execution
export const useGetExecutionLogs = (executionId: string, options?: { enabled?: boolean }) => {
  return useQuery<ExecutionLog[], Error>({
    queryKey: executionKeys.log(executionId),
    queryFn: () => fetchExecutionLogs(executionId),
    enabled: options?.enabled ?? !!executionId, // Only run if executionId is provided and enabled
    staleTime: 30 * 1000, // 30 seconds, logs might update frequently
    refetchInterval: (query) => {
      // Refetch logs only if the execution is still potentially running
      // This logic might need refinement based on how execution status is tracked
      const lastLog = query.state.data?.[query.state.data.length - 1];
      const isRunning = lastLog?.status === 'running' || lastLog?.status === 'pending'; // Example condition
      return isRunning ? 5000 : false; // Refetch every 5 seconds if running
    },
  });
};

// Hook for recording manual validation result (Mutation)
export const useRecordManualValidation = () => {
  const queryClient = useQueryClient();
  return useMutation<
    ExecutionLog, // Return type
    Error,        // Error type
    { executionId: string; stageId: string; result: 'pass' | 'fail' } // Input variables
  >({
    mutationFn: ({ executionId, stageId, result }) => recordManualValidation(executionId, stageId, result),
    onSuccess: (updatedLog, variables) => {
      console.log(`Manual validation recorded for stage ${variables.stageId}: ${variables.result}`, updatedLog);
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
    ExecutionLog, // Return type
    Error,        // Error type
    { executionId: string; stageId: string } // Input variables
  >({
    mutationFn: ({ executionId, stageId }) => retryStage(executionId, stageId),
    onSuccess: (newLog, variables) => {
      console.log(`Stage ${variables.stageId} retry initiated:`, newLog);
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

// Note: Mutations for starting/stopping/retrying executions would go here
// export const useStartExecution = () => { ... }; // Moved to useWorkflows.ts
// export const useStopExecution = () => { ... }; // Potentially use useUpdateExecutionStatus with 'cancelled' status
// export const useRetryStage = () => { ... }; // Implemented above