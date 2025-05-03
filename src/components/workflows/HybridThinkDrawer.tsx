// src/components/workflows/HybridThinkDrawer.tsx
'use client';

import React, { useState } from 'react'; // Added useState
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose } from '@/components/ui/drawer'; // Combined imports
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, History, Trash2, Loader2, AlertTriangle, RotateCcw } from 'lucide-react'; // Combined imports, Added RotateCcw
import { useGetSnapshots, useRestoreSnapshot, useDeleteSnapshot, useCreateSnapshot } from '@/hooks/useSnapshots'; // Corrected import path for hooks
import { useToast } from '@/hooks/use-toast'; // Corrected import path for useToast
import { Input } from '@/components/ui/input'; // Added for snapshot name
import { SnapshotSummary } from '@/services/apiClient'; // Import type
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'; // Import AlertDialog
import { SnapshotRestoreModal } from './SnapshotRestoreModal'; // Import the modal

interface HybridThinkDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  // Removed executionId and stageId as they are less relevant for listing/restoring snapshots
  // We might need workflowId if snapshots are filtered by workflow
  workflowId: string | null; 
}

// Simple component to render a snapshot entry - Consider integrating actions directly below
const SnapshotEntry: React.FC<{ snapshot: SnapshotSummary }> = ({ snapshot }) => {
  // This component might become redundant if actions are handled in the main map
  return (
    <div
      className="flex justify-between items-center p-2 border rounded-md"
      role="listitem"
      aria-label={`Snapshot: ${snapshot.name}`}
    >
      <div>
        <p className="text-sm font-medium">{snapshot.name}</p>
        <p className="text-xs text-muted-foreground">Saved: {new Date(snapshot.createdAt).toLocaleString()}</p>
      </div>
      {/* Actions will be rendered in the main component's map */}
    </div>
  );
};


