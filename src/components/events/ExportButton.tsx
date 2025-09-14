// src/components/events/ExportButton.tsx
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Download, FileText, Table, ChevronDown } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ExportButtonProps {
  eventId?: string;
  eventName?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  eventId,
  eventName = 'Event',
  variant = 'outline',
  size = 'default',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<string>('');

  // Export PDF function
  const exportPDF = async () => {
    try {
      setIsExporting(true);
      setExportType('PDF');
      
      console.log('🔄 Starting PDF export...');
      
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed: ${response.status}`);
      }
      
      // Create download
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${eventName.replace(/[^a-zA-Z0-9]/g, '-')}-export-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('PDF exported successfully!');
      console.log('✅ PDF export completed');
      
    } catch (error) {
      console.error('❌ PDF export error:', error);
      toast.error(error instanceof Error ? error.message : 'PDF export failed');
    } finally {
      setIsExporting(false);
      setExportType('');
      setIsOpen(false);
    }
  };

  // Export Excel function
  const exportExcel = async () => {
    try {
      setIsExporting(true);
      setExportType('Excel');
      
      console.log('🔄 Starting Excel export...');
      
      const url = eventId 
        ? `/api/events/export/excel?eventId=${eventId}`
        : '/api/events/export/excel';
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Export failed: ${response.status}`);
      }
      
      // Create download
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `${eventName.replace(/[^a-zA-Z0-9]/g, '-')}-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
      
      toast.success('Excel exported successfully!');
      console.log('✅ Excel export completed');
      
    } catch (error) {
      console.error('❌ Excel export error:', error);
      toast.error(error instanceof Error ? error.message : 'Excel export failed');
    } finally {
      setIsExporting(false);
      setExportType('');
      setIsOpen(false);
    }
  };

  // Handle click outside to close dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.export-dropdown')) {
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
    <div className={`relative export-dropdown ${className}`}>
      {/* Main Export Button */}
      <Button
        variant={variant}
        size={size}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className="flex items-center gap-2"
      >
        {isExporting ? (
          <>
            <LoadingSpinner size="sm" />
            <span>Exporting {exportType}...</span>
          </>
        ) : (
          <>
            <Download size={16} />
            <span>Export</span>
            <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </>
        )}
      </Button>

      {/* Dropdown Menu */}
      {isOpen && !isExporting && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50 py-1">
          {/* PDF Export Option */}
          <button
            onClick={exportPDF}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <FileText size={16} className="text-red-600" />
            <div>
              <div className="font-medium">Export as PDF</div>
              <div className="text-xs text-gray-500">Professional document format</div>
            </div>
          </button>

          {/* Excel Export Option */}
          <button
            onClick={exportExcel}
            className="w-full px-4 py-2 text-sm text-left hover:bg-gray-50 flex items-center gap-3 transition-colors"
          >
            <Table size={16} className="text-green-600" />
            <div>
              <div className="font-medium">Export as Excel</div>
              <div className="text-xs text-gray-500">Spreadsheet with multiple sheets</div>
            </div>
          </button>

          {/* Info Footer */}
          <div className="border-t border-gray-100 mt-1 pt-2 px-4 pb-2">
            <div className="text-xs text-gray-400">
              {eventId ? 'Current event data' : 'All events data'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};