// src/app/api/snapshots/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET /api/snapshots - Fetch all snapshots for the authenticated user
export async function GET(request: Request) {
  try {
    const authResult = await auth(); // Await the auth() call
    const { userId } = authResult;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshots = await prisma.snapshot.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      // Select specific fields to avoid sending large snapshotData unless needed
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        type: true,
        sourceWorkflowId: true,
        createdAt: true,
        // Exclude snapshotData by default in list view
      },
    });

    return NextResponse.json(snapshots);
  } catch (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/snapshots - Create a new snapshot for a workflow
export async function POST(request: Request) {
  try {
    const authResult = await auth(); // Await the auth() call
    const { userId } = authResult;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, sourceWorkflowId } = body;

    if (!name || !sourceWorkflowId) {
      return NextResponse.json({ error: 'Snapshot name and sourceWorkflowId are required' }, { status: 400 });
    }

    // 1. Verify the user owns the source workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: sourceWorkflowId, userId: userId },
      include: { stages: { orderBy: { stageOrder: 'asc' } } }, // Include stages to snapshot
    });

    if (!workflow) {
      return NextResponse.json({ error: 'Source workflow not found or access denied' }, { status: 404 });
    }

    // 2. Construct the snapshot data
    const snapshotData = {
      workflow: { ...workflow, stages: undefined }, // Exclude stages from top-level workflow object in JSON
      stages: workflow.stages,
    };

    // 3. Create the snapshot record
    const newSnapshot = await prisma.snapshot.create({
      data: {
        userId,
        name,
        description: description || null,
        type: 'workflow', // Currently only workflow type
        sourceWorkflowId,
        snapshotData, // Store the structured data
      },
      // Select fields to return, potentially excluding the large snapshotData
      select: {
        id: true,
        userId: true,
        name: true,
        description: true,
        type: true,
        sourceWorkflowId: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newSnapshot, { status: 201 });
  } catch (error) {
    console.error('Error creating snapshot:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}