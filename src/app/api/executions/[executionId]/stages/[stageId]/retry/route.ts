// src/app/api/executions/[executionId]/stages/[stageId]/retry/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient, WorkflowExecutionStatus, StageExecutionStatus, ExecutionLogStatus } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request, // Keep request even if unused for now, Next.js expects it
  { params }: { params: { executionId: string; stageId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { executionId, stageId } = params;

  if (!executionId || !stageId) {
    return NextResponse.json({ error: 'Missing executionId or stageId' }, { status: 400 });
  }

  try {
    // 1. Fetch the workflow execution to ensure it exists and potentially update its status
    const execution = await prisma.workflowExecution.findUnique({
      where: { id: executionId },
      include: {
        stages: { // Include stage executions to find the one to retry
          where: { stageId: stageId },
        },
      },
    });

    if (!execution) {
      return NextResponse.json({ error: 'Workflow execution not found' }, { status: 404 });
    }

    const stageExecution = execution.stages[0];
    if (!stageExecution) {
      return NextResponse.json({ error: 'Stage execution not found for this workflow execution' }, { status: 404 });
    }

    // --- Core Retry Logic --- 
    // This is a simplified representation. Real-world retry might be more complex.

    // 2. Update the specific StageExecution status to PENDING or RUNNING
    //    (Assuming retry means re-running it immediately)
    const updatedStageExecution = await prisma.stageExecution.update({
        where: {
            // Need a unique identifier for StageExecution. Assuming composite key or unique ID.
            // Let's assume an id field exists on StageExecution for simplicity
            id: stageExecution.id 
            // If using composite key: 
            // executionId_stageId: {
            //   executionId: executionId,
            //   stageId: stageId
            // }
        },
        data: {
            status: StageExecutionStatus.PENDING, // Or RUNNING, depending on flow
            // Reset relevant fields if necessary, e.g., result, finishedAt
            result: null,
            finishedAt: null,
        }
    });

    // 3. Update the overall WorkflowExecution status to RUNNING if it's not already
    if (execution.status !== WorkflowExecutionStatus.RUNNING) {
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: { status: WorkflowExecutionStatus.RUNNING },
      });
    }

    // 4. Create a new ExecutionLog entry for the retry attempt
    const newLog = await prisma.executionLog.create({
      data: {
        executionId: executionId,
        stageId: stageId,
        status: ExecutionLogStatus.PENDING, // Mark as pending initially
        // inputData: stageExecution.inputData, // Carry over original input?
        // rawOutput: null, // Reset output/results
        // parsedOutput: null,
        // validationResult: null,
        // startedAt: new Date(), // Mark start time
      },
    });

    // 5. TODO: Trigger the actual stage execution logic again.
    // This is the crucial part that depends on the execution engine.
    // It might involve adding a job to a queue, calling another service, etc.
    // Example placeholder: 
    // await triggerStageExecution(executionId, stageId, newLog.id);

    console.log(`Stage ${stageId} marked for retry in execution ${executionId}. New log ID: ${newLog.id}`);

    // Return the newly created log or the updated stage execution
    return NextResponse.json(newLog, { status: 200 });

  } catch (error) {
    console.error(`Error retrying stage ${stageId} for execution ${executionId}:`, error);
    // Check for specific Prisma errors if needed
    // if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }
    return NextResponse.json({ error: 'Failed to retry stage' }, { status: 500 });
  }
}