// src/components/workflows/StageController.tsx
'use client';

import React, { useState, useEffect } from 'react'; // Added useEffect
import { useUpdateStage } from '@/hooks/useWorkflows'; // Corrected import path for useUpdateStage
import { Stage } from '@prisma/client'; // Import Stage type from Prisma
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ban, CircleCheck, CircleDashed, RefreshCcw, Save, Play, ThumbsUp, ThumbsDown, Loader2, RotateCcw, Info, AlertTriangle } from 'lucide-react'; // Added Info, AlertTriangle icons
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
// Corrected import path and name for execution hooks
import { useStartExecution, useRecordManualValidation, useRetryStage, useGetExecutionLogs } from '@/hooks/useExecutions'; 
import { useToast } from '@/hooks/use-toast'; // Corrected useToast import path
import { ExecutionLog, ExecutionSummary } from '@/services/apiClient'; // Import ExecutionLog and ExecutionSummary types

// Map log status to badge variant (copied from GhostOverlay)
const getStatusVariant = (status: string | null | undefined): "default" | "secondary" | "destructive" | "outline" => {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'passed':
      return 'default'; // Greenish (default)
    case 'failed':
    case 'error':
      return 'destructive'; // Red
    case 'running':
    case 'pending':
    case 'awaiting_validation': // Added awaiting validation
      return 'secondary'; // Grayish
    case 'skipped':
      return 'outline'; // Outline
    default:
      return 'secondary';
  }
};

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
  // Instantiate the mutation hooks
  const { mutate: startExecution, isPending: isStartingExecution } = useStartExecution(); // Corrected hook name
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
      toast({ title: "Error", description: "Workflow ID is missing.", variant: "destructive" }); // Uncommented toast
      console.error("Workflow ID is missing.");
      return;
    }
    // TODO: Implement UI to collect initial inputs (Phase 3, Item 5)
    const initialInputs = {}; // Placeholder for initial inputs
    console.log(`Starting execution for workflow ${workflowId}`);
    startExecution({ workflowId: workflowId, inputs: initialInputs }, {
      onSuccess: (execution: ExecutionSummary) => { // Added type for execution
        toast({ title: "Execution Started", description: `Workflow execution ${execution.id} initiated.` }); // Uncommented toast
        console.log(`Workflow execution ${execution.id} initiated.`);
        // TODO: Update state to reflect the new currentExecutionId
      },
      onError: (startError: Error) => { // Added type for startError
        toast({ title: "Execution Failed", description: `Could not start workflow: ${startError.message}`, variant: "destructive" }); // Uncommented toast
        console.error(`Could not start workflow: ${startError.message}`);
      }
    });
  };

  // Handle saving the updated stage prompt
  const handleSaveStage = () => {
    if (!stage) {
      toast({ title: "Error", description: "Cannot save, stage data missing.", variant: "destructive" }); // Uncommented toast
      console.error("Cannot save, stage data missing.");
      return;
    }
    if (prompt === stage.promptTemplate) {
        toast({ title: "No Changes", description: "The prompt has not been modified." }); // Uncommented toast
        console.log("The prompt has not been modified.");
        return;
    }

    console.log(`Saving stage ${stage.id} in workflow ${workflowId}`);
    updateStage(
      { workflowId: workflowId, stageId: stage.id, data: { promptTemplate: prompt } },
      {
        onSuccess: () => {
          toast({ title: "Stage Saved", description: `Stage '${stage.name}' prompt updated successfully.` }); // Uncommented toast
          console.log(`Stage '${stage.name}' prompt updated successfully.`);
          // Optionally refetch workflow details if needed
        },
        onError: (saveError: Error) => { // Added type for saveError
          toast({ title: "Save Failed", description: `Could not update stage prompt: ${saveError.message}`, variant: "destructive" }); // Uncommented toast
          console.error(`Could not update stage prompt: ${saveError.message}`);
        },
      }
    );
  };

  // Handle manual validation submission
  const handleManualValidation = (isPass: boolean) => { // Use boolean locally
    if (!currentExecutionId || !stage) {
      toast({ title: "Error", description: "Execution context or stage details missing for validation.", variant: "destructive" }); // Uncommented toast
      console.error("Execution context or stage details missing for validation.");
      return;
    }
    const validationResult = isPass ? 'pass' : 'fail'; // Convert boolean to 'pass' | 'fail'
    console.log(`Recording manual validation: ${validationResult} for execution ${currentExecutionId}, stage ${stage.id}`);
    // Pass 'pass' or 'fail' string to the hook
    recordValidation(
      { executionId: currentExecutionId, stageId: stage.id, validationResult: validationResult, comments: validationResult === 'pass' ? 'Manually passed' : 'Manually failed' },
      {
        onSuccess: () => {
          toast({ title: "Validation Recorded", description: `Stage marked as ${validationResult}.` }); // Uncommented toast
          console.log(`Stage marked as ${validationResult}.`);
          // Invalidation happens within the hook
        },
        onError: (validationError: Error) => { // Added type for validationError
          toast({ title: "Validation Failed", description: `Could not record validation: ${validationError.message}`, variant: "destructive" }); // Uncommented toast
          console.error(`Could not record validation: ${validationError.message}`);
        },
      }
    );
  };

  // Handle retrying a stage
  const handleRetryStage = () => {
    if (!currentExecutionId || !stage) {
      toast({ title: "Error", description: "Execution context or stage details missing for retry.", variant: "destructive" }); // Uncommented toast
      console.error("Execution context or stage details missing for retry.");
      return;
    }
    console.log(`Retrying stage ${stage.id} for execution ${currentExecutionId}`);
    retryStage(
      { executionId: currentExecutionId, stageId: stage.id },
      {
        onSuccess: () => {
          toast({ title: "Retry Initiated", description: `Stage ${stage.name} is being retried.` }); // Uncommented toast
          console.log(`Stage ${stage.name} is being retried.`);
          // Invalidation happens within the hook
        },
        onError: (retryError: Error) => { // Added type for retryError
          toast({ title: "Retry Failed", description: `Could not retry stage: ${retryError.message}`, variant: "destructive" }); // Uncommented toast
          console.error(`Could not retry stage: ${retryError.message}`);
        },
      }
    );
  };

  // Determine stage status based on the latest log
  const stageStatus = latestLogForStage?.status ?? 'PENDING'; // Default to PENDING if no log
  const canRetry = (stageStatus === 'FAILED' || stageStatus === 'ERROR') &&
                   (latestLogForStage?.retryCount ?? 0) < (stage.retryLimit ?? 0); // Replaced attemptNumber with retryCount
  const needsManualValidation = stage.validationType === 'MANUAL' && stageStatus === 'AWAITING_VALIDATION';

  // Loading state for the stage data itself (now passed as prop, so no internal loading)
  // if (isLoading) {
  //   return <Skeleton className="h-[400px] w-full" />; // Adjust size as needed
  // }

  // Error state for stage data (now handled by parent component)
  // if (error) {
  //   return <div className="text-red-500">Error loading stage: {error.message}</div>;
  // }

  // If stage data is not yet available (passed as prop)
  if (!stage) {
    return <div>Stage data not available.</div>; // Or a more sophisticated loading/error state
  }

  return (
    // TODO: Uncomment Card structure when component is available
    <Card className="w-full h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{stage.name || 'Unnamed Stage'}</span>
          <div className="flex items-center space-x-2">
            {/* Cast validationCriteria to string */} 
            <ValidationStatusIndicator type={stage.validationType} criteria={String(stage.validationCriteria ?? '')} /> 
            {/* Display current stage status */}
            <Badge variant={getStatusVariant(stageStatus)}>{stageStatus}</Badge>
          </div>
        </CardTitle>
        {/* Removed stage.description access, kept fallback */}
        <CardDescription>{'No description provided.'}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col space-y-4">
        <div className="space-y-2 flex-grow flex flex-col">
          <Label htmlFor={`prompt-${stage.id}`}>Prompt Template</Label>
          <Textarea
            id={`prompt-${stage.id}`}
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter the prompt template for this stage..."
            className="flex-grow min-h-[150px] resize-none" // Ensure textarea grows
            disabled={isUpdatingStage || isStartingExecution || isValidating || isRetrying}
          />
        </div>

        {/* Display latest execution result for this stage */}
        {latestLogForStage && (
          <Card className="mt-4 bg-muted/30 border-dashed">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm flex justify-between items-center">
                <span>Latest Result</span>
                <Badge variant={getStatusVariant(latestLogForStage.status)} className="capitalize text-xs">
                  {latestLogForStage.status?.replace('_', ' ') ?? 'Unknown'}
                </Badge>
              </CardTitle>
              {currentExecutionId && <CardDescription className="text-xs">Execution ID: {currentExecutionId.substring(0, 8)}...</CardDescription>}
            </CardHeader>
            <CardContent className="px-4 pb-3">
              {latestLogForStage.status === 'failed' && latestLogForStage.errorDetails && (
                <div className="text-destructive text-xs p-2 bg-destructive/10 rounded border border-destructive/20">
                  <p className="font-medium mb-1 flex items-center"><AlertTriangle className="h-4 w-4 mr-1.5"/>Error:</p>
                  <pre className="whitespace-pre-wrap font-mono text-[11px]">{latestLogForStage.errorDetails}</pre>
                </div>
              )}
              {(latestLogForStage.status === 'completed' || latestLogForStage.status === 'passed') && latestLogForStage.processedOutput && ( // Replaced outputData with processedOutput
                <div>
                  <Label className="text-xs text-muted-foreground">Output:</Label>
                  {/* Replaced outputData with processedOutput */} 
                  <pre className="text-xs whitespace-pre-wrap bg-background p-2 rounded border mt-1 font-mono text-[11px] max-h-40 overflow-auto">{JSON.stringify(latestLogForStage.processedOutput, null, 2)}</pre>
                </div>
              )}
               {latestLogForStage.status === 'running' && (
                <p className="text-sm text-blue-600 flex items-center"><Loader2 className="h-4 w-4 mr-2 animate-spin" />Running...</p>
              )}
               {latestLogForStage.status === 'awaiting_validation' && (
                <p className="text-sm text-yellow-600 flex items-center"><Info className="h-4 w-4 mr-2" />Awaiting Manual Validation</p>
              )}
               {/* Add case for pending or other statuses if needed */} 
               {/* Replaced outputData with processedOutput */} 
               {!latestLogForStage.errorDetails && !latestLogForStage.processedOutput && !['running', 'awaiting_validation', 'failed', 'completed', 'passed'].includes(latestLogForStage.status ?? '') && (
                  <p className="text-xs text-muted-foreground italic">No output or error recorded for this status.</p>
               )}
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 justify-end pt-4 border-t">
          {/* Save Prompt Button */}
          <Button
            onClick={handleSaveStage}
            disabled={isUpdatingStage || prompt === stage.promptTemplate}
            size="sm"
          >
            {isUpdatingStage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Prompt
          </Button>

          {/* Execution Controls - Conditionally Rendered */}
          <CardContent className="pt-4">
            <div className="flex flex-col space-y-4">
              {/* Start Execution Button (Only if no current execution) */}
              {!currentExecutionId && (
                <Button
                  onClick={handleStartExecution}
                  disabled={isStartingExecution || !workflowId}
                  className="w-full"
                >
                  {isStartingExecution ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />} Start Workflow Execution
                </Button>
              )}

              {/* Manual Validation Buttons (If applicable and stage is awaiting validation) */}
              {stage.validationType === 'MANUAL' && currentExecutionId && stageStatus === 'AWAITING_VALIDATION' && (
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualValidation(true)}
                    disabled={isValidating}
                    className="flex-1 border-green-500 text-green-600 hover:bg-green-50"
                  >
                    {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsUp className="mr-2 h-4 w-4" />} Pass
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleManualValidation(false)}
                    disabled={isValidating}
                    className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                  >
                    {isValidating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ThumbsDown className="mr-2 h-4 w-4" />} Fail
                  </Button>
                </div>
              )}

              {/* Retry Button (If applicable, stage failed/errored, and retries allowed) */}
              {/* Replaced stage.stageType === 'AUTOMATED' with stage.validationType !== 'MANUAL' */}
              {stage.validationType !== 'MANUAL' && currentExecutionId && (stageStatus === 'FAILED' || stageStatus === 'ERROR') && canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryStage}
                  disabled={isRetrying}
                  className="w-full"
                >
                  {isRetrying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RotateCcw className="mr-2 h-4 w-4" />} Retry Stage
                </Button>
              )}

              {/* Display Current Status */}
              {currentExecutionId && stageStatus && (
                <div className="flex items-center space-x-2 p-2 bg-muted rounded-md">
                  <Badge variant={getStatusVariant(stageStatus)} className="capitalize">
                    {stageStatus.replace('_', ' ')}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {/* Replaced executedAt with completedAt/startedAt */}
                    {latestLogForStage?.endedAt || latestLogForStage?.startedAt ? `Last activity: ${new Date(latestLogForStage.endedAt ?? latestLogForStage.startedAt!).toLocaleString()}` : 'No activity yet.'}
                  </span>
                </div>
              )}

              {/* Display Error Message if Failed/Errored */}
              {/* Replaced errorMessage with errorDetails */}
              {currentExecutionId && (stageStatus === 'FAILED' || stageStatus === 'ERROR') && latestLogForStage?.errorDetails && (
                <div className="flex items-start space-x-2 p-2 bg-destructive/10 border border-destructive/20 text-destructive rounded-md">
                  <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <p className="text-xs">Error: {latestLogForStage.errorDetails}</p>
                </div>
              )}
            </div>
          </CardContent>
          {/* Removed duplicate CardContent closing tag and added missing div closing tag */}
        </div>

        {/* Removed stray closing brace */}
      </CardContent>
    </Card>
  );
};

// Removed duplicate helper function
// Removed extra closing braces at the end of the file