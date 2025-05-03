// import { Stage } from '../../types/workflow'; // Use Orca types
import { StageDetail, ExecutionLog } from '@/services/apiClient'; // Use StageDetail and ExecutionLog from Orca types
// import { useWorkflow } from '../../context/useWorkflow'; // Remove old context
import { useEffect, useRef } from 'react'; // Removed useState
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { Button } from '@/components/ui/button'; // Button not used
// import { format } from 'date-fns'; // format not used
import { cn } from '@/lib/utils';

interface StagePreviewOverlayProps {
  stage: StageDetail; // Use StageDetail type
  latestLog?: ExecutionLog | null; // Add latestLog prop
  position: { x: number, y: number, side: 'left' | 'right' };
}

export const StagePreviewOverlay = ({ stage, latestLog, position }: StagePreviewOverlayProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Ensure overlay stays within viewport
  useEffect(() => {
    if (overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      let transformY = 0;
      let finalLeft = position.x;

      // Check bottom boundary
      if (rect.bottom > viewportHeight - 20) {
        transformY = -(rect.bottom - (viewportHeight - 20));
      }

      // Check right boundary (only if positioned on the right initially)
      if (position.side === 'right' && rect.right > viewportWidth - 20) {
        // Attempt to reposition to the left of the original trigger point
        // This needs the original trigger element's rect, which isn't available here.
        // For now, just clamp it to the edge or consider a simpler left positioning.
        // A better approach might involve passing the trigger element's rect.
        finalLeft = viewportWidth - rect.width - 20; // Clamp to right edge
      }

      overlayRef.current.style.transform = `translateY(${transformY}px)`;
      overlayRef.current.style.left = `${Math.max(20, finalLeft)}px`; // Ensure it doesn't go off left screen
    }
  }, [position, stage.id]); // Rerun when position or stage changes

  // Determine status and variant from latestLog
  const displayStatus = latestLog?.status ?? 'pending'; // Default to pending
  const getStatusBadgeVariant = (status: ExecutionLog['status'] | 'pending'): 'default' | 'destructive' | 'outline' | 'secondary' => {
    switch (status) {
      case 'completed':
      case 'passed': // Treat passed validation as completed
        return 'default'; // Use default (often green-ish in themes)
      case 'running':
        return 'secondary'; // Use secondary (often blue/purple)
      case 'failed':
      case 'error': // Treat error as failed
        return 'destructive'; // Use destructive (red)
      case 'pending':
      case 'awaiting_validation':
      case 'skipped':
      default:
        return 'outline'; // Use outline for pending/unknown states
    }
  };

  return (
    <Card
      ref={overlayRef}
      className="fixed z-50 w-[350px] max-h-[500px] overflow-hidden shadow-xl transition-all duration-150 flex flex-col bg-card border"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        // Initial transform might be needed if position is based on top-left
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
        <div className="flex items-center space-x-2">
          {/* Icon - Consider using lucide icons */}
          <span className="text-lg" aria-hidden="true">{stage.icon || '📄'}</span>
          <CardTitle className="text-base font-semibold truncate">{stage.name}</CardTitle>
        </div>
        {/* Use status from latestLog */}
        <Badge variant={getStatusBadgeVariant(displayStatus)} className="text-xs capitalize">
          {displayStatus}
        </Badge>
      </CardHeader>

      <ScrollArea className="flex-grow">
        <CardContent className="p-3 space-y-3">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Prompt</h4>
            <Card className="bg-muted/50 max-h-[100px] overflow-hidden">
              <CardContent className="p-2 text-xs">
                <p className="line-clamp-4 whitespace-pre-wrap">
                  {stage.promptTemplate || <span className="italic text-muted-foreground/80">No prompt available</span>}
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <h4 className="text-xs font-medium text-muted-foreground mb-1">Output</h4>
            <Card className="bg-muted/50 max-h-[150px] overflow-hidden">
              <CardContent className="p-2 text-xs">
                 <p className="line-clamp-6 whitespace-pre-wrap">
                   {/* Show output from latestLog */}
                   {latestLog?.processedOutput ?? latestLog?.rawOutput ?? <span className="italic text-muted-foreground/80">No output available</span>}
                 </p>
              </CardContent>
            </Card>
          </div>

          {/* Snapshot info could be simplified or removed from overlay */}
          {/* Example: Show count or last snapshot time */}
          {/* {snapshots.length > 0 && ( ... ) } */}
        </CardContent>
      </ScrollArea>

      {/* Optional Footer */}
      {/* <CardFooter className="p-3 border-t">
        <p className="text-xs text-muted-foreground">Last updated: {format(new Date(stage.metadata?.updatedAt || Date.now()), 'Pp')}</p>
      </CardFooter> */}
    </Card>
  );
};