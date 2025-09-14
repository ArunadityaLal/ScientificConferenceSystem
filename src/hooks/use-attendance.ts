// src/hooks/use-attendance.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Types
interface AttendanceRecord {
  id: string;
  sessionId: string;
  userId: string;
  markedBy: string;
  method: 'MANUAL' | 'QR';
  timestamp: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
    institution?: string;
    profileImage?: string;
  };
  session?: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    event?: { name: string };
  };
  markedByUser?: {
    id: string;
    name: string;
  };
}

interface MarkAttendanceData {
  sessionId: string;
  userId: string;
  method?: 'MANUAL' | 'QR';
}

interface BulkMarkAttendanceData {
  sessionId: string;
  userIds: string[];
  method?: 'MANUAL' | 'QR';
}

interface AttendanceFilters {
  sessionId?: string;
  eventId?: string;
  userId?: string;
  date?: string;
  method?: 'MANUAL' | 'QR';
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface AttendanceResponse {
  success: boolean;
  data: {
    attendanceRecords: AttendanceRecord[];
    pagination?: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface AttendanceStatsResponse {
  success: boolean;
  data: {
    totalSessions: number;
    attendedSessions: number;
    attendanceRate: number;
    recentAttendance: AttendanceRecord[];
  };
}

// API functions
const attendanceApi = {
  // Get attendance records with filters
  getAttendance: async (filters: AttendanceFilters = {}): Promise<AttendanceResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/attendance?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch attendance records');
    }

    return response.json();
  },

  // Get session attendance
  getSessionAttendance: async (sessionId: string): Promise<AttendanceResponse> => {
    const response = await fetch(`/api/attendance/session/${sessionId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch session attendance');
    }

    return response.json();
  },

  // Get user attendance summary
  getUserAttendance: async (userId: string, eventId?: string): Promise<AttendanceStatsResponse> => {
    const url = eventId 
      ? `/api/attendance/user/${userId}?eventId=${eventId}`
      : `/api/attendance/user/${userId}`;
      
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch user attendance');
    }

    return response.json();
  },

  // Mark attendance
  markAttendance: async (data: MarkAttendanceData) => {
    const response = await fetch('/api/attendance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark attendance');
    }

    return response.json();
  },

  // Bulk mark attendance
  bulkMarkAttendance: async (data: BulkMarkAttendanceData) => {
    const response = await fetch('/api/attendance/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark bulk attendance');
    }

    return response.json();
  },

  // Mark attendance via QR code
  markAttendanceQR: async (qrToken: string) => {
    const response = await fetch('/api/attendance/qr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrToken }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark attendance via QR');
    }

    return response.json();
  },

  // Generate QR code for session
  generateQR: async (sessionId: string) => {
    const response = await fetch(`/api/attendance/qr/generate/${sessionId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate QR code');
    }

    return response.json();
  },

  // Remove attendance
  removeAttendance: async (attendanceId: string) => {
    const response = await fetch(`/api/attendance/${attendanceId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to remove attendance');
    }

    return response.json();
  },

  // Get attendance statistics
  getAttendanceStats: async (eventId?: string) => {
    const url = eventId ? `/api/attendance/stats?eventId=${eventId}` : '/api/attendance/stats';
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch attendance statistics');
    }

    return response.json();
  },

  // Export attendance
  exportAttendance: async (sessionId: string, format: 'CSV' | 'EXCEL' | 'PDF' = 'CSV') => {
    const response = await fetch(`/api/attendance/export/${sessionId}?format=${format}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export attendance');
    }

    return response.blob();
  },
};

// React Query Hooks

// Get attendance records hook
export function useAttendance(filters: AttendanceFilters = {}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => attendanceApi.getAttendance(filters),
    enabled: !!session?.user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

// Get session attendance hook
export function useSessionAttendance(sessionId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['session-attendance', sessionId],
    queryFn: () => attendanceApi.getSessionAttendance(sessionId),
    enabled: !!session?.user && !!sessionId,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds for real-time updates
  });
}

// Get user attendance summary
export function useUserAttendance(userId?: string, eventId?: string) {
  const { data: session } = useSession();
  const targetUserId = userId || session?.user?.id;
  
  return useQuery({
    queryKey: ['user-attendance', targetUserId, eventId],
    queryFn: () => attendanceApi.getUserAttendance(targetUserId || '', eventId),
    enabled: !!session?.user && !!targetUserId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get my attendance summary
export function useMyAttendance(eventId?: string) {
  const { data: session } = useSession();
  return useUserAttendance(session?.user?.id, eventId);
}

// Mark attendance mutation
export function useMarkAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceApi.markAttendance,
    onSuccess: (data, variables) => {
      // Invalidate session attendance
      queryClient.invalidateQueries({ queryKey: ['session-attendance', variables.sessionId] });
      // Invalidate user attendance
      queryClient.invalidateQueries({ queryKey: ['user-attendance', variables.userId] });
      // Invalidate general attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      
      toast.success(`Attendance marked for ${data.data.user?.name || 'user'}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark attendance');
    },
  });
}

// Bulk mark attendance mutation
export function useBulkMarkAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceApi.bulkMarkAttendance,
    onSuccess: (data, variables) => {
      // Invalidate session attendance
      queryClient.invalidateQueries({ queryKey: ['session-attendance', variables.sessionId] });
      // Invalidate user attendance for all affected users
      variables.userIds.forEach(userId => {
        queryClient.invalidateQueries({ queryKey: ['user-attendance', userId] });
      });
      // Invalidate general attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      
      toast.success(`Attendance marked for ${data.data.markedCount} participants`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark bulk attendance');
    },
  });
}

// Mark attendance via QR mutation
export function useMarkAttendanceQR() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceApi.markAttendanceQR,
    onSuccess: (data) => {
      // Invalidate session attendance
      queryClient.invalidateQueries({ queryKey: ['session-attendance', data.data.sessionId] });
      // Invalidate user attendance
      queryClient.invalidateQueries({ queryKey: ['user-attendance'] });
      // Invalidate general attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      
      toast.success(`Attendance marked via QR code for ${data.data.session?.title || 'session'}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark attendance via QR code');
    },
  });
}

// Generate QR code mutation
export function useGenerateQR() {
  return useMutation({
    mutationFn: attendanceApi.generateQR,
    onSuccess: (data) => {
      toast.success('QR code generated successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to generate QR code');
    },
  });
}

// Remove attendance mutation
export function useRemoveAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: attendanceApi.removeAttendance,
    onSuccess: (data, attendanceId) => {
      // Invalidate all attendance queries
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['session-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['user-attendance'] });
      
      toast.success('Attendance record removed successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to remove attendance record');
    },
  });
}

