// src/hooks/use-faculty.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Types
interface Faculty {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  designation?: string;
  institution?: string;
  specialization?: string;
  bio?: string;
  profileImage?: string;
  experience?: number;
  qualifications?: string[];
  achievements?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  dietaryRequirements?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  userEvents?: Array<{
    eventId: string;
    role: string;
    status: string;
    event: {
      id: string;
      name: string;
      startDate: Date;
      endDate: Date;
    };
  }>;
  sessionSpeakers?: Array<{
    sessionId: string;
    role: string;
    session: {
      id: string;
      title: string;
      startTime: Date;
      endTime: Date;
      hall?: { name: string };
    };
  }>;
  presentations?: Array<{
    id: string;
    title: string;
    filePath: string;
    uploadedAt: Date;
    session: { title: string };
  }>;
  travelDetails?: Array<{
    id: string;
    eventId: string;
    mode: string;
    departureDate: Date;
    arrivalDate: Date;
  }>;
  accommodations?: Array<{
    id: string;
    eventId: string;
    hotelName: string;
    checkIn: Date;
    checkOut: Date;
  }>;
}

interface FacultyInvitation {
  name: string;
  email: string;
  phone?: string;
  designation?: string;
  institution?: string;
  specialization?: string;
  role: 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON';
  sessionId?: string;
  invitationMessage?: string;
}

interface SendInvitationsData {
  eventId: string;
  facultyList: FacultyInvitation[];
}

interface FacultyFilters {
  eventId?: string;
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  institution?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  format?: 'csv' | 'excel';
}

interface UpdateFacultyData {
  name?: string;
  phone?: string;
  designation?: string;
  institution?: string;
  specialization?: string;
  bio?: string;
  experience?: number;
  qualifications?: string[];
  achievements?: string[];
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    website?: string;
  };
  dietaryRequirements?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
}

interface FacultyResponse {
  success: boolean;
  data: {
    faculty: Faculty[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface SingleFacultyResponse {
  success: boolean;
  data: Faculty;
}

interface InvitationResponse {
  success: boolean;
  data: {
    invited: Array<{
      email: string;
      name: string;
      status: string;
      userId: string;
      invitationToken: string;
    }>;
    errors: Array<{
      email: string;
      error: string;
    }>;
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
  };
  message: string;
}

// API functions
const facultyApi = {
  // Get all faculty with filters
  getFaculty: async (filters: FacultyFilters = {}): Promise<FacultyResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/faculty?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch faculty');
    }

    return response.json();
  },

  // Get single faculty by ID
  getFacultyProfile: async (facultyId: string): Promise<SingleFacultyResponse> => {
    const response = await fetch(`/api/faculty/${facultyId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch faculty profile');
    }

    return response.json();
  },

  // Send faculty invitations
  sendInvitations: async (invitationData: SendInvitationsData): Promise<InvitationResponse> => {
    const response = await fetch('/api/faculty', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invitationData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send invitations');
    }

    return response.json();
  },

  // Update faculty profile
  updateFaculty: async (facultyId: string, updates: UpdateFacultyData): Promise<SingleFacultyResponse> => {
    const response = await fetch(`/api/faculty/${facultyId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update faculty profile');
    }

    return response.json();
  },

  // Bulk update faculty
  bulkUpdateFaculty: async (facultyIds: string[], updates: UpdateFacultyData) => {
    const response = await fetch('/api/faculty', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ facultyIds, updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update faculty');
    }

    return response.json();
  },

  // Get faculty statistics
  getFacultyStats: async (eventId?: string) => {
    const url = eventId ? `/api/faculty/stats?eventId=${eventId}` : '/api/faculty/stats';
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch faculty statistics');
    }

    return response.json();
  },

  // Upload faculty CV
  uploadCV: async (facultyId: string, file: File) => {
    const formData = new FormData();
    formData.append('cv', file);

    const response = await fetch(`/api/faculty/${facultyId}/cv`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload CV');
    }

    return response.json();
  },

  // Accept/Decline invitation
  respondToInvitation: async (token: string, response: 'ACCEPT' | 'DECLINE', reason?: string) => {
    const res = await fetch('/api/faculty/invitation/respond', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, response, reason }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Failed to respond to invitation');
    }

    return res.json();
  },

  // ✅ EXPORT FUNCTIONALITY - Export faculty data
  exportFaculty: async (filters: FacultyFilters & { format?: 'csv' | 'excel' } = {}) => {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/faculty/export?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export faculty data');
    }

    const format = filters.format || 'csv';

    if (format === 'excel') {
      // Return JSON data for client-side Excel processing
      return response.json();
    } else {
      // Return blob for CSV download
      return response.blob();
    }
  },
};

// React Query Hooks

