import nodemailer from 'nodemailer';
import { z } from 'zod';

// Email configuration schema
const emailConfigSchema = z.object({
  host: z.string().min(1, 'SMTP host is required'),
  port: z.number().min(1, 'SMTP port is required'),
  secure: z.boolean().default(false),
  user: z.string().email('Valid email is required'),
  password: z.string().min(1, 'SMTP password is required'),
  from: z.string().email('From email is required'),
  fromName: z.string().min(1, 'From name is required'),
});

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
  fromName: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
    path?: string;
  }>;
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
  headers?: Record<string, string>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
  variables?: Record<string, any>;
}

export interface BulkEmailOptions {
  recipients: Array<{
    email: string;
    name?: string;
    variables?: Record<string, any>;
  }>;
  template: EmailTemplate;
  batchSize?: number;
  delayBetweenBatches?: number; // milliseconds
}

export class EmailSender {
  private transporter!: nodemailer.Transporter;
  private config!: EmailConfig;
  private isConfigured: boolean = false;

  constructor(config?: EmailConfig) {
    if (config) {
      this.configure(config);
    } else {
      // Try to configure from environment variables
      this.configureFromEnv();
    }
  }

  /**
   * Configure email sender with provided config
   */
  configure(config: EmailConfig): void {
    try {
      // Validate configuration
      emailConfigSchema.parse(config);
      
      this.config = config;
      
      // Create transporter
      this.transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure,
        auth: {
          user: config.user,
          pass: config.password,
        },
        tls: {
          rejectUnauthorized: false, // For development, set to true in production
        },
        pool: true, // Use connection pooling
        maxConnections: 5,
        maxMessages: 100,
      });

      this.isConfigured = true;
      console.log('Email sender configured successfully');

    } catch (error) {
      console.error('Email configuration error:', error);
      throw new Error('Failed to configure email sender');
    }
  }

  /**
   * Configure from environment variables
   */
  private configureFromEnv(): void {
    try {
      const config: EmailConfig = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER || '',
        password: process.env.SMTP_PASSWORD || '',
        from: process.env.EMAIL_FROM || '',
        fromName: process.env.EMAIL_FROM_NAME || 'Conference Management',
      };

      if (config.user && config.password && config.from) {
        this.configure(config);
      } else {
        console.warn('Email configuration incomplete in environment variables');
      }
    } catch (error) {
      console.warn('Failed to configure email from environment:', error);
    }
  }

  /**
   * Test email configuration
   */
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured) {
      throw new Error('Email sender not configured');
    }

    try {
      await this.transporter.verify();
      console.log('Email connection test successful');
      return true;
    } catch (error) {
      console.error('Email connection test failed:', error);
      return false;
    }
  }

  /**
   * Send single email
   */
  async sendEmail(options: EmailOptions): Promise<{
    success: boolean;
    messageId?: string;
    error?: string;
  }> {
    if (!this.isConfigured) {
      return {
        success: false,
        error: 'Email sender not configured'
      };
    }

    try {
      // Prepare email options
      const mailOptions = {
        from: `${this.config.fromName} <${this.config.from}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        replyTo: options.replyTo || this.config.from,
        priority: options.priority || 'normal',
        headers: options.headers,
      };

      // Send email
      const result = await this.transporter.sendMail(mailOptions);

      return {
        success: true,
        messageId: result.messageId
      };

    } catch (error) {
      console.error('Email sending error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  /**
   * Send bulk emails with template
   */
  async sendBulkEmails(options: BulkEmailOptions): Promise<{
    success: boolean;
    sent: number;
    failed: number;
    errors: Array<{ email: string; error: string }>;
  }> {
    if (!this.isConfigured) {
      throw new Error('Email sender not configured');
    }

    const {
      recipients,
      template,
      batchSize = 10,
      delayBetweenBatches = 1000
    } = options;

    let sent = 0;
    let failed = 0;
    const errors: Array<{ email: string; error: string }> = [];

    // Process in batches
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      // Process batch in parallel
      const promises = batch.map(async (recipient) => {
        try {
          // Replace variables in template
          const personalizedSubject = this.replaceVariables(
            template.subject,
            { ...template.variables, ...recipient.variables, recipientName: recipient.name }
          );

          const personalizedHtml = this.replaceVariables(
            template.html,
            { ...template.variables, ...recipient.variables, recipientName: recipient.name }
          );

          const personalizedText = template.text ? this.replaceVariables(
            template.text,
            { ...template.variables, ...recipient.variables, recipientName: recipient.name }
          ) : undefined;

          // Send email
          const result = await this.sendEmail({
            to: recipient.email,
            subject: personalizedSubject,
            html: personalizedHtml,
            text: personalizedText,
          });

          if (result.success) {
            sent++;
          } else {
            failed++;
            errors.push({
              email: recipient.email,
              error: result.error || 'Unknown error'
            });
          }

        } catch (error) {
          failed++;
          errors.push({
            email: recipient.email,
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
   * Replace variables in template
   */
  private replaceVariables(template: string, variables: Record<string, any>): string {
    let result = template;
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
      result = result.replace(regex, String(value || ''));
    });

    return result;
  }

  /**
   * Send email with retry logic
   */
  async sendEmailWithRetry(
    options: EmailOptions,
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
      const result = await this.sendEmail(options);
      
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
   * Get email statistics
   */
  getStats(): {
    configured: boolean;
    host: string;
    port: number;
    user: string;
  } {
    return {
      configured: this.isConfigured,
      host: this.config?.host || '',
      port: this.config?.port || 0,
      user: this.config?.user || '',
    };
  }

  /**
   * Close email transporter
   */
  close(): void {
    if (this.transporter) {
      this.transporter.close();
    }
  }
}

// Export singleton instance
export const emailSender = new EmailSender();