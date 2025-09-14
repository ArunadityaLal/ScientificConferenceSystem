// src/hooks/use-sessions.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession as useAuthSession } from 'next-auth/react'; // Renamed to avoid conflict
import { toast } from 'react-hot-toast';

// Types
interface Session {
  expectedAttendees: number;
  id: string;
  eventId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  hallId?: string;
  sessionType: 'KEYNOTE' | 'PRESENTATION' | 'PANEL' | 'WORKSHOP' | 'POSTER' | 'BREAK';
  maxParticipants?: number;
  requirements?: string[];
  tags?: string[];
  isBreak: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  event?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
  };
  hall?: {
    id: string;
    name: string;
    capacity: number;
    equipment?: string[];
  };
  speakers?: Array<{
    id: string;
    userId: string;
    role: 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON';
    user: {
      id: string;
      name: string;
      email: string;
      designation?: string;
      institution?: string;
      profileImage?: string;
    };
  }>;
  presentations?: Array<{
    id: string;
    title: string;
    filePath: string;
    uploadedAt: Date;
    user: { name: string };
  }>;
  attendanceRecords?: Array<{
    id: string;
    userId: string;
    timestamp: Date;
    method: 'MANUAL' | 'QR';
  }>;
  _count?: {
    speakers: number;
    presentations: number;
    attendanceRecords: number;
  };
}

interface CreateSessionData {
  eventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  hallId?: string;
  sessionType?: 'KEYNOTE' | 'PRESENTATION' | 'PANEL' | 'WORKSHOP' | 'POSTER' | 'BREAK';
  maxParticipants?: number;
  requirements?: string[];
  tags?: string[];
  isBreak?: boolean;
  speakers?: Array<{
    userId: string;
    role: 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON';
  }>;
}

interface UpdateSessionData {
  title?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  hallId?: string;
  sessionType?: 'KEYNOTE' | 'PRESENTATION' | 'PANEL' | 'WORKSHOP' | 'POSTER' | 'BREAK';
  maxParticipants?: number;
  requirements?: string[];
  tags?: string[];
  isBreak?: boolean;
}

interface SessionFilters {
  eventId?: string;
  hallId?: string;
  date?: string;
  sessionType?: string;
  speakerId?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface SessionResponse {
  success: boolean;
  data: {
    sessions: Session[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface SingleSessionResponse {
  success: boolean;
  data: Session;
}

interface ConflictResponse {
  error: string;
  conflicts: Array<{
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
  }>;
}

// API functions
const sessionsApi = {
  // Get all sessions with filters
  getSessions: async (filters: SessionFilters = {}): Promise<SessionResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/sessions?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch sessions');
    }

    return response.json();
  },

  // Get single session by ID
  getSession: async (sessionId: string): Promise<SingleSessionResponse> => {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch session');
    }

    return response.json();
  },

  // Create new session
  createSession: async (sessionData: CreateSessionData): Promise<SingleSessionResponse> => {
    const response = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sessionData),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 409) {
        // Schedule conflict
        throw { isConflict: true, data: error };
      }
      throw new Error(error.error || 'Failed to create session');
    }

    return response.json();
  },

  // Update session
  updateSession: async (sessionId: string, updates: UpdateSessionData): Promise<SingleSessionResponse> => {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      if (response.status === 409) {
        // Schedule conflict
        throw { isConflict: true, data: error };
      }
      throw new Error(error.error || 'Failed to update session');
    }

    return response.json();
  },

  // Bulk update sessions
  bulkUpdateSessions: async (sessionIds: string[], updates: UpdateSessionData) => {
    const response = await fetch('/api/sessions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIds, updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update sessions');
    }

    return response.json();
  },

  // Delete session
  deleteSession: async (sessionId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete session');
    }

    return response.json();
  },

  // Bulk delete sessions
  bulkDeleteSessions: async (sessionIds: string[]) => {
    const response = await fetch('/api/sessions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete sessions');
    }

    return response.json();
  },

  // Check schedule conflicts
  checkConflicts: async (hallId: string, startTime: string, endTime: string, sessionId?: string) => {
    const searchParams = new URLSearchParams({
      hallId,
      startTime,
      endTime,
      ...(sessionId && { sessionId })
    });

    const response = await fetch(`/api/sessions/conflicts?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check conflicts');
    }

    return response.json();
  },

  // Get session statistics
  getSessionStats: async (eventId: string) => {
    const response = await fetch(`/api/sessions/stats?eventId=${eventId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch session statistics');
    }

    return response.json();
  },

  // Add speaker to session
  addSpeaker: async (sessionId: string, userId: string, role: 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON') => {
    const response = await fetch(`/api/sessions/${sessionId}/speakers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to add speaker');
    }

    return response.json();
  },

  // Remove speaker from session
  removeSpeaker: async (sessionId: string, userId: string) => {
    const response = await fetch(`/api/sessions/${sessionId}/speakers/${userId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove speaker');
    }

    return response.json();
  },
};

// React Query Hooks

// Get sessions hook
export function useSessions(filters: SessionFilters = {}) {
  const { data: authSession } = useAuthSession(); // Fixed: renamed variable
  
  return useQuery({
    queryKey: ['sessions', filters],
    queryFn: () => sessionsApi.getSessions(filters),
    enabled: !!authSession?.user,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Get sessions by event
export function useSessionsByEvent(eventId: string, filters: Omit<SessionFilters, 'eventId'> = {}) {
  return useSessions({ ...filters, eventId });
}

// Get sessions by date
export function useSessionsByDate(date: string | undefined, eventId?: string) {
  return useSessions({ 
    date, 
    eventId,
    sortBy: 'startTime',
    sortOrder: 'asc',
    limit: 50
  });
}

// Get sessions by hall
export function useSessionsByHall(hallId: string, date?: string) {
  return useSessions({ 
    hallId, 
    date,
    sortBy: 'startTime',
    sortOrder: 'asc',
    limit: 50
  });
}

// Get user's sessions (as speaker/moderator)
export function useUserSessions(userId?: string, eventId?: string) {
  return useSessions({ 
    speakerId: userId,
    eventId,
    sortBy: 'startTime',
    sortOrder: 'asc',
    limit: 50
  });
}

// Get single session - FIXED: renamed function to avoid conflict
export function useSessionData(sessionId: string) {
  const { data: authSession } = useAuthSession(); // Fixed: renamed variable
  
  return useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => sessionsApi.getSession(sessionId),
    enabled: !!authSession?.user && !!sessionId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create session mutation
export function useCreateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sessionsApi.createSession,
    onSuccess: (data) => {
      // Invalidate sessions queries
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      // Invalidate event sessions specifically
      queryClient.invalidateQueries({ queryKey: ['sessions', { eventId: data.data.eventId }] });
      toast.success('Session created successfully!');
    },
    onError: (error: any) => {
      if (error.isConflict) {
        toast.error('Schedule conflict detected! Please choose a different time or hall.');
      } else {
        toast.error(error.message || 'Failed to create session');
      }
    },
  });
}

// Update session mutation
export function useUpdateSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, updates }: { sessionId: string; updates: UpdateSessionData }) =>
      sessionsApi.updateSession(sessionId, updates),
    onSuccess: (data, variables) => {
      // Update the cache for this specific session
      queryClient.setQueryData(['session', variables.sessionId], data);
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session updated successfully!');
    },
    onError: (error: any) => {
      if (error.isConflict) {
        toast.error('Schedule conflict detected! Please choose a different time or hall.');
      } else {
        toast.error(error.message || 'Failed to update session');
      }
    },
  });
}

