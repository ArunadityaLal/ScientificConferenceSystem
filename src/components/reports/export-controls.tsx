// src/components/reports/export-controls.tsx

'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage, 
  Mail, 
  Settings, 
  Calendar as CalendarIcon,
  Clock,
  Users,
  BarChart3,
  PieChart,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Share2,
  Filter,
  Database,
  Printer,
  Send
} from 'lucide-react';

// Interfaces
interface ExportFormat {
  id: string;
  name: string;
  extension: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  features: string[];
}

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'analytics' | 'attendance' | 'faculty' | 'custom';
  sections: string[];
  estimatedSize: string;
  generationTime: string;
}

interface ExportJob {
  id: string;
  name: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  size?: string;
  downloadUrl?: string;
  createdAt: string;
  estimatedCompletion?: string;
}

interface EmailSettings {
  recipients: string[];
  subject: string;
  message: string;
  scheduleType: 'immediate' | 'daily' | 'weekly' | 'monthly';
  scheduleTime?: string;
}

// Mock Data
const exportFormats: ExportFormat[] = [
  {
    id: 'pdf',
    name: 'PDF Report',
    extension: '.pdf',
    icon: FileText,
    description: 'Professional formatted reports with charts and tables',
    features: ['Charts & Graphs', 'Professional Layout', 'Print Ready', 'Shareable']
  },
  {
    id: 'excel',
    name: 'Excel Spreadsheet',
    extension: '.xlsx',
    icon: FileSpreadsheet,
    description: 'Raw data for analysis with multiple worksheets',
    features: ['Multiple Sheets', 'Formulas', 'Data Analysis', 'Pivot Tables']
  },
  {
    id: 'csv',
    name: 'CSV Data',
    extension: '.csv',
    icon: Database,
    description: 'Simple comma-separated values for database import',
    features: ['Database Import', 'Lightweight', 'Universal Format', 'Fast Export']
  },
  {
    id: 'png',
    name: 'Chart Images',
    extension: '.png',
    icon: FileImage,
    description: 'High-resolution charts and graphs as images',
    features: ['High Resolution', 'Presentation Ready', 'Social Media', 'Documentation']
  }
];

const reportTemplates: ReportTemplate[] = [
  {
    id: 'executive_summary',
    name: 'Executive Summary',
    description: 'High-level overview for leadership',
    category: 'analytics',
    sections: ['Key Metrics', 'Trends', 'Recommendations', 'Action Items'],
    estimatedSize: '2-3 MB',
    generationTime: '30 seconds'
  },
  {
    id: 'detailed_analytics',
    name: 'Detailed Analytics Report',
    description: 'Comprehensive analysis with all metrics',
    category: 'analytics',
    sections: ['Attendance Data', 'Session Analytics', 'Faculty Performance', 'Feedback Analysis'],
    estimatedSize: '5-8 MB',
    generationTime: '2 minutes'
  },
  {
    id: 'attendance_report',
    name: 'Attendance Report',
    description: 'Complete attendance tracking and analysis',
    category: 'attendance',
    sections: ['Session Attendance', 'QR Scans', 'Late Arrivals', 'Missing Attendees'],
    estimatedSize: '1-2 MB',
    generationTime: '45 seconds'
  },
  {
    id: 'faculty_performance',
    name: 'Faculty Performance Report',
    description: 'Individual and comparative faculty analysis',
    category: 'faculty',
    sections: ['Ratings', 'Engagement', 'Feedback', 'Recommendations'],
    estimatedSize: '3-4 MB',
    generationTime: '1 minute'
  }
];

const mockExportJobs: ExportJob[] = [
  {
    id: '1',
    name: 'Executive Summary - July 2025',
    format: 'PDF',
    status: 'completed',
    progress: 100,
    size: '2.4 MB',
    downloadUrl: '/downloads/executive-summary-july.pdf',
    createdAt: '2025-07-14 10:30:00'
  },
  {
    id: '2',
    name: 'Attendance Data Export',
    format: 'Excel',
    status: 'processing',
    progress: 65,
    createdAt: '2025-07-14 11:15:00',
    estimatedCompletion: '2 minutes'
  },
  {
    id: '3',
    name: 'Session Analytics Charts',
    format: 'PNG',
    status: 'failed',
    progress: 0,
    createdAt: '2025-07-14 09:45:00'
  }
];

interface ExportControlsProps {
  eventId?: string;
}

