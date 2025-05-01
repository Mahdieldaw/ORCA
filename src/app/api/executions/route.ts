// src/app/api/executions/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET /api/executions - Fetch all executions for the authenticated user (potentially filtered)
export async function GET(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // Optional filter by status
    const workflowId = searchParams.get('workflowId'); // Optional filter by workflow

    const whereClause: any = { userId };
    if (status) {
      whereClause.status = status;
    }
    if (workflowId) {
      whereClause.workflowId = workflowId;
    }

    const executions = await prisma.execution.findMany({
      where: whereClause,
      orderBy: { startedAt: 'desc' }, // Order by most recent
      // Optionally include workflow details
      // include: { workflow: { select: { id: true, name: true } } }
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error('Error fetching executions:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/executions - Start a new workflow execution
export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { workflowId, executionInputs } = body;

    if (!workflowId) {
      return NextResponse.json({ error: 'Workflow ID (workflowId) is required' }, { status: 400 });
    }

    // Verify the user owns the workflow they are trying to execute
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId, userId: userId },
      select: { id: true }, // Just need to confirm existence and ownership
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    // TODO: Determine the initial stage order (usually 0 or 1, depends on convention)
    const initialStageOrder = 1; // Assuming stages start at order 1

    const newExecution = await prisma.execution.create({
      data: {
        userId,
        workflowId,
        status: 'pending', // Or 'queued', 'ready'
        executionInputs: executionInputs || {},
        currentStageOrder: initialStageOrder,
        executionContext: {},
        // startedAt is handled by default
      },
    });

    // TODO: Potentially trigger the actual execution logic here (e.g., queue a job)

    return NextResponse.json(newExecution, { status: 201 });
  } catch (error) {
    console.error('Error creating execution:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}