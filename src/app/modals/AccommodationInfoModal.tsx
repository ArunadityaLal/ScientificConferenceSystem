'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Hotel, Users, AlertCircle, Send, Upload, Calendar, MapPin } from 'lucide-react';

type AccommodationType = 'accessibility' | 'medical' | 'religious' | 'language' | 'technical' | 'other';
type PriorityLevel = 'low' | 'normal' | 'high' | 'urgent';
type ContactMethod = 'email' | 'phone' | 'text' | 'mail';

interface AccommodationModalProps {
  open: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
  eventId?: string | null;
  onSubmit?: (data: AccommodationRequest) => Promise<void> | void;
  submitting?: boolean;
}

interface AccommodationRequest {
  type: AccommodationType;
  priority: PriorityLevel;
  title: string;
  description: string;
  contactMethod: ContactMethod;
  contactInfo: string;
  specialRequests?: string;
  urgentDetails?: string;
}

export default function AccommodationModal({ 
  open, 
  onClose, 
  theme = 'light',
  eventId,
  onSubmit,
  submitting = false 
}: AccommodationModalProps) {
  const [formData, setFormData] = useState<AccommodationRequest>({
    type: 'accessibility',
    priority: 'normal',
    title: '',
    description: '',
    contactMethod: 'email',
    contactInfo: '',
    specialRequests: '',
    urgentDetails: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);
  const [localSubmitting, setLocalSubmitting] = useState(false);

  // Theme classes based on your existing theme system
  const getThemeClasses = (theme: 'light' | 'dark') => {
    if (theme === 'light') {
      return {
        text: {
          primary: 'text-gray-900',
          secondary: 'text-gray-700',
          muted: 'text-gray-500',
        },
        background: {
          primary: 'bg-white',
          secondary: 'bg-gray-50',
          card: 'bg-white border-gray-200',
        },
        border: 'border-gray-200',
        input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-purple-500 focus:ring-purple-500',
        button: {
          primary: 'bg-purple-600 hover:bg-purple-700 text-white',
          secondary: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
        },
        alert: {
          info: 'bg-blue-50 border-blue-200 text-blue-900',
          success: 'bg-green-50 border-green-200 text-green-900',
          error: 'bg-red-50 border-red-200 text-red-900',
          warning: 'bg-amber-50 border-amber-200 text-amber-900',
        }
      };
    } else {
      return {
        text: {
          primary: 'text-white',
          secondary: 'text-gray-300',
          muted: 'text-gray-400',
        },
        background: {
          primary: 'bg-gray-800',
          secondary: 'bg-gray-900',
          card: 'bg-gray-800 border-gray-700',
        },
        border: 'border-gray-700',
        input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 focus:ring-purple-500',
        button: {
          primary: 'bg-purple-600 hover:bg-purple-500 text-white',
          secondary: 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600',
        },
        alert: {
          info: 'bg-blue-900/20 border-blue-800 text-blue-300',
          success: 'bg-green-900/20 border-green-800 text-green-300',
          error: 'bg-red-900/20 border-red-800 text-red-300',
          warning: 'bg-amber-900/20 border-amber-800 text-amber-300',
        }
      };
    }
  };

  const themeClasses = getThemeClasses(theme);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.contactInfo.trim()) {
      newErrors.contactInfo = 'Contact information is required';
    }
    
    // Validate email format if email is selected
    if (formData.contactMethod === 'email' && formData.contactInfo.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactInfo)) {
        newErrors.contactInfo = 'Please enter a valid email address';
      }
    }
    
    // Validate phone format if phone/text is selected
    if ((formData.contactMethod === 'phone' || formData.contactMethod === 'text') && formData.contactInfo.trim()) {
      const phoneRegex = /^[\+]?[\d\s\-\(\)]{10,}$/;
      if (!phoneRegex.test(formData.contactInfo.replace(/\s/g, ''))) {
        newErrors.contactInfo = 'Please enter a valid phone number';
      }
    }

    if (formData.priority === 'urgent' && !formData.urgentDetails?.trim()) {
      newErrors.urgentDetails = 'Please explain why this request is urgent';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    
    setLocalSubmitting(true);
    
    try {
      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default API call if no onSubmit provided
        const response = await fetch('/api/accommodation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...formData,
            eventId
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to submit accommodation request');
        }
      }
      
      setSuccess(true);
      // Reset form after successful submission
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting accommodation request:', error);
      setErrors({ general: 'Failed to submit request. Please try again.' });
    } finally {
      setLocalSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      type: 'accessibility',
      priority: 'normal',
      title: '',
      description: '',
      contactMethod: 'email',
      contactInfo: '',
      specialRequests: '',
      urgentDetails: ''
    });
    setErrors({});
    setSuccess(false);
    onClose();
  };

  const updateFormData = (field: keyof AccommodationRequest, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getPriorityColor = (priority: PriorityLevel) => {
    if (theme === 'light') {
      switch (priority) {
        case 'low': return 'text-green-700';
        case 'normal': return 'text-blue-700';
        case 'high': return 'text-yellow-700';
        case 'urgent': return 'text-red-700';
      }
    } else {
      switch (priority) {
        case 'low': return 'text-green-300';
        case 'normal': return 'text-blue-300';
        case 'high': return 'text-yellow-300';
        case 'urgent': return 'text-red-300';
      }
    }
  };

  const getContactPlaceholder = () => {
    switch (formData.contactMethod) {
      case 'email': return 'your.email@example.com';
      case 'phone': return '+1 (555) 123-4567';
      case 'text': return '+1 (555) 123-4567';
      case 'mail': return 'Your mailing address';
      default: return '';
    }
  };

  const isEventMissing = !eventId;
  const isSubmitting = submitting || localSubmitting;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className={`max-w-2xl ${themeClasses.background.primary} ${themeClasses.border}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${themeClasses.text.primary}`}>
            <Users className="h-5 w-5" />
            Request Accommodation
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Event Missing Warning */}
          {isEventMissing && (
            <div className={`p-4 rounded-lg border ${themeClasses.alert.warning}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Event not selected yet.</span>
              </div>
              <p className="text-sm mt-1">Please select an event to enable saving.</p>
            </div>
          )}

          {success ? (
            <div className={`p-6 rounded-lg border ${themeClasses.alert.success}`}>
              <div className="text-center">
                <AlertCircle className="h-8 w-8 mx-auto mb-3" />
                <h3 className="text-lg font-semibold mb-2">Request Submitted Successfully!</h3>
                <p className="text-sm">
                  Your accommodation request has been submitted and will be reviewed within 2-3 business days.
                  You will be contacted using your preferred method.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Accommodation Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                    Type of Accommodation
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => updateFormData('type', e.target.value)}
                    className={`w-full rounded-md px-3 py-2 text-sm shadow-sm ${themeClasses.input}`}
                    disabled={isSubmitting}
                  >
                    <option value="accessibility">Accessibility Support</option>
                    <option value="medical">Medical Accommodation</option>
                    <option value="religious">Religious Accommodation</option>
                    <option value="language">Language Support</option>
                    <option value="technical">Technical Assistance</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Priority Level */}
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                    Priority Level
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => updateFormData('priority', e.target.value)}
                    className={`w-full rounded-md px-3 py-2 text-sm shadow-sm ${themeClasses.input}`}
                    disabled={isSubmitting}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  {formData.priority && (
                    <p className={`text-xs ${getPriorityColor(formData.priority)}`}>
                      {formData.priority === 'urgent' && 'Urgent requests are reviewed immediately'}
                      {formData.priority === 'high' && 'High priority requests are reviewed within 24 hours'}
                      {formData.priority === 'normal' && 'Normal requests are reviewed within 2-3 business days'}
                      {formData.priority === 'low' && 'Low priority requests are reviewed within 5 business days'}
                    </p>
                  )}
                </div>
              </div>

              {/* Title */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                  Request Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => updateFormData('title', e.target.value)}
                  placeholder="Brief description of your accommodation need"
                  className={`w-full rounded-md px-3 py-2 text-sm shadow-sm ${themeClasses.input}`}
                  disabled={isSubmitting}
                />
                {errors.title && <p className="text-xs text-red-600">{errors.title}</p>}
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                  Detailed Description <span className="text-red-500">*</span>
                </label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => updateFormData('description', e.target.value)}
                  placeholder="Please provide detailed information about your accommodation needs, including any specific requirements or constraints..."
                  className={`w-full min-h-[100px] ${themeClasses.input}`}
                  rows={4}
                  disabled={isSubmitting}
                />
                {errors.description && <p className="text-xs text-red-600">{errors.description}</p>}
              </div>

              {/* Urgent Details (conditional) */}
              {formData.priority === 'urgent' && (
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                    Urgent Details <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    value={formData.urgentDetails}
                    onChange={(e) => updateFormData('urgentDetails', e.target.value)}
                    placeholder="Please explain why this request is urgent and any time constraints..."
                    className={`w-full ${themeClasses.input}`}
                    rows={3}
                    disabled={isSubmitting}
                  />
                  {errors.urgentDetails && <p className="text-xs text-red-600">{errors.urgentDetails}</p>}
                </div>
              )}

              {/* Contact Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                    Preferred Contact Method
                  </label>
                  <select
                    value={formData.contactMethod}
                    onChange={(e) => updateFormData('contactMethod', e.target.value)}
                    className={`w-full rounded-md px-3 py-2 text-sm shadow-sm ${themeClasses.input}`}
                    disabled={isSubmitting}
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="text">Text Message</option>
                    <option value="mail">Physical Mail</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                    Contact Information <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.contactInfo}
                    onChange={(e) => updateFormData('contactInfo', e.target.value)}
                    placeholder={getContactPlaceholder()}
                    className={`w-full rounded-md px-3 py-2 text-sm shadow-sm ${themeClasses.input}`}
                    disabled={isSubmitting}
                  />
                  {errors.contactInfo && <p className="text-xs text-red-600">{errors.contactInfo}</p>}
                </div>
              </div>

              {/* Special Requests */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                  Additional Special Requests (Optional)
                </label>
                <Textarea
                  value={formData.specialRequests}
                  onChange={(e) => updateFormData('specialRequests', e.target.value)}
                  placeholder="Any additional requests or considerations..."
                  className={`w-full ${themeClasses.input}`}
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>

              {/* Important Notice */}
              <div className={`p-4 rounded-lg border ${themeClasses.alert.info}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium mb-1">Important:</p>
                    <p>
                      All accommodation requests are reviewed within 2-3 business days. 
                      For urgent requests, please also contact us directly at (555) 123-4567.
                      We are committed to providing equal access and reasonable accommodations 
                      for all participants.
                    </p>
                  </div>
                </div>
              </div>

              {/* General Error */}
              {errors.general && (
                <div className={`p-3 rounded-lg border ${themeClasses.alert.error}`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{errors.general}</span>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            {success ? (
              <Button onClick={handleClose} className={themeClasses.button.primary}>
                Close
              </Button>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleClose} 
                  disabled={isSubmitting}
                  className={themeClasses.button.secondary}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || isEventMissing || !formData.title.trim() || !formData.description.trim()}
                  className={themeClasses.button.primary}
                >
                  {isSubmitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}