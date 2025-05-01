// src/app/api/executions/[executionId]/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

interface RouteParams {
  params: { executionId: string };
}

// GET /api/executions/{executionId} - Fetch a specific execution
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();
    const { executionId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const execution = await prisma.execution.findUnique({
      where: {
        id: executionId,
        userId: userId, // Ensure user owns the execution
      },
      // Optionally include related data like logs or workflow info
      // include: {
      //   executionLogs: { orderBy: { executedAt: 'asc' } },
      //   workflow: { select: { id: true, name: true } }
      // }
    });

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found' }, { status: 404 });
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error(`Error fetching execution ${params.executionId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/executions/{executionId} - Update an execution (e.g., change status)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();
    const { executionId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { status /* other updatable fields like currentStageOrder? */ } = body;

    // Validate the new status if provided
    const allowedStatuses = ['pending', 'running', 'completed', 'failed', 'paused'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ error: `Invalid status value. Allowed: ${allowedStatuses.join(', ')}` }, { status: 400 });
    }

    // Check if execution exists and belongs to the user
    const existingExecution = await prisma.execution.findUnique({
      where: { id: executionId, userId: userId },
    });

    if (!existingExecution) {
      return NextResponse.json({ error: 'Execution not found or access denied' }, { status: 404 });
    }

    // Prevent updating terminal states?
    // if (['completed', 'failed'].includes(existingExecution.status)) {
    //   return NextResponse.json({ error: 'Cannot update a completed or failed execution' }, { status: 400 });
    // }

    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      // If completing, set completedAt
      if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();
      }
    }
    // Add other updatable fields here if necessary

    if (Object.keys(updateData).length === 0) {
        return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const updatedExecution = await prisma.execution.update({
      where: {
        id: executionId,
      },
      data: updateData,
    });

    return NextResponse.json(updatedExecution);
  } catch (error) {
    console.error(`Error updating execution ${params.executionId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/executions/{executionId} - Delete a specific execution
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();
    const { executionId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use deleteMany to leverage the where clause for ownership check
    const deleteResult = await prisma.execution.deleteMany({
      where: {
        id: executionId,
        userId: userId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Execution not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Execution deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error) {
    console.error(`Error deleting execution ${params.executionId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}