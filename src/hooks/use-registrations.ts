// src/hooks/use-registrations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Types
interface Registration {
  certificateIssued: unknown;
  id: string;
  userId: string;
  eventId: string;
  registrationNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WAITLIST';
  registrationData: {
    participantType: 'DELEGATE' | 'SPEAKER' | 'SPONSOR' | 'VOLUNTEER';
    institution?: string;
    designation?: string;
    experience?: number;
    specialization?: string;
    dietaryRequirements?: string;
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    sessionPreferences?: string[];
    accommodationRequired: boolean;
    transportRequired: boolean;
    certificateRequired: boolean;
    additionalRequirements?: string;
    consentForPhotography: boolean;
    consentForMarketing: boolean;
  };
  paymentInfo?: {
    amount?: number;
    currency: string;
    paymentMethod?: 'ONLINE' | 'OFFLINE' | 'BANK_TRANSFER' | 'CHEQUE' | 'FREE';
    transactionId?: string;
    paymentDate?: Date;
  };
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  user?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    role: string;
    profileImage?: string;
  };
  event?: {
    id: string;
    name: string;
    startDate: Date;
    endDate: Date;
    location: string;
  };
  reviewedByUser?: {
    id: string;
    name: string;
  };
}

interface CreateRegistrationData {
  eventId: string;
  userId?: string;
  registrationData: {
    participantType?: 'DELEGATE' | 'SPEAKER' | 'SPONSOR' | 'VOLUNTEER';
    institution?: string;
    designation?: string;
    experience?: number;
    specialization?: string;
    dietaryRequirements?: string;
    emergencyContact?: {
      name?: string;
      phone?: string;
      relationship?: string;
    };
    sessionPreferences?: string[];
    accommodationRequired?: boolean;
    transportRequired?: boolean;
    certificateRequired?: boolean;
    additionalRequirements?: string;
    consentForPhotography?: boolean;
    consentForMarketing?: boolean;
  };
  paymentInfo?: {
    amount?: number;
    currency?: string;
    paymentMethod?: 'ONLINE' | 'OFFLINE' | 'BANK_TRANSFER' | 'CHEQUE' | 'FREE';
    transactionId?: string;
    paymentDate?: string;
  };
}

interface UpdateRegistrationData {
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED' | 'WAITLIST';
  registrationData?: Partial<CreateRegistrationData['registrationData']>;
  paymentInfo?: Partial<CreateRegistrationData['paymentInfo']>;
  reviewNotes?: string;
}

interface RegistrationFilters {
  eventId?: string;
  status?: string;
  participantType?: string;
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface RegistrationResponse {
  success: boolean;
  data: {
    registrations: Registration[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface SingleRegistrationResponse {
  success: boolean;
  data: Registration;
}

// API functions
const registrationsApi = {
  // Get all registrations with filters
  getRegistrations: async (filters: RegistrationFilters = {}): Promise<RegistrationResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(`/api/registrations?${searchParams.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch registrations');
    }

    return response.json();
  },

  // Get single registration by ID
  getRegistration: async (registrationId: string): Promise<SingleRegistrationResponse> => {
    const response = await fetch(`/api/registrations/${registrationId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch registration');
    }

    return response.json();
  },

  // Create new registration
  createRegistration: async (registrationData: CreateRegistrationData): Promise<SingleRegistrationResponse> => {
    const response = await fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registrationData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create registration');
    }

    return response.json();
  },

  // Update registration
  updateRegistration: async (registrationId: string, updates: UpdateRegistrationData): Promise<SingleRegistrationResponse> => {
    const response = await fetch(`/api/registrations/${registrationId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update registration');
    }

    return response.json();
  },

  // Bulk update registrations
  bulkUpdateRegistrations: async (registrationIds: string[], updates: UpdateRegistrationData) => {
    const response = await fetch('/api/registrations', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationIds, updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update registrations');
    }

    return response.json();
  },

  // Cancel registration
  cancelRegistration: async (registrationId: string, reason?: string) => {
    const response = await fetch(`/api/registrations/${registrationId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel registration');
    }

    return response.json();
  },

  // Bulk cancel registrations
  bulkCancelRegistrations: async (registrationIds: string[], reason?: string) => {
    const response = await fetch('/api/registrations', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ registrationIds, reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel registrations');
    }

    return response.json();
  },

  // Get registration statistics
  getRegistrationStats: async (eventId?: string) => {
    const url = eventId ? `/api/registrations/stats?eventId=${eventId}` : '/api/registrations/stats';
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch registration statistics');
    }

    return response.json();
  },

  // Check registration eligibility
  checkEligibility: async (eventId: string) => {
    const response = await fetch(`/api/registrations/eligibility?eventId=${eventId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to check eligibility');
    }

    return response.json();
  },

  // Export registrations
  exportRegistrations: async (eventId: string, format: 'CSV' | 'EXCEL' | 'PDF' = 'CSV') => {
    const response = await fetch(`/api/registrations/export?eventId=${eventId}&format=${format}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to export registrations');
    }

    // Return blob for download
    return response.blob();
  },
};

// React Query Hooks

// Get registrations hook
export function useRegistrations(filters: RegistrationFilters = {}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['registrations', filters],
    queryFn: () => registrationsApi.getRegistrations(filters),
    enabled: !!session?.user,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

// Get registrations by event
export function useRegistrationsByEvent(eventId: string, filters: Omit<RegistrationFilters, 'eventId'> = {}) {
  return useRegistrations({ ...filters, eventId });
}

// Get user's registrations
export function useMyRegistrations() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['my-registrations'],
    queryFn: () => registrationsApi.getRegistrations({}), // API will filter by user automatically
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get single registration
export function useRegistration(registrationId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['registration', registrationId],
    queryFn: () => registrationsApi.getRegistration(registrationId),
    enabled: !!session?.user && !!registrationId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create registration mutation
export function useCreateRegistration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: registrationsApi.createRegistration,
    onSuccess: (data) => {
      // Invalidate registrations queries
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      // Invalidate event registrations specifically
      queryClient.invalidateQueries({ queryKey: ['registrations', { eventId: data.data.eventId }] });
      
      if (data.data.status === 'WAITLIST') {
        toast.success('Registration added to waitlist successfully!');
      } else {
        toast.success('Registration submitted successfully!');
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create registration');
    },
  });
}

// Update registration mutation
export function useUpdateRegistration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ registrationId, updates }: { registrationId: string; updates: UpdateRegistrationData }) =>
      registrationsApi.updateRegistration(registrationId, updates),
    onSuccess: (data, variables) => {
      // Update the cache for this specific registration
      queryClient.setQueryData(['registration', variables.registrationId], data);
      // Invalidate registrations list
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      toast.success('Registration updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update registration');
    },
  });
}

