import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

// Define the expected type for the params object based on the folder structure
interface RouteContext {
  params: { workflowId: string };
}

export async function GET(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { workflowId } = context.params;
  console.log(`GET request for workflowId: ${workflowId}, userId: ${userId}`);
  return NextResponse.json({ message: `GET workflow ${workflowId}` });
}

export async function PUT(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { workflowId } = context.params;
  const body = await request.json();
  console.log(`PUT request for workflowId: ${workflowId}, userId: ${userId}`, body);
  return NextResponse.json({ message: `PUT workflow ${workflowId}`, received: body });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { workflowId } = context.params;
  console.log(`DELETE request for workflowId: ${workflowId}, userId: ${userId}`);
  return NextResponse.json({ message: `DELETE workflow ${workflowId}` });
}