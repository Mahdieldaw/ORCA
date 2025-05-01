let's implement Phase 3: Data Binding & Integration for the Hybrid Thinking MVP.

This phase connects the Phase 1 UI Shell (Next.js/React) with the Phase 2 Backend API (NestJS). We'll replace mock data with live data fetching, wire up user interactions to trigger backend logic, and manage application state effectively.

Objective: Replace all placeholder data and interactions in the frontend with real API calls to the NestJS backend. Implement state management to ensure the UI reflects the actual application state (workflows, executions, stages, snapshots).

Tech Stack Focus: Next.js (React), TanStack Query (React Query), Zustand (or chosen state manager), Axios (or Fetch API for calls), NestJS API (already scaffolded), Prisma (database interaction via backend).

Instructions:

Step 1: Set up API Client / Fetching Hooks

Install Dependencies: If not already present:

npm install @tanstack/react-query axios zustand
# or
yarn add @tanstack/react-query axios zustand


Configure TanStack Query: Set up the QueryClientProvider in your _app.tsx (Pages Router) or layout.tsx (App Router).

// Example: src/pages/_app.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'; // Optional Devtools
import type { AppProps } from 'next/app';
import '@/styles/globals.css'; // Your global styles

const queryClient = new QueryClient();

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <Component {...pageProps} />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
export default MyApp;
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

Create API Service Layer: Define functions to interact with your NestJS API endpoints. Use Axios or Fetch. Store the base URL in environment variables (NEXT_PUBLIC_API_URL). Include logic to fetch the auth token (e.g., from Supabase client or storage) and add it to the Authorization header.

// src/services/apiClient.ts
import axios from 'axios';
// Assume a helper function `getAuthToken` exists to retrieve the JWT
// import { getAuthToken } from '@/utils/auth';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api', // Adjust port/path
});

