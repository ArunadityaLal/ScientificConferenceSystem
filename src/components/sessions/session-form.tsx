'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { format } from 'date-fns';
import { 
  CalendarIcon, 
  ClockIcon, 
  MapPinIcon, 
  UsersIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
  SaveIcon,
  XIcon,
  AlertTriangleIcon
} from 'lucide-react';

import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Badge,
  Separator,
  Alert,
  AlertDescription,
  // Calendar,
  // Popover,
  // PopoverContent,
  // PopoverTrigger,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui';

import { Switch } from '@/components/ui/switch';

import { cn } from '@/lib/utils';


// Types
interface Hall {
  id: string;
  name: string;
  capacity: number;
  location?: string;
}

interface Session {
  id?: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  sessionType: string;
  hallId?: string;
  maxParticipants?: number;
  isBreak?: boolean;
  requirements?: string[];
  tags?: string[];
}

interface SessionFormProps {
  eventId: string;
  session?: Session | null;
  halls: Hall[];
  onSuccess: (session: Session) => void;
  onCancel: () => void;
  className?: string;
}

// Form schema
const sessionSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  sessionType: z.enum(['KEYNOTE', 'PRESENTATION', 'PANEL', 'WORKSHOP', 'POSTER', 'BREAK']),
  hallId: z.string().optional(),
  maxParticipants: z.number().min(1).optional(),
  isBreak: z.boolean().default(false),
  requirements: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([])
}).refine(data => {
  if (data.startTime && data.endTime) {
    return new Date(data.startTime) < new Date(data.endTime);
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endTime"]
});

type SessionFormData = z.infer<typeof sessionSchema>;

const SESSION_TYPES = [
  { value: 'KEYNOTE', label: 'Keynote Speech', color: 'bg-purple-100 text-purple-800' },
  { value: 'PRESENTATION', label: 'Presentation', color: 'bg-blue-100 text-blue-800' },
  { value: 'PANEL', label: 'Panel Discussion', color: 'bg-green-100 text-green-800' },
  { value: 'WORKSHOP', label: 'Workshop', color: 'bg-orange-100 text-orange-800' },
  { value: 'POSTER', label: 'Poster Session', color: 'bg-cyan-100 text-cyan-800' },
  { value: 'BREAK', label: 'Break/Networking', color: 'bg-gray-100 text-gray-600' }
];

const COMMON_REQUIREMENTS = [
  'Microphone',
  'Projector',
  'Screen',
  'Whiteboard',
  'Flipchart',
  'Audio System',
  'Recording Equipment',
  'Live Streaming',
  'Catering',
  'WiFi Access'
];

export function SessionForm({ 
  eventId, 
  session, 
  halls, 
  onSuccess, 
  onCancel,
  className 
}: SessionFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newRequirement, setNewRequirement] = useState('');
  const [newTag, setNewTag] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset
  } = useForm<SessionFormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      title: session?.title || '',
      description: session?.description || '',
      startTime: session ? format(session.startTime, "yyyy-MM-dd'T'HH:mm") : '',
      endTime: session ? format(session.endTime, "yyyy-MM-dd'T'HH:mm") : '',
      sessionType: session?.sessionType as any || 'PRESENTATION',
      hallId: session?.hallId || '',
      maxParticipants: session?.maxParticipants || undefined,
      isBreak: session?.isBreak || false,
      requirements: session?.requirements || [],
      tags: session?.tags || []
    }
  });

  const watchedFields = watch();
  const selectedSessionType = SESSION_TYPES.find(type => type.value === watchedFields.sessionType);

  // Handle form submission
  const onSubmit = async (data: SessionFormData) => {
    try {
      setIsSubmitting(true);

      const sessionData = {
        ...data,
        startTime: new Date(data.startTime),
        endTime: new Date(data.endTime),
        eventId,
        maxParticipants: data.maxParticipants || null
      };

      // Here you would make the API call to create/update session
      console.log('Session data:', sessionData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onSuccess(sessionData as Session);
    } catch (error) {
      console.error('Error saving session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add requirement
  const addRequirement = () => {
    if (newRequirement.trim() && !watchedFields.requirements.includes(newRequirement.trim())) {
      const updated = [...watchedFields.requirements, newRequirement.trim()];
      setValue('requirements', updated);
      setNewRequirement('');
    }
  };

  // Remove requirement
  const removeRequirement = (requirement: string) => {
    const updated = watchedFields.requirements.filter(req => req !== requirement);
    setValue('requirements', updated);
  };

  // Add tag
  const addTag = () => {
    if (newTag.trim() && !watchedFields.tags.includes(newTag.trim())) {
      const updated = [...watchedFields.tags, newTag.trim()];
      setValue('tags', updated);
      setNewTag('');
    }
  };

  // Remove tag
  const removeTag = (tag: string) => {
    const updated = watchedFields.tags.filter(t => t !== tag);
    setValue('tags', updated);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className={cn("space-y-6", className)}>
      <Tabs defaultValue="basic" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title */}
              <div>
                <Label htmlFor="title">Session Title *</Label>
                <Input
                  id="title"
                  {...register('title')}
                  placeholder="Enter session title..."
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-600 mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Describe what this session is about..."
                  rows={3}
                />
              </div>

              {/* Session Type */}
              <div>
                <Label htmlFor="sessionType">Session Type *</Label>
                <Select value={watchedFields.sessionType} onValueChange={(value) => setValue('sessionType', value as any)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SESSION_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className={type.color}>
                            {type.label}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Break Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  checked={watchedFields.isBreak}
                  onCheckedChange={(checked) => setValue('isBreak', checked)}
                />
                <Label htmlFor="isBreak">This is a break/networking session</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Scheduling */}
        <TabsContent value="scheduling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarIcon className="h-5 w-5" />
                Schedule & Venue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime">Start Time *</Label>
                  <Input
                    id="startTime"
                    type="datetime-local"
                    {...register('startTime')}
                    className={errors.startTime ? 'border-red-500' : ''}
                  />
                  {errors.startTime && (
                    <p className="text-sm text-red-600 mt-1">{errors.startTime.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="endTime">End Time *</Label>
                  <Input
                    id="endTime"
                    type="datetime-local"
                    {...register('endTime')}
                    className={errors.endTime ? 'border-red-500' : ''}
                  />
                  {errors.endTime && (
                    <p className="text-sm text-red-600 mt-1">{errors.endTime.message}</p>
                  )}
                </div>
              </div>

              {/* Hall Selection */}
              <div>
                <Label htmlFor="hallId">Hall/Room</Label>
                <Select value={watchedFields.hallId} onValueChange={(value) => setValue('hallId', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hall (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                   <SelectItem value="none">No hall assigned</SelectItem>
                    {halls.map((hall) => (
                      <SelectItem key={hall.id} value={hall.id}>
                        <div className="flex items-center gap-2">
                          <MapPinIcon className="h-4 w-4" />
                          <div>
                            <div className="font-medium">{hall.name}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <UsersIcon className="h-3 w-3" />
                              Capacity: {hall.capacity}
                              {hall.location && ` • ${hall.location}`}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Max Participants */}
              <div>
                <Label htmlFor="maxParticipants">Max Participants</Label>
                <Input
                  id="maxParticipants"
                  type="number"
                  min="1"
                  {...register('maxParticipants', { valueAsNumber: true })}
                  placeholder="Leave empty for unlimited"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced */}
        <TabsContent value="advanced" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Requirements & Tags</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Requirements */}
              <div>
                <Label className="text-base font-medium">Equipment & Requirements</Label>
                <div className="mt-2 space-y-3">
                  {/* Common Requirements */}
                  <div>
                    <Label className="text-sm text-gray-600">Quick Add:</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {COMMON_REQUIREMENTS.map((req) => (
                        <Button
                          key={req}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => {
                            if (!watchedFields.requirements.includes(req)) {
                              setValue('requirements', [...watchedFields.requirements, req]);
                            }
                          }}
                          disabled={watchedFields.requirements.includes(req)}
                        >
                          <PlusIcon className="h-3 w-3 mr-1" />
                          {req}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Requirement Input */}
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add custom requirement..."
                      value={newRequirement}
                      onChange={(e) => setNewRequirement(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addRequirement();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addRequirement}
                      disabled={!newRequirement.trim()}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Selected Requirements */}
                  {watchedFields.requirements.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Selected Requirements:</Label>
                      <div className="flex flex-wrap gap-2">
                        {watchedFields.requirements.map((requirement) => (
                          <Badge
                            key={requirement}
                            variant="secondary"
                            className="flex items-center gap-1 px-2 py-1"
                          >
                            {requirement}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeRequirement(requirement)}
                            >
                              <XIcon className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div>
                <Label className="text-base font-medium">Tags</Label>
                <div className="mt-2 space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add tag..."
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addTag}
                      disabled={!newTag.trim()}
                    >
                      <PlusIcon className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Selected Tags */}
                  {watchedFields.tags.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Tags:</Label>
                      <div className="flex flex-wrap gap-2">
                        {watchedFields.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className="flex items-center gap-1 px-2 py-1"
                          >
                            {tag}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-4 w-4 p-0 hover:bg-transparent"
                              onClick={() => removeTag(tag)}
                            >
                              <XIcon className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <div className="text-sm text-gray-600">
          {selectedSessionType && (
            <div className="flex items-center gap-2">
              <span>Session type:</span>
              <Badge variant="outline" className={selectedSessionType.color}>
                {selectedSessionType.label}
              </Badge>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-24"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SaveIcon className="h-4 w-4" />
                {session ? 'Update Session' : 'Create Session'}
              </div>
            )}
          </Button>
        </div>
      </div>

      {/* Time Validation Alert */}
      {errors.endTime?.message === "End time must be after start time" && (
        <Alert className="mt-4">
          <AlertTriangleIcon className="h-4 w-4" />
          <AlertDescription>
            Please ensure the end time is after the start time.
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}

// Also export as default for compatibility
export default SessionForm;