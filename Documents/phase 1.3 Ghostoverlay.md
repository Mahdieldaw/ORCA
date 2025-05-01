proceed with the next components specified for Phase 1: the HybridThinkDrawer (referred to as "Hybrid Think Panel" previously) and the GhostOverlay. We'll focus on creating their UI shells with static/mock data.

Objective: Implement the basic visual structure for the drawer/panel that holds advanced actions (like snapshots) and the overlay for contextual history, populating them with mock data.

Assumed Setup: Same as before. We'll use shadcn/ui's Sheet component for the drawer and potentially a Dialog or custom floating group for the overlay.

Instructions:

Step 1: Define Mock Data for Snapshots and History

Add more mock data structures and instances to src/data/mockWorkflows.ts.

// src/data/mockWorkflows.ts (Add these)

export interface MockSnapshot {
  id: string;
  name: string;
  timestamp: string; // Simple string for Phase 1
  type: 'workflow' | 'stage';
}

export interface MockHistoryItem {
  id: string;
  stageName: string;
  timestamp: string;
  status: 'completed' | 'error';
  summary: string; // Short summary of the execution log item
}

export const mockSnapshots: MockSnapshot[] = [
  { id: 'snap-1', name: 'Initial Blog Post Workflow v1', timestamp: '2023-10-26 10:00', type: 'workflow' },
  { id: 'snap-2', name: 'Summarization Stage (Claude)', timestamp: '2023-10-26 09:30', type: 'stage' },
  { id: 'snap-3', name: 'Validated JSON Structure', timestamp: '2023-10-25 15:00', type: 'stage' },
];

export const mockHistory: MockHistoryItem[] = [
  { id: 'hist-1', stageName: 'Ingest Document', timestamp: '2023-10-27 11:05', status: 'completed', summary: 'Loaded file: report.docx' },
  { id: 'hist-2', stageName: 'Summarize Content', timestamp: '2023-10-27 11:06', status: 'completed', summary: 'Generated 250-word summary.' },
  { id: 'hist-3', stageName: 'Validate JSON Output', timestamp: '2023-10-27 11:07', status: 'error', summary: 'Validation failed: Invalid format.' },
];


Step 2: Create the HybridThinkDrawer Component

This component will likely be triggered from other parts of the UI (like the "Save Snapshot" button in StageController). We'll use shadcn/ui's Sheet for the drawer effect.

Create a new file: src/components/workflows/HybridThinkDrawer.tsx

Paste the following code:

// src/components/workflows/HybridThinkDrawer.tsx
'use client';

import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetClose, // If needed for manual close
} from "@/components/ui/sheet"; // Assuming shadcn/ui
import { Button } from '@/components/ui/button';
import { mockSnapshots, MockSnapshot } from '@/data/mockWorkflows'; // Adjust path

interface HybridThinkDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // Add props later for context (e.g., current stage ID to save)
}

// Simple component to render a snapshot entry
const SnapshotEntry: React.FC<{ snapshot: MockSnapshot }> = ({ snapshot }) => {
  const handlePreview = () => console.log(`[Phase 1 Placeholder] Preview Snapshot: ${snapshot.id}`);
  const handleClick = () => console.log(`[Phase 1 Placeholder] Select/Load Snapshot: ${snapshot.id}`);

  return (
    <div
      className="flex justify-between items-center p-2 border rounded-md hover:bg-accent cursor-pointer"
      onClick={handleClick}
      onMouseEnter={handlePreview} // Simple hover feedback for now
      role="button"
      tabIndex={0}
      aria-label={`Snapshot: ${snapshot.name}`}
    >
      <div>
        <p className="text-sm font-medium">{snapshot.name}</p>
        <p className="text-xs text-muted-foreground">Type: {snapshot.type} | Saved: {snapshot.timestamp}</p>
      </div>
      {/* Placeholder for actions like 'Restore' or 'Delete' */}
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleClick(); }}>Select</Button>
    </div>
  );
};


