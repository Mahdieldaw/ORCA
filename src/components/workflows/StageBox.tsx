import { useState, useEffect } from 'react';
// Use correct types from apiClient
import { StageDetail, ExecutionLog } from '@/services/apiClient'; // Import ExecutionLog if needed later
import { useWorkflowStore } from '@/store/workflowStore'; // Import Zustand store
import { cn } from '@/lib/utils'; // For conditional classes
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreVerticalIcon } from 'lucide-react';

// Define expected status strings explicitly
type ExecutionStatusString = ExecutionLog['status']; // Use status from ExecutionLog
type ValidatorStatusString = ExecutionLog['validationResult']; // Use validationResult from ExecutionLog

interface StageBoxProps {
  stage: StageDetail; // Use StageDetail type
  latestLog?: ExecutionLog | null; // Optionally pass latest log
  // Update prop to accept stage order (number)
  onMouseEnter: (stageOrder: number) => void;
  onMouseLeave: () => void;
}

export const StageBox = ({ stage, latestLog, onMouseEnter, onMouseLeave }: StageBoxProps) => {
  // Use Zustand store
  const setActiveStageOrder = useWorkflowStore((state) => state.setActiveStageOrder);
  const currentStageOrder = useWorkflowStore((state) => state.activeStageOrder);
  // const isOverviewMode = useWorkflowStore((state) => state.isOverviewMode); // Not used here directly

  const [showDropdown, setShowDropdown] = useState(false);
  // const [darkMode, setDarkMode] = useState(true); // Remove local dark mode

  // Remove dark mode effect
  // useEffect(() => { ... }, []);

  const handleClick = () => {
    setActiveStageOrder(stage.stageOrder); // Use stageOrder from StageDetail
  };

  // Use ExecutionStatusString type
  const getStatusColorClass = (status: ExecutionStatusString | null | undefined) => {
    // Access status from latestLog if available, otherwise default
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'running': return 'bg-blue-500'; // Assuming 'running' maps to 'In Progress'
      case 'failed': return 'bg-red-500';
      // Add other ExecutionLog statuses as needed ('pending', 'skipped')
      default: return 'bg-muted-foreground'; // Default/Unknown
    }
  };

  // Type the status parameter explicitly using ValidatorStatusString
  const getValidatorBadge = (status?: ValidatorStatusString | null) => {
    if (!status) return null;

    // Map ExecutionLog validationResult strings to colors
    const colors: Record<string, string> = {
      'passed': 'bg-green-500',
      'failed': 'bg-red-500',
      // Add other potential validation results if needed
      'pending': 'bg-yellow-500', // Example
      'Not Run': 'bg-muted-foreground', // Keep 'Not Run' or map if needed
    };
    const colorClass = colors[status] || 'bg-muted-foreground';

    // Use Tooltip for the badge
    return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="absolute top-2 right-2 cursor-default">
              <div
                className={`w-2.5 h-2.5 rounded-full ${colorClass}`}
                aria-label={`Validator status: ${status}`}
              />
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <p>Validator: {status}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const isActive = currentStageOrder === stage.stageOrder;

  // Remove themeClasses object
  // const themeClasses = { ... };

  // Determine status based on latestLog if provided, otherwise default
  const displayStatus = latestLog?.status ?? null; // Use status from ExecutionLog
  const validatorStatus = latestLog?.validationResult ?? 'Not Run'; // Use validationResult from ExecutionLog

  return (
    <Card
      className={cn(
        'relative flex flex-col w-[160px] sm:w-[180px] h-[120px] cursor-pointer transition-all duration-200 hover:shadow-md',
        isActive
          ? 'border-primary ring-1 ring-primary/50 bg-secondary/50'
          : 'border-border bg-card hover:border-muted-foreground/50 hover:scale-[1.02]',
        // Use status from latestLog for styling
        displayStatus === 'failed' && !isActive ? 'border-destructive/50' : '',
        displayStatus === 'failed' && isActive ? 'border-destructive ring-1 ring-destructive/50' : ''
      )}
      onMouseEnter={() => onMouseEnter(stage.stageOrder)} // Pass stageOrder
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      // Remove onContextMenu if using DropdownMenu trigger
      // onContextMenu={(e) => { ... }}
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
          {/* Icon - Consider using lucide icons */}
          {/* Adjust icon source if needed */}
          <span className="text-lg" aria-hidden="true">{'📄'}</span>
          <CardTitle className="text-sm font-semibold truncate">{stage.name || `Stage ${stage.stageOrder}`}</CardTitle>
        </div>
        {/* Use Tooltip for status indicator */}
        <TooltipProvider delayDuration={100}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={`h-2.5 w-2.5 rounded-full flex-shrink-0 cursor-default ${getStatusColorClass(displayStatus)}`}
                aria-label={`Status: ${displayStatus ?? 'Unknown'}`}
              />
            </TooltipTrigger>
            <TooltipContent side="top">
              <p>Status: {displayStatus ?? 'Unknown'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>

      <CardContent className="p-3 pt-0 flex-grow">
        {/* Use promptTemplate as description fallback */}
        <CardDescription className="text-xs line-clamp-2 overflow-hidden">
          {stage.promptTemplate || 'No description available'}
        </CardDescription>
      </CardContent>

      {/* Stage metadata indicators using Badge - Adjust based on StageDetail */}
      <CardFooter className="p-3 pt-0 flex items-center space-x-1">
        {/* Example: Check a property on stage if it exists */}
        {/* {stage.metadata?.isPartOfGeneration && ( ... ) } */}
        {/* {stage.metadata?.restoredFromSnapshotId && ( ... ) } */}
      </CardFooter>

      {/* Pass the correct validator status property from log */}
      {getValidatorBadge(validatorStatus)}

      {/* Dropdown Menu using shadcn */}
      <DropdownMenu open={showDropdown} onOpenChange={setShowDropdown}>
        <DropdownMenuTrigger asChild>
          <button
            className="absolute bottom-1 right-1 p-1 rounded hover:bg-muted focus:outline-none focus:ring-1 focus:ring-ring"
            // Type event parameter
            onClick={(e: React.MouseEvent) => { e.stopPropagation(); setShowDropdown(true); }}
            aria-label="Stage options"
          >
            <MoreVerticalIcon className="h-4 w-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
          {/* Add actual actions later */}
          <DropdownMenuItem onClick={() => console.log('Restore action for stage:', stage.id)}>Restore</DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Inject action for stage:', stage.id)}>Inject</DropdownMenuItem>
          <DropdownMenuItem onClick={() => console.log('Compare History action for stage:', stage.id)}>Compare History</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
       {/* Remove the standalone button */}
       {/* <button ... /> */}
    </Card>
  );
};