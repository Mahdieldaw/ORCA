// src/app/explorer/page.tsx
'use client'; // Add this if using Next.js App Router

import React, { useState, useEffect } from 'react'; // Added useEffect
import { StageController } from '@/components/workflows/StageController'; // Adjust import path
import { HybridThinkDrawer } from '@/components/workflows/HybridThinkDrawer'; // Import the new drawer
import { GhostOverlay } from '@/components/workflows/GhostOverlay'; // Import the new overlay
import GlobalLayout from '@/components/layout/GlobalLayout'; // Adjust import path if needed
import { StageCard } from '@/components/workflows/StageCard'; // Adjust import path if needed
// Updated imports for workflow hooks
import { useGetWorkflows, useDeleteWorkflow, useGetWorkflowDetail, useUpdateWorkflow } from '@/hooks/useWorkflows';
import { useWorkflowStore } from '@/store/workflowStore'; // Import the Zustand store
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state
import { Button } from '@/components/ui/button'; // Import Button
import { Input } from '@/components/ui/input'; // Import Input
import { Textarea } from '@/components/ui/textarea'; // Import Textarea
import { Label } from '@/components/ui/label'; // Import Label
import { Trash2, Save, Play } from 'lucide-react'; // Import Trash, Save, Play icons
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
import { WorkflowDetail, Stage, ExecutionLog } from '@/services/apiClient'; // Import API types
import { useGetExecutionLogs, useStartWorkflowExecution } from '@/hooks/useExecutions'; // Import hook for logs & starting execution
import { WorkflowProgressStepper } from '@/components/workflows/WorkflowProgressStepper'; // Import the stepper
import { StartExecutionModal } from '@/components/workflows/StartExecutionModal'; // Import the new modal

// Define a type for the workflow data expected from the API
// Adjust this based on the actual API response structure
interface ApiWorkflow {
  id: string;
  name: string;
  description?: string; // Optional description
  // Add other relevant fields from your API response
}


