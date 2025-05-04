import { StageDetail, ExecutionLog } from '@/services/apiClient';
import { useWorkflowStore } from '@/store/workflowStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StageBox } from './StageBox';
import { StageDetailView } from './StageDetailView';

interface WorkflowStageRailProps {
  stages: StageDetail[];
  logs: ExecutionLog[];
  workflowName: string;
  onShowPreview: (stageOrder: number, element: HTMLElement | null) => void;
  onHidePreview: () => void;
  onTriggerSnapshotDrawer: () => void;
}

export const WorkflowStageRail = ({
  stages,
  logs,
  workflowName,
  onShowPreview,
  onHidePreview,
  onTriggerSnapshotDrawer,
}: WorkflowStageRailProps) => {
  const activeStageOrder = useWorkflowStore((state) => state.activeStageOrder);
  const currentExecutionId = useWorkflowStore((state) => state.currentExecutionId);

  const activeStage = stages.find((s) => s.stageOrder === activeStageOrder);
  const latestLogForActiveStage = activeStage
    ? logs
        .filter((log) => log.stageId === activeStage.id && log.executionId === currentExecutionId)
        .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0] || null
    : null;

  return (
    <div className="space-y-6">
      {/* Stage Rail */}
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {stages
          .sort((a, b) => a.stageOrder - b.stageOrder)
          .map((stage) => (
            <StageBox
              key={stage.id}
              stage={stage}
              latestLog={logs?.findLast(log => log.stageId === stage.id && log.executionId === currentExecutionId)}
              onMouseEnter={onShowPreview}
              onMouseLeave={onHidePreview}
            />
          ))}
      </div>
      {/* Stage Detail View - Rendered when a stage is active */}
      {activeStage ? (
        <StageDetailView
          key={activeStage.id}
          workflowId={activeStage.workflowId}
          stage={activeStage}
          currentExecutionId={currentExecutionId}
          latestLogForStage={latestLogForActiveStage}
          activeTab="prompt"
          onTriggerSnapshotDrawer={onTriggerSnapshotDrawer}
        />
      ) : (
        <div className="text-center text-muted-foreground py-10">
          Select a stage from the rail above to view details.
        </div>
      )}
    </div>
  );
};