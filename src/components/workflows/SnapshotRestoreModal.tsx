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
// import { MockSnapshot } from '@/data/mockWorkflows'; // Remove mock import
import { SnapshotSummary } from '@/services/apiClient'; // Import correct type
import { Loader2 } from 'lucide-react'; // Import loader icon

interface SnapshotRestoreModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  snapshotToRestore: SnapshotSummary | null; // Use SnapshotSummary type
  onConfirmRestore: (snapshotId: string) => void; // Action on confirmation
  isRestoring: boolean; // Add loading state prop
}

export const SnapshotRestoreModal: React.FC<SnapshotRestoreModalProps> = ({
  isOpen,
  onOpenChange,
  snapshotToRestore,
  onConfirmRestore,
  isRestoring, // Destructure the new prop
}) => {
  if (!snapshotToRestore) return null; // Don't render if no snapshot is selected

  const handleConfirm = () => {
    // No console log needed here as it's handled in the drawer
    onConfirmRestore(snapshotToRestore.id);
    // Modal closing logic is handled in the drawer's onSuccess/onError
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
          <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel> {/* Disable cancel during restore? Optional */} 
          <AlertDialogAction onClick={handleConfirm} disabled={isRestoring}> {/* Disable button when restoring */} 
            {isRestoring && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {/* Show loader */} 
            {isRestoring ? 'Restoring...' : 'Restore Snapshot'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};