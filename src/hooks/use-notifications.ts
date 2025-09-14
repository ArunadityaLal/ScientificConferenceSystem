'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { pushNotificationManager, NotificationHelpers } from '@/lib/notifications/push-notifications';

// Types
interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  preview: string;
  variables: string[];
}

interface NotificationLog {
  id: string;
  type: string;
  template: string;
  recipientCount: number;
  sent: number;
  failed: number;
  createdAt: string;
  status: 'sent' | 'scheduled' | 'failed' | 'cancelled';
  eventId?: string;
  sessionId?: string;
  metadata?: any;
}

interface NotificationStats {
  totalNotifications: number;
  totalRecipients: number;
  successRate: number;
  emailsSent: number;
  whatsappSent: number;
}

interface SendNotificationPayload {
  type: 'email' | 'whatsapp' | 'both';
  recipients: Array<{
    userId?: string;
    email?: string;
    phone?: string;
    name?: string;
  }>;
  template: string;
  data: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  scheduleAt?: string;
  eventId?: string;
  sessionId?: string;
}

interface BulkNotificationPayload {
  type: 'email' | 'whatsapp' | 'both';
  eventId: string;
  recipientType: 'all' | 'faculty' | 'delegates' | 'organizers' | 'volunteers';
  template: string;
  data: Record<string, any>;
  filterCriteria?: {
    sessionIds?: string[];
    hallIds?: string[];
    userRoles?: string[];
  };
}

interface CustomMessagePayload {
  type: 'email' | 'whatsapp' | 'both';
  recipients: Array<{
    email?: string;
    phone?: string;
    name?: string;
  }>;
  subject: string;
  message: string;
  isHtml?: boolean;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
}

