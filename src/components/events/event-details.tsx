// src/components/events/event-details.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading';

import { 
  Calendar,
  MapPin,
  Users,
  Clock,
  Mail,
  Phone,
  Globe,
  Building,
  Target,
  FileText,
  Tag,
  Eye,
  Edit,
  Share2,
  Download,
  CheckCircle,
  AlertCircle,
  XCircle,
  Award
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

interface EventDetailsProps {
  event: {
    id: string;
    name: string;
    description?: string;
    startDate: string;
    endDate: string;
    venue?: string;
    expectedAttendees?: number;
    maxAttendees?: number;
    contactEmail?: string;
    contactPhone?: string;
    website?: string;
    category?: string;
    type?: string;
    status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
    isPublic?: boolean;
    requiresApproval?: boolean;
    registrationDeadline?: string;
    tags?: string[];
    createdAt: string;
    updatedAt: string;
    createdBy: {
      id: string;
      name: string;
      email: string;
    };
  };
  sessions?: Array<{
    id: string;
    title: string;
    startTime: string;
    endTime: string;
    hall?: { name: string };
    speaker?: { name: string };
  }>;
  registrations?: Array<{
    id: string;
    status: string;
    createdAt: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  faculty?: Array<{
    id: string;
    status: string;
    user: {
      name: string;
      email: string;
    };
  }>;
  loading?: boolean;
  onEdit?: () => void;
  onShare?: () => void;
  onExport?: () => void;
  showActions?: boolean;
}

export function EventDetails({
  event,
  sessions = [],
  registrations = [],
  faculty = [],
  loading = false,
  onEdit,
  onShare,
  onExport,
  showActions = true
}: EventDetailsProps) {
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

  const isEventPast = new Date(event.endDate) < new Date();
  const isEventActive = new Date(event.startDate) <= new Date() && new Date(event.endDate) >= new Date();
  const isEventUpcoming = new Date(event.startDate) > new Date();

  const approvedRegistrations = registrations.filter(r => r.status === 'APPROVED').length;
  const pendingRegistrations = registrations.filter(r => r.status === 'PENDING').length;
  const confirmedFaculty = faculty.filter(f => f.status === 'CONFIRMED').length;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 rounded animate-pulse" />
        <div className="h-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{event.name}</h1>
            <div className="flex items-center space-x-2 mt-2">
              <Badge className={`${getStatusColor(event.status)} border`}>
                {getStatusIcon(event.status)}
                <span className="ml-1">{event.status}</span>
              </Badge>
              {event.isPublic && (
                <Badge variant="outline">
                  <Eye className="h-3 w-3 mr-1" />
                  Public
                </Badge>
              )}
              {event.requiresApproval && (
                <Badge variant="outline">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Requires Approval
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {showActions && (
          <div className="flex items-center space-x-2">
            {onExport && (
              <Button variant="outline" onClick={onExport}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            )}
            {onShare && (
              <Button variant="outline" onClick={onShare}>
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            )}
            {onEdit && (
              <Button onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Event
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Event Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            Event Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Event Details</h4>
                <div className="space-y-3">
                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div className="font-medium">
                        {format(new Date(event.startDate), 'EEEE, MMMM dd, yyyy')}
                      </div>
                      <div className="text-muted-foreground">
                        {format(new Date(event.startDate), 'h:mm a')} - {format(new Date(event.endDate), 'h:mm a')}
                      </div>
                    </div>
                  </div>

                  {event.venue && (
                    <div className="flex items-center text-sm">
                      <MapPin className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                      <span>{event.venue}</span>
                    </div>
                  )}

                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                    <div>
                      <div>Expected: {event.expectedAttendees || 'Not specified'} attendees</div>
                      {event.maxAttendees && (
                        <div className="text-muted-foreground">
                          Maximum: {event.maxAttendees} attendees
                        </div>
                      )}
                    </div>
                  </div>

                  {event.registrationDeadline && (
                    <div className="flex items-center text-sm">
                      <Clock className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                      <div>
                        <div className="font-medium">Registration Deadline</div>
                        <div className="text-muted-foreground">
                          {format(new Date(event.registrationDeadline), 'PPp')}
                        </div>
                      </div>
                    </div>
                  )}
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

            {/* Contact & Meta Information */}
            <div className="space-y-4">
              {(event.contactEmail || event.contactPhone || event.website) && (
                <div>
                  <h4 className="font-medium mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    {event.contactEmail && (
                      <div className="flex items-center text-sm">
                        <Mail className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                        <a href={`mailto:${event.contactEmail}`} className="text-blue-600 hover:underline">
                          {event.contactEmail}
                        </a>
                      </div>
                    )}
                    
                    {event.contactPhone && (
                      <div className="flex items-center text-sm">
                        <Phone className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                        <a href={`tel:${event.contactPhone}`} className="text-blue-600 hover:underline">
                          {event.contactPhone}
                        </a>
                      </div>
                    )}
                    
                    {event.website && (
                      <div className="flex items-center text-sm">
                        <Globe className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                        <a href={event.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {event.website}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {(event.category || event.type) && (
                <div>
                  <h4 className="font-medium mb-3">Classification</h4>
                  <div className="space-y-3">
                    {event.category && (
                      <div className="flex items-center text-sm">
                        <Building className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                        <span>Category: {event.category}</span>
                      </div>
                    )}
                    
                    {event.type && (
                      <div className="flex items-center text-sm">
                        <Target className="h-4 w-4 mr-3 text-muted-foreground flex-shrink-0" />
                        <span>Type: {event.type}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {event.tags && event.tags.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {event.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-medium mb-3">Event Management</h4>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div>Created by: {event.createdBy.name}</div>
                  <div>Created: {format(new Date(event.createdAt), 'PPp')}</div>
                  <div>Last updated: {format(new Date(event.updatedAt), 'PPp')}</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{sessions.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Registrations</p>
                <p className="text-2xl font-bold">{approvedRegistrations}</p>
                <p className="text-xs text-muted-foreground">{pendingRegistrations} pending</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Faculty</p>
                <p className="text-2xl font-bold">{confirmedFaculty}</p>
                <p className="text-xs text-muted-foreground">{faculty.length} total</p>
              </div>
              <Award className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Fill Rate</p>
                <p className="text-2xl font-bold">
                  {event.expectedAttendees ? 
                    `${Math.round((approvedRegistrations / event.expectedAttendees) * 100)}%` : 
                    'N/A'
                  }
                </p>
                <p className="text-xs text-muted-foreground">of expected</p>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sessions Preview */}
      {sessions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Sessions ({sessions.length})
              </div>
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View All
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {sessions.slice(0, 3).map((session) => {
                const sessionDate = new Date(session.startTime);
                const isSessionPast = sessionDate < new Date();
                const isSessionToday = sessionDate.toDateString() === new Date().toDateString();
                
                return (
                  <div key={session.id} className={`p-3 rounded-lg border transition-colors ${
                    isSessionToday ? 'bg-blue-50 border-blue-200' :
                    isSessionPast ? 'bg-gray-50 border-gray-200' :
                    'bg-green-50 border-green-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <h5 className="font-medium truncate">{session.title}</h5>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(sessionDate, 'MMM dd, HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                          {session.hall && (
                            <>
                              <MapPin className="h-3 w-3 ml-2 mr-1" />
                              {session.hall.name}
                            </>
                          )}
                        </div>
                        {session.speaker && (
                          <p className="text-sm text-muted-foreground mt-1">
                            Speaker: {session.speaker.name}
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
                <div className="text-center pt-2">
                  <Button variant="ghost" size="sm">
                    View {sessions.length - 3} more sessions
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}