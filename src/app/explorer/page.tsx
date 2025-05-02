// src/app/explorer/page.tsx
'use client'; // Add this if using Next.js App Router

import React, { useState, useEffect } from 'react'; // Added useEffect
import { StageController } from '@/components/workflows/StageController'; // Adjust import path
import { HybridThinkDrawer } from '@/components/workflows/HybridThinkDrawer'; // Import the new drawer
import { GhostOverlay } from '@/components/workflows/GhostOverlay'; // Import the new overlay
import GlobalLayout from '@/components/layout/GlobalLayout'; // Adjust import path if needed
// import { StageCard } from '@/components/workflows/StageCard'; // Adjust import path if needed - Removed unused import
// Updated imports for workflow hooks
import { useGetWorkflows, useDeleteWorkflow, useGetWorkflowDetail, useUpdateWorkflow } from '@/hooks/useWorkflows';
import { useWorkflowStore } from '@/store/workflowStore'; // Import the Zustand store
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state
import { Button } from '@/components/ui/button'; // Import Button
import { Input } from '@/components/ui/input'; // Import Input
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Label } from '@/components/ui/label'; // Import Label
// import { Toast } from '@/components/ui/toast'; // Import Toast - Removed, useToast provides functionality
import { Trash2, Save, Play, History, Eye } from 'lucide-react'; // Import Trash, Save, Play, History, Eye icons
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Import AlertDialog for confirmation
import { useToast } from '@/components/ui/use-toast'; // Import useToast for feedback
import { WorkflowDetail, ExecutionLog, ExecutionSummary } from '@/services/apiClient'; // Removed Stage import from here
import { Stage } from '@prisma/client'; // Import Stage from prisma
import { useGetExecutionLogs, useStartExecution } from '@/hooks/useExecutions'; // Import hook for logs and starting execution
import { WorkflowProgressStepper } from '@/components/workflows/WorkflowProgressStepper'; // Import the stepper

// Define a type for the workflow data expected from the API
// Adjust this based on the actual API response structure
interface ApiWorkflow {
  id: string;
  name: string;
  description?: string | null; // Allow null for description
  // Add other relevant fields from your API response
}


