'use client';

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // Import DialogClose for explicit close button
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, AlertCircle } from 'lucide-react'; // Import icons
import { useToast } from '@/components/ui/use-toast';

interface StartExecutionModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  workflowId: string;
  workflowName: string;
  onSubmit: (inputs: Record<string, any>) => void;
  isStartingExecution: boolean;
}

export const StartExecutionModal: React.FC<StartExecutionModalProps> = ({
  isOpen,
  onOpenChange,
  workflowId,
  workflowName,
  onSubmit,
  isStartingExecution,
}) => {
  const [inputJson, setInputJson] = useState('{}');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const { toast } = useToast();

  // Reset state when modal opens or workflow changes
  useEffect(() => {
    if (isOpen) {
      setInputJson('{}');
      setJsonError(null);
    }
  }, [isOpen, workflowId]);

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputJson(event.target.value);
    setJsonError(null); // Clear error on input change
  };

  const handleSubmit = () => {
    let parsedInputs: Record<string, any>;
    try {
      parsedInputs = JSON.parse(inputJson);
      if (typeof parsedInputs !== 'object' || parsedInputs === null || Array.isArray(parsedInputs)) {
        throw new Error('Input must be a valid JSON object.');
      }
      setJsonError(null);
      onSubmit(parsedInputs); // Call the parent submit handler
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Invalid JSON format.';
      setJsonError(message);
      toast({
        title: 'Invalid Input',
        description: message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Start Execution: {workflowName}</DialogTitle>
          <DialogDescription>
            Provide initial inputs for the workflow as a JSON object. These inputs
            can be accessed in stage prompts using {'{{inputs.yourKey}}'} syntax.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-1 items-center gap-4">
            <Label htmlFor="initial-inputs" className="text-left">
              Initial Inputs (JSON)
            </Label>
            <Textarea
              id="initial-inputs"
              value={inputJson}
              onChange={handleInputChange}
              placeholder='{ "topic": "AI agents", "tone": "informative" }'
              rows={6}
              className={`font-mono ${jsonError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              disabled={isStartingExecution}
            />
            {jsonError && (
              <p className="text-sm text-destructive flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                {jsonError}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isStartingExecution}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleSubmit} disabled={isStartingExecution || !!jsonError}>
            {isStartingExecution ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting...
              </>
            ) : (
              'Start Execution'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
