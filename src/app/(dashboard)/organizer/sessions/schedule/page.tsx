"use client";

import React, { useEffect, useState, useCallback } from "react";
import { OrganizerLayout } from "@/components/dashboard/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Calendar,
  Clock,
  Users,
  MapPin,
  FileText,
  Image,
  AlertTriangle,
  CheckCircle,
  X,
  Upload,
  Eye,
  Settings,
  Sparkles,
  Mail,
  Building2,
  User,
  Plus,
  Trash2,
  Copy,
  Send,
  Timer,
} from "lucide-react";

// Updated Faculty type to include eventId
type Faculty = { 
  id: string; 
  name: string;
  email?: string;
  eventName?: string;
  eventId: string;
  department?: string;
  institution?: string;
  expertise?: string;
  phone?: string;
};

type Room = { id: string; name: string };

// Event type (extracted from calendar grid)
type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
  description?: string;
  eventType?: string;
  createdByUser?: {
    id: string;
    name: string;
    email: string;
  };
  _count?: {
    sessions: number;
    registrations: number;
  };
  facultyCount?: number;
};

type SessionForm = {
  id: string;
  title: string;
  place: string;
  roomId: string;
  description: string;
  startTime: string;
  endTime: string;
  status: "Draft" | "Confirmed";
};

type ConflictSession = {
  id: string;
  title: string;
  facultyId: string;
  roomId: string;
  startTime: string;
  endTime: string;
  type: string;
  sessionTitle?: string;
  message: string;
};