// Internal WorkflowExplorer component for this page
const WorkflowExplorer = () => {
  const { data: workflows, isLoading, error, refetch } = useGetWorkflows();
  const setActiveWorkflowId = useWorkflowStore((state) => state.setActiveWorkflowId);
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId); // Get active workflow ID
  const { toast } = useToast();

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [workflowToDelete, setWorkflowToDelete] = useState<string | null>(null);

  // Mutation hook for deleting workflows
  const { mutate: deleteWorkflow, isPending: isDeleting } = useDeleteWorkflow();

  const handleWorkflowSelect = (workflowId: string) => {
    console.log(`Workflow selected: ${workflowId}. Updating global state.`);
    setActiveWorkflowId(workflowId);
  };

  // Handler to open delete confirmation
  const handleDeleteClick = (workflowId: string, event: React.MouseEvent<HTMLButtonElement>) => { // Added type for event
    event.stopPropagation(); // Prevent card click when clicking delete button
    setWorkflowToDelete(workflowId);
    setIsDeleteDialogOpen(true);
  };

  // Handler to confirm deletion
  const handleConfirmDelete = () => {
    if (workflowToDelete) {
      deleteWorkflow(workflowToDelete, {
        onSuccess: () => {
          toast({
            title: 'Workflow Deleted',
            description: `Workflow has been successfully deleted.`,
          });
          setIsDeleteDialogOpen(false);
          setWorkflowToDelete(null);
          if (activeWorkflowId === workflowToDelete) {
            setActiveWorkflowId(null); // Clear active ID if deleted
          }
          // Invalidate queries handled by the hook
        },
        onError: (err: unknown) => { // Added type for err
          toast({
            title: 'Error Deleting Workflow',
            description: (err instanceof Error ? err.message : String(err)) || 'Could not delete the workflow.', // Type safe error message
            variant: 'destructive',
          });
          setIsDeleteDialogOpen(false);
          setWorkflowToDelete(null);
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-2">
          Loading workflows...
        </p>
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
        <p className="font-semibold">Error loading workflows:</p>
        <p className="text-sm">{(error instanceof Error ? error.message : String(error)) || 'An unknown error occurred.'}</p> // Type safe error message
      </div>
    );
  }

  if (!workflows || workflows.length === 0) {
    return (
      <div className="p-4 bg-secondary rounded-md text-secondary-foreground">
        <p>No workflows found. Create one to get started.</p> {/* Updated message */}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-2">
        Select a workflow below to view its details or run it.
      </p>

      {workflows.map((workflow: ApiWorkflow) => (
        // Using a simple div wrapper for layout and hover group
        <div key={workflow.id} className="relative group border rounded-lg overflow-hidden hover:shadow-md transition-shadow duration-200">
          <div
            className="p-4 cursor-pointer"
            onClick={() => handleWorkflowSelect(workflow.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e: React.KeyboardEvent<HTMLDivElement>) => (e.key === 'Enter' || e.key === ' ') && handleWorkflowSelect(workflow.id)} // Added type for event
            aria-label={`Select workflow ${workflow.name}`}
          >
            <h3 className="text-lg font-semibold mb-1">{workflow.name}</h3>
            <p className="text-sm text-muted-foreground truncate">{workflow.description || 'No description available.'}</p>
          </div>
          {/* Delete Button - appears on hover or focus */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
            onClick={(e) => handleDeleteClick(workflow.id, e)}
            aria-label={`Delete workflow ${workflow.name}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              workflow and all associated executions and snapshots.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setWorkflowToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Component to display and edit workflow details
const WorkflowDetailEditor = ({ workflowId }: { workflowId: string }) => {
  // Use the correct hook - Pass only workflowId
  const { data: workflow, isLoading: isLoadingWorkflow, error: workflowError, refetch: refetchWorkflow } = useGetWorkflowDetail(workflowId);
  const { mutate: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();
  const { toast } = useToast();

  // State for editable fields
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // State for managing UI components visibility and context
  const [activeStageId, setActiveStageId] = useState<string | null>(null);
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  // Fetch execution logs when overlay is open and execution ID exists
  // Corrected: Pass only currentExecutionId and options object
  const { data: executionLogs, isLoading: isLoadingLogs, error: logsError, refetch: refetchLogs } = useGetExecutionLogs(currentExecutionId, {
    enabled: !!currentExecutionId && isOverlayOpen,
  });

  // Hook for starting execution
  const { mutate: startExecution, isPending: isStartingExecution } = useStartExecution();

  // Effect to update local state when workflow data loads
  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description ?? '');
      // Set initial active stage (e.g., the first one)
      if (workflow.stages && workflow.stages.length > 0 && !activeStageId) {
        setActiveStageId(workflow.stages[0].id);
      }
      // TODO: Potentially load the latest execution ID for this workflow automatically?
      // For now, execution needs to be started manually.
      setCurrentExecutionId(null); // Reset execution on workflow change
      setIsOverlayOpen(false); // Close overlay on workflow change
    }
  }, [workflow, activeStageId]); // Added activeStageId dependency

  // Effect to update active stage based on logs (if overlay is open)
  useEffect(() => {
    if (isOverlayOpen && executionLogs && executionLogs.length > 0) {
      const latestLog = executionLogs[executionLogs.length - 1];
      if (latestLog.stageId && latestLog.stageId !== activeStageId) {
        setActiveStageId(latestLog.stageId);
      }
      // Keep currentExecutionId consistent with the logs being viewed
      if (latestLog.executionId && latestLog.executionId !== currentExecutionId) {
         // This might happen if logs update reveals a different execution
         // Decide if we should switch context or stick to the manually started one.
         // For now, let's stick to the one we started/selected.
         // setCurrentExecutionId(latestLog.executionId);
      }
    }
  }, [executionLogs, isOverlayOpen, activeStageId, currentExecutionId]);

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setName(event.target.value);
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const handleSaveChanges = () => {
    if (!workflow) return;
    updateWorkflow(
      { workflowId: workflow.id, data: { name, description } },
      {
        onSuccess: () => {
          toast({ title: 'Workflow Updated', description: 'Changes saved successfully.' });
          refetchWorkflow(); // Refetch workflow details after update
        },
        onError: (err: unknown) => {
          toast({
            title: 'Update Failed',
            description: (err instanceof Error ? err.message : String(err)) || 'Could not save changes.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const handleStartExecution = () => {
    if (!workflowId) {
      toast({ title: "Error", description: "Workflow ID is missing.", variant: "destructive" });
      return;
    }
    // TODO: Implement UI to collect initial inputs if needed (Phase 3, Item 5)
    const initialInputs = {}; // Placeholder
    console.log(`Starting execution for workflow ${workflowId}`);
    startExecution(
      { workflowId: workflowId, inputs: initialInputs },
      {
        onSuccess: (execution: ExecutionSummary) => {
          toast({ title: "Execution Started", description: `Workflow execution ${execution.id} initiated.` });
          console.log(`Workflow execution ${execution.id} initiated.`);
          setCurrentExecutionId(execution.id); // Set the new execution ID
          setActiveStageId(workflow?.stages?.[0]?.id ?? null); // Reset to first stage on new execution
          setIsOverlayOpen(true); // Open the overlay automatically
          refetchLogs(); // Fetch logs for the new execution
        },
        onError: (startError: unknown) => {
          toast({ title: "Execution Failed", description: `Could not start workflow: ${(startError instanceof Error ? startError.message : String(startError))}`, variant: "destructive" });
          console.error(`Could not start workflow: ${startError}`);
        }
      }
    );
  };

  const handleStageSelect = (stageId: string) => {
    setActiveStageId(stageId);
  };

  const handleTriggerSnapshotDrawer = () => {
    console.log('[Phase 1.3] Opening HybridThinkDrawer from StageController.');
    setIsDrawerOpen(true);
  };

  const handleToggleOverlay = () => {
    if (!currentExecutionId) {
        toast({ title: "No Active Execution", description: "Start an execution to view its progress.", variant: "warning" });
        return;
    }
    setIsOverlayOpen(!isOverlayOpen);
  };

  // Find the active stage object based on activeStageId
  const activeStage = workflow?.stages?.find(s => s.id === activeStageId);

  // Find the latest log entry for the currently active stage
  const latestLogForStage = executionLogs?.slice().reverse().find(log => log.stageId === activeStageId);

  // Find the latest log entry overall for the current execution
  const latestLogForWorkflow = executionLogs?.[executionLogs.length - 1];

  if (isLoadingWorkflow) {
    return (
      <div className="space-y-4 p-4 border rounded-lg">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-1/4" />
        <Skeleton className="h-40 w-full" /> {/* Placeholder for stepper/controller */}
      </div>
    );
  }

  if (workflowError) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
        <p className="font-semibold">Error loading workflow details:</p>
        <p className="text-sm">{(workflowError instanceof Error ? workflowError.message : String(workflowError)) || 'An unknown error occurred.'}</p>
      </div>
    );
  }

  if (!workflow) {
    return <div className="p-4 text-center text-muted-foreground">Select a workflow to see details.</div>;
  }

  return (
    <div className="space-y-6 p-4 border rounded-lg shadow-sm">
      {/* Workflow Header and Edit Section */}
      <div>
        <div className="flex justify-between items-start mb-4">
          <div>
            <Label htmlFor="workflowName" className="text-xs text-muted-foreground">Workflow Name</Label>
            <Input
              id="workflowName"
              value={name}
              onChange={handleNameChange}
              className="text-xl font-semibold p-1 border-b border-transparent focus:border-primary transition-colors"
              disabled={isUpdating}
            />
          </div>
          <div className="flex items-center space-x-2">
             <Button onClick={handleSaveChanges} disabled={isUpdating || (name === workflow.name && description === (workflow.description ?? ''))} size="sm">
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Saving...' : 'Save Changes'}
            </Button>
             <Button onClick={handleStartExecution} disabled={isStartingExecution || !!currentExecutionId} size="sm" variant="default">
              <Play className="h-4 w-4 mr-2" />
              {isStartingExecution ? 'Starting...' : (currentExecutionId ? 'Execution Running' : 'Start Execution')}
            </Button>
             <Button onClick={handleTriggerSnapshotDrawer} size="sm" variant="outline">
                <History className="h-4 w-4 mr-2" />
                Snapshots
            </Button>
             <Button onClick={handleToggleOverlay} size="sm" variant="outline" disabled={!currentExecutionId}>
                <Eye className="h-4 w-4 mr-2" />
                {isOverlayOpen ? 'Hide Progress' : 'Show Progress'}
            </Button>
          </div>
        </div>
        <div>
          <Label htmlFor="workflowDescription" className="text-xs text-muted-foreground">Description</Label>
          <Textarea
            id="workflowDescription"
            value={description}
            onChange={handleDescriptionChange}
            placeholder="Enter a description for this workflow..."
            className="mt-1"
            rows={2}
            disabled={isUpdating}
          />
        </div>
      </div>

      {/* Workflow Stepper - Conditionally render based on stages */}
      {workflow.stages && workflow.stages.length > 0 && (
        <WorkflowProgressStepper
          stages={workflow.stages}
          currentStageId={activeStageId} // Pass the active stage ID
          onStageSelect={handleStageSelect} // Allow clicking stages to select
          executionLogs={executionLogs ?? []} // Pass logs for status indicators
          currentExecutionId={currentExecutionId} // Pass current execution ID
        />
      )}

      {/* Stage Controller - Conditionally render based on active stage */}
      {activeStage ? (
        <StageController
          key={activeStage.id} // Ensure re-render when stage changes
          workflowId={workflow.id}
          stage={activeStage}
          currentExecutionId={currentExecutionId}
          onTriggerSnapshotDrawer={handleTriggerSnapshotDrawer}
          latestLogForStage={latestLogForStage} // Pass the specific log for this stage
        />
      ) : (
        <div className="text-center text-muted-foreground py-8">Select a stage or start an execution.</div>
      )}

      {/* Ghost Overlay for Execution Progress - Pass all required props */}
      <GhostOverlay
        isOpen={isOverlayOpen}
        onOpenChange={setIsOverlayOpen}
        workflowId={workflowId}
        currentExecutionId={currentExecutionId}
        executionLogs={executionLogs ?? []} // Pass logs
        isLoading={isLoadingLogs}
        error={logsError}
        stages={workflow.stages ?? []} // Pass stages for context
      />

      {/* HybridThink Drawer for Snapshots */}
      <HybridThinkDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        workflowId={workflowId} // Pass workflow ID for context
      />
    </div>
  );
};

// The actual page component using the GlobalLayout
export default function WorkflowExplorerPage() {
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);

  return (
    <GlobalLayout>
      <div className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left Column: Workflow List */}
          <div className="md:col-span-1">
            <h2 className="text-2xl font-semibold mb-4">Workflows</h2>
            <WorkflowExplorer />
          </div>

          {/* Right Column: Workflow Details and Controller */}
          <div className="md:col-span-2">
            <h2 className="text-2xl font-semibold mb-4">Workflow Details</h2>
            {activeWorkflowId ? (
              <WorkflowDetailEditor workflowId={activeWorkflowId} />
            ) : (
              <div className="p-6 border rounded-lg text-center text-muted-foreground bg-secondary/50">
                Select a workflow from the list to view its details and controls.
              </div>
            )}
          </div>
        </div>
      </div>
    </GlobalLayout>
  );
}