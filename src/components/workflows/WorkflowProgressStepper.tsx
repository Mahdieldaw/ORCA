// src/components/workflows/WorkflowProgressStepper.tsx
'use client';

import React from 'react';
import { Stage } from '@prisma/client'; // Assuming Stage type from Prisma
import { ExecutionLog } from '@/services/apiClient'; // Import ExecutionLog type
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils'; // For conditional classes
import { CheckCircle, XCircle, Loader2, CircleDashed, Circle } from 'lucide-react'; // Icons for status

interface WorkflowProgressStepperProps {
  stages: Stage[];
  logs: ExecutionLog[] | null | undefined; // Logs for the current execution
  currentStageId?: string | null; // Optional: Highlight the currently active stage
}

// Helper to determine the status of a stage based on logs
const getStageStatus = (stageId: string, logs: ExecutionLog[] | null | undefined): {
  status: 'completed' | 'failed' | 'running' | 'pending' | 'awaiting_validation';
  latestLog?: ExecutionLog;
} => {
  if (!logs) {
    return { status: 'pending' };
  }

  // Find the latest log entry for this specific stage
  const stageLogs = logs
    .filter(log => log.stageId === stageId)
    .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()); // Sort descending by time

  const latestLog = stageLogs[0];

  if (!latestLog) {
    return { status: 'pending' }; // No logs yet for this stage
  }

  // Map ExecutionLog status to simpler stepper status
  switch (latestLog.status?.toLowerCase()) {
    case 'completed':
    case 'passed': // Treat 'passed' (manual validation) as completed
      return { status: 'completed', latestLog };
    case 'failed':
    case 'error':
      return { status: 'failed', latestLog };
    case 'running':
      return { status: 'running', latestLog };
    case 'awaiting_validation':
      return { status: 'awaiting_validation', latestLog };
    case 'pending':
    default:
      return { status: 'pending', latestLog }; // Default to pending if status is unknown or explicitly pending
  }
};

// Map status to icon and color
const getStatusVisuals = (status: 'completed' | 'failed' | 'running' | 'pending' | 'awaiting_validation') => {
  switch (status) {
    case 'completed':
      return { Icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100' };
    case 'failed':
      return { Icon: XCircle, color: 'text-red-500', bgColor: 'bg-red-100' };
    case 'running':
      return { Icon: Loader2, color: 'text-blue-500', bgColor: 'bg-blue-100', animate: 'animate-spin' };
    case 'awaiting_validation':
       return { Icon: CircleDashed, color: 'text-yellow-500', bgColor: 'bg-yellow-100' };
    case 'pending':
    default:
      return { Icon: Circle, color: 'text-gray-400', bgColor: 'bg-gray-100' };
  }
};

export const WorkflowProgressStepper: React.FC<WorkflowProgressStepperProps> = ({ stages, logs, currentStageId }) => {
  if (!stages || stages.length === 0) {
    return <p className="text-sm text-muted-foreground">No stages defined for this workflow.</p>;
  }

  // Sort stages by their order
  const sortedStages = [...stages].sort((a, b) => a.stageOrder - b.stageOrder);

  return (
    <div className="flex items-center space-x-2 overflow-x-auto p-2 bg-muted rounded-md mb-4">
      {sortedStages.map((stage, index) => {
        const { status } = getStageStatus(stage.id, logs);
        const { Icon, color, bgColor, animate } = getStatusVisuals(status);
        const isCurrent = stage.id === currentStageId; // Check if it's the highlighted stage

        return (
          <React.Fragment key={stage.id}>
            {/* Step Indicator */} 
            <div className={cn(
              'flex flex-col items-center text-center p-2 rounded-md transition-all duration-200',
              isCurrent ? 'ring-2 ring-primary ring-offset-2 bg-primary/10' : '',
              'min-w-[100px]' // Ensure minimum width for readability
            )}>
              <div className={cn('w-8 h-8 rounded-full flex items-center justify-center mb-1', bgColor)}>
                <Icon className={cn('w-5 h-5', color, animate)} />
              </div>
              <span className="text-xs font-medium truncate max-w-[90px]" title={stage.name ?? 'Unnamed Stage'}>{stage.name ?? 'Unnamed Stage'}</span>
              <Badge variant={status === 'failed' ? 'destructive' : status === 'completed' ? 'default' : 'secondary'} className="text-xxs capitalize mt-1">
                {status.replace('_', ' ')}
              </Badge>
            </div>

            {/* Connector Line (except for the last item) */} 
            {index < sortedStages.length - 1 && (
              <div className="flex-1 h-0.5 bg-border" />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};