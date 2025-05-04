// src/app/api/workflows/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET /api/workflows - Fetch all workflows for the authenticated user
export async function GET(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      // Optionally include related data like stages
      // include: { stages: true }
    });

    return NextResponse.json(workflows);
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST /api/workflows - Create a new workflow for the authenticated user
export async function POST(request: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, metadata } = body;

    if (!name) {
      return NextResponse.json({ error: 'Workflow name is required' }, { status: 400 });
    }

    const newWorkflow = await prisma.workflow.create({
      data: {
        userId,
        name,
        description: description || null,
        metadata: metadata || {},
      },
    });

    return NextResponse.json(newWorkflow, { status: 201 });
  } catch (error) {
    console.error('Error creating workflow:', error);
    // Consider more specific error handling (e.g., validation errors)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}