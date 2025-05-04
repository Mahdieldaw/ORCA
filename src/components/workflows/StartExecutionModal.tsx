'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface StartExecutionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  workflowName: string;
  onSubmit: (inputs: any) => void;
  isStartingExecution: boolean;
}

export const StartExecutionModal = ({
  isOpen,
  onOpenChange,
  workflowId,
  workflowName,
  onSubmit,
  isStartingExecution,
}: StartExecutionModalProps) => {
  const { toast } = useToast();
  const [inputValue, setInputValue] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setJsonError(null);
    }
  }, [isOpen]);

  const handleStart = () => {
    try {
      const parsed = inputValue.trim() ? JSON.parse(inputValue) : {};
      setJsonError(null);
      onSubmit(parsed);
    } catch (err: any) {
      setJsonError('Invalid JSON: ' + (err.message || 'Check your input.'));
      toast({ title: 'Invalid JSON', description: err.message || 'Check your input.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Start Execution for {workflowName}</DialogTitle>
          <DialogDescription>
            Enter initial input data for this workflow. Use JSON format. Leave blank for no input.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="initial-inputs">Initial Inputs (JSON)</Label>
          {/* --- Temporarily Comment Out Start ---
          <Textarea
            id="initial-inputs"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="{\n  \"key\": \"value\"\n}"
            disabled={isStartingExecution}
            className={cn(
              'min-h-[120px] font-mono',
              jsonError ? 'border-destructive focus-visible:ring-destructive' : ''
            )}
          />
          --- Temporarily Comment Out End --- */}
          {jsonError && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{jsonError}</AlertDescription>
            </Alert>
          )}
        </div>
        <DialogFooter>
          <Button
            onClick={handleStart}
            disabled={isStartingExecution}
            className="w-full"
          >
            {isStartingExecution ? 'Starting...' : 'Start Execution'}
          </Button>
          <DialogClose asChild>
            <Button variant="outline" className="w-full mt-2" disabled={isStartingExecution}>Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
