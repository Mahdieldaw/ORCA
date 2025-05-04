// src/app/api/executions/[executionId]/stages/[stageId]/retry/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { executionId: string; stageId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { executionId, stageId } = params;

  if (!executionId || !stageId) {
    return NextResponse.json({ error: 'Missing executionId or stageId' }, { status: 400 });
  }

  try {
    // 1. Find the workflow execution to ensure it exists and potentially update its status
    const execution = await prisma.execution.findUnique({
      where: { id: executionId },
      include: {
        workflow: { // Need workflow to potentially access global settings if required
          select: { id: true, name: true }
        }
      },
    });

    if (!execution) {
      return NextResponse.json({ error: 'Workflow execution not found' }, { status: 404 });
    }

    // 2. Fetch the Stage definition to get retryLimit and order
    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: {
        id: true,
        retryLimit: true,
        stageOrder: true,
      }
    });

    if (!stage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    // 3. Get the latest execution log for this stage
    const latestLog = await prisma.executionLog.findFirst({
      where: {
        executionId: executionId,
        stageId: stageId,
      },
      orderBy: {
        attemptNumber: 'desc',
      },
    });

    if (!latestLog) {
      return NextResponse.json({ error: 'No execution log found for this stage' }, { status: 404 });
    }

    // 4. Check if we've hit the retry limit
    if (stage.retryLimit && latestLog.attemptNumber >= stage.retryLimit) {
      return NextResponse.json({
        error: 'Retry limit reached for this stage',
        details: {
          attempts: latestLog.attemptNumber,
          limit: stage.retryLimit
        }
      }, { status: 400 });
    }

    // 5. Create a new execution log entry for the retry
    const newLog = await prisma.executionLog.create({
      data: {
        executionId: executionId,
        stageId: stageId,
        attemptNumber: latestLog.attemptNumber + 1,
        // Optionally copy over other valid fields from latestLog if needed
        inputs: latestLog.inputs ?? Prisma.JsonNull,
        promptSent: latestLog.promptSent,
        rawOutput: latestLog.rawOutput,
        parsedOutput: latestLog.parsedOutput ?? Prisma.JsonNull,
        validationResult: 'pending',
        validatorNotes: null,
        errorMessage: null,
        executedAt: new Date(),
        durationMs: null,
        userId: userId,
        stageOrder: stage.stageOrder,
      },
    });

    // 6. Update the execution status if needed
    await prisma.execution.update({
      where: { id: executionId },
      data: {
        status: 'running',
        currentStageOrder: stage.stageOrder,
      },
    });

    return NextResponse.json(newLog, { status: 201 });
  } catch (error) {
    console.error('Error retrying stage execution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}