let's continue with Phase 1 UI-First implementation. The next key component is the StageController. This component is intended to display the details of a selected stage and allow interaction (like editing the prompt).

Objective: Create the visual shell for the StageController, populating it with mock data for a single stage. Implement placeholder interactions for editing, validation status display, and snapshot saving.

Assumed Setup: Same as before (Next.js, Tailwind, shadcn/ui, lucide-react, GlobalLayout).

Instructions:

Step 1: Define Mock Data for a Single Stage Detail

You can add this to src/data/mockWorkflows.ts or define it locally in the new component for now. This represents the data the StageController would eventually receive for a selected stage.

// src/data/mockWorkflows.ts (Add this interface and object)

export interface MockStageDetail extends MockStage {
  promptTemplate: string;
  validationType: 'manual' | 'regex' | 'none';
  validationCriteria: string | null; // e.g., the regex pattern
  // Add other potential fields later like model_id, retry_limit etc.
}

export const mockSelectedStageDetail: MockStageDetail = {
  id: 'stage-3', // Corresponds to the 'current' stage in previous mock data
  order: 3,
  name: 'Validate JSON Output',
  type: 'Validation',
  status: 'current',
  previewText: 'Checks if the LLM output is valid JSON.',
  promptTemplate: `Previous Stage Output:\n{{llm_output}}\n\nPlease validate if the output above is valid JSON format. Respond with only 'VALID' or 'INVALID'.`,
  validationType: 'regex',
  validationCriteria: '^(VALID|INVALID)$' // Example criteria for its *own* validation (if it were an LLM validator)
};


Step 2: Create the StageController Component

Create a new file: src/components/workflows/StageController.tsx

Paste the following code into src/components/workflows/StageController.tsx:

// src/components/workflows/StageController.tsx
'use client';

import React, { useState } from 'react';
import { MockStageDetail, mockSelectedStageDetail } from '@/data/mockWorkflows'; // Adjust import path
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Ban, CircleCheck, CircleDashed, RefreshCcw, Save } from 'lucide-react';

interface StageControllerProps {
  // In a real app, stage data would likely be passed as props or fetched based on an ID
  initialStageData?: MockStageDetail;
  onTriggerSnapshot?: () => void; // Placeholder function prop for triggering snapshot drawer
}

// Helper to render validation status visually
const ValidationStatusIndicator: React.FC<{ type: MockStageDetail['validationType'], criteria: string | null }> = ({ type, criteria }) => {
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
  initialStageData = mockSelectedStageDetail, // Use mock data as default for Phase 1
  onTriggerSnapshot = () => console.log('[Phase 1 Placeholder] Trigger Snapshot Drawer')
}) => {
  // State to manage the editable prompt (initialized with mock data)
  const [prompt, setPrompt] = useState(initialStageData.promptTemplate);

  const handlePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log('[Phase 1 Placeholder] Prompt edited.');
    setPrompt(event.target.value);
  };

  return (
    <Card className="w-full"> {/* Assume it takes full width of its container */}
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Stage {initialStageData.order}: {initialStageData.name}</CardTitle>
          {/* Placeholder status lights - In reality, this would reflect actual execution state */}
          <div className="flex space-x-2">
             <span className="h-3 w-3 bg-yellow-400 rounded-full animate-pulse" title="Current (Placeholder)"></span>
             <span className="h-3 w-3 bg-gray-300 rounded-full" title="Validation Pending (Placeholder)"></span>
          </div>
        </div>
        <CardDescription>
          Configure and review this stage. Type: {initialStageData.type}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Prompt Editor Section */}
        <div>
          <Label htmlFor={`prompt-${initialStageData.id}`} className="text-sm font-medium">
            Prompt Template
          </Label>
          <Textarea
            id={`prompt-${initialStageData.id}`}
            value={prompt}
            onChange={handlePromptChange}
            placeholder="Enter your prompt template here. Use {{variable}} for placeholders."
            className="mt-1 min-h-[150px] font-mono text-xs" // Use mono font for prompts
          />
          <p className="text-xs text-muted-foreground mt-1">
            Use {'{{variable_name}}'} syntax for dynamic inputs.
          </p>
        </div>

        {/* Validation Status Section */}
        <div>
          <Label className="text-sm font-medium">Validation</Label>
          <div className="mt-1">
            <ValidationStatusIndicator
                type={initialStageData.validationType}
                criteria={initialStageData.validationCriteria}
            />
          </div>
          {/* Placeholder for actual validation result display later */}
        </div>

        {/* Controls Section */}
        <div className="flex justify-between items-center pt-4 border-t">
           {/* Retry Control - Visible but disabled for Phase 1 */}
           <Button variant="outline" size="sm" disabled>
             <RefreshCcw className="h-4 w-4 mr-2" />
             Retry Stage (Disabled)
           </Button>

           {/* Save Snapshot Control */}
           <Button variant="secondary" size="sm" onClick={onTriggerSnapshot}>
             <Save className="h-4 w-4 mr-2" />
             Save Snapshot
           </Button>
        </div>
      </CardContent>
    </Card>
  );
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Step 4: Visually Test the StageController (Temporary)

