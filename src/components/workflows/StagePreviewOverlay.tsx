import { StageDetail } from '@/services/apiClient'; // Use StageDetail from Orca types
import { useEffect, useRef } from 'react'; // Removed useState
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface StagePreviewOverlayProps {
  stage: StageDetail; // Use StageDetail type
  position: { x: number, y: number, side: 'left' | 'right' };
}

export const StagePreviewOverlay = ({ stage, position }: StagePreviewOverlayProps) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Ensure overlay stays within viewport
  useEffect(() => {
    if (overlayRef.current) {
      const rect = overlayRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      let transformY = 0;
      let finalLeft = position.x;
      if (rect.bottom > viewportHeight - 20) {
        transformY = -(rect.bottom - (viewportHeight - 20));
      }
      if (position.side === 'right' && rect.right > viewportWidth - 20) {
        finalLeft = viewportWidth - rect.width - 20;
      }
      overlayRef.current.style.transform = `translateY(${transformY}px)`;
      overlayRef.current.style.left = `${Math.max(20, finalLeft)}px`;
    }
  }, [position, stage.id]);

  return (
    <Card
      ref={overlayRef}
      className="fixed z-50 w-[350px] max-h-[300px] overflow-hidden shadow-xl transition-all duration-150 flex flex-col bg-card border"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      <CardHeader className="flex flex-row items-center justify-between p-3 border-b">
        <CardTitle className="text-base font-semibold truncate">{stage.name}</CardTitle>
        {stage.validationType && (
          <span className="text-xs bg-muted px-2 py-0.5 rounded ml-2">{stage.validationType}</span>
        )}
      </CardHeader>
      <CardContent className="p-3">
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
      </CardContent>
    </Card>
  );
};