// src/hooks/useExecutions.ts
import { useQuery } from '@tanstack/react-query';
import {
  fetchExecutions,
  fetchExecutionLogs,
  ExecutionSummary,
  ExecutionLog,
} from '@/services/apiClient';

// Define query keys
const executionKeys = {
  all: ['executions'] as const,
  lists: () => [...executionKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...executionKeys.lists(), filters] as const,
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

// Note: Mutations for starting/stopping/retrying executions would go here
// export const useStartExecution = () => { ... };
// export const useStopExecution = () => { ... };
// export const useRetryStage = () => { ... };