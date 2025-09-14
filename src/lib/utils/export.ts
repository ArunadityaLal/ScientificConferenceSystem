// src/lib/utils/export.ts
import * as XLSX from 'xlsx';

// Types
export interface ExportData {
  event?: any;
  sessions?: any[];
  registrations?: any[];
  faculty?: any[];
  halls?: any[];
}

export interface ExportOptions {
  filename?: string;
  includeTimestamp?: boolean;
  format?: 'pdf' | 'excel' | 'csv';
}

// Date formatting utilities
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return 'Not specified';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Not specified';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid date';
    
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid date';
  }
};

export const formatTime = (date: string | Date | null | undefined): string => {
  if (!date) return 'Not specified';
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid time';
    
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    return 'Invalid time';
  }
};

// Status formatting
export const formatStatus = (status: string): string => {
  if (!status) return 'Unknown';
  
  return status
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Generate filename with timestamp
export const generateFilename = (baseName: string, extension: string, includeTimestamp = true): string => {
  const timestamp = includeTimestamp 
    ? new Date().toISOString().slice(0, 19).replace(/:/g, '-')
    : '';
  
  const parts = [baseName, timestamp].filter(Boolean);
  return `${parts.join('-')}.${extension}`;
};

// ✅ ENHANCED - Excel Export Functions with better faculty support
export const exportToExcel = async (data: ExportData, options: ExportOptions = {}) => {
  try {
    const workbook = XLSX.utils.book_new();
    
    // Event Details Sheet
    if (data.event) {
      const eventData = [
        ['Event Details', ''],
        ['Name', data.event.name || 'Untitled Event'],
        ['Description', data.event.description || 'No description'],
        ['Start Date', formatDateTime(data.event.startDate)],
        ['End Date', formatDateTime(data.event.endDate)],
        ['Location', data.event.location || 'TBD'],
        ['Status', formatStatus(data.event.status)],
        ['Created', formatDateTime(data.event.createdAt)],
        ['Max Participants', data.event.maxParticipants || 'Not specified'],
      ];
      
      const eventSheet = XLSX.utils.aoa_to_sheet(eventData);
      XLSX.utils.book_append_sheet(workbook, eventSheet, 'Event Details');
    }
    
    // Sessions Sheet
    if (data.sessions && data.sessions.length > 0) {
      const sessionHeaders = ['Title', 'Start Time', 'End Time', 'Hall', 'Speakers'];
      const sessionRows = data.sessions.map(session => [
        session.title || 'Untitled Session',
        formatDateTime(session.startTime),
        formatDateTime(session.endTime),
        session.hall?.name || 'TBD',
        session.speakers?.map((s: any) => s.name).join(', ') || 'TBD'
      ]);
      
      const sessionData = [sessionHeaders, ...sessionRows];
      const sessionSheet = XLSX.utils.aoa_to_sheet(sessionData);
      XLSX.utils.book_append_sheet(workbook, sessionSheet, 'Sessions');
    }
    
    // ✅ ENHANCED - Faculty Sheet with comprehensive data
    if (data.faculty && data.faculty.length > 0) {
      // Determine headers based on available data
      const sampleFaculty = data.faculty[0];
      const hasEventData = 'Event Name' in sampleFaculty;
      
      const facultyHeaders = [
        'Name', 
        'Email', 
        'Phone', 
        'Designation', 
        'Institution', 
        'Specialization',
        'Experience (Years)',
        'Sessions Count',
        'Latest Session',
        'Dietary Requirements',
        'Joined Date'
      ];

      // Add event-specific headers if available
      if (hasEventData) {
        facultyHeaders.push(
          'Event Name',
          'Event Role',
          'Event Status',
          'Invited Date',
          'Event Start',
          'Event End'
        );
      }

      const facultyRows = data.faculty.map(faculty => {
        const baseRow = [
          faculty['Name'] || faculty.name || 'Unknown',
          faculty['Email'] || faculty.email || 'No email',
          faculty['Phone'] || faculty.phone || '',
          faculty['Designation'] || faculty.designation || '',
          faculty['Institution'] || faculty.institution || '',
          faculty['Specialization'] || faculty.specialization || '',
          faculty['Experience (Years)'] || faculty.experience || '',
          faculty['Sessions Count'] || 0,
          faculty['Latest Session'] || '',
          faculty['Dietary Requirements'] || faculty.dietaryRequirements || '',
          faculty['Joined Date'] || formatDate(faculty.createdAt) || ''
        ];

        // Add event-specific data if available
        if (hasEventData) {
          baseRow.push(
            faculty['Event Name'] || '',
            faculty['Event Role'] || '',
            faculty['Event Status'] || '',
            faculty['Invited Date'] || '',
            faculty['Event Start'] || '',
            faculty['Event End'] || ''
          );
        }

        return baseRow;
      });
      
      const facultyData = [facultyHeaders, ...facultyRows];
      const facultySheet = XLSX.utils.aoa_to_sheet(facultyData);
      
      // Set column widths for better readability
      const columnWidths = [
        { wch: 20 }, // Name
        { wch: 25 }, // Email
        { wch: 15 }, // Phone
        { wch: 20 }, // Designation
        { wch: 25 }, // Institution
        { wch: 20 }, // Specialization
        { wch: 12 }, // Experience
        { wch: 12 }, // Sessions Count
        { wch: 30 }, // Latest Session
        { wch: 20 }, // Dietary Requirements
        { wch: 15 }, // Joined Date
      ];

      if (hasEventData) {
        columnWidths.push(
          { wch: 25 }, // Event Name
          { wch: 15 }, // Event Role
          { wch: 15 }, // Event Status
          { wch: 15 }, // Invited Date
          { wch: 15 }, // Event Start
          { wch: 15 }  // Event End
        );
      }

      facultySheet['!cols'] = columnWidths;
      
      XLSX.utils.book_append_sheet(workbook, facultySheet, 'Faculty');
    }
    
    // Registrations Sheet
    if (data.registrations && data.registrations.length > 0) {
      const regHeaders = ['Name', 'Email', 'Status', 'Registration Date', 'Institution'];
      const regRows = data.registrations.map(reg => [
        reg.user?.name || 'Unknown',
        reg.user?.email || 'No email',
        formatStatus(reg.status),
        formatDateTime(reg.createdAt),
        reg.user?.institution || 'Not specified'
      ]);
      
      const regData = [regHeaders, ...regRows];
      const regSheet = XLSX.utils.aoa_to_sheet(regData);
      XLSX.utils.book_append_sheet(workbook, regSheet, 'Registrations');
    }
    
    // Halls Sheet
    if (data.halls && data.halls.length > 0) {
      const hallHeaders = ['Name', 'Capacity', 'Equipment'];
      const hallRows = data.halls.map(hall => [
        hall.name || 'Unnamed Hall',
        hall.capacity || 0,
        hall.equipment ? JSON.stringify(hall.equipment) : 'None specified'
      ]);
      
      const hallData = [hallHeaders, ...hallRows];
      const hallSheet = XLSX.utils.aoa_to_sheet(hallData);
      XLSX.utils.book_append_sheet(workbook, hallSheet, 'Halls');
    }
    
    // Generate and download file
    const filename = options.filename || generateFilename('export', 'xlsx', options.includeTimestamp);
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { 
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
    });
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename };
    
  } catch (error) {
    console.error('Excel export error:', error);
    throw new Error('Failed to export Excel file');
  }
};

