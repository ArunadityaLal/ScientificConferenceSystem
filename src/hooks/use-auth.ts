// src/hooks/use-auth.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

// Types
interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'ORGANIZER' | 'EVENT_MANAGER' | 'FACULTY' | 'DELEGATE' | 'HALL_COORDINATOR' | 'SPONSOR' | 'VOLUNTEER' | 'VENDOR';
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
  isActive: boolean;
  emailVerified?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'ORGANIZER' | 'EVENT_MANAGER' | 'FACULTY' | 'DELEGATE' | 'HALL_COORDINATOR' | 'SPONSOR' | 'VOLUNTEER' | 'VENDOR';
  phone?: string;
  designation?: string;
  institution?: string;
  specialization?: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface UpdateProfileData {
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
}

interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ResetPasswordData {
  email: string;
}

interface ConfirmResetPasswordData {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

interface DashboardStats {
  totalEvents?: number;
  activeSessions?: number;
  pendingTasks?: number;
  recentActivity?: Array<{
    id: string;
    type: string;
    message: string;
    timestamp: Date;
  }>;
  notifications?: Array<{
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    read: boolean;
    createdAt: Date;
  }>;
}

// API functions
const authApi = {
  // Register new user
  register: async (userData: RegisterData) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Registration failed');
    }

    return response.json();
  },

  // Get current user profile
  getProfile: async (): Promise<{ success: boolean; data: User }> => {
    const response = await fetch('/api/auth/profile', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch profile');
    }

    return response.json();
  },

  // Update user profile
  updateProfile: async (updates: UpdateProfileData): Promise<{ success: boolean; data: User }> => {
    const response = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update profile');
    }

    return response.json();
  },

  // Change password
  changePassword: async (passwordData: ChangePasswordData) => {
    const response = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(passwordData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to change password');
    }

    return response.json();
  },

  // Request password reset
  requestPasswordReset: async (data: ResetPasswordData) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to request password reset');
    }

    return response.json();
  },

  // Confirm password reset
  confirmPasswordReset: async (data: ConfirmResetPasswordData) => {
    const response = await fetch('/api/auth/reset-password/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reset password');
    }

    return response.json();
  },

  // Upload profile image
  uploadProfileImage: async (file: File) => {
    const formData = new FormData();
    formData.append('profileImage', file);

    const response = await fetch('/api/auth/profile/image', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to upload profile image');
    }

    return response.json();
  },

  // Get dashboard stats
  getDashboardStats: async (): Promise<{ success: boolean; data: DashboardStats }> => {
    const response = await fetch('/api/auth/dashboard-stats', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch dashboard stats');
    }

    return response.json();
  },

  // Get notifications
  getNotifications: async () => {
    const response = await fetch('/api/auth/notifications', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch notifications');
    }

    return response.json();
  },

  // Mark notifications as read
  markNotificationsRead: async (notificationIds: string[]) => {
    const response = await fetch('/api/auth/notifications/read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationIds }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to mark notifications as read');
    }

    return response.json();
  },

  // Delete account
  deleteAccount: async (password: string) => {
    const response = await fetch('/api/auth/delete-account', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete account');
    }

    return response.json();
  },

  // Verify email
  verifyEmail: async (token: string) => {
    const response = await fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to verify email');
    }

    return response.json();
  },

  // Resend verification email
  resendVerificationEmail: async () => {
    const response = await fetch('/api/auth/verify-email/resend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to resend verification email');
    }

    return response.json();
  },
};

// React Query Hooks

// Auth state hook
export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (credentials: LoginData) => {
    try {
      const result = await signIn('credentials', {
        email: credentials.email,
        password: credentials.password,
        redirect: false,
      });

      if (result?.error) {
        throw new Error(result.error);
      }

      if (result?.ok) {
        toast.success('Login successful!');
        // Redirect based on user role
        const user = session?.user;
        if (user?.role === 'ORGANIZER') {
          router.push('/organizer');
        } else if (user?.role === 'FACULTY') {
          router.push('/faculty');
        } else if (user?.role === 'DELEGATE') {
          router.push('/delegate');
        } else {
          router.push('/dashboard');
        }
      }

      return result;
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut({ redirect: false });
      toast.success('Logged out successfully');
      router.push('/');
    } catch (error: any) {
      toast.error('Logout failed');
      throw error;
    }
  };

  return {
    user: session?.user || null,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    login,
    logout,
  };
}

// Register mutation
export function useRegister() {
  const router = useRouter();
  
  return useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      toast.success('Registration successful! Please check your email to verify your account.');
      router.push('/login');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Registration failed');
    },
  });
}

