// src/app/api/executions/[executionId]/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

interface RouteParams {
  params: { executionId: string };
}

// GET /api/executions/{executionId} - Fetch a specific execution
export async function GET(request: Request, { params }: { params: { executionId: string } }) {
  try {
    const { userId } = await auth();
    const { executionId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const execution = await prisma.execution.findUnique({
      where: { 
        id: executionId,
        userId: userId,
      },
      include: {
        workflow: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    if (!execution) {
      return NextResponse.json({ error: 'Execution not found or access denied' }, { status: 404 });
    }

    return NextResponse.json(execution);
  } catch (error) {
    console.error(`Error fetching execution ${params.executionId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/executions/{executionId} - Update an execution (e.g., change status)
export async function PUT(request: Request, { params }: { params: { executionId: string } }) {
  try {
    const { userId } = await auth();
    const { executionId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { status } = await request.json();

    // Define allowed status values
    const allowedStatuses = ['pending', 'running', 'completed', 'failed', 'paused'];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json({ 
        error: `Invalid status value. Allowed: ${allowedStatuses.join(', ')}` 
      }, { status: 400 });
    }

    // Verify ownership before update
    if (!await prisma.execution.findUnique({
      where: { id: executionId, userId: userId }
    })) {
      return NextResponse.json({ error: 'Execution not found or access denied' }, { status: 404 });
    }

    // Prepare update data
    const updateData: any = {};
    if (status !== undefined) {
      updateData.status = status;
      // If status is being set to completed or failed, set completedAt
      if (status === 'completed' || status === 'failed') {
        updateData.completedAt = new Date();
      }
    }

    // If no valid update data provided
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
    }

    const updatedExecution = await prisma.execution.update({
      where: { id: executionId },
      data: updateData
    });

    return NextResponse.json(updatedExecution);
  } catch (error) {
    console.error(`Error updating execution ${params.executionId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/executions/{executionId} - Delete a specific execution
export async function DELETE(request: Request, { params }: { params: { executionId: string } }) {
  try {
    const { userId } = await auth();
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

    return NextResponse.json({ message: 'Execution deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting execution ${params.executionId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}