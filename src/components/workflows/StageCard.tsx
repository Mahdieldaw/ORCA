// src/components/workflows/StageCard.tsx
import React from 'react';
// Update MockStage import to use actual API type if available, e.g., StageSummary
import { MockStage } from '@/data/mockWorkflows'; // Adjust import path if needed
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"; // Assuming shadcn/ui
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"; // Assuming shadcn/ui
import { Button } from '@/components/ui/button'; // Import Button
import { CheckCircle, AlertCircle, Loader, XCircle, ArrowRightCircle, Trash2 } from 'lucide-react'; // Import Trash2

interface StageCardProps {
  stage: MockStage; // TODO: Replace MockStage with actual StageSummary/StageDetail type from API
  onClick: (stageId: string) => void; // Function to call when card is clicked
  onDelete?: (stageId: string, event: React.MouseEvent) => void; // Optional delete handler
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

export const StageCard: React.FC<StageCardProps> = ({ stage, onClick, onDelete }) => {
  const handleDeleteClick = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent card click
    onDelete?.(stage.id, event);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Added relative positioning and group class */}
          <Card
            className="relative group cursor-pointer transition-all duration-200 hover:shadow-md hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
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
            {/* Delete Button - Conditionally rendered */}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity z-10" // Adjusted position and size
                onClick={handleDeleteClick}
                aria-label={`Delete stage ${stage.name}`}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" /> {/* Adjusted icon size */} 
              </Button>
            )}
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" align="start" className="max-w-xs text-sm">
          <p>{stage.previewText}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};