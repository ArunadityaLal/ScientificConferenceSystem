import QRCode from 'qrcode';
import { randomBytes } from 'crypto';

export interface QRAttendanceData {
  sessionId: string;
  eventId: string;
  timestamp: number;
  expiresAt: number;
  token: string;
  hallId?: string;
  sessionName?: string;
}

export interface QRGenerationOptions {
  sessionId: string;
  eventId: string;
  hallId?: string;
  sessionName?: string;
  expiryMinutes?: number; // Default: 30 minutes
  size?: number; // QR code size in pixels
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Error correction level
}

export class QRAttendanceGenerator {
  private static readonly DEFAULT_EXPIRY_MINUTES = 30;
  private static readonly DEFAULT_SIZE = 300;
  private static readonly DEFAULT_ERROR_CORRECTION = 'M';

  /**
   * Generate secure attendance QR code data
   */
  static generateQRData(options: QRGenerationOptions): QRAttendanceData {
    const {
      sessionId,
      eventId,
      hallId,
      sessionName,
      expiryMinutes = this.DEFAULT_EXPIRY_MINUTES
    } = options;

    const timestamp = Date.now();
    const expiresAt = timestamp + (expiryMinutes * 60 * 1000);
    
    // Generate secure token
    const token = this.generateSecureToken(sessionId, eventId, timestamp);

    return {
      sessionId,
      eventId,
      timestamp,
      expiresAt,
      token,
      hallId,
      sessionName
    };
  }

  /**
   * Generate QR code as Data URL
   */
  static async generateQRCodeDataURL(
    options: QRGenerationOptions
  ): Promise<string> {
    const qrData = this.generateQRData(options);
    const qrString = JSON.stringify(qrData);

    const qrOptions = {
      width: options.size || this.DEFAULT_SIZE,
      errorCorrectionLevel: options.errorCorrectionLevel || this.DEFAULT_ERROR_CORRECTION,
      type: 'image/png' as const,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    try {
      const dataURL = await QRCode.toDataURL(qrString, qrOptions);
      return dataURL;
    } catch (error) {
      console.error('QR Code generation failed:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  /**
   * Generate QR code as Buffer
   */
  static async generateQRCodeBuffer(
    options: QRGenerationOptions
  ): Promise<Buffer> {
    const qrData = this.generateQRData(options);
    const qrString = JSON.stringify(qrData);

    const qrOptions = {
      width: options.size || this.DEFAULT_SIZE,
      errorCorrectionLevel: options.errorCorrectionLevel || this.DEFAULT_ERROR_CORRECTION,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    try {
      const buffer = await QRCode.toBuffer(qrString, qrOptions);
      return buffer;
    } catch (error) {
      console.error('QR Code buffer generation failed:', error);
      throw new Error('Failed to generate QR code buffer');
    }
  }

  /**
   * Generate QR code as SVG string
   */
  static async generateQRCodeSVG(
    options: QRGenerationOptions
  ): Promise<string> {
    const qrData = this.generateQRData(options);
    const qrString = JSON.stringify(qrData);

    const qrOptions = {
      width: options.size || this.DEFAULT_SIZE,
      errorCorrectionLevel: options.errorCorrectionLevel || this.DEFAULT_ERROR_CORRECTION,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    };

    try {
      const svg = await QRCode.toString(qrString, { 
        ...qrOptions, 
        type: 'svg' 
      });
      return svg;
    } catch (error) {
      console.error('QR Code SVG generation failed:', error);
      throw new Error('Failed to generate QR code SVG');
    }
  }

  /**
   * Bulk generate QR codes for multiple sessions
   */
  static async generateBulkQRCodes(
    sessions: Array<{
      sessionId: string;
      eventId: string;
      hallId?: string;
      sessionName?: string;
    }>,
    options?: Partial<QRGenerationOptions>
  ): Promise<Array<{
    sessionId: string;
    sessionName?: string;
    qrDataURL: string;
    qrData: QRAttendanceData;
  }>> {
    const results = await Promise.all(
      sessions.map(async (session) => {
        const qrOptions: QRGenerationOptions = {
          ...options,
          ...session
        };

        const qrDataURL = await this.generateQRCodeDataURL(qrOptions);
        const qrData = this.generateQRData(qrOptions);

        return {
          sessionId: session.sessionId,
          sessionName: session.sessionName,
          qrDataURL,
          qrData
        };
      })
    );

    return results;
  }

  /**
   * Validate QR attendance data
   */
  static validateQRData(qrString: string): {
    isValid: boolean;
    data?: QRAttendanceData;
    error?: string;
  } {
    try {
      const data: QRAttendanceData = JSON.parse(qrString);

      // Check required fields
      if (!data.sessionId || !data.eventId || !data.token || !data.expiresAt) {
        return {
          isValid: false,
          error: 'Missing required fields in QR data'
        };
      }

      // Check expiry
      if (Date.now() > data.expiresAt) {
        return {
          isValid: false,
          error: 'QR code has expired'
        };
      }

      // Validate token format (basic check)
      if (data.token.length < 32) {
        return {
          isValid: false,
          error: 'Invalid token format'
        };
      }

      return {
        isValid: true,
        data
      };

    } catch (error) {
      return {
        isValid: false,
        error: 'Invalid QR code format'
      };
    }
  }

  /**
   * Generate secure token for QR code
   */
  private static generateSecureToken(
    sessionId: string, 
    eventId: string, 
    timestamp: number
  ): string {
    const randomPart = randomBytes(16).toString('hex');
    const hashBase = `${sessionId}-${eventId}-${timestamp}-${randomPart}`;
    
    // Create a hash-like token (you might want to use actual crypto hashing)
    const encoder = new TextEncoder();
    const data = encoder.encode(hashBase);
    let hash = 0;

    for (let i = 0; i < (data?.length ?? 0); i++) {
      hash = ((hash << 5) - hash + data[i]!) & 0xffffffff;
    }

    return `${randomPart}${Math.abs(hash).toString(16)}`;
  }

  /**
   * Get QR code expiry status
   */
  static getExpiryStatus(qrData: QRAttendanceData): {
    isExpired: boolean;
    expiresIn: number; // milliseconds
    expiresInMinutes: number;
  } {
    const now = Date.now();
    const expiresIn = qrData.expiresAt - now;
    const expiresInMinutes = Math.ceil(expiresIn / (1000 * 60));

    return {
      isExpired: expiresIn <= 0,
      expiresIn: Math.max(0, expiresIn),
      expiresInMinutes: Math.max(0, expiresInMinutes)
    };
  }

  /**
   * Refresh QR code (generate new one with same session but new expiry)
   */
  static async refreshQRCode(
    originalData: QRAttendanceData,
    expiryMinutes?: number
  ): Promise<{
    qrDataURL: string;
    qrData: QRAttendanceData;
  }> {
    const options: QRGenerationOptions = {
      sessionId: originalData.sessionId,
      eventId: originalData.eventId,
      hallId: originalData.hallId,
      sessionName: originalData.sessionName,
      expiryMinutes: expiryMinutes || this.DEFAULT_EXPIRY_MINUTES
    };

    const qrDataURL = await this.generateQRCodeDataURL(options);
    const qrData = this.generateQRData(options);

    return { qrDataURL, qrData };
  }
}