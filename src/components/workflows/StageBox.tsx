import React, { useRef } from 'react';
import { useWorkflowStore } from '@/store/workflowStore'; // Import Zustand store
import { cn } from '@/lib/utils'; // For conditional classes
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { StageDetail, ExecutionLog } from '@/services/apiClient';

interface StageBoxProps {
  stage: StageDetail;
  latestLog?: ExecutionLog | null;
  onMouseEnter: (stageOrder: number, element: HTMLElement | null) => void;
  onMouseLeave: () => void;
}

export const StageBox = ({ stage, latestLog, onMouseEnter, onMouseLeave }: StageBoxProps) => {
  const setActiveStageOrder = useWorkflowStore((state) => state.setActiveStageOrder);
  const currentStageOrder = useWorkflowStore((state) => state.activeStageOrder);
  const isActive = currentStageOrder === stage.stageOrder;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleClick = () => {
    setActiveStageOrder(stage.stageOrder);
  };

  return (
    <Card
      ref={cardRef}
      className={cn(
        'relative flex flex-col w-[160px] sm:w-[180px] h-[120px] cursor-pointer transition-all duration-200 hover:shadow-md',
        isActive
          ? 'border-primary ring-1 ring-primary/50 bg-secondary/50'
          : 'border-border bg-card hover:border-muted-foreground/50 hover:scale-[1.02]'
      )}
      onMouseEnter={() => onMouseEnter(stage.stageOrder, cardRef.current)}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      role="button"
      aria-pressed={isActive}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
          e.preventDefault();
        }
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
        <div className="flex items-center space-x-2">
          <span className="text-lg" aria-hidden="true">📄</span>
          <CardTitle className="text-sm font-semibold truncate">{stage.name || `Stage ${stage.stageOrder}`}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 flex-grow">
        <div className="text-xs line-clamp-2 overflow-hidden">
          {stage.promptTemplate || 'No description available'}
        </div>
      </CardContent>
      <CardFooter className="p-3 pt-0 flex items-center space-x-1">
        {stage.validationType && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded">
            {stage.validationType}
          </span>
        )}
      </CardFooter>
    </Card>
  );
};