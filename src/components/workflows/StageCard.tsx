// src/components/workflows/StageCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import { WorkflowSummary } from '@/services/apiClient'; // Import WorkflowSummary
import { useDeleteWorkflow } from '@/hooks/useWorkflows'; // Import useDeleteWorkflow

interface StageCardProps {
  stage: WorkflowSummary; // Use WorkflowSummary for the workflow list
  // workflowId is now part of WorkflowSummary, but keep it if needed for explicit passing
  // workflowId: string; 
  onClick: (workflowId: string) => void; // onClick should pass workflowId
  onDelete?: (workflowId: string, event: React.MouseEvent) => void; // onDelete should pass workflowId and event
}

export const StageCard: React.FC<StageCardProps> = ({ stage, onClick, onDelete }) => {
  // Use useDeleteWorkflow hook
  const { mutate: deleteWorkflow, isPending: isDeleting } = useDeleteWorkflow();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    // Use the onDelete prop if provided, otherwise use the hook directly
    if (onDelete) {
      onDelete(stage.id, e);
    } else if (window.confirm(`Are you sure you want to delete workflow "${stage.name}"?`)) {
      deleteWorkflow(stage.id);
    }
  };

  return (
    <Card
      className="mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200 relative group" // Added relative group for delete button positioning
      onClick={() => onClick(stage.id)} // Pass workflow.id
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stage.name || 'Untitled Workflow'}</CardTitle>
        {/* Delete Button - positioned absolutely */}
        {onDelete && ( // Only show delete button if onDelete prop is provided
          <Button
            variant="ghost"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            aria-label={`Delete workflow ${stage.name}`}
            className="text-destructive hover:bg-destructive/10 absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" // Positioned
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <CardDescription>{stage.description || 'No description provided.'}</CardDescription>
        {/* Add more workflow summary details if needed */}
      </CardContent>
    </Card>
  );
};