Since we aren't implementing the actual logic to show the StageController when a StageCard is clicked yet (that's Phase 3), we need a way to see it. Add it temporarily to the explorer page below the WorkflowExplorer.

Modify the page file (src/pages/explorer.tsx or src/app/explorer/page.tsx).

Import StageController.

Render it conditionally or just below the existing explorer for visual inspection during development.

// src/pages/explorer.tsx OR src/app/explorer/page.tsx
// ... (previous imports)
import { StageController } from '@/components/workflows/StageController'; // Adjust import path

// ... (WorkflowExplorer component definition remains the same)

// The actual page component using the GlobalLayout
export default function WorkflowExplorerPage() {
  const [showControllerForDev, setShowControllerForDev] = useState(true); // TEMP toggle for dev

  return (
    <GlobalLayout>
       <div className="container mx-auto p-4 md:p-6 lg:p-8">
         <h1 className="text-2xl font-semibold mb-6">Workflow Explorer</h1>

         {/* Workflow Explorer (Stage List) */}
         <WorkflowExplorer />

         {/* TEMPORARY: Divider and Stage Controller for Phase 1 Visual Dev */}
         <hr className="my-8" />
         <h2 className="text-xl font-semibold mb-4 text-muted-foreground">[Dev Preview] Stage Controller Shell</h2>
         <button onClick={() => setShowControllerForDev(!showControllerForDev)} className="text-xs mb-4 underline">
            {showControllerForDev ? 'Hide' : 'Show'} Dev Controller Preview
         </button>

         {showControllerForDev && (
            <div className="max-w-2xl mx-auto"> {/* Constrain width for better viewing */}
                <StageController />
            </div>
         )}
         {/* END TEMPORARY SECTION */}

       </div>
     </GlobalLayout>
  );
}
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Step 5: Verification

Run the Next.js development server.

Navigate to /explorer.

Verify:

The StageController component renders below the explorer list (inside the "[Dev Preview]" section).

It displays the title "Stage 3: Validate JSON Output" and the correct Type.

The prompt template from mockSelectedStageDetail is shown in the textarea.

Typing in the textarea updates the text and logs a message to the console.

The "Validation" section shows a badge indicating "Regex: ^(VALID|INVALID)$".

Placeholder status "lights" (yellow/gray circles) are visible.

The "Retry Stage" button is visible but disabled.

Clicking the "Save Snapshot" button logs a message to the console.

The component layout is reasonably responsive (test by resizing the browser).

This completes the shell implementation for the StageController component as part of Phase 1. It uses mock data and provides placeholder interactions, meeting the acceptance criteria for this stage.