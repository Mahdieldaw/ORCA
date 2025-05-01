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