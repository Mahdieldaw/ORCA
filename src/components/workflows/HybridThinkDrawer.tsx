// src/components/workflows/HybridThinkDrawer.tsx
'use client';

import { useState, useEffect } from 'react';
// Update the import path below if your Sheet components are located elsewhere
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '../ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { useGetSnapshots, useCreateSnapshot, useRestoreSnapshot, useDeleteSnapshot } from '@/hooks/useSnapshots';
import { format } from 'date-fns';
import { SnapshotRestoreModal } from './SnapshotRestoreModal';
import { SnapshotSummary } from '@/services/apiClient';

interface HybridThinkDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string | null;
}

export const HybridThinkDrawer = ({ isOpen, onOpenChange, workflowId }: HybridThinkDrawerProps) => {
  const { toast } = useToast();
  const [snapshotName, setSnapshotName] = useState('');
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);
  const [snapshotToRestoreObj, setSnapshotToRestoreObj] = useState<SnapshotSummary | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [snapshotToDelete, setSnapshotToDelete] = useState<string | null>(null);

  // Fetch snapshots for the workflow
  const { data: snapshots = [], isLoading, error, refetch } = useGetSnapshots({ workflowId: workflowId ?? undefined });

  // Create snapshot
  const { mutate: createSnapshot, isPending: isCreating } = useCreateSnapshot();
  const handleSaveSnapshot = () => {
    if (!workflowId || !snapshotName.trim()) return;
    createSnapshot(
      { workflowId: workflowId, name: snapshotName.trim() },
      {
        onSuccess: () => {
          toast({ title: 'Snapshot saved', description: 'Workflow snapshot created.' });
          setSnapshotName('');
          refetch();
        },
        onError: () => toast({ title: 'Error', description: 'Failed to save snapshot.', variant: 'destructive' }),
      }
    );
  };

  // Restore snapshot
  const { mutate: restoreSnapshot, isPending: isRestoring } = useRestoreSnapshot();
  const handleConfirmRestore = () => {
    if (!snapshotToRestoreObj) return;
    restoreSnapshot(
      snapshotToRestoreObj.id,
      {
        onSuccess: () => {
          toast({ title: 'Snapshot restored', description: 'Workflow restored from snapshot.' });
          setIsRestoreModalOpen(false);
          setSnapshotToRestoreObj(null);
          onOpenChange(false);
        },
        onError: () => toast({ title: 'Error', description: 'Failed to restore snapshot.', variant: 'destructive' }),
      }
    );
  };

  // Delete snapshot
  const { mutate: deleteSnapshot, isPending: isDeleting } = useDeleteSnapshot();
  const handleConfirmDelete = () => {
    if (!snapshotToDelete) return;
    deleteSnapshot(
      snapshotToDelete,
      {
        onSuccess: () => {
          toast({ title: 'Snapshot deleted', description: 'Snapshot removed.' });
          setIsDeleteDialogOpen(false);
          setSnapshotToDelete(null);
          refetch();
        },
        onError: () => toast({ title: 'Error', description: 'Failed to delete snapshot.', variant: 'destructive' }),
      }
    );
  };

  useEffect(() => {
    if (!isOpen) {
      setSnapshotName('');
      setSnapshotToRestoreObj(null);
      setIsRestoreModalOpen(false);
      setSnapshotToDelete(null);
      setIsDeleteDialogOpen(false);
    }
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[420px] max-w-full">
        <SheetHeader>
          <SheetTitle>Workflow Snapshots</SheetTitle>
          <SheetDescription>
            Save, restore, or delete snapshots of your workflow for versioning and recovery.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Snapshot name"
              value={snapshotName}
              onChange={e => setSnapshotName(e.target.value)}
              disabled={isCreating}
            />
            <Button onClick={handleSaveSnapshot} disabled={isCreating || !snapshotName.trim()}>
              {isCreating ? 'Saving...' : 'Save Snapshot'}
            </Button>
          </div>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full rounded" />)}
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Failed to load snapshots.</AlertDescription>
            </Alert>
          ) : (
            <ScrollArea className="max-h-[400px] pr-2">
              <div className="space-y-2">
                {snapshots.length === 0 ? (
                  <div className="text-muted-foreground text-sm text-center py-8">No snapshots found for this workflow.</div>
                ) : (
                  snapshots.map(snapshot => (
                    <div key={snapshot.id} className="flex items-center justify-between border rounded p-3 bg-card">
                      <div>
                        <div className="font-medium">{snapshot.name || `Snapshot from ${format(new Date(snapshot.createdAt), 'Pp')}`}</div>
                        <div className="text-xs text-muted-foreground">{format(new Date(snapshot.createdAt), 'Pp')}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => {
                          const snapObj = snapshots.find(s => s.id === snapshot.id);
                          if (snapObj) {
                            setSnapshotToRestoreObj(snapObj);
                            setIsRestoreModalOpen(true);
                          }
                        }}>
                          Restore
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => { setSnapshotToDelete(snapshot.id); setIsDeleteDialogOpen(true); }}>
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          )}
        </div>
        {/* Restore Modal */}
        <SnapshotRestoreModal
          isOpen={isRestoreModalOpen}
          onOpenChange={setIsRestoreModalOpen}
          snapshotToRestore={snapshotToRestoreObj}
          isRestoring={isRestoring}
          onConfirmRestore={handleConfirmRestore}
        />
        {/* Delete Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Snapshot?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the snapshot.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
};