// ✅ ENHANCED - CSV Export Functions
export const exportToCSV = (data: any[], filename: string, headers?: string[]) => {
  try {
    if (!data || data.length === 0) {
      throw new Error('No data to export');
    }
    
    // Generate headers if not provided
    const csvHeaders = headers || Object.keys(data[0]);
    
    // Convert data to CSV format
    const csvContent = [
      csvHeaders.join(','),
      ...data.map(row => 
        csvHeaders.map(header => {
          const value = row[header];
          // Handle special characters and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value || '';
        }).join(',')
      )
    ].join('\n');
    
    // Create and download blob
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const csvFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
    
    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = csvFilename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true, filename: csvFilename };
    
  } catch (error) {
    console.error('CSV export error:', error);
    throw new Error('Failed to export CSV file');
  }
};

// PDF Export Function (calls API)
export const exportToPDF = async (eventId?: string, options: ExportOptions = {}) => {
  try {
    const url = eventId 
      ? `/api/events/export/pdf?eventId=${eventId}`
      : '/api/events/export/pdf';
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`PDF export failed: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    const filename = options.filename || generateFilename('export', 'pdf', options.includeTimestamp);
    
    // Create download link
    const url2 = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url2;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url2);
    
    return { success: true, filename };
    
  } catch (error) {
    console.error('PDF export error:', error);
    throw new Error('Failed to export PDF');
  }
};

// Share Functions
export const shareViaWebAPI = async (data: { title: string; text: string; url?: string; file?: Blob }) => {
  try {
    if (navigator.share) {
      const shareData: any = {
        title: data.title,
        text: data.text,
      };
      
      if (data.url) shareData.url = data.url;
      if (data.file) shareData.files = [data.file];
      
      await navigator.share(shareData);
      return { success: true, method: 'native' };
    } else {
      // Fallback to clipboard
      const textToShare = `${data.title}\n${data.text}${data.url ? `\n${data.url}` : ''}`;
      await navigator.clipboard.writeText(textToShare);
      return { success: true, method: 'clipboard' };
    }
  } catch (error) {
    console.error('Share error:', error);
    throw new Error('Failed to share content');
  }
};

export const shareViaWhatsApp = (text: string, url?: string) => {
  const message = encodeURIComponent(`${text}${url ? `\n${url}` : ''}`);
  const whatsappUrl = `https://wa.me/?text=${message}`;
  window.open(whatsappUrl, '_blank');
  return { success: true, method: 'whatsapp' };
};

export const shareViaEmail = (subject: string, body: string, attachmentName?: string) => {
  const emailBody = encodeURIComponent(body);
  const emailSubject = encodeURIComponent(subject);
  const mailtoUrl = `mailto:?subject=${emailSubject}&body=${emailBody}`;
  window.open(mailtoUrl);
  return { success: true, method: 'email' };
};

export const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true, method: 'clipboard' };
  } catch (error) {
    // Fallback method
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return { success: true, method: 'fallback' };
  }
};

// Validation functions
export const validateExportData = (data: ExportData): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.event && !data.sessions && !data.registrations && !data.faculty && !data.halls) {
    errors.push('No data available for export');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// File size utilities
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Progress tracking for large exports
export class ExportProgress {
  private callbacks: ((progress: number) => void)[] = [];
  private progress = 0;
  
  onProgress(callback: (progress: number) => void) {
    this.callbacks.push(callback);
  }
  
  updateProgress(progress: number) {
    this.progress = Math.max(0, Math.min(100, progress));
    this.callbacks.forEach(callback => callback(this.progress));
  }
  
  getProgress(): number {
    return this.progress;
  }
  
  complete() {
    this.updateProgress(100);
  }
  
  reset() {
    this.updateProgress(0);
  }
}