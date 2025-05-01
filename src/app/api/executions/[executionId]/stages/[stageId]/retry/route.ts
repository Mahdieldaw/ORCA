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

    // 2. Fetch the Stage definition to get retryLimit
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
    });

    if (!stage) {
      return NextResponse.json({ error: 'Stage definition not found' }, { status: 404 });
    }

    // 3. Find the latest log entry for this stage to get the current attempt number
    const latestLog = await prisma.executionLog.findFirst({
      where: { executionId: executionId, stageId: stageId },
      orderBy: { attemptNumber: 'desc' },
    });

    const currentAttempt = latestLog?.attemptNumber ?? 0;

    // 4. Check retry limit
    const retryLimit = stage.retryLimit ?? 0; // Default to 0 if not set
    if (currentAttempt >= retryLimit) {
      return NextResponse.json({ error: `Retry limit (${retryLimit}) reached for stage ${stageId}` }, { status: 400 });
    }

    // --- Core Retry Logic ---

    // 6. Update Execution status and current stage
    await prisma.execution.update({
        where: { id: executionId },
        data: {
            status: 'RUNNING', // Ensure it's running
            currentStageOrder: stage.order, // Point to the retried stage order
        },
    });

    // 5. Create new log entry for the retry
    const newLog = await prisma.executionLog.create({
      data: {
        executionId: executionId,
        stageId: stageId,
        userId: userId, // Associate log with the user initiating retry
        stageOrder: stage.order, // Store the stage order
        attemptNumber: currentAttempt + 1,
        inputs: latestLog?.inputs ?? Prisma.JsonNull, // Carry over inputs from previous attempt
        validationResult: 'pending', // Reset validation status
        executedAt: new Date(), // Mark the time retry was initiated
        // Ensure other output/error fields are null for the new attempt
        rawOutput: null,
        parsedOutput: Prisma.JsonNull,
        validatorNotes: null,
        errorMessage: null,
        durationMs: null,
        status: 'PENDING', // Initial status for the new log entry
      },
    });

    // --- Trigger Stage Re-Execution Logic (Placeholder) ---
    console.log(`Retry attempt ${newLog.attemptNumber} initiated for stage ${stageId}. New log ID: ${newLog.id}`);
    // Placeholder: Call the backend service to execute this specific attempt
    // await executionService.runSpecificStageAttempt(executionId, stageId, newLog.id);
    // --- End Trigger Logic ---

    // Return the newly created log or the updated stage execution
    return NextResponse.json(newLog, { status: 200 });

  } catch (error) {
    console.error(`Error retrying stage ${stageId} for execution ${executionId}:`, error);
    // Check for specific Prisma errors if needed
    // if (error instanceof Prisma.PrismaClientKnownRequestError) { ... }
    return NextResponse.json({ error: 'Failed to retry stage' }, { status: 500 });
  }
}