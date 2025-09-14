// src/lib/pdf/certificate-generator.ts

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface CertificateData {
  recipientName: string;
  eventName: string;
  eventDate: string;
  role: string; // 'Faculty', 'Delegate', 'Speaker', 'Chairperson'
  organizationName: string;
  eventLocation: string;
  certificateId: string;
  issueDate: string;
  sessionDetails?: string;
  signatureImageUrl?: string;
  logoImageUrl?: string;
}

export interface CertificateTemplate {
  id: string;
  name: string;
  design: 'modern' | 'classic' | 'elegant' | 'minimal';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
}

export class CertificateGenerator {
  private static defaultTemplate: CertificateTemplate = {
    id: 'default',
    name: 'Default Template',
    design: 'modern',
    primaryColor: '#1e40af',
    secondaryColor: '#fbbf24',
    fontFamily: 'Times, serif'
  };

  /**
   * Generate certificate PDF from HTML element
   */
  static async generatePDFFromElement(
    element: HTMLElement,
    filename?: string
  ): Promise<Blob> {
    try {
      // Convert HTML to canvas
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      // Create PDF
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Calculate aspect ratio
      const aspectRatio = canvas.width / canvas.height;
      let imgWidth = pdfWidth;
      let imgHeight = pdfWidth / aspectRatio;

      // Adjust if height exceeds page
      if (imgHeight > pdfHeight) {
        imgHeight = pdfHeight;
        imgWidth = pdfHeight * aspectRatio;
      }

      // Center the image
      const x = (pdfWidth - imgWidth) / 2;
      const y = (pdfHeight - imgHeight) / 2;

      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);

      return pdf.output('blob');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate certificate PDF');
    }
  }

  /**
   * Generate certificate HTML string
   */
  static generateCertificateHTML(
    data: CertificateData,
    template: CertificateTemplate = this.defaultTemplate
  ): string {
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
      `Certificate ID: ${data.certificateId}`
    )}`;

    return `
      <div class="certificate-container" style="
        width: 297mm;
        height: 210mm;
        padding: 20mm;
        background: linear-gradient(135deg, ${template.primaryColor}15, ${template.secondaryColor}15);
        font-family: ${template.fontFamily};
        position: relative;
        box-sizing: border-box;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        border: 3px solid ${template.primaryColor};
      ">
        <!-- Header -->
        <div class="certificate-header" style="margin-bottom: 30px;">
          ${data.logoImageUrl ? `
            <img src="${data.logoImageUrl}" alt="Logo" style="
              height: 60px;
              margin-bottom: 20px;
            ">
          ` : ''}
          <h1 style="
            font-size: 48px;
            color: ${template.primaryColor};
            margin: 0;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 3px;
          ">Certificate</h1>
          <h2 style="
            font-size: 24px;
            color: ${template.secondaryColor};
            margin: 10px 0 0 0;
            font-weight: normal;
            text-transform: uppercase;
            letter-spacing: 2px;
          ">of ${data.role === 'Faculty' ? 'Appreciation' : 'Participation'}</h2>
        </div>

        <!-- Decorative Line -->
        <div style="
          width: 150px;
          height: 3px;
          background: linear-gradient(to right, ${template.primaryColor}, ${template.secondaryColor});
          margin: 0 auto 40px auto;
        "></div>

        <!-- Content -->
        <div class="certificate-content" style="margin-bottom: 40px;">
          <p style="
            font-size: 18px;
            color: #333;
            margin: 0 0 30px 0;
            line-height: 1.6;
          ">This is to certify that</p>
          
          <h3 style="
            font-size: 36px;
            color: ${template.primaryColor};
            margin: 0 0 30px 0;
            font-weight: bold;
            text-decoration: underline;
            text-decoration-color: ${template.secondaryColor};
          ">${data.recipientName}</h3>

          <p style="
            font-size: 18px;
            color: #333;
            margin: 0 0 20px 0;
            line-height: 1.8;
            max-width: 600px;
          ">
            has successfully ${data.role === 'Faculty' ? 'contributed as a faculty member' : 'participated'} in the
          </p>

          <h4 style="
            font-size: 28px;
            color: ${template.primaryColor};
            margin: 0 0 20px 0;
            font-weight: bold;
          ">${data.eventName}</h4>

          <p style="
            font-size: 16px;
            color: #666;
            margin: 0 0 20px 0;
          ">
            held at ${data.eventLocation} on ${data.eventDate}
          </p>

          ${data.sessionDetails ? `
            <p style="
              font-size: 14px;
              color: #777;
              margin: 0;
              font-style: italic;
            ">${data.sessionDetails}</p>
          ` : ''}
        </div>

        <!-- Footer -->
        <div class="certificate-footer" style="
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          width: 100%;
          margin-top: auto;
        ">
          <!-- Signature Section -->
          <div style="text-align: left;">
            ${data.signatureImageUrl ? `
              <img src="${data.signatureImageUrl}" alt="Signature" style="
                height: 40px;
                margin-bottom: 10px;
              ">
            ` : `
              <div style="
                width: 150px;
                height: 2px;
                background: #333;
                margin-bottom: 10px;
              "></div>
            `}
            <p style="
              font-size: 14px;
              color: #333;
              margin: 0;
              font-weight: bold;
            ">Authorized Signature</p>
            <p style="
              font-size: 12px;
              color: #666;
              margin: 5px 0 0 0;
            ">${data.organizationName}</p>
          </div>

          <!-- QR Code & Certificate Details -->
          <div style="text-align: right;">
            <img src="${qrCodeUrl}" alt="QR Code" style="
              width: 60px;
              height: 60px;
              margin-bottom: 10px;
            ">
            <p style="
              font-size: 10px;
              color: #666;
              margin: 0;
            ">Certificate ID: ${data.certificateId}</p>
            <p style="
              font-size: 10px;
              color: #666;
              margin: 2px 0 0 0;
            ">Issued on: ${data.issueDate}</p>
          </div>
        </div>

        <!-- Decorative Border Elements -->
        <div style="
          position: absolute;
          top: 15px;
          left: 15px;
          width: 30px;
          height: 30px;
          border-left: 4px solid ${template.secondaryColor};
          border-top: 4px solid ${template.secondaryColor};
        "></div>
        <div style="
          position: absolute;
          top: 15px;
          right: 15px;
          width: 30px;
          height: 30px;
          border-right: 4px solid ${template.secondaryColor};
          border-top: 4px solid ${template.secondaryColor};
        "></div>
        <div style="
          position: absolute;
          bottom: 15px;
          left: 15px;
          width: 30px;
          height: 30px;
          border-left: 4px solid ${template.secondaryColor};
          border-bottom: 4px solid ${template.secondaryColor};
        "></div>
        <div style="
          position: absolute;
          bottom: 15px;
          right: 15px;
          width: 30px;
          height: 30px;
          border-right: 4px solid ${template.secondaryColor};
          border-bottom: 4px solid ${template.secondaryColor};
        "></div>
      </div>
    `;
  }

  /**
   * Generate single certificate
   */
  static async generateSingleCertificate(
    data: CertificateData,
    template?: CertificateTemplate
  ): Promise<Blob> {
    try {
      // Create temporary container
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.innerHTML = this.generateCertificateHTML(data, template);

      document.body.appendChild(container);

      // Generate PDF
      const certificateElement = container.querySelector('.certificate-container') as HTMLElement;
      const pdfBlob = await this.generatePDFFromElement(certificateElement);

      // Cleanup
      document.body.removeChild(container);

      return pdfBlob;
    } catch (error) {
      console.error('Error generating single certificate:', error);
      throw error;
    }
  }

  /**
   * Generate multiple certificates
   */
  static async generateBulkCertificates(
    certificates: CertificateData[],
    template?: CertificateTemplate,
    onProgress?: (completed: number, total: number) => void
  ): Promise<Blob[]> {
    const results: Blob[] = [];

    for (let i = 0; i < certificates.length; i++) {
      const certificate = certificates[i];
      if (!certificate) {
        console.error(`Certificate data at index ${i} is undefined.`);
        continue;
      }
      try {
        const pdfBlob = await this.generateSingleCertificate(certificate, template);
        results.push(pdfBlob);
        
        if (onProgress) {
          onProgress(i + 1, certificates.length);
        }
      } catch (error) {
        console.error(`Error generating certificate ${i + 1}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Download certificate as PDF
   */
  static downloadPDF(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  /**
   * Generate certificate ID
   */
  static generateCertificateId(eventId: string, userId: string): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `CERT-${eventId}-${userId}-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Validate certificate data
   */
  static validateCertificateData(data: CertificateData): boolean {
    const requiredFields = [
      'recipientName',
      'eventName',
      'eventDate',
      'role',
      'organizationName',
      'eventLocation',
      'certificateId',
      'issueDate'
    ];

    return requiredFields.every(field => 
      data[field as keyof CertificateData] && 
      String(data[field as keyof CertificateData]).trim().length > 0
    );
  }

  /**
   * Get available templates
   */
  static getAvailableTemplates(): CertificateTemplate[] {
    return [
      {
        id: 'modern',
        name: 'Modern Blue',
        design: 'modern',
        primaryColor: '#1e40af',
        secondaryColor: '#fbbf24',
        fontFamily: 'Arial, sans-serif'
      },
      {
        id: 'classic',
        name: 'Classic Red',
        design: 'classic',
        primaryColor: '#dc2626',
        secondaryColor: '#f59e0b',
        fontFamily: 'Times, serif'
      },
      {
        id: 'elegant',
        name: 'Elegant Purple',
        design: 'elegant',
        primaryColor: '#7c3aed',
        secondaryColor: '#ec4899',
        fontFamily: 'Georgia, serif'
      },
      {
        id: 'minimal',
        name: 'Minimal Green',
        design: 'minimal',
        primaryColor: '#059669',
        secondaryColor: '#0891b2',
        fontFamily: 'Helvetica, sans-serif'
      }
    ];
  }
}