// src/hooks/use-vendor.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';

// Types
interface VendorService {
  id: string;
  vendorId: string;
  name: string;
  description: string;
  category: 'CATERING' | 'DECORATION' | 'PHOTOGRAPHY' | 'SOUND_SYSTEM' | 'VENUE' | 'EQUIPMENT' | 'PRINTING' | 'TRANSPORTATION' | 'OTHER';
  price: number;
  currency: string;
  duration?: string;
  availability: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  images?: string[];
  features?: string[];
  capacity?: number;
  location?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface VendorBooking {
  id: string;
  vendorId: string;
  customerId: string;
  eventId?: string;
  serviceId: string;
  bookingDate: Date;
  eventDate: Date;
  eventEndDate?: Date;
  status: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID' | 'REFUNDED';
  notes?: string;
  requirements?: string;
  deliveryAddress?: string;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
  service?: VendorService;
  customer?: {
    id: string;
    name: string;
    email: string;
  };
  event?: {
    id: string;
    name: string;
  };
}

interface VendorPayment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: 'CASH' | 'CARD' | 'BANK_TRANSFER' | 'DIGITAL_WALLET' | 'CHEQUE';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  transactionId?: string;
  paymentDate?: Date;
  dueDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  booking?: VendorBooking;
}

interface VendorDelivery {
  id: string;
  bookingId: string;
  deliveryDate: Date;
  deliveryTime?: string;
  address: string;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'DELIVERED' | 'FAILED' | 'CANCELLED';
  deliveryPerson?: string;
  contactNumber?: string;
  instructions?: string;
  proofOfDelivery?: string[];
  signature?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  booking?: VendorBooking;
}

interface CreateServiceData {
  name: string;
  description: string;
  category: 'CATERING' | 'DECORATION' | 'PHOTOGRAPHY' | 'SOUND_SYSTEM' | 'VENUE' | 'EQUIPMENT' | 'PRINTING' | 'TRANSPORTATION' | 'OTHER';
  price: number;
  currency: string;
  duration?: string;
  images?: File[];
  features?: string[];
  capacity?: number;
  location?: string;
}

interface UpdateServiceData {
  name?: string;
  description?: string;
  category?: 'CATERING' | 'DECORATION' | 'PHOTOGRAPHY' | 'SOUND_SYSTEM' | 'VENUE' | 'EQUIPMENT' | 'PRINTING' | 'TRANSPORTATION' | 'OTHER';
  price?: number;
  currency?: string;
  duration?: string;
  availability?: 'AVAILABLE' | 'BUSY' | 'UNAVAILABLE';
  features?: string[];
  capacity?: number;
  location?: string;
  isActive?: boolean;
}

interface CreateBookingData {
  serviceId: string;
  eventDate: Date;
  eventEndDate?: Date;
  requirements?: string;
  deliveryAddress?: string;
  contactInfo: {
    name: string;
    phone: string;
    email: string;
  };
}

interface UpdateBookingData {
  status?: 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'REFUNDED';
  eventDate?: Date;
  eventEndDate?: Date;
  notes?: string;
  requirements?: string;
  deliveryAddress?: string;
}

interface VendorStats {
  totalBookings: number;
  activeBookings: number;
  completedBookings: number;
  totalRevenue: number;
  pendingPayments: number;
  upcomingDeliveries: number;
  averageRating: number;
  recentActivity: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
}

// API functions
const vendorApi = {
  // Get vendor's services
  getVendorServices: async (): Promise<{ success: boolean; data: VendorService[] }> => {
    const response = await fetch('/api/vendor/services', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch services');
    }

    return response.json();
  },

  // Create new service
  createService: async (serviceData: CreateServiceData): Promise<{ success: boolean; data: VendorService }> => {
    const formData = new FormData();
    Object.entries(serviceData).forEach(([key, value]) => {
      if (key === 'images' && Array.isArray(value)) {
        value.forEach((file, index) => {
          formData.append(`images`, file);
        });
      } else if (key === 'features' && Array.isArray(value)) {
        formData.append('features', JSON.stringify(value));
      } else if (value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    const response = await fetch('/api/vendor/services', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create service');
    }

    return response.json();
  },

  // Update service
  updateService: async (serviceId: string, updates: UpdateServiceData): Promise<{ success: boolean; data: VendorService }> => {
    const response = await fetch(`/api/vendor/services/${serviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update service');
    }

    return response.json();
  },

  // Get vendor's bookings
  getVendorBookings: async (params?: {
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{ success: boolean; data: VendorBooking[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const response = await fetch(`/api/vendor/bookings?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch bookings');
    }

    return response.json();
  },

  // Update booking
  updateBooking: async (bookingId: string, updates: UpdateBookingData): Promise<{ success: boolean; data: VendorBooking }> => {
    const response = await fetch(`/api/vendor/bookings/${bookingId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update booking');
    }

    return response.json();
  },

  // Get vendor's payments
  getVendorPayments: async (params?: {
    status?: string;
    bookingId?: string;
  }): Promise<{ success: boolean; data: VendorPayment[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.bookingId) searchParams.set('bookingId', params.bookingId);

    const response = await fetch(`/api/vendor/payments?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch payments');
    }

    return response.json();
  },

  // Get vendor's deliveries
  getVendorDeliveries: async (params?: {
    status?: string;
    date?: string;
  }): Promise<{ success: boolean; data: VendorDelivery[] }> => {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.date) searchParams.set('date', params.date);

    const response = await fetch(`/api/vendor/deliveries?${searchParams}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch deliveries');
    }

    return response.json();
  },

  // Update delivery status
  updateDelivery: async (deliveryId: string, updates: Partial<VendorDelivery>): Promise<{ success: boolean; data: VendorDelivery }> => {
    const response = await fetch(`/api/vendor/deliveries/${deliveryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update delivery');
    }

    return response.json();
  },

  // Get vendor statistics
  getVendorStats: async (): Promise<{ success: boolean; data: VendorStats }> => {
    const response = await fetch('/api/vendor/stats', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch vendor statistics');
    }

    return response.json();
  },

  // Upload service images
  uploadServiceImages: async (serviceId: string, files: File[]): Promise<{ success: boolean; data: { urls: string[] } }> => {
    const formData = new FormData();
    files.forEach((file, index) => {
      formData.append(`images`, file);
    });

    const response = await fetch(`/api/vendor/services/${serviceId}/images`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload images');
    }

    return response.json();
  },
};

// React Query Hooks

// Get vendor services
export function useVendorServices() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['vendor-services'],
    queryFn: vendorApi.getVendorServices,
    enabled: !!session?.user && session.user.role === 'VENDOR',
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Create service
export function useCreateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: vendorApi.createService,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-services'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
      toast.success('Service created successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create service');
    },
  });
}

