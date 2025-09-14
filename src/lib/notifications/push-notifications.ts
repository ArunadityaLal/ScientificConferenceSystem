// Push Notifications System for Browser Notifications
export interface PushNotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
  canRequestPermission: boolean;
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private serviceWorkerRegistration: ServiceWorkerRegistration | null = null;
  private notificationQueue: PushNotificationOptions[] = [];

  constructor() {
    this.initializeServiceWorker();
  }

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  /**
   * Initialize service worker for push notifications
   */
  async initializeServiceWorker(): Promise<void> {
    try {
      if ('serviceWorker' in navigator) {
        // Register service worker
        this.serviceWorkerRegistration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered successfully');
        
        // Handle service worker messages
        navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error);
    }
  }

  /**
   * Check notification permission status
   */
  getPermissionState(): NotificationPermissionState {
    const isSupported = 'Notification' in window;
    const permission = isSupported ? Notification.permission : 'denied';
    const canRequestPermission = isSupported && permission === 'default';

    return {
      permission: permission as NotificationPermission,
      isSupported,
      canRequestPermission
    };
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    try {
      if (!('Notification' in window)) {
        throw new Error('This browser does not support desktop notifications');
      }

      if (Notification.permission === 'granted') {
        return 'granted';
      }

      if (Notification.permission === 'denied') {
        throw new Error('Notification permission has been denied');
      }

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        console.log('Notification permission granted');
        // Process any queued notifications
        this.processNotificationQueue();
      }

      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      throw error;
    }
  }

  /**
   * Show a push notification
   */
  async showNotification(options: PushNotificationOptions): Promise<boolean> {
    try {
      const permissionState = this.getPermissionState();

      // Check if notifications are supported
      if (!permissionState.isSupported) {
        console.warn('Push notifications are not supported in this browser');
        return false;
      }

      // Check permission
      if (permissionState.permission !== 'granted') {
        if (permissionState.canRequestPermission) {
          // Queue notification and request permission
          this.notificationQueue.push(options);
          await this.requestPermission();
          return true;
        } else {
          console.warn('Notification permission denied or not available');
          return false;
        }
      }

      // Show notification
      await this.displayNotification(options);
      return true;

    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  /**
   * Display the actual notification
   */
  private async displayNotification(options: PushNotificationOptions): Promise<void> {
    try {
      const notificationOptions: NotificationOptions = {
        body: options.body,
        icon: options.icon || '/icons/notification-icon.png',
        badge: options.badge || '/icons/notification-badge.png',
        // image: options.image, // 'image' is not a valid property for NotificationOptions
        data: options.data,
        tag: options.tag,
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false
      };

      // Use service worker if available, otherwise use browser notification
      if (this.serviceWorkerRegistration) {
        await this.serviceWorkerRegistration.showNotification(options.title, notificationOptions);
      } else {
        const notification = new Notification(options.title, notificationOptions);
        
        // Handle notification click
        notification.onclick = (event) => {
          event.preventDefault();
          this.handleNotificationClick(options.data);
          notification.close();
        };

        // Auto-close after 5 seconds unless requireInteraction is true
        if (!options.requireInteraction) {
          setTimeout(() => {
            notification.close();
          }, 5000);
        }
      }

      console.log('Notification displayed:', options.title);
    } catch (error) {
      console.error('Error displaying notification:', error);
      throw error;
    }
  }

  /**
   * Process queued notifications after permission is granted
   */
  private async processNotificationQueue(): Promise<void> {
    if (this.notificationQueue.length === 0) return;

    const notifications = [...this.notificationQueue];
    this.notificationQueue = [];

    for (const notification of notifications) {
      await this.displayNotification(notification);
      // Small delay between notifications
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Handle notification click events
   */
  private handleNotificationClick(data?: any): void {
    // Focus the window
    if (window.parent) {
      window.parent.focus();
    } else {
      window.focus();
    }

    // Handle specific actions based on notification data
    if (data?.action) {
      switch (data.action) {
        case 'open_session':
          if (data.sessionId) {
            window.location.href = `/sessions/${data.sessionId}`;
          }
          break;
        case 'open_dashboard':
          window.location.href = '/dashboard';
          break;
        case 'mark_attendance':
          if (data.sessionId) {
            window.location.href = `/attendance?session=${data.sessionId}`;
          }
          break;
        default:
          if (data.url) {
            window.location.href = data.url;
          }
      }
    }
  }

  /**
   * Handle service worker messages
   */
  private handleServiceWorkerMessage(event: MessageEvent): void {
    const { type, data } = event.data;

    switch (type) {
      case 'NOTIFICATION_CLICK':
        this.handleNotificationClick(data);
        break;
      case 'NOTIFICATION_CLOSE':
        console.log('Notification closed:', data);
        break;
      default:
        console.log('Unknown service worker message:', event.data);
    }
  }

  /**
   * Show session reminder notification
   */
  async showSessionReminder(sessionData: {
    sessionId: string;
    sessionName: string;
    startTime: string;
    hallName?: string;
    minutesUntilStart: number;
  }): Promise<boolean> {
    const { sessionName, hallName, minutesUntilStart, sessionId } = sessionData;

    return this.showNotification({
      title: '🔔 Session Starting Soon!',
      body: `"${sessionName}" starts in ${minutesUntilStart} minutes${hallName ? ` at ${hallName}` : ''}`,
      icon: '/icons/session-reminder.png',
      tag: `session-${sessionId}`,
      requireInteraction: true,
      data: {
        action: 'open_session',
        sessionId,
        type: 'session_reminder'
      },
      actions: [
        {
          action: 'view_session',
          title: 'View Session',
          icon: '/icons/view.png'
        },
        {
          action: 'mark_attendance',
          title: 'Mark Attendance',
          icon: '/icons/attendance.png'
        }
      ]
    });
  }

  /**
   * Show new message notification
   */
  async showMessageNotification(messageData: {
    senderId: string;
    senderName: string;
    subject: string;
    preview: string;
    messageId?: string;
  }): Promise<boolean> {
    const { senderName, subject, preview, messageId } = messageData;

    return this.showNotification({
      title: `📧 New Message from ${senderName}`,
      body: `${subject}\n${preview}`,
      icon: '/icons/message.png',
      tag: `message-${messageId}`,
      data: {
        action: 'open_dashboard',
        messageId,
        type: 'new_message'
      }
    });
  }

  /**
   * Show urgent announcement
   */
  async showUrgentAnnouncement(announcementData: {
    title: string;
    message: string;
    eventId?: string;
    announcementId?: string;
  }): Promise<boolean> {
    const { title, message, eventId, announcementId } = announcementData;

    return this.showNotification({
      title: `🚨 Urgent: ${title}`,
      body: message,
      icon: '/icons/urgent.png',
      tag: `urgent-${announcementId}`,
      requireInteraction: true,
      vibrate: [200, 100, 200],
      data: {
        action: 'open_dashboard',
        eventId,
        announcementId,
        type: 'urgent_announcement'
      }
    });
  }

  /**
   * Show certificate ready notification
   */
  async showCertificateReady(certificateData: {
    eventName: string;
    recipientName: string;
    certificateId: string;
  }): Promise<boolean> {
    const { eventName, recipientName, certificateId } = certificateData;

    return this.showNotification({
      title: '🏆 Certificate Ready!',
      body: `Your certificate for "${eventName}" is ready for download`,
      icon: '/icons/certificate.png',
      tag: `certificate-${certificateId}`,
      data: {
        action: 'open_dashboard',
        certificateId,
        type: 'certificate_ready'
      },
      actions: [
        {
          action: 'download_certificate',
          title: 'Download Now',
          icon: '/icons/download.png'
        }
      ]
    });
  }

  /**
   * Clear all notifications with a specific tag
   */
  async clearNotifications(tag?: string): Promise<void> {
    try {
      if (this.serviceWorkerRegistration) {
        const notifications = await this.serviceWorkerRegistration.getNotifications({ tag });
        notifications.forEach(notification => notification.close());
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Get notification settings for user preferences
   */
  getNotificationSettings(): {
    permission: NotificationPermission;
    isSupported: boolean;
    serviceWorkerReady: boolean;
  } {
    const permissionState = this.getPermissionState();
    
    return {
      permission: permissionState.permission,
      isSupported: permissionState.isSupported,
      serviceWorkerReady: !!this.serviceWorkerRegistration
    };
  }

  /**
   * Test notification (for settings page)
   */
  async testNotification(): Promise<boolean> {
    return this.showNotification({
      title: '🧪 Test Notification',
      body: 'If you can see this, push notifications are working correctly!',
      icon: '/icons/test.png',
      tag: 'test-notification',
      data: {
        type: 'test'
      }
    });
  }
}

// Export singleton instance
export const pushNotificationManager = PushNotificationManager.getInstance();

// Helper functions for common notification types
export const NotificationHelpers = {
  /**
   * Show session reminder with smart timing
   */
  scheduleSessionReminder: async (sessionData: {
    sessionId: string;
    sessionName: string;
    startTime: string;
    hallName?: string;
  }) => {
    const startTime = new Date(sessionData.startTime);
    const now = new Date();
    const minutesUntilStart = Math.floor((startTime.getTime() - now.getTime()) / (1000 * 60));

    // Only show if session is starting within next hour
    if (minutesUntilStart > 0 && minutesUntilStart <= 60) {
      return pushNotificationManager.showSessionReminder({
        ...sessionData,
        minutesUntilStart
      });
    }
    return false;
  },

  /**
   * Show real-time event update
   */
  showEventUpdate: async (updateData: {
    eventName: string;
    updateType: 'schedule_change' | 'venue_change' | 'cancellation' | 'announcement';
    message: string;
    urgent?: boolean;
  }) => {
    const { eventName, updateType, message, urgent } = updateData;
    
    const titles = {
      schedule_change: '📅 Schedule Update',
      venue_change: '📍 Venue Change',
      cancellation: '❌ Session Cancelled',
      announcement: '📢 Event Announcement'
    };

    return pushNotificationManager.showNotification({
      title: `${titles[updateType]} - ${eventName}`,
      body: message,
      icon: '/icons/event-update.png',
      tag: `event-update-${Date.now()}`,
      requireInteraction: urgent,
      vibrate: urgent ? [200, 100, 200] : undefined,
      data: {
        action: 'open_dashboard',
        type: 'event_update',
        updateType
      }
    });
  },

  /**
   * Show networking opportunity
   */
  showNetworkingOpportunity: async (networkingData: {
    participantName: string;
    commonInterests: string[];
    eventName: string;
  }) => {
    const { participantName, commonInterests, eventName } = networkingData;

    return pushNotificationManager.showNotification({
      title: '🤝 Networking Opportunity',
      body: `${participantName} at ${eventName} shares interests in: ${commonInterests.join(', ')}`,
      icon: '/icons/networking.png',
      tag: 'networking-opportunity',
      data: {
        action: 'open_dashboard',
        type: 'networking_opportunity'
      }
    });
  }
};