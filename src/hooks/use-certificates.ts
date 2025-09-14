// src/hooks/use-certificates.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, useCallback } from 'react';
import { CertificateData, CertificateTemplate, CertificateGenerator } from '@/lib/pdf/certificate-generator';

// Types
interface Certificate {
  id: string;
  eventId: string;
  recipientId: string;
  recipientName: string;
  role: 'Faculty' | 'Delegate' | 'Speaker' | 'Chairperson' | 'Moderator';
  sessionDetails?: string;
  templateId: string;
  customData: Record<string, any>;
  issuedBy: string;
  status: 'Generated' | 'Sent' | 'Downloaded';
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    name: string;
    date: string;
    location: string;
    organizationName: string;
  };
  recipient: {
    id: string;
    name: string;
    email: string;
  };
}

interface CertificatesResponse {
  certificates: Certificate[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

interface CreateCertificateData {
  eventId: string;
  recipientId: string;
  recipientName: string;
  role: 'Faculty' | 'Delegate' | 'Speaker' | 'Chairperson' | 'Moderator';
  sessionDetails?: string;
  templateId?: string;
  customData?: Record<string, any>;
}

interface BulkCreateCertificateData {
  eventId: string;
  certificates: Omit<CreateCertificateData, 'eventId'>[];
  templateId?: string;
  sendEmail?: boolean;
}

interface CertificateFilters {
  eventId?: string;
  recipientId?: string;
  role?: string;
  page?: number;
  limit?: number;
}

// API Functions
const certificateAPI = {
  async getCertificates(filters: CertificateFilters = {}): Promise<CertificatesResponse> {
    const searchParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });

    const response = await fetch(`/api/certificates?${searchParams.toString()}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch certificates');
    }
    
    return response.json();
  },

  async createCertificate(data: CreateCertificateData): Promise<{ certificate: Certificate }> {
    const response = await fetch('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create certificate');
    }
    
    return response.json();
  },

  async createBulkCertificates(data: BulkCreateCertificateData): Promise<{ certificates: Certificate[] }> {
    const response = await fetch('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create certificates');
    }
    
    return response.json();
  },

  async updateCertificate(
    id: string, 
    data: Partial<Pick<Certificate, 'status' | 'templateId' | 'sessionDetails' | 'customData'>>
  ): Promise<{ certificate: Certificate }> {
    const response = await fetch(`/api/certificates?id=${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update certificate');
    }
    
    return response.json();
  },

  async deleteCertificate(id: string): Promise<void> {
    const response = await fetch(`/api/certificates?id=${id}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete certificate');
    }
  }
};

// Hooks
export function useCertificates(filters: CertificateFilters = {}) {
  return useQuery({
    queryKey: ['certificates', filters],
    queryFn: () => certificateAPI.getCertificates(filters),
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false
  });
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: certificateAPI.createCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    }
  });
}

export function useCreateBulkCertificates() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: certificateAPI.createBulkCertificates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    }
  });
}

export function useUpdateCertificate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof certificateAPI.updateCertificate>[1] }) =>
      certificateAPI.updateCertificate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    }
  });
}

export function useDeleteCertificate() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: certificateAPI.deleteCertificate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['certificates'] });
    }
  });
}

// Certificate Generation Hooks
export function useCertificateGenerator() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const generateSingle = useCallback(async (
    certificateData: CertificateData,
    template?: CertificateTemplate
  ): Promise<Blob> => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      const blob = await CertificateGenerator.generateSingleCertificate(certificateData, template);
      setProgress(100);
      return blob;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  const generateBulk = useCallback(async (
    certificates: CertificateData[],
    template?: CertificateTemplate
  ): Promise<Blob[]> => {
    setIsGenerating(true);
    setProgress(0);
    
    try {
      const blobs = await CertificateGenerator.generateBulkCertificates(
        certificates,
        template,
        (completed, total) => {
          setProgress((completed / total) * 100);
        }
      );
      return blobs;
    } catch (error) {
      console.error('Error generating bulk certificates:', error);
      throw error;
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  }, []);

  const downloadPDF = useCallback((blob: Blob, filename: string) => {
    CertificateGenerator.downloadPDF(blob, filename);
  }, []);

  return {
    generateSingle,
    generateBulk,
    downloadPDF,
    isGenerating,
    progress
  };
}

// Certificate Templates Hook
export function useCertificateTemplates() {
  return useQuery({
    queryKey: ['certificate-templates'],
    queryFn: () => CertificateGenerator.getAvailableTemplates(),
    staleTime: Infinity, // Templates don't change often
    refetchOnWindowFocus: false
  });
}

// Certificate Conversion Hook
export function useCertificateConverter() {
  const convertToCertificateData = useCallback((certificate: Certificate): CertificateData => {
    return {
      recipientName: certificate.recipientName,
      eventName: certificate.event.name,
      eventDate: new Date(certificate.event.date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      role: certificate.role,
      organizationName: certificate.event.organizationName,
      eventLocation: certificate.event.location,
      certificateId: certificate.id,
      issueDate: new Date(certificate.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      sessionDetails: certificate.sessionDetails,
      signatureImageUrl: certificate.customData?.signatureImageUrl,
      logoImageUrl: certificate.customData?.logoImageUrl
    };
  }, []);

  return { convertToCertificateData };
}

// Certificate Statistics Hook
export function useCertificateStats(eventId?: string) {
  return useQuery({
    queryKey: ['certificate-stats', eventId],
    queryFn: async () => {
      const filters = eventId ? { eventId } : {};
      const response = await certificateAPI.getCertificates({ ...filters, limit: 1000 });
      
      const stats = {
        total: response.pagination.total,
        byRole: {} as Record<string, number>,
        byStatus: {} as Record<string, number>,
        recentlyGenerated: 0
      };

      // Calculate stats
      response.certificates.forEach(cert => {
        // By role
        stats.byRole[cert.role] = (stats.byRole[cert.role] || 0) + 1;
        
        // By status
        stats.byStatus[cert.status] = (stats.byStatus[cert.status] || 0) + 1;
        
        // Recently generated (last 7 days)
        const createdDate = new Date(cert.createdAt);
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        if (createdDate > sevenDaysAgo) {
          stats.recentlyGenerated++;
        }
      });

      return stats;
    },
    enabled: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false
  });
}

// Certificate Validation Hook
export function useCertificateValidation() {
  const validateCertificateData = useCallback((data: Partial<CertificateData>): string[] => {
    const errors: string[] = [];
    
    if (!data.recipientName?.trim()) {
      errors.push('Recipient name is required');
    }
    
    if (!data.eventName?.trim()) {
      errors.push('Event name is required');
    }
    
    if (!data.eventDate?.trim()) {
      errors.push('Event date is required');
    }
    
    if (!data.role) {
      errors.push('Role is required');
    }
    
    if (!data.organizationName?.trim()) {
      errors.push('Organization name is required');
    }
    
    if (!data.eventLocation?.trim()) {
      errors.push('Event location is required');
    }
    
    if (!data.certificateId?.trim()) {
      errors.push('Certificate ID is required');
    }
    
    return errors;
  }, []);

  const isValidCertificateData = useCallback((data: Partial<CertificateData>): boolean => {
    return validateCertificateData(data).length === 0;
  }, [validateCertificateData]);

  return {
    validateCertificateData,
    isValidCertificateData
  };
}