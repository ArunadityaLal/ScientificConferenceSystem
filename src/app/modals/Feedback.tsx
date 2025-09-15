'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Send, MessageSquare, AlertCircle } from 'lucide-react';

type FeedbackType = 'general' | 'bug' | 'feature' | 'complaint' | 'compliment';

interface FeedbackModalProps {
  open: boolean;
  onClose: () => void;
  theme?: 'light' | 'dark';
}

export default function FeedbackModal({ open, onClose, theme = 'light' }: FeedbackModalProps) {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [rating, setRating] = useState(0);
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

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
        },
        border: 'border-gray-200',
        input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500',
        button: {
          primary: 'bg-blue-600 hover:bg-blue-700 text-white',
          secondary: 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50',
        },
        alert: {
          success: 'bg-green-50 border-green-200 text-green-900',
          error: 'bg-red-50 border-red-200 text-red-900',
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
        },
        border: 'border-gray-700',
        input: 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500',
        button: {
          primary: 'bg-blue-600 hover:bg-blue-500 text-white',
          secondary: 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600',
        },
        alert: {
          success: 'bg-green-900/20 border-green-800 text-green-300',
          error: 'bg-red-900/20 border-red-800 text-red-300',
        }
      };
    }
  };

  const themeClasses = getThemeClasses(theme);

  const handleSubmit = async () => {
    if (!feedback.trim() || !subject.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setSubmitting(true);
    setError('');
    
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ 
          message: feedback,
          type: feedbackType,
          rating,
          email: email || null,
          subject
        }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (res.ok) {
        setSuccess(true);
        // Reset form
        setFeedback('');
        setFeedbackType('general');
        setRating(0);
        setEmail('');
        setSubject('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to submit feedback');
      }
    } catch {
      setError('An error occurred. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setSuccess(false);
    setError('');
    setFeedback('');
    setFeedbackType('general');
    setRating(0);
    setEmail('');
    setSubject('');
    onClose();
  };

  const StarRating = ({ rating, onRatingChange }: { rating: number; onRatingChange: (rating: number) => void }) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onRatingChange(star)}
          className="p-1 transition-transform hover:scale-110"
        >
          <Star
            className={`w-5 h-5 transition-colors ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : theme === 'light' 
                  ? 'text-gray-300' 
                  : 'text-gray-600'
            }`}
          />
        </button>
      ))}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className={`max-w-lg ${themeClasses.background.primary} ${themeClasses.border}`}>
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${themeClasses.text.primary}`}>
            <MessageSquare className="h-5 w-5" />
            Submit Feedback
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {success ? (
            <div className={`p-4 rounded-lg border ${themeClasses.alert.success}`}>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">Thank you for your feedback!</span>
              </div>
              <p className="mt-1 text-sm">We appreciate you taking the time to help us improve.</p>
            </div>
          ) : (
            <>
              {/* Feedback Type */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                  Feedback Type
                </label>
                <select
                  value={feedbackType}
                  onChange={(e) => setFeedbackType(e.target.value as FeedbackType)}
                  className={`w-full rounded-md px-3 py-2 text-sm shadow-sm ${themeClasses.input}`}
                >
                  <option value="general">General Feedback</option>
                  <option value="bug">Bug Report</option>
                  <option value="feature">Feature Request</option>
                  <option value="complaint">Complaint</option>
                  <option value="compliment">Compliment</option>
                </select>
              </div>

              {/* Rating */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                  Overall Rating
                </label>
                <StarRating rating={rating} onRatingChange={setRating} />
              </div>

              {/* Subject */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Brief summary of your feedback"
                  className={`w-full rounded-md px-3 py-2 text-sm shadow-sm ${themeClasses.input}`}
                  disabled={submitting}
                />
              </div>

              {/* Message */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                  Message <span className="text-red-500">*</span>
                </label>
                <Textarea
                  placeholder="Please provide detailed feedback..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  disabled={submitting}
                  className={`w-full min-h-[100px] ${themeClasses.input}`}
                  rows={5}
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className={`block text-sm font-medium ${themeClasses.text.secondary}`}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className={`w-full rounded-md px-3 py-2 text-sm shadow-sm ${themeClasses.input}`}
                  disabled={submitting}
                />
                <p className={`text-xs ${themeClasses.text.muted}`}>
                  Provide your email if you'd like a response
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div className={`p-3 rounded-lg border ${themeClasses.alert.error}`}>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
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
                  disabled={submitting}
                  className={themeClasses.button.secondary}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!feedback.trim() || !subject.trim() || submitting}
                  className={themeClasses.button.primary}
                >
                  {submitting ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Feedback
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