// Bulk update registrations mutation
export function useBulkUpdateRegistrations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ registrationIds, updates }: { registrationIds: string[]; updates: UpdateRegistrationData }) =>
      registrationsApi.bulkUpdateRegistrations(registrationIds, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast.success(`${data.data.updatedCount} registrations updated successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update registrations');
    },
  });
}

// Approve registrations mutation
export function useApproveRegistrations() {
  return useBulkUpdateRegistrations();
}

// Reject registrations mutation
export function useRejectRegistrations() {
  return useBulkUpdateRegistrations();
}

// Cancel registration mutation
export function useCancelRegistration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ registrationId, reason }: { registrationId: string; reason?: string }) =>
      registrationsApi.cancelRegistration(registrationId, reason),
    onSuccess: (data, variables) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['registration', variables.registrationId] });
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      queryClient.invalidateQueries({ queryKey: ['my-registrations'] });
      toast.success('Registration cancelled successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel registration');
    },
  });
}

// Bulk cancel registrations mutation
export function useBulkCancelRegistrations() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ registrationIds, reason }: { registrationIds: string[]; reason?: string }) =>
      registrationsApi.bulkCancelRegistrations(registrationIds, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      toast.success(`${data.data.cancelledCount} registrations cancelled successfully!`);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel registrations');
    },
  });
}

// Registration statistics hook
export function useRegistrationStats(eventId?: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['registration-stats', eventId],
    queryFn: () => registrationsApi.getRegistrationStats(eventId),
    enabled: !!session?.user && ['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || ''),
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Check registration eligibility hook
export function useRegistrationEligibility(eventId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['registration-eligibility', eventId],
    queryFn: () => registrationsApi.checkEligibility(eventId),
    enabled: !!session?.user && !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Export registrations mutation
export function useExportRegistrations() {
  return useMutation({
    mutationFn: ({ eventId, format }: { eventId: string; format?: 'CSV' | 'EXCEL' | 'PDF' }) =>
      registrationsApi.exportRegistrations(eventId, format),
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `registrations-${variables.eventId}.${variables.format?.toLowerCase() || 'csv'}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.success('Registrations exported successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to export registrations');
    },
  });
}

// Helper hooks for specific filters
export function usePendingRegistrations(eventId?: string) {
  return useRegistrations({ 
    status: 'PENDING', 
    eventId,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 50
  });
}

export function useApprovedRegistrations(eventId?: string) {
  return useRegistrations({ 
    status: 'APPROVED', 
    eventId,
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 50
  });
}

export function useWaitlistRegistrations(eventId?: string) {
  return useRegistrations({ 
    status: 'WAITLIST', 
    eventId,
    sortBy: 'createdAt',
    sortOrder: 'asc',
    limit: 50
  });
}

export function useRegistrationsByType(participantType: string, eventId?: string) {
  return useRegistrations({ 
    participantType, 
    eventId,
    status: 'APPROVED',
    sortBy: 'createdAt',
    sortOrder: 'desc',
    limit: 50
  });
}

// Check if user is registered for an event
export function useIsUserRegistered(eventId: string) {
  const { data: session } = useSession();
  const { data: myRegistrations } = useMyRegistrations();
  
  return {
    isRegistered: myRegistrations?.data?.registrations?.some(
      reg => reg.eventId === eventId && reg.status !== 'CANCELLED'
    ) || false,
    registration: myRegistrations?.data?.registrations?.find(
      reg => reg.eventId === eventId && reg.status !== 'CANCELLED'
    )
  };
}