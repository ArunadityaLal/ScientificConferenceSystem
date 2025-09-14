// src/hooks/use-volunteer.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Types
interface VolunteerTask {
  id: string;
  title: string;
  description: string;
  location: string;
  taskType: 'SETUP' | 'REGISTRATION' | 'ASSISTANCE' | 'CLEANUP' | 'SECURITY' | 'TECHNICAL' | 'CATERING' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startTime: Date;
  endTime: Date;
  requiredVolunteers: number;
  assignedVolunteers: number;
  eventId?: string;
  sessionId?: string;
  assignedTo?: string[];
  instructions?: string;
  equipmentNeeded?: string[];
  skills?: string[];
  createdAt: Date;
  updatedAt: Date;
  event?: {
    id: string;
    name: string;
  };
  session?: {
    id: string;
    title: string;
  };
}

interface VolunteerShift {
  id: string;
  volunteerId: string;
  taskId: string;
  startTime: Date;
  endTime: Date;
  status: 'SCHEDULED' | 'CHECKED_IN' | 'ACTIVE' | 'COMPLETED' | 'ABSENT' | 'CANCELLED';
  checkInTime?: Date;
  checkOutTime?: Date;
  hoursWorked?: number;
  notes?: string;
  rating?: number;
  feedback?: string;
  createdAt: Date;
  updatedAt: Date;
  task?: VolunteerTask;
  volunteer?: {
    id: string;
    name: string;
    email: string;
  };
}

interface TaskCompletion {
  taskId: string;
  completedAt: Date;
  hoursSpent: number;
  feedback?: string;
  rating?: number;
  issues?: string;
  photos?: string[];
}

interface CreateTaskData {
  title: string;
  description: string;
  location: string;
  taskType: 'SETUP' | 'REGISTRATION' | 'ASSISTANCE' | 'CLEANUP' | 'SECURITY' | 'TECHNICAL' | 'CATERING' | 'OTHER';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  startTime: Date;
  endTime: Date;
  requiredVolunteers: number;
  eventId?: string;
  sessionId?: string;
  instructions?: string;
  equipmentNeeded?: string[];
  skills?: string[];
}

interface UpdateTaskData {
  title?: string;
  description?: string;
  location?: string;
  taskType?: 'SETUP' | 'REGISTRATION' | 'ASSISTANCE' | 'CLEANUP' | 'SECURITY' | 'TECHNICAL' | 'CATERING' | 'OTHER';
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status?: 'ASSIGNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  startTime?: Date;
  endTime?: Date;
  requiredVolunteers?: number;
  instructions?: string;
  equipmentNeeded?: string[];
  skills?: string[];
}