// Bulk update sessions mutation
export function useBulkUpdateSessions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionIds, updates }: { sessionIds: string[]; updates: UpdateSessionData }) =>
      sessionsApi.bulkUpdateSessions(sessionIds, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success(`${data.data.updatedCount} sessions updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update sessions');
    },
  });
}

// Delete session mutation
export function useDeleteSession() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sessionsApi.deleteSession,
    onSuccess: (data, sessionId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: ['session', sessionId] });
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Session deleted successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete session');
    },
  });
}

// Bulk delete sessions mutation
export function useBulkDeleteSessions() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sessionsApi.bulkDeleteSessions,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success(`${data.data.deletedCount} sessions deleted successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete sessions');
    },
  });
}

// Check conflicts mutation
export function useCheckConflicts() {
  return useMutation({
    mutationFn: ({ hallId, startTime, endTime, sessionId }: { 
      hallId: string; 
      startTime: string; 
      endTime: string; 
      sessionId?: string 
    }) => sessionsApi.checkConflicts(hallId, startTime, endTime, sessionId),
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to check conflicts');
    },
  });
}

// Add speaker mutation
export function useAddSpeaker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, userId, role }: { 
      sessionId: string; 
      userId: string; 
      role: 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON' 
    }) => sessionsApi.addSpeaker(sessionId, userId, role),
    onSuccess: (data, variables) => {
      // Update the cache for this specific session
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Speaker added successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to add speaker');
    },
  });
}

// Remove speaker mutation
export function useRemoveSpeaker() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sessionId, userId }: { sessionId: string; userId: string }) =>
      sessionsApi.removeSpeaker(sessionId, userId),
    onSuccess: (data, variables) => {
      // Update the cache for this specific session
      queryClient.invalidateQueries({ queryKey: ['session', variables.sessionId] });
      // Invalidate sessions list
      queryClient.invalidateQueries({ queryKey: ['sessions'] });
      toast.success('Speaker removed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove speaker');
    },
  });
}

// Session statistics hook
export function useSessionStats(eventId: string) {
  const { data: authSession } = useAuthSession(); // Fixed: renamed variable
  
  return useQuery({
    queryKey: ['session-stats', eventId],
    queryFn: () => sessionsApi.getSessionStats(eventId),
    enabled: !!authSession?.user && !!eventId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Helper hooks for real-time data
export function useTodaysSessions(eventId?: string) {
  const today = new Date().toISOString().split('T')[0];
  return useSessionsByDate(today, eventId);
}

export function useUpcomingSessions(eventId?: string) {
  return useSessions({
    eventId,
    sortBy: 'startTime',
    sortOrder: 'asc',
    limit: 10,
    // Could add a filter for future sessions
  });
}

export function useOngoingSessions(eventId?: string) {
  const { data: authSession } = useAuthSession(); // Fixed: renamed variable
  
  return useQuery({
    queryKey: ['ongoing-sessions', eventId],
    queryFn: async () => {
      const now = new Date().toISOString();
      const response = await fetch(`/api/sessions/ongoing?eventId=${eventId}&time=${now}`);
      if (!response.ok) throw new Error('Failed to fetch ongoing sessions');
      return response.json();
    },
    enabled: !!authSession?.user && !!eventId,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}