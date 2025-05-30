// src/app/api/snapshots/[snapshotId]/route.ts
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Define the expected type for the dynamic segment
interface SnapshotRouteContext {
  params: { snapshotId: string };
}

const prisma = new PrismaClient();

// GET /api/snapshots/{snapshotId} - Fetch a specific snapshot (including data)
export async function GET(request: Request, context: SnapshotRouteContext) {
  try {
    const { userId } = await auth();
    const { snapshotId } = context.params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const snapshot = await prisma.snapshot.findUnique({
      where: {
        id: snapshotId,
        userId: userId, // Ensure user owns the snapshot
      },
      // Include snapshotData when fetching a single snapshot
    });

    if (!snapshot) {
      return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
    }

    return NextResponse.json(snapshot);
  } catch (error) {
    console.error(`Error fetching snapshot ${context.params.snapshotId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE /api/snapshots/{snapshotId} - Delete a specific snapshot
export async function DELETE(request: Request, context: SnapshotRouteContext) {
  try {
    const { userId } = await auth();
    const { snapshotId } = context.params;

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use deleteMany to leverage the where clause for ownership check
    const deleteResult = await prisma.snapshot.deleteMany({
      where: {
        id: snapshotId,
        userId: userId,
      },
    });

    if (deleteResult.count === 0) {
      return NextResponse.json({ error: 'Snapshot not found or access denied' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Snapshot deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error deleting snapshot ${context.params.snapshotId}:`, error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}