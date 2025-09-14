// src/app/(dashboard)/event-manager/sessions/create/page.tsx
'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  ArrowLeftIcon,
  CalendarIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  InfoIcon,
  SaveIcon,
  PlayIcon
} from 'lucide-react';

import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  Badge,
  Separator,
  Progress,
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { useEvents } from '@/hooks/use-events';
import { SessionForm } from '@/components/sessions/session-form';

// Types
interface CreateSteps {
  current: number;
  completed: number[];
}

interface Hall {
  id: string;
  name: string;
  capacity: number;
  location?: string;
  equipment?: string[];
}

const CREATION_STEPS = [
  {
    id: 1,
    title: 'Basic Information',
    description: 'Session title, type, and description',
    icon: InfoIcon
  },
  {
    id: 2,
    title: 'Schedule & Venue',
    description: 'Date, time, and hall selection',
    icon: CalendarIcon
  },
  {
    id: 3,
    title: 'Speakers & Requirements',
    description: 'Add speakers and equipment needs',
    icon: PlayIcon
  },
  {
    id: 4,
    title: 'Review & Create',
    description: 'Final review and confirmation',
    icon: CheckCircleIcon
  }
];

// Component that uses useSearchParams
function CreateSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // State
  const [selectedEvent, setSelectedEvent] = useState<string>('');
  const [creationSteps, setCreationSteps] = useState<CreateSteps>({
    current: 1,
    completed: []
  });
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Get event ID from query params if available
  const eventIdFromParams = searchParams.get('eventId');

  // Hooks
  const { data: eventsData, isLoading: eventsLoading } = useEvents({ limit: 100 });
  const events = eventsData?.data?.events || [];

  // Mock halls data (in real app, this would come from API)
  const halls: Hall[] = [
    {
      id: 'hall-1',
      name: 'Main Auditorium',
      capacity: 500,
      location: 'Ground Floor',
      equipment: ['Projector', 'Sound System', 'Stage Lighting']
    },
    {
      id: 'hall-2',
      name: 'Conference Room A',
      capacity: 100,
      location: 'First Floor',
      equipment: ['Projector', 'Whiteboard', 'Video Conferencing']
    },
    {
      id: 'hall-3',
      name: 'Workshop Hall',
      capacity: 50,
      location: 'Second Floor',
      equipment: ['Tables', 'Projector', 'Workshop Tools']
    }
  ];

  // Initialize event from params
  useEffect(() => {
    if (eventIdFromParams && events.length > 0) {
      const event = events.find(e => e.id === eventIdFromParams);
      if (event) {
        setSelectedEvent(eventIdFromParams);
      }
    }
  }, [eventIdFromParams, events]);

  // Handle session creation success
  const handleSessionCreated = (session: any) => {
    setIsCreating(false);
    setShowSuccessMessage(true);
    
    // Redirect to sessions list after showing success message
    setTimeout(() => {
      router.push(`/event-manager/sessions?eventId=${selectedEvent}`);
    }, 2000);
  };

  // Handle form cancel
  const handleCancel = () => {
    router.back();
  };

  // Get selected event details
  const selectedEventData = events.find(e => e.id === selectedEvent);

  // Quick Tips Component
  const QuickTips = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <InfoIcon className="h-5 w-5 text-blue-600" />
          Quick Tips for Creating Sessions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="flex items-start gap-2">
          <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Session Titles:</strong> Use clear, descriptive titles that indicate the content and target audience.
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Time Planning:</strong> Allow buffer time between sessions for transitions and networking.
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Hall Selection:</strong> Consider audience size, equipment needs, and accessibility requirements.
          </div>
        </div>
        <div className="flex items-start gap-2">
          <CheckCircleIcon className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
          <div>
            <strong>Speaker Management:</strong> Assign roles clearly - Speaker, Moderator, or Chairperson.
          </div>
        </div>
      </CardContent>
    </Card>
  );

  // Event Selector Component
  const EventSelector = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-base">Select Event</CardTitle>
      </CardHeader>
      <CardContent>
        {eventsLoading ? (
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          </div>
        ) : events.length === 0 ? (
          <Alert>
            <AlertCircleIcon className="h-4 w-4" />
            <AlertDescription>
              No events available. Please create an event first before adding sessions.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {selectedEventData ? (
              <div className="border rounded-lg p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">{selectedEventData.name}</h3>
                    <p className="text-sm text-blue-700">
                      {new Date(selectedEventData.startDate).toLocaleDateString()} - {new Date(selectedEventData.endDate).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-blue-600">{selectedEventData.description}</p>
                  </div>
                  <Badge className="bg-blue-100 text-blue-800">Selected</Badge>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-gray-600 mb-3">Choose an event to create sessions for:</p>
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="border rounded-lg p-3 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedEvent(event.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-medium">{event.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={event.status === 'PUBLISHED' ? 'default' : 'outline'}>
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Success Message Component
  const SuccessMessage = () => (
    <Alert className="mb-6 border-green-200 bg-green-50">
      <CheckCircleIcon className="h-4 w-4 text-green-600" />
      <AlertDescription className="text-green-800">
        <strong>Session created successfully!</strong> You will be redirected to the sessions list in a moment.
      </AlertDescription>
    </Alert>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => router.back()}
              >
                <ArrowLeftIcon className="h-4 w-4 mr-2" />
                Back
              </Button>
              
              <Separator orientation="vertical" className="h-6" />
              
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/event-manager">Dashboard</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/event-manager/sessions">Sessions</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>Create Session</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant="outline">
                <CalendarIcon className="h-3 w-3 mr-1" />
                Create Mode
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          
          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Progress Steps */}
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-base">Creation Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {CREATION_STEPS.map((step, index) => {
                  const StepIcon = step.icon;
                  const isCompleted = creationSteps.completed.includes(step.id);
                  const isCurrent = creationSteps.current === step.id;
                  
                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'flex items-start gap-3 p-3 rounded-lg transition-colors',
                        isCurrent && 'bg-blue-50 border border-blue-200',
                        isCompleted && 'bg-green-50 border border-green-200'
                      )}
                    >
                      <div className={cn(
                        'flex items-center justify-center w-8 h-8 rounded-full border-2',
                        isCurrent && 'border-blue-500 bg-blue-500 text-white',
                        isCompleted && 'border-green-500 bg-green-500 text-white',
                        !isCurrent && !isCompleted && 'border-gray-300 bg-white text-gray-500'
                      )}>
                        {isCompleted ? (
                          <CheckCircleIcon className="h-4 w-4" />
                        ) : (
                          <StepIcon className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className={cn(
                          'text-sm font-medium',
                          isCurrent && 'text-blue-900',
                          isCompleted && 'text-green-900',
                          !isCurrent && !isCompleted && 'text-gray-700'
                        )}>
                          {step.title}
                        </h4>
                        <p className={cn(
                          'text-xs mt-1',
                          isCurrent && 'text-blue-700',
                          isCompleted && 'text-green-700',
                          !isCurrent && !isCompleted && 'text-gray-500'
                        )}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
                
                <div className="pt-2">
                  <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                    <span>Overall Progress</span>
                    <span>{Math.round((creationSteps.completed.length / CREATION_STEPS.length) * 100)}%</span>
                  </div>
                  <Progress 
                    value={(creationSteps.completed.length / CREATION_STEPS.length) * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Quick Tips */}
            <QuickTips />
          </div>

          {/* Main Form Area */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Create New Session</h1>
                <p className="text-gray-600 mt-2">
                  Add a new session to your conference schedule. Fill in the details below to create a professional session entry.
                </p>
              </div>

              {/* Success Message */}
              {showSuccessMessage && <SuccessMessage />}

              {/* Event Selector */}
              {!selectedEvent && <EventSelector />}

              {/* Session Form */}
              {selectedEvent && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CalendarIcon className="h-5 w-5" />
                      Session Details
                    </CardTitle>
                    <p className="text-sm text-gray-600">
                      Creating session for: <strong>{selectedEventData?.name}</strong>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <SessionForm
                      eventId={selectedEvent}
                      halls={halls}
                      onSuccess={handleSessionCreated}
                      onCancel={handleCancel}
                      className="border-none shadow-none p-0"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Helper Information */}
              {selectedEvent && (
                <Alert>
                  <InfoIcon className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Need help?</strong> The system will automatically check for schedule conflicts and notify you if there are any issues. You can save as draft and come back to edit later.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Loading skeleton component
function CreateSessionSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              <div className="h-6 w-px bg-gray-300"></div>
              <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-6 w-24 bg-gray-200 rounded animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Skeleton */}
          <div className="lg:col-span-1">
            <Card className="mb-6">
              <CardHeader>
                <div className="h-5 w-32 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3 p-3">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 w-32 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Main Form Skeleton */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              <div>
                <div className="h-8 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-4 w-96 bg-gray-200 rounded animate-pulse"></div>
              </div>
              
              <Card> 
                <CardHeader>
                  <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-48 bg-gray-200 rounded animate-pulse"></div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Main component with Suspense wrapper
export default function CreateSessionPage() {
  return (
    <Suspense fallback={<CreateSessionSkeleton />}>
      <CreateSessionForm />
    </Suspense>
  );
}