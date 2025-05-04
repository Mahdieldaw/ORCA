// src/services/apiClient.ts
import axios from 'axios';
import type { AxiosRequestConfig } from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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

export interface ExecutionDetail {
    id: string;
    workflowId: string;
    userId: string;
    status: string; // e.g., 'pending', 'running', 'completed', 'failed', 'paused'
    inputs: any; // Initial inputs provided
    outputs: any | null; // Final outputs if workflow completed successfully
    startedAt: string;
    endedAt: string | null;
    currentStageId: string | null; // ID of the stage currently being processed or last processed
    // Potentially include summary of stage executions or link to logs
    stageExecutions?: ExecutionLog[]; // Optional: Embed logs/stage summaries
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
export const fetchWorkflows = async (token?: string | null): Promise<WorkflowSummary[]> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.get('/workflows', config);
  return response.data;
};

export const fetchExecutionDetail = async (executionId: string, token?: string | null): Promise<ExecutionDetail> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.get(`/executions/${executionId}`, config);
  return response.data;
};

export const fetchWorkflowDetail = async (workflowId: string, token?: string | null): Promise<WorkflowDetail> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.get(`/workflows/${workflowId}`, config);
  return response.data;
};

export const startWorkflowExecution = async (workflowId: string, inputs: any, token?: string | null): Promise<ExecutionSummary> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.post(`/executions`, { workflowId, inputs }, config);
  return response.data;
};

export const fetchExecutions = async (workflowId?: string, token?: string | null): Promise<ExecutionSummary[]> => {
  const config: AxiosRequestConfig = { params: workflowId ? { workflowId } : {} };
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.get('/executions', config);
  return response.data;
};

export const fetchExecutionLogs = async (executionId: string, token?: string | null): Promise<ExecutionLog[]> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.get(`/executions/${executionId}/logs`, config);
  return response.data;
};

export const updateWorkflow = async (workflowId: string, data: Partial<Pick<WorkflowDetail, 'name' | 'description' | 'globalInputSchema'>>, token?: string | null): Promise<WorkflowDetail> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.put(`/workflows/${workflowId}`, data, config);
  return response.data;
};

export const deleteWorkflow = async (workflowId: string, token?: string | null): Promise<void> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  await apiClient.delete(`/workflows/${workflowId}`, config);
};

export const updateStage = async (workflowId: string, stageId: string, data: Partial<Omit<StageDetail, 'id' | 'workflowId' | 'userId' | 'createdAt' | 'updatedAt'>>, token?: string | null): Promise<StageDetail> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.put(`/workflows/${workflowId}/stages/${stageId}`, data, config);
  return response.data;
};

export const deleteStage = async (workflowId: string, stageId: string, token?: string | null): Promise<void> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  await apiClient.delete(`/workflows/${workflowId}/stages/${stageId}`, config);
};

export const recordManualValidation = async (executionId: string, stageId: string, result: 'pass' | 'fail', token?: string | null): Promise<ExecutionLog> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.post(`/executions/${executionId}/stages/${stageId}/validate`, { result }, config);
  return response.data;
};

export const retryStage = async (executionId: string, stageId: string, token?: string | null): Promise<ExecutionLog> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.post(`/executions/${executionId}/stages/${stageId}/retry`, {}, config);
  return response.data;
};

export const restoreSnapshot = async (snapshotId: string, token?: string | null): Promise<WorkflowDetail | ExecutionSummary> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.post(`/snapshots/${snapshotId}/restore`, {}, config);
  return response.data;
};

export const fetchSnapshots = async (filters: { workflowId?: string; stageId?: string; executionId?: string } = {}, token?: string | null): Promise<SnapshotSummary[]> => {
  const config: AxiosRequestConfig = { params: filters };
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.get('/snapshots', config);
  return response.data;
};

export const fetchSnapshotDetail = async (snapshotId: string, token?: string | null): Promise<SnapshotDetail> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.get(`/snapshots/${snapshotId}`, config);
  return response.data;
};

export const createSnapshot = async (data: { workflowId: string; name: string; description?: string }, token?: string | null): Promise<SnapshotDetail> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.post('/snapshots', { sourceWorkflowId: data.workflowId, name: data.name, description: data.description }, config);
  return response.data;
};

export const deleteSnapshot = async (snapshotId: string, token?: string | null): Promise<void> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  await apiClient.delete(`/snapshots/${snapshotId}`, config);
};

export const updateExecutionStatus = async (executionId: string, status: string, token?: string | null): Promise<ExecutionSummary> => {
  const config: AxiosRequestConfig = {};
  if (token) config.headers = { Authorization: `Bearer ${token}` };
  const response = await apiClient.put(`/executions/${executionId}`, { status }, config);
  return response.data;
};