export const HybridThinkDrawer: React.FC<HybridThinkDrawerProps> = ({ isOpen, onOpenChange, workflowId }) => {
  // Fetch snapshots using the hook, conditionally enabled
  // Filter by workflowId if available
  const { data: snapshots, isLoading: isLoadingSnapshots, error: snapshotsError } = useGetSnapshots({
    workflowId: workflowId ?? undefined,
  }, {
    enabled: isOpen && !!workflowId, // Only fetch when the drawer is open and workflowId is present
  });

  const { mutate: restoreSnapshot, isPending: isRestoring } = useRestoreSnapshot(); // Restore hook
  const { mutate: deleteSnapshot, isPending: isDeleting } = useDeleteSnapshot(); // Delete hook
  const createSnapshotMutation = useCreateSnapshot(); // Create hook
  const { toast } = useToast(); // Toast hook

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<SnapshotSummary | null>(null);
  
  // State for restore confirmation modal
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [snapshotToRestore, setSnapshotToRestore] = useState<SnapshotSummary | null>(null);

  const [newSnapshotName, setNewSnapshotName] = React.useState('');

  // Handle opening delete confirmation
  const handleDeleteClick = (snapshot: SnapshotSummary) => {
    setSnapshotToDelete(snapshot);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirming deletion
  const handleConfirmDelete = () => {
    if (!snapshotToDelete) return;

    console.log(`Deleting snapshot ${snapshotToDelete.id}`);
    // Assuming deleteSnapshot hook now only needs snapshotId
    deleteSnapshot(snapshotToDelete.id); // Callbacks are handled by the useDeleteSnapshot hook
  };

  // Handle opening the restore confirmation modal
  const handleRestoreClick = (snapshot: SnapshotSummary) => {
    setSnapshotToRestore(snapshot);
    setIsRestoreModalOpen(true);
  };

  // Handle confirming the restore action (called by the modal)
  const handleConfirmRestore = (snapshotId: string) => {
    console.log(`Restoring snapshot ${snapshotId}`);
    restoreSnapshot(snapshotId); // Callbacks are handled by the useRestoreSnapshot hook
  };

  // Handle saving a new snapshot
  const handleSaveNewSnapshot = () => {
    // Saving snapshot might need more context (current execution/stage) - Revisit this logic
    // For now, let's assume it needs workflowId and maybe some placeholder state
    if (!workflowId || !newSnapshotName.trim()) {
      toast({ title: "Missing Information", description: "Workflow context and snapshot name are required.", variant: "warning" });
      return;
    }
    console.log(`Attempting to save snapshot: ${newSnapshotName} for workflow ${workflowId}`);

    // TODO: Define the actual 'stateData' to be saved.
    // This likely needs to come from the currently active stage/editor state, not the drawer itself.
    const placeholderStateData = {
      // prompt: (document.getElementById(`prompt-${stageId}`) as HTMLTextAreaElement)?.value || '', // Example - Needs context
      timestamp: new Date().toISOString(),
      comment: 'State saved from drawer (placeholder)',
    };

    // TODO: Need to pass executionId and stageId to createSnapshotMutation.mutate
    // The current context (workflowId) doesn't match the required parameters.
    // createSnapshotMutation.mutate(
    //   {
    //     // workflowId: workflowId, // Incorrect parameter
    //     executionId: "PLACEHOLDER_EXECUTION_ID", // Need actual executionId from context
    //     stageId: "PLACEHOLDER_STAGE_ID", // Need actual stageId from context
    //     name: newSnapshotName.trim(),
    //     stateData: placeholderStateData, // Replace with actual state data
    //   },
    //   {
    //     onSuccess: () => {
    //       toast({ title: "Snapshot Saved", description: `Snapshot '${newSnapshotName.trim()}' saved.` });
    //       setNewSnapshotName(''); // Clear input
    //     },
    //     onError: (error) => {
    //       toast({ title: "Save Failed", description: (error as Error)?.message || 'Could not save snapshot.', variant: "destructive" });
    //     },
    //   }
    // );
    console.warn("Snapshot creation disabled: Missing executionId and stageId context.");
    toast({ title: "Save Disabled", description: "Cannot save snapshot without execution/stage context.", variant: "warning" });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]"> {/* Example widths */}
        <SheetHeader>
          <SheetTitle>Workflow Snapshots</SheetTitle> {/* Updated Title */}
          <SheetDescription>
            Save or restore workflow states.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-6"> {/* Increased spacing */}
          {/* Section for Saving Snapshots - Only show if context is available */} 
          {workflowId && ( // Only show save if we have a workflow context
          <div>
             <h3 className="text-sm font-semibold mb-2">Save Current Workflow State</h3>
             <div className="flex space-x-2">
                <Input
                    type="text"
                    placeholder="Snapshot Name (e.g., 'Initial Setup')"
                    value={newSnapshotName}
                    onChange={(e) => setNewSnapshotName(e.target.value)}
                    className="flex-grow"
                    disabled={createSnapshotMutation.isPending}
                />
                <Button
                    onClick={handleSaveNewSnapshot}
                    disabled={!newSnapshotName.trim() || createSnapshotMutation.isPending}
                >
                    {createSnapshotMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : null}
                    Save
                </Button>
             </div>
             {createSnapshotMutation.isError && (
                <p className="text-xs text-destructive mt-1">
                    Error: {(createSnapshotMutation.error as Error)?.message || 'Could not save snapshot.'}
                </p>
             )}
             <p className="text-xs text-muted-foreground mt-1">Note: Saving captures the current workflow structure. Execution state saving needs context.</p>
          </div>
          )}

          {/* Section for Listing Snapshots */} 
          <div>
            <h3 className="text-sm font-semibold mb-2">Available Snapshots</h3>
            <ScrollArea className="h-[calc(100vh-300px)] pr-4"> {/* Adjust height as needed */} 
              {isLoadingSnapshots && (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              )}
              {snapshotsError && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error Loading Snapshots</AlertTitle>
                  <AlertDescription>{(snapshotsError as Error).message}</AlertDescription>
                </Alert>
              )}
              {!isLoadingSnapshots && !snapshotsError && (!snapshots || snapshots.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No snapshots found for this workflow.</p>
              )}
              {!isLoadingSnapshots && !snapshotsError && snapshots && snapshots.length > 0 && (
                <ul className="space-y-2">
                  {snapshots.map((snapshot) => (
                    <li key={snapshot.id} className="flex justify-between items-center p-3 border rounded-md bg-card">
                      <div>
                        <p className="text-sm font-medium">{snapshot.name}</p>
                        <p className="text-xs text-muted-foreground">Saved: {new Date(snapshot.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="flex space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreClick(snapshot)} // Open modal
                          disabled={isRestoring || isDeleting} // Disable if any action is pending
                          aria-label={`Restore snapshot ${snapshot.name}`}
                        >
                          <RotateCcw className="h-3.5 w-3.5 mr-1" /> Restore
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10 h-8 w-8"
                          onClick={() => handleDeleteClick(snapshot)}
                          disabled={isRestoring || isDeleting}
                          aria-label={`Delete snapshot ${snapshot.name}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </ScrollArea>
          </div>
        </div>

        {/* No explicit footer needed for Sheet, close is usually in header or handled by overlay click */}
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the snapshot
              named "<span className="font-semibold">{snapshotToDelete?.name}</span>".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSnapshotToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isDeleting ? 'Deleting...' : 'Delete Snapshot'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Restore Confirmation Modal */}
      <SnapshotRestoreModal
        isOpen={isRestoreModalOpen}
        onOpenChange={setIsRestoreModalOpen}
        snapshotToRestore={snapshotToRestore}
        onConfirmRestore={handleConfirmRestore} // Pass the confirmation handler
        isRestoring={isRestoring} // Pass loading state
      />
    </Sheet>
  );
};