// Get faculty hook
export function useFaculty(filters: FacultyFilters = {}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['faculty', filters],
    queryFn: () => facultyApi.getFaculty(filters),
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Get faculty by event
export function useFacultyByEvent(eventId: string, filters: Omit<FacultyFilters, 'eventId'> = {}) {
  return useFaculty({ ...filters, eventId });
}

// Get single faculty profile
export function useFacultyProfile(facultyId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['faculty', facultyId],
    queryFn: () => facultyApi.getFacultyProfile(facultyId),
    enabled: !!session?.user && !!facultyId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get current user's faculty profile
export function useMyFacultyProfile() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['my-faculty-profile'],
    queryFn: () => facultyApi.getFacultyProfile(session?.user?.id || ''),
    enabled: !!session?.user?.id && ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'].includes(session.user.role || ''),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Send invitations mutation
export function useSendInvitations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: facultyApi.sendInvitations,
    onSuccess: (data) => {
      // Invalidate faculty queries
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      
      if (data.data.summary.successful > 0) {
        toast.success(`${data.data.summary.successful} invitations sent successfully!`);
      }
      
      if (data.data.summary.failed > 0) {
        toast.error(`${data.data.summary.failed} invitations failed to send`);
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send invitations');
    },
  });
}

// Update faculty profile mutation
export function useUpdateFaculty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ facultyId, updates }: { facultyId: string; updates: UpdateFacultyData }) =>
      facultyApi.updateFaculty(facultyId, updates),
    onSuccess: (data, variables) => {
      // Update the cache for this specific faculty
      queryClient.setQueryData(['faculty', variables.facultyId], data);
      // Invalidate faculty list
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      // Update my profile if it's the current user
      queryClient.invalidateQueries({ queryKey: ['my-faculty-profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

// Bulk update faculty mutation
export function useBulkUpdateFaculty() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ facultyIds, updates }: { facultyIds: string[]; updates: UpdateFacultyData }) =>
      facultyApi.bulkUpdateFaculty(facultyIds, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      toast.success(`${data.data.updatedCount} faculty profiles updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update faculty profiles');
    },
  });
}

// Upload CV mutation
export function useUploadCV() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ facultyId, file }: { facultyId: string; file: File }) =>
      facultyApi.uploadCV(facultyId, file),
    onSuccess: (data, variables) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['faculty', variables.facultyId] });
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      queryClient.invalidateQueries({ queryKey: ['my-faculty-profile'] });
      toast.success('CV uploaded successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload CV');
    },
  });
}

// Respond to invitation mutation
export function useRespondToInvitation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ token, response, reason }: { token: string; response: 'ACCEPT' | 'DECLINE'; reason?: string }) =>
      facultyApi.respondToInvitation(token, response, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] });
      queryClient.invalidateQueries({ queryKey: ['my-faculty-profile'] });
      
      if (data.response === 'ACCEPT') {
        toast.success('Invitation accepted successfully!');
      } else {
        toast.success('Invitation declined');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to respond to invitation');
    },
  });
}

// Faculty statistics hook
export function useFacultyStats(eventId?: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['faculty-stats', eventId],
    queryFn: () => facultyApi.getFacultyStats(eventId),
    enabled: !!session?.user && ['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || ''),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// ✅ EXPORT FUNCTIONALITY - Export faculty mutation
export function useExportFaculty() {
  return useMutation({
    mutationFn: facultyApi.exportFaculty,
    onSuccess: async (data, variables) => {
      const format = variables?.format || 'csv';
      
      if (format === 'excel') {
        // Handle Excel export using client-side library
        try {
          const { exportToExcel } = await import('@/lib/utils/export');
          
          await exportToExcel({
            faculty: data.data
          }, {
            filename: data.filename,
            includeTimestamp: false
          });
          
          toast.success(`Excel file exported successfully! (${data.count} records)`);
        } catch (error) {
          console.error('Excel export error:', error);
          toast.error('Failed to generate Excel file');
        }
      } else {
        // Handle CSV download
        const blob = data as Blob;
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // Extract filename from response headers or use default
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `faculty-export-${timestamp}.csv`;
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('CSV file downloaded successfully!');
      }
    },
    onError: (error: Error) => {
      console.error('Export error:', error);
      toast.error(error.message || 'Failed to export faculty data');
    },
  });
}

// Helper hooks for specific data
export function useFacultyByInstitution(institution: string, eventId?: string) {
  return useFaculty({ 
    institution, 
    eventId,
    limit: 50 
  });
}

export function useFacultyByRole(role: string, eventId?: string) {
  return useFaculty({ 
    role, 
    eventId,
    limit: 50 
  });
}

export function useFacultySearch(searchTerm: string, eventId?: string) {
  return useFaculty({ 
    search: searchTerm, 
    eventId,
    limit: 20 
  });
}

// Export the new hook for usage
export { useExportFaculty as useFacultyExport };