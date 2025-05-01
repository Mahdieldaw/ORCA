// src/components/workflows/StageController.tsx
'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
// Remove redundant useGetWorkflowDetail import
// import { useGetWorkflowDetail, useUpdateStage } from '@/hooks/api/workflows'; 
import { useUpdateStage } from '@/hooks/useStages'; // Corrected import path for useUpdateStage
import { Stage } from '@prisma/client'; // Import Stage type from Prisma
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ban, CircleCheck, CircleDashed, RefreshCcw, Save, Play, ThumbsUp, ThumbsDown, Loader2, RotateCcw, Info } from 'lucide-react'; // Added Info icon
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
// Corrected import path for execution hooks
import { useStartWorkflowExecution, useRecordManualValidation, useRetryStage, useGetExecutionLogs } from '@/hooks/useExecutions'; 
import { useToast } from '@/components/ui/use-toast'; // Import useToast
import { ExecutionLog } from '@/services/apiClient'; // Import ExecutionLog type

// Remove ApiWorkflowDetail interface, use Stage from Prisma
// interface ApiWorkflowDetail { ... }

interface StageControllerProps {
  workflowId: string; // ID of the parent workflow
  stage: Stage; // Pass the specific stage object as a prop
  currentExecutionId?: string | null; // Pass current execution ID
  onTriggerSnapshotDrawer: () => void; // Renamed prop
  // Add props for relevant execution log data for this stage
  latestLogForStage?: ExecutionLog | null;
}

// Helper to render validation status visually
const ValidationStatusIndicator: React.FC<{ type: Stage['validationType'], criteria: string | null }> = ({ type, criteria }) => {
  let statusText = 'None';
  let Icon = Ban;
  let variant: "outline" | "secondary" | "destructive" | "default" = "outline";

  if (type === 'MANUAL') { // Use enum value from Prisma schema
    statusText = 'Manual Validation';
    Icon = CircleCheck; // Placeholder, real status comes later
    variant = "secondary";
  } else if (type === 'REGEX' && criteria) { // Use enum value
    statusText = `Regex: ${criteria}`; // Display criteria if available
    Icon = CircleDashed; // Placeholder
    variant = "secondary";
  }

  return (
    <Badge variant={variant} className="flex items-center space-x-1">
      <Icon className="h-3 w-3" />
      <span>{statusText}</span>
    </Badge>
  );
};