// Update service
export function useUpdateService() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serviceId, updates }: { serviceId: string; updates: UpdateServiceData }) =>
      vendorApi.updateService(serviceId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-services'] });
      toast.success('Service updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update service');
    },
  });
}

// Get vendor bookings
export function useVendorBookings(params?: {
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['vendor-bookings', params],
    queryFn: () => vendorApi.getVendorBookings(params),
    enabled: !!session?.user && session.user.role === 'VENDOR',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Update booking
export function useUpdateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ bookingId, updates }: { bookingId: string; updates: UpdateBookingData }) =>
      vendorApi.updateBooking(bookingId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
      toast.success('Booking updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update booking');
    },
  });
}

// Get vendor payments
export function useVendorPayments(params?: {
  status?: string;
  bookingId?: string;
}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['vendor-payments', params],
    queryFn: () => vendorApi.getVendorPayments(params),
    enabled: !!session?.user && session.user.role === 'VENDOR',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Get vendor deliveries
export function useVendorDeliveries(params?: {
  status?: string;
  date?: string;
}) {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['vendor-deliveries', params],
    queryFn: () => vendorApi.getVendorDeliveries(params),
    enabled: !!session?.user && session.user.role === 'VENDOR',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Update delivery
export function useUpdateDelivery() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ deliveryId, updates }: { deliveryId: string; updates: Partial<VendorDelivery> }) =>
      vendorApi.updateDelivery(deliveryId, updates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['vendor-stats'] });
      toast.success('Delivery updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update delivery');
    },
  });
}

// Get vendor statistics
export function useVendorStats() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['vendor-stats'],
    queryFn: vendorApi.getVendorStats,
    enabled: !!session?.user && session.user.role === 'VENDOR',
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Upload service images
export function useUploadServiceImages() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ serviceId, files }: { serviceId: string; files: File[] }) =>
      vendorApi.uploadServiceImages(serviceId, files),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-services'] });
      toast.success('Images uploaded successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload images');
    },
  });
}

// Helper hooks for filtering
export function useActiveBookings() {
  return useVendorBookings({
    status: 'CONFIRMED',
  });
}

export function usePendingBookings() {
  return useVendorBookings({
    status: 'PENDING',
  });
}

export function usePendingPayments() {
  return useVendorPayments({
    status: 'PENDING',
  });
}

export function useUpcomingDeliveries() {
  return useQuery({
    queryKey: ['vendor-deliveries', 'upcoming'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      return vendorApi.getVendorDeliveries({
        status: 'SCHEDULED',
        date: today,
      });
    },
    staleTime: 1 * 60 * 1000,
  });
}

// Helper function to get booking status color
export function getBookingStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-100 text-yellow-800';
    case 'CONFIRMED':
      return 'bg-blue-100 text-blue-800';
    case 'IN_PROGRESS':
      return 'bg-purple-100 text-purple-800';
    case 'COMPLETED':
      return 'bg-green-100 text-green-800';
    case 'CANCELLED':
      return 'bg-red-100 text-red-800';
    case 'REFUNDED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

// Helper function to get payment status color
export function getPaymentStatusColor(status: string) {
  switch (status) {
    case 'PENDING':
      return 'bg-yellow-500 text-white';
    case 'PARTIAL':
      return 'bg-orange-500 text-white';
    case 'PAID':
      return 'bg-green-500 text-white';
    case 'REFUNDED':
      return 'bg-purple-500 text-white';
    default:
      return 'bg-gray-500 text-white';
  }
}

// Helper function to get delivery status color
export function getDeliveryStatusColor(status: string) {
  switch (status) {
    case 'SCHEDULED':
      return 'bg-blue-100 text-blue-800';
    case 'IN_TRANSIT':
      return 'bg-yellow-100 text-yellow-800';
    case 'DELIVERED':
      return 'bg-green-100 text-green-800';
    case 'FAILED':
      return 'bg-red-100 text-red-800';
    case 'CANCELLED':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}