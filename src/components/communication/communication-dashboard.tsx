'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
//import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
// Update the import path below to the correct relative path if needed
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
//import { Checkbox } from '@/components/ui/checkbox';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Send, 
  Mail, 
  MessageSquare, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Settings,
  History,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CommunicationDashboardProps {
  eventId: string;
  onNotificationSent?: (result: any) => void;
  className?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  subject: string;
  preview: string;
  variables: string[];
}

interface Recipient {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
  status: 'active' | 'inactive';
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
}

const notificationTemplates: NotificationTemplate[] = [
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

export default function CommunicationDashboard({ 
  eventId, 
  onNotificationSent, 
  className = '' 
}: CommunicationDashboardProps) {
  const [activeTab, setActiveTab] = useState('compose');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Compose form state
  const [notificationType, setNotificationType] = useState<'email' | 'whatsapp' | 'both'>('email');
  const [recipientType, setRecipientType] = useState<string>('all');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isCustomMessage, setIsCustomMessage] = useState(false);
  const [customSubject, setCustomSubject] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [isHtml, setIsHtml] = useState(false);
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [scheduleAt, setScheduleAt] = useState('');
  const [templateData, setTemplateData] = useState<Record<string, string>>({});

  // Data state
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>([]);
  const [stats, setStats] = useState({
    totalSent: 0,
    totalRecipients: 0,
    successRate: 0
  });

  // Load initial data
  useEffect(() => {
    loadRecipients();
    loadNotificationHistory();
  }, [eventId]);

  const loadRecipients = async () => {
    try {
      // Mock data - replace with actual API call
      setRecipients([
        { id: '1', name: 'Dr. John Smith', email: 'john@example.com', phone: '+919876543210', role: 'FACULTY', status: 'active' },
        { id: '2', name: 'Jane Doe', email: 'jane@example.com', phone: '+919876543211', role: 'DELEGATE', status: 'active' },
        { id: '3', name: 'Bob Wilson', email: 'bob@example.com', role: 'VOLUNTEER', status: 'active' },
      ]);
    } catch (error) {
      console.error('Failed to load recipients:', error);
    }
  };

  const loadNotificationHistory = async () => {
    try {
      // Mock data - replace with actual API call
      setNotificationLogs([
        {
          id: '1',
          type: 'email',
          template: 'facultyInvitation',
          recipientCount: 15,
          sent: 14,
          failed: 1,
          createdAt: '2025-01-14T10:30:00Z',
          status: 'sent'
        },
        {
          id: '2',
          type: 'both',
          template: 'sessionReminder',
          recipientCount: 50,
          sent: 48,
          failed: 2,
          createdAt: '2025-01-14T09:15:00Z',
          status: 'sent'
        }
      ]);

      setStats({
        totalSent: 62,
        totalRecipients: 65,
        successRate: 95.4
      });
    } catch (error) {
      console.error('Failed to load notification history:', error);
    }
  };

  const handleSendNotification = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      let payload: any;

      if (isCustomMessage) {
        // Custom message payload
        payload = {
          type: notificationType,
          recipients: recipients
            .filter(r => recipientType === 'all' || r.role.toLowerCase() === recipientType)
            .map(r => ({
              email: r.email,
              phone: r.phone,
              name: r.name
            })),
          subject: customSubject,
          message: customMessage,
          isHtml,
          priority
        };

        const response = await fetch('/api/notifications', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to send custom message');
        }

      } else {
        // Template-based notification
        if (scheduleAt) {
          // Scheduled notification
          payload = {
            type: notificationType,
            recipients: recipients
              .filter(r => recipientType === 'all' || r.role.toLowerCase() === recipientType)
              .map(r => ({
                userId: r.id,
                email: r.email,
                phone: r.phone,
                name: r.name
              })),
            template: selectedTemplate,
            data: templateData,
            priority,
            scheduleAt,
            eventId
          };

          const response = await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to schedule notification');
          }

          setSuccess('Notification scheduled successfully!');

        } else {
          // Bulk notification
          payload = {
            type: notificationType,
            eventId,
            recipientType,
            template: selectedTemplate,
            data: templateData
          };

          const response = await fetch('/api/notifications', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send bulk notification');
          }

          const result = await response.json();
          setSuccess(`Notification sent to ${result.data.sent} recipients successfully!`);
          
          if (onNotificationSent) {
            onNotificationSent(result.data);
          }
        }
      }

      // Reload history
      loadNotificationHistory();

      // Reset form
      resetForm();

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send notification');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplate('');
    setCustomSubject('');
    setCustomMessage('');
    setTemplateData({});
    setScheduleAt('');
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplate(templateId);
    const template = notificationTemplates.find(t => t.id === templateId);
    
    if (template) {
      // Initialize template data with empty values
      const initialData: Record<string, string> = {};
      template.variables.forEach(variable => {
        initialData[variable] = '';
      });
      setTemplateData(initialData);
    }
  };

  const getRecipientCount = () => {
    return recipients.filter(r => 
      recipientType === 'all' || r.role.toLowerCase() === recipientType
    ).length;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent': return 'bg-green-500';
      case 'scheduled': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold">{stats.totalSent}</p>
              </div>
              <Send className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Recipients</p>
                <p className="text-2xl font-bold">{stats.totalRecipients}</p>
              </div>
              <Users className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold">{stats.successRate}%</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Communication Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Communication Center
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="compose">
                <Plus className="h-4 w-4 mr-2" />
                Compose
              </TabsTrigger>
              <TabsTrigger value="history">
                <History className="h-4 w-4 mr-2" />
                History
              </TabsTrigger>
              <TabsTrigger value="settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* Compose Tab */}
            <TabsContent value="compose" className="space-y-6">
              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left Column - Configuration */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Notification Type</Label>
                    <Select value={notificationType} onValueChange={(value: any) => setNotificationType(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select notification type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email Only
                          </div>
                        </SelectItem>
                        <SelectItem value="whatsapp">
                          <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            WhatsApp Only
                          </div>
                        </SelectItem>
                        <SelectItem value="both">
                          <div className="flex items-center gap-2">
                            <Send className="h-4 w-4" />
                            Email + WhatsApp
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <Select value={recipientType} onValueChange={setRecipientType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select recipients" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Users ({recipients.length})</SelectItem>
                        <SelectItem value="faculty">Faculty ({recipients.filter(r => r.role === 'FACULTY').length})</SelectItem>
                        <SelectItem value="delegate">Delegates ({recipients.filter(r => r.role === 'DELEGATE').length})</SelectItem>
                        <SelectItem value="volunteer">Volunteers ({recipients.filter(r => r.role === 'VOLUNTEER').length})</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-gray-500">
                      {getRecipientCount()} recipients will receive this notification
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Message Type</Label>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={isCustomMessage}
                          onCheckedChange={(checked: any) => setIsCustomMessage(!!checked)}
                        />
                        <Label className="text-sm">Custom Message</Label>
                      </div>
                    </div>

                    {!isCustomMessage ? (
                      <Select value={selectedTemplate} onValueChange={handleTemplateChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select template" />
                        </SelectTrigger>
                        <SelectContent>
                          {notificationTemplates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              <div>
                                <div className="font-medium">{template.name}</div>
                                <div className="text-sm text-gray-500">{template.preview}</div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="space-y-3">
                        <Input
                          placeholder="Subject"
                          value={customSubject}
                          onChange={(e) => setCustomSubject(e.target.value)}
                        />
                        <Textarea
                          placeholder="Message content"
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          rows={6}
                        />
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={isHtml}
                            onCheckedChange={(checked: any) => setIsHtml(!!checked)}
                          />
                          <Label className="text-sm">HTML Content</Label>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Priority</Label>
                    <Select value={priority} onValueChange={(value: any) => setPriority(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low Priority</SelectItem>
                        <SelectItem value="normal">Normal Priority</SelectItem>
                        <SelectItem value="high">High Priority</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Schedule (Optional)</Label>
                    <Input
                      type="datetime-local"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
                    />
                    <p className="text-sm text-gray-500">
                      Leave empty to send immediately
                    </p>
                  </div>
                </div>

                {/* Right Column - Template Variables */}
                <div className="space-y-4">
                  {selectedTemplate && !isCustomMessage && (
                    <>
                      <Label>Template Variables</Label>
                      <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                        {notificationTemplates
                          .find(t => t.id === selectedTemplate)
                          ?.variables.map((variable) => (
                            <div key={variable} className="space-y-1">
                              <Label className="text-sm capitalize">
                                {variable.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <Input
                                placeholder={`Enter ${variable}`}
                                value={templateData[variable] || ''}
                                onChange={(e) => setTemplateData(prev => ({
                                  ...prev,
                                  [variable]: e.target.value
                                }))}
                              />
                            </div>
                          ))}
                      </div>
                    </>
                  )}

                  {/* Preview */}
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="p-4 bg-white border rounded-lg">
                      {selectedTemplate ? (
                        <div>
                          <div className="font-medium text-sm text-gray-600 mb-2">
                            {notificationTemplates.find(t => t.id === selectedTemplate)?.name}
                          </div>
                          <div className="text-sm">
                            {notificationTemplates.find(t => t.id === selectedTemplate)?.preview}
                          </div>
                        </div>
                      ) : isCustomMessage ? (
                        <div>
                          {customSubject && (
                            <div className="font-medium mb-2">{customSubject}</div>
                          )}
                          <div className="text-sm whitespace-pre-wrap">
                            {customMessage || 'Enter your message...'}
                          </div>
                        </div>
                      ) : (
                        <div className="text-gray-500 text-sm">
                          Select a template or create a custom message to see preview
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Send Button */}
              <div className="flex justify-end space-x-3">
                <Button variant="outline" onClick={resetForm}>
                  Reset
                </Button>
                <Button 
                  onClick={handleSendNotification}
                  disabled={isLoading || (!selectedTemplate && !isCustomMessage)}
                  className="min-w-32"
                >
                  {isLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : scheduleAt ? (
                    <Calendar className="h-4 w-4 mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {isLoading ? 'Sending...' : scheduleAt ? 'Schedule' : 'Send Now'}
                </Button>
              </div>
            </TabsContent>

            {/* History Tab */}
            <TabsContent value="history" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Notification History</h3>
                <Button variant="outline" size="sm" onClick={loadNotificationHistory}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              <div className="space-y-3">
                {notificationLogs.map((log) => (
                  <Card key={log.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge className={`${getStatusColor(log.status)} text-white`}>
                              {log.status}
                            </Badge>
                            <span className="font-medium capitalize">
                              {log.template.replace(/([A-Z])/g, ' $1').trim()}
                            </span>
                            <Badge variant="outline">{log.type}</Badge>
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatDateTime(log.createdAt)}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold">
                            {log.sent}/{log.recipientCount}
                          </div>
                          <div className="text-sm text-gray-600">
                            {((log.sent / log.recipientCount) * 100).toFixed(1)}% success
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {notificationLogs.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications sent yet</p>
                    <p className="text-sm">Start by composing your first message</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              <h3 className="text-lg font-medium">Communication Settings</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Email Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Email Service</span>
                      <Badge variant="outline">Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Daily Limit</span>
                      <span className="text-sm text-gray-600">1000/day</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">WhatsApp Configuration</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">WhatsApp Business</span>
                      <Badge variant="outline">Configured</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Monthly Limit</span>
                      <span className="text-sm text-gray-600">10,000/month</span>
                    </div>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}