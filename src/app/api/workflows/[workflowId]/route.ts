// src/app/api/workflows/[workflowId]/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

interface RouteParams {
  params: { workflowId: string };
}

// GET /api/workflows/{workflowId} - Fetch a specific workflow
export async function GET(request: Request, { params }: { params: { workflowId: string } }) {
  try {
    const { userId } = await auth();
    const { workflowId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflow = await prisma.workflow.findUnique({
      where: {
        id: workflowId,
        userId: userId, // Ensure user owns the workflow
      },
      // Optionally include related data
      // include: { stages: { orderBy: { stageOrder: 'asc' } } }
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error(`Error fetching workflow ${params.workflowId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/workflows/{workflowId} - Update a specific workflow
export async function PUT(request: Request, { params }: { params: { workflowId: string } }) {
  try {
    const { userId } = await auth();
    const { workflowId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, description, metadata } = await request.json();

    // First check if the workflow exists and belongs to the user
    const existingWorkflow = await prisma.workflow.findUnique({
      where: { id: workflowId, userId: userId }
    });

    if (!existingWorkflow) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    // Update the workflow, maintaining any fields that weren't provided in the request
    const updatedWorkflow = await prisma.workflow.update({
      where: { id: workflowId },
      data: {
        name: name !== undefined ? name : existingWorkflow.name,
        description: description !== undefined ? description : existingWorkflow.description,
        metadata: metadata !== undefined ? metadata : existingWorkflow.metadata,
      }
    });

    return NextResponse.json(updatedWorkflow);
  } catch (error) {
    console.error(`Error updating workflow ${params.workflowId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/workflows/{workflowId} - Delete a specific workflow
export async function DELETE(request: Request, { params }: { params: { workflowId: string } }) {
  try {
    const { userId } = await auth();
    const { workflowId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if workflow exists and belongs to the user before deleting
    // Use deleteMany to leverage the where clause for ownership check
    const deleteResult = await prisma.workflow.deleteMany({
      where: {
        id: workflowId,
        userId: userId,
      },
    });

    if (deleteResult.count === 0) {
      // This means either the workflow didn't exist or the user didn't own it
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Workflow deleted successfully' }, { status: 200 }); // Or 204 No Content
  } catch (error) {
    console.error(`Error deleting workflow ${params.workflowId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}