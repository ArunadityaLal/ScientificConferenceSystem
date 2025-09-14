// src/app/(dashboard)/organizer/sessions/page.tsx - FIXED: Event loading from database
"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { OrganizerLayout } from "@/components/dashboard/layout";
import { SessionForm } from "@/components/sessions/session-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Edit3,
  Trash2,
  Save,
  X,
  Search,
  Filter,
  RefreshCw,
  Users,
  Clock,
  MapPin,
  Mail,
  CheckCircle,
  AlertTriangle,
  Building2,
  FileText,
  Plus,
  Timer,
  CalendarDays,
} from "lucide-react";

type InviteStatus = "Pending" | "Accepted" | "Declined";

type SessionRow = {
  eventName: any;
  id: string;
  eventId?: string;
  title: string;
  facultyName: string;
  email: string;
  place: string;
  roomName?: string;
  roomId?: string;
  description?: string;
  startTime?: string;
  endTime?: string;
  status: "Draft" | "Confirmed";
  inviteStatus: InviteStatus;
  rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict";
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
  facultyId?: string;
  duration?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
  eventInfo?: {
    id: string;
    name: string;
    location: string;
  };
};

type Event = {
  id: string;
  name: string;
  location: string;
  status: string;
  startDate: string;
  endDate: string;
  createdByName?: string;
  _count: {
    sessions: number;
    registrations: number;
  };
};

type RoomLite = { id: string; name: string };
type Faculty = { id: string; name: string };

type DraftSession = {
  place: string;
  roomId?: string;
  startTime?: string;
  endTime?: string;
  status: "Draft" | "Confirmed";
  description?: string;
};

// Helper functions
const badge = (s: InviteStatus) => {
  const base =
    "px-2 py-1 rounded-full text-xs font-semibold inline-flex items-center gap-1";
  if (s === "Accepted")
    return (
      <span
        className={`${base} bg-green-900/30 text-green-300 border border-green-700`}
      >
        <CheckCircle className="h-3 w-3" />
        Accepted
      </span>
    );
  if (s === "Declined")
    return (
      <span
        className={`${base} bg-red-900/30 text-red-300 border border-red-700`}
      >
        <X className="h-3 w-3" />
        Declined
      </span>
    );
  return (
    <span
      className={`${base} bg-yellow-900/30 text-yellow-300 border border-yellow-700`}
    >
      <Clock className="h-3 w-3" />
      Pending
    </span>
  );
};

const statusBadge = (s: "Draft" | "Confirmed") => {
  const base = "px-2 py-1 rounded-full text-xs font-medium";
  if (s === "Confirmed")
    return (
      <span
        className={`${base} bg-blue-900/30 text-blue-300 border border-blue-700`}
      >
        Confirmed
      </span>
    );
  return (
    <span
      className={`${base} bg-gray-700 text-gray-300 border border-gray-600`}
    >
      Draft
    </span>
  );
};

