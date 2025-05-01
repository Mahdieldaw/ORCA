let's conclude Phase 1: UI-First Development. We've built the shells for WorkflowExplorer, StageController, HybridThinkDrawer, and GhostOverlay. Now, let's add the remaining specified components and final polish before moving to the backend.

Objective: Implement the final UI shells (PromptEditor, SnapshotRestoreModal, GlobalLayout structure confirmation) and perform a final review and polish pass on all Phase 1 components.

Assumed Setup: Same as before.

Instructions:

Step 1: Implement PromptEditor Component (Refinement of StageController's Textarea)

We already have a textarea in StageController. Let's refine this slightly, perhaps extracting it into its own component if it needs more complex features later (like syntax highlighting), but for Phase 1, enhancing the existing Textarea usage within StageController is sufficient.

Enhance StageController.tsx: Add slightly more detail or structure around the prompt area if desired. The current implementation using Label and Textarea is already quite standard. We can ensure it has appropriate accessibility attributes.

// src/components/workflows/StageController.tsx
// ... (imports)

export const StageController: React.FC<StageControllerProps> = ({ /* ...props */ }) => {
  const [prompt, setPrompt] = useState(initialStageData.promptTemplate);
  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => { /* ... */ };

  return (
    <Card className="w-full">
      {/* ... CardHeader ... */}
      <CardContent className="space-y-4">
        {/* Prompt Editor Section */}
        <div className="space-y-1.5"> {/* Added for better spacing */}
          <Label htmlFor={`prompt-${initialStageData.id}`} className="text-sm font-medium">
            Prompt Template
          </Label>
          <Textarea
            id={`prompt-${initialStageData.id}`}
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter your prompt template here. Use {{variable}} for placeholders."
            className="min-h-[150px] font-mono text-xs resize-y" // Added resize-y
            aria-label="Prompt template editor" // Accessibility
            aria-describedby={`prompt-hint-${initialStageData.id}`} // Accessibility
          />
          <p id={`prompt-hint-${initialStageData.id}`} className="text-xs text-muted-foreground">
            Use {'{{variable_name}}'} syntax for dynamic inputs.
          </p>
        </div>
        {/* ... Validation Status ... */}
        {/* ... Controls ... */}
      </CardContent>
    </Card>
  );
};


(Self-correction: Extracting to a dedicated <PromptEditor> component might be overkill for Phase 1 unless advanced features like variable highlighting were needed immediately. Enhancing the existing structure is sufficient.)

Step 2: Implement SnapshotRestoreModal Component Shell

This modal would likely appear when a user clicks "Restore" or "Load" on a snapshot (e.g., from the HybridThinkDrawer or GhostOverlay).

Create a new file: src/components/workflows/SnapshotRestoreModal.tsx

Paste the following code:

// src/components/workflows/SnapshotRestoreModal.tsx
'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger, // Trigger would be placed elsewhere
} from "@/components/ui/alert-dialog"; // Using AlertDialog for confirmation
import { Button } from '@/components/ui/button';
import { MockSnapshot } from '@/data/mockWorkflows'; // Adjust path

interface SnapshotRestoreModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  snapshotToRestore: MockSnapshot | null; // Pass the specific snapshot data
  onConfirmRestore: (snapshotId: string) => void; // Action on confirmation
}

