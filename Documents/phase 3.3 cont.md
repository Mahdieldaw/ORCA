let's execute the final steps to complete Phase 3.

Task 1: Complete Backend Route Logic

Manual Validation (.../validate/route.ts):

Open src/app/api/executions/[executionId]/stages/[stageId]/validate/route.ts.

Refine Logic: Ensure the Prisma query correctly finds the absolute latest log entry for the given stageId and executionId (ordering by executedAt or attemptNumber desc might be needed).

Update Data: Correctly update the validationResult (as 'pass'/'fail') and validatorNotes (from request body comments).

Trigger Next Stage (Placeholder): Add a comment // TODO: Trigger execution service to potentially run next stage if result is 'pass'. The actual call depends on how your backend execution service/engine is structured (which isn't defined yet).

// src/app/api/executions/[executionId]/stages/[stageId]/validate/route.ts
// ... imports ...
export async function POST( /* ... */ ) {
    // ... auth, params, body parsing ...
    try {
        // ... verify execution ownership ...

        // Find the latest log entry for this stage attempt
        const latestLog = await prisma.executionLog.findFirst({
          where: { executionId: executionId, stageId: stageId },
          orderBy: { executedAt: 'desc' }, // Or attemptNumber desc
        });
        // ... handle not found ...

        // Update the log
        const updatedLog = await prisma.executionLog.update({
          where: { id: latestLog.id },
          data: {
            validationResult: validationResult ? 'pass' : 'fail', // Store as string
            validatorNotes: comments,
            // Optionally update log status here too
          },
        });

        // --- Trigger Next Stage Logic (Placeholder) ---
        if (validationResult) {
            console.log(`Validation passed for stage ${stageId}, execution ${executionId}. Triggering next step.`);
            // Placeholder: In a real backend service architecture, you'd call something like:
            // await executionService.processExecutionStep(executionId);
            // This service would check the updated log, find the next stage based on
            // stages.nextStageOnPass, update execution.currentStageOrder, and run the next stage.
        } else {
             console.log(`Validation failed for stage ${stageId}, execution ${executionId}.`);
             // Optionally update execution status to 'paused' or 'failed' if no retries left
             // await prisma.execution.update({ where: { id: executionId }, data: { status: 'paused' }});
        }
        // --- End Trigger Logic ---

        return NextResponse.json(updatedLog, { status: 200 });
    } catch (error) { /* ... error handling ... */ }
}


Stage Retry (.../retry/route.ts):

Open src/app/api/executions/[executionId]/stages/[stageId]/retry/route.ts.

Refine Logic: Ensure the retryLimit check is correct. Ensure the new ExecutionLog creation correctly increments attemptNumber and resets relevant fields (rawOutput, parsedOutput, validationResult, errorMessage, durationMs). Ensure the Execution status is updated to 'running' and currentStageOrder points to the retried stage.

Trigger Re-Execution (Placeholder): Add a comment // TODO: Trigger execution service to re-run this stage attempt (newLog.id).

// src/app/api/executions/[executionId]/stages/[stageId]/retry/route.ts
 // ... imports ...
 export async function POST( /* ... */ ) {
    // ... auth, params ...
    try {
        // ... verify ownership and fetch execution, stage, latestLog ...
        // ... check retry limit ...

        // Create new log entry
        const newLog = await prisma.executionLog.create({
          data: {
            executionId: executionId,
            stageId: stageId,
            userId: userId,
            stageOrder: stage.stageOrder,
            attemptNumber: currentAttempt + 1,
            inputs: latestLog?.inputs ?? Prisma.JsonNull, // Carry over inputs
            validationResult: 'pending',
            executedAt: new Date(),
            // Ensure other output/error fields are null
            rawOutput: null,
            parsedOutput: Prisma.JsonNull,
            validatorNotes: null,
            errorMessage: null,
            durationMs: null,
          },
        });

        // Update Execution status and current stage
        await prisma.execution.update({
            where: { id: executionId },
            data: {
                status: 'running', // Ensure it's running
                currentStageOrder: stage.stageOrder, // Point to the retried stage
            },
        });

        // --- Trigger Stage Re-Execution Logic (Placeholder) ---
        console.log(`Retry attempt ${newLog.attemptNumber} initiated for stage ${stageId}. New log ID: ${newLog.id}`);
        // Placeholder: Call the backend service to execute this specific attempt
        // await executionService.runSpecificStageAttempt(executionId, stageId, newLog.id);
        // --- End Trigger Logic ---

        return NextResponse.json(newLog, { status: 200 });
    } catch (error) { /* ... error handling ... */ }
 }
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Snapshot Restore (.../restore/route.ts):

