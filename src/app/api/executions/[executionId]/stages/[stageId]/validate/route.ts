// src/app/api/executions/[executionId]/stages/[stageId]/validate/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { executionId: string; stageId: string } }
) {
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { executionId, stageId } = params;
  const { validationResult, comments } = await request.json(); // Assuming validation result and comments are sent in the body

  if (!executionId || !stageId) {
    return NextResponse.json({ error: 'Missing executionId or stageId' }, { status: 400 });
  }

  if (typeof validationResult !== 'boolean') {
    return NextResponse.json({ error: 'Invalid validationResult format' }, { status: 400 });
  }

  try {
    // 1. Find the specific execution stage log to update
    //    We might need more specific logic here depending on how logs are structured.
    //    Find the absolute latest log entry for this stage in this execution.
    const latestLog = await prisma.executionLog.findFirst({
      where: {
        executionId: executionId,
        stageId: stageId,
      },
      orderBy: {
        // Choose one: executedAt for time-based, attemptNumber for retry-based
        // executedAt: 'desc',
        attemptNumber: 'desc',
      },
    });

    if (!latestLog) {
      return NextResponse.json({ error: 'Execution log for the stage not found' }, { status: 404 });
    }

    // 2. Update the log with validation result and comments
    const updatedLog = await prisma.executionLog.update({
      where: {
        id: latestLog.id,
      },
      data: {
        validationResult: validationResult ? 'pass' : 'fail', // Store as 'pass' or 'fail'
        validatorNotes: comments, // Store comments from request body
        // Optionally update log status here too, e.g., to 'COMPLETED' or 'FAILED'
        // status: validationResult ? 'COMPLETED' : 'FAILED',
      },
    });

    // 3. Optionally, update the overall StageExecution status if needed
    //    This might depend on the workflow logic (e.g., does validation complete the stage?)
    // await prisma.stageExecution.update({
    //   where: {
    //      // Need a unique identifier for StageExecution, maybe composite key?
    //      // executionId_stageId: `${executionId}_${stageId}`
    //   },
    //   data: {
    //      status: validationResult ? 'COMPLETED' : 'FAILED', // Or 'AWAITING_NEXT' etc.
    //   }
    // });

    // 4. Optionally, update the overall WorkflowExecution status
    //    Check if this validation completes the entire workflow
    // const workflowExecution = await prisma.workflowExecution.findUnique({ where: { id: executionId } });
    // Check if all stages are completed...
    // If so, update workflowExecution status to 'COMPLETED'

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
  } catch (error) {
    console.error('Error during manual validation:', error);
    return NextResponse.json({ error: 'Failed to record manual validation' }, { status: 500 });
  }
}