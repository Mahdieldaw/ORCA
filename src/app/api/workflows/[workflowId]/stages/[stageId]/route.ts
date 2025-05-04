// src/app/api/workflows/[workflowId]/stages/[stageId]/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

interface RouteParams {
  params: { workflowId: string; stageId: string };
}

// Helper function to check workflow ownership and existence
async function verifyWorkflowOwnership(userId: string, workflowId: string): Promise<boolean> {
  const workflow = await prisma.workflow.findUnique({
    where: { id: workflowId, userId: userId },
    select: { id: true },
  });
  return !!workflow;
}

// GET /api/workflows/{workflowId}/stages/{stageId} - Fetch a specific stage
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { workflowId, stageId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the parent workflow first
    const isOwner = await verifyWorkflowOwnership(userId, workflowId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    const stage = await prisma.stage.findUnique({
      where: {
        id: stageId,
        workflowId: workflowId, // Ensure stage belongs to the correct workflow
      },
    });

    if (!stage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    return NextResponse.json(stage);
  } catch (error) {
    console.error(`Error fetching stage ${params.stageId} for workflow ${params.workflowId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// PUT /api/workflows/{workflowId}/stages/{stageId} - Update a specific stage
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { workflowId, stageId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First verify workflow ownership
    if (!await verifyWorkflowOwnership(userId, workflowId)) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    // Then check if the stage exists and belongs to this workflow
    const existingStage = await prisma.stage.findUnique({
      where: {
        id: stageId,
        workflowId: workflowId,
      },
    });

    if (!existingStage) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    // Get the update data from request body
    const {
      stageOrder,
      name,
      promptTemplate,
      modelId,
      validationType,
      validationCriteria,
      outputVariables,
      inputVariableMapping,
      retryLimit,
      nextStageOnPass,
      nextStageOnFail,
      flowiseConfig,
    } = await request.json();

    // If stageOrder is being changed, check for conflicts
    if (stageOrder !== undefined && stageOrder !== existingStage.stageOrder) {
      const conflict = await prisma.stage.findFirst({
        where: {
          workflowId,
          stageOrder,
          id: { not: stageId }, // Exclude current stage
        },
      });
      if (conflict) {
        return NextResponse.json({ error: 'Stage order conflict' }, { status: 409 });
      }
    }

    // Update the stage
    const updatedStage = await prisma.stage.update({
      where: { id: stageId },
      data: {
        stageOrder: stageOrder ?? existingStage.stageOrder,
        name: name ?? existingStage.name,
        promptTemplate: promptTemplate ?? existingStage.promptTemplate,
        modelId: modelId ?? existingStage.modelId,
        validationType: validationType ?? existingStage.validationType,
        validationCriteria: validationCriteria ?? existingStage.validationCriteria,
        outputVariables: outputVariables ?? existingStage.outputVariables,
        inputVariableMapping: inputVariableMapping ?? existingStage.inputVariableMapping,
        retryLimit: retryLimit ?? existingStage.retryLimit,
        nextStageOnPass: nextStageOnPass ?? existingStage.nextStageOnPass,
        nextStageOnFail: nextStageOnFail ?? existingStage.nextStageOnFail,
        flowiseConfig: flowiseConfig ?? existingStage.flowiseConfig,
      },
    });

    return NextResponse.json(updatedStage);
  } catch (error: any) {
    console.error(`Error updating stage ${params.stageId} for workflow ${params.workflowId}:`, error);
    if (error.code === 'P2002' && error.meta?.target?.includes('workflowId') && error.meta?.target?.includes('stageOrder')) {
      return NextResponse.json({ error: 'Stage order conflict' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/workflows/{workflowId}/stages/{stageId} - Delete a specific stage
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth();
    const { workflowId, stageId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First verify workflow ownership
    if (!await verifyWorkflowOwnership(userId, workflowId)) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    // Delete the stage, ensuring it belongs to the specified workflow
    const deleteResult = await prisma.stage.deleteMany({
      where: {
        id: stageId,
        workflowId: workflowId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Stage deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting stage ${params.stageId} for workflow ${params.workflowId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}