export const StageController: React.FC<StageControllerProps> = ({
  workflowId,
  stage,
  currentExecutionId,
  onTriggerSnapshotDrawer,
  latestLogForStage, // Receive the latest log for this stage
}) => {
  // Remove internal data fetching for stage details
  // const { data: stageDetail, isLoading, error } = useGetWorkflowDetail(activeWorkflowId);

  // Instantiate the mutation hooks
  const { mutate: startExecution, isPending: isStartingExecution } = useStartWorkflowExecution();
  const { mutate: updateStage, isPending: isUpdatingStage } = useUpdateStage(); // Instantiate update hook
  const { mutate: recordValidation, isPending: isValidating } = useRecordManualValidation(); // Validation hook
  const { mutate: retryStage, isPending: isRetrying } = useRetryStage(); // Retry hook
  const { toast } = useToast(); // Initialize toast

  // State to manage the editable prompt, initialized from the stage prop
  const [prompt, setPrompt] = useState(stage.promptTemplate || '');

  // Update prompt state if the stage prop changes (e.g., navigating between stages)
  useEffect(() => {
    setPrompt(stage.promptTemplate || '');
  }, [stage]);

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  const handleStartExecution = () => {
    // Start the PARENT workflow
    if (!workflowId) {
      toast({ title: "Error", description: "Workflow ID is missing.", variant: "destructive" });
      return;
    }
    // TODO: Implement UI to collect initial inputs (Phase 3, Item 5)
    const initialInputs = {}; // Placeholder for initial inputs
    console.log(`Starting execution for workflow ${workflowId}`);
    startExecution({ workflowId: workflowId, inputs: initialInputs }, {
      onSuccess: (execution) => {
        toast({ title: "Execution Started", description: `Workflow execution ${execution.id} initiated.` });
        // TODO: Update state to reflect the new currentExecutionId
      },
      onError: (startError) => {
        toast({ title: "Execution Failed", description: `Could not start workflow: ${(startError as Error).message}`, variant: "destructive" });
      }
    });
  };

  // Handle saving the updated stage prompt
  const handleSaveStage = () => {
    if (!stage) {
      toast({ title: "Error", description: "Cannot save, stage data missing.", variant: "destructive" });
      return;
    }
    if (prompt === stage.promptTemplate) {
        toast({ title: "No Changes", description: "The prompt has not been modified." });
        return;
    }

    console.log(`Saving stage ${stage.id} in workflow ${workflowId}`);
    updateStage(
      { workflowId: workflowId, stageId: stage.id, data: { promptTemplate: prompt } },
      {
        onSuccess: () => {
          toast({ title: "Stage Saved", description: `Stage '${stage.name}' prompt updated successfully.` });
          // Optionally refetch workflow details if needed
        },
        onError: (saveError) => {
          toast({ title: "Save Failed", description: `Could not update stage prompt: ${(saveError as Error).message}`, variant: "destructive" });
        },
      }
    );
  };

  // Handle manual validation submission
  const handleManualValidation = (validationResult: boolean) => { // Use boolean directly
    if (!currentExecutionId || !stage) {
      toast({ title: "Error", description: "Execution context or stage details missing for validation.", variant: "destructive" });
      return;
    }
    console.log(`Recording manual validation: ${validationResult ? 'Pass' : 'Fail'} for execution ${currentExecutionId}, stage ${stage.id}`);
    // Assuming the hook now takes a boolean `validationResult`
    recordValidation(
      { executionId: currentExecutionId, stageId: stage.id, validationResult: validationResult, comments: validationResult ? 'Manually passed' : 'Manually failed' }, // Pass boolean
      {
        onSuccess: () => {
          toast({ title: "Validation Recorded", description: `Stage marked as ${validationResult ? 'Passed' : 'Failed'}.` });
          // Invalidation happens within the hook
        },
        onError: (validationError) => {
          toast({ title: "Validation Failed", description: `Could not record validation: ${(validationError as Error).message}`, variant: "destructive" });
        },
      }
    );
  };

  // Handle retrying a stage
  const handleRetryStage = () => {
    if (!currentExecutionId || !stage) {
      toast({ title: "Error", description: "Execution context or stage details missing for retry.", variant: "destructive" });
      return;
    }
    console.log(`Retrying stage ${stage.id} for execution ${currentExecutionId}`);
    retryStage(
      { executionId: currentExecutionId, stageId: stage.id },
      {
        onSuccess: () => {
          toast({ title: "Retry Initiated", description: `Stage ${stage.name} is being retried.` });
          // Invalidation happens within the hook
        },
        onError: (retryError) => {
          toast({ title: "Retry Failed", description: `Could not retry stage: ${(retryError as Error).message}`, variant: "destructive" });
        },
      }
    );
  };

  // Determine stage status based on the latest log
  const stageStatus = latestLogForStage?.status ?? 'PENDING'; // Default to PENDING if no log
  const canRetry = (stageStatus === 'FAILED' || stageStatus === 'ERROR') && 
                   (latestLogForStage?.attemptNumber ?? 0) < (stage.retryLimit ?? 0);
  const needsManualValidation = stage.validationType === 'MANUAL' && stageStatus === 'AWAITING_VALIDATION';

  // Handle Loading State - Now handled by the parent component (`ActiveWorkflowView`)
  // if (isLoading) { ... }
  // Handle Error State - Now handled by the parent component
  // if (error) { ... }
  // Handle No Data State - Now handled by the parent component
  // if (!stageDetail) { ... }

  return (
    <Card className="w-full mb-6"> {/* Added margin-bottom */} 
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{stage.name || 'Untitled Stage'}</CardTitle>
            <CardDescription>{stage.description || 'No description provided.'}</CardDescription>
          </div>
          <ValidationStatusIndicator type={stage.validationType} criteria={stage.validationCriteria} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Editor */} 
        <div>
          <Label htmlFor={`prompt-${stage.id}`}>Prompt Template</Label>
          <Textarea
            id={`prompt-${stage.id}`}
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter the prompt for this stage..."
            rows={8} // Increased rows for better visibility
            className="mt-1"
            disabled={isUpdatingStage}
          />
        </div>

        {/* Display Execution Output/Error if available */} 
        {latestLogForStage && (
          <div className="space-y-2 p-3 border rounded-md bg-muted/50">
            <h4 className="text-sm font-medium flex items-center">
              <Info className="h-4 w-4 mr-2 text-muted-foreground" />
              Latest Execution Log (Attempt {latestLogForStage.attemptNumber})
              <Badge variant={getStatusVariant(latestLogForStage.status)} className="ml-auto capitalize">{latestLogForStage.status}</Badge>
            </h4>
            {latestLogForStage.processedOutput && (
              <div>
                <Label className="text-xs text-muted-foreground">Processed Output</Label>
                <pre className="text-xs p-2 bg-background rounded-sm overflow-auto max-h-40">
                  {JSON.stringify(latestLogForStage.processedOutput, null, 2)}
                </pre>
              </div>
            )}
            {latestLogForStage.rawOutput && (
              <div>
                <Label className="text-xs text-muted-foreground">Raw Output</Label>
                <pre className="text-xs p-2 bg-background rounded-sm overflow-auto max-h-40">
                  {latestLogForStage.rawOutput}
                </pre>
              </div>
            )}
            {latestLogForStage.errorDetails && (
              <div>
                <Label className="text-xs text-destructive">Error Details</Label>
                <pre className="text-xs p-2 bg-destructive/10 text-destructive rounded-sm overflow-auto max-h-40">
                  {latestLogForStage.errorDetails}
                </pre>
              </div>
            )}
            {latestLogForStage.validationResult !== null && (
               <p className="text-xs">Validation Result: <span className={`font-semibold ${latestLogForStage.validationResult ? 'text-green-600' : 'text-red-600'}`}>{latestLogForStage.validationResult ? 'Passed' : 'Failed'}</span></p>
            )}
             <p className="text-xs text-muted-foreground">Started: {new Date(latestLogForStage.startedAt).toLocaleString()} | Ended: {latestLogForStage.endedAt ? new Date(latestLogForStage.endedAt).toLocaleString() : 'N/A'}</p>
          </div>
        )}

        {/* Action Buttons */} 
        <div className="flex flex-wrap justify-between items-center pt-4 border-t gap-2"> {/* Added gap and flex-wrap */} 
          {/* Save Stage Button */} 
          <Button 
            onClick={handleSaveStage} 
            disabled={isUpdatingStage || prompt === stage.promptTemplate}
            variant="outline"
          >
            {isUpdatingStage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Stage
          </Button>

          {/* Snapshot Button */} 
          <Button onClick={onTriggerSnapshotDrawer} variant="outline">
            Manage Snapshots
          </Button>

          {/* Conditional Manual Validation Buttons */} 
          {needsManualValidation && (
            <div className="flex gap-2">
              <Button onClick={() => handleManualValidation(true)} disabled={isValidating} variant="success"> {/* Use custom variant or style */} 
                {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />}
                Pass
              </Button>
              <Button onClick={() => handleManualValidation(false)} disabled={isValidating} variant="destructive">
                {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />}
                Fail
              </Button>
            </div>
          )}

          {/* Conditional Retry Button */} 
          {canRetry && (
            <Button onClick={handleRetryStage} disabled={isRetrying} variant="secondary">
              {isRetrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />}
              Retry Stage (Attempt { (latestLogForStage?.attemptNumber ?? 0) + 1 }/{ stage.retryLimit })
            </Button>
          )}

          {/* Start Execution Button (Consider moving this to the workflow level) */} 
          {!currentExecutionId && (
            <Button onClick={handleStartExecution} disabled={isStartingExecution}>
              {isStartingExecution ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
              Start Workflow Execution
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function (can be moved to utils)
const getStatusVariant = (status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" | "warning" => {
  switch (status?.toUpperCase()) {
    case 'COMPLETED':
    case 'PASSED':
      return 'default'; // Success (often green)
    case 'FAILED':
    case 'ERROR':
      return 'destructive'; // Error (red)
    case 'RUNNING':
      return 'warning'; // In progress (often yellow/blue)
    case 'PENDING':
    case 'AWAITING_VALIDATION':
      return 'secondary'; // Neutral/Waiting (gray)
    case 'SKIPPED':
      return 'outline'; // Skipped (outline)
    default:
      return 'secondary';
  }
}