export const SnapshotRestoreModal: React.FC<SnapshotRestoreModalProps> = ({
  isOpen,
  onOpenChange,
  snapshotToRestore,
  onConfirmRestore
}) => {
  if (!snapshotToRestore) return null; // Don't render if no snapshot is selected

  const handleConfirm = () => {
    console.log(`[Phase 1 Placeholder] Confirmed restore for snapshot: ${snapshotToRestore.id}`);
    onConfirmRestore(snapshotToRestore.id);
    // In Phase 3, this would trigger backend logic to load the snapshot data
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      {/* AlertDialogTrigger would be placed on the 'Restore' buttons in the Drawer/Overlay */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Restore Snapshot?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to restore the workflow state from the snapshot
            named "<span className="font-semibold">{snapshotToRestore.name}</span>"?
            Any unsaved changes in the current editor might be lost.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Restore Snapshot
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Integration (Conceptual for Phase 1): You don't need to fully wire this up yet, but understand that the SnapshotEntry component within HybridThinkDrawer and GhostOverlay would need modification later to:

Receive an onTriggerRestore: (snapshot: MockSnapshot) => void prop.

When its "Restore" or main body is clicked, call onTriggerRestore(snapshot).

The parent page (explorer or eventually the main app layout) would manage the state for isRestoreModalOpen and selectedSnapshotForRestore, passing them to <SnapshotRestoreModal>.

Step 3: Confirm GlobalLayout Structure and Navigation

Review the existing GlobalLayout component.

Ensure Structure: Verify it provides distinct areas for navigation (Top/Side Nav) and main page content (children).

Basic Navigation: Ensure placeholder links/navigation items exist for the main routes: /explorer, /library (for snapshots/templates), /settings. These don't need functional pages behind them yet, but the nav elements should be present.

// src/components/layout/GlobalLayout.tsx (Example Structure)
import React from 'react';
import Link from 'next/link';
// import Navbar from './Navbar'; // Your Nav component

interface GlobalLayoutProps {
  children: React.ReactNode;
}

const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Example Header/Navbar */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <nav className="container h-14 flex items-center justify-between">
           <Link href="/explorer" className="font-bold">HybridThinking</Link>
           <div className="flex items-center space-x-4">
             <Link href="/explorer" className="text-sm hover:underline">Explorer</Link>
             <Link href="/library" className="text-sm hover:underline text-muted-foreground">[Library]</Link>
             <Link href="/settings" className="text-sm hover:underline text-muted-foreground">[Settings]</Link>
             {/* Ghost Overlay Trigger could live here */}
           </div>
        </nav>
      </header>

      {/* Main Content Area */}
      <main className="flex-1">
        {children}
      </main>

      {/* Optional Footer */}
      <footer className="py-4 border-t">
        <div className="container text-center text-xs text-muted-foreground">
          Hybrid Thinking MVP - Phase 1 UI Shell
        </div>
      </footer>
    </div>
  );
};

export default GlobalLayout;
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Step 4: Final Polish and Review Pass (Phase 1)

Perform a quick review across all components created in Phase 1 (WorkflowExplorer, StageCard, StageController, HybridThinkDrawer, GhostOverlay, SnapshotRestoreModal, GlobalLayout):

Consistency:

Are font sizes, padding, margins, button styles generally consistent? (Leverage Tailwind/shadcn defaults).

Is the visual language (icons, badges, colors for status) used consistently?

Responsiveness:

Briefly check each component/page layout at different screen widths (mobile, tablet, desktop). Ensure content doesn't break or become unusable. Add basic responsive classes (md:, lg:) where needed (e.g., grid layouts, drawer widths).

Accessibility (Basic):

Are interactive elements (buttons, cards acting as buttons) focusable via keyboard (tabIndex={0})?

Do they have basic aria-label attributes where text content might not be sufficient?

Are label elements correctly associated with input/textarea using htmlFor/id?

Placeholder Clarity:

Are all placeholder actions clearly logged to the console?

Is mock data clearly identifiable and sufficient to render the UI structure?

Console Errors: Do a final check for any console warnings or errors in the browser dev tools.

Clean Code: Remove any temporary testing code (like the hardcoded rendering of StageController on the explorer page, unless you want to keep it behind a dev flag).

To clean up the temporary dev preview:

Remove the state const [showControllerForDev, setShowControllerForDev] = useState(true); from explorer page.

Remove the hr, h2, toggle button, and the conditional rendering block for StageController from the explorer page's return statement. The StageController will eventually be rendered dynamically based on user interaction in Phase 3.

Phase 1 Conclusion & Acceptance Criteria Check:

✅ Global Acceptance:

No console errors (verify).

Placeholder data populates all components (verify visually).

Responsive layouts checked (basic verification).

Interactive elements provide console log feedback (verify clicks).

Consistent use of design primitives (relies on Tailwind/shadcn setup).

✅ Workflow Explorer (/explorer): Completed and verified in previous steps.

✅ Stage Controller: Shell implemented, editable prompt works, validation status shows mock indicators, retry disabled, snapshot save triggers drawer (placeholder action).

✅ Hybrid Think Panel (Drawer): Drawer shell implemented, shows mock snapshots, save button logs action.

✅ Ghost Overlay: Dialog shell implemented, tabs work, shows mock history/snapshots, placeholder inject/view actions log messages.

✅ Navigation & Layout: GlobalLayout structure confirmed with placeholder nav links for core routes. Layout responsive (basic check).

✅ SnapshotRestoreModal: Alert dialog shell implemented (integration deferred).

✅ PromptEditor: Integrated within StageController.

Phase 1 UI shell implementation is now complete. All specified components have visual structures populated with mock data and placeholder interactions. The application structure is established, user flows can be visualized, and the UI is ready for backend integration in subsequent phases. Proceed to Phase 2 when ready.