const toInputDateTime = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const calculateDuration = (startTime?: string, endTime?: string) => {
  if (!startTime || !endTime) return "";
  const start = new Date(startTime);
  const end = new Date(endTime);
  const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  if (minutes > 0) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${minutes} min`;
  }
  return "";
};

const AllSessions: React.FC = () => {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [rooms, setRooms] = useState<RoomLite[]>([]);
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventsLoading, setEventsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "Draft" | "Confirmed"
  >("all");
  const [inviteFilter, setInviteFilter] = useState<"all" | InviteStatus>("all");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");

  // Session creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [preselectedEventId, setPreselectedEventId] = useState<string>("");

  // Edit state
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, DraftSession>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  // Get URL params
  const eventIdFromUrl = searchParams.get("eventId");
  const actionFromUrl = searchParams.get("action");

  useEffect(() => {
    if (eventIdFromUrl) {
      setSelectedEventId(eventIdFromUrl);
      setPreselectedEventId(eventIdFromUrl);
    }
    if (actionFromUrl === "create") {
      setShowCreateModal(true);
    }
  }, [eventIdFromUrl, actionFromUrl]);

  // FIXED: Separate event loading function with proper API response handling
  const loadEvents = async () => {
    try {
      setEventsLoading(true);
      console.log("Fetching events for sessions page...");

      const response = await fetch("/api/events", {
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Events API Error: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();
      console.log("Events API Response:", data);

      // FIXED: Handle the correct API response format
      let eventsArray = [];
      if (data.success && data.data && data.data.events) {
        eventsArray = data.data.events;
      } else if (data.events) {
        eventsArray = data.events;
      } else if (Array.isArray(data)) {
        eventsArray = data;
      } else {
        console.warn("Unexpected events API response format:", data);
        eventsArray = [];
      }

      // FIXED: Process events with proper field mapping
      const processedEvents: Event[] = eventsArray.map((event: any) => ({
        id: event.id,
        name: event.name,
        location: event.venue || event.location || "TBA",
        status: event.status || "DRAFT",
        startDate: event.start_date || event.startDate,
        endDate: event.end_date || event.endDate,
        createdByName: event.created_by_name || event.createdByName,
        _count: {
          sessions: event._count?.sessions || 0,
          registrations: event._count?.registrations || 0,
        },
      }));

      console.log(
        `Successfully loaded ${processedEvents.length} events for sessions`
      );
      setEvents(processedEvents);
    } catch (error) {
      console.error("Error loading events:", error);

      // FIXED: Fallback events only if API fails
      const fallbackEvents: Event[] = [
        {
          id: "event-1",
          name: "Academic Excellence Conference 2025",
          location: "University Campus",
          status: "PUBLISHED",
          startDate: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          endDate: new Date(
            Date.now() + 32 * 24 * 60 * 60 * 1000
          ).toISOString(),
          _count: { sessions: 0, registrations: 0 },
        },
      ];
      setEvents(fallbackEvents);
    } finally {
      setEventsLoading(false);
    }
  };

  const load = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      await loadEvents();

      const [sRes, rRes, fRes] = await Promise.all([
        fetch(
          `/api/sessions${
            selectedEventId !== "all" ? `?eventId=${selectedEventId}` : ""
          }`,
          { cache: "no-store" }
        ),
        fetch("/api/rooms", { cache: "no-store" }),
        fetch("/api/faculties", { cache: "no-store" }),
      ]);

      if (!sRes.ok || !rRes.ok || !fRes.ok) {
        throw new Error("Failed to fetch session data");
      }

      const [sData, rData, fData] = await Promise.all([
        sRes.json(),
        rRes.json(),
        fRes.json(),
      ]);

      const sessionsList =
        sData.data?.sessions || sData.sessions || sData || [];
      const mapped: SessionRow[] = sessionsList.map((s: any) => {
        const roomId =
          s.roomId ?? rData.find((r: any) => r.name === s.roomName)?.id;
        const duration = calculateDuration(s.startTime, s.endTime);

        return {
          ...s,
          roomId,
          duration,
          startTime: s.startTime || s.time,
          formattedStartTime: s.startTime
            ? new Date(s.startTime).toLocaleString()
            : undefined,
          formattedEndTime: s.endTime
            ? new Date(s.endTime).toLocaleString()
            : undefined,
        };
      });

      setSessions(mapped);
      setRooms(rData || []);
      setFaculties(fData || []);
    } catch (e) {
      console.error("Failed to load data:", e);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    const id = setInterval(() => load(false), 10000);
    return () => clearInterval(id);
  }, [selectedEventId]);

  // Event selection handler
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    const newUrl = new URL(window.location.href);
    if (eventId === "all") {
      newUrl.searchParams.delete("eventId");
    } else {
      newUrl.searchParams.set("eventId", eventId);
    }
    window.history.replaceState({}, "", newUrl.toString());
  };

  // Create session handlers
  const handleCreateSession = (eventId?: string) => {
    setPreselectedEventId(
      eventId || selectedEventId !== "all" ? selectedEventId : ""
    );
    setShowCreateModal(true);
  };

  const handleSessionCreated = (session: any) => {
    setShowCreateModal(false);
    setPreselectedEventId("");
    load(false);
  };

  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setPreselectedEventId("");
    const newUrl = new URL(window.location.href);
    newUrl.searchParams.delete("action");
    window.history.replaceState({}, "", newUrl.toString());
  };

  // Filtered sessions
  const filteredSessions = sessions.filter((session) => {
    const matchesSearch =
      session.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.facultyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      session.place.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || session.status === statusFilter;
    const matchesInvite =
      inviteFilter === "all" || session.inviteStatus === inviteFilter;

    return matchesSearch && matchesStatus && matchesInvite;
  });

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  // Edit handlers
  const onEdit = (id: string) => {
    const row = sessions.find((s) => s.id === id);
    if (!row) return;
    setEditing((e) => ({ ...e, [id]: true }));
    setDraft((d) => ({
      ...d,
      [id]: {
        place: row.place ?? "",
        roomId: row.roomId,
        startTime: toInputDateTime(row.startTime),
        endTime: toInputDateTime(row.endTime),
        status: row.status,
        description: row.description ?? "",
      },
    }));
  };

  const onCancel = (id: string) => {
    setEditing((e) => ({ ...e, [id]: false }));
    setDraft((d) => {
      const nd = { ...d };
      delete nd[id];
      return nd;
    });
  };

  const onChangeDraft = (
    id: string,
    field: keyof DraftSession,
    value: string
  ) => {
    setDraft((d) => ({
      ...d,
      [id]: {
        ...d[id],
        [field]: value,
      } as DraftSession,
    }));
  };

  const onSave = async (id: string) => {
    const body = draft[id];
    if (!body) return;

    let isoStartTime: string | null = null;
    let isoEndTime: string | null = null;

    if (body.startTime && body.startTime.length === 16) {
      isoStartTime = new Date(body.startTime).toISOString();
    }
    if (body.endTime && body.endTime.length === 16) {
      isoEndTime = new Date(body.endTime).toISOString();
    }

    if (isoStartTime && isoEndTime) {
      const start = new Date(isoStartTime);
      const end = new Date(isoEndTime);
      if (end <= start) {
        alert("End time must be after start time");
        return;
      }
      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        alert("Session must be at least 15 minutes long");
        return;
      }
    }

    const payload = {
      ...body,
      startTime: isoStartTime,
      endTime: isoEndTime,
      time: isoStartTime,
    };

    setSaving((s) => ({ ...s, [id]: true }));

    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to update session");
        return;
      }

      await load(false);
      onCancel(id);
    } catch (e) {
      console.error("Session update error:", e);
      alert("Failed to update session");
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  };

  const onDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    setDeleting((d) => ({ ...d, [id]: true }));

    try {
      const res = await fetch(`/api/sessions/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete session.");
        return;
      }
      await load(false);
    } catch (e) {
      console.error(e);
      alert("Failed to delete session.");
    } finally {
      setDeleting((d) => ({ ...d, [id]: false }));
    }
  };

  return (
    <OrganizerLayout>
      <div className="min-h-screen bg-gray-950 py-6">
        <div className="max-w-7xl mx-auto px-6">
          {/* Header Section */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                  <Calendar className="h-7 w-7" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    Session Management
                  </h1>
                  <p className="text-gray-300 text-lg mt-1">
                    Event-based session management with real-time updates
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button
                  onClick={() => handleCreateSession()}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Session
                </Button>
                <Button
                  onClick={() => load(true)}
                  variant="outline"
                  size="sm"
                  className="border-gray-600 text-gray-300 hover:bg-gray-800"
                  disabled={loading || eventsLoading}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      loading || eventsLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>
            </div>

            {/* Event Selection - FIXED: Show loading state and better error handling */}
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur mb-6">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-gray-400" />
                    <label className="text-sm font-medium text-gray-300">
                      Filter by Event:
                    </label>
                  </div>
                  <div className="flex-1 max-w-md">
                    {eventsLoading ? (
                      <div className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 flex items-center">
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                        <span className="text-gray-300">
                          Loading events from database...
                        </span>
                      </div>
                    ) : events.length === 0 ? (
                      <div className="bg-red-900/20 border border-red-600 rounded-lg px-3 py-2 flex items-center">
                        <AlertTriangle className="h-4 w-4 mr-2 text-red-400" />
                        <span className="text-red-300">
                          No events available. Please create events first.
                        </span>
                      </div>
                    ) : (
                      <Select
                        value={selectedEventId}
                        onValueChange={handleEventChange}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-600">
                          <SelectValue placeholder="Select an event" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Events</SelectItem>
                          {events.map((event) => (
                            <SelectItem key={event.id} value={event.id}>
                              <div className="flex flex-col">
                                <div className="font-medium">{event.name}</div>
                                <div className="text-xs text-gray-400">
                                  {event.location} • {event._count.sessions}{" "}
                                  sessions
                                </div>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  {selectedEvent && (
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-gray-300">
                        {selectedEvent.status}
                      </Badge>
                      <span className="text-sm text-gray-400">
                        {selectedEvent._count.sessions} sessions
                      </span>
                    </div>
                  )}
                  {selectedEventId !== "all" && events.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCreateSession(selectedEventId)}
                      className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Session to Event
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-900/30">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {
                          filteredSessions.filter(
                            (s) => s.inviteStatus === "Accepted"
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-400">Accepted</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-yellow-900/30">
                      <Clock className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {
                          filteredSessions.filter(
                            (s) => s.inviteStatus === "Pending"
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-400">Pending</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-900/30">
                      <Calendar className="h-5 w-5 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {
                          filteredSessions.filter(
                            (s) => s.status === "Confirmed"
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-400">Confirmed</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-orange-900/30">
                      <AlertTriangle className="h-5 w-5 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white">
                        {
                          filteredSessions.filter(
                            (s) => s.rejectionReason === "TimeConflict"
                          ).length
                        }
                      </div>
                      <div className="text-sm text-gray-400">
                        Time Conflicts
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
              <CardContent className="p-4">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 flex-1 min-w-[300px]">
                    <Search className="h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search sessions, faculty, or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-gray-400" />
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="all">All Status</option>
                      <option value="Draft">Draft</option>
                      <option value="Confirmed">Confirmed</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <select
                      value={inviteFilter}
                      onChange={(e) => setInviteFilter(e.target.value as any)}
                      className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 focus:outline-none"
                    >
                      <option value="all">All Invites</option>
                      <option value="Pending">Pending</option>
                      <option value="Accepted">Accepted</option>
                      <option value="Declined">Declined</option>
                    </select>
                  </div>

                  <div className="text-sm text-gray-400">
                    Showing {filteredSessions.length} of {sessions.length}{" "}
                    sessions
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          {loading ? (
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
              <CardContent className="p-12 text-center">
                <RefreshCw className="h-12 w-12 animate-spin text-blue-400 mx-auto mb-4" />
                <div className="text-xl text-gray-300 mb-2">
                  Loading Sessions
                </div>
                <div className="text-gray-400">
                  Fetching session data from database...
                </div>
              </CardContent>
            </Card>
          ) : filteredSessions.length === 0 ? (
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur">
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-6" />
                <div className="text-2xl font-semibold text-gray-300 mb-3">
                  No Sessions Found
                </div>
                <div className="text-gray-400 mb-6 max-w-md mx-auto">
                  {selectedEventId !== "all"
                    ? "This event doesn't have any sessions yet. Create the first session to get started."
                    : "No sessions match your current filters. Try adjusting your search criteria or create a new session."}
                </div>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => handleCreateSession()}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Session
                  </Button>
                  {(searchTerm ||
                    statusFilter !== "all" ||
                    inviteFilter !== "all") && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                        setInviteFilter("all");
                      }}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-700 bg-gray-900/50 backdrop-blur shadow-2xl">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-800 border-b border-gray-700">
                      <tr>
                        <th className="text-left p-4 font-semibold text-gray-200 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            Session Title
                          </div>
                        </th>
                        {selectedEventId === "all" && (
                          <th className="text-left p-4 font-semibold text-gray-200 min-w-[150px]">
                            <div className="flex items-center gap-2">
                              <CalendarDays className="h-4 w-4" />
                              Event
                            </div>
                          </th>
                        )}
                        <th className="text-left p-4 font-semibold text-gray-200 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Faculty
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-200 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-200 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Place
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-200 min-w-[150px]">
                          <div className="flex items-center gap-2">
                            <Building2 className="h-4 w-4" />
                            Room
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-200 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Schedule
                          </div>
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-200 min-w-[100px]">
                          Status
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-200 min-w-[120px]">
                          Invite Status
                        </th>
                        <th className="text-left p-4 font-semibold text-gray-200 min-w-[120px]">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800">
                      {filteredSessions.map((s, index) => {
                        const isEditing = editing[s.id];
                        const d = draft[s.id];
                        const isSaving = saving[s.id];
                        const isDeleting = deleting[s.id];

                        return (
                          <tr
                            key={s.id}
                            className={`hover:bg-gray-800/50 transition-colors ${
                              isEditing
                                ? "bg-blue-900/10 border border-blue-800/30"
                                : ""
                            } ${
                              index % 2 === 0
                                ? "bg-gray-900/20"
                                : "bg-gray-900/40"
                            }`}
                          >
                            {/* Title */}
                            <td className="p-4">
                              <div className="font-medium text-white">
                                {s.title}
                              </div>
                              {s.description && (
                                <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                                  {s.description}
                                </div>
                              )}
                            </td>

                            {/* Event (only show when viewing all events) */}
                            {selectedEventId === "all" && (
                              <td className="p-4">
                                {s.eventName ? (
                                  <div className="text-xs">
                                    <div className="font-medium text-gray-200">
                                      {s.eventName}
                                    </div>
                                    <div className="text-gray-400">
                                      {s.place}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-gray-500">
                                    Unknown event
                                  </div>
                                )}
                              </td>
                            )}

                            {/* Faculty */}
                            <td className="p-4">
                              <div className="text-gray-200">
                                {s.facultyName}
                              </div>
                            </td>

                            {/* Email */}
                            <td className="p-4">
                              <div className="text-gray-300 text-xs">
                                {s.email}
                              </div>
                            </td>

                            {/* Place */}
                            <td className="p-4">
                              {isEditing ? (
                                <input
                                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                                  value={d?.place || ""}
                                  onChange={(e) =>
                                    onChangeDraft(s.id, "place", e.target.value)
                                  }
                                />
                              ) : (
                                <div className="text-gray-200">{s.place}</div>
                              )}
                            </td>

                            {/* Room */}
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                                  value={d?.roomId || s.roomId || ""}
                                  onChange={(e) =>
                                    onChangeDraft(
                                      s.id,
                                      "roomId",
                                      e.target.value
                                    )
                                  }
                                >
                                  <option value="">Select Room</option>
                                  {rooms.map((r) => (
                                    <option key={r.id} value={r.id}>
                                      {r.name}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <div className="text-gray-200">
                                  {s.roomName || "-"}
                                </div>
                              )}
                            </td>

                            {/* Schedule */}
                            <td className="p-4">
                              {isEditing ? (
                                <div className="space-y-2">
                                  <input
                                    type="datetime-local"
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 focus:outline-none"
                                    value={d?.startTime || ""}
                                    onChange={(e) =>
                                      onChangeDraft(
                                        s.id,
                                        "startTime",
                                        e.target.value
                                      )
                                    }
                                  />
                                  <input
                                    type="datetime-local"
                                    className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-xs focus:border-blue-500 focus:outline-none"
                                    value={d?.endTime || ""}
                                    onChange={(e) =>
                                      onChangeDraft(
                                        s.id,
                                        "endTime",
                                        e.target.value
                                      )
                                    }
                                  />
                                </div>
                              ) : s.startTime || s.endTime ? (
                                <div className="text-xs space-y-1">
                                  {s.startTime && (
                                    <div className="text-green-300">
                                      <span className="text-gray-400">
                                        Start:
                                      </span>{" "}
                                      {s.formattedStartTime}
                                    </div>
                                  )}
                                  {s.endTime && (
                                    <div className="text-red-300">
                                      <span className="text-gray-400">
                                        End:
                                      </span>{" "}
                                      {s.formattedEndTime}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="text-gray-500 text-xs">
                                  Not scheduled
                                </div>
                              )}
                            </td>

                            {/* Status */}
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-white text-sm focus:border-blue-500 focus:outline-none"
                                  value={d?.status || s.status}
                                  onChange={(e) =>
                                    onChangeDraft(
                                      s.id,
                                      "status",
                                      e.target.value as "Draft" | "Confirmed"
                                    )
                                  }
                                >
                                  <option value="Draft">Draft</option>
                                  <option value="Confirmed">Confirmed</option>
                                </select>
                              ) : (
                                statusBadge(s.status)
                              )}
                            </td>

                            {/* Invite Status */}
                            <td className="p-4">{badge(s.inviteStatus)}</td>

                            {/* Actions */}
                            <td className="p-4">
                              {isEditing ? (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    onClick={() => onSave(s.id)}
                                    disabled={isSaving}
                                    className="bg-green-600 hover:bg-green-700 text-white h-8 px-2"
                                  >
                                    {isSaving ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Save className="h-3 w-3" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onCancel(s.id)}
                                    disabled={isSaving}
                                    className="border-gray-600 text-gray-300 hover:bg-gray-800 h-8 px-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onEdit(s.id)}
                                    className="border-blue-600 text-blue-400 hover:bg-blue-900/20 h-8 px-2"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => onDelete(s.id)}
                                    disabled={isDeleting}
                                    className="border-red-600 text-red-400 hover:bg-red-900/20 h-8 px-2"
                                  >
                                    {isDeleting ? (
                                      <RefreshCw className="h-3 w-3 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-3 w-3" />
                                    )}
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Footer Stats */}
          {filteredSessions.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-400">
              Last updated: {new Date().toLocaleTimeString()} • Auto-refresh
              every 10 seconds
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Session</DialogTitle>
          </DialogHeader>
          <SessionForm
            eventId={preselectedEventId || ""}
            session={undefined}
            onSuccess={handleSessionCreated}
            onCancel={handleCloseCreateModal}
            halls={[]}
          />
        </DialogContent>
      </Dialog>
    </OrganizerLayout>
  );
};

const SuspenseWrapper = () => (
  <Suspense fallback={<div>Loading...</div>}>
    <AllSessions />
  </Suspense>
);

export default SuspenseWrapper;
