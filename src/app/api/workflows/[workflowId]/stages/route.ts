// src/app/api/workflows/[workflowId]/stages/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

interface RouteParams {
  params: { workflowId: string };
}

// GET /api/workflows/{workflowId}/stages - Fetch all stages for a specific workflow
export async function GET(request: Request, { params }: { params: { workflowId: string } }) {
  try {
    const { userId } = await auth();
    const { workflowId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // First, verify the user owns the workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId, userId: userId },
      select: { id: true }, // Only need to confirm existence and ownership
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    // Fetch stages for the confirmed workflow
    const stages = await prisma.stage.findMany({
      where: { workflowId: workflowId },
      orderBy: { stageOrder: 'asc' },
    });

    return NextResponse.json(stages);
  } catch (error) {
    console.error(`Error fetching stages for workflow ${params.workflowId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/workflows/{workflowId}/stages - Create a new stage for a specific workflow
export async function POST(request: Request, { params }: { params: { workflowId: string } }) {
  try {
    const { userId } = await auth();
    const { workflowId } = params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify user owns the workflow before allowing stage creation
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId, userId: userId },
      select: { id: true },
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Workflow not found or access denied' }, { status: 404 });
    }

    const body = await request.json();
    // Destructure all relevant fields from the body, providing defaults or null where appropriate
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
    } = body;

    if (typeof stageOrder !== 'number') {
      return NextResponse.json({ error: 'Stage order (stageOrder) is required and must be a number' }, { status: 400 });
    }

    // Check for stageOrder conflict before creating
    const conflict = await prisma.stage.findFirst({
      where: { workflowId, stageOrder },
    });
    if (conflict) {
      return NextResponse.json({ error: 'Stage order conflict' }, { status: 409 });
    }

    const newStage = await prisma.stage.create({
      data: {
        workflowId,
        userId,
        stageOrder,
        name: name || null,
        promptTemplate: promptTemplate || null,
        modelId: modelId || null,
        validationType: validationType || 'none',
        validationCriteria: validationCriteria || null,
        outputVariables: outputVariables || [],
        inputVariableMapping: inputVariableMapping || {},
        retryLimit: retryLimit || 0,
        nextStageOnPass: nextStageOnPass || null,
        nextStageOnFail: nextStageOnFail || null,
        flowiseConfig: flowiseConfig || null,
      },
    });

    return NextResponse.json(newStage, { status: 201 });
  } catch (error: any) {
    console.error(`Error creating stage for workflow ${params.workflowId}:`, error);
    if (error.code === 'P2002' && error.meta?.target?.includes('workflowId') && error.meta?.target?.includes('stageOrder')) {
      return NextResponse.json({ error: 'Stage order conflict' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}