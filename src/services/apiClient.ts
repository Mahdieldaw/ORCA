// src/services/apiClient.ts
import axios from 'axios';
// Assume a helper function `getAuthToken` exists to retrieve the JWT
// import { getAuthToken } from '@/utils/auth'; // Placeholder for actual auth helper

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api', // Adjust port/path as needed
});

// Add a request interceptor to include the auth token
// IMPORTANT: Replace this with your actual auth token retrieval logic (e.g., from Clerk, Supabase, etc.)
apiClient.interceptors.request.use(async (config) => {
  // Example using Clerk's __session cookie (adjust if using localStorage or other methods)
  // This is a simplified example and might need refinement based on your auth setup.
  // Consider using official SDK helpers for token management.
  let token: string | null = null;
  if (typeof window !== 'undefined') {
    // Attempt to get token from common storage methods
    const clerkToken = document.cookie.split('; ').find(row => row.startsWith('__session='))?.split('=')[1];
    const supabaseTokenData = localStorage.getItem('supabase.auth.token'); // Example for Supabase

    if (clerkToken) {
        token = clerkToken; // Use Clerk session token directly if available
    } else if (supabaseTokenData) {
        try {
            const parsedToken = JSON.parse(supabaseTokenData);
            token = parsedToken.access_token; // Adjust based on actual Supabase token structure
        } catch (e) {
            console.error("Error parsing Supabase token from localStorage", e);
        }
    }
    // Add other potential token sources if needed
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  console.error('Axios request error:', error);
  return Promise.reject(error);
});

export default apiClient;

// Define interfaces matching your backend DTOs/Entities (or import generated types)
// It's highly recommended to share types between frontend and backend if possible
// (e.g., using a shared package or code generation like OpenAPI/Swagger)
export interface WorkflowSummary {
    id: string;
    name: string;
    createdAt: string; // Assuming ISO string format
    // Add other summary fields returned by your API (e.g., description, status, stageCount)
    description?: string | null;
    status?: string; // e.g., 'draft', 'active'
    stageCount?: number;
}

export interface StageDetail {
    id: string;
    workflowId: string;
    userId: string;
    stageOrder: number;
    name: string | null;
    promptTemplate: string | null;
    modelId: string | null; // Foreign key to Model
    validationType: string; // e.g., 'none', 'manual', 'regex', 'webhook'
    validationCriteria: any; // JSON blob, structure depends on validationType
    outputVariables: any; // JSON blob for expected output structure
    inputVariableMapping: any; // JSON blob for mapping inputs from previous stages/global
    retryLimit: number;
    nextStageOnPass: string | null; // ID of the next stage on successful validation
    nextStageOnFail: string | null; // ID of the next stage on failed validation
    flowiseConfig: any; // JSON blob for Flowise-specific settings if applicable
    createdAt: string;
    updatedAt: string;
}

export interface WorkflowDetail {
    id: string;
    userId: string;
    name: string;
    description: string | null;
    globalInputSchema: any; // JSON blob defining expected initial inputs
    createdAt: string;
    updatedAt: string;
    stages: StageDetail[]; // Embed or link stages based on API design
}

export interface ExecutionSummary {
    id: string;
    workflowId: string;
    userId: string;
    status: string; // e.g., 'pending', 'running', 'completed', 'failed', 'paused'
    startedAt: string;
    endedAt: string | null;
    // Add other summary fields like currentStageOrder
    currentStageOrder?: number | null;
}

export interface ExecutionLog {
    id: string;
    executionId: string;
    stageId: string;
    stageOrder: number;
    status: string; // e.g., 'pending', 'running', 'completed', 'failed', 'skipped'
    inputs: any; // JSON blob of inputs received by the stage
    rawOutput: string | null; // Raw output from the model/tool
    processedOutput: any | null; // Processed/structured output based on outputVariables
    validationResult: string | null; // e.g., 'passed', 'failed', 'pending'
    validationDetails: any | null; // More info on validation outcome
    errorDetails: string | null;
    startedAt: string;
    endedAt: string | null;
    retryCount: number;
}

export interface SnapshotSummary {
    id: string;
    executionId: string;
    stageId: string;
    name: string;
    createdAt: string;
    // Add other relevant summary fields
}

export interface SnapshotDetail {
    id: string;
    executionId: string;
    stageId: string;
    name: string;
    stateData: any; // The actual captured state (e.g., inputs, outputs, variables)
    createdAt: string;
    // Add other relevant detail fields
}

// --- API Function Examples --- //

// Fetch all workflows (summary view)
export const fetchWorkflows = async (): Promise<WorkflowSummary[]> => {
  console.log('Fetching workflows from:', apiClient.defaults.baseURL + '/workflows');
  const response = await apiClient.get('/workflows');
  return response.data;
};

// Fetch detailed information for a single workflow
export const fetchWorkflowDetail = async (workflowId: string): Promise<WorkflowDetail> => {
    console.log(`Fetching workflow detail for ${workflowId} from:`, apiClient.defaults.baseURL + `/workflows/${workflowId}`);
    const response = await apiClient.get(`/workflows/${workflowId}`);
    return response.data;
};

// Start a new execution for a workflow
export const startWorkflowExecution = async (workflowId: string, inputs: any): Promise<ExecutionSummary> => {
    console.log(`Starting execution for workflow ${workflowId} with inputs:`, inputs);
    // Note: The API endpoint might differ, e.g., /workflows/{workflowId}/execute or /executions
    // Adjust the endpoint based on your actual backend API structure.
    // Assuming POST to /executions with workflowId and inputs in the body
    const response = await apiClient.post(`/executions`, { workflowId, inputs });
    // Or if endpoint is like /workflows/{id}/run:
    // const response = await apiClient.post(`/workflows/${workflowId}/run`, { inputs });
    return response.data;
};

// Fetch all executions (summary view) - potentially with filtering/pagination
export const fetchExecutions = async (workflowId?: string): Promise<ExecutionSummary[]> => {
    const params = workflowId ? { workflowId } : {};
    console.log('Fetching executions with params:', params);
    const response = await apiClient.get('/executions', { params });
    return response.data;
};

// Fetch logs for a specific execution
export const fetchExecutionLogs = async (executionId: string): Promise<ExecutionLog[]> => {
    console.log(`Fetching logs for execution ${executionId}`);
    // Assuming endpoint like /executions/{executionId}/logs
    const response = await apiClient.get(`/executions/${executionId}/logs`);
    return response.data;
};

// Add functions for:
// - createWorkflow(data: Omit<WorkflowDetail, 'id' | 'userId' | 'createdAt' | 'updatedAt' | 'stages'>): Promise<WorkflowDetail>
// - updateWorkflow(workflowId: string, data: Partial<WorkflowDetail>): Promise<WorkflowDetail>
// - deleteWorkflow(workflowId: string): Promise<void>
// - createStage(workflowId: string, data: Omit<StageDetail, 'id' | 'workflowId' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<StageDetail>
// - updateStage(stageId: string, data: Partial<StageDetail>): Promise<StageDetail>
// - deleteStage(stageId: string): Promise<void>

// Fetch snapshots (summary view) - potentially filtered
export const fetchSnapshots = async (filters: { workflowId?: string; stageId?: string; executionId?: string } = {}): Promise<SnapshotSummary[]> => {
    console.log('Fetching snapshots with filters:', filters);
    const response = await apiClient.get('/snapshots', { params: filters });
    return response.data;
};

// - fetchSnapshots(workflowId?: string, stageId?: string): Promise<SnapshotSummary[]>
// - createSnapshot(data: { executionId: string, stageId: string, name: string, stateData: any }): Promise<SnapshotDetail>
// - fetchSnapshotDetail(snapshotId: string): Promise<SnapshotDetail>
// - restoreFromSnapshot(snapshotId: string): Promise<ExecutionSummary> // Might start a new execution
// - fetchModels(): Promise<Model[]>