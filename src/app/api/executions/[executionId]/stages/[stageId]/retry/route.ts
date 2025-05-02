// src/app/api/executions/[executionId]/stages/[stageId]/retry/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient, Prisma } from '@prisma/client'; // Removed unused status enums, added Prisma namespace

const prisma = new PrismaClient();

export async function POST(
  request: Request, // Keep request even if unused for now, Next.js expects it
  { params }: { params: { executionId: string; stageId: string } }
) {
  const authResult = await auth(); // Await the auth() call
  const userId = authResult.userId;
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { executionId, stageId } = params;

  if (!executionId || !stageId) {
    return NextResponse.json({ error: 'Missing executionId or stageId' }, { status: 400 });
  }

  try {
    // 1. Fetch the workflow execution to ensure it exists and potentially update its status
    const execution = await prisma.execution.findUnique({ // Corrected model name to 'execution'
      where: { id: executionId },
      include: {
        // Include stage executions if needed, but not strictly required for retry logic itself
        // stages: {
        //   where: { stageId: stageId },
        // },
        workflow: { // Need workflow to potentially access global settings if required
          select: { id: true, name: true }
        }
      },
    });

    if (!execution) {
      return NextResponse.json({ error: 'Workflow execution not found' }, { status: 404 });
    }

    // Check if the user owns the execution (important for security)
    // Assuming Execution model has a userId field
    // if (execution.userId !== userId) {
    //    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    // }

    // 2. Fetch the Stage definition to get retryLimit and order
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
            status: 'RUNNING', // Ensure it's running or PENDING if retry means restart
            currentStageOrder: stage.stageOrder, // Corrected property name to stageOrder
        },
    });

    // 5. Create new log entry for the retry
    const newLog = await prisma.executionLog.create({
      data: {
        executionId: executionId,
        stageId: stageId,
        userId: userId, // Associate log with the user initiating retry
        stageOrder: stage.stageOrder, // Corrected property name to stageOrder
        attemptNumber: currentAttempt + 1,
        inputs: latestLog?.inputs ?? Prisma.JsonNull, // Use Prisma namespace
        validationResult: 'pending', // Reset validation status
        executedAt: new Date(), // Mark the time retry was initiated
        // Ensure other output/error fields are null for the new attempt
        rawOutput: null,
        parsedOutput: Prisma.JsonNull, // Use Prisma namespace
        validatorNotes: null,
        errorMessage: null,
        durationMs: null,
        // status: 'PENDING', // Keep status field if it exists in your schema, otherwise remove
      },
    });

    // --- Trigger Stage Re-Execution Logic (Placeholder) ---
    console.log(`Retry attempt ${newLog.attemptNumber} initiated for stage ${stageId}. New log ID: ${newLog.id}`);
    // Placeholder: Call the backend service to execute this specific attempt
    // Example: await triggerStageExecution(executionId, stageId, newLog.id);
    // --- End Trigger Logic ---

    // Return the newly created log or the updated execution status
    return NextResponse.json({ message: 'Stage retry initiated successfully.', logEntry: newLog }, { status: 200 });

  } catch (error) {
    console.error(`Error retrying stage ${stageId} for execution ${executionId}:`, error);
    // Check for specific Prisma errors if needed
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // Handle specific Prisma errors (e.g., unique constraint violation)
        return NextResponse.json({ error: `Prisma error: ${error.code}` }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to retry stage' }, { status: 500 });
  }
}