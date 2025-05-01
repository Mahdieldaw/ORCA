// src/components/workflows/StageController.tsx
'use client';

import React, { useState } from 'react';
import { useGetWorkflowDetail, useUpdateStage } from '@/hooks/api/workflows'; // Import hook to fetch details and update stage
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ban, CircleCheck, CircleDashed, RefreshCcw, Save, Play, ThumbsUp, ThumbsDown, Loader2, RotateCcw } from 'lucide-react'; // Added Play, ThumbsUp, ThumbsDown, Loader2, RotateCcw icons
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { useStartWorkflowExecution, useRecordManualValidation, useRetryStage } from '@/hooks/api/useExecutions'; // Import execution hooks
import { useToast } from '@/components/ui/use-toast'; // Import useToast

// Define a type for the detailed workflow data expected from the API
// Adjust this based on the actual API response structure for workflow details
interface ApiWorkflowDetail {
  id: string;
  name: string;
  description?: string;
  promptTemplate: string;
  type: string; // e.g., 'manual', 'automated'
  order: number;
  validationType: 'none' | 'manual' | 'regex';
  validationCriteria: string | null;
  retryLimit?: number; // Added retryLimit
  // Add other relevant fields from your detailed API response
}

interface StageControllerProps {
  activeWorkflowId: string; // Changed from optional initialStageData
  currentExecutionId?: string | null; // Example: Pass current execution ID
  // Add props related to execution status/logs if needed for conditional rendering
  currentStageStatus?: string | null; // e.g., 'failed', 'error'
  currentAttemptNumber?: number | null;
  onTriggerSnapshotDrawer: () => void; // Renamed prop
}