Open src/app/api/snapshots/[snapId]/restore/route.ts.

Refine Logic: The current logic creates a new workflow. Confirm this is the desired behavior (vs. overwriting an existing one, which is generally riskier). Ensure all necessary fields from the snapshot's stagesData are correctly mapped to the new Stage records being created.

Decide on Execution: Determine if restoring should also create and start a new Execution record for the restored workflow. If so, add the logic from the POST /api/executions route here after creating the workflow and stages.

// src/app/api/snapshots/[snapId]/restore/route.ts
 // ... imports ...
 export async function POST( /* ... */ ) {
    // ... auth, params ...
    try {
        // ... fetch snapshot and verify ownership ...
        // ... extract workflowData and stagesData ...

        // Create new Workflow
        const restoredWorkflow = await prisma.workflow.create({ /* ... data mapping ... */ });

        // Create new Stages
        const restoredStagesData = stagesData.map((stage: any) => ({ /* ... data mapping ... */ }));
        await prisma.stage.createMany({ data: restoredStagesData });

        // --- Optional: Start Execution ---
        const shouldStartExecution = false; // Set to true if restore should auto-run
        let newExecution = null;
        if (shouldStartExecution) {
            const initialStageOrder = 1; // Assuming first stage order
            newExecution = await prisma.execution.create({
                data: {
                    userId: userId,
                    workflowId: restoredWorkflow.id,
                    status: 'pending',
                    // Use inputs from snapshot if available, else empty
                    executionInputs: workflowData.executionInputs ?? Prisma.JsonNull,
                    currentStageOrder: initialStageOrder,
                    executionContext: {},
                },
            });
            console.log(`Also created new execution ${newExecution.id} for restored workflow.`);
            // TODO: Trigger execution service for newExecution.id
            // await executionService.processExecutionStep(newExecution.id);
        }
        // --- End Optional Execution ---

        // Return the restored workflow (or execution if started)
        const finalRestoredWorkflow = await prisma.workflow.findUnique({ where: { id: restoredWorkflow.id }}); // Fetch again if needed
        return NextResponse.json(finalRestoredWorkflow, { status: 201 });

    } catch (error) { /* ... error handling ... */ }
 }
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Verify PUT Routes:

Briefly review PUT handlers in workflows/[workflowId]/route.ts, stages/[stageId]/route.ts, and executions/[executionId]/route.ts. Ensure they correctly fetch the existing record, check ownership, selectively update only the provided fields, handle potential conflicts (like unique stageOrder), and return the updated record. (The existing code looks generally correct but double-check edge cases).

Task 2: Wire Remaining UI Actions

Stage Deletion:

Identify Context: Determine where stages will be listed for editing/deletion (e.g., within ActiveWorkflowView on explorer/page.tsx, or a future dedicated editor page /workflows/[id]/edit).

Implement Listing: If not already done, add a Repeating Group or map function in that context to display StageCard components based on the fetched workflowDetail.stages.

Pass Props: Ensure the workflowId and the stage object are passed to each StageCard.

Connect Handler: Pass the handleDelete function (which uses the useDeleteStage hook) as the onDelete prop to StageCard.

// Example within ActiveWorkflowView component in explorer/page.tsx
// ... imports, fetch workflowDetail ...
const { mutate: deleteStage } = useDeleteStage(); // Assuming hook is imported

const handleDeleteStage = (stageId: string) => {
    if (confirm(`Delete stage ${stageId}?`)) {
        deleteStage({ workflowId: workflowId, stageId: stageId }, {
            onSuccess: () => toast({ title: "Stage Deleted" }),
            onError: (err) => toast({ title: "Delete Failed", description: (err as Error).message, variant: "destructive" }),
        });
    }
};

