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
    const { userId } = auth();
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
        // userId: userId // Redundant check if workflow ownership is confirmed
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
    const { userId } = auth();
    const { workflowId, stageId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the parent workflow
    const isOwner = await verifyWorkflowOwnership(userId, workflowId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    // Destructure only the fields that can be updated
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
      flowiseConfig
    } = body;

    // Fetch the existing stage to apply updates selectively and check existence
    const existingStage = await prisma.stage.findUnique({
        where: { id: stageId, workflowId: workflowId }
    });

    if (!existingStage) {
        return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    // Basic validation: Ensure stageOrder isn't updated to conflict if provided
    if (stageOrder !== undefined && stageOrder !== existingStage.stageOrder) {
        const conflictingStage = await prisma.stage.findUnique({
            where: { workflowId_stageOrder: { workflowId: workflowId, stageOrder: stageOrder } }
        });
        if (conflictingStage) {
            return NextResponse.json({ error: `Stage with order ${stageOrder} already exists in this workflow.` }, { status: 409 });
        }
    }

    // TODO: Add more robust validation for other fields

    const updatedStage = await prisma.stage.update({
      where: {
        id: stageId,
        // workflowId: workflowId // Already confirmed by existingStage check
      },
      data: {
        // Only update fields if they are provided in the request body
        stageOrder: stageOrder !== undefined ? stageOrder : existingStage.stageOrder,
        name: name !== undefined ? name : existingStage.name,
        promptTemplate: promptTemplate !== undefined ? promptTemplate : existingStage.promptTemplate,
        modelId: modelId !== undefined ? modelId : existingStage.modelId,
        validationType: validationType !== undefined ? validationType : existingStage.validationType,
        validationCriteria: validationCriteria !== undefined ? validationCriteria : existingStage.validationCriteria,
        outputVariables: outputVariables !== undefined ? outputVariables : existingStage.outputVariables,
        inputVariableMapping: inputVariableMapping !== undefined ? inputVariableMapping : existingStage.inputVariableMapping,
        retryLimit: retryLimit !== undefined ? retryLimit : existingStage.retryLimit,
        nextStageOnPass: nextStageOnPass !== undefined ? nextStageOnPass : existingStage.nextStageOnPass,
        nextStageOnFail: nextStageOnFail !== undefined ? nextStageOnFail : existingStage.nextStageOnFail,
        flowiseConfig: flowiseConfig !== undefined ? flowiseConfig : existingStage.flowiseConfig,
        // userId and workflowId should not be changed here
      },
    });

    return NextResponse.json(updatedStage);
  } catch (error: any) {
    console.error(`Error updating stage ${params.stageId} for workflow ${params.workflowId}:`, error);
     if (error.code === 'P2002' && error.meta?.target?.includes('workflowId') && error.meta?.target?.includes('stageOrder')) {
        return NextResponse.json({ error: `Stage with order ${body.stageOrder} already exists in this workflow.` }, { status: 409 }); // Conflict
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/workflows/{workflowId}/stages/{stageId} - Delete a specific stage
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const { userId } = auth();
    const { workflowId, stageId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the parent workflow
    const isOwner = await verifyWorkflowOwnership(userId, workflowId);
    if (!isOwner) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    // Use deleteMany with workflowId and stageId to ensure it belongs to the correct workflow
    const deleteResult = await prisma.stage.deleteMany({
      where: {
        id: stageId,
        workflowId: workflowId,
        // userId: userId // Ownership checked via workflow
      },
    });

    if (deleteResult.count === 0) {
      // Stage either didn't exist or didn't belong to the specified workflow
      return NextResponse.json({ error: 'Stage not found' }, { status: 404 });
    }

    // TODO: Consider re-ordering subsequent stages if necessary, or handle gaps in stageOrder

    return NextResponse.json({ message: 'Stage deleted successfully' }, { status: 200 }); // Or 204 No Content

  } catch (error) {
    console.error(`Error deleting stage ${params.stageId} for workflow ${params.workflowId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}