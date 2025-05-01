// src/components/workflows/StageCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Stage } from '@prisma/client'; // Assuming Stage type comes from Prisma
import { useDeleteStage } from '@/hooks/useStages'; // Import the hook
import { Trash2 } from 'lucide-react';

interface StageCardProps {
  stage: Stage; // Use the actual Stage type
  workflowId: string; // Need workflowId for deletion
  onClick: (stageId: string) => void;
  // Remove the old onDelete prop if it exists, or ensure it's not conflicting
  // onDelete?: (stageId: string) => void; 
}

export const StageCard: React.FC<StageCardProps> = ({ stage, workflowId, onClick }) => {
  const { mutate: deleteStage, isPending: isDeleting } = useDeleteStage();

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click event
    if (window.confirm(`Are you sure you want to delete stage "${stage.name}"?`)) {
      deleteStage({ workflowId, stageId: stage.id });
    }
  };

  return (
    <Card
      className="mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
      onClick={() => onClick(stage.id)}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{stage.name || 'Untitled Stage'}</CardTitle>
        {/* Add Delete Button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Delete stage"
          className="text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent>
        <CardDescription>{stage.description || 'No description provided.'}</CardDescription>
        {/* Add more stage details if needed */}
      </CardContent>
    </Card>
  );
};