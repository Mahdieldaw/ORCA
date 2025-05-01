// src/components/workflows/HybridThinkDrawer.tsx
'use client';

import React, { useState } from 'react'; // Added useState
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription, DrawerFooter, DrawerClose, Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from '@/components/ui/drawer'; // Combined imports
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal, History, Trash2, Loader2, AlertTriangle } from 'lucide-react'; // Combined imports
import { useGetSnapshots, useRestoreSnapshot, useDeleteSnapshot, useCreateSnapshot } from '@/hooks/api/useSnapshots'; // Combined snapshot hooks
import { useToast } from '@/components/ui/use-toast'; // Import useToast
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

interface HybridThinkDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  executionId: string | null; // ID of the current execution context
  stageId: string | null; // ID of the current stage context
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


export const HybridThinkDrawer: React.FC<HybridThinkDrawerProps> = ({ isOpen, onOpenChange, executionId, stageId }) => {
  // Fetch snapshots using the hook, conditionally enabled
  const { data: snapshots, isLoading: isLoadingSnapshots, error: snapshotsError } = useGetSnapshots({
    // Pass filters if needed
    // executionId: executionId ?? undefined,
    // stageId: stageId ?? undefined,
  }, {
    enabled: isOpen, // Only fetch when the drawer is open
  });

  const { mutate: restoreSnapshot, isPending: isRestoring } = useRestoreSnapshot(); // Restore hook
  const { mutate: deleteSnapshot, isPending: isDeleting } = useDeleteSnapshot(); // Delete hook
  const createSnapshotMutation = useCreateSnapshot(); // Create hook
  const { toast } = useToast(); // Toast hook

  // State for delete confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<SnapshotSummary | null>(null);
  const [newSnapshotName, setNewSnapshotName] = React.useState('');

  // Handle opening delete confirmation
  const handleDeleteClick = (snapshot: SnapshotSummary) => {
    setSnapshotToDelete(snapshot);
    setIsDeleteDialogOpen(true);
  };

  // Handle confirming deletion
  const handleConfirmDelete = () => {
    if (!snapshotToDelete || !executionId || !stageId) return;

    console.log(`Deleting snapshot ${snapshotToDelete.id} for execution ${executionId}, stage ${stageId}`);
    deleteSnapshot(
      { executionId, stageId, snapshotId: snapshotToDelete.id },
      {
        onSuccess: () => {
          toast({
            title: 'Snapshot Deleted',
            description: `Snapshot '${snapshotToDelete.name}' has been deleted.`,
          });
          setIsDeleteDialogOpen(false);
          setSnapshotToDelete(null);
          // Query invalidation should happen within the hook
        },
        onError: (deleteError) => {
          toast({
            title: 'Delete Failed',
            description: `Could not delete snapshot: ${(deleteError as Error).message}`,
            variant: 'destructive',
          });
          setIsDeleteDialogOpen(false);
          setSnapshotToDelete(null);
        },
      }
    );
  };

  // Handle restoring a snapshot
  const handleRestoreSnapshot = (snapshotId: string) => {
    if (!executionId || !stageId) return; // Should not happen if button is enabled
    console.log(`Restoring snapshot ${snapshotId} for execution ${executionId}, stage ${stageId}`);
    restoreSnapshot({ executionId, stageId, snapshotId }, {
      onSuccess: () => {
        toast({
          title: "Snapshot Restored",
          description: "The selected snapshot has been restored successfully.",
        });
        onOpenChange(false);
      },
      onError: (restoreError) => {
        toast({
          title: "Restore Failed",
          description: `Could not restore snapshot: ${(restoreError as Error).message}`,
          variant: "destructive",
        });
      },
    });
  };

  // Handle saving a new snapshot
  const handleSaveNewSnapshot = () => {
    if (!executionId || !stageId || !newSnapshotName.trim()) {
      toast({ title: "Missing Information", description: "Execution context and snapshot name are required.", variant: "warning" });
      return;
    }
    console.log(`Attempting to save snapshot: ${newSnapshotName} for execution ${executionId}, stage ${stageId}`);

    // TODO: Define the actual 'stateData' to be saved.
    const placeholderStateData = {
      prompt: (document.getElementById(`prompt-${stageId}`) as HTMLTextAreaElement)?.value || '', // Example
      // Add other relevant state data here...
    };

    createSnapshotMutation.mutate(
      {
        executionId,
        stageId,
        name: newSnapshotName.trim(),
        stateData: placeholderStateData, // Replace with actual state data
      },
      {
        onSuccess: () => {
          toast({ title: "Snapshot Saved", description: `Snapshot '${newSnapshotName.trim()}' saved.` });
          setNewSnapshotName(''); // Clear input
        },
        onError: (error) => {
          toast({ title: "Save Failed", description: error?.message || 'Could not save snapshot.', variant: "destructive" });
        },
      }
    );
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px]"> {/* Example widths */}
        <SheetHeader>
          <SheetTitle>Hybrid Think Panel</SheetTitle>
          <SheetDescription>
            Manage snapshots and advanced stage actions.
          </SheetDescription>
        </SheetHeader>

        <div className="py-4 space-y-6"> {/* Increased spacing */}
          {/* Section for Saving Snapshots - Only show if context is available */}
          {executionId && stageId && (
          <div>
             <h3 className="text-sm font-semibold mb-2">Save Current State</h3>
             <div className="flex space-x-2">
                <Input
                    type="text"
                    placeholder="Snapshot Name (e.g., 'Before Edit')"
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
                    Error: {createSnapshotMutation.error?.message || 'Could not save snapshot.'}
                </p>
             )}
          </div>
          )}

          {/* Section for Existing Snapshots */}
          <div>
            <h3 className="text-sm font-semibold mb-2">Existing Snapshots</h3>
            <ScrollArea className="h-[40vh] pr-1"> {/* Adjusted height and padding */}
              <div className="space-y-2">
                {/* Loading State */}
                {isLoadingSnapshots && (
                  <div className="flex justify-center items-center py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}

                {/* Error State */}
                {snapshotsError && (
                  <Alert variant="destructive" className="my-4">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Snapshots</AlertTitle>
                    <AlertDescription>{snapshotsError.message}</AlertDescription>
                  </Alert>
                )}

                {/* Success State - Data Available */}
                {!isLoadingSnapshots && !snapshotsError && snapshots && snapshots.length > 0 && (
                  snapshots.map((snapshot) => (
                    <div key={snapshot.id} className="flex items-center justify-between p-2 border rounded-md bg-background hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium truncate max-w-[180px]" title={snapshot.name}>{snapshot.name || `Snapshot ${snapshot.id.substring(0, 6)}`}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(snapshot.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1.5 shrink-0"> {/* Adjusted spacing */}
                        {/* Restore Button */}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRestoreSnapshot(snapshot.id)}
                          disabled={isRestoring || isDeleting || createSnapshotMutation.isPending}
                          aria-label={`Restore snapshot ${snapshot.name || snapshot.id}`}
                        >
                          <History className="h-3.5 w-3.5" /> {/* Icon only for smaller button */}
                        </Button>
                        {/* Delete Button */}
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteClick(snapshot)} // Pass snapshot object
                          disabled={isRestoring || isDeleting || createSnapshotMutation.isPending}
                          aria-label={`Delete snapshot ${snapshot.name || snapshot.id}`}
                        >
                          <Trash2 className="h-3.5 w-3.5" /> {/* Icon only */}
                        </Button>
                      </div>
                    </div>
                  ))
                )}

                {/* Success State - No Data */}
                {!isLoadingSnapshots && !snapshotsError && (!snapshots || snapshots.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No snapshots saved yet.</p>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <SheetFooter>
          {/* Optional: Add a close button if needed */}
          {/* <SheetClose asChild>
            <Button variant="outline">Close</Button>
          </SheetClose> */}
        </SheetFooter>
      </SheetContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the snapshot
              named "<span className='font-medium'>{snapshotToDelete?.name}</span>".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSnapshotToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting} className="bg-destructive hover:bg-destructive/90">
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Sheet>
  );
};