// src/app/api/models/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

const prisma = new PrismaClient();

// GET /api/models - Fetch all available models
// Authentication might not be strictly required if models are considered public info
export async function GET(request: Request) {
  try {
    // If auth is needed, use this block:
    // const { userId } = await auth();
    // if (!userId) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    const models = await prisma.model.findMany({
      orderBy: { name: 'asc' }, // Or order by provider, etc.
    });

    return NextResponse.json(models);
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// Note: POST/PUT/DELETE for models might be restricted to admin users
// and handled elsewhere or require specific role checks.