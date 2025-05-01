Okay, AI Agent, let's proceed with completing Phase 3: Data Binding & Integration.

Based on our review, the core 'start execution' flow is in place. Please focus on implementing the following remaining tasks to fully connect the frontend and backend, replacing all mock data and placeholder actions with live data and API interactions.

1. Complete API Function Coverage:

Implement Backend Routes (in src/app/api/...):

Ensure Next.js Route Handlers exist and are functional for:

PUT /api/workflows/[workflowId] (Update workflow metadata)

DELETE /api/workflows/[workflowId] (Delete workflow)

PUT /api/workflows/[workflowId]/stages/[stageId] (Update stage details - already exists, verify completeness)

DELETE /api/workflows/[workflowId]/stages/[stageId] (Delete stage - already exists, verify completeness)

PUT /api/executions/[executionId] (Update execution status - already exists, ensure it handles necessary status changes)

POST /api/executions/[executionId]/stages/[stageId]/validate (or similar endpoint for Manual Validation input)

POST /api/executions/[executionId]/stages/[stageId]/retry (or similar endpoint for triggering a stage retry)

POST /api/snapshots/[snapshotId]/restore (or similar endpoint to create a new workflow/execution from a snapshot)

Implement Frontend API Client Functions (in src/services/apiClient.ts):

Add functions corresponding to all the backend routes listed above (e.g., updateWorkflow, deleteWorkflow, updateStage, deleteStage, recordManualValidation, retryStage, restoreSnapshot). Define necessary input parameters and expected return types (use existing interfaces or create new ones).

Implement Frontend Hooks (in src/hooks/ files):

Create corresponding TanStack Query useMutation hooks for all the new write operations (update/delete/validate/retry/restore).

Ensure appropriate query invalidation (queryClient.invalidateQueries) is configured in the onSuccess callbacks of mutations to keep related data fresh (e.g., invalidate workflow list after deleting one).

2. Wire Up Remaining Mutations:

Stage Saving:

In StageController.tsx, add a "Save Stage" button (or implement auto-save logic on prompt change after a debounce).

Wire this action to a new useUpdateStage mutation hook, passing the activeWorkflowId, current stage ID, and the updated prompt/other fields.

Workflow Metadata Saving:

Add input fields for workflow name and description (likely on a dedicated workflow editor page or header).

Wire a "Save" button to a new useUpdateWorkflow mutation hook.

Deletion Logic:

Add "Delete" buttons where appropriate (Workflow list item, StageCard, Snapshot entry).

Use the SnapshotRestoreModal (or a similar confirmation dialog) before triggering the respective useDeleteWorkflow, useDeleteStage, or useDeleteSnapshot mutations.

Snapshot Restore:

Modify SnapshotEntry component (in Drawer/Overlay) to include a "Restore" button.

On click, trigger the SnapshotRestoreModal (pass the snapshot object).

In the modal's onConfirmRestore callback, call a new useRestoreSnapshot mutation hook, passing the snapshotId. Handle success/error feedback (e.g., navigating to the newly created workflow/execution or showing a toast).

Manual Validation:

In StageController.tsx, conditionally render "Pass" and "Fail" buttons when stage.validationType is 'manual' and the stage is awaiting validation.

Wire these buttons to a new useRecordManualValidation mutation hook, passing the currentExecutionId, current stageId, and the result ('pass' or 'fail').

Retry Logic:

In StageController.tsx, enable the "Retry Stage" button conditionally (e.g., when executionLog.validationResult is 'fail' or 'error' and attemptNumber < stage.retryLimit).

Wire the button to a new useRetryStage mutation hook, passing the currentExecutionId and current stageId.

3. Execution State Synchronization & UI Updates:

Real-time/Polling:

In src/hooks/useExecutions.ts (or a new useGetExecutionDetails hook if needed), implement polling for active executions.

Modify the useQuery options for fetching execution details/logs:

Set enabled: !!executionId && executionStatus === 'running' (or similar logic based on fetched status).

Set refetchInterval: 5000 (or desired interval) to poll when enabled.

(Alternative: Implement SSE/WebSockets if preferred for better performance).

Display Real Output/Validation:

Modify StageController.tsx to display the actual rawOutput (or parsedOutput) from the latest relevant ExecutionLog fetched for the currentExecutionId and activeStageOrder.

Update the validation status indicator (ValidationStatusIndicator) and Pass/Fail button visibility based on the fetched validationResult from the logs.

Modify HistoryEntry in GhostOverlay.tsx to accurately display data from the fetched ExecutionLog[].

Dynamic Progress Indicator:

Implement a progress component (Stepper, List, etc.).

Fetch the full WorkflowDetail (including all stages) when an execution is active.

Use the fetched currentStageOrder from the execution details/logs to highlight the active step.

Use the fetched ExecutionLog[] data to determine the status (completed, failed, pending) of each stage in the progress indicator.

4. Dynamic Stage Loading in Controller:

Refine Data Fetching Strategy:

The primary data fetching for the editor/runner view should happen at the page level (e.g., in /workflows/[id]/edit or /executions/[id]/run).

Fetch the full WorkflowDetail (including all stages) using useGetWorkflowDetail.

Determine the activeStageOrder (from URL param, Zustand state, or fetched execution data).

Filter the fetched workflowDetail.stages array to find the specific stageData object for the activeStageOrder.

Pass only this specific stageData object as a prop down to the <StageController> component, along with the activeWorkflowId and potentially currentExecutionId.

Remove any redundant useGetWorkflowDetail call from within StageController.

5. Variable Input Handling:

UI for Inputs:

Before triggering startWorkflowExecution, present UI elements (e.g., a form in a modal or a dedicated section) based on the expected executionInputs schema defined for the workflow (if available, otherwise dynamically based on first stage variables).

Pass Inputs:

Collect the values from these UI elements.

Pass the collected inputs object correctly to the startExecution mutation variables.

6. Component Prop/Type Refinement:

Update Props: Go through components like StageCard, StageController, HistoryEntry, SnapshotEntry. Change any remaining props typed as MockStage, MockSnapshot, etc., to use the corresponding API interfaces defined in src/services/apiClient.ts (e.g., WorkflowSummary, StageDetail, ExecutionLog, SnapshotSummary).

Consistent Typing: Ensure data passed between components and hooks consistently uses these API interface types.

7. Finalize Auth Integration:

Confirm Provider & Align Client: Double-check that the auth() import in src/app/api/... routes matches your intended provider (Clerk is currently shown). Verify that apiClient.ts interceptor correctly retrieves and attaches the JWT for that same provider. Fix any discrepancies.

8. Consolidate Hooks:

Review & Merge: Move the useStartWorkflowExecution hook definition from src/hooks/api/useExecutions.ts into src/hooks/useExecutions.ts (or vice-versa). Ensure all hooks related to a specific data entity reside in the corresponding hook file (e.g., all execution-related queries/mutations in useExecutions.ts).

9. Remove Mock Data:

Delete File: Once all components successfully fetch and display live data, delete the src/data/mockWorkflows.ts file.

Remove Imports: Remove all import statements referencing mockWorkflows.ts throughout the project.

Execute these steps to complete the data binding and integration phase. This will result in a frontend application that interacts fully with the backend API, managing real workflow data and execution states.