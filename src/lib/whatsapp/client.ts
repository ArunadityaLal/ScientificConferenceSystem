import { z } from 'zod';

// WhatsApp API configuration schema
const whatsappConfigSchema = z.object({
  apiUrl: z.string().url('Valid WhatsApp API URL is required'),
  accessToken: z.string().min(1, 'Access token is required'),
  phoneNumberId: z.string().min(1, 'Phone number ID is required'),
  businessAccountId: z.string().min(1, 'Business account ID is required'),
  webhookVerifyToken: z.string().min(1, 'Webhook verify token is required'),
});

export interface WhatsAppConfig {
  apiUrl: string;
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
}

export interface WhatsAppMessage {
  to: string; // Phone number with country code (e.g., "919876543210")
  type: 'text' | 'template' | 'image' | 'document';
  text?: {
    body: string;
    preview_url?: boolean;
  };
  template?: {
    name: string;
    language: {
      code: string; // e.g., "en_US", "hi_IN"
    };
    components?: Array<{
      type: string;
      parameters: Array<{
        type: string;
        text?: string;
        image?: {
          link: string;
        };
        document?: {
          link: string;
          filename: string;
        };
      }>;
    }>;
  };
  image?: {
    link: string;
    caption?: string;
  };
  document?: {
    link: string;
    caption?: string;
    filename: string;
  };
}

export interface WhatsAppTemplateMessage {
  templateName: string;
  language: string;
  recipientPhone: string;
  parameters: Array<{
    type: 'text' | 'image' | 'document';
    value: string;
  }>;
}

export interface BulkWhatsAppMessage {
  recipients: Array<{
    phone: string;
    name?: string;
    customParameters?: Record<string, string>;
  }>;
  template: WhatsAppTemplateMessage;
  batchSize?: number;
  delayBetweenBatches?: number; // milliseconds
}

export class WhatsAppClient {
  private config: WhatsAppConfig | undefined;
  private isConfigured: boolean = false;

  constructor(config?: WhatsAppConfig) {
    if (config) {
      this.configure(config);
    } else {
      this.configureFromEnv();
    }
  }

  /**
   * Configure WhatsApp client
   */
  configure(config: WhatsAppConfig): void {
    try {
      whatsappConfigSchema.parse(config);
      this.config = config;
      this.isConfigured = true;
      console.log('WhatsApp client configured successfully');
    } catch (error) {
      console.error('WhatsApp configuration error:', error);
      throw new Error('Failed to configure WhatsApp client');
    }
  }

  /**
   * Configure from environment variables
   */
  private configureFromEnv(): void {
    try {
      const config: WhatsAppConfig = {
        apiUrl: process.env.WHATSAPP_API_URL || 'https://graph.facebook.com/v18.0',
        accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
        phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
        businessAccountId: process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '',
        webhookVerifyToken: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || '',
      };

      if (config.accessToken && config.phoneNumberId) {
        this.configure(config);
      } else {
        console.warn('WhatsApp configuration incomplete in environment variables');
      }
    } catch (error) {
      console.warn('Failed to configure WhatsApp from environment:', error);
    }
  }

