// src/data/mockWorkflows.ts

export interface MockStage {
  id: string;
  order: number;
  name: string;
  type: 'LLM' | 'Validation' | 'Input' | 'Output'; // Example types
  status: 'completed' | 'current' | 'pending' | 'error'; // For visual indicators
  previewText: string; // Short description for hover
}

export const mockWorkflowStages: MockStage[] = [
  { id: 'stage-1', order: 1, name: 'Ingest Document', type: 'Input', status: 'completed', previewText: 'Loads the initial text document.' },
  { id: 'stage-2', order: 2, name: 'Summarize Content', type: 'LLM', status: 'completed', previewText: 'Generates a concise summary using GPT-4.' },
  { id: 'stage-3', order: 3, name: 'Validate JSON Output', type: 'Validation', status: 'current', previewText: 'Checks if the LLM output is valid JSON.' },
  { id: 'stage-4', order: 4, name: 'Extract Key Entities', type: 'LLM', status: 'pending', previewText: 'Identifies key names and organizations.' },
  { id: 'stage-5', order: 5, name: 'Format Report', type: 'Output', status: 'pending', previewText: 'Generates the final report document.' },
  { id: 'stage-6', order: 6, name: 'Sentiment Analysis', type: 'LLM', status: 'error', previewText: 'Analyzes sentiment (failed). ' },
];

// Added for StageController (Phase 1.2)
export interface MockStageDetail extends MockStage {
  promptTemplate: string;
  validationType: 'manual' | 'regex' | 'none';
  validationCriteria: string | null; // e.g., the regex pattern
  // Add other potential fields later like model_id, retry_limit etc.
}

export const mockSelectedStageDetail: MockStageDetail = {
  id: 'stage-3', // Corresponds to the 'current' stage in previous mock data
  order: 3,
  name: 'Validate JSON Output',
  type: 'Validation',
  status: 'current',
  previewText: 'Checks if the LLM output is valid JSON.',
  promptTemplate: `Previous Stage Output:\n{{llm_output}}\n\nPlease validate if the output above is valid JSON format. Respond with only 'VALID' or 'INVALID'.`,
  validationType: 'regex',
  validationCriteria: '^(VALID|INVALID)$' // Example criteria for its *own* validation (if it were an LLM validator)
};

// Added for HybridThinkDrawer & GhostOverlay (Phase 1.3)

export interface MockSnapshot {
  id: string;
  name: string;
  timestamp: string; // Simple string for Phase 1
  type: 'workflow' | 'stage';
}

export interface MockHistoryItem {
  id: string;
  stageName: string;
  timestamp: string;
  status: 'completed' | 'error';
  summary: string; // Short summary of the execution log item
}

export const mockSnapshots: MockSnapshot[] = [
  { id: 'snap-1', name: 'Initial Blog Post Workflow v1', timestamp: '2023-10-26 10:00', type: 'workflow' },
  { id: 'snap-2', name: 'Summarization Stage (Claude)', timestamp: '2023-10-26 09:30', type: 'stage' },
  { id: 'snap-3', name: 'Validated JSON Structure', timestamp: '2023-10-25 15:00', type: 'stage' },
];

export const mockHistory: MockHistoryItem[] = [
  { id: 'hist-1', stageName: 'Ingest Document', timestamp: '2023-10-27 11:05', status: 'completed', summary: 'Loaded file: report.docx' },
  { id: 'hist-2', stageName: 'Summarize Content', timestamp: '2023-10-27 11:06', status: 'completed', summary: 'Generated 250-word summary.' },
  { id: 'hist-3', stageName: 'Validate JSON Output', timestamp: '2023-10-27 11:07', status: 'error', summary: 'Validation failed: Invalid format.' },
];