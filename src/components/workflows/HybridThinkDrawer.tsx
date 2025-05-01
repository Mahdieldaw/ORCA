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
import { Input } from '@/components/ui/input'; // Added for snapshot name
import { useGetSnapshots, useCreateSnapshot } from '@/hooks/useSnapshots'; // Import hooks
import { SnapshotSummary } from '@/services/apiClient'; // Import type
import { Loader2, AlertTriangle } from 'lucide-react'; // Icons for loading/error
// Remove mock data import
// import { mockSnapshots, MockSnapshot } from '@/data/mockWorkflows';

interface HybridThinkDrawerProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  executionId: string | null; // ID of the current execution context
  stageId: string | null; // ID of the current stage context
}

// Simple component to render a snapshot entry
const SnapshotEntry: React.FC<{ snapshot: SnapshotSummary }> = ({ snapshot }) => {
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
        {/* Adjust displayed info based on SnapshotSummary fields */}
        <p className="text-xs text-muted-foreground">Saved: {new Date(snapshot.createdAt).toLocaleString()}</p>
      </div>
      {/* Placeholder for actions like 'Restore' or 'Delete' */}
      <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleClick(); }}>Select</Button>
    </div>
  );
};


export const HybridThinkDrawer: React.FC<HybridThinkDrawerProps> = ({ isOpen, onOpenChange, executionId, stageId }) => {

  const [newSnapshotName, setNewSnapshotName] = React.useState('');

  // Fetch existing snapshots
  const { data: snapshots, isLoading: isLoadingSnapshots, error: snapshotsError } = useGetSnapshots({
    // Pass filters if needed, e.g., based on executionId or stageId
    // executionId: executionId ?? undefined,
    // stageId: stageId ?? undefined,
  }, {
    enabled: isOpen, // Only fetch when the drawer is open
  });

  // Mutation hook for creating snapshots
  const createSnapshotMutation = useCreateSnapshot();

  const handleSaveNewSnapshot = () => {
    if (!executionId || !stageId || !newSnapshotName.trim()) {
      console.error('Missing executionId, stageId, or snapshot name');
      // Add user feedback (e.g., toast notification)
      return;
    }
    console.log(`Attempting to save snapshot: ${newSnapshotName} for execution ${executionId}, stage ${stageId}`);

    // TODO: Define the actual 'stateData' to be saved.
    // This needs to capture the relevant context (inputs, outputs, variables) of the current stage.
    // For now, using a placeholder.
    const placeholderStateData = {
      prompt: (document.getElementById(`prompt-${stageId}`) as HTMLTextAreaElement)?.value || '', // Example: get current prompt
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
          console.log('Snapshot saved successfully!');
          setNewSnapshotName(''); // Clear input
          // Optionally close the drawer or provide other feedback
          // onOpenChange(false);
        },
        onError: (error) => {
          console.error('Failed to save snapshot:', error);
          // Add user feedback (e.g., toast notification)
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

        <div className="py-4 space-y-4">
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
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-2"> {/* Scrollable list */}
              {/* Loading State */}
              {isLoadingSnapshots && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Error State */}
              {snapshotsError && (
                <div className="flex flex-col items-center text-destructive py-4">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <p className="text-sm">Error loading snapshots:</p>
                  <p className="text-xs">{snapshotsError.message}</p>
                </div>
              )}

              {/* Success State - Data Available */}
              {!isLoadingSnapshots && !snapshotsError && snapshots && snapshots.length > 0 && (
              snapshots.map((snap) => (
                <SnapshotEntry key={snap.id} snapshot={snap} />
              ))
             )}

             {/* Success State - No Data */}
             {!isLoadingSnapshots && !snapshotsError && (!snapshots || snapshots.length === 0) && (
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