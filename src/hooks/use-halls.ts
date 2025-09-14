// src/hooks/use-halls.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Types
interface Hall {
  equipment: any;
  id: string;
  name: string;
  location: string;
  capacity: number;
  facilities: string[];
  description?: string;
  coordinatorId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface HallIssue {
  id: string;
  hallId: string;
  title: string;
  description: string;
  type: 'TECHNICAL' | 'MAINTENANCE' | 'EMERGENCY' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  reportedById: string;
  assignedToId?: string;
  resolvedAt?: Date;
  resolution?: string;
  attachments?: string[];
  createdAt: Date;
  updatedAt: Date;
  hall?: Hall;
  reportedBy?: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
    email: string;
  };
}

interface CreateIssueData {
  hallId: string;
  title: string;
  description: string;
  type: 'TECHNICAL' | 'MAINTENANCE' | 'EMERGENCY' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  attachments?: File[];
}

interface UpdateIssueData {
  title?: string;
  description?: string;
  type?: 'TECHNICAL' | 'MAINTENANCE' | 'EMERGENCY' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status?: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  assignedToId?: string;
  resolution?: string;
}

interface HallStats {
  totalHalls: number;
  activeIssues: number;
  resolvedIssues: number;
  upcomingSessions: number;
  occupancyRate: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

// API functions
const hallsApi = {
  // Get halls assigned to current coordinator
  getMyHalls: async (): Promise<{ success: boolean; data: Hall[] }> => {
    const response = await fetch('/api/halls/my-halls', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch halls');
    }

    return response.json();
  },

  // Get issues for coordinator's halls
  getHallIssues: async (params?: {
    hallId?: string;
    status?: string;
    priority?: string;
    type?: string;
  }): Promise<{ success: boolean; data: HallIssue[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.hallId) searchParams.set('hallId', params.hallId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.type) searchParams.set('type', params.type);

    const response = await fetch(`/api/halls/issues?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch hall issues');
    }

    return response.json();
  },

  // Create new issue
  createIssue: async (issueData: CreateIssueData): Promise<{ success: boolean; data: HallIssue }> => {
    const formData = new FormData();
    formData.append('hallId', issueData.hallId);
    formData.append('title', issueData.title);
    formData.append('description', issueData.description);
    formData.append('type', issueData.type);
    formData.append('priority', issueData.priority);

    // Add attachments if any
    if (issueData.attachments && issueData.attachments.length > 0) {
      issueData.attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }

    const response = await fetch('/api/halls/issues', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create issue');
    }

    return response.json();
  },

  // Update issue
  updateIssue: async (issueId: string, updates: UpdateIssueData): Promise<{ success: boolean; data: HallIssue }> => {
    const response = await fetch(`/api/halls/issues/${issueId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update issue');
    }

    return response.json();
  },

  // Delete issue
  deleteIssue: async (issueId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/halls/issues/${issueId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete issue');
    }

    return response.json();
  },

  // Get hall statistics
  getHallStats: async (): Promise<{ success: boolean; data: HallStats }> => {
    const response = await fetch('/api/halls/stats', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch hall statistics');
    }

    return response.json();
  },

  // Get hall details by ID
  getHallById: async (hallId: string): Promise<{ success: boolean; data: Hall }> => {
    const response = await fetch(`/api/halls/${hallId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch hall details');
    }

    return response.json();
  },

  // Update hall information
  updateHall: async (hallId: string, updates: Partial<Hall>): Promise<{ success: boolean; data: Hall }> => {
    const response = await fetch(`/api/halls/${hallId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update hall');
    }

    return response.json();
  },
};

// React Query Hooks

// Get coordinator's halls
export function useMyHalls(id: string | undefined) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['my-halls'],
    queryFn: hallsApi.getMyHalls,
    enabled: !!session?.user && session.user.role === 'HALL_COORDINATOR',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get hall issues
export function useHallIssues(params?: {
  hallId?: string;
  status?: string;
  priority?: string;
  type?: string;
}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['hall-issues', params],
    queryFn: () => hallsApi.getHallIssues(params),
    enabled: !!session?.user && session.user.role === 'HALL_COORDINATOR',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Create new issue
export function useCreateIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: hallsApi.createIssue,
    onSuccess: (data) => {
      // Invalidate and refetch related queries
      queryClient.invalidateQueries({ queryKey: ['hall-issues'] });
      queryClient.invalidateQueries({ queryKey: ['hall-stats'] });
      toast.success('Issue reported successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create issue');
    },
  });
}

// Update issue
export function useUpdateIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ issueId, updates }: { issueId: string; updates: UpdateIssueData }) =>
      hallsApi.updateIssue(issueId, updates),
    onSuccess: (data) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['hall-issues'] });
      queryClient.invalidateQueries({ queryKey: ['hall-stats'] });
      toast.success('Issue updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update issue');
    },
  });
}

// Delete issue
export function useDeleteIssue() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: hallsApi.deleteIssue,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hall-issues'] });
      queryClient.invalidateQueries({ queryKey: ['hall-stats'] });
      toast.success('Issue deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete issue');
    },
  });
}

// Get hall statistics
export function useHallStats() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['hall-stats'],
    queryFn: hallsApi.getHallStats,
    enabled: !!session?.user && session.user.role === 'HALL_COORDINATOR',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Get hall by ID
export function useHall(hallId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['hall', hallId],
    queryFn: () => hallsApi.getHallById(hallId),
    enabled: !!session?.user && !!hallId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Update hall
export function useUpdateHall() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ hallId, updates }: { hallId: string; updates: Partial<Hall> }) =>
      hallsApi.updateHall(hallId, updates),
    onSuccess: (data) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['my-halls'] });
      queryClient.invalidateQueries({ queryKey: ['hall', data.data.id] });
      toast.success('Hall updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update hall');
    },
  });
}

// Helper hooks for filtering issues
export function useOpenIssues(hallId?: string) {
  return useHallIssues({
    hallId,
    status: 'OPEN',
  });
}

export function useCriticalIssues(hallId?: string) {
  return useHallIssues({
    hallId,
    priority: 'CRITICAL',
  });
}

export function useEmergencyIssues(hallId?: string) {
  return useHallIssues({
    hallId,
    type: 'EMERGENCY',
  });
}

// Helper function to get issue status color
export function getIssueStatusColor(status: string) {
  switch (status) {
    case 'OPEN':
      return 'bg-red-100 text-red-800';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    case 'RESOLVED':
      return 'bg-green-100 text-green-800';
    case 'CLOSED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get priority color
export function getIssuePriorityColor(priority: string) {
  switch (priority) {
    case 'CRITICAL':
      return 'bg-red-500 text-white';
    case 'HIGH':
      return 'bg-orange-500 text-white';
    case 'MEDIUM':
      return 'bg-yellow-500 text-white';
    case 'LOW':
      return 'bg-green-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}