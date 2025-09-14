'use client';

import { useState } from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export default function FeedbackModal({
  open,
  onClose,
}: { open: boolean; onClose: () => void }) {
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        body: JSON.stringify({ message: feedback }), // <-- FIXED: key should be 'message'
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        setSuccess(true);
        setFeedback('');
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
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <ModalHeader>Submit Feedback</ModalHeader>
      <ModalBody>
        {success ? (
          <div className="text-green-600 mb-3">Thank you for your feedback!</div>
        ) : (
          <>
            <Textarea
              placeholder="Your feedback..."
              value={feedback}
              onChange={e => setFeedback(e.target.value)}
              disabled={submitting}
              className="w-full"
              rows={5}
            />
            {error && <div className="text-red-500 mt-2">{error}</div>}
          </>
        )}
      </ModalBody>
      <ModalFooter>
        {success ? (
          <Button onClick={handleClose}>Close</Button>
        ) : (
          <>
            <Button variant="outline" onClick={handleClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!feedback.trim() || submitting}
              className="ml-2"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </Button>
          </>
        )}
      </ModalFooter>
    </Modal>
  );
}
