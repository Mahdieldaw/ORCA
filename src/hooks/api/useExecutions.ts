// src/hooks/api/useExecutions.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { startWorkflowExecution, ExecutionSummary } from '@/services/apiClient';
import { useWorkflowStore } from '@/store/workflowStore'; // Import Zustand store
import { useToast } from '@/components/ui/use-toast'; // For user feedback

// Define keys for execution-related queries if needed later (e.g., for invalidation)
const executionKeys = {
  all: ['executions'] as const,
  lists: () => [...executionKeys.all, 'list'] as const,
  list: (filters: string) => [...executionKeys.lists(), { filters }] as const,
  details: () => [...executionKeys.all, 'detail'] as const,
  detail: (id: string) => [...executionKeys.details(), id] as const,
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

// Add other execution-related hooks here later (e.g., useGetExecutionDetails, useGetExecutionLogs)