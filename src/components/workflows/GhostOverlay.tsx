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

interface GhostOverlayProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  executionId: string | null; // ID of the execution to show history for
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

// Simple component to render a history entry using ExecutionLog type
const HistoryEntry: React.FC<{ item: ExecutionLog }> = ({ item }) => {
  const statusVariant = getStatusVariant(item.status);

  return (
    <div className="p-2 border-b last:border-b-0">
      <div className="flex justify-between items-center mb-1">
        {/* Assuming stage name needs to be fetched or derived if not directly in log */}
        <p className="text-sm font-medium">Stage {item.stageOrder} (ID: {item.stageId.substring(0, 6)}...)</p>
        <Badge variant={statusVariant} className="text-xs capitalize">{item.status}</Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-1">Started: {new Date(item.startedAt).toLocaleString()}</p>
      {/* Display summary or relevant output/error */}
      <p className="text-xs truncate">
        {item.errorDetails ? `Error: ${item.errorDetails}` : (item.processedOutput ? `Output: ${JSON.stringify(item.processedOutput)}` : 'No output/error details.')}
      </p>
    </div>
  );
};

export const GhostOverlay: React.FC<GhostOverlayProps> = ({ isOpen, onOpenChange, executionId }) => {
  // Fetch execution logs using the hook
  const { data: logs, isLoading, error } = useGetExecutionLogs(executionId!, {
    enabled: isOpen && !!executionId, // Only fetch if open and executionId is provided
  });

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
            {executionId ? `Logs for Execution: ${executionId.substring(0, 8)}...` : 'No execution selected'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0 flex-grow overflow-hidden"> {/* Remove padding, manage scroll */}
          <ScrollArea className="h-full"> {/* Make ScrollArea fill the content */}
            <div className="p-2"> {/* Add padding inside ScrollArea */}
              {/* Loading State */}
              {isLoading && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {/* Error State */}
              {error && (
                <div className="flex flex-col items-center text-destructive py-4">
                  <AlertTriangle className="h-6 w-6 mb-2" />
                  <p className="text-sm">Error loading logs:</p>
                  <p className="text-xs">{error.message}</p>
                </div>
              )}

              {/* No Execution ID State */}
              {!executionId && !isLoading && !error && (
                 <p className="text-sm text-muted-foreground text-center py-4">Select an execution to view logs.</p>
              )}

              {/* Success State - Data Available */}
              {!isLoading && !error && executionId && logs && logs.length > 0 && (
                logs.map((item) => (
                  <HistoryEntry key={item.id} item={item} />
                ))
              )}

              {/* Success State - No Data */}
              {!isLoading && !error && executionId && (!logs || logs.length === 0) && (
                <p className="text-sm text-muted-foreground text-center py-4">No history available for this execution.</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};