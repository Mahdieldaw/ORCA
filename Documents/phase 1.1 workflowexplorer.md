implement Phase 1 of the Hybrid Thinking UI-First strategy, focusing only on the WorkflowExplorer component and its related elements.

Objective: Create the visual shell for the /explorer page, displaying a list of workflow stages using static mock data. The page should include basic hover previews and placeholder click actions for stages.

Assumed Project Setup:

A Next.js project is already set up.

Tailwind CSS is configured.

shadcn/ui components (Card, Tooltip) are installed and configured (or you have equivalent components available).

lucide-react is installed for icons.

A GlobalLayout component exists at @/components/layout/GlobalLayout which provides the main page structure (navigation, etc.).

Instructions:

Step 1: Define Mock Data Structure and Content

Create a new file: src/data/mockWorkflows.ts

Paste the following code into src/data/mockWorkflows.ts:

// src/data/mockWorkflows.ts

export interface MockStage {
  id: string;
  order: number;
  name: string;
  type: 'LLM' | 'Validation' | 'Input' | 'Output'; // Example types
  status: 'completed' | 'current' | 'pending' | 'error'; // For visual indicators
  previewText: string; // Short description for hover
}

export const mockWorkflowStages: MockStage[] = [
  { id: 'stage-1', order: 1, name: 'Ingest Document', type: 'Input', status: 'completed', previewText: 'Loads the initial text document.' },
  { id: 'stage-2', order: 2, name: 'Summarize Content', type: 'LLM', status: 'completed', previewText: 'Generates a concise summary using GPT-4.' },
  { id: 'stage-3', order: 3, name: 'Validate JSON Output', type: 'Validation', status: 'current', previewText: 'Checks if the LLM output is valid JSON.' },
  { id: 'stage-4', order: 4, name: 'Extract Key Entities', type: 'LLM', status: 'pending', previewText: 'Identifies key names and organizations.' },
  { id: 'stage-5', order: 5, name: 'Format Report', type: 'Output', status: 'pending', previewText: 'Generates the final report document.' },
  { id: 'stage-6', order: 6, name: 'Sentiment Analysis', type: 'LLM', status: 'error', previewText: 'Analyzes sentiment (failed). ' },
];


Step 2: Create the Reusable StageCard Component

Create a new file: src/components/workflows/StageCard.tsx

Paste the following code into src/components/workflows/StageCard.tsx:

// src/components/workflows/StageCard.tsx
import React from 'react';
import { MockStage } from '@/data/mockWorkflows'; // Adjust import path if needed
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Assuming shadcn/ui
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Assuming shadcn/ui
import { CheckCircle, AlertCircle, Loader, XCircle, ArrowRightCircle } from 'lucide-react';

interface StageCardProps {
  stage: MockStage;
  onClick: (stageId: string) => void; // Function to call when card is clicked
}

// Helper function to get the appropriate status icon and styling
const getStatusIndicator = (status: MockStage['status']) => {
  switch (status) {
    case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" aria-label="Completed" />;
    case 'current': return <ArrowRightCircle className="h-4 w-4 text-blue-500 animate-pulse" aria-label="Current" />;
    case 'pending': return <Loader className="h-4 w-4 text-gray-400 animate-spin" aria-label="Pending" />;
    case 'error': return <XCircle className="h-4 w-4 text-red-500" aria-label="Error" />;
    default: return null;
  }
};

export const StageCard: React.FC<StageCardProps> = ({ stage, onClick }) => {
  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Card
            className="cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={() => onClick(stage.id)}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onClick(stage.id)} // Basic accessibility
            tabIndex={0} // Make it focusable
            role="button"
            aria-label={`Stage ${stage.order}: ${stage.name}`}
          >
            <CardHeader className="p-4"> {/* Adjusted padding */}
              <div className="flex justify-between items-center mb-1">
                <CardTitle className="text-base font-medium">{stage.order}. {stage.name}</CardTitle> {/* Adjusted size */}
                {getStatusIndicator(stage.status)}
              </div>
              <CardDescription className="text-xs text-muted-foreground"> {/* Adjusted size */}
                Type: {stage.type}
              </CardDescription>
            </CardHeader>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" className="max-w-xs text-sm">
          <p>{stage.previewText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Step 3: Implement the Explorer Page and WorkflowExplorer Component

Create the page file (or modify if it exists):

pages dir: src/pages/explorer.tsx

app dir: src/app/explorer/page.tsx

Paste and adapt the following code into the page file:

// src/pages/explorer.tsx OR src/app/explorer/page.tsx
'use client'; // Add this if using Next.js App Router

import React, { useState } from 'react';
import GlobalLayout from '@/components/layout/GlobalLayout'; // Adjust import path
import { mockWorkflowStages, MockStage } from '@/data/mockWorkflows'; // Adjust import path
import { StageCard } from '@/components/workflows/StageCard'; // Adjust import path

// Internal WorkflowExplorer component for this page
const WorkflowExplorer = () => {
  // State for placeholder feedback on which stage was clicked
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  // Placeholder click handler
  const handleStageClick = (stageId: string) => {
    console.log(`[Phase 1 Placeholder] Stage clicked: ${stageId}. Triggering placeholder feedback.`);
    setSelectedStageId(stageId);
    // NOTE: In Phase 3, this action will involve navigating or updating state
    // to display the actual StageController component.
  };

  return (
    <div className="space-y-3"> {/* Use space-y for vertical spacing */}
      <p className="text-sm text-muted-foreground mb-2">
        Click a stage below to see placeholder feedback. Hover for preview.
      </p>

      {/* Render the list of stages */}
      {mockWorkflowStages.map((stage) => (
        <StageCard
          key={stage.id}
          stage={stage}
          onClick={handleStageClick}
        />
      ))}

      {/* Placeholder feedback area */}
      {selectedStageId && (
         <div className="mt-4 p-3 bg-secondary rounded-md text-xs text-secondary-foreground animate-pulse">
           Placeholder Feedback: Stage '{mockWorkflowStages.find(s => s.id === selectedStageId)?.name}' selected. StageController would load here.
         </div>
      )}
    </div>
  );
};

// The actual page component using the GlobalLayout
export default function WorkflowExplorerPage() {
  return (
    <GlobalLayout>
       {/* Main content area */}
       <div className="container mx-auto p-4 md:p-6 lg:p-8">
         {/* Page Title */}
         <h1 className="text-2xl font-semibold mb-6">Workflow Explorer</h1> {/* Increased bottom margin */}

         {/* Workflow Explorer Component */}
         <WorkflowExplorer />
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

Step 4: Verification

Run the Next.js development server (npm run dev or yarn dev).

Navigate to the /explorer route in your browser.

Verify:

The page loads without console errors.

The "Workflow Explorer" title is displayed.

The list of 6 mock stages renders vertically using the StageCard component.

Each stage card shows the order number, name, type, and a status icon.

Hovering over a stage card displays the previewText in a tooltip.

Clicking on a stage card:

Logs a message to the browser console indicating the clicked stage ID.

Displays the placeholder feedback div at the bottom showing which stage was selected.

This completes the implementation for the WorkflowExplorer part of Phase 1. The UI shell is ready with mock data and placeholder interactions.