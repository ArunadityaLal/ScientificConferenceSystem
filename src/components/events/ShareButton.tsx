// src/components/events/ShareButton.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Share2, FileText, Link, Mail, MessageCircle, ChevronDown, Copy } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ShareButtonProps {
  eventId?: string;
  eventName?: string;
  eventUrl?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  eventId,
  eventName = 'Event',
  eventUrl,
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareType, setShareType] = useState<string>('');

  // Get current URL if eventUrl not provided
  const currentUrl = eventUrl || (typeof window !== 'undefined' ? window.location.href : '');

  // Generate PDF and share
  const sharePDF = async () => {
    try {
      setIsSharing(true);
      setShareType('PDF');
      
      console.log('🔄 Generating PDF for sharing...');
      
      // Generate PDF
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
        throw new Error('Failed to generate PDF');
      }
      
      const blob = await response.blob();
      const filename = `${eventName.replace(/[^a-zA-Z0-9]/g, '-')}-${new Date().toISOString().slice(0, 10)}.pdf`;
      
      // Try Web Share API first (mobile native sharing)
      if (navigator.share && navigator.canShare) {
        try {
          const file = new File([blob], filename, { type: 'application/pdf' });
          const shareData = {
            title: `${eventName} - Event Details`,
            text: `Check out the details for ${eventName}`,
            files: [file]
          };
          
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            toast.success('PDF shared successfully!');
            console.log('✅ PDF shared via Web Share API');
            return;
          }
        } catch (webShareError) {
          console.log('Web Share API failed, falling back to download');
        }
      }
      
      // Fallback: Download PDF
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('PDF downloaded for sharing!');
      console.log('✅ PDF downloaded for manual sharing');
      
    } catch (error) {
      console.error('❌ PDF sharing error:', error);
      toast.error('Failed to generate PDF for sharing');
    } finally {
      setIsSharing(false);
      setShareType('');
      setIsOpen(false);
    }
  };

  // Copy link to clipboard
  const copyLink = async () => {
    try {
      setIsSharing(true);
      setShareType('Link');
      
      await navigator.clipboard.writeText(currentUrl);
      toast.success('Link copied to clipboard!');
      console.log('✅ Link copied to clipboard');
      
    } catch (error) {
      console.error('❌ Copy link error:', error);
      toast.error('Failed to copy link');
    } finally {
      setIsSharing(false);
      setShareType('');
      setIsOpen(false);
    }
  };

  // Share via Email
  const shareViaEmail = () => {
    try {
      setIsSharing(true);
      setShareType('Email');
      
      const subject = encodeURIComponent(`Event Details: ${eventName}`);
      const body = encodeURIComponent(
        `Hi,\n\nI wanted to share the details of this event with you:\n\n` +
        `Event: ${eventName}\n` +
        `Link: ${currentUrl}\n\n` +
        `Best regards`
      );
      
      const mailtoUrl = `mailto:?subject=${subject}&body=${body}`;
      window.open(mailtoUrl, '_blank');
      
      toast.success('Email composer opened!');
      console.log('✅ Email sharing initiated');
      
    } catch (error) {
      console.error('❌ Email sharing error:', error);
      toast.error('Failed to open email composer');
    } finally {
      setIsSharing(false);
      setShareType('');
      setIsOpen(false);
    }
  };

  // Share via WhatsApp
  const shareViaWhatsApp = () => {
    try {
      setIsSharing(true);
      setShareType('WhatsApp');
      
      const message = encodeURIComponent(
        `🎯 *${eventName}*\n\n` +
        `Check out this event details:\n${currentUrl}\n\n` +
        `Shared via Conference Management System`
      );
      
      const whatsappUrl = `https://wa.me/?text=${message}`;
      window.open(whatsappUrl, '_blank');
      
      toast.success('WhatsApp opened for sharing!');
      console.log('✅ WhatsApp sharing initiated');
      
    } catch (error) {
      console.error('❌ WhatsApp sharing error:', error);
      toast.error('Failed to open WhatsApp');
    } finally {
      setIsSharing(false);
      setShareType('');
      setIsOpen(false);
    }
  };

  // Native Web Share (if available)
  const nativeShare = async () => {
    try {
      setIsSharing(true);
      setShareType('Native');
      
      if (navigator.share) {
        await navigator.share({
          title: eventName,
          text: `Check out this event: ${eventName}`,
          url: currentUrl
        });
        
        toast.success('Shared successfully!');
        console.log('✅ Native sharing completed');
      } else {
        throw new Error('Native sharing not supported');
      }
      
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled sharing
        console.log('User cancelled native sharing');
      } else {
        console.error('❌ Native sharing error:', error);
        toast.error('Native sharing not available');
      }
    } finally {
      setIsSharing(false);
      setShareType('');
      setIsOpen(false);
    }
  };

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.share-dropdown')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={`relative share-dropdown ${className}`}>
      {/* Main Share Button */}
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isSharing}
        className="flex items-center gap-2"
      >
        {isSharing ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Sharing {shareType}...</span>
          </>
        ) : (
          <>
            <Share2 size={16} />
            <span>Share</span>
            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && !isSharing && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
          
          {/* Native Share (if available) */}
          {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
            <button
              onClick={nativeShare}
              className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
            >
              <Share2 size={16} className="text-blue-600" />
              <div>
                <div className="font-medium">Share</div>
                <div className="text-xs text-gray-500">Use device's share menu</div>
              </div>
            </button>
          )}

          {/* PDF Share */}
          <button
            onClick={sharePDF}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <FileText size={16} className="text-red-600" />
            <div>
              <div className="font-medium">Share PDF</div>
              <div className="text-xs text-gray-500">Generate and share document</div>
            </div>
          </button>

          {/* Copy Link */}
          <button
            onClick={copyLink}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Copy size={16} className="text-gray-600" />
            <div>
              <div className="font-medium">Copy Link</div>
              <div className="text-xs text-gray-500">Copy event URL to clipboard</div>
            </div>
          </button>

          {/* Email Share */}
          <button
            onClick={shareViaEmail}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Mail size={16} className="text-blue-600" />
            <div>
              <div className="font-medium">Share via Email</div>
              <div className="text-xs text-gray-500">Open email composer</div>
            </div>
          </button>

          {/* WhatsApp Share */}
          <button
            onClick={shareViaWhatsApp}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <MessageCircle size={16} className="text-green-600" />
            <div>
              <div className="font-medium">Share via WhatsApp</div>
              <div className="text-xs text-gray-500">Send via WhatsApp</div>
            </div>
          </button>

          {/* Info Footer */}
          <div className="border-t border-gray-100 mt-1 pt-2 px-4 pb-2">
            <div className="text-xs text-gray-400">
              Sharing: {eventName}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};