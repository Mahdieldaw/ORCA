// src/app/explorer/page.tsx
'use client'; // Add this if using Next.js App Router

import React, { useState } from 'react';
import { StageController } from '@/components/workflows/StageController'; // Adjust import path
import { HybridThinkDrawer } from '@/components/workflows/HybridThinkDrawer'; // Import the new drawer
import { GhostOverlay } from '@/components/workflows/GhostOverlay'; // Import the new overlay
import GlobalLayout from '@/components/layout/GlobalLayout'; // Adjust import path if needed
import { StageCard } from '@/components/workflows/StageCard'; // Adjust import path if needed
import { useGetWorkflows, useDeleteWorkflow } from '@/hooks/api/workflows'; // Import the hook to fetch and delete workflows
import { useWorkflowStore } from '@/store/workflowStore'; // Import the Zustand store
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state
import { Button } from '@/components/ui/button'; // Import Button
import { Trash2 } from 'lucide-react'; // Import Trash icon
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

  const handleStageClick = (workflowId: string) => {
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
          // Optionally refetch or invalidate queries here if not handled by the hook
          // refetch(); // Or use queryClient.invalidateQueries(['workflows'])
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
        <p>No workflows found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground mb-2">
        Select a workflow below to view its details or run it.
      </p>

      {workflows.map((workflow: ApiWorkflow) => (
        <div key={workflow.id} className="relative group">
          <StageCard
            stage={{
              id: workflow.id,
              name: workflow.name,
              description: workflow.description || 'No description available.',
            }}
            onClick={() => handleStageClick(workflow.id)}
          />
          {/* Delete Button - appears on hover or focus */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity"
            onClick={(e) => handleDeleteClick(workflow.id, e)}
            aria-label={`Delete workflow ${workflow.name}`}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
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
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// The actual page component using the GlobalLayout
export default function WorkflowExplorerPage() {
  // Get activeWorkflowId from the store
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for the drawer
  const [isOverlayOpen, setIsOverlayOpen] = useState(false); // State for the overlay

  // Placeholder state for the current execution context
  // In a real app, this would likely be set when an execution starts or is selected
  const [currentExecutionId, setCurrentExecutionId] = useState<string | null>('exec_placeholder_123'); // Example placeholder

  // Function to pass to the StageController to open the drawer
  const handleTriggerSnapshotDrawer = () => {
    console.log('[Phase 1] Opening HybridThinkDrawer from StageController.');
    setIsDrawerOpen(true);
  };
  return (
    <GlobalLayout>
       {/* Main content area */}
       <div className="container mx-auto p-4 md:p-6 lg:p-8">
         {/* Page Title */}
         <h1 className="text-2xl font-semibold mb-6">Workflow Explorer</h1> {/* Increased bottom margin */}

         {/* Conditionally render StageController or WorkflowExplorer */}
         {activeWorkflowId ? (
           <StageController
             activeWorkflowId={activeWorkflowId}
             onTriggerSnapshotDrawer={handleTriggerSnapshotDrawer}
           />
         ) : (
           <WorkflowExplorer />
         )}



         {/* Drawer Component - controlled by state, pass execution/stage context */}
         <HybridThinkDrawer
            isOpen={isDrawerOpen}
            onOpenChange={setIsDrawerOpen}
            executionId={currentExecutionId} // Pass current execution ID
            stageId={activeWorkflowId} // Pass active workflow ID as stage ID for now
         />

         {/* TEMPORARY: Button to toggle Ghost Overlay */}
         <div className="fixed bottom-4 left-4 z-40"> {/* Position away from overlay */}
           <button
             onClick={() => setIsOverlayOpen(!isOverlayOpen)}
             className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow-lg"
           >
             {isOverlayOpen ? 'Hide' : 'Show'} History Overlay
           </button>
         </div>
         {/* END TEMPORARY SECTION */}

         {/* Overlay Component - controlled by state, pass execution context */}
         <GhostOverlay
            isOpen={isOverlayOpen}
            onOpenChange={setIsOverlayOpen}
            executionId={currentExecutionId} // Pass current execution ID
         />

       </div>
     </GlobalLayout>
  );
}