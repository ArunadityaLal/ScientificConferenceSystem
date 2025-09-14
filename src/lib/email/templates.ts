export interface EmailTemplateData {
  // Common variables
  recipientName?: string;
  eventName?: string;
  eventDate?: string;
  eventLocation?: string;
  organizerName?: string;
  organizerEmail?: string;
  organizerPhone?: string;
  eventWebsite?: string;
  
  // Faculty specific
  sessionName?: string;
  sessionDate?: string;
  sessionTime?: string;
  hallName?: string;
  sessionDuration?: string;
  presentationDeadline?: string;
  cvDeadline?: string;
  travelDeadline?: string;
  
  // Registration specific
  registrationId?: string;
  registrationStatus?: string;
  paymentAmount?: string;
  paymentDeadline?: string;
  
  // Links and actions
  loginUrl?: string;
  dashboardUrl?: string;
  uploadUrl?: string;
  confirmationUrl?: string;
  rejectUrl?: string;
  
  // Custom data
  customMessage?: string;
  additionalInfo?: string;
}

export const EmailTemplates = {
  // Faculty Invitation Email
  facultyInvitation: {
    subject: 'Invitation to Speak at {{eventName}} - {{sessionName}}',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Faculty Invitation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .highlight { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2196f3; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; font-weight: bold; }
        .button.secondary { background: #f44336; }
        .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .footer { text-align: center; margin-top: 30px; padding: 20px; color: #666; font-size: 14px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Faculty Invitation</h1>
        <p>You are invited to speak at {{eventName}}</p>
    </div>
    
    <div class="content">
        <p>Dear Dr. {{recipientName}},</p>
        
        <p>We are delighted to invite you as a distinguished speaker for our upcoming conference:</p>
        
        <div class="details">
            <h3>📅 Event Details</h3>
            <p><strong>Conference:</strong> {{eventName}}</p>
            <p><strong>Date:</strong> {{eventDate}}</p>
            <p><strong>Location:</strong> {{eventLocation}}</p>
            <p><strong>Website:</strong> <a href="{{eventWebsite}}">{{eventWebsite}}</a></p>
        </div>
        
        <div class="details">
            <h3>🎤 Your Session</h3>
            <p><strong>Session:</strong> {{sessionName}}</p>
            <p><strong>Date & Time:</strong> {{sessionDate}} at {{sessionTime}}</p>
            <p><strong>Duration:</strong> {{sessionDuration}}</p>
            <p><strong>Hall:</strong> {{hallName}}</p>
        </div>
        
        <div class="highlight">
            <h3>📋 Important Deadlines</h3>
            <ul>
                <li><strong>Acceptance Confirmation:</strong> Please confirm by clicking below</li>
                <li><strong>CV Submission:</strong> {{cvDeadline}}</li>
                <li><strong>Presentation Upload:</strong> {{presentationDeadline}}</li>
                <li><strong>Travel Details:</strong> {{travelDeadline}}</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{confirmationUrl}}" class="button">✅ Accept Invitation</a>
            <a href="{{rejectUrl}}" class="button secondary">❌ Decline</a>
        </div>
        
        <div style="text-align: center; margin: 20px 0;">
            <a href="{{dashboardUrl}}" style="color: #2196f3; text-decoration: none;">
                🏠 Access Your Faculty Dashboard
            </a>
        </div>
        
        <p>We believe your expertise and insights will greatly contribute to the success of this conference. We look forward to your participation.</p>
        
        <div class="highlight">
            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Click "Accept Invitation" above</li>
                <li>Complete your profile in the faculty dashboard</li>
                <li>Upload your CV and presentation</li>
                <li>Provide travel and accommodation details</li>
            </ol>
        </div>
        
        <p>For any questions or assistance, please contact:</p>
        <p>
            📧 <a href="mailto:{{organizerEmail}}">{{organizerEmail}}</a><br>
            📞 {{organizerPhone}}<br>
            👤 {{organizerName}}
        </p>
    </div>
    
    <div class="footer">
        <p>This is an automated message from {{eventName}} Conference Management System</p>
        <p>© 2025 Conference Management Platform. All rights reserved.</p>
    </div>
</body>
</html>`,
    text: `
Dear Dr. {{recipientName}},

You are invited to speak at {{eventName}}!

Event Details:
- Conference: {{eventName}}
- Date: {{eventDate}}
- Location: {{eventLocation}}

Your Session:
- Session: {{sessionName}}
- Date & Time: {{sessionDate}} at {{sessionTime}}
- Duration: {{sessionDuration}}
- Hall: {{hallName}}

Important Deadlines:
- CV Submission: {{cvDeadline}}
- Presentation Upload: {{presentationDeadline}}
- Travel Details: {{travelDeadline}}

To confirm your participation, please visit: {{confirmationUrl}}
To decline, please visit: {{rejectUrl}}

Access your faculty dashboard: {{dashboardUrl}}

Contact: {{organizerName}} ({{organizerEmail}}, {{organizerPhone}})

Best regards,
{{eventName}} Organizing Committee`
  },

  // Session Reminder Email
  sessionReminder: {
    subject: '⏰ Session Reminder: {{sessionName}} in 30 minutes',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Session Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
        .urgent { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .session-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .time-left { font-size: 24px; font-weight: bold; color: #ff6b35; text-align: center; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>⏰ Session Starting Soon!</h1>
        <div class="time-left">30 Minutes Remaining</div>
    </div>
    
    <div class="content">
        <p>Dear {{recipientName}},</p>
        
        <div class="urgent">
            <h3>🚨 Urgent Reminder</h3>
            <p>Your session <strong>{{sessionName}}</strong> is starting in 30 minutes. Please make your way to the venue.</p>
        </div>
        
        <div class="session-info">
            <h3>📍 Session Details</h3>
            <p><strong>Session:</strong> {{sessionName}}</p>
            <p><strong>Time:</strong> {{sessionTime}}</p>
            <p><strong>Hall:</strong> {{hallName}}</p>
            <p><strong>Duration:</strong> {{sessionDuration}}</p>
        </div>
        
        <div class="session-info">
            <h3>✅ Pre-Session Checklist</h3>
            <ul>
                <li>Arrive at {{hallName}} 15 minutes early</li>
                <li>Test your presentation and microphone</li>
                <li>Check with hall coordinator for any updates</li>
                <li>Ensure your mobile is on silent mode</li>
            </ul>
        </div>
        
        <p>The hall coordinator will assist you with technical setup. Break a leg!</p>
        
        <p>Best regards,<br>{{organizerName}}</p>
    </div>
</body>
</html>`,
    text: `
URGENT REMINDER: Session Starting in 30 Minutes!

Dear {{recipientName}},

Your session "{{sessionName}}" is starting in 30 minutes.

Session Details:
- Time: {{sessionTime}}
- Hall: {{hallName}}
- Duration: {{sessionDuration}}

Pre-Session Checklist:
- Arrive 15 minutes early
- Test presentation and microphone
- Check with hall coordinator
- Put mobile on silent

Best regards,
{{organizerName}}`
  },

  // Registration Confirmation Email
  registrationConfirmation: {
    subject: '✅ Registration Confirmed: {{eventName}}',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Registration Confirmation</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .confirmation { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .registration-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #2196f3; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Registration Confirmed!</h1>
        <p>Welcome to {{eventName}}</p>
    </div>
    
    <div class="content">
        <p>Dear {{recipientName}},</p>
        
        <div class="confirmation">
            <h3>✅ Your registration has been confirmed!</h3>
            <p>Registration ID: <strong>{{registrationId}}</strong></p>
            <p>Status: <strong>{{registrationStatus}}</strong></p>
        </div>
        
        <div class="registration-details">
            <h3>📅 Event Information</h3>
            <p><strong>Event:</strong> {{eventName}}</p>
            <p><strong>Date:</strong> {{eventDate}}</p>
            <p><strong>Location:</strong> {{eventLocation}}</p>
            <p><strong>Website:</strong> <a href="{{eventWebsite}}">{{eventWebsite}}</a></p>
        </div>
        
        <div class="registration-details">
            <h3>🎫 What's Next?</h3>
            <ul>
                <li>Save this email for your records</li>
                <li>Access your dashboard for event updates</li>
                <li>Check session schedules and speakers</li>
                <li>Download the conference mobile app (if available)</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{dashboardUrl}}" class="button">🏠 Access Your Dashboard</a>
        </div>
        
        <p>We're excited to have you at {{eventName}}! Keep an eye on your email for important updates and reminders.</p>
        
        <p>Best regards,<br>{{organizerName}}</p>
    </div>
</body>
</html>`,
    text: `
Registration Confirmed: {{eventName}}

Dear {{recipientName}},

Your registration has been confirmed!

Registration Details:
- Registration ID: {{registrationId}}
- Status: {{registrationStatus}}
- Event: {{eventName}}
- Date: {{eventDate}}
- Location: {{eventLocation}}

Access your dashboard: {{dashboardUrl}}

Best regards,
{{organizerName}}`
  },

  // Presentation Upload Reminder
  presentationReminder: {
    subject: '📋 Presentation Upload Reminder - {{eventName}}',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presentation Upload Reminder</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #2196f3 0%, #1976d2 100%); color: white; padding: 25px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 25px; border-radius: 0 0 10px 10px; }
        .reminder { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 15px 0; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>📋 Presentation Upload Required</h1>
        <p>Action needed for {{sessionName}}</p>
    </div>
    
    <div class="content">
        <p>Dear {{recipientName}},</p>
        
        <div class="reminder">
            <h3>⚠️ Deadline Approaching</h3>
            <p>Your presentation for <strong>{{sessionName}}</strong> is due on <strong>{{presentationDeadline}}</strong>.</p>
        </div>
        
        <p>To ensure smooth session delivery, please upload your presentation as soon as possible.</p>
        
        <h3>📁 Upload Requirements:</h3>
        <ul>
            <li>Format: PowerPoint (.pptx) or PDF</li>
            <li>Maximum size: 50MB</li>
            <li>Include speaker notes if needed</li>
            <li>Test all multimedia elements</li>
        </ul>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{uploadUrl}}" class="button">📤 Upload Presentation</a>
        </div>
        
        <p>If you face any technical issues, please contact our support team immediately.</p>
        
        <p>Best regards,<br>{{organizerName}}</p>
    </div>
</body>
</html>`,
    text: `
Presentation Upload Reminder - {{eventName}}

Dear {{recipientName}},

Your presentation for "{{sessionName}}" is due on {{presentationDeadline}}.

Upload Requirements:
- Format: PowerPoint (.pptx) or PDF
- Maximum size: 50MB
- Include speaker notes if needed

Upload here: {{uploadUrl}}

Best regards,
{{organizerName}}`
  },

  // Welcome Email for New Users
  welcomeUser: {
    subject: '🎉 Welcome to {{eventName}} - Get Started!',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .welcome-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
        .steps { background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎉 Welcome!</h1>
        <p>You're all set for {{eventName}}</p>
    </div>
    
    <div class="content">
        <p>Dear {{recipientName}},</p>
        
        <div class="welcome-box">
            <h3>🚀 Welcome to the Conference Platform!</h3>
            <p>Your account has been created successfully. You can now access all conference features through your personalized dashboard.</p>
        </div>
        
        <div class="steps">
            <h3>🎯 Getting Started</h3>
            <ol>
                <li><strong>Login:</strong> Access your dashboard using the button below</li>
                <li><strong>Complete Profile:</strong> Add your details and preferences</li>
                <li><strong>Explore Sessions:</strong> Browse the conference schedule</li>
                <li><strong>Network:</strong> Connect with other attendees</li>
            </ol>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{loginUrl}}" class="button">🔐 Login to Dashboard</a>
        </div>
        
        <div class="welcome-box">
            <h3>📱 Download Our Mobile App</h3>
            <p>Get real-time updates, session reminders, and networking features on your mobile device.</p>
            <p><em>App download links will be shared separately.</em></p>
        </div>
        
        <p>We're excited to have you join us at {{eventName}}!</p>
        
        <p>Best regards,<br>{{organizerName}}</p>
    </div>
</body>
</html>`,
    text: `
Welcome to {{eventName}}!

Dear {{recipientName}},

Your account has been created successfully!

Getting Started:
1. Login to your dashboard: {{loginUrl}}
2. Complete your profile
3. Explore conference sessions
4. Connect with other attendees

We're excited to have you join us!

Best regards,
{{organizerName}}`
  },

  // Certificate Ready Email
  certificateReady: {
    subject: '🏆 Your Certificate is Ready - {{eventName}}',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificate Ready</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #ffd700 0%, #ffb300 100%); color: #333; padding: 30px; border-radius: 10px 10px 0 0; text-align: center; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .certificate-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); text-align: center; }
        .button { display: inline-block; background: #4CAF50; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🏆 Certificate Ready!</h1>
        <p>Congratulations on completing {{eventName}}</p>
    </div>
    
    <div class="content">
        <p>Dear {{recipientName}},</p>
        
        <div class="certificate-box">
            <h3>🎉 Congratulations!</h3>
            <p>Your participation certificate for <strong>{{eventName}}</strong> is now ready for download.</p>
            
            <div style="margin: 30px 0;">
                <a href="{{dashboardUrl}}" class="button">📄 Download Certificate</a>
            </div>
            
            <p><em>You can access your certificate anytime from your dashboard.</em></p>
        </div>
        
        <p>Thank you for your valuable participation and contribution to the success of {{eventName}}.</p>
        
        <p>We hope to see you again at future events!</p>
        
        <p>Best regards,<br>{{organizerName}}</p>
    </div>
</body>
</html>`,
    text: `
Certificate Ready - {{eventName}}

Dear {{recipientName}},

Congratulations! Your participation certificate for {{eventName}} is now ready for download.

Download your certificate: {{dashboardUrl}}

Thank you for your valuable participation!

Best regards,
{{organizerName}}`
  }
};

// Template helper functions
export class EmailTemplateHelper {
  
  /**
   * Get template by name
   */
  static getTemplate(templateName: keyof typeof EmailTemplates) {
    return EmailTemplates[templateName];
  }

  /**
   * Render template with data
   */
  static renderTemplate(
    templateName: keyof typeof EmailTemplates,
    data: EmailTemplateData
  ): { subject: string; html: string; text: string } {
    const template = EmailTemplates[templateName];
    
    const subject = this.replaceVariables(template.subject, data);
    const html = this.replaceVariables(template.html, data);
    const text = this.replaceVariables(template.text, data);
    
    return { subject, html, text };
  }

  /**
   * Replace variables in template string
   */
  private static replaceVariables(template: string, data: EmailTemplateData): string {
    let result = template;
    
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        const regex = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
        result = result.replace(regex, String(value));
      }
    });

    // Remove any unreplaced variables
    result = result.replace(/{{[^}]+}}/g, '');
    
    return result;
  }

  /**
   * Validate template data
   */
  static validateTemplateData(
    templateName: keyof typeof EmailTemplates,
    data: EmailTemplateData
  ): { isValid: boolean; missingFields: string[] } {
    const template = EmailTemplates[templateName];
    const templateContent = template.subject + template.html + template.text;
    
    // Extract required variables from template
    const variableMatches = templateContent.match(/{{[^}]+}}/g) || [];
    const requiredVariables = Array.from(new Set(
      variableMatches.map(match => match.replace(/[{}]/g, '').trim())
    ));
    
    // Check for missing variables
    const missingFields = requiredVariables.filter(
      variable => !(variable in data) || data[variable as keyof EmailTemplateData] === undefined
    );
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  }

  /**
   * Get all available template names
   */
  static getAvailableTemplates(): string[] {
    return Object.keys(EmailTemplates);
  }
}