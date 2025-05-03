import { useState, useEffect, useCallback } from 'react';
// Use correct types from apiClient
import { StageDetail, SnapshotDetail, ExecutionLog } from '@/services/apiClient';
import { useWorkflowStore } from '@/store/workflowStore'; // Import Zustand store
// Import necessary hooks
import { useGetSnapshots, useRestoreSnapshot, useCreateSnapshot } from '@/hooks/useSnapshots'; // Import snapshot hooks
import { useUpdateStage } from '@/hooks/useWorkflows'; // Import hook for updating stage
import { useDebouncedCallback } from 'use-debounce'; // For debouncing prompt saves
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CameraIcon, HistoryIcon, CheckCircleIcon, XCircleIcon, AlertCircleIcon, InfoIcon } from 'lucide-react';
import { format } from 'date-fns'; // For date formatting

interface StageDetailViewProps {
  stage: StageDetail; // Use StageDetail type
  latestLog?: ExecutionLog | null; // Add latestLog prop
  // validationResult?: ValidationResultStructure | null; // Remove placeholder prop
  activeTab: 'prompt' | 'output' | 'validator' | 'snapshots';
}

// Remove placeholder interface
// interface ValidationResultStructure { ... }

export const StageDetailView = ({ stage, latestLog, activeTab }: StageDetailViewProps) => {
  // Zustand state/actions
  const activeWorkflowId = useWorkflowStore((state) => state.activeWorkflowId);

  // Local state for editable fields like prompt
  const [prompt, setPrompt] = useState(stage.promptTemplate || ''); // Use promptTemplate
  const [isSavingPrompt, setIsSavingPrompt] = useState(false);

  // --- Data Fetching Hooks ---
  // Snapshots
  const { data: snapshots = [], isLoading: isLoadingSnapshots } = useGetSnapshots({ workflowId: activeWorkflowId, stageId: stage.id });
  const { mutate: restoreSnapshot } = useRestoreSnapshot();
  const { mutate: createSnapshot } = useCreateSnapshot();
  // Stage Update
  const { mutate: updateStage } = useUpdateStage();

  // Placeholder for validation loading (if fetched separately later)
  const isLoadingValidation = false;

  // Update local prompt state when stage prop changes
  useEffect(() => {
    setPrompt(stage.promptTemplate || '');
  }, [stage.promptTemplate]);

  // Debounced function to save prompt changes
  const debouncedSavePrompt = useDebouncedCallback((newPrompt: string) => {
    if (newPrompt !== stage.promptTemplate) {
      setIsSavingPrompt(true);
      console.log(`Debounced save: Updating prompt for stage ${stage.id}`);
      updateStage(
        { workflowId: activeWorkflowId, stageId: stage.id, data: { promptTemplate: newPrompt } },
        {
          onSuccess: () => {
            console.log('Prompt updated successfully via debounce.');
            setIsSavingPrompt(false);
            // Optionally add toast notification
          },
          onError: (error) => {
            console.error('Prompt update failed via debounce:', error);
            setIsSavingPrompt(false);
            // Optionally add error toast notification
          },
        }
      );
    }
  }, 1000); // Debounce for 1 second

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    debouncedSavePrompt(newPrompt);
  };

  const handleRestore = (snapshotId: string) => {
    console.log(`Restoring snapshot ${snapshotId} for stage ${stage.id}`);
    restoreSnapshot(snapshotId, {
      onSuccess: (restoredItem) => {
        // Optionally update local state or rely on query invalidation from the hook
        console.log('Restore successful:', restoredItem);
        // Find snapshot prompt and update local state (or rely on data refetch)
        const snapshotToRestore = snapshots.find(s => s.id === snapshotId);
        if (snapshotToRestore) {
          // Assuming stateData contains the prompt, adjust if structure differs
          // This might be redundant if the hook invalidates and refetches workflow/stage data
          setPrompt(snapshotToRestore.stateData?.prompt || '');
        }
      },
      onError: (error) => {
        console.error('Restore failed:', error);
        // Add user feedback (e.g., toast)
      }
    });
  };

  const handleTakeSnapshot = () => {
    console.log(`Taking snapshot for stage ${stage.id} in execution ${latestLog?.executionId}`);
    if (!latestLog?.executionId) {
      console.error('Cannot take snapshot without a valid execution context.');
      // Add user feedback (e.g., toast: 'Run the workflow first')
      return;
    }
    // TODO: Define how to capture 'stateData'. For now, using the current prompt.
    const stateData = { prompt: prompt };
    const snapshotName = `Snapshot @ ${format(new Date(), 'Pp')}`;

    createSnapshot({ executionId: latestLog.executionId, stageId: stage.id, name: snapshotName, stateData }, {
      onSuccess: (newSnapshot) => {
        console.log('Snapshot created:', newSnapshot);
        // Hook's onSuccess should handle invalidation
        // Add user feedback (e.g., toast)
      },
      onError: (error) => {
        console.error('Snapshot creation failed:', error);
        // Add user feedback (e.g., toast)
      }
    });
  };

  // Remove mock validator scores
  // const validatorScores = { ... };

  // Remove themeClasses object
  // const themeClasses = { ... };

  // Helper to render score indicator using Progress component (placeholder)
  const renderScoreIndicator = (label: string, score: number | undefined | null) => {
    if (score === undefined || score === null) {
      return (
        <div className="flex flex-col items-center">
          {/* Progress Placeholder */}
          <div className="w-full h-1.5 bg-muted rounded mb-1" />
          {/* <Progress value={0} className="h-1.5 mb-1" /> */}
          <div className="flex justify-between w-full">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className="text-xs font-medium text-muted-foreground">N/A</span>
          </div>
        </div>
      );
    }

    let colorClass = 'bg-destructive'; // Default red
    if (score >= 80) colorClass = 'bg-green-500';
    else if (score >= 70) colorClass = 'bg-blue-500';
    else if (score >= 60) colorClass = 'bg-yellow-500';

    return (
      <div className="flex flex-col items-center">
        {/* Progress Placeholder */}
        <div className="w-full h-1.5 bg-muted rounded mb-1 overflow-hidden">
           <div className={`h-full ${colorClass}`} style={{ width: `${score}%` }} />
        </div>
        {/* <Progress value={score} className="h-1.5 mb-1" indicatorClassName={colorClass} /> */}
        <div className="flex justify-between w-full">
          <span className="text-xs text-muted-foreground">{label}</span>
          <span className={`text-xs font-medium ${colorClass.replace('bg-', 'text-')}`}>{score}</span>
        </div>
      </div>
    );
  };

  // Content based on active tab
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
              // Disable while saving if needed, though debounce might make this less critical
              // disabled={isSavingPrompt}
            />
            {/* Manual Save Button (Optional - kept for reference) */}
            {/* <Button
              onClick={() => {
                if (prompt !== stage.promptTemplate) {
                  updateStage({ workflowId: activeWorkflowId, stageId: stage.id, data: { promptTemplate: prompt } }, {
                    onSuccess: () => console.log('Manual Save Success'),
                    onError: (err) => console.error('Manual Save Error', err)
                  });
                }
              }}
              disabled={isSavingPrompt || prompt === stage.promptTemplate}
            >
              {isSavingPrompt ? 'Saving...' : 'Save Prompt Manually'}
            </Button> */}
          </div>
        );

      case 'output':
        // Output might come from ExecutionLog, not directly from StageDetail
        // This needs adjustment based on how execution results are fetched and passed
        // const latestLog = null; // Now passed as prop
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label htmlFor="output" className="text-sm font-medium text-foreground">
                Latest Output
              </Label>
              {latestLog?.endedAt && (
                 <span className="text-xs text-muted-foreground">
                   Generated at: {format(new Date(latestLog.endedAt), 'Pp')}
                 </span>
              )}
            </div>
            <Card id="output" className="w-full min-h-[200px] sm:min-h-[300px] md:min-h-[400px]">
              <CardContent className="p-4 whitespace-pre-wrap text-base overflow-y-auto">
                {latestLog?.processedOutput ?? latestLog?.rawOutput ?? <span className="text-muted-foreground italic">No output available yet.</span>}
              </CardContent>
            </Card>
          </div>
        );

      case 'validator':
        if (isLoadingValidation) {
          return <div>Loading validation results...</div>; // Use Skeleton loader
        }
        // Access validation data from props
        const scores = validationResult?.scores || {};
        const overallScore = validationResult?.overallScore;
        const message = validationResult?.message;
        // Determine status based on validationResult or potentially latest ExecutionLog
        const status = validationResult?.status ?? latestLog?.validationResult ?? 'Not Run'; // Use validationResult status or fallback to log

        return (
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-foreground">Validation Scores</h3>
            <Card>
              <CardContent className="p-4 space-y-4">
                {/* Render scores dynamically if available, ensure value is number */}
                {Object.entries(scores).map(([key, value]) => renderScoreIndicator(
                  key.charAt(0).toUpperCase() + key.slice(1),
                  typeof value === 'number' ? value : null // Ensure value is number or null
                ))}

                {(Object.keys(scores).length > 0 || overallScore !== undefined) && (
                  <div className="border-t pt-4 mt-4">
                    {renderScoreIndicator('Overall', typeof overallScore === 'number' ? overallScore : null)}
                  </div>
                )}
                {Object.keys(scores).length === 0 && overallScore === undefined && (
                   <p className="text-sm text-muted-foreground text-center py-4">No scores available.</p>
                )}
              </CardContent>
            </Card>

            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">Validator Message</h3>
              <Alert variant={status === 'passed' ? 'default' : status === 'failed' ? 'destructive' : 'default'} className={status === 'passed' ? 'border-green-500/50' : ''}>
                 {status === 'passed' ? <CheckCircleIcon className="h-4 w-4" /> : status === 'failed' ? <XCircleIcon className="h-4 w-4" /> : <InfoIcon className="h-4 w-4" />}
                 <AlertTitle>
                   {status === 'passed' ? 'Validation Passed' : status === 'failed' ? 'Validation Failed' : 'Validation Status'}
                 </AlertTitle>
                 <AlertDescription>
                   {message || (status === 'Not Run' || !status ? 'Validation has not been run yet.' : 'No specific message provided.')}
                 </AlertDescription>
               </Alert>
            </div>
          </div>
        );

      case 'snapshots':
        return (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium text-foreground">Available Snapshots</h3>
              <Button variant="outline" size="sm" onClick={handleTakeSnapshot} disabled={!latestLog?.executionId}>
                <CameraIcon className="mr-2 h-4 w-4" />
                Take Snapshot
              </Button>
            </div>

            {isLoadingSnapshots ? (
              <div>Loading snapshots...</div> // Use Skeleton loader
            ) : snapshots.length === 0 ? (
              <Card className="text-center py-10 border-dashed">
                <CardContent className="flex flex-col items-center">
                  <HistoryIcon className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
                  <p className="text-sm text-muted-foreground mb-4">No snapshots available for this stage yet.</p>
                  <Button size="sm" onClick={handleTakeSnapshot} disabled={!latestLog?.executionId}>
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
                            {snapshot.stateData?.prompt?.substring(0, 150) || <i>No prompt saved</i>}...
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