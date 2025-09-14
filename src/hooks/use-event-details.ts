// src/hooks/use-event-details.ts - TEMPORARY SOLUTION
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';

interface EventFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ✅ TEMPORARY: Individual hooks for missing exports
export function useEventSessions(eventId: string, filters: EventFilters = {}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['event-sessions', eventId, filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('eventId', eventId);
      
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
        throw new Error(error.error || 'Failed to fetch event sessions');
      }

      return response.json();
    },
    enabled: !!session?.user && !!eventId,
    staleTime: 3 * 60 * 1000, // 3 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useEventRegistrations(eventId: string, filters: EventFilters = {}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['event-registrations', eventId, filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('eventId', eventId);
      
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
        throw new Error(error.error || 'Failed to fetch event registrations');
      }

      return response.json();
    },
    enabled: !!session?.user && !!eventId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

export function useEventFaculty(eventId: string, filters: EventFilters = {}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['event-faculty', eventId, filters],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      searchParams.append('eventId', eventId);
      
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
        throw new Error(error.error || 'Failed to fetch event faculty');
      }

      return response.json();
    },
    enabled: !!session?.user && !!eventId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}