// API functions
const notificationAPI = {
  // Get notification history
  getNotificationHistory: async (eventId?: string, page = 1, limit = 20): Promise<{
    logs: NotificationLog[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
    stats: NotificationStats;
  }> => {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (eventId) {
      params.append('eventId', eventId);
    }

    const response = await fetch(`/api/notifications?${params}`);
    if (!response.ok) {
      throw new Error('Failed to fetch notification history');
    }
    
    const result = await response.json();
    return result.data;
  },

  // Send notification with template
  sendNotification: async (payload: SendNotificationPayload): Promise<any> => {
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send notification');
    }

    return response.json();
  },

  // Send bulk notification
  sendBulkNotification: async (payload: BulkNotificationPayload): Promise<any> => {
    const response = await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send bulk notification');
    }

    return response.json();
  },

  // Send custom message
  sendCustomMessage: async (payload: CustomMessagePayload): Promise<any> => {
    const response = await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to send custom message');
    }

    return response.json();
  },

  // Cancel scheduled notification
  cancelScheduledNotification: async (notificationId: string): Promise<any> => {
    const response = await fetch(`/api/notifications?notificationId=${notificationId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to cancel notification');
    }

    return response.json();
  },
};

// Custom hooks
export function useNotificationHistory(eventId?: string, page = 1, limit = 20) {
  return useQuery({
    queryKey: ['notificationHistory', eventId, page, limit],
    queryFn: () => notificationAPI.getNotificationHistory(eventId, page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: 30 * 1000, // Refetch every 30 seconds
  });
}

export function useNotificationStats(eventId?: string) {
  const { data } = useNotificationHistory(eventId, 1, 1);
  return {
    stats: data?.stats || {
      totalNotifications: 0,
      totalRecipients: 0,
      successRate: 0,
      emailsSent: 0,
      whatsappSent: 0,
    },
    isLoading: !data,
  };
}

export function useSendNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.sendNotification,
    onSuccess: (data) => {
      // Invalidate notification history to refresh the list
      queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
      
      // Show browser notification if it was a session reminder
      if (data.data?.template === 'sessionReminder') {
        NotificationHelpers.scheduleSessionReminder(data.data);
      }
    },
    onError: (error) => {
      console.error('Failed to send notification:', error);
    },
  });
}

export function useBulkNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.sendBulkNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
    },
    onError: (error) => {
      console.error('Failed to send bulk notification:', error);
    },
  });
}

export function useCustomMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.sendCustomMessage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
    },
    onError: (error) => {
      console.error('Failed to send custom message:', error);
    },
  });
}

export function useCancelNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: notificationAPI.cancelScheduledNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationHistory'] });
    },
    onError: (error) => {
      console.error('Failed to cancel notification:', error);
    },
  });
}

// Push notification hook
export function usePushNotifications() {
  const [permissionState, setPermissionState] = useState<{
    permission: NotificationPermission;
    isSupported: boolean;
    canRequestPermission: boolean;
  }>({
    permission: 'default',
    isSupported: false,
    canRequestPermission: false,
  });

  useEffect(() => {
    // Initialize permission state
    const state = pushNotificationManager.getPermissionState();
    setPermissionState(state);

    // Listen for permission changes
    const handlePermissionChange = () => {
      const newState = pushNotificationManager.getPermissionState();
      setPermissionState(newState);
    };

    // Check permission periodically (some browsers don't fire events)
    const interval = setInterval(handlePermissionChange, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const requestPermission = async () => {
    try {
      const permission = await pushNotificationManager.requestPermission();
      setPermissionState(pushNotificationManager.getPermissionState());
      return permission;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      throw error;
    }
  };

  const showNotification = async (options: {
    title: string;
    body: string;
    icon?: string;
    data?: any;
    tag?: string;
  }) => {
    return pushNotificationManager.showNotification(options);
  };

  const testNotification = async () => {
    return pushNotificationManager.testNotification();
  };

  return {
    permissionState,
    requestPermission,
    showNotification,
    testNotification,
    isGranted: permissionState.permission === 'granted',
    isDenied: permissionState.permission === 'denied',
    canRequest: permissionState.canRequestPermission,
  };
}

// Real-time notifications hook using Server-Sent Events
export function useRealTimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { showNotification } = usePushNotifications();

  useEffect(() => {
    if (!userId) return;

    // Create EventSource for real-time notifications
    const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('Real-time notifications connected');
    };

    eventSource.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data);
        setNotifications(prev => [notification, ...prev.slice(0, 49)]); // Keep last 50

        // Show browser notification for important notifications
        if (notification.priority === 'high' || notification.priority === 'urgent') {
          showNotification({
            title: notification.title,
            body: notification.body,
            icon: notification.icon,
            data: notification.data,
            tag: notification.id,
          });
        }

      } catch (error) {
        console.error('Failed to parse notification:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('Real-time notifications error:', error);
      setIsConnected(false);
    };

    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [userId, showNotification]);

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
    clearAll,
  };
}

// Session-specific notification hooks
export function useSessionNotifications(sessionId: string) {
  const { showNotification } = usePushNotifications();

  const notifySessionStarting = async (sessionData: {
    sessionName: string;
    startTime: string;
    hallName?: string;
    minutesUntilStart: number;
  }) => {
    return pushNotificationManager.showSessionReminder({
      sessionId,
      ...sessionData,
    });
  };

  const notifySessionUpdate = async (updateData: {
    updateType: 'time_change' | 'venue_change' | 'speaker_change' | 'cancelled';
    message: string;
    urgent?: boolean;
  }) => {
    return showNotification({
      title: `🔄 Session Update`,
      body: updateData.message,
      icon: '/icons/session-update.png',
      tag: `session-update-${sessionId}`,
      data: {
        action: 'open_session',
        sessionId,
        type: 'session_update',
        updateType: updateData.updateType,
      },
    });
  };

  const clearSessionNotifications = async () => {
    return pushNotificationManager.clearNotifications(`session-${sessionId}`);
  };

  return {
    notifySessionStarting,
    notifySessionUpdate,
    clearSessionNotifications,
  };
}

// Notification templates hook
export function useNotificationTemplates() {
  const templates: NotificationTemplate[] = [
    {
      id: 'facultyInvitation',
      name: 'Faculty Invitation',
      subject: 'Invitation to Speak at {{eventName}}',
      preview: 'Formal invitation for speaking at the conference...',
      variables: ['recipientName', 'eventName', 'sessionName', 'sessionDate']
    },
    {
      id: 'sessionReminder',
      name: 'Session Reminder',
      subject: 'Session Starting in 30 Minutes',
      preview: 'Urgent reminder for upcoming session...',
      variables: ['recipientName', 'sessionName', 'sessionTime', 'hallName']
    },
    {
      id: 'registrationConfirmation',
      name: 'Registration Confirmation',
      subject: 'Registration Confirmed',
      preview: 'Your registration has been confirmed...',
      variables: ['recipientName', 'eventName', 'registrationId']
    },
    {
      id: 'presentationReminder',
      name: 'Presentation Upload Reminder',
      subject: 'Presentation Upload Required',
      preview: 'Please upload your presentation...',
      variables: ['recipientName', 'sessionName', 'presentationDeadline']
    },
    {
      id: 'welcomeUser',
      name: 'Welcome Message',
      subject: 'Welcome to {{eventName}}',
      preview: 'Welcome to the conference platform...',
      variables: ['recipientName', 'eventName', 'loginUrl']
    },
    {
      id: 'certificateReady',
      name: 'Certificate Ready',
      subject: 'Your Certificate is Ready',
      preview: 'Your participation certificate is now available...',
      variables: ['recipientName', 'eventName', 'dashboardUrl']
    }
  ];

  const getTemplate = (templateId: string) => {
    return templates.find(t => t.id === templateId);
  };

  const validateTemplateData = (templateId: string, data: Record<string, any>) => {
    const template = getTemplate(templateId);
    if (!template) return { isValid: false, missingFields: [] };

    const missingFields = template.variables.filter(
      variable => !(variable in data) || !data[variable]
    );

    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };

  return {
    templates,
    getTemplate,
    validateTemplateData,
  };
}

// Communication preferences hook
export function useCommunicationPreferences(userId: string) {
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    whatsappNotifications: false,
    pushNotifications: true,
    sessionReminders: true,
    eventUpdates: true,
    marketingEmails: false,
  });

  const updatePreferences = async (newPreferences: Partial<typeof preferences>) => {
    try {
      const response = await fetch(`/api/users/${userId}/preferences`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ communication: newPreferences }),
      });

      if (!response.ok) {
        throw new Error('Failed to update preferences');
      }

      setPreferences(prev => ({ ...prev, ...newPreferences }));
    } catch (error) {
      console.error('Failed to update communication preferences:', error);
      throw error;
    }
  };

  return {
    preferences,
    updatePreferences,
  };
}