  /**
   * Send text message
   */
  async sendTextMessage(
    phone: string,
    message: string,
    previewUrl: boolean = false
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'WhatsApp client not configured'
      };
    }

    try {
      const payload: WhatsAppMessage = {
        to: this.formatPhoneNumber(phone),
        type: 'text',
        text: {
          body: message,
          preview_url: previewUrl
        }
      };

      const response = await this.sendMessage(payload);
      return response;

    } catch (error) {
      console.error('WhatsApp text message error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send text message'
      };
    }
  }

  /**
   * Send template message
   */
  async sendTemplateMessage(
    templateMessage: WhatsAppTemplateMessage
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'WhatsApp client not configured'
      };
    }

    try {
      const components = [];
      
      if (templateMessage.parameters.length > 0) {
        components.push({
          type: 'body',
          parameters: templateMessage.parameters.map(param => ({
            type: param.type,
            text: param.type === 'text' ? param.value : undefined,
            image: param.type === 'image' ? { link: param.value } : undefined,
            document: param.type === 'document' ? { 
              link: param.value,
              filename: 'document.pdf'
            } : undefined,
          }))
        });
      }

      const payload: WhatsAppMessage = {
        to: this.formatPhoneNumber(templateMessage.recipientPhone),
        type: 'template',
        template: {
          name: templateMessage.templateName,
          language: {
            code: templateMessage.language
          },
          components
        }
      };

      const response = await this.sendMessage(payload);
      return response;

    } catch (error) {
      console.error('WhatsApp template message error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send template message'
      };
    }
  }

  /**
   * Send bulk messages
   */
  async sendBulkMessages(
    options: BulkWhatsAppMessage
  ): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: Array<{ phone: string; error: string }>;
  }> {
    if (!this.isConfigured) {
      throw new Error('WhatsApp client not configured');
    }

    const {
      recipients,
      template,
      batchSize = 5,
      delayBetweenBatches = 2000 // 2 seconds delay
    } = options;

    let sent = 0;
    let failed = 0;
    const errors: Array<{ phone: string; error: string }> = [];

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // Process batch in parallel
      const promises = batch.map(async (recipient) => {
        try {
          // Merge custom parameters with template parameters
          const parameters = template.parameters.map(param => ({
            ...param,
            value: recipient.customParameters?.[param.value] || param.value
          }));

          const result = await this.sendTemplateMessage({
            ...template,
            recipientPhone: recipient.phone,
            parameters
          });

          if (result.success) {
            sent++;
          } else {
            failed++;
            errors.push({
              phone: recipient.phone,
              error: result.error || 'Unknown error'
            });
          }

        } catch (error) {
          failed++;
          errors.push({
            phone: recipient.phone,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      // Wait for batch completion
      await Promise.all(promises);

      // Delay between batches (except for last batch)
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return {
      success: sent > 0,
      sent,
      failed,
      errors
    };
  }

  /**
   * Send message with retry logic
   */
  async sendMessageWithRetry(
    message: WhatsAppMessage,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
    retries: number;
  }> {
    let lastError: string = '';
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const result = await this.sendMessage(message);
      
      if (result.success) {
        return {
          success: true,
          messageId: result.messageId,
          retries: attempt
        };
      }

      lastError = result.error || 'Unknown error';
      
      // Wait before retry (except for last attempt)
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    return {
      success: false,
      error: lastError,
      retries: maxRetries
    };
  }

  /**
   * Core message sending function
   */
  private async sendMessage(
    message: WhatsAppMessage
  ): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    try {
      if (!this.config) {
        throw new Error('WhatsApp client configuration is missing');
      }
      const url = `${this.config.apiUrl}/${this.config.phoneNumberId}/messages`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          ...message
        })
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error?.message || 'WhatsApp API error');
      }

      return {
        success: true,
        messageId: responseData.messages?.[0]?.id
      };

    } catch (error) {
      console.error('WhatsApp API error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Format phone number to international format
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // If starts with 0, assume it's an Indian number and add country code
    if (cleaned.startsWith('0')) {
      cleaned = '91' + cleaned.slice(1);
    }
    
    // If doesn't start with country code, assume Indian number
    if (cleaned.length === 10) {
      cleaned = '91' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Verify webhook signature (for receiving messages)
   */
  verifyWebhook(
    mode: string,
    token: string,
    challenge: string
  ): string | null {
    if (
      mode === 'subscribe' &&
      this.config &&
      token === this.config.webhookVerifyToken
    ) {
      return challenge;
    }
    return null;
  }

  /**
   * Process incoming webhook (for handling received messages)
   */
  processWebhook(body: any): {
    isValid: boolean;
    messages: Array<{
      from: string;
      text: string;
      timestamp: number;
      messageId: string;
    }>;
  } {
    try {
      const messages = [];
      
      if (body.object === 'whatsapp_business_account') {
        for (const entry of body.entry) {
          for (const change of entry.changes) {
            if (change.field === 'messages') {
              const value = change.value;
              
              if (value.messages) {
                for (const message of value.messages) {
                  if (message.type === 'text') {
                    messages.push({
                      from: message.from,
                      text: message.text.body,
                      timestamp: parseInt(message.timestamp) * 1000,
                      messageId: message.id
                    });
                  }
                }
              }
            }
          }
        }
      }

      return {
        isValid: true,
        messages
      };

    } catch (error) {
      console.error('Webhook processing error:', error);
      return {
        isValid: false,
        messages: []
      };
    }
  }

  /**
   * Get client status
   */
  getStatus(): {
    configured: boolean;
    phoneNumberId: string;
    businessAccountId: string;
  } {
    return {
      configured: this.isConfigured,
      phoneNumberId: this.config?.phoneNumberId || '',
      businessAccountId: this.config?.businessAccountId || '',
    };
  }
}

// Predefined WhatsApp message templates for conferences
export const WhatsAppTemplates = {
  sessionReminder: {
    templateName: 'session_reminder',
    language: 'en_US',
    parameters: [
      { type: 'text' as const, value: 'sessionName' },
      { type: 'text' as const, value: 'sessionTime' },
      { type: 'text' as const, value: 'hallName' }
    ]
  },

  facultyInvitation: {
    templateName: 'faculty_invitation',
    language: 'en_US',
    parameters: [
      { type: 'text' as const, value: 'facultyName' },
      { type: 'text' as const, value: 'eventName' },
      { type: 'text' as const, value: 'sessionName' }
    ]
  },

  registrationConfirmation: {
    templateName: 'registration_confirmation',
    language: 'en_US',
    parameters: [
      { type: 'text' as const, value: 'userName' },
      { type: 'text' as const, value: 'eventName' },
      { type: 'text' as const, value: 'registrationId' }
    ]
  },

  urgentUpdate: {
    templateName: 'urgent_update',
    language: 'en_US',
    parameters: [
      { type: 'text' as const, value: 'updateMessage' },
      { type: 'text' as const, value: 'eventName' }
    ]
  }
};

// Export singleton instance
export const whatsappClient = new WhatsAppClient();