const CreateSession: React.FC = () => {
  // Updated state to include events and event-faculty mapping
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState("");
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [facultiesByEvent, setFacultiesByEvent] = useState<Record<string, Faculty[]>>({});
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictSession[]>([]);
  const [showConflictWarning, setShowConflictWarning] = useState(false);
  const [conflictCheckLoading, setConflictCheckLoading] = useState(false);

  const [facultyId, setFacultyId] = useState("");
  const [email, setEmail] = useState("");
  const [sessions, setSessions] = useState<SessionForm[]>([
    {
      id: "session-1",
      title: "",
      place: "",
      roomId: "",
      description: "",
      startTime: "",
      endTime: "",
      status: "Draft",
    },
  ]);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [posterPreview, setPosterPreview] = useState<string>("");

  const [formStep, setFormStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string>
  >({});
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Enhanced data loading with events and faculty mapping
  const loadEventsAndFaculty = useCallback(async () => {
    try {
      console.log("🔄 Loading events and faculty data...");

      // Load events from database
      const eventsResponse = await fetch("/api/events", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      let eventsList: Event[] = [];
      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();

        if (eventsData.success && eventsData.data?.events) {
          eventsList = eventsData.data.events;
        } else if (eventsData.events) {
          eventsList = eventsData.events;
        } else if (Array.isArray(eventsData)) {
          eventsList = eventsData;
        }

        console.log(`✅ Loaded ${eventsList.length} events from database`);
      }

      // Load faculty data from localStorage and database
      const facultyResponse = await fetch("/api/faculties", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      let allFaculties: Faculty[] = [];
      if (facultyResponse.ok) {
        allFaculties = await facultyResponse.json();
        console.log(`✅ Loaded ${allFaculties.length} faculties from database`);
      }

      // Also check localStorage for uploaded faculty lists
      if (typeof window !== "undefined") {
        const savedFacultyData = localStorage.getItem("eventFacultyData");
        if (savedFacultyData) {
          const eventFacultyData = JSON.parse(savedFacultyData);
          const localFaculties = eventFacultyData.flatMap(
            (eventData: any) =>
              eventData.facultyList?.map((faculty: any) => ({
                ...faculty,
                eventId: eventData.eventId,
                eventName: eventData.eventName,
              })) || []
          );

          // Merge with database faculties, avoiding duplicates
          localFaculties.forEach((localFaculty: Faculty) => {
            if (!allFaculties.find((f) => f.email === localFaculty.email)) {
              allFaculties.push(localFaculty);
            }
          });

          console.log(`✅ Added ${localFaculties.length} faculties from localStorage`);
        }
      }

      // Group faculties by event
      const facultyMapping: Record<string, Faculty[]> = {};
      allFaculties.forEach((faculty) => {
        if (faculty.eventId) {
          if (!facultyMapping[faculty.eventId]) {
            facultyMapping[faculty.eventId] = [];
          }
          (facultyMapping[faculty.eventId] ?? []).push(faculty);
        }
      });

      // Update events with faculty counts
      const eventsWithFacultyCounts = eventsList.map((event: Event) => ({
        ...event,
        facultyCount: facultyMapping[event.id]?.length || 0,
      }));

      console.log("✅ Events and faculty data loaded successfully");
      return {
        events: eventsWithFacultyCounts,
        facultiesByEvent: facultyMapping,
        allFaculties,
      };
    } catch (error) {
      console.error("❌ Error loading events and faculty:", error);
      return { events: [], facultiesByEvent: {}, allFaculties: [] };
    }
  }, []);

  // Enhanced useEffect for loading all data
  useEffect(() => {
    (async () => {
      try {
        const [
          { events: eventsFromDb, facultiesByEvent: facultyMapping, allFaculties },
          roomsResponse
        ] = await Promise.all([
          loadEventsAndFaculty(),
          fetch("/api/rooms")
        ]);

        const rooms = roomsResponse.ok ? await roomsResponse.json() : [];
        
        if (eventsFromDb.length === 0) {
          console.log('No events found, checking for any available faculty...');
          // If no events but faculty exists, still show them
          if (allFaculties.length > 0) {
            setFaculties(allFaculties);
          } else {
            setErrorMessage("No events or faculty data available. Please create events or upload faculty via Faculty Management first.");
          }
        } else {
          setEvents(eventsFromDb);
          setFacultiesByEvent(facultyMapping);
          setFaculties(allFaculties);
          console.log(`Using ${eventsFromDb.length} events with faculty mapping`);
        }
        
        setRooms(rooms);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setErrorMessage("Failed to load events, faculties, or rooms.");
      }
    })();
  }, [loadEventsAndFaculty]);

  // Listen for faculty data updates
  useEffect(() => {
    const handleFacultyDataUpdate = (event: CustomEvent) => {
      console.log('Faculty data updated, reloading...');
      loadEventsAndFaculty().then(({ events, facultiesByEvent, allFaculties }) => {
        setEvents(events);
        setFacultiesByEvent(facultiesByEvent);
        setFaculties(allFaculties);
        console.log(`Updated to ${allFaculties.length} faculty members`);
      });
    };

    window.addEventListener('eventFacultyDataUpdated', handleFacultyDataUpdate as EventListener);
    
    return () => {
      window.removeEventListener('eventFacultyDataUpdated', handleFacultyDataUpdate as EventListener);
    };
  }, [loadEventsAndFaculty]);

  // Handle event selection
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setFacultyId(""); // Reset faculty selection
    setEmail(""); // Reset email

    // Auto-fill place with event location if available
    const selectedEvent = events.find((e) => e.id === eventId);
    if (selectedEvent?.location) {
      updateAllSessions("place", selectedEvent.location);
    }

    // Clear validation errors
    if (validationErrors.selectedEventId) {
      setValidationErrors((prev) => ({
        ...prev,
        selectedEventId: "",
      }));
    }
  };

  // Updated faculty selection to work with event-filtered faculty
  const handleFacultyChange = (selectedFacultyId: string) => {
    setFacultyId(selectedFacultyId);
    
    // Get faculty list for selected event
    const availableFaculty = selectedEventId 
      ? facultiesByEvent[selectedEventId] || [] 
      : faculties; // Fallback to all faculties if no event selected
    
    // Find the selected faculty and auto-fill email
    const selectedFaculty = availableFaculty.find(f => f.id === selectedFacultyId);
    if (selectedFaculty && selectedFaculty.email) {
      setEmail(selectedFaculty.email);
    }
    
    // Clear validation errors
    if (validationErrors.facultyId) {
      setValidationErrors((prev) => ({
        ...prev,
        facultyId: "",
      }));
    }
  };

  const addSession = () => {
    const newSession: SessionForm = {
      id: `session-${Date.now()}`,
      title: "",
      place: sessions[0]?.place || "",
      roomId: "",
      description: "",
      startTime: "",
      endTime: "",
      status: "Draft",
    };
    setSessions([...sessions, newSession]);
  };

  const removeSession = (sessionId: string) => {
    if (sessions.length > 1) {
      setSessions(sessions.filter((s) => s.id !== sessionId));
      const newErrors = { ...validationErrors };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(sessionId)) {
          delete newErrors[key];
        }
      });
      setValidationErrors(newErrors);
    }
  };

  const updateSession = (
    sessionId: string,
    field: keyof SessionForm,
    value: string
  ) => {
    setSessions(
      sessions.map((session) =>
        session.id === sessionId ? { ...session, [field]: value } : session
      )
    );

    if (validationErrors[`${sessionId}-${field}`]) {
      setValidationErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[`${sessionId}-${field}`];
        return newErrors;
      });
    }

    setErrorMessage("");
    setSuccessMessage("");
  };

  const copySession = (sourceSessionId: string) => {
    const sourceSession = sessions.find((s) => s.id === sourceSessionId);
    if (!sourceSession) return;

    const newSession: SessionForm = {
      id: `session-${Date.now()}`,
      title: sourceSession.title,
      place: sourceSession.place,
      roomId: sourceSession.roomId,
      description: sourceSession.description,
      startTime: "",
      endTime: "",
      status: sourceSession.status,
    };
    setSessions([...sessions, newSession]);
  };

  const updateAllSessions = (field: "place" | "status", value: string) => {
    setSessions(sessions.map((session) => ({ ...session, [field]: value })));
  };

  const handlePosterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage("Poster file size should be less than 5MB");
        return;
      }

      setPosterFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPosterPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setErrorMessage("");
    }
  };

  const removePoster = () => {
    setPosterFile(null);
    setPosterPreview("");
  };

  const calculateDuration = (startTime: string, endTime: string) => {
    if (startTime && endTime) {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const minutes = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60)
      );
      if (minutes > 0) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${minutes} min`;
      }
    }
    return "";
  };

  // Updated validation to include event selection
  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Event validation (only if events are available)
    if (events.length > 0 && !selectedEventId) {
      errors.selectedEventId = "Please select an event";
    }
    if (!facultyId) errors.facultyId = "Please select a faculty";
    if (!email.trim()) errors.email = "Faculty email is required";
    if (!email.includes("@")) errors.email = "Please enter a valid email";

    sessions.forEach((session) => {
      const prefix = session.id;

      if (!session.title.trim())
        errors[`${prefix}-title`] = "Title is required";
      if (!session.place.trim())
        errors[`${prefix}-place`] = "Place is required";
      if (!session.roomId) errors[`${prefix}-roomId`] = "Room is required";
      if (!session.description.trim())
        errors[`${prefix}-description`] = "Description is required";
      if (!session.startTime)
        errors[`${prefix}-startTime`] = "Start time is required";
      if (!session.endTime)
        errors[`${prefix}-endTime`] = "End time is required";

      if (session.startTime && session.endTime) {
        const start = new Date(session.startTime);
        const end = new Date(session.endTime);

        if (end <= start) {
          errors[`${prefix}-endTime`] = "End time must be after start time";
        }

        const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
        if (durationMinutes < 15) {
          errors[`${prefix}-endTime`] =
            "Session must be at least 15 minutes long";
        }
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const checkConflicts = async () => {
    if (!validateForm()) {
      setErrorMessage("Please fix validation errors before checking conflicts");
      return;
    }

    setConflictCheckLoading(true);
    setConflicts([]);
    setShowConflictWarning(false);

    try {
      const allConflicts: ConflictSession[] = [];

      for (const session of sessions) {
        console.log(`Checking conflicts for session: ${session.title}`);

        const response = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: session.title,
            facultyId,
            email,
            place: session.place,
            roomId: session.roomId,
            description: session.description,
            startTime: session.startTime,
            endTime: session.endTime,
            status: session.status,
            eventId: selectedEventId, // Include event ID
            conflictOnly: true,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          if (data.conflicts && data.conflicts.length > 0) {
            allConflicts.push(...data.conflicts);
          }
        } else {
          const errorData = await response.json();
          console.error(
            `Conflict check failed for ${session.title}:`,
            errorData
          );
        }
      }

      setConflicts(allConflicts);
      setShowConflictWarning(allConflicts.length > 0);

      if (allConflicts.length === 0) {
        setSuccessMessage(
          "No conflicts detected! All sessions can be scheduled."
        );
      }
    } catch (error) {
      console.error("Error checking conflicts:", error);
      setErrorMessage("Failed to check conflicts");
    } finally {
      setConflictCheckLoading(false);
    }
  };

  const handleSubmit = async (
    e: React.FormEvent,
    overwriteConflicts = false
  ) => {
    e.preventDefault();

    if (!validateForm()) {
      setErrorMessage("Please fill in all required fields correctly.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const createdSessions = [];

      console.log("Starting bulk session creation...");
      console.log("Event ID:", selectedEventId);
      console.log("Faculty ID:", facultyId);
      console.log("Email:", email);
      console.log("Sessions to create:", sessions.length);

      for (const [index, session] of sessions.entries()) {
        console.log(
          `Creating session ${index + 1}/${sessions.length}: ${session.title}`
        );

        const form = new FormData();

        const sessionData = {
          title: session.title.trim(),
          facultyId: facultyId,
          email: email.trim(),
          place: session.place.trim(),
          roomId: session.roomId,
          description: session.description.trim(),
          startTime: session.startTime,
          endTime: session.endTime,
          status: session.status,
          inviteStatus: "Pending",
          eventId: selectedEventId, // Include event ID
          travelStatus: "Pending",
        };

        console.log(`Session ${index + 1} data:`, sessionData);

        const requiredFields = [
          "title",
          "facultyId",
          "email",
          "place",
          "roomId",
          "description",
          "startTime",
          "endTime",
          "status",
        ];
        const missingFields = requiredFields.filter(
          (field) =>
            !sessionData[field as keyof typeof sessionData] ||
            sessionData[field as keyof typeof sessionData].toString().trim() ===
              ""
        );

        if (missingFields.length > 0) {
          throw new Error(
            `Missing required fields for session "${
              session.title
            }": ${missingFields.join(", ")}`
          );
        }

        Object.entries(sessionData).forEach(([key, value]) => {
          if (value !== undefined && value !== null && value !== "") {
            form.append(key, value.toString());
          }
        });

        if (overwriteConflicts) {
          form.append("overwriteConflicts", "true");
        }

        if (posterFile) {
          form.append("poster", posterFile);
        }

        const response = await fetch("/api/sessions", {
          method: "POST",
          body: form,
        });

        if (response.status === 409 && !overwriteConflicts) {
          const data = await response.json();
          setConflicts(data.conflicts || []);
          setShowConflictWarning(true);
          setLoading(false);
          return;
        }

        if (response.ok) {
          const sessionData = await response.json();
          createdSessions.push(sessionData);
          console.log(`Session created successfully: ${sessionData.title}`);
        } else {
          const errorData = await response.json();
          console.error(
            `Session creation error for "${session.title}":`,
            errorData
          );
          throw new Error(
            errorData.error || `Failed to create session: ${session.title}`
          );
        }
      }

      console.log(
        `All ${createdSessions.length} sessions created successfully`
      );

      // Send bulk invitation email
      try {
        console.log("Sending bulk invitation email...");
        const emailResponse = await fetch("/api/sessions/bulk-invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            facultyId,
            email,
            sessions: createdSessions,
            eventId: selectedEventId,
          }),
        });

        if (emailResponse.ok) {
          const emailResult = await emailResponse.json();
          console.log(
            "Bulk invitation email sent successfully:",
            emailResult
          );
        } else {
          const emailError = await emailResponse.json();
          console.warn("Bulk email sending failed:", emailError);
        }
      } catch (emailError) {
        console.warn("Bulk email sending failed:", emailError);
      }

      const facultyName = selectedEventId && facultiesByEvent[selectedEventId]
        ? facultiesByEvent[selectedEventId].find((f) => f.id === facultyId)?.name
        : faculties.find((f) => f.id === facultyId)?.name || "Faculty Member";
        
      setSuccessMessage(
        `Successfully created ${createdSessions.length} session(s) for ${facultyName}! Bulk invitation email has been sent.`
      );

      resetForm();
    } catch (error) {
      console.error("Error creating sessions:", error);
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "An error occurred while creating sessions"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleOverwrite = async () => {
    setShowConflictWarning(false);
    await handleSubmit(new Event("submit") as any, true);
  };

  const resetForm = () => {
    setSelectedEventId("");
    setFacultyId("");
    setEmail("");
    setSessions([
      {
        id: "session-1",
        title: "",
        place: "",
        roomId: "",
        description: "",
        startTime: "",
        endTime: "",
        status: "Draft",
      },
    ]);
    setPosterFile(null);
    setPosterPreview("");
    setFormStep(1);
    setValidationErrors({});
    setConflicts([]);
    setShowConflictWarning(false);
  };

  // Updated step validation
  const nextStep = () => {
    if (formStep === 1) {
      const stepErrors: Record<string, string> = {};
      
      // Only require event if events are available
      if (events.length > 0 && !selectedEventId) {
        stepErrors.selectedEventId = "Please select an event";
      }
      if (!facultyId) {
        stepErrors.facultyId = "Please select a faculty";
      }
      if (!email) {
        stepErrors.email = "Email is required";
      }

      if (Object.keys(stepErrors).length > 0) {
        setValidationErrors(stepErrors);
        return;
      }
    }
    setFormStep(formStep + 1);
  };

  const prevStep = () => {
    setFormStep(formStep - 1);
  };

  const selectedFaculty = selectedEventId && facultiesByEvent[selectedEventId]
    ? facultiesByEvent[selectedEventId].find((f) => f.id === facultyId)
    : faculties.find((f) => f.id === facultyId);

  const availableFaculty = selectedEventId 
    ? facultiesByEvent[selectedEventId] || [] 
    : faculties;

  return (
    <OrganizerLayout>
      <div className="min-h-screen bg-gray-950 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg">
                <Calendar className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                  Create Multiple Sessions
                </h1>
                <p className="text-gray-300 text-lg mt-1">
                  Create multiple sessions for one faculty with bulk invitation
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center gap-4 mb-8">
              {[
                { step: 1, title: "Event & Faculty Selection", icon: User },
                { step: 2, title: "Sessions Details", icon: Calendar },
                { step: 3, title: "Review & Send", icon: Send },
              ].map(({ step, title, icon: Icon }) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border-2 transition-all ${
                      formStep >= step
                        ? "bg-blue-500 border-blue-500 text-white shadow-lg"
                        : "bg-gray-800 border-gray-600 text-gray-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-medium text-sm">{title}</span>
                  </div>
                  {step < 3 && (
                    <div
                      className={`w-8 h-0.5 mx-2 ${
                        formStep > step ? "bg-blue-500" : "bg-gray-600"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {successMessage && (
            <Alert className="mb-6 border-green-600 bg-green-900/20 backdrop-blur">
              <CheckCircle className="h-4 w-4 text-green-400" />
              <AlertDescription className="text-green-200 font-medium">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {errorMessage && (
            <Alert className="mb-6 border-red-600 bg-red-900/20 backdrop-blur">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <AlertDescription className="text-red-200 font-medium">
                {errorMessage}
              </AlertDescription>
            </Alert>
          )}

          {showConflictWarning && (
            <Alert className="mb-6 border-amber-600 bg-amber-900/20 backdrop-blur">
              <AlertTriangle className="h-4 w-4 text-amber-400" />
              <AlertDescription>
                <div className="space-y-3">
                  <p className="font-semibold text-amber-200">
                    Scheduling conflicts detected in {conflicts.length}{" "}
                    session(s)!
                  </p>
                  {conflicts.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-amber-300 font-medium">
                        Conflicting Sessions:
                      </p>
                      <ul className="list-disc ml-6 text-sm text-amber-300 space-y-1 max-h-32 overflow-y-auto">
                        {conflicts.map((c, index) => (
                          <li key={index}>
                            <strong>"{c.sessionTitle || c.title}"</strong> -{" "}
                            {c.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <div className="flex gap-3">
                    <Button
                      size="sm"
                      onClick={handleOverwrite}
                      disabled={loading}
                      className="bg-red-600 hover:bg-red-700 text-white"
                    >
                      {loading ? "Processing..." : "Override All Conflicts"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowConflictWarning(false)}
                      disabled={loading}
                      className="border-gray-600 text-gray-300 hover:bg-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="border-gray-700 shadow-2xl bg-gray-900/80 backdrop-blur">
                <CardHeader className="border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-800/50">
                  <CardTitle className="flex items-center gap-3 text-xl text-white">
                    <div className="p-2 rounded-lg bg-blue-600/20">
                      <Settings className="h-5 w-5 text-blue-400" />
                    </div>
                    {formStep === 1 && "Event & Faculty Selection"}
                    {formStep === 2 &&
                      `Sessions for ${selectedFaculty?.name || "Faculty"}`}
                    {formStep === 3 && "Review & Send Bulk Invitation"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 text-white">
                  <form onSubmit={(e) => handleSubmit(e, false)}>
                    {formStep === 1 && (
                      <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Event Selection - NEW */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-200 mb-2">
                              <Calendar className="h-4 w-4 inline mr-2" />
                              Select Event *
                              <span className="text-xs text-blue-400 ml-2">
                                ({events.length} events available)
                              </span>
                            </label>
                            <select
                              value={selectedEventId}
                              onChange={(e) => handleEventChange(e.target.value)}
                              className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white ${
                                validationErrors.selectedEventId
                                  ? "border-red-500 bg-red-900/20"
                                  : "border-gray-600 hover:border-gray-500 focus:border-blue-400"
                              }`}
                              required={events.length > 0}
                            >
                              <option value="">Choose Event</option>
                              {events.map((event) => (
                                <option key={event.id} value={event.id}>
                                  {event.name} ({event.facultyCount || 0} faculty)
                                </option>
                              ))}
                            </select>
                            {validationErrors.selectedEventId && (
                              <p className="text-red-400 text-sm mt-1">
                                {validationErrors.selectedEventId}
                              </p>
                            )}
                            {events.length === 0 && (
                              <p className="text-yellow-400 text-xs mt-1">
                                ⚠️ No events found. You can still create sessions without selecting an event.
                              </p>
                            )}
                          </div>

                          {/* Faculty Selection - UPDATED */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-200 mb-2">
                              <User className="h-4 w-4 inline mr-2" />
                              Select Faculty *
                              <span className="text-xs text-blue-400 ml-2">
                                ({availableFaculty.length} faculty available{selectedEventId ? " for selected event" : ""})
                              </span>
                            </label>
                            <select
                              value={facultyId}
                              onChange={(e) => handleFacultyChange(e.target.value)}
                              className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white ${
                                validationErrors.facultyId
                                  ? "border-red-500 bg-red-900/20"
                                  : "border-gray-600 hover:border-gray-500 focus:border-blue-400"
                              }`}
                              required
                              disabled={events.length > 0 && !selectedEventId}
                            >
                              <option value="">
                                {events.length > 0 && !selectedEventId 
                                  ? "Please select an event first" 
                                  : "Choose Faculty Member"}
                              </option>
                              {availableFaculty.map((faculty) => (
                                <option key={faculty.id} value={faculty.id}>
                                  {faculty.name}
                                  {faculty.department && ` (${faculty.department})`}
                                  {faculty.institution && ` - ${faculty.institution}`}
                                </option>
                              ))}
                            </select>
                            {validationErrors.facultyId && (
                              <p className="text-red-400 text-sm mt-1">
                                {validationErrors.facultyId}
                              </p>
                            )}
                            {selectedEventId && availableFaculty.length === 0 && (
                              <p className="text-yellow-400 text-xs mt-1">
                                ⚠️ No faculty available for this event. Please upload faculty lists.
                              </p>
                            )}
                            {events.length === 0 && faculties.length === 0 && (
                              <p className="text-yellow-400 text-xs mt-1">
                                ⚠️ No faculty data available. Please upload faculty via Faculty Management.
                              </p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-200 mb-2">
                            <Mail className="h-4 w-4 inline mr-2" />
                            Faculty Email *
                            <span className="text-xs text-gray-400 ml-2">
                              (auto-filled when faculty is selected)
                            </span>
                          </label>
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              if (validationErrors.email) {
                                setValidationErrors((prev) => ({
                                  ...prev,
                                  email: "",
                                }));
                              }
                            }}
                            placeholder="faculty@university.edu"
                            className={`w-full p-4 border-2 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400 ${
                              validationErrors.email
                                ? "border-red-500 bg-red-900/20"
                                : "border-gray-600 hover:border-gray-500 focus:border-blue-400"
                            }`}
                            required
                            readOnly={!!facultyId}
                          />
                          {validationErrors.email && (
                            <p className="text-red-400 text-sm mt-1">
                              {validationErrors.email}
                            </p>
                          )}
                        </div>

                        {/* Selected Event and Faculty Info */}
                        {selectedEventId && facultyId && (
                          <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-4">
                            <h4 className="text-sm font-medium mb-2 text-blue-200">
                              Selection Summary:
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-blue-300">
                              <div>
                                <span className="font-medium">Event:</span>{" "}
                                {events.find((e) => e.id === selectedEventId)?.name}
                              </div>
                              <div>
                                <span className="font-medium">Faculty:</span>{" "}
                                {selectedFaculty?.name}
                              </div>
                              <div>
                                <span className="font-medium">Email:</span>{" "}
                                {email}
                              </div>
                              <div>
                                <span className="font-medium">Institution:</span>{" "}
                                {selectedFaculty?.institution || "N/A"}
                              </div>
                            </div>
                          </div>
                        )}

                        <div className="bg-blue-900/20 border border-blue-700 rounded-xl p-6">
                          <h3 className="text-lg font-semibold text-blue-200 mb-4 flex items-center gap-2">
                            <Settings className="h-5 w-5" />
                            Common Settings (Applied to All Sessions)
                          </h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-blue-200 mb-2">
                                Default Place/Location
                              </label>
                              <input
                                type="text"
                                placeholder="e.g., Main Campus, Building A"
                                value={sessions[0]?.place || ""}
                                className="w-full p-3 border border-blue-600 rounded-lg bg-blue-900/30 text-white placeholder-blue-300 focus:border-blue-400 focus:outline-none"
                                onChange={(e) =>
                                  updateAllSessions("place", e.target.value)
                                }
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-blue-200 mb-2">
                                Default Status
                              </label>
                              <select
                                value={sessions[0]?.status || "Draft"}
                                className="w-full p-3 border border-blue-600 rounded-lg bg-blue-900/30 text-white focus:border-blue-400 focus:outline-none"
                                onChange={(e) =>
                                  updateAllSessions("status", e.target.value)
                                }
                              >
                                <option value="Draft">Draft</option>
                                <option value="Confirmed">Confirmed</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 hover:border-blue-400 transition-all bg-gray-800/50">
                          <div className="text-center">
                            <Image className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-semibold text-white mb-2">
                              Common Session Poster (Optional)
                            </h3>
                            <p className="text-gray-300 mb-4">
                              Upload one poster to be used for all sessions
                            </p>

                            {!posterPreview ? (
                              <div>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={handlePosterUpload}
                                  className="hidden"
                                  id="poster-upload"
                                />
                                <label
                                  htmlFor="poster-upload"
                                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 cursor-pointer transition-all shadow-lg"
                                >
                                  <Upload className="h-4 w-4" />
                                  Choose Poster
                                </label>
                                <p className="text-xs text-gray-400 mt-2">
                                  PNG, JPG up to 5MB
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-4">
                                <img
                                  src={posterPreview}
                                  alt="Poster preview"
                                  className="max-w-xs mx-auto rounded-lg shadow-lg border border-gray-600"
                                />
                                <div className="flex items-center justify-center gap-3">
                                  <Badge
                                    variant="secondary"
                                    className="bg-green-800 text-green-200 border-green-600"
                                  >
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Poster Ready
                                  </Badge>
                                  <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={removePoster}
                                    className="border-red-600 text-red-400 hover:text-red-300 hover:bg-red-900/20"
                                  >
                                    <X className="h-3 w-3 mr-1" />
                                    Remove
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {formStep === 2 && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-lg font-semibold text-white">
                            Sessions for {selectedFaculty?.name} (
                            {sessions.length})
                          </h3>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              size="sm"
                              onClick={addSession}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Add Session
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              onClick={checkConflicts}
                              disabled={conflictCheckLoading}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {conflictCheckLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                  Checking...
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="h-4 w-4 mr-1" />
                                  Check Conflicts
                                </>
                              )}
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
                          {sessions.map((session, index) => (
                            <Card
                              key={session.id}
                              className="border-gray-600 bg-gray-800/50 relative"
                            >
                              <CardHeader className="pb-4">
                                <div className="flex items-center justify-between">
                                  <CardTitle className="text-white text-base flex items-center gap-2">
                                    <Badge
                                      variant="secondary"
                                      className="bg-blue-900/50 text-blue-200"
                                    >
                                      #{index + 1}
                                    </Badge>
                                    Session {index + 1}
                                  </CardTitle>
                                  <div className="flex gap-2">
                                    {sessions.length > 1 && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copySession(session.id)}
                                        className="border-blue-600 text-blue-400 hover:bg-blue-900/20 h-8 px-2"
                                        title="Copy session details"
                                      >
                                        <Copy className="h-3 w-3" />
                                      </Button>
                                    )}
                                    {sessions.length > 1 && (
                                      <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() =>
                                          removeSession(session.id)
                                        }
                                        className="border-red-600 text-red-400 hover:bg-red-900/20 h-8 px-2"
                                        title="Remove session"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>
                              <CardContent className="space-y-4">
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">
                                      Session Title *
                                    </label>
                                    <input
                                      type="text"
                                      value={session.title}
                                      onChange={(e) =>
                                        updateSession(
                                          session.id,
                                          "title",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Enter session title"
                                      className={`w-full p-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400 ${
                                        validationErrors[`${session.id}-title`]
                                          ? "border-red-500 bg-red-900/20"
                                          : "border-gray-600 hover:border-gray-500 focus:border-blue-400"
                                      }`}
                                    />
                                    {validationErrors[
                                      `${session.id}-title`
                                    ] && (
                                      <p className="text-red-400 text-sm mt-1">
                                        {
                                          validationErrors[
                                            `${session.id}-title`
                                          ]
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">
                                      Place/Location *
                                    </label>
                                    <input
                                      type="text"
                                      value={session.place}
                                      onChange={(e) =>
                                        updateSession(
                                          session.id,
                                          "place",
                                          e.target.value
                                        )
                                      }
                                      placeholder="Session location"
                                      className={`w-full p-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400 ${
                                        validationErrors[`${session.id}-place`]
                                          ? "border-red-500 bg-red-900/20"
                                          : "border-gray-600 hover:border-gray-500 focus:border-blue-400"
                                      }`}
                                    />
                                    {validationErrors[
                                      `${session.id}-place`
                                    ] && (
                                      <p className="text-red-400 text-sm mt-1">
                                        {
                                          validationErrors[
                                            `${session.id}-place`
                                          ]
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">
                                      <Building2 className="h-4 w-4 inline mr-1" />
                                      Room *
                                    </label>
                                    <select
                                      value={session.roomId}
                                      onChange={(e) =>
                                        updateSession(
                                          session.id,
                                          "roomId",
                                          e.target.value
                                        )
                                      }
                                      className={`w-full p-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white ${
                                        validationErrors[`${session.id}-roomId`]
                                          ? "border-red-500 bg-red-900/20"
                                          : "border-gray-600 hover:border-gray-500 focus:border-blue-400"
                                      }`}
                                    >
                                      <option value="">Select Room</option>
                                      {rooms.map((r) => (
                                        <option key={r.id} value={r.id}>
                                          {r.name}
                                        </option>
                                      ))}
                                    </select>
                                    {validationErrors[
                                      `${session.id}-roomId`
                                    ] && (
                                      <p className="text-red-400 text-sm mt-1">
                                        {
                                          validationErrors[
                                            `${session.id}-roomId`
                                          ]
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">
                                      Status
                                    </label>
                                    <select
                                      value={session.status}
                                      onChange={(e) =>
                                        updateSession(
                                          session.id,
                                          "status",
                                          e.target.value
                                        )
                                      }
                                      className="w-full p-3 border-2 border-gray-600 rounded-lg hover:border-gray-500 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-gray-800 text-white"
                                    >
                                      <option value="Draft">Draft</option>
                                      <option value="Confirmed">
                                        Confirmed
                                      </option>
                                    </select>
                                  </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">
                                      <Clock className="h-4 w-4 inline mr-1 text-green-400" />
                                      Start Time *
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={session.startTime}
                                      onChange={(e) =>
                                        updateSession(
                                          session.id,
                                          "startTime",
                                          e.target.value
                                        )
                                      }
                                      className={`w-full p-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white ${
                                        validationErrors[
                                          `${session.id}-startTime`
                                        ]
                                          ? "border-red-500 bg-red-900/20"
                                          : "border-gray-600 hover:border-gray-500 focus:border-blue-400"
                                      }`}
                                    />
                                    {validationErrors[
                                      `${session.id}-startTime`
                                    ] && (
                                      <p className="text-red-400 text-sm mt-1">
                                        {
                                          validationErrors[
                                            `${session.id}-startTime`
                                          ]
                                        }
                                      </p>
                                    )}
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium text-gray-200 mb-2">
                                      <Clock className="h-4 w-4 inline mr-1 text-red-400" />
                                      End Time *
                                    </label>
                                    <input
                                      type="datetime-local"
                                      value={session.endTime}
                                      onChange={(e) =>
                                        updateSession(
                                          session.id,
                                          "endTime",
                                          e.target.value
                                        )
                                      }
                                      className={`w-full p-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white ${
                                        validationErrors[
                                          `${session.id}-endTime`
                                        ]
                                          ? "border-red-500 bg-red-900/20"
                                          : "border-gray-600 hover:border-gray-500 focus:border-blue-400"
                                      }`}
                                    />
                                    {validationErrors[
                                      `${session.id}-endTime`
                                    ] && (
                                      <p className="text-red-400 text-sm mt-1">
                                        {
                                          validationErrors[
                                            `${session.id}-endTime`
                                          ]
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>

                                {session.startTime && session.endTime && (
                                  <div className="p-3 bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-700 rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className="p-2 bg-blue-600/20 rounded-lg">
                                        <Timer className="h-4 w-4 text-blue-400" />
                                      </div>
                                      <div>
                                        <p className="text-sm text-blue-200 font-medium">
                                          Duration
                                        </p>
                                        <p className="text-lg font-bold text-white">
                                          {calculateDuration(
                                            session.startTime,
                                            session.endTime
                                          )}
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                <div>
                                  <label className="block text-sm font-medium text-gray-200 mb-2">
                                    <FileText className="h-4 w-4 inline mr-1" />
                                    Description *
                                  </label>
                                  <textarea
                                    value={session.description}
                                    onChange={(e) =>
                                      updateSession(
                                        session.id,
                                        "description",
                                        e.target.value
                                      )
                                    }
                                    rows={3}
                                    placeholder="Session description, objectives, and key topics..."
                                    className={`w-full p-3 border-2 rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-800 text-white placeholder-gray-400 ${
                                      validationErrors[
                                        `${session.id}-description`
                                      ]
                                        ? "border-red-500 bg-red-900/20"
                                        : "border-gray-600 hover:border-gray-500 focus:border-blue-400"
                                    }`}
                                  />
                                  {validationErrors[
                                    `${session.id}-description`
                                  ] && (
                                    <p className="text-red-400 text-sm mt-1">
                                      {
                                        validationErrors[
                                          `${session.id}-description`
                                        ]
                                      }
                                    </p>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {formStep === 3 && (
                      <div className="space-y-6">
                        <div className="bg-gradient-to-br from-gray-800 to-gray-800/50 rounded-xl p-6 border border-gray-700">
                          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            Bulk Session Review
                          </h3>

                          <div className="grid md:grid-cols-2 gap-4 text-sm mb-6">
                            {selectedEventId && (
                              <div>
                                <span className="font-medium text-gray-300">Event:</span>
                                <p className="text-white">
                                  {events.find((e) => e.id === selectedEventId)?.name}
                                </p>
                              </div>
                            )}
                            <div>
                              <span className="font-medium text-gray-300">Faculty:</span>
                              <p className="text-white">{selectedFaculty?.name}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-300">Email:</span>
                              <p className="text-white">{email}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-300">Total Sessions:</span>
                              <p className="text-white">{sessions.length}</p>
                            </div>
                            <div>
                              <span className="font-medium text-gray-300">Poster:</span>
                              <p className="text-white">{posterFile ? "Included" : "None"}</p>
                            </div>
                            {selectedFaculty?.institution && (
                              <div>
                                <span className="font-medium text-gray-300">Institution:</span>
                                <p className="text-white">{selectedFaculty.institution}</p>
                              </div>
                            )}
                          </div>

                          <div className="space-y-4">
                            <h4 className="font-medium text-gray-300">
                              Sessions Overview:
                            </h4>
                            <div className="max-h-96 overflow-y-auto space-y-4">
                              {sessions.map((session, index) => {
                                const selectedRoom = rooms.find(
                                  (r) => r.id === session.roomId
                                );
                                const duration = calculateDuration(
                                  session.startTime,
                                  session.endTime
                                );
                                return (
                                  <div
                                    key={session.id}
                                    className="bg-gray-900/50 border border-gray-600 rounded-lg p-4"
                                  >
                                    <div className="flex justify-between items-start mb-2">
                                      <h5 className="font-medium text-white">
                                        #{index + 1}: {session.title}
                                      </h5>
                                      <Badge variant="secondary" className="text-xs">
                                        {session.status}
                                      </Badge>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <span className="text-gray-400">Location:</span>
                                        <span className="text-white ml-2">{session.place}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Room:</span>
                                        <span className="text-white ml-2">{selectedRoom?.name}</span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">Start:</span>
                                        <span className="text-white ml-2">
                                          {session.startTime
                                            ? new Date(session.startTime).toLocaleString()
                                            : "Not set"}
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-gray-400">End:</span>
                                        <span className="text-white ml-2">
                                          {session.endTime
                                            ? new Date(session.endTime).toLocaleString()
                                            : "Not set"}
                                        </span>
                                      </div>
                                      <div className="md:col-span-2">
                                        <span className="text-gray-400">Duration:</span>
                                        <span className="text-white ml-2">{duration || "Invalid"}</span>
                                      </div>
                                    </div>
                                    {session.description && (
                                      <div className="mt-2 pt-2 border-t border-gray-700">
                                        <span className="text-gray-400 text-sm">Description:</span>
                                        <p className="text-white text-sm mt-1 line-clamp-3">
                                          {session.description}
                                        </p>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {posterPreview && (
                            <div className="mt-4">
                              <span className="font-medium text-gray-300">Poster Preview:</span>
                              <img
                                src={posterPreview}
                                alt="Session poster"
                                className="w-32 h-auto rounded-lg mt-2 border border-gray-600"
                              />
                            </div>
                          )}
                        </div>

                        <Alert className="border-blue-600 bg-blue-900/20">
                          <Send className="h-4 w-4 text-blue-400" />
                          <AlertDescription className="text-blue-200">
                            <strong>Ready to send bulk invitation!</strong>
                            <br />A single comprehensive email will be sent to{" "}
                            {selectedFaculty?.name} with all {sessions.length}{" "}
                            session(s)
                            {posterFile && " and the attached poster"}. The
                            faculty can respond to each session individually.
                          </AlertDescription>
                        </Alert>
                      </div>
                    )}

                    <div className="flex justify-between items-center pt-8 border-t border-gray-700">
                      <div>
                        {formStep > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={prevStep}
                            className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white"
                          >
                            Previous Step
                          </Button>
                        )}
                      </div>

                      <div className="flex gap-3">
                        {formStep < 3 ? (
                          <Button
                            type="button"
                            onClick={nextStep}
                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
                          >
                            Continue
                          </Button>
                        ) : (
                          <Button
                            type="submit"
                            disabled={loading}
                            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-8 text-white shadow-lg"
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Creating {sessions.length} Sessions...
                              </>
                            ) : (
                              <>
                                <Send className="h-4 w-4 mr-2" />
                                Create {sessions.length} Sessions & Send Bulk Invite
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-gray-700 shadow-xl bg-gradient-to-br from-gray-800 to-gray-900 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Sparkles className="h-5 w-5 text-purple-400" />
                    Bulk Session Features
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm">
                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-green-800">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Event-Based Sessions</p>
                      <p className="text-gray-300 text-xs">
                        Select events first, then faculty filtered by event
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-blue-800">
                      <Send className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Bulk Email</p>
                      <p className="text-gray-300 text-xs">
                        One comprehensive email with all sessions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-orange-800">
                      <Copy className="h-4 w-4 text-orange-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Session Duplication</p>
                      <p className="text-gray-300 text-xs">
                        Copy session details (except timing)
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-purple-800">
                      <AlertTriangle className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Conflict Detection</p>
                      <p className="text-gray-300 text-xs">
                        Checks conflicts across all sessions
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-1 rounded bg-indigo-800">
                      <Timer className="h-4 w-4 text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-medium text-white">Duration Calculation</p>
                      <p className="text-gray-300 text-xs">
                        Automatic duration validation and display
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-gray-700 shadow-xl bg-gray-900/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Users className="h-5 w-5 text-blue-400" />
                    Current Session Count
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-white mb-2">
                    {sessions.length}
                  </div>
                  <p className="text-gray-400">
                    Session{sessions.length !== 1 ? "s" : ""} for{" "}
                    {selectedFaculty?.name || "Faculty"}
                  </p>

                  {sessions.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-700">
                      <div className="text-sm text-gray-300">
                        <div className="flex justify-between">
                          <span>Completed:</span>
                          <span>
                            {
                              sessions.filter(
                                (s) => s.title && s.startTime && s.endTime
                              ).length
                            }
                            /{sessions.length}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all"
                            style={{
                              width: `${
                                (sessions.filter(
                                  (s) => s.title && s.startTime && s.endTime
                                ).length /
                                  sessions.length) *
                                100
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-gray-700 shadow-xl bg-gray-900/80 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg text-white">
                    <Clock className="h-5 w-5 text-green-400" />
                    Quick Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-800">
                    <p className="font-medium text-blue-200">Event Selection</p>
                    <p className="text-blue-300 text-xs">
                      Select an event first to filter faculty by event association
                    </p>
                  </div>

                  <div className="p-3 bg-green-900/30 rounded-lg border border-green-800">
                    <p className="font-medium text-green-200">Quick Setup</p>
                    <p className="text-green-300 text-xs">
                      Set common location and status in Step 1 to apply to all sessions
                    </p>
                  </div>

                  <div className="p-3 bg-orange-900/30 rounded-lg border border-orange-800">
                    <p className="font-medium text-orange-200">Check Conflicts</p>
                    <p className="text-orange-300 text-xs">
                      Always run conflict check before submitting to avoid scheduling issues
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </OrganizerLayout>
  );
};

export default CreateSession;


