// src/components/events/DeleteEventButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Trash2, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface DeleteEventButtonProps {
  eventId: string;
  eventName: string;
  eventStatus: string;
  onDelete?: () => void;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showText?: boolean;
}

export function DeleteEventButton({
  eventId,
  eventName,
  eventStatus,
  onDelete,
  variant = 'destructive',
  size = 'default',
  showText = true
}: DeleteEventButtonProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Check if event can be deleted
  const canDelete = eventStatus !== 'ACTIVE';
  const deleteMessage = canDelete 
    ? `This action will permanently delete "${eventName}" and all associated data including sessions, registrations, and faculty assignments.`
    : `Cannot delete an active event. Please cancel "${eventName}" first before deleting.`;

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('Cannot delete an active event');
      return;
    }

    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to delete event');
      }

      const result = await response.json();
      
      toast.success('Event deleted successfully');
      setIsOpen(false);
      
      // Call custom onDelete callback if provided
      if (onDelete) {
        onDelete();
      } else {
        // Default: redirect to events list
        router.push('/event-manager/events');
      }
      
    } catch (error) {
      console.error('Delete event error:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message
        : 'Failed to delete event';
      toast.error(errorMessage || 'Failed to delete event');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          disabled={!canDelete && variant === 'destructive'}
          className={!canDelete ? 'opacity-50 cursor-not-allowed' : ''}
          title={!canDelete ? 'Cannot delete active event' : `Delete ${eventName}`}
        >
          <Trash2 className={showText ? 'w-4 h-4 mr-2' : 'w-4 h-4'} />
          {showText && 'Delete Event'}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            {canDelete ? 'Delete Event?' : 'Cannot Delete Event'}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-left">
            {deleteMessage}
            
            {canDelete && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-800 font-medium">⚠️ This action cannot be undone!</p>
                <ul className="mt-2 text-sm text-red-700 list-disc list-inside space-y-1">
                  <li>All event data will be permanently deleted</li>
                  <li>Sessions and presentations will be removed</li>
                  <li>Registration data will be lost</li>
                  <li>Faculty assignments will be cleared</li>
                </ul>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            Cancel
          </AlertDialogCancel>
          
          {canDelete && (
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Permanently
                </>
              )}
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// ✅ USAGE EXAMPLES:

// 1. In Event Edit Page:
/*
import { DeleteEventButton } from '@/components/events/DeleteEventButton';

// Inside your component:
<DeleteEventButton
  eventId={event.id}
  eventName={event.name}
  eventStatus={event.status}
  onDelete={() => {
    // Custom action after deletion
    router.push('/event-manager/events');
  }}
/>
*/

// 2. In Event List/Cards:
/*
<DeleteEventButton
  eventId={event.id}
  eventName={event.name}
  eventStatus={event.status}
  variant="outline"
  size="sm"
  showText={false} // Only show icon
  onDelete={() => {
    // Refresh the list
    refetch();
  }}
/>
*/

// 3. In Event Detail Page:
/*
<div className="flex gap-2">
  <Button variant="outline" onClick={() => router.push(`/events/${event.id}/edit`)}>
    <Edit className="w-4 h-4 mr-2" />
    Edit
  </Button>
  
  <DeleteEventButton
    eventId={event.id}
    eventName={event.name}
    eventStatus={event.status}
  />
</div>
*/