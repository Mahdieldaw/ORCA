// src/hooks/api/useExecutions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startWorkflowExecution, recordManualValidation, retryStage, ExecutionSummary, ExecutionLog } from '@/services/apiClient'; // Added recordManualValidation, retryStage, ExecutionLog
import { useWorkflowStore } from '@/store/workflowStore'; // Import Zustand store
import { useToast } from '@/components/ui/use-toast'; // For user feedback

// Define keys for execution-related queries if needed later (e.g., for invalidation)
const executionKeys = {
  all: ['executions'] as const,
  lists: () => [...executionKeys.all, 'list'] as const,
  list: (filters: string) => [...executionKeys.lists(), { filters }] as const,
  details: () => [...executionKeys.all, 'detail'] as const,
  detail: (id: string) => [...executionKeys.details(), id] as const,
  logs: (executionId: string) => [...executionKeys.detail(executionId), 'logs'] as const, // Added logs key
};

interface StartExecutionVariables {
  workflowId: string;
  inputs: any; // Define a more specific type based on your expected inputs
}

export function useStartWorkflowExecution() {
  const queryClient = useQueryClient();
  const setCurrentExecutionId = useWorkflowStore((state) => state.setCurrentExecutionId);
  const { toast } = useToast();

  return useMutation<ExecutionSummary, Error, StartExecutionVariables>({ // Specify types for data, error, variables
    mutationFn: ({ workflowId, inputs }) => startWorkflowExecution(workflowId, inputs),
    onSuccess: (data) => {
      console.log('Workflow execution started successfully:', data);
      toast({
        title: "Execution Started",
        description: `Workflow execution ${data.id} initiated. Status: ${data.status}.`,
      });

      // Update global state with the new execution ID
      setCurrentExecutionId(data.id);

      // Invalidate queries that should be updated after starting an execution
      // For example, invalidate the list of all executions
      queryClient.invalidateQueries({ queryKey: executionKeys.lists() });

      // Optionally, prefetch or update the specific execution details if needed immediately
      // queryClient.setQueryData(executionKeys.detail(data.id), data);
    },
    onError: (error) => {
      console.error('Failed to start workflow execution:', error);
      toast({
        title: "Execution Failed",
        description: error.message || "Could not start workflow execution.",
        variant: "destructive",
      });
      // Reset execution ID in store if needed
      // setCurrentExecutionId(null);
    },
  });
}

// Hook for recording manual validation result
export function useRecordManualValidation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    ExecutionLog, // Return type (updated log entry)
    Error,
    { executionId: string; stageId: string; result: 'pass' | 'fail' } // Input variables
  >({
    mutationFn: ({ executionId, stageId, result }) => recordManualValidation(executionId, stageId, result),
    onSuccess: (updatedLog, variables) => {
      console.log(`Manual validation recorded for stage ${variables.stageId}:`, updatedLog);
      toast({
        title: "Validation Recorded",
        description: `Stage marked as ${variables.result}.`,
      });
      // Invalidate logs for this execution to show the update
      queryClient.invalidateQueries({ queryKey: executionKeys.logs(variables.executionId) });
      // Optionally invalidate execution details if status changes
      queryClient.invalidateQueries({ queryKey: executionKeys.detail(variables.executionId) });
    },
    onError: (error, variables) => {
      console.error(`Error recording validation for stage ${variables.stageId}:`, error);
      toast({
        title: "Validation Failed",
        description: error.message || "Could not record validation result.",
        variant: "destructive",
      });
    },
  });
}

// Hook for retrying a failed stage
export function useRetryStage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<
    ExecutionLog, // Return type (new log entry for the retry)
    Error,
    { executionId: string; stageId: string } // Input variables
  >({
    mutationFn: ({ executionId, stageId }) => retryStage(executionId, stageId),
    onSuccess: (newLog, variables) => {
      console.log(`Stage ${variables.stageId} retry initiated:`, newLog);
      toast({
        title: "Stage Retry Initiated",
        description: `A new attempt for stage ${variables.stageId} has started.`,
      });
      // Invalidate logs for this execution to show the new attempt
      queryClient.invalidateQueries({ queryKey: executionKeys.logs(variables.executionId) });
      // Optionally invalidate execution details if status changes
      queryClient.invalidateQueries({ queryKey: executionKeys.detail(variables.executionId) });
    },
    onError: (error, variables) => {
      console.error(`Error retrying stage ${variables.stageId}:`, error);
      toast({
        title: "Retry Failed",
        description: error.message || "Could not initiate stage retry.",
        variant: "destructive",
      });
    },
  });
}

// Add other execution-related hooks here later (e.g., useGetExecutionDetails, useGetExecutionLogs)