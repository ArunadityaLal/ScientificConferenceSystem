// src/app/(dashboard)/event-manager/events/create/page.tsx
'use client';

import { useRouter } from 'next/navigation'; 
import { ArrowLeft } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { EventManagerLayout } from '@/components/dashboard/layout';
import { EventForm } from '@/components/forms/event-form';

export default function CreateEventPage() {
  const router = useRouter();

  const handleSuccess = (eventId?: string) => {
    if (eventId) {
      // Redirect to event details page after successful creation
      router.push(`/event-manager/events/${eventId}`);
    } else {
      // Fallback: redirect to events listing
      router.push('/event-manager/events');
    }
  };

  const handleCancel = () => {
    // Go back to events listing
    router.push('/event-manager/events');
  };

  return (
    <EventManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleCancel}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Events
          </Button>
        </div>

        <div className="max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">Create New Event</h1>
            <p className="text-muted-foreground">
              Set up a new conference or event with all the necessary details
            </p>
          </div>

          {/* Event Form */}
          <div className="bg-white dark:bg-gray-900 rounded-lg border p-6">
            <EventForm 
              onSuccess={handleSuccess}
              onCancel={handleCancel}
            />
          </div>
        </div>
      </div>
    </EventManagerLayout>
  );
}