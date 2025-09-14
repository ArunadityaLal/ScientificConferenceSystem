// src/app/(dashboard)/event-manager/events/[id]/page.tsx
// ✅ FIXED: Correct API data mapping
'use client';

import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { EventManagerLayout } from '@/components/dashboard/layout';

// ✅ FIXED: Split imports to avoid missing exports
import { useEvent } from '@/hooks/use-events';
import { useEventSessions, useEventRegistrations, useEventFaculty } from '@/hooks/use-event-details';
import { useAuth } from '@/hooks/use-auth';

// ✅ NEW: Import Export and Share components
import { ExportButton } from '@/components/events/ExportButton';
import { ShareButton } from '@/components/events/ShareButton';

import { 
  ArrowLeft,
  Edit,
  Calendar,
  MapPin,
  Users,
  Clock,
  FileText,
  Download,
  Share2,
  Settings,
  BarChart3,
  Award,
  Mail,
  Phone,
  Globe,
  Building,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  UserCheck,
  Target,
  TrendingUp
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

// ✅ FIXED: Safe date formatting helper functions
const formatSafeDate = (dateString: string | null | undefined, formatStr: string = 'PPP'): string => {
  if (!dateString) return 'TBD';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return format(date, formatStr);
  } catch (error) {
    console.warn('Date formatting error:', error);
    return 'Invalid Date';
  }
};

const formatSafeDateRange = (startDate: string | null | undefined, endDate: string | null | undefined): string => {
  const start = formatSafeDate(startDate, 'PPP');
  const end = formatSafeDate(endDate, 'PPP');
  
  if (start === 'TBD' && end === 'TBD') return 'Dates TBD';
  if (start === end) return start;
  return `${start} - ${end}`;
};

const formatSafeTimeRange = (startDate: string | null | undefined, endDate: string | null | undefined): string => {
  const start = formatSafeDate(startDate, 'p');
  const end = formatSafeDate(endDate, 'p');
  
  if (start === 'TBD' && end === 'TBD') return 'Time TBD';
  if (start === end) return start;
  return `${start} - ${end}`;
};

export default function EventDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const eventId = params.id as string;

  // Data fetching hooks
  const { data: eventResponse, isLoading: eventLoading, error: eventError } = useEvent(eventId);
  const { data: sessionsData, isLoading: sessionsLoading } = useEventSessions(eventId);
  const { data: registrationsData, isLoading: registrationsLoading } = useEventRegistrations(eventId);
  const { data: facultyData, isLoading: facultyLoading } = useEventFaculty(eventId);

  // ✅ FIXED: Correct data extraction from API response
  const event = eventResponse?.data; // ← Fixed: event is nested in data.event
  const sessions = sessionsData?.data?.sessions || [];
