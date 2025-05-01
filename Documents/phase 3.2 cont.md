good progress on Phase 3. The 'Start Execution', 'Save Stage', 'Manual Validation', 'Retry Stage', and most 'Delete' flows are now wired up with hooks. Let's complete Phase 3 by focusing on these remaining tasks:
Backend Routes: Implement the missing Next.js API Route Handlers for: Manual Validation (POST /api/executions/[execId]/stages/[stageId]/validate), Stage Retry (POST /api/executions/[execId]/stages/[stageId]/retry), and Snapshot Restore (POST /api/snapshots/[snapId]/restore). Ensure existing PUT routes handle status updates correctly.
Remaining UI Wiring:
Wire up the delete button on StageCard using useDeleteStage.
Add UI inputs for Workflow Name/Description and wire them to useUpdateWorkflow.
Finalize the Snapshot Restore flow: Ensure the 'Restore' button in the drawer/overlay correctly triggers the SnapshotRestoreModal, which then calls the useRestoreSnapshot hook on confirmation.
Execution UI & Sync:
Refine the polling in useGetExecutionLogs (or implement SSE/WebSockets) to reliably update based on 'running' status.
Update StageController and GhostOverlay (HistoryEntry) to display actual rawOutput/parsedOutput and validationResult from the fetched logs, replacing placeholders.
Implement a dynamic progress indicator component based on total stages and current execution logs/status.
Efficient Stage Data: Refactor the page containing StageController to fetch the full workflow detail once and pass the specific, active stage data down as a prop. Remove redundant fetches from StageController itself.
Initial Inputs: Implement UI (e.g., a form/modal before execution starts) to collect necessary initial inputs for the workflow and pass them to useStartWorkflowExecution.
Auth Token: Update apiClient.ts interceptor to correctly fetch the JWT token using the appropriate method for Clerk authentication.
Code Cleanup: Consolidate duplicate hooks (useStartWorkflowExecution) into the correct files (e.g., src/hooks/useExecutions.ts) and remove the src/hooks/api/ directory if redundant. Update all component prop types (like in StageCard) to use API types instead of Mock types. Finally, delete src/data/mockWorkflows.ts and remove its imports."