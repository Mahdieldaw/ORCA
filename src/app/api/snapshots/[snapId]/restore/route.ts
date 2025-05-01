// src/app/api/snapshots/[snapId]/restore/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient, WorkflowExecutionStatus, StageExecutionStatus, ExecutionLogStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request, // Keep request even if unused for now
  { params }: { params: { snapId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { snapId } = params;

  if (!snapId) {
    return NextResponse.json({ error: 'Missing snapshotId' }, { status: 400 });
  }

  try {
    // 1. Find the snapshot and its associated workflow structure
    const snapshot = await prisma.workflowSnapshot.findUnique({
      where: { id: snapId },
      include: {
        workflow: { // Include the original workflow to get stages
          include: {
            stages: { // Include stages from the original workflow
              orderBy: { order: 'asc' }, // Ensure stages are in correct order
            },
          },
        },
      },
    });

    if (!snapshot || !snapshot.workflow) {
      return NextResponse.json({ error: 'Snapshot or associated workflow not found' }, { status: 404 });
    }

    const originalWorkflow = snapshot.workflow;

    // 2. Create a new WorkflowExecution based on the snapshot
    const newExecution = await prisma.workflowExecution.create({
      data: {
        workflowId: originalWorkflow.id,
        userId: userId, // Associate with the current user
        status: WorkflowExecutionStatus.PENDING, // Start as pending
        name: `${originalWorkflow.name} (Restored ${new Date().toISOString()})`, // Indicate it's restored
        // description: originalWorkflow.description, // Copy description
        // inputData: snapshot.executionInputData, // Use input data from snapshot if available
        snapshotId: snapId, // Link back to the snapshot used for restoration
        // stages: {} // Stages will be created separately below
      },
    });

    // 3. Create StageExecution records for the new WorkflowExecution
    //    based on the stages from the original workflow
    const stageExecutionsToCreate = originalWorkflow.stages.map(stage => ({
      executionId: newExecution.id,
      stageId: stage.id,
      status: StageExecutionStatus.PENDING, // All stages start as pending
      order: stage.order,
      // inputData: null, // Input data might be set later or come from workflow input
      // result: null,
      // startedAt: null,
      // finishedAt: null,
    }));

    await prisma.stageExecution.createMany({
      data: stageExecutionsToCreate,
    });

    // 4. Optionally, create an initial ExecutionLog entry
    //    This might indicate the start of the restored execution
    // await prisma.executionLog.create({
    //   data: {
    //     executionId: newExecution.id,
    //     // stageId: null, // Or the first stage ID?
    //     status: ExecutionLogStatus.PENDING,
    //     message: `Workflow execution restored from snapshot ${snapId}`,
    //   },
    // });

    // 5. TODO: Trigger the start of the new execution (e.g., run the first stage)
    // This depends on the execution engine logic.
    // await triggerWorkflowExecutionStart(newExecution.id);

    console.log(`Workflow execution ${newExecution.id} created by restoring snapshot ${snapId}`);

    // Return the newly created workflow execution
    return NextResponse.json(newExecution, { status: 201 }); // 201 Created

  } catch (error) {
    console.error(`Error restoring snapshot ${snapId}:`, error);
    return NextResponse.json({ error: 'Failed to restore snapshot' }, { status: 500 });
  }
}