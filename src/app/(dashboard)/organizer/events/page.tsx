// src/app/(dashboard)/organizer/events/page.tsx - FIXED: API Response Handling
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  Search, 
  Filter,
  Eye,
  Plus,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2
} from "lucide-react";

import { OrganizerLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Event {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location: string;
  venue?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
  eventType: string;
  maxParticipants?: number;
  tags?: string[];
  createdByUser: {
    name: string;
    email: string;
  };
  _count: {
    sessions: number;
    registrations: number;
  };
  createdAt: string;
}

const statusConfig = {
  DRAFT: { color: 'bg-gray-100 text-gray-800', icon: AlertCircle, label: 'Draft' },
  PUBLISHED: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Published' },
  ACTIVE: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Active' },
  COMPLETED: { color: 'bg-purple-100 text-purple-800', icon: CheckCircle, label: 'Completed' },
  CANCELLED: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' }
};

export default function OrganizerEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");

  // Fetch events
  useEffect(() => {
    fetchEvents();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(event => event.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== "ALL") {
      filtered = filtered.filter(event => event.eventType === typeFilter);
    }

    setFilteredEvents(filtered);
  }, [events, searchTerm, statusFilter, typeFilter]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/events');
      
      if (!response.ok) {
        throw new Error('Failed to fetch events');
      }
      
      const data = await response.json();
      console.log('API Response:', data); // Debug log
      
      // FIXED: Handle different response structures
      let eventsArray = [];
      if (data.success && data.data && data.data.events) {
        eventsArray = data.data.events;
      } else if (data.events) {
        eventsArray = data.events;
      } else if (Array.isArray(data)) {
        eventsArray = data;
      }
      
      setEvents(eventsArray);
      setError(null);
    } catch (err) {
      console.error('Error fetching events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSession = (eventId: string) => {
    // Redirect to session creation with pre-selected event
    router.push(`/organizer/sessions?eventId=${eventId}&action=create`);
  };

  const handleViewEvent = (eventId: string) => {
    // Redirect to event details (read-only for organizer)
    router.push(`/organizer/events/${eventId}`);
  };

  const handleViewSessions = (eventId: string) => {
    // Redirect to sessions management filtered by event
    router.push(`/organizer/sessions?eventId=${eventId}`);
  };

  if (loading) {
    return (
      <OrganizerLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p className="text-muted-foreground">Loading events...</p>
            </div>
          </div>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Available Events</h1>
            <p className="text-muted-foreground">
              Browse and manage sessions for available events
            </p>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Search */}
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search events by name, location, or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Status Filter */}
              <div className="w-full md:w-48">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="PUBLISHED">Published</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="COMPLETED">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="w-full md:w-48">
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Types</SelectItem>
                    <SelectItem value="CONFERENCE">Conference</SelectItem>
                    <SelectItem value="WORKSHOP">Workshop</SelectItem>
                    <SelectItem value="SEMINAR">Seminar</SelectItem>
                    <SelectItem value="SYMPOSIUM">Symposium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Events Grid */}
        {filteredEvents.length === 0 ? (
          <Card>
            <CardContent className="pt-8">
              <div className="text-center py-12">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No events found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL"
                    ? "No events match your current filters."
                    : "No events are available at the moment."}
                </p>
                {(searchTerm || statusFilter !== "ALL" || typeFilter !== "ALL") && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("ALL");
                      setTypeFilter("ALL");
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredEvents.map((event) => {
              const StatusIcon = statusConfig[event.status].icon;
              
              return (
                <Card key={event.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-xl">{event.name}</CardTitle>
                          <Badge className={statusConfig[event.status].color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig[event.status].label}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.startDate), "MMM dd, yyyy")} - 
                            {format(new Date(event.endDate), "MMM dd, yyyy")}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {event.location}
                          </div>
                        </div>

                        {event.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {event.description}
                          </p>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewEvent(event.id)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View Details
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewSessions(event.id)}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          View Sessions ({event._count.sessions})
                        </Button>
                        
                        <Button
                          size="sm"
                          onClick={() => handleCreateSession(event.id)}
                          disabled={event.status === 'COMPLETED' || event.status === 'CANCELLED'}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Create Session
                        </Button>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {event._count.registrations} registered
                          {event.maxParticipants && ` / ${event.maxParticipants} max`}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {event._count.sessions} sessions
                        </div>

                        <div>
                          <Badge variant="secondary">
                            {event.eventType}
                          </Badge>
                        </div>
                      </div>

                      <div className="text-right text-sm text-muted-foreground">
                        <p>Organized by {event.createdByUser.name}</p>
                        <p>Created {format(new Date(event.createdAt), "MMM dd, yyyy")}</p>
                      </div>
                    </div>

                    {/* Tags */}
                    {event.tags && event.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {event.tags.map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </OrganizerLayout>
  );
}