// Get user profile hook
export function useProfile() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    enabled: !!session?.user,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// Update profile mutation
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      // Update the cache
      queryClient.setQueryData(['profile'], data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update profile');
    },
  });
}

// Change password mutation
export function useChangePassword() {
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      toast.success('Password changed successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to change password');
    },
  });
}

// Request password reset mutation
export function useRequestPasswordReset() {
  return useMutation({
    mutationFn: authApi.requestPasswordReset,
    onSuccess: () => {
      toast.success('Password reset email sent! Please check your inbox.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send reset email');
    },
  });
}

// Confirm password reset mutation
export function useConfirmPasswordReset() {
  const router = useRouter();
  
  return useMutation({
    mutationFn: authApi.confirmPasswordReset,
    onSuccess: () => {
      toast.success('Password reset successfully! Please login with your new password.');
      router.push('/login');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to reset password');
    },
  });
}

// Upload profile image mutation
export function useUploadProfileImage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.uploadProfileImage,
    onSuccess: (data) => {
      // Update the cache
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Profile image updated successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to upload profile image');
    },
  });
}

// Dashboard stats hook
export function useDashboardStats() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: authApi.getDashboardStats,
    enabled: !!session?.user,
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes
  });
}

// Notifications hook
export function useNotifications() {
  const { data: session } = useSession();
  
  return useQuery({
    queryKey: ['notifications'],
    queryFn: authApi.getNotifications,
    enabled: !!session?.user,
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: 2 * 60 * 1000, // Refetch every 2 minutes
  });
}

// Mark notifications as read mutation
export function useMarkNotificationsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to mark notifications as read');
    },
  });
}

// Delete account mutation
export function useDeleteAccount() {
  const router = useRouter();
  
  return useMutation({
    mutationFn: authApi.deleteAccount,
    onSuccess: () => {
      toast.success('Account deleted successfully');
      signOut({ redirect: false });
      router.push('/');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to delete account');
    },
  });
}

// Verify email mutation
export function useVerifyEmail() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      toast.success('Email verified successfully!');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to verify email');
    },
  });
}

// Resend verification email mutation
export function useResendVerificationEmail() {
  return useMutation({
    mutationFn: authApi.resendVerificationEmail,
    onSuccess: () => {
      toast.success('Verification email sent! Please check your inbox.');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to send verification email');
    },
  });
}

// Helper hooks for role-based access
export function useIsOrganizer() {
  const { user } = useAuth();
  return user?.role === 'ORGANIZER';
}

export function useIsEventManager() {
  const { user } = useAuth();
  return user?.role === 'EVENT_MANAGER';
}

export function useIsFaculty() {
  const { user } = useAuth();
  return ['FACULTY', 'SPEAKER', 'MODERATOR', 'CHAIRPERSON'].includes(user?.role || '');
}

export function useIsDelegate() {
  const { user } = useAuth();
  return user?.role === 'DELEGATE';
}

export function useIsHallCoordinator() {
  const { user } = useAuth();
  return user?.role === 'HALL_COORDINATOR';
}

export function useCanManageEvents() {
  const { user } = useAuth();
  return ['ORGANIZER', 'EVENT_MANAGER'].includes(user?.role || '');
}

export function useCanMarkAttendance() {
  const { user } = useAuth();
  return ['ORGANIZER', 'EVENT_MANAGER', 'HALL_COORDINATOR'].includes(user?.role || '');
}

// Get user permissions for specific actions
export function useUserPermissions() {
  const { user } = useAuth();
  
  return {
    canCreateEvents: ['ORGANIZER'].includes(user?.role || ''),
    canManageEvents: ['ORGANIZER', 'EVENT_MANAGER'].includes(user?.role || ''),
    canInviteFaculty: ['ORGANIZER', 'EVENT_MANAGER'].includes(user?.role || ''),
    canCreateSessions: ['ORGANIZER', 'EVENT_MANAGER'].includes(user?.role || ''),
    canMarkAttendance: ['ORGANIZER', 'EVENT_MANAGER', 'HALL_COORDINATOR'].includes(user?.role || ''),
    canViewReports: ['ORGANIZER', 'EVENT_MANAGER'].includes(user?.role || ''),
    canManageRegistrations: ['ORGANIZER', 'EVENT_MANAGER'].includes(user?.role || ''),
    canGenerateCertificates: ['ORGANIZER', 'EVENT_MANAGER'].includes(user?.role || ''),
    canManageHospitality: ['ORGANIZER', 'EVENT_MANAGER'].includes(user?.role || ''),
    canUploadPresentations: ['FACULTY', 'SPEAKER'].includes(user?.role || ''),
    canRegisterForEvents: ['DELEGATE', 'FACULTY'].includes(user?.role || ''),
  };
}