// Internal WorkflowExplorer component for this page
const WorkflowExplorer = () => {
  const { data: workflows, isLoading, error, refetch } = useGetWorkflows();
  const setActiveWorkflowId = useWorkflowStore((state) => state.setActiveWorkflowId);
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
  const handleDeleteClick = (workflowId: string, event: React.MouseEvent) => {
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
          // Invalidate queries handled by the hook
        },
        onError: (err) => {
          toast({
            title: 'Error Deleting Workflow',
            description: (err as Error)?.message || 'Could not delete the workflow.',
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
        <p className="text-sm">{(error as Error).message || 'An unknown error occurred.'}</p>
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
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleWorkflowSelect(workflow.id)}
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
  const { data: workflow, isLoading, error } = useGetWorkflowDetail(workflowId);
  const { mutate: updateWorkflow, isPending: isUpdating } = useUpdateWorkflow();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
    }
  }, [workflow]);

  const handleSave = () => {
    if (!workflow) return;
    updateWorkflow(
      { workflowId: workflow.id, data: { name, description } },
      {
        onSuccess: (updatedData) => {
          toast({ title: 'Workflow Updated', description: `"${updatedData.name}" saved successfully.` });
        },
        onError: (err) => {
          toast({ title: 'Update Failed', description: (err as Error)?.message || 'Could not save workflow.', variant: 'destructive' });
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4 mb-6 p-4 border rounded-lg">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-10 w-24" />
      </div>
    );
  }

  if (error) {
    return <p className="text-destructive mb-4">Error loading workflow details: {(error as Error).message}</p>;
  }

  if (!workflow) {
    return <p className="text-muted-foreground mb-4">Workflow details not found.</p>;
  }

  const isChanged = name !== workflow.name || description !== (workflow.description || '');

  return (
    <div className="mb-6 p-4 border rounded-lg space-y-4 bg-card">
      <div className="space-y-2">
        <Label htmlFor="workflow-name">Workflow Name</Label>
        <Input
          id="workflow-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isUpdating}
          className="text-lg font-semibold"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="workflow-description">Description</Label>
        <Textarea
          id="workflow-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isUpdating}
          placeholder="Enter a description for this workflow..."
          rows={3}
        />
      </div>
      <Button onClick={handleSave} disabled={isUpdating || !isChanged}>
        <Save className="mr-2 h-4 w-4" />
        {isUpdating ? 'Saving...' : 'Save Changes'}
      </Button>
    </div>
  );
};

// Component to display the active workflow's details and stages
const ActiveWorkflowView = ({ workflowId, currentExecutionId }: { workflowId: string; currentExecutionId: string | null }) => { // Added currentExecutionId prop
  const { data: workflowDetail, isLoading, error, refetch: refetchDetail } = useGetWorkflowDetail(workflowId);
  const { data: logs, isLoading: isLoadingLogs, error: logsError } = useGetExecutionLogs(currentExecutionId!, {
    enabled: !!currentExecutionId, // Only fetch if executionId is present
    refetchInterval: 5000, // Optional: Refetch logs periodically
  });
  const [activeStage, setActiveStage] = useState<Stage | null>(null);
  const [isStartModalOpen, setIsStartModalOpen] = useState(false); // State for the modal
  const { mutate: startExecution, isPending: isStartingExecution } = useStartWorkflowExecution(); // Hook to start execution
  const { toast } = useToast(); // Hook for showing toasts
  const { setCurrentExecutionId } = useWorkflowStore(); // Get setter for execution ID from store

  // Refetch detail when workflowId changes
  useEffect(() => {
    setActiveStage(null); // Reset active stage when workflow changes
    refetchDetail();
  }, [workflowId, refetchDetail]);

  if (isLoading) {
    return (
      <div className="p-4 border rounded-lg">
        <Skeleton className="h-8 w-3/4 mb-4" />
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-6 w-full" />
        <div className="mt-6 space-y-4">
            <Skeleton className="h-6 w-1/4 mb-2" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
        <p className="font-semibold">Error loading workflow details:</p>
        <p className="text-sm">{(error as Error).message || 'An unknown error occurred.'}</p>
      </div>
    );
  }

  if (!workflowDetail) {
    return <div className="p-4 border rounded-lg text-muted-foreground">Select a workflow to see details.</div>;
  }

  // Handler for submitting inputs from the modal
  const handleSubmitInputs = (inputs: Record<string, any>) => {
    console.log(`Starting execution for workflow ${workflowId} with inputs:`, inputs);
    startExecution({ workflowId: workflowId, inputs: inputs }, {
      onSuccess: (execution) => {
        toast({ title: "Execution Started", description: `Workflow execution ${execution.id} initiated.` });
        setCurrentExecutionId(execution.id); // Update global state with the new execution ID
        setIsStartModalOpen(false); // Close modal on success
        // Optionally refetch logs or workflow details if needed
      },
      onError: (startError) => {
        toast({ title: "Execution Failed", description: `Could not start workflow: ${(startError as Error).message}`, variant: "destructive" });
        // Keep modal open on error
      }
    });
  };

  // Find the latest log for the currently active stage
  const latestLogForActiveStage = activeStage && logs
    ? logs
        .filter(log => log.stageId === activeStage.id)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0]
    : null;

  return (
    <div className="p-4 border rounded-lg">
      {/* Add Start Execution Button if no execution is active and stages exist */}
      {!currentExecutionId && workflowDetail?.stages && workflowDetail.stages.length > 0 && (
        <Button onClick={() => setIsStartModalOpen(true)} className="mb-4">
          <Play className="mr-2 h-4 w-4" />
          Start Execution
        </Button>
      )}
      <WorkflowDetailEditor workflowId={workflowId} />

      {/* Workflow Progress Stepper - Display if stages exist */}
      {workflowDetail.stages && workflowDetail.stages.length > 0 && (
        <WorkflowProgressStepper
          stages={workflowDetail.stages}
          logs={logs}
          currentStageId={activeStage?.id} // Highlight the active stage in the stepper
        />
      )}

      {/* Display Loading/Error for Logs */}
      {isLoadingLogs && <p className="text-sm text-muted-foreground my-2">Loading execution logs...</p>}
      {logsError && <p className="text-sm text-destructive my-2">Error loading logs: {logsError.message}</p>}

      {/* Stage Listing Section */}
      <div className="mt-6 space-y-4">
        <h3 className="text-lg font-semibold">Stages</h3>
        {workflowDetail.stages && workflowDetail.stages.length > 0 ? (
          workflowDetail.stages.map((stage) => (
            <StageCard
              key={stage.id}
              stage={stage}
              workflowId={workflowId} // Pass workflowId
              onClick={() => setActiveStage(stage)} // Set the clicked stage as active
              // No onDelete needed here, StageCard handles its own delete
            />
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No stages defined for this workflow yet.</p>
        )}
        {/* TODO: Add Button/Mechanism to create a new stage */}
      </div>

      {/* Stage Controller Section - Renders when a stage is active */}
      {activeStage && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Stage Configuration: {activeStage.name}</h3>
          <StageController
            stage={activeStage}
            workflowId={workflowId}
            currentExecutionId={currentExecutionId} // Pass current execution ID
            latestLogForStage={latestLogForActiveStage} // Pass the latest log for this stage
            // TODO: Pass onTriggerSnapshotDrawer if needed
            onTriggerSnapshotDrawer={() => console.log('Trigger snapshot drawer from StageController')} // Placeholder
            // onSaveSuccess is not a prop of StageController, remove or handle differently
            /* onSaveSuccess={() => {
              setActiveStage(null); // Optionally close controller on save
              refetchDetail(); // Refetch details to show updated stage list/data
            }} */
            // onCancel is not a prop of StageController, remove or handle differently
            // onCancel={() => setActiveStage(null)} // Close controller on cancel
          />
        </div>
      )}

      {/* Render the Start Execution Modal */}
      <StartExecutionModal
        isOpen={isStartModalOpen}
        onOpenChange={setIsStartModalOpen}
        workflowId={workflowId}
        workflowName={workflowDetail?.name || 'Workflow'}
        onSubmit={handleSubmitInputs}
        isStartingExecution={isStartingExecution}
      />
    </div>
  );
};


// The actual page component using the GlobalLayout
export default function WorkflowExplorerPage() {
  // Get activeWorkflowId from the store
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);
  const setActiveWorkflowId = useWorkflowStore((state) => state.setActiveWorkflowId); // Get setter
  // const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State moved to ActiveWorkflowView
  const [isOverlayOpen, setIsOverlayOpen] = useState(false); // State for the overlay

  // Placeholder state for the current execution context
  // In a real app, this would likely be set when an execution starts or is selected
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>(null); // Start with null

  // Function to go back to the workflow list
  const handleGoBackToList = () => {
    setActiveWorkflowId(null);
    setCurrentExecutionId(null); // Also clear any active execution context
  };

  return (
    <GlobalLayout>
       {/* Main content area */}
       <div className="container mx-auto p-4 md:p-6 lg:p-8">
         {/* Page Title and Back Button */}
         <div className="flex items-center mb-6">
           {activeWorkflowId && (
             <Button variant="outline" size="sm" onClick={handleGoBackToList} className="mr-4">
               &larr; Back to List
             </Button>
           )}
           <h1 className="text-2xl font-semibold">
             {activeWorkflowId ? 'Workflow Details' : 'Workflow Explorer'}
           </h1>
         </div>

         {/* Conditionally render ActiveWorkflowView or WorkflowExplorer list */}
         {activeWorkflowId ? (
           <ActiveWorkflowView workflowId={activeWorkflowId} currentExecutionId={currentExecutionId} /> // Pass currentExecutionId
         ) : (
           <WorkflowExplorer />
         )}

         {/* Overlay for Execution History - Rendered conditionally based on isOverlayOpen */}
         {/* Assuming GhostOverlay needs an executionId */}
         {currentExecutionId && (
           <GhostOverlay
             isOpen={isOverlayOpen}
             onOpenChange={setIsOverlayOpen} // Corrected prop name
             executionId={currentExecutionId}
           />
         )}
       </div>
    </GlobalLayout>
  );
}
