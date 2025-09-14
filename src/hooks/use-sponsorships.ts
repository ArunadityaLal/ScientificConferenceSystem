// src/hooks/use-sponsorships.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Types
interface SponsorshipPackage {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  duration: string; // "1_MONTH", "3_MONTHS", "6_MONTHS", "1_YEAR"
  benefits: string[];
  visibility: 'BANNER' | 'LOGO' | 'BOOTH' | 'SESSION' | 'NETWORKING';
  maxSponsors: number;
  currentSponsors: number;
  isActive: boolean;
  eventId?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Sponsorship {
  id: string;
  sponsorId: string;
  packageId: string;
  eventId?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED';
  startDate: Date;
  endDate: Date;
  amount: number;
  currency: string;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  visibilitySettings?: {
    showLogo: boolean;
    showBanner: boolean;
    showBooth: boolean;
    customMessage?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  package?: SponsorshipPackage;
  sponsor?: {
    id: string;
    name: string;
    email: string;
    company?: string;
  };
}

interface CreateSponsorshipData {
  packageId: string;
  eventId?: string;
  visibilitySettings?: {
    showLogo: boolean;
    showBanner: boolean;
    showBooth: boolean;
    customMessage?: string;
  };
}

interface UpdateSponsorshipData {
  visibilitySettings?: {
    showLogo: boolean;
    showBanner: boolean;
    showBooth: boolean;
    customMessage?: string;
  };
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'EXPIRED';
}

interface SponsorshipVisibility {
  sponsorshipId: string;
  showLogo: boolean;
  showBanner: boolean;
  showBooth: boolean;
  customMessage?: string;
  logoUrl?: string;
  bannerUrl?: string;
  boothDetails?: string;
}

interface SponsorshipStats {
  totalSponsorships: number;
  activeSponsorships: number;
  totalSpent: number;
  upcomingRenewals: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

// API functions
const sponsorshipsApi = {
  // Get all available sponsorship packages
  getSponsorshipPackages: async (eventId?: string): Promise<{ success: boolean; data: SponsorshipPackage[] }> => {
    const searchParams = new URLSearchParams();
    if (eventId) searchParams.set('eventId', eventId);

    const response = await fetch(`/api/sponsorships/packages?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch sponsorship packages');
    }

    return response.json();
  },

  // Get current user's sponsorships
  getMySponsorships: async (): Promise<{ success: boolean; data: Sponsorship[] }> => {
    const response = await fetch('/api/sponsorships/my-sponsorships', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch sponsorships');
    }

    return response.json();
  },

  // Create new sponsorship
  createSponsorship: async (sponsorshipData: CreateSponsorshipData): Promise<{ success: boolean; data: Sponsorship }> => {
    const response = await fetch('/api/sponsorships', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sponsorshipData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create sponsorship');
    }

    return response.json();
  },

  // Update sponsorship
  updateSponsorship: async (sponsorshipId: string, updates: UpdateSponsorshipData): Promise<{ success: boolean; data: Sponsorship }> => {
    const response = await fetch(`/api/sponsorships/${sponsorshipId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update sponsorship');
    }

    return response.json();
  },

  // Get sponsorship visibility settings
  getSponsorshipVisibility: async (sponsorshipId: string): Promise<{ success: boolean; data: SponsorshipVisibility }> => {
    const response = await fetch(`/api/sponsorships/${sponsorshipId}/visibility`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch visibility settings');
    }

    return response.json();
  },

  // Update sponsorship visibility
  updateSponsorshipVisibility: async (sponsorshipId: string, visibility: Partial<SponsorshipVisibility>): Promise<{ success: boolean; data: SponsorshipVisibility }> => {
    const response = await fetch(`/api/sponsorships/${sponsorshipId}/visibility`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(visibility),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update visibility settings');
    }

    return response.json();
  },

  // Cancel sponsorship
  cancelSponsorship: async (sponsorshipId: string): Promise<{ success: boolean }> => {
    const response = await fetch(`/api/sponsorships/${sponsorshipId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel sponsorship');
    }

    return response.json();
  },

  // Renew sponsorship
  renewSponsorship: async (sponsorshipId: string): Promise<{ success: boolean; data: Sponsorship }> => {
    const response = await fetch(`/api/sponsorships/${sponsorshipId}/renew`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to renew sponsorship');
    }

    return response.json();
  },

  // Get sponsorship statistics
  getSponsorshipStats: async (): Promise<{ success: boolean; data: SponsorshipStats }> => {
    const response = await fetch('/api/sponsorships/stats', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch sponsorship statistics');
    }

    return response.json();
  },

  // Upload sponsor assets (logos, banners)
  uploadSponsorAsset: async (sponsorshipId: string, file: File, assetType: 'logo' | 'banner'): Promise<{ success: boolean; data: { url: string } }> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('assetType', assetType);

    const response = await fetch(`/api/sponsorships/${sponsorshipId}/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload asset');
    }

    return response.json();
  },
};

// React Query Hooks

// Get sponsorship packages
export function useSponsorshipPackages(eventId?: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['sponsorship-packages', eventId],
    queryFn: () => sponsorshipsApi.getSponsorshipPackages(eventId),
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Get user's sponsorships
export function useMySponsorships() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['my-sponsorships'],
    queryFn: sponsorshipsApi.getMySponsorships,
    enabled: !!session?.user && session.user.role === 'SPONSOR',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Create sponsorship
export function useCreateSponsorship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sponsorshipsApi.createSponsorship,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-sponsorships'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorship-packages'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorship-stats'] });
      toast.success('Sponsorship created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create sponsorship');
    },
  });
}

// Update sponsorship
export function useUpdateSponsorship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sponsorshipId, updates }: { sponsorshipId: string; updates: UpdateSponsorshipData }) =>
      sponsorshipsApi.updateSponsorship(sponsorshipId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-sponsorships'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorship-stats'] });
      toast.success('Sponsorship updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update sponsorship');
    },
  });
}

