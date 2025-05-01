// src/app/explorer/page.tsx
'use client'; // Add this if using Next.js App Router

import React, { useState } from 'react';
import { StageController } from '@/components/workflows/StageController'; // Adjust import path
import { HybridThinkDrawer } from '@/components/workflows/HybridThinkDrawer'; // Import the new drawer
import { GhostOverlay } from '@/components/workflows/GhostOverlay'; // Import the new overlay
import GlobalLayout from '@/components/layout/GlobalLayout'; // Adjust import path if needed
// Remove mock data import
// import { mockWorkflowStages, MockStage } from '@/data/mockWorkflows'; // Adjust import path if needed
import { StageCard } from '@/components/workflows/StageCard'; // Adjust import path if needed
import { useGetWorkflows } from '@/hooks/api/workflows'; // Import the hook to fetch workflows
import { useWorkflowStore } from '@/store/workflowStore'; // Import the Zustand store
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton for loading state

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
  // Fetch workflows using the custom hook
  const { data: workflows, isLoading, error } = useGetWorkflows();
  // Get the state setter from the Zustand store
  const setActiveWorkflowId = useWorkflowStore((state) => state.setActiveWorkflowId);

  // Updated click handler to use the global store
  const handleStageClick = (workflowId: string) => {
    console.log(`Workflow selected: ${workflowId}. Updating global state.`);
    setActiveWorkflowId(workflowId);
    // Navigation or other actions might happen here in the future
  };

  // Handle loading state
  if (isLoading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground mb-2">
          Loading workflows...
        </p>
        {/* Show skeleton loaders */}
        {[...Array(3)].map((_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-md" />
        ))}
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive text-destructive rounded-md">
        <p className="font-semibold">Error loading workflows:</p>
        <p className="text-sm">{(error as Error).message || 'An unknown error occurred.'}</p>
      </div>
    );
  }

  // Handle case where data is successfully fetched but empty
  if (!workflows || workflows.length === 0) {
    return (
      <div className="p-4 bg-secondary rounded-md text-secondary-foreground">
        <p>No workflows found.</p>
        {/* Optionally add a button or link to create a new workflow */}
      </div>
    );
  }

  // Render the list of workflows fetched from the API
  return (
    <div className="space-y-3"> {/* Use space-y for vertical spacing */}
      <p className="text-sm text-muted-foreground mb-2">
        Select a workflow below to view its details or run it.
      </p>

      {/* Render the list of stages from API data */}
      {workflows.map((workflow: ApiWorkflow) => (
        <StageCard
          key={workflow.id}
          // Adapt props based on your StageCard component and ApiWorkflow type
          stage={{ // Assuming StageCard expects an object with id, name, description
            id: workflow.id,
            name: workflow.name,
            description: workflow.description || 'No description available.',
            // Map other necessary fields if your StageCard requires them
          }}
          onClick={() => handleStageClick(workflow.id)} // Pass workflow ID to handler
        />
      ))}

      {/* Placeholder feedback area removed - state is now global */}
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