// Export attendance mutation
export function useExportAttendance() {
  return useMutation({
    mutationFn: ({ sessionId, format }: { sessionId: string; format?: 'CSV' | 'EXCEL' | 'PDF' }) =>
      attendanceApi.exportAttendance(sessionId, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-${variables.sessionId}.${variables.format?.toLowerCase() || 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Attendance exported successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export attendance');
    },
  });
}

// Attendance statistics hook
export function useAttendanceStats(eventId?: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['attendance-stats', eventId],
    queryFn: () => attendanceApi.getAttendanceStats(eventId),
    enabled: !!session?.user && ['ORGANIZER', 'EVENT_MANAGER', 'HALL_COORDINATOR'].includes(session.user.role || ''),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Helper hooks for specific use cases

// Check if user has attended a session
export function useHasAttended(sessionId: string, userId?: string) {
  const { data: session } = useSession();
  const targetUserId = userId || session?.user?.id;
  
  return useQuery({
    queryKey: ['has-attended', sessionId, targetUserId],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/check?sessionId=${sessionId}&userId=${targetUserId}`);
      if (!response.ok) throw new Error('Failed to check attendance');
      return response.json();
    },
    enabled: !!session?.user && !!sessionId && !!targetUserId,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// Get attendance by date range
export function useAttendanceByDateRange(startDate: string, endDate: string, eventId?: string) {
  return useQuery({
    queryKey: ['attendance-date-range', startDate, endDate, eventId],
    queryFn: async () => {
      const params = new URLSearchParams({
        startDate,
        endDate,
        ...(eventId && { eventId })
      });
      const response = await fetch(`/api/attendance/date-range?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch attendance by date range');
      return response.json();
    },
    enabled: !!startDate && !!endDate,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Get real-time attendance count for a session
export function useRealtimeAttendanceCount(sessionId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['realtime-attendance-count', sessionId],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/count/${sessionId}`);
      if (!response.ok) throw new Error('Failed to fetch attendance count');
      return response.json();
    },
    enabled: !!session?.user && !!sessionId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 10 * 1000, // Refetch every 10 seconds for real-time count
  });
}

// Get attendance trends for an event
export function useAttendanceTrends(eventId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['attendance-trends', eventId],
    queryFn: async () => {
      const response = await fetch(`/api/attendance/trends/${eventId}`);
      if (!response.ok) throw new Error('Failed to fetch attendance trends');
      return response.json();
    },
    enabled: !!session?.user && !!eventId && ['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || ''),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}