export const HybridThinkDrawer: React.FC<HybridThinkDrawerProps> = ({ isOpen, onOpenChange }) => {

  const handleSaveNewSnapshot = () => {
     console.log('[Phase 1 Placeholder] Would trigger logic to save a new snapshot.');
     // In a real app, might involve getting name/description input first
     onOpenChange(false); // Close drawer after action
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]"> {/* Example widths */}
        <SheetHeader>
          <SheetTitle>Hybrid Think Panel</SheetTitle>
          <SheetDescription>
            Manage snapshots and advanced stage actions. (Mock data shown)
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-4">
          {/* Section for Saving Snapshots */}
          <div>
             <h3 className="text-sm font-semibold mb-2">Save Current State</h3>
             <Button onClick={handleSaveNewSnapshot} className="w-full">
               Save New Snapshot...
             </Button>
             {/* Add inputs for name/description here later */}
          </div>

          {/* Section for Existing Snapshots */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Existing Snapshots</h3>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2"> {/* Scrollable list */}
              {mockSnapshots.map((snap) => (
                <SnapshotEntry key={snap.id} snapshot={snap} />
              ))}
              {mockSnapshots.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No snapshots saved yet.</p>
              )}
            </div>
          </div>

        </div>

        <SheetFooter>
          {/* Footer actions if needed, e.g., a close button */}
          {/* <SheetClose asChild>
            <Button type="submit">Close</Button>
          </SheetClose> */}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Step 3: Integrate and Trigger the HybridThinkDrawer

We need a way to open this drawer. Let's modify the StageController's "Save Snapshot" button to control the drawer's state. This requires lifting the state up to the parent page (explorer page for now).

Modify the page file (src/pages/explorer.tsx or src/app/explorer/page.tsx):

// src/pages/explorer.tsx OR src/app/explorer/page.tsx
// ... (previous imports)
import { StageController } from '@/components/workflows/StageController';
import { HybridThinkDrawer } from '@/components/workflows/HybridThinkDrawer'; // Import the new drawer

// ... (WorkflowExplorer component definition)

// The actual page component using the GlobalLayout
export default function WorkflowExplorerPage() {
  const [showControllerForDev, setShowControllerForDev] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // State for the drawer

  // Function to pass to the StageController to open the drawer
  const handleTriggerSnapshotDrawer = () => {
    console.log('[Phase 1] Opening HybridThinkDrawer from StageController.');
    setIsDrawerOpen(true);
  };

  return (
    <GlobalLayout>
       <div className="container mx-auto p-4 md:p-6 lg:p-8">
         <h1 className="text-2xl font-semibold mb-6">Workflow Explorer</h1>
         <WorkflowExplorer />

         {/* TEMPORARY: Divider and Stage Controller */}
         <hr className="my-8" />
         <h2 className="text-xl font-semibold mb-4 text-muted-foreground">[Dev Preview] Stage Controller Shell</h2>
         <button onClick={() => setShowControllerForDev(!showControllerForDev)} className="text-xs mb-4 underline">
            {showControllerForDev ? 'Hide' : 'Show'} Dev Controller Preview
         </button>

         {showControllerForDev && (
            <div className="max-w-2xl mx-auto">
                {/* Pass the handler function */}
                <StageController onTriggerSnapshot={handleTriggerSnapshotDrawer} />
            </div>
         )}
         {/* END TEMPORARY SECTION */}

         {/* Drawer Component - controlled by state */}
         <HybridThinkDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} />

       </div>
     </GlobalLayout>
  );
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Step 4: Create the GhostOverlay Component Shell

This could be a modal (Dialog), a fixed floating element, or another Sheet. Let's use a Dialog for simplicity in Phase 1.

Create a new file: src/components/workflows/GhostOverlay.tsx

Paste the following code:

// src/components/workflows/GhostOverlay.tsx
'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger, // We'll trigger it from elsewhere
} from "@/components/ui/dialog"; // Assuming shadcn/ui
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"; // Assuming shadcn/ui
import { Button } from '@/components/ui/button';
import { mockHistory, MockHistoryItem, mockSnapshots, MockSnapshot } from '@/data/mockWorkflows'; // Adjust path
import { History, Save, Lightbulb } from 'lucide-react'; // Icons

interface GhostOverlayProps {
   isOpen: boolean;
   onOpenChange: (isOpen: boolean) => void;
   // Props to pass context later, e.g., current workflow ID
}

// Simple component for History items
const HistoryEntry: React.FC<{ item: MockHistoryItem }> = ({ item }) => {
   const handleClick = () => console.log(`[Phase 1 Placeholder] View History Detail: ${item.id}`);
   return (
     <div className="p-2 border rounded-md text-xs mb-2 cursor-pointer hover:bg-accent" onClick={handleClick} role="button" tabIndex={0}>
       <p className="font-medium">{item.stageName} <span className={`ml-2 text-${item.status === 'completed' ? 'green' : 'red'}-600`}>({item.status})</span></p>
       <p className="text-muted-foreground">{item.timestamp}</p>
       <p className="mt-1">{item.summary}</p>
     </div>
   );
};

// Re-use SnapshotEntry from HybridThinkDrawer or define similarly
const SnapshotEntry: React.FC<{ snapshot: MockSnapshot }> = ({ snapshot }) => {
   const handlePreview = () => console.log(`[Phase 1 Placeholder] Preview Snapshot: ${snapshot.id}`);
   const handleClick = () => console.log(`[Phase 1 Placeholder] Select/Inject Snapshot: ${snapshot.id}`);
   return (
      <div className="p-2 border rounded-md text-xs mb-2 cursor-pointer hover:bg-accent" onClick={handleClick} role="button" tabIndex={0}>
        <p className="font-medium">{snapshot.name}</p>
        <p className="text-muted-foreground">Type: {snapshot.type} | Saved: {snapshot.timestamp}</p>
        {/* Placeholder inject button */}
        <Button variant="ghost" size="xs" className="mt-1 h-6" onClick={(e)=>{e.stopPropagation(); console.log(`[Phase 1 Placeholder] Injecting from ${snapshot.id}`)}}>
            <Lightbulb className="h-3 w-3 mr-1"/> Inject
        </Button>
      </div>
   );
};