const registrations = registrationsData?.data?.registrations || [];
const faculty = facultyData?.data?.faculty || [];

  // ✅ FIXED: Use stats from API or calculate fallback
  const totalSessions = sessionsData?.data?.stats?.totalSessions || sessions.length;
  const totalRegistrations = registrationsData?.data?.stats?.totalRegistrations || registrations.length;
  const approvedRegistrations = registrations.filter((r: any) => r.status === 'APPROVED').length;
  const pendingRegistrations = registrations.filter((r: any) => r.status === 'PENDING').length;
  const totalFaculty = facultyData?.data?.stats?.totalFaculty || faculty.length;
  const confirmedFaculty = faculty.filter((f: any) => f.status === 'CONFIRMED').length;

  // ✅ FIXED: Safe event status calculations
  const isEventPast = event && event.endDate ? new Date(event.endDate) < new Date() : false;
  const isEventActive = event && event.startDate && event.endDate ? 
    new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date() : false;
  const isEventUpcoming = event && event.startDate ? new Date(event.startDate) > new Date() : false;

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return <CheckCircle className="h-4 w-4" />;
      case 'DRAFT': return <AlertCircle className="h-4 w-4" />;
      case 'ACTIVE': return <Eye className="h-4 w-4" />;
      case 'COMPLETED': return <Award className="h-4 w-4" />;
      case 'CANCELLED': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  // ✅ FIXED: Debug logging to check data
  console.log('🐛 Debug Event Data:', {
    eventResponse,
    event,
    hasEvent: !!event,
    eventName: event?.name,
    startDate: event?.startDate,
    endDate: event?.endDate,
    location: event?.location
  });

  if (eventLoading) {
    return (
      <EventManagerLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </EventManagerLayout>
    );
  }

  if (eventError || !event) {
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
              Event not found or you don't have permission to view it.
            </AlertDescription>
          </Alert>
        </div>
      </EventManagerLayout>
    );
  }

  return (
    <EventManagerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="outline" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
              <p className="text-muted-foreground">Event Details & Management</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* ✅ UPDATED: Export Button with functionality */}
            <ExportButton 
              eventId={eventId}
              variant="outline"
              size="default"
            />
            
            {/* ✅ UPDATED: Share Button with functionality */}
            <ShareButton 
              eventId={eventId}
              eventName={event.name}
              variant="outline"
              size="default"
            />
            
            <Link href={`/event-manager/events/${eventId}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Event Status Alert */}
        {isEventActive && (
          <Alert>
            <Eye className="h-4 w-4" />
            <AlertDescription>
              This event is currently <strong>LIVE</strong>! Sessions are running and participants are actively engaging.
            </AlertDescription>
          </Alert>
        )}

        {/* Event Overview Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Event Overview
              </CardTitle>
              <div className="flex items-center space-x-2">
                <Badge className={`${getStatusColor(event.status)} border`}>
                  {getStatusIcon(event.status)}
                  <span className="ml-1">{event.status}</span>
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">Basic Information</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                      {/* ✅ FIXED: Now using real data from API */}
                      <span>{formatSafeDateRange(
                        typeof event.startDate === 'string' ? event.startDate : event.startDate?.toISOString(),
                        typeof event.endDate === 'string' ? event.endDate : event.endDate?.toISOString()
                      )}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                      {/* ✅ FIXED: Now using real data from API */}
                      <span>{formatSafeTimeRange(
                        typeof event.startDate === 'string' ? event.startDate : event.startDate?.toISOString(),
                        typeof event.endDate === 'string' ? event.endDate : event.endDate?.toISOString()
                      )}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {/* ✅ FIXED: Now using real location from API */}
                      <span>{event.location || 'Venue TBD'}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-muted-foreground" />
                      <span>Expected: {event.maxParticipants || 'Not specified'} attendees</span>
                    </div>
                  </div>
                </div>

                {event.description && (
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {event.description}
                    </p>
                  </div>
                )}
              </div>

              {/* Contact & Additional Info */}
              <div className="space-y-4">
                {event.contactEmail && (
                  <div>
                    <h4 className="font-medium mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.contactEmail}</span>
                      </div>
                      {event.website && (
                        <div className="flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-muted-foreground" />
                          <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {event.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {event.eventType && (
                  <div>
                    <h4 className="font-medium mb-2">Event Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <Target className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>Type: {event.eventType}</span>
                      </div>
                      {event.tags && event.tags.length > 0 && (
                        <div className="flex items-center">
                          <Building className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span>Tags: {event.tags.join(', ')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* ✅ NEW: Show Creator Information */}
                {event.creator && (
                  <div>
                    <h4 className="font-medium mb-2">Event Creator</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center">
                        <UserCheck className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.creator.name}</span>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-muted-foreground" />
                        <span>{event.creator.email}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionsLoading ? <LoadingSpinner size="sm" /> : totalSessions}
              </div>
              <p className="text-xs text-muted-foreground">
                Scheduled sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Registrations</CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {registrationsLoading ? <LoadingSpinner size="sm" /> : approvedRegistrations}
              </div>
              <p className="text-xs text-muted-foreground">
                {pendingRegistrations} pending approval
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Faculty</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {facultyLoading ? <LoadingSpinner size="sm" /> : confirmedFaculty}
              </div>
              <p className="text-xs text-muted-foreground">
                {totalFaculty - confirmedFaculty} pending confirmation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Fill Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {event.maxParticipants ? 
                  `${Math.round((approvedRegistrations / event.maxParticipants) * 100)}%` : 
                  'N/A'
                }
              </div>
              <p className="text-xs text-muted-foreground">
                Of expected capacity
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Sessions */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Sessions
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sessionsLoading ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : sessions.length > 0 ? (
                <div className="space-y-4">
                  {sessions.slice(0, 3).map((session: any) => {
                    // ✅ FIXED: Safe session date handling
                    const sessionDateStr = session.startTime;
                    const sessionDate = sessionDateStr ? new Date(sessionDateStr) : null;
                    const isValidDate = sessionDate && !isNaN(sessionDate.getTime());
                    const isSessionPast = isValidDate ? sessionDate < new Date() : false;
                    const isSessionToday = isValidDate ? sessionDate.toDateString() === new Date().toDateString() : false;
                    
                    return (
                      <div key={session.id} className={`p-4 rounded-lg border transition-colors ${
                        isSessionToday ? 'bg-blue-50 border-blue-200' :
                        isSessionPast ? 'bg-gray-50 border-gray-200' :
                        'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h5 className="font-medium truncate">{session.title}</h5>
                            <div className="flex items-center text-sm text-muted-foreground mt-1">
                              <Clock className="h-3 w-3 mr-1" />
                              {/* ✅ FIXED: Safe session date formatting */}
                              {formatSafeDate(sessionDateStr, 'MMM dd, HH:mm')}
                              {session.hall && session.hall.name && (
                                <>
                                  <MapPin className="h-3 w-3 ml-2 mr-1" />
                                  {session.hall.name}
                                </>
                              )}
                            </div>
                            {session.speakers && session.speakers.length > 0 && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Speaker: {session.speakers[0].user.name}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center space-x-2">
                            {isSessionToday && (
                              <Badge variant="default" className="text-xs">
                                Today
                              </Badge>
                            )}
                            {isSessionPast && (
                              <Badge variant="secondary" className="text-xs">
                                Completed
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {sessions.length > 3 && (
                    <Button variant="ghost" className="w-full">
                      View All {sessions.length} Sessions
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No sessions scheduled yet</p>
                  <Button className="mt-3" size="sm">
                    Add Session
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Registrations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Recent Registrations
                </div>
                <Button variant="outline" size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Manage All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {registrationsLoading ? (
                <div className="space-y-3">
                  <SkeletonCard />
                  <SkeletonCard />
                </div>
              ) : registrations.length > 0 ? (
                <div className="space-y-4">
                  {registrations.slice(0, 4).map((registration: any) => {
                    return (
                      <div key={registration.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h5 className="font-medium truncate">{registration.user.name}</h5>
                          <p className="text-sm text-muted-foreground">{registration.user.email}</p>
                          <p className="text-xs text-muted-foreground">
                            {/* ✅ FIXED: Safe registration date formatting */}
                            Registered: {formatSafeDate(registration.registrationDate, 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <Badge 
                          variant={
                            registration.status === 'APPROVED' ? 'outline' :
                            registration.status === 'PENDING' ? 'secondary' :
                            'destructive'
                          } 
                          className="text-xs"
                        >
                          {registration.status}
                        </Badge>
                      </div>
                    );
                  })}
                  
                  {registrations.length > 4 && (
                    <Button variant="ghost" className="w-full">
                      View All {registrations.length} Registrations
                    </Button>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <UserCheck className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No registrations yet</p>
                  <p className="text-sm">Registrations will appear here</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        {/* <Card> */}
          {/* <CardHeader>
            <CardTitle>Event Management Actions</CardTitle>
          </CardHeader> */}
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {/* <Link href={`/event-manager/events/${eventId}/edit`}>
                <Button className="w-full h-auto p-4 flex flex-col items-center space-y-2">
                  <Edit className="h-6 w-6" />
                  <span>Edit Event</span>
                </Button>
              </Link> */}
              
              {/* ✅ UPDATED: Export Action with functionality */}
              {/* <div className="w-full">
                <ExportButton 
                  eventId={eventId}
                  variant="outline"
                  className="w-full h-auto p-4 flex-col"
                />
              </div> */}
              
              {/* ✅ UPDATED: Share Action with functionality */}
              {/* <div className="w-full">
                <ShareButton 
                  eventId={eventId}
                  eventName={event.name}
                  variant="outline"
                  className="w-full h-auto p-4 flex-col"
                />
              </div> */}
              
              {/* <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                <BarChart3 className="h-6 w-6" />
                <span>View Analytics</span>
              </Button> */}
            </div>
          </CardContent>
        {/* </Card> */}
      </div>
    </EventManagerLayout>
  );
}