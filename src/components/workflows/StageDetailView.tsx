import { useState, useEffect } from 'react';
import { StageDetail, SnapshotDetail, ExecutionLog } from '@/services/apiClient';
import { useWorkflowStore } from '@/store/workflowStore';
import { useGetSnapshots, useRestoreSnapshot, useCreateSnapshot } from '@/hooks/useSnapshots';
import { useUpdateStage } from '@/hooks/useWorkflows';
import { useDebouncedCallback } from 'use-debounce';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format } from 'date-fns';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useRecordManualValidation, useRetryStage } from '@/hooks/useExecutions';
import { Loader2, ThumbsUp } from 'lucide-react';

interface StageDetailViewProps {
  workflowId: string;
  stage: StageDetail;
  activeTab: 'prompt' | 'output' | 'snapshots';
  currentExecutionId?: string | null;
  onTriggerSnapshotDrawer: () => void;
  latestLogForStage?: ExecutionLog | null;
}

export const StageDetailView = ({
  workflowId,
  stage,
  activeTab,
  currentExecutionId,
  onTriggerSnapshotDrawer,
  latestLogForStage,
}: StageDetailViewProps) => {
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);

  const [prompt, setPrompt] = useState(stage.promptTemplate || '');
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  const { data: snapshots = [], isLoading: isLoadingSnapshots } = useGetSnapshots({ workflowId: activeWorkflowId || '', stageId: stage.id });
  const { mutate: restoreSnapshot } = useRestoreSnapshot();
  const { mutate: createSnapshot } = useCreateSnapshot();
  const { mutate: updateStage } = useUpdateStage();
  const { toast } = useToast();
  const { mutate: recordValidation, isPending: isValidating } = useRecordManualValidation();
  const { mutate: retryStage, isPending: isRetrying } = useRetryStage();

  useEffect(() => {
    setPrompt(stage.promptTemplate || '');
  }, [stage.promptTemplate]);

  const debouncedSavePrompt = useDebouncedCallback((newPrompt: string) => {
    if (newPrompt !== stage.promptTemplate) {
      setIsSavingPrompt(true);
      updateStage(
        { workflowId: activeWorkflowId || '', stageId: stage.id, data: { promptTemplate: newPrompt } },
        {
          onSuccess: () => setIsSavingPrompt(false),
          onError: () => setIsSavingPrompt(false),
        }
      );
    }
  }, 1000);

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    debouncedSavePrompt(newPrompt);
  };

  const handleRestore = (snapshotId: string) => {
    restoreSnapshot(snapshotId, {
      onSuccess: () => {},
      onError: () => {},
    });
  };

  const handleTakeSnapshot = () => {
    if (!latestLogForStage?.executionId) return;
    const stateData = { prompt };
    const snapshotName = `Snapshot @ ${format(new Date(), 'Pp')}`;
    createSnapshot({ executionId: latestLogForStage.executionId, stageId: stage.id, name: snapshotName, stateData }, {
      onSuccess: () => {},
      onError: () => {},
    });
  };

  const handleManualValidation = (isPass: boolean) => {
    if (!currentExecutionId || !stage.id) return;
    recordValidation(
      {
        executionId: currentExecutionId,
        stageId: stage.id,
        validationResult: isPass ? 'pass' : 'fail',
        comments: isPass ? 'Manually passed' : 'Manually failed',
      },
      {
        onSuccess: () => toast({ title: 'Validation recorded', description: `Stage marked as ${isPass ? 'Passed' : 'Failed'}.` }),
        onError: () => toast({ title: 'Error', description: 'Failed to record manual validation.', variant: 'destructive' }),
      }
    );
  };

  const handleRetryStage = () => {
    if (!currentExecutionId || !stage.id) return;
    retryStage(
      { executionId: currentExecutionId, stageId: stage.id },
      {
        onSuccess: () => toast({ title: 'Retry started', description: 'Stage retry initiated.' }),
        onError: () => toast({ title: 'Error', description: 'Failed to retry stage.', variant: 'destructive' }),
      }
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'prompt':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="prompt" className="text-sm font-medium text-foreground">
                Edit Prompt
              </Label>
              <span className={`text-xs ${isSavingPrompt ? 'text-blue-500 animate-pulse' : 'text-muted-foreground'}`}>
                {isSavingPrompt ? 'Saving...' : 'Changes saved automatically'}
              </span>
            </div>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={handlePromptChange}
              className="w-full min-h-[200px] sm:min-h-[300px] md:min-h-[400px] p-4 border rounded-md shadow-sm text-base focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Enter your prompt template here..."
            />
          </div>
        );
      case 'output':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="output" className="text-sm font-medium text-foreground">
                Latest Output
              </Label>
              {latestLogForStage?.endedAt && (
                 <span className="text-xs text-muted-foreground">
                   Generated at: {format(new Date(latestLogForStage.endedAt), 'Pp')}
                 </span>
              )}
            </div>
            <Card id="output" className="w-full min-h-[200px] sm:min-h-[300px] md:min-h-[400px]">
              <CardContent className="p-4 whitespace-pre-wrap text-base overflow-y-auto">
                {latestLogForStage ? (
                  latestLogForStage.status === 'failed' || latestLogForStage.status === 'error' ? (
                    latestLogForStage.errorDetails ? (
                      <Alert variant="destructive" className="mb-4">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{latestLogForStage.errorDetails}</AlertDescription>
                      </Alert>
                    ) : (
                      <span className="text-destructive">Stage failed, but no error details provided.</span>
                    )
                  ) : latestLogForStage.status === 'completed' || latestLogForStage.status === 'passed' ? (
                    <pre className="whitespace-pre-wrap break-words">{latestLogForStage.processedOutput || latestLogForStage.rawOutput || 'No output recorded for this status.'}</pre>
                  ) : latestLogForStage.status === 'running' || latestLogForStage.status === 'pending' ? (
                    <span className="text-muted-foreground italic">{latestLogForStage.status === 'running' ? 'Running...' : 'Pending...'}</span>
                  ) : (
                    <span className="text-muted-foreground italic">No output recorded for this status.</span>
                  )
                ) : (
                  <span className="text-muted-foreground italic">No output available yet.</span>
                )}
              </CardContent>
            </Card>
            {stage.validationType === 'MANUAL' && latestLogForStage?.status === 'awaiting_validation' && (
              <div className="flex gap-4 mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManualValidation(true)}
                  disabled={isValidating}
                  className="flex-1 border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />} Pass
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleManualValidation(false)}
                  disabled={isValidating}
                >
                  Fail
                </Button>
              </div>
            )}
            {currentExecutionId &&
              (latestLogForStage?.status === 'failed' || latestLogForStage?.status === 'error') &&
              (typeof stage.retryLimit === 'number' && (latestLogForStage?.retryCount ?? 0) < stage.retryLimit) && (
                <div className="mt-4">
                  <Button
                    variant="outline"
                    onClick={handleRetryStage}
                    disabled={isRetrying}
                  >
                    Retry Stage
                  </Button>
                </div>
              )}
          </div>
        );
      case 'snapshots':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-foreground">Available Snapshots</h3>
              <Button variant="outline" size="sm" onClick={handleTakeSnapshot} disabled={!latestLogForStage?.executionId}>
                Take Snapshot
              </Button>
            </div>
            {isLoadingSnapshots ? (
              <div>Loading snapshots...</div>
            ) : snapshots.length === 0 ? (
              <Card className="text-center py-10 border-dashed">
                <CardContent className="flex flex-col items-center">
                  <p className="text-sm text-muted-foreground mb-4">No snapshots available for this stage yet.</p>
                  <Button size="sm" onClick={handleTakeSnapshot} disabled={!latestLogForStage?.executionId}>
                    Create First Snapshot
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ScrollArea className="max-h-96 pr-3">
                <div className="space-y-3">
                  {snapshots.map(snapshot => (
                    <Card key={snapshot.id} className="transition-colors hover:border-primary/50">
                      <CardHeader className="p-3 pb-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-sm font-medium mb-1">
                              {snapshot.name || `Snapshot from ${format(new Date(snapshot.createdAt), 'Pp')}`}
                            </CardTitle>
                            <CardDescription className="text-xs">
                              Contains captured state data
                            </CardDescription>
                          </div>
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRestore(snapshot.id)}
                            >
                              Restore
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-3 pt-0">
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            Created: {format(new Date(snapshot.createdAt), 'P p')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return renderTabContent();
};