export const GhostOverlay: React.FC<GhostOverlayProps> = ({ isOpen, onOpenChange }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* DialogTrigger would normally be placed elsewhere, e.g., an icon button */}
      {/* <DialogTrigger asChild>
         <Button variant="outline">Open Ghost Overlay</Button>
      </DialogTrigger> */}
      <DialogContent className="sm:max-w-[600px]"> {/* Example width */}
        <DialogHeader>
          <DialogTitle>Ghost Overlay</DialogTitle>
          <DialogDescription>
            Access past executions and snapshots for context and reuse. (Mock data shown)
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="history" className="w-full mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="history"><History className="h-4 w-4 mr-2 inline-block"/>Past Executions</TabsTrigger>
            <TabsTrigger value="snapshots"><Save className="h-4 w-4 mr-2 inline-block"/>Snapshots</TabsTrigger>
          </TabsList>

          <TabsContent value="history" className="mt-4 max-h-[50vh] overflow-y-auto pr-2">
             {mockHistory.map(item => <HistoryEntry key={item.id} item={item} />)}
             {mockHistory.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No execution history found.</p>}
          </TabsContent>

          <TabsContent value="snapshots" className="mt-4 max-h-[50vh] overflow-y-auto pr-2">
             {mockSnapshots.map(snap => <SnapshotEntry key={snap.id} snapshot={snap} />)}
             {mockSnapshots.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No snapshots found.</p>}
          </TabsContent>
        </Tabs>

      </DialogContent>
    </Dialog>
  );
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Step 5: Add Trigger for GhostOverlay

Add a simple button somewhere visible (e.g., in the GlobalLayout's header or temporarily on the explorer page) to open the Ghost Overlay dialog.

Modify the page file (src/pages/explorer.tsx or src/app/explorer/page.tsx):

// src/pages/explorer.tsx OR src/app/explorer/page.tsx
// ... (previous imports)
import { GhostOverlay } from '@/components/workflows/GhostOverlay'; // Import the overlay
import { Button } from '@/components/ui/button'; // Import Button
import { Ghost } from 'lucide-react'; // Icon for the button

// ... (WorkflowExplorer component definition)

// The actual page component using the GlobalLayout
export default function WorkflowExplorerPage() {
  const [showControllerForDev, setShowControllerForDev] = useState(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOverlayOpen, setIsOverlayOpen] = useState(false); // State for the overlay

  const handleTriggerSnapshotDrawer = () => {
    console.log('[Phase 1] Opening HybridThinkDrawer from StageController.');
    setIsDrawerOpen(true);
  };

  return (
    <GlobalLayout>
       <div className="container mx-auto p-4 md:p-6 lg:p-8">
         {/* Header Area */}
         <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Workflow Explorer</h1>
            {/* Button to trigger Ghost Overlay */}
            <Button variant="outline" size="icon" onClick={() => setIsOverlayOpen(true)} title="Open Ghost Overlay">
                <Ghost className="h-4 w-4" />
            </Button>
         </div>

         {/* Workflow Explorer (Stage List) */}
         <WorkflowExplorer />

         {/* TEMPORARY: Divider and Stage Controller */}
         {/* ... (StageController dev preview section as before) ... */}
         {showControllerForDev && (
            <div className="max-w-2xl mx-auto mt-8">
                <StageController onTriggerSnapshot={handleTriggerSnapshotDrawer} />
            </div>
         )}

         {/* Drawer Component */}
         <HybridThinkDrawer isOpen={isDrawerOpen} onOpenChange={setIsDrawerOpen} />

         {/* Overlay Component */}
         <GhostOverlay isOpen={isOverlayOpen} onOpenChange={setIsOverlayOpen} />

       </div>
     </GlobalLayout>
  );
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Step 6: Verification

Run the Next.js development server.

Navigate to /explorer.

Verify HybridThinkDrawer:

Click the "Save Snapshot" button inside the rendered StageController.

The HybridThinkDrawer slides open from the side (usually right).

It displays the title "Hybrid Think Panel".

It shows a "Save New Snapshot..." button. Clicking it logs a console message and closes the drawer.

It lists the 3 mock snapshots. Hovering/clicking logs console messages.

The list is scrollable if content exceeds height.

Closing the drawer (e.g., clicking outside) updates the state.

Verify GhostOverlay:

Click the new Ghost icon button in the page header.

The GhostOverlay dialog modal appears.

It displays the title "Ghost Overlay".

It has two tabs: "Past Executions" and "Snapshots".

The "Past Executions" tab shows the 3 mock history items. Clicking logs a message.

The "Snapshots" tab shows the 3 mock snapshot items. Clicking logs messages. Clicking the "Inject" button logs a message.

The content within the tabs is scrollable.

Closing the dialog (e.g., clicking the 'X' or outside) updates the state.

This completes the shell implementation for the HybridThinkDrawer and GhostOverlay as part of Phase 1.