interface VolunteerStats {
  totalTasks: number;
  completedTasks: number;
  totalHours: number;
  upcomingShifts: number;
  averageRating: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

// API functions
const volunteerApi = {
  // Get all available volunteer tasks
  getVolunteerTasks: async (params?: {
    eventId?: string;
    taskType?: string;
    priority?: string;
    status?: string;
  }): Promise<{ success: boolean; data: VolunteerTask[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.eventId) searchParams.set('eventId', params.eventId);
    if (params?.taskType) searchParams.set('taskType', params.taskType);
    if (params?.priority) searchParams.set('priority', params.priority);
    if (params?.status) searchParams.set('status', params.status);

    const response = await fetch(`/api/volunteer/tasks?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch volunteer tasks');
    }

    return response.json();
  },

  // Get current user's shifts
  getMyShifts: async (): Promise<{ success: boolean; data: VolunteerShift[] }> => {
    const response = await fetch('/api/volunteer/my-shifts', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch shifts');
    }

    return response.json();
  },

  // Apply for a volunteer task
  applyForTask: async (taskId: string): Promise<{ success: boolean; data: VolunteerShift }> => {
    const response = await fetch(`/api/volunteer/tasks/${taskId}/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to apply for task');
    }

    return response.json();
  },

  // Check in to a shift
  checkInShift: async (shiftId: string): Promise<{ success: boolean; data: VolunteerShift }> => {
    const response = await fetch(`/api/volunteer/shifts/${shiftId}/checkin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check in');
    }

    return response.json();
  },

  // Check out from a shift
  checkOutShift: async (shiftId: string): Promise<{ success: boolean; data: VolunteerShift }> => {
    const response = await fetch(`/api/volunteer/shifts/${shiftId}/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check out');
    }

    return response.json();
  },

  // Complete a task
  completeTask: async (taskId: string, completion: TaskCompletion): Promise<{ success: boolean; data: VolunteerTask }> => {
    const response = await fetch(`/api/volunteer/tasks/${taskId}/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(completion),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to complete task');
    }

    return response.json();
  },

  // Cancel shift
  cancelShift: async (shiftId: string, reason?: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/volunteer/shifts/${shiftId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel shift');
    }

    return response.json();
  },

  // Get volunteer statistics
  getVolunteerStats: async (): Promise<{ success: boolean; data: VolunteerStats }> => {
    const response = await fetch('/api/volunteer/stats', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch volunteer statistics');
    }

    return response.json();
  },

  // Update volunteer availability
  updateAvailability: async (availability: Array<{
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }>): Promise<{ success: boolean }> => {
    const response = await fetch('/api/volunteer/availability', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ availability }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update availability');
    }

    return response.json();
  },

  // Submit task feedback
  submitTaskFeedback: async (taskId: string, feedback: {
    rating: number;
    comment?: string;
    suggestions?: string;
  }): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/volunteer/tasks/${taskId}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to submit feedback');
    }

    return response.json();
  },
};

// React Query Hooks

// Get volunteer tasks
export function useVolunteerTasks(params?: {
  eventId?: string;
  taskType?: string;
  priority?: string;
  status?: string;
}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['volunteer-tasks', params],
    queryFn: () => volunteerApi.getVolunteerTasks(params),
    enabled: !!session?.user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Get user's shifts
export function useMyShifts() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['my-shifts'],
    queryFn: volunteerApi.getMyShifts,
    enabled: !!session?.user && session.user.role === 'VOLUNTEER',
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

// Apply for task
export function useApplyForTask() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: volunteerApi.applyForTask,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
      toast.success('Successfully applied for task!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to apply for task');
    },
  });
}

// Check in to shift
export function useCheckInShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: volunteerApi.checkInShift,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
      toast.success('Checked in successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check in');
    },
  });
}

// Check out from shift
export function useCheckOutShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: volunteerApi.checkOutShift,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
      toast.success('Checked out successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check out');
    },
  });
}

// Complete task
export function useTaskCompletion() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, completion }: { taskId: string; completion: TaskCompletion }) =>
      volunteerApi.completeTask(taskId, completion),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
      toast.success('Task completed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to complete task');
    },
  });
}

// Cancel shift
export function useCancelShift() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ shiftId, reason }: { shiftId: string; reason?: string }) =>
      volunteerApi.cancelShift(shiftId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      queryClient.invalidateQueries({ queryKey: ['volunteer-tasks'] });
      toast.success('Shift cancelled successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel shift');
    },
  });
}

// Get volunteer statistics
export function useVolunteerStats() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['volunteer-stats'],
    queryFn: volunteerApi.getVolunteerStats,
    enabled: !!session?.user && session.user.role === 'VOLUNTEER',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Update availability
export function useUpdateAvailability() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: volunteerApi.updateAvailability,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['volunteer-stats'] });
      toast.success('Availability updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update availability');
    },
  });
}

// Submit task feedback
export function useSubmitTaskFeedback() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ taskId, feedback }: { taskId: string; feedback: { rating: number; comment?: string; suggestions?: string } }) =>
      volunteerApi.submitTaskFeedback(taskId, feedback),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shifts'] });
      toast.success('Feedback submitted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to submit feedback');
    },
  });
}

// Helper hooks for filtering tasks
export function useAvailableTasks() {
  return useVolunteerTasks({
    status: 'ASSIGNED',
  });
}

export function useMyActiveTasks() {
  return useQuery({
    queryKey: ['my-shifts', 'active'],
    queryFn: async () => {
      const result = await volunteerApi.getMyShifts();
      return {
        ...result,
        data: result.data.filter(s => ['SCHEDULED', 'CHECKED_IN', 'ACTIVE'].includes(s.status))
      };
    },
    staleTime: 1 * 60 * 1000,
  });
}

export function useUpcomingShifts() {
  return useQuery({
    queryKey: ['my-shifts', 'upcoming'],
    queryFn: async () => {
      const result = await volunteerApi.getMyShifts();
      const now = new Date();
      return {
        ...result,
        data: result.data.filter(s => 
          s.status === 'SCHEDULED' && new Date(s.startTime) > now
        )
      };
    },
    staleTime: 1 * 60 * 1000,
  });
}

// Helper function to get task status color
export function getTaskStatusColor(status: string) {
  switch (status) {
    case 'ASSIGNED':
      return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':
      return 'bg-yellow-100 text-yellow-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get task priority color
export function getTaskPriorityColor(priority: string) {
  switch (priority) {
    case 'URGENT':
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

// Helper function to get shift status color
export function getShiftStatusColor(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800';
    case 'CHECKED_IN':
      return 'bg-yellow-100 text-yellow-800';
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'COMPLETED':
      return 'bg-green-500 text-white';
    case 'ABSENT':
      return 'bg-red-100 text-red-800';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}