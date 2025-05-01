// src/hooks/useSnapshots.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  fetchSnapshots,
  createSnapshot,
  fetchSnapshotDetail,
  SnapshotSummary,
  SnapshotDetail,
} from '@/services/apiClient';

// Define query keys
const snapshotKeys = {
  all: ['snapshots'] as const,
  lists: () => [...snapshotKeys.all, 'list'] as const,
  list: (filters: Record<string, any>) => [...snapshotKeys.lists(), filters] as const,
  details: () => [...snapshotKeys.all, 'detail'] as const,
  detail: (id: string) => [...snapshotKeys.details(), id] as const,
};

// Hook to fetch a list of snapshots with optional filters
export const useGetSnapshots = (filters: { workflowId?: string; stageId?: string; executionId?: string } = {}) => {
  return useQuery<SnapshotSummary[], Error>({
    queryKey: snapshotKeys.list(filters),
    queryFn: () => fetchSnapshots(filters),
    // Optional: Add staleTime, cacheTime, etc.
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Hook to fetch details of a single snapshot
export const useGetSnapshotDetail = (snapshotId: string, options?: { enabled?: boolean }) => {
  return useQuery<SnapshotDetail, Error>({
    queryKey: snapshotKeys.detail(snapshotId),
    queryFn: () => fetchSnapshotDetail(snapshotId),
    enabled: options?.enabled ?? !!snapshotId, // Only run if snapshotId is provided and enabled
    staleTime: 15 * 60 * 1000, // 15 minutes
  });
};

// Hook to create a new snapshot
export const useCreateSnapshot = () => {
  const queryClient = useQueryClient();

  return useMutation<
    SnapshotDetail, // Type of data returned by the mutation
    Error, // Type of error
    { executionId: string; stageId: string; name: string; stateData: any } // Type of variables passed to the mutation function
  >({
    mutationFn: createSnapshot,
    onSuccess: (newSnapshot) => {
      // Invalidate and refetch snapshot lists after creation
      queryClient.invalidateQueries({ queryKey: snapshotKeys.lists() });

      // Optionally, pre-populate the cache for the new snapshot's detail
      queryClient.setQueryData(snapshotKeys.detail(newSnapshot.id), newSnapshot);

      console.log('Snapshot created successfully:', newSnapshot);
      // You might want to add user feedback here (e.g., toast notification)
    },
    onError: (error) => {
      console.error('Error creating snapshot:', error);
      // Add error handling/feedback here
    },
  });
};