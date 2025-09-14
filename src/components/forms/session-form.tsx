// src/components/forms/session-form.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner } from '@/components/ui/loading';

import { useCreateSession, useUpdateSession, useCheckConflicts } from '@/hooks/use-sessions';
import { useFacultyByEvent } from '@/hooks/use-faculty';
import { useEvents } from '@/hooks/use-events';
import { useRooms } from '@/hooks/use-rooms'; // ADDED: Import rooms hook

import { Calendar, Clock, MapPin, Users, Plus, X, AlertTriangle, CheckCircle } from 'lucide-react';

// Validation schema
const sessionSchema = z.object({
  eventId: z.string().min(1, 'Event is required'),
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  hallId: z.string().optional(),
  sessionType: z.enum(['KEYNOTE', 'PRESENTATION', 'PANEL', 'WORKSHOP', 'POSTER', 'BREAK']),
  maxParticipants: z.number().positive().optional(),
  requirements: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  isBreak: z.boolean().default(false),
}).refine((data) => {
  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  return start < end;
}, {
  message: "End time must be after start time",
  path: ["endTime"],
});

type SessionFormData = z.infer<typeof sessionSchema>;

interface SessionFormProps {
  sessionId?: string;
  initialData?: Partial<SessionFormData>;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function SessionForm({ sessionId, initialData, onSuccess, onCancel }: SessionFormProps) {
  const [selectedSpeakers, setSelectedSpeakers] = useState<Array<{
    userId: string;
    role: 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON';
    user: any;
  }>>([]);
  const [conflictCheck, setConflictCheck] = useState<any>(null);
  const [requirementInput, setRequirementInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  // Form setup
  const form = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      eventId: initialData?.eventId || '',
      title: initialData?.title || '',
      description: initialData?.description || '',
      startTime: initialData?.startTime || '',
      endTime: initialData?.endTime || '',
      hallId: initialData?.hallId || '',
      sessionType: initialData?.sessionType || 'PRESENTATION',
      maxParticipants: initialData?.maxParticipants,
      requirements: initialData?.requirements || [],
      tags: initialData?.tags || [],
      isBreak: initialData?.isBreak || false,
    },
  });

  const { watch, setValue, getValues } = form;
  const watchedEventId = watch('eventId');
  const watchedHallId = watch('hallId');
  const watchedStartTime = watch('startTime');
  const watchedEndTime = watch('endTime');

  // Data fetching hooks
  const { data: events } = useEvents({ status: 'PUBLISHED' });
  const { data: facultyData } = useFacultyByEvent(watchedEventId);
  const { data: roomsData, isLoading: roomsLoading, error: roomsError } = useRooms(true); // ADDED: Fetch active rooms

  // Mutations
  const createSession = useCreateSession();
  const updateSession = useUpdateSession();
  const checkConflicts = useCheckConflicts();

  // Get available faculty
  const availableFaculty = facultyData?.data?.faculty || [];
  const unselectedFaculty = availableFaculty.filter(
    faculty => !selectedSpeakers.some(speaker => speaker.userId === faculty.id)
  );

  // ADDED: Get available rooms
  const availableRooms = roomsData?.data || [];

  // Check for conflicts when hall or time changes
  const handleConflictCheck = async () => {
    if (watchedHallId && watchedStartTime && watchedEndTime) {
      try {
        const result = await checkConflicts.mutateAsync({
          hallId: watchedHallId,
          startTime: watchedStartTime,
          endTime: watchedEndTime,
          sessionId: sessionId,
        });
        setConflictCheck(result);
      } catch (error: any) {
        setConflictCheck({ hasConflicts: true, conflicts: [] });
      }
    }
  };

  // Add speaker
  const addSpeaker = (facultyId: string, role: 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON') => {
    const faculty = availableFaculty.find(f => f.id === facultyId);
    if (faculty) {
      setSelectedSpeakers(prev => [...prev, {
        userId: facultyId,
        role,
        user: faculty
      }]);
    }
  };

  // Remove speaker
  const removeSpeaker = (userId: string) => {
    setSelectedSpeakers(prev => prev.filter(speaker => speaker.userId !== userId));
  };

  // Add requirement
  const addRequirement = () => {
    if (requirementInput.trim()) {
      const currentRequirements = getValues('requirements') || [];
      setValue('requirements', [...currentRequirements, requirementInput.trim()]);
      setRequirementInput('');
    }
  };

  // Remove requirement
  const removeRequirement = (index: number) => {
    const currentRequirements = getValues('requirements') || [];
    setValue('requirements', currentRequirements.filter((_, i) => i !== index));
  };

  // Add tag
  const addTag = () => {
    if (tagInput.trim()) {
      const currentTags = getValues('tags') || [];
      setValue('tags', [...currentTags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // Remove tag
  const removeTag = (index: number) => {
    const currentTags = getValues('tags') || [];
    setValue('tags', currentTags.filter((_, i) => i !== index));
  };

  // Form submission
  const onSubmit = async (data: SessionFormData) => {
    try {
      const sessionData = {
        ...data,
        speakers: selectedSpeakers,
      };

      if (sessionId) {
        await updateSession.mutateAsync({
          sessionId,
          updates: sessionData,
        });
      } else {
        await createSession.mutateAsync(sessionData);
      }

      onSuccess?.();
    } catch (error) {
      console.error('Session form error:', error);
    }
  };

  const isLoading = createSession.isPending || updateSession.isPending;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Basic Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Event Selection */}
          <div className="space-y-2">
            <Label htmlFor="eventId">Event *</Label>
            <Select value={watch('eventId')} onValueChange={(value) => setValue('eventId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select an event" />
              </SelectTrigger>
              <SelectContent>
                {events?.data?.events?.map((event) => (
                  <SelectItem key={event.id} value={event.id}>
                    {event.name} - {format(new Date(event.startDate), 'MMM dd, yyyy')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.eventId && (
              <p className="text-sm text-red-500">{form.formState.errors.eventId.message}</p>
            )}
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              {...form.register('title')}
              placeholder="Enter session title"
            />
            {form.formState.errors.title && (
              <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register('description')}
              placeholder="Enter session description"
              rows={3}
            />
          </div>

          {/* Session Type */}
          <div className="space-y-2">
            <Label htmlFor="sessionType">Session Type *</Label>
            <Select value={watch('sessionType')} onValueChange={(value) => setValue('sessionType', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="KEYNOTE">Keynote</SelectItem>
                <SelectItem value="PRESENTATION">Presentation</SelectItem>
                <SelectItem value="PANEL">Panel Discussion</SelectItem>
                <SelectItem value="WORKSHOP">Workshop</SelectItem>
                <SelectItem value="POSTER">Poster Session</SelectItem>
                <SelectItem value="BREAK">Break</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedule & Venue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Schedule & Venue
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="datetime-local"
                {...form.register('startTime')}
              />
              {form.formState.errors.startTime && (
                <p className="text-sm text-red-500">{form.formState.errors.startTime.message}</p>
              )}
            </div>

            {/* End Time */}
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="datetime-local"
                {...form.register('endTime')}
              />
              {form.formState.errors.endTime && (
                <p className="text-sm text-red-500">{form.formState.errors.endTime.message}</p>
              )}
            </div>
          </div>

          {/* FIXED: Hall Selection with Real Data */}
          <div className="space-y-2">
            <Label htmlFor="hallId">Room/Hall</Label>
            {roomsLoading ? (
              <div className="flex items-center gap-2 p-2 border rounded-md">
                <LoadingSpinner size="sm" />
                <span className="text-sm text-gray-500">Loading rooms...</span>
              </div>
            ) : roomsError ? (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Failed to load rooms. Please refresh the page.
                </AlertDescription>
              </Alert>
            ) : (
              <Select value={watch('hallId') || ''} onValueChange={(value) => setValue('hallId', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a room" />
                </SelectTrigger>
                <SelectContent>
                  {availableRooms.length === 0 ? (
                    <SelectItem value="" disabled>
                      No rooms available
                    </SelectItem>
                  ) : (
                    availableRooms.map((room) => (
                      <SelectItem key={room.id} value={room.id}>
                        {room.name} - {room.location} (Capacity: {room.capacity})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Conflict Check */}
          {watchedHallId && watchedStartTime && watchedEndTime && (
            <div className="space-y-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleConflictCheck}
                disabled={checkConflicts.isPending}
              >
                {checkConflicts.isPending ? (
                  <LoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <CheckCircle className="h-4 w-4 mr-2" />
                )}
                Check for Conflicts
              </Button>

              {conflictCheck && (
                <Alert variant={conflictCheck.hasConflicts ? "destructive" : "default"}>
                  {conflictCheck.hasConflicts ? (
                    <AlertTriangle className="h-4 w-4" />
                  ) : (
                    <CheckCircle className="h-4 w-4" />
                  )}
                  <AlertDescription>
                    {conflictCheck.hasConflicts 
                      ? `Schedule conflict detected! Room is already booked during this time.`
                      : `No conflicts found. Room is available for the selected time.`
                    }
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Max Participants */}
          <div className="space-y-2">
            <Label htmlFor="maxParticipants">Maximum Participants</Label>
            <Input
              id="maxParticipants"
              type="number"
              {...form.register('maxParticipants', { valueAsNumber: true })}
              placeholder="Leave empty for no limit"
            />
          </div>
        </CardContent>
      </Card>

      {/* Speakers & Moderators */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Speakers & Moderators
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Add Speaker */}
          {unselectedFaculty.length > 0 && (
            <div className="space-y-2">
              <Label>Add Speaker/Moderator</Label>
              <div className="flex gap-2">
                <Select onValueChange={(facultyId) => {
                  const select = document.getElementById('role-select') as HTMLSelectElement;
                  const role = (select?.value || 'SPEAKER') as 'SPEAKER' | 'MODERATOR' | 'CHAIRPERSON';
                  addSpeaker(facultyId, role);
                }}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select faculty" />
                  </SelectTrigger>
                  <SelectContent>
                    {unselectedFaculty.map((faculty) => (
                      <SelectItem key={faculty.id} value={faculty.id}>
                        {faculty.name} - {faculty.institution}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <select id="role-select" className="px-3 py-2 border border-gray-300 rounded-md">
                  <option value="SPEAKER">Speaker</option>
                  <option value="MODERATOR">Moderator</option>
                  <option value="CHAIRPERSON">Chairperson</option>
                </select>
              </div>
            </div>
          )}

          {/* Selected Speakers */}
          {selectedSpeakers.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Speakers</Label>
              <div className="space-y-2">
                {selectedSpeakers.map((speaker) => (
                  <div key={speaker.userId} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <h5 className="font-medium">{speaker.user.name}</h5>
                        <p className="text-sm text-muted-foreground">{speaker.user.institution}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={speaker.role === 'SPEAKER' ? 'default' : 'secondary'}>
                        {speaker.role}
                      </Badge>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSpeaker(speaker.userId)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Information */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Requirements */}
          <div className="space-y-2">
            <Label>Requirements</Label>
            <div className="flex gap-2">
              <Input
                value={requirementInput}
                onChange={(e) => setRequirementInput(e.target.value)}
                placeholder="Add requirement"
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addRequirement())}
              />
              <Button type="button" variant="outline" onClick={addRequirement}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(watch('requirements') ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(watch('requirements') ?? []).map((req, index) => (
                  <Badge key={index} variant="outline" className="gap-1">
                    {req}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeRequirement(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Tags */}
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
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {(watch('tags') ?? []).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(watch('tags') ?? []).map((tag, index) => (
                  <Badge key={index} variant="secondary" className="gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(index)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isLoading || (conflictCheck?.hasConflicts && watchedHallId)}
        >
          {isLoading && <LoadingSpinner size="sm" className="mr-2" />}
          {sessionId ? 'Update Session' : 'Create Session'}
        </Button>
      </div>
    </form>
  );
}