// Helper to render validation status visually
// Updated to use ApiWorkflowDetail type
const ValidationStatusIndicator: React.FC<{ type: ApiWorkflowDetail['validationType'], criteria: string | null }> = ({ type, criteria }) => {
  let statusText = 'None';
  let Icon = Ban;
  let variant: "outline" | "secondary" | "destructive" | "default" = "outline";

  if (type === 'manual') {
    statusText = 'Manual Validation';
    Icon = CircleCheck; // Placeholder, real status comes later
    variant = "secondary";
  } else if (type === 'regex' && criteria) {
    statusText = `Regex: ${criteria}`;
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
  activeWorkflowId,
  currentExecutionId,
  currentStageStatus,
  currentAttemptNumber,
  onTriggerSnapshotDrawer
}) => {
  // Fetch workflow details using the hook
  // NOTE: This hook fetches WORKFLOW details. If this component is meant to control a specific STAGE
  // within a workflow, the data fetching strategy might need adjustment as per Phase 3, Item 4.
  // Assuming for now `activeWorkflowId` IS the Stage ID for fetching details.
  const { data: stageDetail, isLoading, error } = useGetWorkflowDetail(activeWorkflowId); // Renamed data for clarity

  // Instantiate the mutation hooks
  const { mutate: startExecution, isPending: isStartingExecution } = useStartWorkflowExecution();
  const { mutate: updateStage, isPending: isUpdatingStage } = useUpdateStage(); // Instantiate update hook
  const { mutate: recordValidation, isPending: isValidating } = useRecordManualValidation(); // Validation hook
  const { mutate: retryStage, isPending: isRetrying } = useRetryStage(); // Retry hook
  const { toast } = useToast(); // Initialize toast

  // State to manage the editable prompt, initialized once data loads
  const [prompt, setPrompt] = useState('');

  // Update prompt state when stageDetail changes
  React.useEffect(() => {
    if (stageDetail) {
      setPrompt(stageDetail.promptTemplate);
    }
  }, [stageDetail]);

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(event.target.value);
  };

  const handleStartExecution = () => {
    // This likely needs to start the PARENT workflow, not the stage itself.
    // Requires knowing the parent workflow ID.
    // For now, assuming `activeWorkflowId` might be misused here.
    toast({ title: "Not Implemented", description: "Starting execution from stage controller needs review.", variant: "warning" });
    // if (!stageDetail) { ... }
    // startExecution({ workflowId: PARENT_WORKFLOW_ID, inputs });
  };

  // Handle saving the updated stage prompt
  const handleSaveStage = () => {
    if (!stageDetail) {
      toast({ title: "Error", description: "Cannot save, stage details not loaded.", variant: "destructive" });
      return;
    }
    if (prompt === stageDetail.promptTemplate) {
        toast({ title: "No Changes", description: "The prompt has not been modified." });
        return;
    }

    // Assuming `activeWorkflowId` is the STAGE ID. Need parent workflow ID.
    // This requires refactoring or passing the parent workflow ID as a prop.
    const parentWorkflowId = "PARENT_WORKFLOW_ID_PLACEHOLDER"; // FIXME: Get parent workflow ID
    console.log(`Saving stage ${stageDetail.id} in workflow ${parentWorkflowId}`);
    updateStage(
      { workflowId: parentWorkflowId, stageId: stageDetail.id, data: { promptTemplate: prompt } },
      {
        onSuccess: () => {
          toast({ title: "Stage Saved", description: `Stage '${stageDetail.name}' prompt updated successfully.` });
        },
        onError: (saveError) => {
          toast({ title: "Save Failed", description: `Could not update stage prompt: ${(saveError as Error).message}`, variant: "destructive" });
        },
      }
    );
  };

  // Handle manual validation submission
  const handleManualValidation = (result: 'pass' | 'fail') => {
    if (!currentExecutionId || !stageDetail) {
      toast({ title: "Error", description: "Execution context or stage details missing for validation.", variant: "destructive" });
      return;
    }
    console.log(`Recording manual validation: ${result} for execution ${currentExecutionId}, stage ${stageDetail.id}`);
    recordValidation(
      { executionId: currentExecutionId, stageId: stageDetail.id, result },
      {
        onSuccess: () => {
          toast({ title: "Validation Recorded", description: `Stage marked as ${result}.` });
          // TODO: Add logic to potentially advance workflow or update UI based on result
        },
        onError: (validationError) => {
          toast({ title: "Validation Failed", description: `Could not record validation: ${(validationError as Error).message}`, variant: "destructive" });
        },
      }
    );
  };

  // Handle retrying a stage
  const handleRetryStage = () => {
    if (!currentExecutionId || !stageDetail) {
      toast({ title: "Error", description: "Execution context or stage details missing for retry.", variant: "destructive" });
      return;
    }
    console.log(`Retrying stage ${stageDetail.id} for execution ${currentExecutionId}`);
    retryStage(
      { executionId: currentExecutionId, stageId: stageDetail.id },
      {
        onSuccess: () => {
          toast({ title: "Retry Initiated", description: `Stage ${stageDetail.name} is being retried.` });
          // TODO: Update UI to reflect retry attempt (e.g., clear previous error state)
        },
        onError: (retryError) => {
          toast({ title: "Retry Failed", description: `Could not retry stage: ${(retryError as Error).message}`, variant: "destructive" });
        },
      }
    );
  };

  // Handle Loading State
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <Skeleton className="h-6 w-3/4 mb-2" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-4 w-1/4 mb-1.5" />
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4 mb-1" />
          <Skeleton className="h-6 w-1/3" />
          <div className="flex justify-between items-center pt-4 border-t">
            <Skeleton className="h-9 w-1/4" />
            <Skeleton className="h-9 w-1/4" />
            <Skeleton className="h-9 w-1/4" />
            <Skeleton className="h-9 w-1/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{(error as Error).message || 'Could not load stage details.'}</p>
        </CardContent>
      </Card>
    );
  }

  if (!stageDetail) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Stage Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Stage details could not be loaded.</p>
        </CardContent>
      </Card>
    );
  }

  // Determine if manual validation buttons should be shown
  // TODO: Enhance this condition with actual execution status (e.g., is stage awaiting validation?)
  const showManualValidationButtons = stageDetail.validationType === 'manual' && !!currentExecutionId;

  // Determine if retry button should be shown/enabled
  // TODO: Replace placeholder logic with actual conditions based on fetched execution logs/status
  const canRetry = (
    !!currentExecutionId &&
    (currentStageStatus === 'failed' || currentStageStatus === 'error') &&
    (currentAttemptNumber ?? 0) < (stageDetail.retryLimit ?? 0)
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Stage {stageDetail.order}: {stageDetail.name}</CardTitle>
          {/* Placeholder status lights */}
          <div className="flex space-x-2">
             <span className="h-3 w-3 bg-yellow-400 rounded-full animate-pulse" title="Current (Placeholder)"></span>
             <span className="h-3 w-3 bg-gray-300 rounded-full" title="Validation Pending (Placeholder)"></span>
          </div>
        </div>
        <CardDescription>
          Configure and review this stage. Type: {stageDetail.type}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Editor Section */}
        <div className="space-y-1.5">
          <Label htmlFor={`prompt-${stageDetail.id}`} className="text-sm font-medium">
            Prompt Template
          </Label>
          <Textarea
            id={`prompt-${stageDetail.id}`}
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter your prompt template here. Use {{variable}} for placeholders."
            className="min-h-[150px] font-mono text-xs resize-y"
            aria-label="Prompt template editor"
            aria-describedby={`prompt-hint-${stageDetail.id}`}
          />
          <p id={`prompt-hint-${stageDetail.id}`} className="text-xs text-muted-foreground">
            Use {'{{variable_name}}'} syntax for dynamic inputs.
          </p>
        </div>

        {/* Validation Status Section */}
        <div>
          <Label className="text-sm font-medium">Validation</Label>
          <div className="mt-1 flex items-center space-x-2 flex-wrap gap-2"> {/* Added flex-wrap and gap */}
            <ValidationStatusIndicator
                type={stageDetail.validationType}
                criteria={stageDetail.validationCriteria}
            />
            {/* Manual Validation Buttons */}
            {showManualValidationButtons && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManualValidation('pass')}
                  disabled={isValidating || isRetrying}
                  className="border-green-500 text-green-600 hover:bg-green-50 hover:text-green-700"
                >
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ThumbsUp className="mr-1 h-4 w-4" />} Pass
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleManualValidation('fail')}
                  disabled={isValidating || isRetrying}
                  className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  {isValidating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <ThumbsDown className="mr-1 h-4 w-4" />} Fail
                </Button>
              </div>
            )}
            {/* Retry Button */} 
            {canRetry && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRetryStage}
                  disabled={isRetrying || isValidating}
                  className="border-blue-500 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                >
                  {isRetrying ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <RotateCcw className="mr-1 h-4 w-4" />} Retry Stage
                </Button>
            )}
          </div>
        </div>

        {/* Action Buttons Section */}
        <div className="flex justify-between items-center pt-4 border-t flex-wrap gap-2"> {/* Added flex-wrap and gap */}
          <Button
            variant="outline"
            onClick={onTriggerSnapshotDrawer}
            aria-label="Manage Snapshots"
          >
            <RefreshCcw className="mr-2 h-4 w-4" /> Snapshots
          </Button>
          <div className="flex space-x-2"> {/* Group save and start */}
            <Button
              variant="secondary"
              onClick={handleSaveStage}
              disabled={isUpdatingStage || prompt === stageDetail.promptTemplate}
              aria-label="Save stage changes"
            >
              <Save className="mr-2 h-4 w-4" /> {isUpdatingStage ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={handleStartExecution}
              disabled={isStartingExecution}
              aria-label="Start workflow execution"
              title="Start execution of the parent workflow (Implementation Pending)" // Added title for clarity
            >
              <Play className="mr-2 h-4 w-4" /> {isStartingExecution ? 'Starting...' : 'Start Workflow'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};