return (
    <>
        <WorkflowDetailEditor workflowId={workflowId} />
        <div className="mt-6 space-y-4">
            <h3 className="text-lg font-semibold">Stages</h3>
            {workflowDetail?.stages?.map(stage => (
                <StageCard
                    key={stage.id}
                    stage={stage} // Pass the full stage object
                    workflowId={workflowId} // Pass workflowId
                    onClick={() => setActiveStage(stage)} // Assuming setActiveStage state exists
                    onDelete={(id, e) => { e.stopPropagation(); handleDeleteStage(id); }} // Pass delete handler
                />
            ))}
            {/* Button to add new stage */}
        </div>
        {/* Conditionally render StageController based on activeStage */}
        {/* ... */}
    </>
);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Workflow Metadata Save:

Ensure the WorkflowDetailEditor component (created in explorer/page.tsx) is functional.

Verify its "Save Changes" button correctly calls the useUpdateWorkflow mutation hook with the current name and description state values.

Snapshot Restore Trigger:

Open src/components/workflows/HybridThinkDrawer.tsx.

Locate the "Restore" button within the snapshots.map function.

Ensure its onClick calls handleRestoreClick(snapshot), which sets the state to open the SnapshotRestoreModal.

Verify the SnapshotRestoreModal is rendered and receives the correct props (isOpen, onOpenChange, snapshotToRestore, onConfirmRestore, isRestoring).

Task 3: Execution UI & Sync Refinement

Display Real Output/Validation:

GhostOverlay.tsx (HistoryEntry): Modify the JSX to display actual fields:

// Inside HistoryEntry component
return (
  <div className="p-2 border-b last:border-b-0 text-xs">
    <div className="flex justify-between items-center mb-1">
      <p className="font-medium">Stage {item.stageOrder} <span className="text-muted-foreground">(Attempt {item.attemptNumber})</span></p>
      <Badge variant={getStatusVariant(item.validationResult ?? 'pending')} className="capitalize">{item.validationResult ?? 'pending'}</Badge>
    </div>
    <p className="text-muted-foreground mb-1">Executed: {new Date(item.executedAt ?? Date.now()).toLocaleString()}</p>
    {item.inputs && <div><Label className="text-xxs uppercase text-muted-foreground">Inputs:</Label><pre className="text-xxs bg-muted/50 p-1 rounded overflow-auto max-h-20">{JSON.stringify(item.inputs, null, 2)}</pre></div>}
    {item.rawOutput && <div><Label className="text-xxs uppercase text-muted-foreground">Raw Output:</Label><pre className="text-xxs bg-muted/50 p-1 rounded overflow-auto max-h-20">{item.rawOutput}</pre></div>}
    {item.parsedOutput && <div><Label className="text-xxs uppercase text-muted-foreground">Parsed Output:</Label><pre className="text-xxs bg-muted/50 p-1 rounded overflow-auto max-h-20">{JSON.stringify(item.parsedOutput, null, 2)}</pre></div>}
    {item.errorMessage && <p className="text-destructive mt-1">Error: {item.errorMessage}</p>}
    {item.validatorNotes && <p className="text-muted-foreground mt-1">Notes: {item.validatorNotes}</p>}
  </div>
);
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

StageController.tsx:

Ensure the component receives the latestLogForStage prop correctly from its parent.

Add a section to display the log details similar to the HistoryEntry above, using the latestLogForStage data. Replace placeholder status lights/badges with dynamic ones based on latestLogForStage.validationResult.

Dynamic Progress Indicator:

Create src/components/workflows/WorkflowProgressStepper.tsx.

Implement logic using stages and logs props to determine each stage's status (find latest log for each stageOrder, check validationResult).

Render a visual stepper (e.g., using divs, badges, icons).

Integrate <WorkflowProgressStepper> into ActiveWorkflowView in explorer/page.tsx, passing the fetched workflowDetail.stages and the fetched logs from useGetExecutionLogs.

Task 4: Efficient Stage Data Loading

Verify ActiveWorkflowView: Double-check the implementation in explorer/page.tsx. Confirm that useGetWorkflowDetail is called once here, and the specific activeStage object (found by filtering workflowDetail.stages based on activeStageOrder state) is passed down to <StageController>. Confirm <StageController> no longer calls useGetWorkflowDetail itself.

Task 5: Implement Initial Inputs UI

