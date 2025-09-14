// src/components/certificates/certificate-template.tsx

'use client';

import React, { forwardRef, useRef, useImperativeHandle } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Eye, Share2, QrCode } from 'lucide-react';
import { CertificateData, CertificateTemplate, CertificateGenerator } from '@/lib/pdf/certificate-generator';

interface CertificateTemplateProps {
  data: CertificateData;
  template: CertificateTemplate;
  showControls?: boolean;
  isPreview?: boolean;
  onDownload?: () => void;
  onShare?: () => void;
  className?: string;
}

export interface CertificateTemplateRef {
  downloadPDF: () => Promise<void>;
  getElement: () => HTMLElement | null;
}

const CertificateTemplateComponent = forwardRef<CertificateTemplateRef, CertificateTemplateProps>(
  ({ data, template, showControls = true, isPreview = false, onDownload, onShare, className }, ref) => {
    const certificateRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      downloadPDF: async () => {
        if (certificateRef.current) {
          try {
            const blob = await CertificateGenerator.generatePDFFromElement(certificateRef.current);
            CertificateGenerator.downloadPDF(blob, `certificate-${data.certificateId}`);
            onDownload?.();
          } catch (error) {
            console.error('Error downloading PDF:', error);
          }
        }
      },
      getElement: () => certificateRef.current
    }));

    const handleDownload = async () => {
      if (certificateRef.current) {
        try {
          const blob = await CertificateGenerator.generatePDFFromElement(certificateRef.current);
          CertificateGenerator.downloadPDF(blob, `certificate-${data.certificateId}`);
          onDownload?.();
        } catch (error) {
          console.error('Error downloading PDF:', error);
        }
      }
    };

    const handleShare = () => {
      if (navigator.share) {
        navigator.share({
          title: `Certificate - ${data.recipientName}`,
          text: `Certificate of ${data.role} for ${data.eventName}`,
          url: window.location.href
        });
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
      onShare?.();
    };

    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
      `Certificate ID: ${data.certificateId}`
    )}`;

    const containerStyle = isPreview ? {
      transform: 'scale(0.5)',
      transformOrigin: 'top left',
      width: '200%',
      height: '200%'
    } : {};

    return (
      <div className={`certificate-wrapper ${className || ''}`}>
        {/* Controls */}
        {showControls && (
          <Card className="p-4 mb-6 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Badge variant="secondary" className="text-sm">
                  {template.name}
                </Badge>
                <Badge 
                  variant="outline" 
                  className="text-sm"
                  style={{ borderColor: template.primaryColor, color: template.primaryColor }}
                >
                  {data.role}
                </Badge>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleDownload}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </Button>
              </div>
            </div>
            
            {/* Certificate Info */}
            <div className="mt-3 text-sm text-gray-600">
              <p><strong>Certificate ID:</strong> {data.certificateId}</p>
              <p><strong>Recipient:</strong> {data.recipientName}</p>
              <p><strong>Event:</strong> {data.eventName}</p>
              <p><strong>Issue Date:</strong> {data.issueDate}</p>
            </div>
          </Card>
        )}

        {/* Certificate */}
        <div style={containerStyle} className="certificate-container-wrapper">
          <div
            ref={certificateRef}
            className="certificate-container"
            style={{
              width: '297mm',
              height: '210mm',
              padding: '20mm',
              background: `linear-gradient(135deg, ${template.primaryColor}15, ${template.secondaryColor}15)`,
              fontFamily: template.fontFamily,
              position: 'relative',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              border: `3px solid ${template.primaryColor}`,
              backgroundColor: '#ffffff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
            }}
          >
            {/* Header */}
            <div className="certificate-header" style={{ marginBottom: '30px' }}>
              {data.logoImageUrl && (
                <img 
                  src={data.logoImageUrl} 
                  alt="Organization Logo" 
                  style={{
                    height: '60px',
                    marginBottom: '20px',
                    objectFit: 'contain'
                  }}
                />
              )}
              
              <h1 style={{
                fontSize: '48px',
                color: template.primaryColor,
                margin: '0',
                fontWeight: 'bold',
                textTransform: 'uppercase',
                letterSpacing: '3px',
                textShadow: '2px 2px 4px rgba(0,0,0,0.1)'
              }}>
                Certificate
              </h1>
              
              <h2 style={{
                fontSize: '24px',
                color: template.secondaryColor,
                margin: '10px 0 0 0',
                fontWeight: 'normal',
                textTransform: 'uppercase',
                letterSpacing: '2px'
              }}>
                of {data.role === 'Faculty' ? 'Appreciation' : 'Participation'}
              </h2>
            </div>

            {/* Decorative Line */}
            <div style={{
              width: '150px',
              height: '3px',
              background: `linear-gradient(to right, ${template.primaryColor}, ${template.secondaryColor})`,
              margin: '0 auto 40px auto',
              borderRadius: '2px'
            }} />

            {/* Content */}
            <div className="certificate-content" style={{ marginBottom: '40px', maxWidth: '80%' }}>
              <p style={{
                fontSize: '18px',
                color: '#333',
                margin: '0 0 30px 0',
                lineHeight: '1.6'
              }}>
                This is to certify that
              </p>
              
              <h3 style={{
                fontSize: '36px',
                color: template.primaryColor,
                margin: '0 0 30px 0',
                fontWeight: 'bold',
                textDecoration: 'underline',
                textDecorationColor: template.secondaryColor,
                textDecorationThickness: '3px',
                textUnderlineOffset: '8px'
              }}>
                {data.recipientName}
              </h3>

              <p style={{
                fontSize: '18px',
                color: '#333',
                margin: '0 0 20px 0',
                lineHeight: '1.8'
              }}>
                has successfully {data.role === 'Faculty' ? 'contributed as a faculty member' : 'participated'} in the
              </p>

              <h4 style={{
                fontSize: '28px',
                color: template.primaryColor,
                margin: '0 0 20px 0',
                fontWeight: 'bold',
                lineHeight: '1.3'
              }}>
                {data.eventName}
              </h4>

              <p style={{
                fontSize: '16px',
                color: '#666',
                margin: '0 0 20px 0'
              }}>
                held at {data.eventLocation} on {data.eventDate}
              </p>

              {data.sessionDetails && (
                <p style={{
                  fontSize: '14px',
                  color: '#777',
                  margin: '0',
                  fontStyle: 'italic',
                  padding: '10px',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  borderRadius: '8px',
                  border: `1px solid ${template.secondaryColor}30`
                }}>
                  {data.sessionDetails}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="certificate-footer" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              width: '100%',
              marginTop: 'auto'
            }}>
              {/* Signature Section */}
              <div style={{ textAlign: 'left' }}>
                {data.signatureImageUrl ? (
                  <img 
                    src={data.signatureImageUrl} 
                    alt="Authorized Signature" 
                    style={{
                      height: '40px',
                      marginBottom: '10px',
                      objectFit: 'contain'
                    }}
                  />
                ) : (
                  <div style={{
                    width: '150px',
                    height: '2px',
                    background: '#333',
                    marginBottom: '10px'
                  }} />
                )}
                
                <p style={{
                  fontSize: '14px',
                  color: '#333',
                  margin: '0',
                  fontWeight: 'bold'
                }}>
                  Authorized Signature
                </p>
                
                <p style={{
                  fontSize: '12px',
                  color: '#666',
                  margin: '5px 0 0 0'
                }}>
                  {data.organizationName}
                </p>
              </div>

              {/* QR Code & Certificate Details */}
              <div style={{ textAlign: 'right' }}>
                <img 
                  src={qrCodeUrl} 
                  alt="Verification QR Code" 
                  style={{
                    width: '60px',
                    height: '60px',
                    marginBottom: '10px',
                    border: `2px solid ${template.primaryColor}`,
                    borderRadius: '8px',
                    padding: '4px',
                    backgroundColor: 'white'
                  }}
                />
                
                <p style={{
                  fontSize: '10px',
                  color: '#666',
                  margin: '0',
                  fontFamily: 'monospace'
                }}>
                  Certificate ID: {data.certificateId}
                </p>
                
                <p style={{
                  fontSize: '10px',
                  color: '#666',
                  margin: '2px 0 0 0'
                }}>
                  Issued on: {data.issueDate}
                </p>
              </div>
            </div>

            {/* Decorative Border Elements */}
            <div style={{
              position: 'absolute',
              top: '15px',
              left: '15px',
              width: '30px',
              height: '30px',
              borderLeft: `4px solid ${template.secondaryColor}`,
              borderTop: `4px solid ${template.secondaryColor}`
            }} />
            
            <div style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              width: '30px',
              height: '30px',
              borderRight: `4px solid ${template.secondaryColor}`,
              borderTop: `4px solid ${template.secondaryColor}`
            }} />
            
            <div style={{
              position: 'absolute',
              bottom: '15px',
              left: '15px',
              width: '30px',
              height: '30px',
              borderLeft: `4px solid ${template.secondaryColor}`,
              borderBottom: `4px solid ${template.secondaryColor}`
            }} />
            
            <div style={{
              position: 'absolute',
              bottom: '15px',
              right: '15px',
              width: '30px',
              height: '30px',
              borderRight: `4px solid ${template.secondaryColor}`,
              borderBottom: `4px solid ${template.secondaryColor}`
            }} />

            {/* Watermark/Background Pattern */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%) rotate(-45deg)',
              fontSize: '120px',
              color: `${template.primaryColor}05`,
              fontWeight: 'bold',
              userSelect: 'none',
              pointerEvents: 'none',
              zIndex: 0
            }}>
              {data.organizationName.charAt(0)}
            </div>
          </div>
        </div>

        {/* Preview Mode Footer */}
        {isPreview && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              className="flex items-center gap-2 mx-auto"
            >
              <Eye className="w-4 h-4" />
              View Full Size & Download
            </Button>
          </div>
        )}
      </div>
    );
  }
);

CertificateTemplateComponent.displayName = 'CertificateTemplate';

export default CertificateTemplateComponent;