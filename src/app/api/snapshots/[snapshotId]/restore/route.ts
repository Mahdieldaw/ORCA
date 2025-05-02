// src/app/api/snapshots/[snapshotId]/restore/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient, Prisma } from '@prisma/client'; // Import Prisma namespace

const prisma = new PrismaClient();

export async function POST(
  request: Request, // Keep request even if unused for now
  { params }: { params: { snapshotId: string } }
) {
  const authResult = await auth(); // Await the auth() call
  const userId = authResult.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { snapshotId } = params;

  if (!snapshotId) {
    return NextResponse.json({ error: 'Missing snapshotId' }, { status: 400 });
  }

  try {
    // 1. Find the snapshot and its associated workflow structure
    const snapshot = await prisma.snapshot.findUnique({ // Corrected model name to 'snapshot'
      where: { id: snapshotId }, // Corrected variable name and removed duplicate where
      include: {
        workflow: { // Include the original workflow to get stages
          include: {
            stages: { // Include stages from the original workflow
              orderBy: { stageOrder: 'asc' }, // Corrected property name to stageOrder
            },
          },
        },
      },
    });

    if (!snapshot || !snapshot.workflow) {
      return NextResponse.json({ error: 'Snapshot or associated workflow not found' }, { status: 404 });
    }

    const originalWorkflow = snapshot.workflow;

    // 2. Create a new Workflow based on the snapshot's original workflow data
    //    (Assuming snapshot stores enough info or we use originalWorkflow)
    const restoredWorkflow = await prisma.workflow.create({
      data: {
        userId: userId, // Associate with the current user
        name: `${originalWorkflow.name} (Restored ${new Date().toISOString()})`,
        description: originalWorkflow.description,
        // Copy other relevant fields from originalWorkflow as needed
        // Example: isPublic: originalWorkflow.isPublic,
      },
    });

    // 3. Create new Stages for the restored workflow based on the original stages
    const restoredStagesData = originalWorkflow.stages.map((stage: any) => ({
      workflowId: restoredWorkflow.id,
      userId: userId, // Add the missing userId
      name: stage.name,
      description: stage.description,
      stageOrder: stage.stageOrder, // Corrected property name
      prompt: stage.prompt,
      llmConfig: stage.llmConfig ?? Prisma.JsonNull, // Prisma namespace is correct here
      outputSchema: stage.outputSchema ?? Prisma.JsonNull, // Prisma namespace is correct here
      retryLimit: stage.retryLimit,
      timeoutSeconds: stage.timeoutSeconds,
      nextStageOnFail: stage.nextStageOnFail,
      nextStageOnPass: stage.nextStageOnPass,
      // Map other stage fields as necessary
    }));
    await prisma.stage.createMany({ data: restoredStagesData });

    // --- Optional: Start Execution --- 
    const shouldStartExecution = false; // Set to true if restore should auto-run
    let newExecution = null;
    if (shouldStartExecution) {
        const initialStageOrder = 1; // Assuming first stage order is 1
        // Find the ID of the first stage in the *newly created* stages
        const firstRestoredStage = await prisma.stage.findFirst({
            where: { workflowId: restoredWorkflow.id, stageOrder: initialStageOrder }, // Corrected property name
            select: { id: true },
        });

        if (!firstRestoredStage) {
             console.error(`Could not find the first stage (order ${initialStageOrder}) for the restored workflow ${restoredWorkflow.id}`);
             // Handle error appropriately - maybe don't start execution
        } else {
            newExecution = await prisma.execution.create({
                data: {
                    userId: userId,
                    workflowId: restoredWorkflow.id,
                    status: 'PENDING', // Start as pending, execution service will pick it up
                    // Use inputs from snapshot if available, else empty
                    // executionInputs: snapshot.executionInputData ?? Prisma.JsonNull, // Prisma namespace is correct here
                    currentStageOrder: initialStageOrder,
                    executionContext: {}, // Initial empty context
                },
            });
            console.log(`Also created new execution ${newExecution.id} for restored workflow ${restoredWorkflow.id}.`);
            // TODO: Trigger execution service for newExecution.id
            // This depends on the execution engine logic.
            // await executionService.processExecutionStep(newExecution.id);
        }
    }
    // --- End Optional Execution ---

    // Return the restored workflow (or execution if started)
    // Fetch the complete workflow with stages again to return it
    const finalRestoredWorkflow = await prisma.workflow.findUnique({
        where: { id: restoredWorkflow.id },
        include: { stages: { orderBy: { stageOrder: 'asc' } } } // Corrected property name
    });

    // If execution was started, maybe return that instead or alongside?
    // For now, returning the workflow structure.
    return NextResponse.json(finalRestoredWorkflow, { status: 201 }); // 201 Created

  } catch (error) {
    console.error(`Error restoring snapshot ${snapshotId}:`, error);
    return NextResponse.json({ error: 'Failed to restore snapshot' }, { status: 500 });
  }
}