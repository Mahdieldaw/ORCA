// src/components/workflows/GhostOverlay.tsx
'use client';

import React from 'react';
// Remove mock data import
// import { mockHistory, MockHistoryItem } from '@/data/mockWorkflows';
import { useGetExecutionLogs } from '@/hooks/useExecutions'; // Import hook
import { ExecutionLog } from '@/services/apiClient'; // Import type
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area'; // Use ScrollArea for potentially long history
import { Loader2, AlertTriangle } from 'lucide-react'; // Icons for loading/error
import { Stage } from '@prisma/client'; // Import Stage type

interface GhostOverlayProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  workflowId: string | null; // Added workflowId
  currentExecutionId: string | null; // Renamed from executionId for clarity
  executionLogs: ExecutionLog[]; // Added executionLogs
  isLoading: boolean; // Added isLoading
  error: Error | null; // Update error type to be more specific
  stages: Stage[]; // Added stages for context
}

// Map log status to badge variant
const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'passed':
      return 'default'; // Greenish (default)
    case 'failed':
    case 'error':
      return 'destructive'; // Red
    case 'running':
    case 'pending':
      return 'secondary'; // Grayish
    case 'skipped':
      return 'outline'; // Outline
    default:
      return 'secondary';
  }
};

import { Label } from '@/components/ui/label'; // Added Label import

// Updated component to render detailed history entry using ExecutionLog type
const HistoryEntry: React.FC<{ item: ExecutionLog }> = ({ item }) => {
  const validationResult = item.validationResult; // Using validationResult directly from ExecutionLog
  const retryCount = item.retryCount ?? 0; // Using retryCount instead of attemptNumber
  const executedAt = item.endedAt ?? item.startedAt;

  return (
    <div className="p-2 border-b last:border-b-0 text-xs">
      <div className="flex justify-between items-center mb-1">
        <p className="font-medium">Stage {item.stageOrder} <span className="text-muted-foreground">(Attempt {retryCount + 1})</span></p>
        <Badge variant={getStatusVariant(validationResult ?? item.status)} className="capitalize">{validationResult ?? item.status}</Badge>
      </div>
      <p className="text-muted-foreground mb-1">Executed: {executedAt ? new Date(executedAt).toLocaleString() : 'N/A'}</p>
      {item.inputs && <div><Label className="text-xxs uppercase text-muted-foreground">Inputs:</Label><pre className="text-xxs bg-muted/50 p-1 rounded overflow-auto max-h-20">{JSON.stringify(item.inputs, null, 2)}</pre></div>}
      {item.rawOutput && <div><Label className="text-xxs uppercase text-muted-foreground">Raw Output:</Label><pre className="text-xxs bg-muted/50 p-1 rounded overflow-auto max-h-20">{item.rawOutput}</pre></div>}
      {item.processedOutput && <div><Label className="text-xxs uppercase text-muted-foreground">Processed Output:</Label><pre className="text-xxs bg-muted/50 p-1 rounded overflow-auto max-h-20">{JSON.stringify(item.processedOutput, null, 2)}</pre></div>}
      {item.errorDetails && <p className="text-destructive mt-1">Error: {item.errorDetails}</p>}
    </div>
  );
};

export const GhostOverlay: React.FC<GhostOverlayProps> = ({
  isOpen,
  onOpenChange,
  workflowId, // Destructure new props
  currentExecutionId,
  executionLogs,
  isLoading,
  error,
  stages // Destructure new props
}) => {
  // Remove the internal useGetExecutionLogs hook, as logs are now passed as props
  // const { data: logs, isLoading, error } = useGetExecutionLogs(currentExecutionId!, {
  //   enabled: isOpen && !!currentExecutionId, // Only fetch if open and executionId is provided
  // });

  if (!isOpen) return null; // Don't render if not open

  // Basic floating card style for Phase 1
  return (
    <div className="fixed bottom-4 right-4 z-50"> {/* Basic fixed positioning */}
      <Card className="w-[350px] max-h-[50vh] flex flex-col shadow-lg">
        <CardHeader className="py-3 px-4 border-b">
          <div className="flex justify-between items-center">
            <CardTitle className="text-base">Execution History</CardTitle>
            <button
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close history"
            >
              &times; {/* Simple close icon */}
            </button>
          </div>
          <CardDescription className="text-xs">
            {currentExecutionId ? `Logs for Execution: ${currentExecutionId.substring(0, 8)}...` : 'No execution selected'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden"> {/* Remove padding, manage scroll */}
          <ScrollArea className="h-full"> {/* Make ScrollArea fill the content */}
            <div className="p-2"> {/* Add padding inside ScrollArea */}
              {/* Loading State - Use passed prop */}
              {isLoading && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Error State - Use passed prop */}
              {error && (
                <div className="flex flex-col items-center text-destructive py-4">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <p className="text-sm">Error loading logs:</p>
                  <p className="text-xs">{error.message}</p>
                </div>
              )}

              {/* No Execution ID State */}
              {!currentExecutionId && !isLoading && !error && (
                 <p className="text-sm text-muted-foreground text-center py-4">Select or start an execution to view logs.</p>
              )}

              {/* Success State - Data Available - Use passed prop */}
              {!isLoading && !error && currentExecutionId && executionLogs && executionLogs.length > 0 && (
                executionLogs.map((item) => (
                  // TODO: Potentially pass stage name from `stages` prop based on item.stageId
                  <HistoryEntry key={item.id} item={item} />
                ))
              )}

              {/* Success State - No Data - Use passed prop */}
              {!isLoading && !error && currentExecutionId && (!executionLogs || executionLogs.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No history available for this execution yet.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};