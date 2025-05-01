// src/components/workflows/StageController.tsx
'use client';

import React, { useState } from 'react';
// Remove mock data import
// import { MockStageDetail, mockSelectedStageDetail } from '@/data/mockWorkflows';
import { useGetWorkflowDetail } from '@/hooks/api/workflows'; // Import hook to fetch details
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ban, CircleCheck, CircleDashed, RefreshCcw, Save, Play } from 'lucide-react'; // Added Play icon
import { Skeleton } from '@/components/ui/skeleton'; // Import Skeleton
import { useStartWorkflowExecution } from '@/hooks/api/useExecutions'; // Import the execution hook
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
  // Add other relevant fields from your detailed API response
}

interface StageControllerProps {
  activeWorkflowId: string; // Changed from optional initialStageData
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

export const StageController: React.FC<StageControllerProps> = ({ activeWorkflowId, onTriggerSnapshotDrawer }) => {
  // Fetch workflow details using the hook
  const { data: workflowDetail, isLoading, error } = useGetWorkflowDetail(activeWorkflowId);
  // Instantiate the mutation hook
  const { mutate: startExecution, isPending: isStartingExecution } = useStartWorkflowExecution();
  const { toast } = useToast(); // Initialize toast

  // State to manage the editable prompt, initialized once data loads
  const [prompt, setPrompt] = useState('');

  // Update prompt state when workflowDetail changes
  React.useEffect(() => {
    if (workflowDetail) {
      setPrompt(workflowDetail.promptTemplate);
    }
  }, [workflowDetail]);

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    // console.log('[Phase 1 Placeholder] Prompt edited.'); // Keep or remove logging as needed
    setPrompt(event.target.value);
  };

  const handleStartExecution = () => {
    if (!workflowDetail) {
      toast({
        title: "Error",
        description: "Workflow details not loaded.",
        variant: "destructive",
      });
      return;
    }
    console.log(`Attempting to start execution for workflow: ${workflowDetail.id}`);
    // TODO: Replace {} with actual input data gathered from the UI or global state
    const inputs = {}; // Placeholder for actual inputs
    startExecution({ workflowId: workflowDetail.id, inputs });
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
            <Skeleton className="h-9 w-1/4" /> {/* Skeleton for new button */}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Handle Error State
  if (error) {
    return (
      <Card className="w-full border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Error Loading Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{(error as Error).message || 'Could not load workflow details.'}</p>
          {/* Optionally add a retry button here */}
        </CardContent>
      </Card>
    );
  }

  // Handle case where data hasn't loaded or is missing (should ideally be covered by loading/error)
  if (!workflowDetail) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>No Workflow Data</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Workflow details could not be loaded.</p>
        </CardContent>
      </Card>
    );
  }

  // Render the controller with fetched data
  return (
    <Card className="w-full"> {/* Assume it takes full width of its container */}
      <CardHeader>
        <div className="flex justify-between items-center">
          {/* Use fetched data */}
          <CardTitle>Stage {workflowDetail.order}: {workflowDetail.name}</CardTitle>
          {/* Placeholder status lights - In reality, this would reflect actual execution state */}
          <div className="flex space-x-2">
             <span className="h-3 w-3 bg-yellow-400 rounded-full animate-pulse" title="Current (Placeholder)"></span>
             <span className="h-3 w-3 bg-gray-300 rounded-full" title="Validation Pending (Placeholder)"></span>
          </div>
        </div>
        <CardDescription>
          {/* Use fetched data */}
          Configure and review this stage. Type: {workflowDetail.type}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Editor Section */}
        <div className="space-y-1.5"> {/* Added for better spacing */}
          <Label htmlFor={`prompt-${workflowDetail.id}`} className="text-sm font-medium">
            Prompt Template
          </Label>
          <Textarea
            id={`prompt-${workflowDetail.id}`}
            value={prompt} // Use state variable
            onChange={handlePromptChange}
            placeholder="Enter your prompt template here. Use {{variable}} for placeholders."
            className="min-h-[150px] font-mono text-xs resize-y" // Added resize-y
            aria-label="Prompt template editor" // Accessibility
            aria-describedby={`prompt-hint-${workflowDetail.id}`} // Accessibility
          />
          <p id={`prompt-hint-${workflowDetail.id}`} className="text-xs text-muted-foreground">
            Use {'{{variable_name}}'} syntax for dynamic inputs.
          </p>
        </div>

        {/* Validation Status Section */}
        <div>
          <Label className="text-sm font-medium">Validation</Label>
          <div className="mt-1">
            {/* Use fetched data */}
            <ValidationStatusIndicator
                type={workflowDetail.validationType}
                criteria={workflowDetail.validationCriteria}
            />
          </div>
          {/* Placeholder for actual validation result display later */}
        </div>

        {/* Controls Section */}
        <div className="flex justify-between items-center pt-4 border-t">
           {/* Start Execution Button */}
           <Button
             variant="default" // Or another appropriate variant
             size="sm"
             onClick={handleStartExecution}
             disabled={isStartingExecution || !workflowDetail} // Disable if starting or no details
           >
             <Play className="h-4 w-4 mr-2" />
             {isStartingExecution ? 'Starting...' : 'Start Execution'}
           </Button>

           {/* Retry Control - Visible but disabled for Phase 1 */}
           <Button variant="outline" size="sm" disabled>
             <RefreshCcw className="h-4 w-4 mr-2" />
             Retry Stage (Disabled)
           </Button>

           {/* Save Snapshot Control - Use renamed prop */}
           <Button variant="secondary" size="sm" onClick={onTriggerSnapshotDrawer}>
             <Save className="h-4 w-4 mr-2" />
             Save Snapshot
           </Button>
        </div>
      </CardContent>
    </Card>
  );
};