export default function ExportControls({ eventId }: ExportControlsProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>(exportFormats[0] ?? {
    id: '',
    name: '',
    extension: '',
    icon: () => null,
    description: '',
    features: []
  });
  const [selectedTemplate, setSelectedTemplate] = useState<ReportTemplate>(
    reportTemplates[0] ?? {
      id: '',
      name: '',
      description: '',
      category: 'custom',
      sections: [],
      estimatedSize: '',
      generationTime: ''
    }
  );
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined
  });
  const [fileName, setFileName] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [emailSettings, setEmailSettings] = useState<EmailSettings>({
    recipients: [],
    subject: '',
    message: '',
    scheduleType: 'immediate'
  });
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeRawData, setIncludeRawData] = useState(false);
  const [customFilters, setCustomFilters] = useState<Record<string, any>>({});

  // Handle section selection
  const handleSectionToggle = useCallback((section: string) => {
    setSelectedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  }, []);

  // Handle export generation
  const handleGenerateExport = useCallback(async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    // Simulate export generation with progress
    const intervals = [
      { progress: 20, message: 'Collecting data...', delay: 500 },
      { progress: 40, message: 'Processing analytics...', delay: 800 },
      { progress: 60, message: 'Generating charts...', delay: 600 },
      { progress: 80, message: 'Formatting report...', delay: 700 },
      { progress: 100, message: 'Export completed!', delay: 400 }
    ];

    for (const interval of intervals) {
      await new Promise(resolve => setTimeout(resolve, interval.delay));
      setGenerationProgress(interval.progress);
    }

    setIsGenerating(false);
    
    // Simulate file download
    const blob = new Blob(['Sample export data'], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${fileName || 'export'}.${selectedFormat.extension.substring(1)}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [selectedFormat, fileName]);

  // Handle email export
  const handleEmailExport = useCallback(() => {
    console.log('Sending email export with settings:', emailSettings);
    // Implementation would integrate with email service
  }, [emailSettings]);

  // Add email recipient
  const addEmailRecipient = useCallback((email: string) => {
    if (email && !emailSettings.recipients.includes(email)) {
      setEmailSettings(prev => ({
        ...prev,
        recipients: [...prev.recipients, email]
      }));
    }
  }, [emailSettings.recipients]);

  // Remove email recipient
  const removeEmailRecipient = useCallback((email: string) => {
    setEmailSettings(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email)
    }));
  }, []);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Export & Reports</h1>
          <p className="text-gray-600 mt-1">Generate and export comprehensive reports</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Export Settings
          </Button>
          <Button variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Main Export Interface */}
      <Tabs defaultValue="generate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="generate">Generate Reports</TabsTrigger>
          <TabsTrigger value="schedule">Schedule & Email</TabsTrigger>
          <TabsTrigger value="history">Export History</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* Generate Reports */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Configuration Panel */}
            <div className="lg:col-span-2 space-y-6">
              {/* Format Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Format</CardTitle>
                  <CardDescription>Choose your preferred export format</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exportFormats.map((format) => (
                      <div
                        key={format.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedFormat.id === format.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedFormat(format)}
                      >
                        <div className="flex items-start gap-3">
                          <format.icon className="w-8 h-8 text-blue-600 mt-1" />
                          <div className="flex-1">
                            <h4 className="font-semibold">{format.name}</h4>
                            <p className="text-sm text-gray-600 mb-2">{format.description}</p>
                            <div className="flex flex-wrap gap-1">
                              {format.features.map((feature, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Template Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Template</CardTitle>
                  <CardDescription>Select a pre-configured report template</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {reportTemplates.map((template) => (
                      <div
                        key={template.id}
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                          selectedTemplate.id === template.id 
                            ? 'border-blue-500 bg-blue-50' 
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedTemplate(template)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{template.name}</h4>
                              <Badge variant="secondary">{template.category}</Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>📊 {template.sections.length} sections</span>
                              <span>💾 {template.estimatedSize}</span>
                              <span>⏱️ {template.generationTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Sections */}
              <Card>
                <CardHeader>
                  <CardTitle>Report Sections</CardTitle>
                  <CardDescription>Customize which sections to include</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedTemplate.sections.map((section) => (
                      <div key={section} className="flex items-center space-x-2">
                        <Checkbox
                          id={section}
                          checked={selectedSections.includes(section)}
                          onCheckedChange={() => handleSectionToggle(section)}
                        />
                        <Label htmlFor={section} className="text-sm font-medium">
                          {section}
                        </Label>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeCharts"
                        checked={includeCharts}
                        onCheckedChange={checked => setIncludeCharts(checked === true)}
                      />
                      <Label htmlFor="includeCharts" className="text-sm font-medium">
                        Include Charts & Graphs
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="includeRawData"
                        checked={includeRawData}
                        onCheckedChange={checked => setIncludeRawData(checked === true)}
                      />
                      <Label htmlFor="includeRawData" className="text-sm font-medium">
                        Include Raw Data
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview & Generation Panel */}
            <div className="space-y-6">
              {/* Export Preview */}
              <Card>
                <CardHeader>
                  <CardTitle>Export Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>File Name</Label>
                    <Input
                      value={fileName}
                      onChange={(e) => setFileName(e.target.value)}
                      placeholder={`${selectedTemplate.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}`}
                    />
                  </div>

                  <div>
                    <Label>Format</Label>
                    <div className="flex items-center gap-2 mt-1">
                      <selectedFormat.icon className="w-5 h-5 text-blue-600" />
                      <span className="font-medium">{selectedFormat.name}</span>
                      <Badge variant="outline">{selectedFormat.extension}</Badge>
                    </div>
                  </div>

                  <div>
                    <Label>Estimated Size</Label>
                    <p className="text-sm text-gray-600 mt-1">{selectedTemplate.estimatedSize}</p>
                  </div>

                  <div>
                    <Label>Generation Time</Label>
                    <p className="text-sm text-gray-600 mt-1">{selectedTemplate.generationTime}</p>
                  </div>

                  <div>
                    <Label>Sections ({selectedSections.length})</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedSections.length > 0 ? selectedSections.map((section, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {section}
                        </Badge>
                      )) : (
                        <span className="text-sm text-gray-500">All sections included</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Generation Controls */}
              <Card>
                <CardContent className="p-6">
                  {!isGenerating ? (
                    <Button 
                      onClick={handleGenerateExport}
                      className="w-full"
                      size="lg"
                    >
                      <Download className="w-5 h-5 mr-2" />
                      Generate & Download
                    </Button>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-center">
                        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                        <p className="font-medium">Generating Export...</p>
                      </div>
                      <Progress value={generationProgress} className="w-full" />
                      <p className="text-sm text-center text-gray-600">
                        {generationProgress}% Complete
                      </p>
                    </div>
                  )}

                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" className="w-full">
                      <Share2 className="w-4 h-4 mr-2" />
                      Share via Link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Schedule & Email */}
        <TabsContent value="schedule" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Recipients</CardTitle>
                <CardDescription>Configure who receives the reports</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Add Recipients</Label>
                  <div className="flex gap-2 mt-1">
                    <Input placeholder="Enter email address" id="emailInput" />
                    <Button onClick={() => {
                      const input = document.getElementById('emailInput') as HTMLInputElement;
                      if (input.value) {
                        addEmailRecipient(input.value);
                        input.value = '';
                      }
                    }}>
                      Add
                    </Button>
                  </div>
                </div>

                <div>
                  <Label>Recipients ({emailSettings.recipients.length})</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {emailSettings.recipients.map((email, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {email}
                        <button
                          onClick={() => removeEmailRecipient(email)}
                          className="ml-1 hover:text-red-600"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Subject</Label>
                  <Input
                    value={emailSettings.subject}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder="Conference Analytics Report"
                  />
                </div>

                <div>
                  <Label>Message</Label>
                  <Textarea
                    value={emailSettings.message}
                    onChange={(e) => setEmailSettings(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Please find the attached conference analytics report..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Schedule Settings</CardTitle>
                <CardDescription>Configure automatic report generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Schedule Type</Label>
                  <Select
                    value={emailSettings.scheduleType}
                    onValueChange={(value) => setEmailSettings(prev => ({ 
                      ...prev, 
                      scheduleType: value as any 
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="immediate">Send Immediately</SelectItem>
                      <SelectItem value="daily">Daily Reports</SelectItem>
                      <SelectItem value="weekly">Weekly Reports</SelectItem>
                      <SelectItem value="monthly">Monthly Reports</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {emailSettings.scheduleType !== 'immediate' && (
                  <div>
                    <Label>Schedule Time</Label>
                    <Input
                      type="time"
                      value={emailSettings.scheduleTime || '09:00'}
                      onChange={(e) => setEmailSettings(prev => ({ 
                        ...prev, 
                        scheduleTime: e.target.value 
                      }))}
                    />
                  </div>
                )}

                <div className="pt-4">
                  <Button onClick={handleEmailExport} className="w-full">
                    <Send className="w-4 h-4 mr-2" />
                    {emailSettings.scheduleType === 'immediate' ? 'Send Now' : 'Schedule Reports'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Export History */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Exports</CardTitle>
              <CardDescription>View and manage your export history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockExportJobs.map((job) => (
                  <div key={job.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{job.name}</h4>
                          <Badge 
                            variant={
                              job.status === 'completed' ? 'default' :
                              job.status === 'processing' ? 'secondary' :
                              job.status === 'failed' ? 'destructive' : 'outline'
                            }
                          >
                            {job.status}
                          </Badge>
                          <Badge variant="outline">{job.format}</Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {job.createdAt}
                          </span>
                          {job.size && (
                            <span>📁 {job.size}</span>
                          )}
                          {job.estimatedCompletion && (
                            <span>⏱️ {job.estimatedCompletion} remaining</span>
                          )}
                        </div>

                        {job.status === 'processing' && (
                          <div className="mt-3">
                            <Progress value={job.progress} className="h-2" />
                            <p className="text-xs text-gray-500 mt-1">{job.progress}% complete</p>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {job.status === 'completed' && (
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </Button>
                        )}
                        {job.status === 'failed' && (
                          <Button variant="outline" size="sm">
                            <RefreshCw className="w-4 h-4 mr-1" />
                            Retry
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Templates</CardTitle>
              <CardDescription>Manage and customize report templates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportTemplates.map((template) => (
                  <Card key={template.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold">{template.name}</h4>
                        <Badge variant="secondary">{template.category}</Badge>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                      
                      <div className="space-y-2 text-xs text-gray-500 mb-4">
                        <div>📊 Sections: {template.sections.join(', ')}</div>
                        <div>💾 Size: {template.estimatedSize}</div>
                        <div>⏱️ Time: {template.generationTime}</div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          Edit
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          Duplicate
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t">
                <Button variant="outline" className="w-full">
                  <Settings className="w-4 h-4 mr-2" />
                  Create Custom Template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}