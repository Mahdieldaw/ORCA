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