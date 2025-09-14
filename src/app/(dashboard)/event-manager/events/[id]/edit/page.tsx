// src/app/(dashboard)/event-manager/events/[id]/edit/page.tsx - FIXED
'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { EventManagerLayout } from '@/components/dashboard/layout';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'react-hot-toast';

import { useAuth } from '@/hooks/use-auth';

import { 
  ArrowLeft,
  Save,
  Calendar,
  MapPin,
  Users,
  Clock,
  FileText,
  Trash2,
  AlertCircle,
  CheckCircle,
  Building,
  Globe,
  Mail,
  Phone,
  Image,
  Settings,
  Eye,
  Upload
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { useState } from 'react';

// ✅ FIXED: Updated schema to match API exactly
const eventUpdateSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  location: z.string().optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED']),
  tags: z.array(z.string()).optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"]
});

type EventUpdateFormData = z.infer<typeof eventUpdateSchema>;

export default function EventEditPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [eventData, setEventData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // ✅ FIXED: Form setup with proper default values
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting, isDirty },
    reset
  } = useForm<EventUpdateFormData>({
    resolver: zodResolver(eventUpdateSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      website: '',
      status: 'DRAFT',
      tags: []
    }
  });

  // ✅ FIXED: Direct API call to fetch event data
  React.useEffect(() => {
    const fetchEventData = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/events/${eventId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch event data');
        }

        const result = await response.json();
        const event = result.data?.event;

        if (event) {
          setEventData(event);
          
          // ✅ FIXED: Set form values with proper formatting
          const formData: EventUpdateFormData = {
            name: event.name || '',
            description: event.description || '',
            startDate: event.startDate ? format(new Date(event.startDate), "yyyy-MM-dd'T'HH:mm") : '',
            endDate: event.endDate ? format(new Date(event.endDate), "yyyy-MM-dd'T'HH:mm") : '',
            location: event.location || '',
            website: event.website || '',
            status: event.status || 'DRAFT',
            tags: Array.isArray(event.tags) ? event.tags : []
          };
          
          reset(formData);
          console.log('✅ Event data loaded and form populated:', formData);
        }
      } catch (err) {
        console.error('❌ Failed to fetch event:', err);
        setError('Failed to load event data');
      } finally {
        setIsLoading(false);
      }
    };

    if (eventId) {
      fetchEventData();
    }
  }, [eventId, reset]);

  // ✅ FIXED: Direct API call for form submission
  const onSubmit = async (data: EventUpdateFormData) => {
    try {
      console.log('📤 Submitting form data:', data);
      
      // ✅ FIXED: Send data directly without wrapping
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to update event');
      }

      const result = await response.json();
      console.log('✅ Event updated successfully:', result);
      
      toast.success('Event updated successfully!');
      router.push(`/event-manager/events/${eventId}`);
      
    } catch (error) {
      console.error('❌ Failed to update event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update event');
    }
  };

  // ✅ FIXED: Delete handler
  const handleDelete = async () => {
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorResult = await response.json();
        throw new Error(errorResult.error || 'Failed to delete event');
      }

      toast.success('Event deleted successfully!');
      router.push('/event-manager/events');
      
    } catch (error) {
      console.error('❌ Failed to delete event:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete event');
      setIsDeleting(false);
    }
  };

  // ✅ FIXED: Add tag handler
  const [tagInput, setTagInput] = useState('');
  
  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = watch('tags') || [];
      if (!currentTags.includes(tagInput.trim())) {
        setValue('tags', [...currentTags, tagInput.trim()]);
        setTagInput('');
      }
    }
  };

  const removeTag = (index: number) => {
    const currentTags = watch('tags') || [];
    setValue('tags', currentTags.filter((_, i) => i !== index));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800 border-green-300';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'ACTIVE': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800 border-gray-300';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <EventManagerLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </EventManagerLayout>
    );
  }

  if (error || !eventData) {
    return (
      <EventManagerLayout>
        <div className="space-y-6">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error || 'Event not found or you don\'t have permission to edit it.'}
            </AlertDescription>
          </Alert>
        </div>
      </EventManagerLayout>
    );
  }

  return (
    <EventManagerLayout>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Edit Event</h1>
              <div className="flex items-center space-x-2 mt-1">
                <p className="text-muted-foreground">Editing: {eventData.name}</p>
                <Badge className={`${getStatusColor(eventData.status)} border text-xs`}>
                  {eventData.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link href={`/event-manager/events/${eventId}`}>
              <Button type="button" variant="outline">
                <Eye className="h-4 w-4 mr-2" />
                View Event
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="min-w-[100px]"
            >
              {isSubmitting ? (
                <LoadingSpinner size="sm" />
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Unsaved Changes Warning */}
        {isDirty && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You have unsaved changes. Make sure to save before leaving this page.
            </AlertDescription>
          </Alert>
        )}

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Event Name *</Label>
                <Input
                  id="name"
                  {...register('name')}
                  placeholder="Enter event name"
                />
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Event Status</Label>
                <Select value={watch('status')} onValueChange={(value) => setValue('status', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                    <SelectItem value="CANCELLED">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Describe your event..."
                rows={4}
              />
            </div>

            {/* ✅ FIXED: Tags section */}
            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex gap-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Add tag"
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              {(watch('tags') ?? []).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(watch('tags') ?? []).map((tag, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        className="ml-1 text-xs hover:text-red-500"
                        onClick={() => removeTag(index)}
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Date & Time */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Date & Time
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date & Time *</Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register('startDate')}
                />
                {errors.startDate && (
                  <p className="text-sm text-red-600">{errors.startDate.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date & Time *</Label>
                <Input
                  id="endDate"
                  type="datetime-local"
                  {...register('endDate')}
                />
                {errors.endDate && (
                  <p className="text-sm text-red-600">{errors.endDate.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Location */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <MapPin className="h-5 w-5 mr-2" />
              Location
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Event Location</Label>
              <Input
                id="location"
                {...register('location')}
                placeholder="Enter event location"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                {...register('website')}
                placeholder="https://example.com"
              />
              {errors.website && (
                <p className="text-sm text-red-600">{errors.website.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <Trash2 className="h-5 w-5 mr-2" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-red-600">Delete Event</h4>
                <p className="text-sm text-red-600/80">
                  Permanently delete this event and all associated data. This action cannot be undone.
                </p>
              </div>
              <div className="space-x-2">
                {showDeleteConfirm ? (
                  <>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Confirm Delete
                        </>
                      )}
                    </Button>
                  </>
                ) : (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Event
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </EventManagerLayout>
  );
}