Create Form/Modal: Decide where inputs are collected (e.g., a <StartExecutionModal> component). Add necessary form fields (could be dynamic based on workflow.metadata.inputSchema if you implement that).

Trigger: Modify the "Start Workflow Execution" button (currently in StageController, but should likely move to the ActiveWorkflowView or workflow header) to first open this modal/form.

Pass Data: On form submission within the modal, call the startExecution mutation, passing the collected inputs object.

here are the corrected and specific instructions for Task 6: Finalize Auth Token Handling. This replaces the previous placeholder/incorrect logic in the Axios interceptor.
Task 6: Finalize Auth Token Handling
Objective: Update the Axios request interceptor in apiClient.ts to correctly retrieve the active Clerk JWT using the recommended client-side method (getToken) and attach it to the Authorization header for outgoing API requests made from the browser.
File to Modify: src/services/apiClient.ts
Step-by-Step Instructions:
Import getToken:
At the top of src/services/apiClient.ts, add the import for getToken from the appropriate Clerk package. Use @clerk/nextjs unless you are specifically using the beta App Router features that require /app-beta.
// src/services/apiClient.ts
import axios from 'axios';
import { getToken } from '@clerk/nextjs'; // Or potentially '@clerk/nextjs/app-beta'

// ... rest of the file ...
Use code with caution.
TypeScript
Update the Axios Request Interceptor:
Locate the apiClient.interceptors.request.use(async (config) => { ... }); block.
Replace the existing token retrieval logic inside the interceptor with the following code, which uses getToken:
// Inside apiClient.interceptors.request.use(async (config) => { ... }):

  let token: string | null = null;

  // Ensure this runs only on the client-side where Clerk context is available
  if (typeof window !== 'undefined') {
    try {
      // Use Clerk's recommended client-side token retrieval function
      token = await getToken();
      // console.log("Clerk token fetched:", token ? "Yes" : "No"); // Optional: for debugging
    } catch (error) {
      console.error("Error fetching Clerk token:", error);
      // Handle token fetching errors if necessary, though getToken usually handles internal states
    }
  }

  // Remove the old logic that checked localStorage for 'supabase.auth.token'
  // const token = typeof window !== 'undefined' ? localStorage.getItem('supabase.auth.token') : null; // DELETE THIS LINE
  // if (token) { // DELETE THIS BLOCK or modify the condition below
  //   config.headers.Authorization = `Bearer ${JSON.parse(token).access_token}`;
  // }

  // Add the fetched Clerk token to the header if it exists
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
     // Optional: Decide if you want to remove any potentially stale Authorization header if no token is found
     // delete config.headers.Authorization;
     console.log("No Clerk token found, request sent without Authorization header.");
  }

  return config; // Return the modified config

// ... rest of the interceptor (error handling) ...
Use code with caution.
TypeScript
Verification:
Ensure your application is wrapped in <ClerkProvider> in your root layout (src/app/layout.tsx).
Log in to your application.
Trigger an action in the UI that makes an API call requiring authentication (e.g., fetching workflows from /api/workflows).
Open your browser's Developer Tools (Network tab). Inspect the outgoing request to your API. Verify that an Authorization header is present with a Bearer <JWT_TOKEN> value.
Verify that your backend API route successfully authenticates the request using the Clerk auth() helper.
This completes Task 6. The apiClient should now correctly attach the Clerk authentication token to client-side requests made to your backend API.

Task 7: Code Cleanup

Consolidate Hooks:

Delete src/hooks/api/useExecutions.ts.

Verify useStartWorkflowExecution is defined only in src/hooks/useExecutions.ts.

Delete the src/hooks/api/ directory.

Refine Types:

Open src/components/workflows/StageCard.tsx. Change stage: MockStage prop to stage: WorkflowSummary | Stage (or a more specific type based on where it's used).

Scan other components (HistoryEntry, SnapshotEntry, etc.) for any remaining MockX types in props and replace them with types from apiClient.ts.

Remove Mock Data:

Delete src/data/mockWorkflows.ts.

Search the project (Ctrl+Shift+F or Cmd+Shift+F) for mockWorkflows and remove all related import statements.

Execute these refined steps. This should bring Phase 3 to completion, resulting in a fully integrated frontend and backend for the core MVP features.