// Add a request interceptor to include the auth token
apiClient.interceptors.request.use(async (config) => {
  // const token = await getAuthToken(); // Fetch token if needed
  const token = typeof window !== 'undefined' ? localStorage.getItem('supabase.auth.token') : null; // Example direct access - **use Supabase helpers instead in real app**
  if (token) {
    config.headers.Authorization = `Bearer ${JSON.parse(token).access_token}`; // Adjust based on actual token storage
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default apiClient;

// Define interfaces matching your backend DTOs/Entities (or import generated types)
export interface WorkflowSummary { id: string; name: string; createdAt: string; /* ... other summary fields */ }
export interface WorkflowDetail { id: string; name: string; description: string | null; stages: StageDetail[]; /* ... */ }
export interface StageDetail { id: string; stageOrder: number; name: string | null; promptTemplate: string | null; modelId: string | null; /* ... */ }
export interface ExecutionSummary { id: string; status: string; startedAt: string; /* ... */ }
export interface ExecutionLog { id: string; stageOrder: number; inputs: any; rawOutput: string | null; validationResult: string | null; /* ... */ }
// ... other interfaces

// Example API function structure
export const fetchWorkflows = async (): Promise<WorkflowSummary[]> => {
  const response = await apiClient.get('/workflows');
  return response.data;
};

export const fetchWorkflowDetail = async (workflowId: string): Promise<WorkflowDetail> => {
    const response = await apiClient.get(`/workflows/${workflowId}`);
    return response.data;
};

export const startWorkflowExecution = async (workflowId: string, inputs: any): Promise<ExecutionSummary> => {
    const response = await apiClient.post(`/executions/${workflowId}/run`, { inputs });
    return response.data;
};

// ... add functions for create/update workflow, fetch executions, logs, snapshots, etc.
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Create TanStack Query Hooks: Wrap the API service functions with useQuery for fetching data and useMutation for creating/updating/deleting data.

// src/hooks/useWorkflows.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchWorkflows, fetchWorkflowDetail, WorkflowSummary, WorkflowDetail /* ... other functions/types */ } from '@/services/apiClient';

const workflowKeys = {
  all: ['workflows'] as const,
  lists: () => [...workflowKeys.all, 'list'] as const,
  list: (filters: string) => [...workflowKeys.lists(), { filters }] as const,
  details: () => [...workflowKeys.all, 'detail'] as const,
  detail: (id: string) => [...workflowKeys.details(), id] as const,
};

export function useGetWorkflows() {
  return useQuery<WorkflowSummary[], Error>({
    queryKey: workflowKeys.lists(),
    queryFn: fetchWorkflows,
    // staleTime: 5 * 60 * 1000, // Example: 5 minutes stale time
  });
}

export function useGetWorkflowDetail(workflowId: string | null) {
    return useQuery<WorkflowDetail, Error>({
        queryKey: workflowKeys.detail(workflowId!), // The ! asserts workflowId is not null when enabled
        queryFn: () => fetchWorkflowDetail(workflowId!),
        enabled: !!workflowId, // Only run query if workflowId is provided
    });
}

// Example Mutation Hook
// export function useCreateWorkflow() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: createWorkflow, // Assumes createWorkflow exists in apiClient
//     onSuccess: () => {
//       // Invalidate and refetch workflow list after creation
//       queryClient.invalidateQueries({ queryKey: workflowKeys.lists() });
//     },
//   });
// }

// ... create hooks for other queries and mutations (startExecution, getLogs, saveSnapshot, etc.)
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Step 2: Implement Global State Management (Example with Zustand)

Create a store to hold application-wide state, such as the currently active workflow/stage, execution state, and potentially user settings.

// src/store/workflowStore.ts
import { create } from 'zustand';

interface WorkflowState {
  activeWorkflowId: string | null;
  setActiveWorkflowId: (id: string | null) => void;

  activeStageOrder: number | null;
  setActiveStageOrder: (order: number | null) => void;

  currentExecutionId: string | null;
  setCurrentExecutionId: (id: string | null) => void;

  // Add other relevant global states: e.g., isGhostOverlayOpen, isSnapshotDrawerOpen
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  activeWorkflowId: null,
  setActiveWorkflowId: (id) => set({ activeWorkflowId: id, activeStageOrder: null, currentExecutionId: null }), // Reset related state

  activeStageOrder: null,
  setActiveStageOrder: (order) => set({ activeStageOrder: order }),

  currentExecutionId: null,
  setCurrentExecutionId: (id) => set({ currentExecutionId: id }),
}));
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Step 3: Bind UI Components to Live Data and Actions

Modify the Phase 1 UI components to use the TanStack Query hooks and Zustand store instead of mock data and placeholder actions.

WorkflowExplorer:

Use useGetWorkflows() to fetch and display the list of workflows.

Use isLoading, isError, error from the hook to show loading/error states.

Modify handleStageClick (or add a handleWorkflowSelect): When a workflow card/link is clicked, call setActiveWorkflowId(workflowId) from the Zustand store and navigate to the editor/runner page (e.g., /workflows/[id]/edit). (Note: The explorer might list workflows, not stages directly. Adapt accordingly). If it lists stages within a selected workflow, fetch that workflow's details first.*

// src/pages/explorer.tsx OR a component like src/components/workflows/WorkflowList.tsx
// ... imports, including useGetWorkflows and useWorkflowStore ...

const WorkflowList = () => {
  const { data: workflows, isLoading, isError, error } = useGetWorkflows();
  const setActiveWorkflowId = useWorkflowStore((state) => state.setActiveWorkflowId);
  // const router = useRouter(); // If navigation needed

  const handleWorkflowSelect = (id: string) => {
    setActiveWorkflowId(id);
    // router.push(`/workflows/${id}/edit`); // Example navigation
    console.log(`Selected Workflow: ${id}. Zustand state updated.`);
  };

  if (isLoading) return <div>Loading workflows...</div>;
  if (isError) return <div>Error loading workflows: {error.message}</div>;

  return (
    <div className="space-y-3">
      {workflows?.map((wf) => (
        <Card key={wf.id} onClick={() => handleWorkflowSelect(wf.id)} className="cursor-pointer hover:border-primary">
          <CardHeader>
            <CardTitle>{wf.name}</CardTitle>
            {/* Add more summary info */}
          </CardHeader>
        </Card>
      ))}
      {workflows?.length === 0 && <p>No workflows found.</p>}
    </div>
  );
};
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
Typescript jsx
IGNORE_WHEN_COPYING_END

StageController:

Fetch the details of the activeWorkflowId (from Zustand store) using useGetWorkflowDetail().

Find the specific stage data from the workflow details based on activeStageOrder (from Zustand store).

Bind the Textarea value to the fetched promptTemplate and its onChange to update component state (and eventually trigger a save mutation).

Display real model name (fetched via modelId).

Display real validation type/criteria.

Wire up the "Save Snapshot" button to trigger a useMutation hook that calls your backend snapshot creation endpoint. Use Zustand to manage the HybridThinkDrawer open state.

Wire up "Retry" button conditionally based on execution log status (fetched via another hook) and trigger a retry mutation.

HybridThinkDrawer / GhostOverlay:

Use query hooks (useGetSnapshots, useGetExecutionLogs) filtered by activeWorkflowId or currentExecutionId (from Zustand store) to populate lists.

Implement "Restore Snapshot" button: Get snapshot ID, potentially trigger the SnapshotRestoreModal (manage its state via Zustand or locally), and on confirmation, call a restoreSnapshot mutation.

Implement "Inject" buttons: Update the relevant state in the StageController (might require passing setters down or using Zustand).

Workflow Execution Trigger:

On the page where execution starts (e.g., a "Run" button on the editor or runner page), trigger a useMutation hook that calls the startWorkflowExecution API function, passing the activeWorkflowId and any initial inputs.

On success, store the returned executionId in the Zustand store (setCurrentExecutionId) and potentially navigate to the runner page or update the UI to show execution progress.

Displaying Execution State:

On the WorkflowRunner page, use a query hook like useGetExecutionDetails(currentExecutionId) which frequently refetches (or uses WebSockets/SSE - see below) to get the latest status, currentStageOrder, and logs.

Update the progress indicator, displayed stage (StageController), and log viewer based on this fetched data.

Show loading states while fetching/mutating.

Step 4: Implement Real-time Updates (Optional but Recommended)

Option A: Polling (Simpler): Configure TanStack Query hooks fetching execution status/logs to refetch automatically at intervals (e.g., every 3-5 seconds) while status is 'running'.

// Example polling with useQuery
useQuery({
    queryKey: ['executionStatus', executionId],
    queryFn: () => fetchExecutionStatus(executionId!),
    enabled: !!executionId && statusIsNotFinal, // Only poll if running
    refetchInterval: 5000, // Refetch every 5 seconds
});
IGNORE_WHEN_COPYING_START
content_copy
download
Use code with caution.
TypeScript
IGNORE_WHEN_COPYING_END

Option B: Server-Sent Events (SSE) / WebSockets (More Advanced):

Backend (NestJS): Implement an SSE or WebSocket endpoint. When an execution updates (stage completes, status changes), push an event to connected clients for that execution ID.

Frontend (Next.js): Establish a connection to the backend event stream when viewing an active execution. On receiving an event, manually update the TanStack Query cache (queryClient.setQueryData) or trigger a refetch (queryClient.invalidateQueries) for the relevant execution data. (This provides true real-time updates without constant polling).

Step 5: Error Handling

Utilize the isError, error properties from useQuery and useMutation.

Display user-friendly error messages (e.g., using Toast components from shadcn/ui) when API calls fail.

Handle specific error codes from the backend if necessary (e.g., resource not found, validation errors).

Step 6: Testing

Manual Testing: Thoroughly test all integrated flows:

Loading workflow lists/details.

Creating/Saving workflows and stages.

Starting an execution.

Observing stage progression and UI updates.

Using manual validation buttons.

Saving/Restoring snapshots.

Using the Ghost Overlay with real data.

Handling API errors gracefully.

(Optional) Mock Service Worker (MSW): Implement MSW to mock the NestJS API responses during frontend development and integration testing. This allows testing the frontend's data handling logic without needing a live backend.

End-to-End Tests (Cypress/Playwright): Update existing or create new e2e tests to cover the integrated flows, including API interactions.

Phase 3 Acceptance Criteria:

✅ All mock data imports and usages are removed from UI components.

✅ Data is fetched from the NestJS backend API using TanStack Query hooks. Loading and error states are handled.

✅ WorkflowExplorer displays real user workflows; selecting one updates global state/navigates.

✅ StageController displays data for the active stage, binds prompt editing (save mutation pending), and reflects (mocked or eventually real) validation status based on fetched logs.

✅ Workflow execution can be initiated via UI, triggering the backend startExecution endpoint.

✅ WorkflowRunner UI updates based on fetched execution status and logs (via polling or real-time updates).

✅ Snapshot save triggers backend API call. Snapshot lists display real data. Restore action triggers confirmation and (placeholder) restore API call.

✅ Ghost Overlay displays real logs and snapshots; inject actions update relevant UI state (placeholder).

✅ User interactions that modify data (saving, validating, starting runs) use useMutation hooks.

✅ Global state (active workflow/stage/execution) is managed correctly via Zustand (or chosen manager).

✅ Basic network/API error handling is implemented with user feedback.

proceed with implementing these integration steps. Focus on replacing mock data with API calls via TanStack Query hooks, wiring up mutations for user actions, and managing shared state with Zustand. Implement either polling or prepare the structure for real-time updates for execution status.