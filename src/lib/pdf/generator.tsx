// src/lib/pdf/generator.ts
import { pdf } from '@react-pdf/renderer';
import { EventsPDFTemplate } from '../../components/pdf/EventsPDFTemplate';
import { saveAs } from 'file-saver';
import { generateFilename } from '../utils/export';

// Types
export interface PDFGenerationOptions {
  filename?: string;
  includeTimestamp?: boolean;
  title?: string;
  subtitle?: string;
  organizationName?: string;
  contactInfo?: {
    email?: string;
    phone?: string;
    website?: string;
  };
}

export interface EventPDFData {
  event?: any;
  sessions?: any[];
  registrations?: any[];
  faculty?: any[];
  halls?: any[];
}

// PDF Generator Class
export class PDFGenerator {
  
  // Generate PDF from event data
  static async generateEventPDF(
    data: EventPDFData, 
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    try {
      console.log('🔄 Starting PDF generation...');
      
      // Default options
      const {
        title = "Event Export",
        subtitle = "Conference Management System Report",
        organizationName = "Conference Management System",
        filename,
        includeTimestamp = true,
        contactInfo
      } = options;
      
      // Create PDF document
      const MyDocument = (
        <EventsPDFTemplate
          data={data}
          title={title}
          subtitle={subtitle}
          isMultipleEvents={false}
        />
      );

      if (!MyDocument) {
        throw new Error('PDF template did not return a valid React element.');
      }
      
      // Generate PDF blob
      console.log('📄 Rendering PDF document...');
      const blob = await pdf(MyDocument).toBlob();
      
      console.log('✅ PDF generated successfully');
      return blob;
      
    } catch (error) {
      console.error('❌ PDF generation failed:', error);
      throw new Error(`Failed to generate PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Generate PDF for multiple events
  static async generateMultipleEventsPDF(
    events: any[],
    allData: EventPDFData,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    try {
      console.log('🔄 Starting multi-event PDF generation...');
      
      const {
        title = "Events Export",
        subtitle = "Conference Management System Report",
        organizationName = "Conference Management System",
        filename,
        includeTimestamp = true,
        contactInfo
      } = options;
      const MyDocument = (
        <EventsPDFTemplate
          data={allData}
          title={title}
          subtitle={subtitle}
          isMultipleEvents={true}
          events={events}
        />
      );

      if (!MyDocument) {
        throw new Error('PDF template did not return a valid React element.');
      }
      
      // Generate PDF blob
      console.log('📄 Rendering multi-event PDF document...');
      const blob = await pdf(MyDocument).toBlob();
      
      console.log('✅ Multi-event PDF generated successfully');
      return blob;
      console.log('✅ Multi-event PDF generated successfully');
      return blob;
      
    } catch (error) {
      console.error('❌ Multi-event PDF generation failed:', error);
      throw new Error(`Failed to generate multi-event PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Generate and download PDF
  static async generateAndDownloadPDF(
    data: EventPDFData,
    options: PDFGenerationOptions = {}
  ): Promise<{ success: boolean; filename: string; blob: Blob }> {
    try {
      // Generate PDF blob
      const blob = await this.generateEventPDF(data, options);
      
      // Generate filename
      const filename = options.filename || generateFilename(
        data.event?.name ? `event-${data.event.name.replace(/[^a-zA-Z0-9]/g, '-')}` : 'event-export',
        'pdf',
        options.includeTimestamp
      );
      
      // Download file
      console.log('💾 Downloading PDF file:', filename);
      saveAs(blob, filename);
      
      return {
        success: true,
        filename,
        blob
      };
      
    } catch (error) {
      console.error('❌ PDF download failed:', error);
      throw error;
    }
  }
  
  // Generate PDF from API endpoint
  static async generatePDFFromAPI(
    eventId?: string,
    options: PDFGenerationOptions = {}
  ): Promise<Blob> {
    try {
      console.log('🔄 Fetching data from API for PDF generation...');
      
      // Construct API URL
      const url = eventId 
        ? `/api/events/export/pdf?eventId=${eventId}`
        : '/api/events/export/pdf';
      
      // Fetch data from API
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/pdf',
        },
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      console.log('✅ PDF received from API');
      return await response.blob();
      
    } catch (error) {
      console.error('❌ API PDF generation failed:', error);
      throw new Error(`Failed to generate PDF from API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Utility: Get PDF as base64 string
  static async generatePDFAsBase64(
    data: EventPDFData,
    options: PDFGenerationOptions = {}
  ): Promise<string> {
    try {
      const blob = await this.generateEventPDF(data, options);
      
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64 = (reader.result as string).split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
      
    } catch (error) {
      throw new Error(`Failed to generate PDF as base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Utility: Generate PDF for sharing
  static async generatePDFForSharing(
    data: EventPDFData,
    options: PDFGenerationOptions = {}
  ): Promise<{ blob: Blob; filename: string; shareUrl?: string }> {
    try {
      const blob = await this.generateEventPDF(data, options);
      
      const filename = options.filename || generateFilename(
        data.event?.name ? `event-${data.event.name.replace(/[^a-zA-Z0-9]/g, '-')}` : 'event-export',
        'pdf',
        options.includeTimestamp !== false
      );
      
      // Create temporary URL for sharing (if supported)
      let shareUrl: string | undefined;
      try {
        shareUrl = URL.createObjectURL(blob);
      } catch (e) {
        console.warn('Could not create share URL:', e);
      }
      
      return {
        blob,
        filename,
        shareUrl
      };
      
    } catch (error) {
      throw new Error(`Failed to generate PDF for sharing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // Progress tracking for large PDFs
  static async generatePDFWithProgress(
    data: EventPDFData,
    options: PDFGenerationOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    try {
      // Simulate progress for user feedback
      onProgress?.(10);
      
      console.log('🔄 Preparing PDF data...');
      onProgress?.(30);
      
      // Generate PDF
      const blob = await this.generateEventPDF(data, options);
      onProgress?.(90);
      
      console.log('✅ PDF generation completed');
      onProgress?.(100);
      
      return blob;
      
    } catch (error) {
      onProgress?.(0);
      throw error;
    }
  }
  
  // Validate data before PDF generation
  static validatePDFData(data: EventPDFData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Check if any data exists
    if (!data.event && (!data.sessions || data.sessions.length === 0) && 
        (!data.registrations || data.registrations.length === 0) &&
        (!data.faculty || data.faculty.length === 0) &&
        (!data.halls || data.halls.length === 0)) {
      errors.push('No data available for PDF generation');
    }
    
    // Validate event data if present
    if (data.event) {
      if (!data.event.name || data.event.name.trim() === '') {
        errors.push('Event name is required');
      }
    }
    
    // Validate sessions data
    if (data.sessions && data.sessions.length > 0) {
      const invalidSessions = data.sessions.filter(session => !session.title);
      if (invalidSessions.length > 0) {
        errors.push(`${invalidSessions.length} sessions have missing titles`);
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
  
  // Get PDF generation statistics
  static async getPDFStats(data: EventPDFData): Promise<{
    estimatedSize: string;
    pageCount: number;
    contentSections: string[];
    generationTime: string;
  }> {
    const sections: string[] = [];
    let estimatedPages = 1; // Header page
    
    if (data.event) {
      sections.push('Event Details');
      estimatedPages += 1;
    }
    
    if (data.sessions && data.sessions.length > 0) {
      sections.push(`Sessions (${data.sessions.length})`);
      estimatedPages += Math.ceil(data.sessions.length / 20); // ~20 sessions per page
    }
    
    if (data.faculty && data.faculty.length > 0) {
      sections.push(`Faculty (${data.faculty.length})`);
      estimatedPages += Math.ceil(data.faculty.length / 30); // ~30 faculty per page
    }
    
    if (data.registrations && data.registrations.length > 0) {
      sections.push(`Registrations (${data.registrations.length})`);
      estimatedPages += Math.ceil(data.registrations.length / 40); // ~40 registrations per page
    }
    
    if (data.halls && data.halls.length > 0) {
      sections.push(`Halls (${data.halls.length})`);
    }
    
    // Estimate file size (rough calculation)
    const estimatedSizeKB = estimatedPages * 50; // ~50KB per page
    const estimatedSize = estimatedSizeKB > 1024 
      ? `${(estimatedSizeKB / 1024).toFixed(1)} MB`
      : `${estimatedSizeKB} KB`;
    
    // Estimate generation time
    const baseTime = 5; // 5 seconds base
    const additionalTime = Math.max(0, (estimatedPages - 2) * 2); // 2 seconds per additional page
    const totalTime = baseTime + additionalTime;
    const generationTime = totalTime > 60 
      ? `${Math.ceil(totalTime / 60)} minute${Math.ceil(totalTime / 60) > 1 ? 's' : ''}`
      : `${totalTime} seconds`;
    
    return {
      estimatedSize,
      pageCount: estimatedPages,
      contentSections: sections,
      generationTime
    };
  }
}

// Export utility functions
export const {
  generateEventPDF,
  generateMultipleEventsPDF,
  generateAndDownloadPDF,
  generatePDFFromAPI,
  generatePDFAsBase64,
  generatePDFForSharing,
  generatePDFWithProgress,
  validatePDFData,
  getPDFStats
} = PDFGenerator;