// Get sponsorship visibility
export function useSponsorshipVisibility(sponsorshipId: string) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['sponsorship-visibility', sponsorshipId],
    queryFn: () => sponsorshipsApi.getSponsorshipVisibility(sponsorshipId),
    enabled: !!session?.user && !!sponsorshipId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Update sponsorship visibility
export function useUpdateSponsorshipVisibility() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sponsorshipId, visibility }: { sponsorshipId: string; visibility: Partial<SponsorshipVisibility> }) =>
      sponsorshipsApi.updateSponsorshipVisibility(sponsorshipId, visibility),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsorship-visibility', variables.sponsorshipId] });
      queryClient.invalidateQueries({ queryKey: ['my-sponsorships'] });
      toast.success('Visibility settings updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update visibility settings');
    },
  });
}

// Cancel sponsorship
export function useCancelSponsorship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sponsorshipsApi.cancelSponsorship,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-sponsorships'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorship-stats'] });
      toast.success('Sponsorship cancelled successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to cancel sponsorship');
    },
  });
}

// Renew sponsorship
export function useRenewSponsorship() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: sponsorshipsApi.renewSponsorship,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['my-sponsorships'] });
      queryClient.invalidateQueries({ queryKey: ['sponsorship-stats'] });
      toast.success('Sponsorship renewed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to renew sponsorship');
    },
  });
}

// Get sponsorship statistics
export function useSponsorshipStats() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['sponsorship-stats'],
    queryFn: sponsorshipsApi.getSponsorshipStats,
    enabled: !!session?.user && session.user.role === 'SPONSOR',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Upload sponsor asset
export function useUploadSponsorAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ sponsorshipId, file, assetType }: { sponsorshipId: string; file: File; assetType: 'logo' | 'banner' }) =>
      sponsorshipsApi.uploadSponsorAsset(sponsorshipId, file, assetType),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['sponsorship-visibility', variables.sponsorshipId] });
      queryClient.invalidateQueries({ queryKey: ['my-sponsorships'] });
      toast.success('Asset uploaded successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload asset');
    },
  });
}

// Helper hooks for filtering sponsorships
export function useActiveSponsorships() {
  return useQuery({
    queryKey: ['my-sponsorships', 'active'],
    queryFn: async () => {
      const result = await sponsorshipsApi.getMySponsorships();
      return {
        ...result,
        data: result.data.filter(s => s.status === 'ACTIVE')
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function usePendingSponsorships() {
  return useQuery({
    queryKey: ['my-sponsorships', 'pending'],
    queryFn: async () => {
      const result = await sponsorshipsApi.getMySponsorships();
      return {
        ...result,
        data: result.data.filter(s => s.status === 'PENDING')
      };
    },
    staleTime: 2 * 60 * 1000,
  });
}

// Helper function to get sponsorship status color
export function getSponsorshipStatusColor(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-green-100 text-green-800';
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'APPROVED':
      return 'bg-blue-100 text-blue-800';
    case 'REJECTED':
      return 'bg-red-100 text-red-800';
    case 'EXPIRED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get payment status color
export function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'PAID':
      return 'bg-green-500 text-white';
    case 'PENDING':
      return 'bg-yellow-500 text-white';
    case 'FAILED':
      return 'bg-red-500 text-white';
    case 'REFUNDED':
      return 'bg-purple-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}