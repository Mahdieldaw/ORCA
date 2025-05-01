// src/store/workflowStore.ts
import { create } from 'zustand';

// Define the structure of the state and its actions
interface WorkflowState {
  activeWorkflowId: string | null;
  setActiveWorkflowId: (id: string | null) => void;

  activeStageOrder: number | null; // Represents the order of the currently focused stage in the editor/runner
  setActiveStageOrder: (order: number | null) => void;

  currentExecutionId: string | null; // ID of the workflow execution currently being viewed or run
  setCurrentExecutionId: (id: string | null) => void;

  // Flags for controlling UI elements, potentially moved to component state if not truly global
  isGhostOverlayOpen: boolean;
  setGhostOverlayOpen: (isOpen: boolean) => void;

  isSnapshotDrawerOpen: boolean;
  setSnapshotDrawerOpen: (isOpen: boolean) => void;

  // Add other relevant global states as needed:
  // e.g., currentUserSettings, notificationMessages, etc.
}

// Create the Zustand store
export const useWorkflowStore = create<WorkflowState>((set) => ({
  // Initial state values
  activeWorkflowId: null,
  activeStageOrder: null,
  currentExecutionId: null,
  isGhostOverlayOpen: false,
  isSnapshotDrawerOpen: false,

  // Actions to update the state
  setActiveWorkflowId: (id) => set((state) => {
    // When changing the active workflow, reset related states like active stage and execution
    if (state.activeWorkflowId !== id) {
      return { activeWorkflowId: id, activeStageOrder: null, currentExecutionId: null };
    }
    return { activeWorkflowId: id };
  }),

  setActiveStageOrder: (order) => set({ activeStageOrder: order }),

  setCurrentExecutionId: (id) => set({ currentExecutionId: id }),

  setGhostOverlayOpen: (isOpen) => set({ isGhostOverlayOpen: isOpen }),

  setSnapshotDrawerOpen: (isOpen) => set({ isSnapshotDrawerOpen: isOpen }),
}));