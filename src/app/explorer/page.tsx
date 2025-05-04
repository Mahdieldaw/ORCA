'use client';

import { useEffect, useState } from 'react';
import { useWorkflowStore } from '@/store/workflowStore';
import { useGetWorkflows, useGetWorkflowDetail } from '@/hooks/useWorkflows';
import { useGetExecutions, useGetExecutionLogs, useStartExecution } from '@/hooks/useExecutions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { WorkflowStageRail } from '@/components/workflows/WorkflowStageRail';
import { StagePreviewOverlay } from '@/components/workflows/StagePreviewOverlay';
import { StartExecutionModal } from '@/components/workflows/StartExecutionModal';
import { HybridThinkDrawer } from '@/components/workflows/HybridThinkDrawer';
import { toast } from '@/hooks/use-toast';
import GlobalLayout from '@/components/layout/GlobalLayout';

export default function ExplorerPage() {
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);
  const setActiveWorkflowId = useWorkflowStore((state) => state.setActiveWorkflowId);
  const currentExecutionId = useWorkflowStore((state) => state.currentExecutionId);
  const setCurrentExecutionId = useWorkflowStore((state) => state.setCurrentExecutionId);
  const setActiveStageOrder = useWorkflowStore((state) => state.setActiveStageOrder);

  const { data: workflows, isLoading: isLoadingWorkflows, error: workflowsError } = useGetWorkflows();
  const { data: workflowDetail, isLoading: isLoadingWorkflowDetail, error: workflowDetailError } = useGetWorkflowDetail(activeWorkflowId || undefined);
  const { data: executions = [], isLoading: isLoadingExecutions, error: executionsError } = useGetExecutions(activeWorkflowId ? { workflowId: activeWorkflowId } : undefined);
  const { data: executionLogs = [], isLoading: isLoadingLogs, error: logsError } = useGetExecutionLogs(currentExecutionId);

  const [hoveredStageOrder, setHoveredStageOrder] = useState<number | null>(null);
  const [previewPosition, setPreviewPosition] = useState<{ x: number; y: number; side: 'left' | 'right' }>({ x: 0, y: 0, side: 'right' });

  const handleStageMouseEnter = (stageOrder: number, element: HTMLElement | null) => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const overlayWidth = 400;
    const spacing = 16;
    let x: number;
    let side: 'left' | 'right';
    if (viewportWidth - rect.right >= overlayWidth + spacing) {
      x = rect.right + spacing;
      side = 'right';
    } else if (rect.left >= overlayWidth + spacing) {
      x = rect.left - overlayWidth - spacing;
      side = 'left';
    } else {
      x = Math.max(spacing, Math.min(viewportWidth - overlayWidth - spacing, rect.left - (overlayWidth / 2) + (rect.width / 2)));
      side = 'right';
    }
    setPreviewPosition({ x, y: rect.top, side });
    setHoveredStageOrder(stageOrder);
  };

  const handleStageMouseLeave = () => {
    setHoveredStageOrder(null);
  };

  const [isSnapshotDrawerOpen, setIsSnapshotDrawerOpen] = useState(false);
  const handleTriggerSnapshotDrawer = () => setIsSnapshotDrawerOpen(true);

  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const { mutate: startExecution, isPending: isStartingExecution } = useStartExecution();

  useEffect(() => {
    if (workflowsError) toast({ title: 'Error', description: 'Failed to load workflows.' });
    if (workflowDetailError) toast({ title: 'Error', description: 'Failed to load workflow details.' });
    if (executionsError) toast({ title: 'Error', description: 'Failed to load executions.' });
    if (logsError) toast({ title: 'Error', description: 'Failed to load execution logs.' });
  }, [workflowsError, workflowDetailError, executionsError, logsError]);

  return (
    <GlobalLayout>
      <div className="flex min-h-screen bg-background">
        <aside className="w-[260px] border-r bg-card p-4 flex flex-col">
          <h2 className="text-lg font-semibold mb-4">Workflows</h2>
          {isLoadingWorkflows ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-10 w-full rounded" />
              ))}
            </div>
          ) : workflows && workflows.length > 0 ? (
            <div className="space-y-2">
              {workflows.map((wf) => (
                <Card
                  key={wf.id}
                  className={`cursor-pointer transition-colors ${activeWorkflowId === wf.id ? 'border-primary bg-secondary/30' : 'hover:border-muted-foreground/40'}`}
                  onClick={() => setActiveWorkflowId(wf.id)}
                  tabIndex={0}
                  aria-pressed={activeWorkflowId === wf.id}
                >
                  <CardHeader className="p-3 pb-1">
                    <CardTitle className="text-base font-medium truncate">{wf.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-3 pt-0 text-xs text-muted-foreground line-clamp-2">
                    {wf.description || 'No description'}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">No workflows found.</div>
          )}
        </aside>

        <main className="flex-1 p-6 relative">
          <h2 className="text-2xl font-semibold mb-4">Workflow Details</h2>
          {activeWorkflowId ? (
            isLoadingWorkflowDetail || isLoadingExecutions || isLoadingLogs ? (
              <div className="space-y-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            ) : workflowDetail ? (
              <WorkflowStageRail
                stages={workflowDetail.stages}
                logs={executionLogs ?? []}
                workflowName={workflowDetail.name}
                onShowPreview={handleStageMouseEnter}
                onHidePreview={handleStageMouseLeave}
                onTriggerSnapshotDrawer={handleTriggerSnapshotDrawer}
              />
            ) : (
              <div className="text-muted-foreground text-center mt-20 border rounded-lg bg-card p-10">
                Workflow <span className="font-mono">{activeWorkflowId.substring(0, 8)}...</span> not found or failed to load.
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-muted-foreground border rounded-lg bg-card p-10">
              <h3 className="text-xl font-semibold mb-2">Select a workflow to get started</h3>
              <p className="text-center max-w-md">
                Choose a workflow from the left panel to view its stages, run executions, and manage snapshots.
              </p>
            </div>
          )}

          {workflowDetail && hoveredStageOrder !== null && (
            (() => {
              const hoveredStage = workflowDetail.stages.find((stage) => stage.stageOrder === hoveredStageOrder);
              return hoveredStage ? <StagePreviewOverlay stage={hoveredStage} position={previewPosition} /> : null;
            })()
          )}

          <StartExecutionModal
            isOpen={isStartModalOpen}
            onOpenChange={setIsStartModalOpen}
            workflowId={activeWorkflowId || ''}
            workflowName={workflowDetail?.name || 'Workflow'}
            onSubmit={(inputs) => {
              if (!activeWorkflowId) return;
              startExecution(
                { workflowId: activeWorkflowId, inputs },
                {
                  onSuccess: (execution) => {
                    toast({ title: 'Execution Started', description: `Execution ${execution.id} initiated.` });
                    setCurrentExecutionId(execution.id);
                    setActiveStageOrder(1);
                    setIsStartModalOpen(false);
                  },
                  onError: (startError) => {
                    toast({
                      title: 'Execution Failed',
                      description: `Could not start: ${
                        startError instanceof Error ? startError.message : String(startError)
                      }`,
                      variant: 'destructive',
                    });
                  },
                }
              );
            }}
            isStartingExecution={isStartingExecution}
          />
          <HybridThinkDrawer
            isOpen={isSnapshotDrawerOpen}
            onOpenChange={setIsSnapshotDrawerOpen}
            workflowId={activeWorkflowId}
          />
        </main>
      </div>
    </GlobalLayout>
  );
}