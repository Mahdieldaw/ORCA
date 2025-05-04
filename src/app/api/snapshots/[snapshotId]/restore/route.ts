// src/app/api/snapshots/[snapshotId]/restore/route.ts
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(
  request: Request,
  { params }: { params: { snapshotId: string } }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { snapshotId } = params;

  if (!snapshotId) {
    return NextResponse.json({ error: 'Missing snapshotId' }, { status: 400 });
  }

  try {
    // 1. Find the snapshot and its associated workflow structure
    const snapshot = await prisma.snapshot.findUnique({
      where: { id: snapshotId },
      include: {
        workflow: { // Include the original workflow to get stages
          include: {
            stages: {
              orderBy: { stageOrder: 'asc' }
            }
          }
        }
      }
    });

    if (!snapshot || !snapshot.workflow) {
      return NextResponse.json({ error: 'Snapshot or associated workflow not found' }, { status: 404 });
    }

    // 2. Create new workflow from snapshot data
    // Get the original workflow details
    const originalWorkflow = snapshot.workflow;

    // Create new workflow with updated name to indicate it's restored
    const newWorkflow = await prisma.workflow.create({
      data: {
        userId: userId,
        name: `${originalWorkflow.name} (Restored ${new Date().toISOString()})`,
        description: originalWorkflow.description,
      },
    });

    // 3. Create stages from the snapshot
    // Map original stages to new stages, maintaining order and relationships
    const stagesPromises = originalWorkflow.stages.map(stage => ({
      workflowId: newWorkflow.id,
      userId: userId,
      name: stage.name,
      stageOrder: stage.stageOrder,
      promptTemplate: stage.promptTemplate,
      modelId: stage.modelId,
      validationType: stage.validationType,
      validationCriteria: stage.validationCriteria ?? Prisma.JsonNull,
      retryLimit: stage.retryLimit,
      nextStageOnPass: stage.nextStageOnPass,
      nextStageOnFail: stage.nextStageOnFail,
      flowiseConfig: stage.flowiseConfig ?? Prisma.JsonNull,
      outputVariables: stage.outputVariables ?? Prisma.JsonNull,
      inputVariableMapping: stage.inputVariableMapping ?? Prisma.JsonNull,
    }));

    // Create all stages in parallel
    await prisma.stage.createMany({
      data: stagesPromises,
    });

    // 4. Return the newly created workflow
    const restoredWorkflow = await prisma.workflow.findUnique({
      where: { id: newWorkflow.id },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' }
        }
      }
    });

    return NextResponse.json(restoredWorkflow, { status: 201 });
  } catch (error) {
    console.error('Error restoring from snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}