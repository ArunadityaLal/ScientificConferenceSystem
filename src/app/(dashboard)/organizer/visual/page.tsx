// src/app/(dashboard)/organizer/sessions/page.tsx - IST TIMEZONE FIX
"use client";

import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit3,
  Save,
  X,
  Trash2,
  RefreshCw,
  AlertTriangle,
  Sun,
  Moon,
} from "lucide-react";
import {
  format,
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isValid,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// --- Data Types ---
export interface Session {
  id: string;
  title: string;
  facultyId: string;
  facultyName?: string;
  email: string;
  place: string;
  roomId: string;
  roomName?: string;
  description?: string;
  startTime: string; // Stored as IST ISO String
  endTime: string; // Stored as IST ISO String
  status: "Draft" | "Confirmed";
  inviteStatus: "Pending" | "Accepted" | "Declined";
  rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict";
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
  formattedStartTime?: string;
  formattedEndTime?: string;
  duration?: string;
  eventId?: string;
}

type RoomLite = { id: string; name: string };
type Faculty = {
  id: string;
  name: string;
  email: string;
  department?: string;
  institution?: string;
  expertise?: string;
  phone?: string;
  eventId: string;
  eventName: string;
};
type Event = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: string;
  description?: string;
  eventType?: string;
  createdByUser?: { id: string; name: string; email: string };
  _count?: { sessions: number; registrations: number };
  facultyCount?: number;
};
type DraftSession = {
  title?: string;
  place: string;
  roomId?: string;
  startTime?: string;
  endTime?: string;
  status: "Draft" | "Confirmed";
  description?: string;
};
type Theme = "light" | "dark";

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  date: string;
  timeSlot?: string;
  rooms: RoomLite[];
  onSessionUpdate: (sessionId: string, updates: Partial<Session>) => void;
  onSessionDelete: (sessionId: string) => void;
  theme: Theme;
}

interface CreateSessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date | undefined;
  defaultHour?: number | undefined;
  rooms: RoomLite[];
  events: Event[];
  facultiesByEvent: Record<string, Faculty[]>;
  onCreate: () => void;
  theme: Theme;
}

// ============================================================================
// #region IST TIMEZONE HELPER FUNCTIONS (COMPLETE IST FIX)
// ============================================================================

/**
 * **KEY FIX 1: From User Input (IST) to Database (IST)**
 * Converts a local time string from a 'datetime-local' input (IST)
 * into an IST ISO string for database storage.
 */
const convertLocalToIST = (localDateTimeString?: string): string | null => {
  if (!localDateTimeString) return null;
  // Append seconds and the IST offset (+05:30) to the string.
  const isoStringWithOffset = `${localDateTimeString}:00+05:30`;
  const date = new Date(isoStringWithOffset);
  return isValid(date) ? date.toISOString() : null;
};

/**
 * **KEY FIX 2: From Database (IST) to User Input (Local)**
 * Converts an IST ISO string (from the database) into the local time string
 * format required by a 'datetime-local' input field.
 */
const convertISTToInputFormat = (istISOString?: string): string => {
  if (!istISOString) return "";
  const date = new Date(istISOString);
  if (!isValid(date)) return "";

  // Convert to IST
  const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);

  const year = istDate.getUTCFullYear();
  const month = (istDate.getUTCMonth() + 1).toString().padStart(2, "0");
  const day = istDate.getUTCDate().toString().padStart(2, "0");
  const hours = istDate.getUTCHours().toString().padStart(2, "0");
  const minutes = istDate.getUTCMinutes().toString().padStart(2, "0");

  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * **KEY FIX 3: For Display Logic**
 * Parses an IST ISO string from the database and returns its components
 * in IST timezone. Used for positioning sessions on the calendar.
 */
const parseISTTimeToLocal = (istISOString?: string) => {
  if (!istISOString) return { hours: 0, minutes: 0, date: new Date() };
  const date = new Date(istISOString);
  if (!isValid(date)) return { hours: 0, minutes: 0, date: new Date() };

  // Convert to IST
  const istDate = new Date(date.getTime() + 5.5 * 60 * 60 * 1000);

  return {
    hours: istDate.getUTCHours(),
    minutes: istDate.getUTCMinutes(),
    date: new Date(
      istDate.getUTCFullYear(),
      istDate.getUTCMonth(),
      istDate.getUTCDate()
    ),
  };
};

// #endregion
// ============================================================================

// --- Other Helper Functions ---
const isDateInPast = (date: Date) =>
  new Date(date.toDateString()) < new Date(new Date().toDateString());
const isTimeSlotInPast = (date: Date, hour: number) => {
  const now = new Date();
  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);
  return slotDate < now;
};

const getThemeClasses = (theme: Theme) => {
  if (theme === "light") {
    return {
      container: "min-h-screen bg-gray-50",
      header: "bg-white border-b border-gray-200",
      text: {
        primary: "text-gray-900",
        secondary: "text-gray-600",
        muted: "text-gray-500",
        accent: "text-blue-600",
        success: "text-green-600",
        warning: "text-yellow-600",
        error: "text-red-600",
      },
      background: {
        primary: "bg-white",
        secondary: "bg-gray-50",
        tertiary: "bg-gray-100",
      },
      border: "border-gray-200",
      button: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary: "border-gray-300 text-gray-700 hover:bg-gray-50 bg-white",
      },
      modal: "bg-white border border-gray-300",
      input: "bg-white border-gray-300 text-gray-900 focus:border-blue-500",
      alert: {
        warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
        error: "bg-red-50 border-red-200 text-red-800",
      },
      calendar: {
        grid: "bg-white border-gray-200",
        slot: "border-gray-100 hover:bg-gray-50",
        pastSlot: "bg-gray-100 opacity-40 cursor-not-allowed",
        today: "bg-blue-50 border-blue-300",
      },
      badge: {
        outline: "border-gray-300 text-gray-700 bg-white",
        solid: "bg-gray-100 text-gray-800",
      },
    };
  } else {
    return {
      container: "min-h-screen bg-gray-950",
      header: "bg-gray-900 border-b border-gray-800",
      text: {
        primary: "text-white",
        secondary: "text-gray-300",
        muted: "text-gray-400",
        accent: "text-blue-400",
        success: "text-green-400",
        warning: "text-yellow-400",
        error: "text-red-400",
      },
      background: {
        primary: "bg-gray-900",
        secondary: "bg-gray-800",
        tertiary: "bg-gray-700",
      },
      border: "border-gray-700",
      button: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary:
          "border-gray-600 text-gray-300 hover:bg-gray-800 bg-gray-900",
      },
      modal: "bg-gray-900 border border-gray-700",
      input: "bg-gray-800 border-gray-600 text-white focus:border-blue-500",
      alert: {
        warning: "bg-yellow-900/20 border-yellow-700 text-yellow-300",
        error: "bg-red-900/20 border-red-800 text-red-400",
      },
      calendar: {
        grid: "bg-gray-900 border-gray-800",
        slot: "border-gray-800/30 hover:bg-gray-800/20",
        pastSlot: "bg-gray-800/10 opacity-30 cursor-not-allowed",
        today: "bg-blue-600/20 border-blue-500",
      },
      badge: {
        outline: "border-gray-600 text-gray-300 bg-gray-800",
        solid: "bg-gray-800 text-gray-200",
      },
    };
  }
};

// --- SessionDetailsModal Component ---
const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  date,
  timeSlot,
  rooms,
  onSessionUpdate,
  onSessionDelete,
  theme,
}) => {
  const [editing, setEditing] = useState<Record<string, boolean>>({});
  const [draft, setDraft] = useState<Record<string, DraftSession>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<Record<string, boolean>>({});

  const themeClasses = getThemeClasses(theme);

  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    if (theme === "light") {
      switch (status) {
        case "Confirmed":
          return "bg-green-100 text-green-800 border-green-200";
        case "Draft":
          return "bg-yellow-100 text-yellow-800 border-yellow-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    } else {
      switch (status) {
        case "Confirmed":
          return "bg-green-500/20 text-green-300 border-green-500/30";
        case "Draft":
          return "bg-yellow-500/20 text-yellow-300 border-yellow-500/30";
        default:
          return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      }
    }
  };

  const getInviteStatusColor = (status: string) => {
    if (theme === "light") {
      switch (status) {
        case "Accepted":
          return "bg-emerald-100 text-emerald-800 border-emerald-200";
        case "Declined":
          return "bg-red-100 text-red-800 border-red-200";
        case "Pending":
          return "bg-orange-100 text-orange-800 border-orange-200";
        default:
          return "bg-gray-100 text-gray-800 border-gray-200";
      }
    } else {
      switch (status) {
        case "Accepted":
          return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
        case "Declined":
          return "bg-red-500/20 text-red-300 border-red-500/30";
        case "Pending":
          return "bg-orange-500/20 text-orange-300 border-orange-500/30";
        default:
          return "bg-gray-500/20 text-gray-300 border-gray-500/30";
      }
    }
  };

  const onEdit = (sessionId: string) => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session) return;
    setEditing({ ...editing, [sessionId]: true });
    setDraft({
      ...draft,
      [sessionId]: {
        title: session.title,
        place: session.place,
        roomId: session.roomId,
        // **FIX**: Use new converter to correctly populate edit form with IST time
        startTime: convertISTToInputFormat(session.startTime),
        endTime: convertISTToInputFormat(session.endTime),
        status: session.status,
        description: session.description,
      },
    });
  };

  const onCancel = (sessionId: string) => {
    setEditing({ ...editing, [sessionId]: false });
    const newDraft = { ...draft };
    delete newDraft[sessionId];
    setDraft(newDraft);
  };

  const onChangeDraft = (
    sessionId: string,
    field: keyof DraftSession,
    value: string
  ) => {
    setDraft({
      ...draft,
      [sessionId]: { ...draft[sessionId], [field]: value } as DraftSession,
    });
  };

  const onSave = async (sessionId: string) => {
    const body = draft[sessionId];
    if (!body) return;

    setSaving({ ...saving, [sessionId]: true });

    // **CRITICAL FIX**: Convert local times from form to IST before sending to API
    const payload = {
      ...body,
      startTime: convertLocalToIST(body.startTime),
      endTime: convertLocalToIST(body.endTime),
    };

    if (!payload.startTime || !payload.endTime) {
      alert("Invalid start or end time format.");
      setSaving({ ...saving, [sessionId]: false });
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to update session");
      }

      const result = await res.json();
      onSessionUpdate(sessionId, result.data);
      onCancel(sessionId);
    } catch (e) {
      console.error("Session update error:", e);
      alert("Failed to update session");
    } finally {
      setSaving({ ...saving, [sessionId]: false });
    }
  };

  const onDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    setDeleting({ ...deleting, [sessionId]: true });

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to delete session.");
        return;
      }
      onSessionDelete(sessionId);
      onClose();
    } catch (e) {
      console.error(e);
      alert("Failed to delete session.");
    } finally {
      setDeleting({ ...deleting, [sessionId]: false });
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${themeClasses.modal} rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
      >
        <div
          className={`sticky top-0 ${themeClasses.modal} border-b ${themeClasses.border} p-6 rounded-t-xl`}
        >
          <div className="flex justify-between items-center">
            <div>
              <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                Sessions for {date}
              </h2>
              {timeSlot && (
                <p className={`${themeClasses.text.accent} mt-1 font-medium`}>
                  {timeSlot}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className={`${themeClasses.text.muted} hover:${themeClasses.text.primary} text-2xl font-bold p-2 hover:${themeClasses.background.secondary} rounded-lg transition-colors`}
            >
              ×
            </button>
          </div>
          <p className={`${themeClasses.text.muted} mt-2`}>
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}{" "}
            scheduled
          </p>
        </div>

        <div className="p-6 space-y-4">
          {sessions.map((session) => {
            const isEditing = editing[session.id];
            const d = draft[session.id];
            const isSaving = saving[session.id];
            const isDeleting = deleting[session.id];

            return (
              <div
                key={session.id}
                className={`border ${
                  themeClasses.border
                } rounded-lg p-5 transition-all duration-200 ${
                  isEditing
                    ? "border-blue-500 bg-blue-900/10"
                    : `hover:border-gray-600 hover:${themeClasses.background.secondary}`
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  {isEditing ? (
                    <input
                      type="text"
                      value={d?.title || ""}
                      onChange={(e) =>
                        onChangeDraft(session.id, "title", e.target.value)
                      }
                      className={`text-lg font-semibold ${themeClasses.input} rounded-lg px-3 py-2 w-full mr-4 focus:outline-none`}
                      placeholder="Session Title"
                    />
                  ) : (
                    <h3
                      className={`text-lg font-semibold ${themeClasses.text.primary}`}
                    >
                      {session.title || "Untitled Session"}
                    </h3>
                  )}
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                        session.status
                      )}`}
                    >
                      {session.status}
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium border ${getInviteStatusColor(
                        session.inviteStatus
                      )}`}
                    >
                      {session.inviteStatus}
                    </span>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                        >
                          Place/Location
                        </label>
                        <input
                          type="text"
                          value={d?.place || ""}
                          onChange={(e) =>
                            onChangeDraft(session.id, "place", e.target.value)
                          }
                          className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                        >
                          Room
                        </label>
                        <select
                          value={d?.roomId || session.roomId || ""}
                          onChange={(e) =>
                            onChangeDraft(session.id, "roomId", e.target.value)
                          }
                          className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                        >
                          <option value="">Select Room</option>
                          {rooms.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label
                          className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                        >
                          Start Time (IST)
                        </label>
                        <input
                          type="datetime-local"
                          value={d?.startTime || ""}
                          onChange={(e) =>
                            onChangeDraft(
                              session.id,
                              "startTime",
                              e.target.value
                            )
                          }
                          className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                        />
                      </div>
                      <div>
                        <label
                          className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                        >
                          End Time (IST)
                        </label>
                        <input
                          type="datetime-local"
                          value={d?.endTime || ""}
                          onChange={(e) =>
                            onChangeDraft(session.id, "endTime", e.target.value)
                          }
                          className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                      >
                        Status
                      </label>
                      <select
                        value={d?.status || session.status}
                        onChange={(e) =>
                          onChangeDraft(
                            session.id,
                            "status",
                            e.target.value as "Draft" | "Confirmed"
                          )
                        }
                        className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                      >
                        <option value="Draft">Draft</option>
                        <option value="Confirmed">Confirmed</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                      >
                        Description
                      </label>
                      <textarea
                        value={d?.description || ""}
                        onChange={(e) =>
                          onChangeDraft(
                            session.id,
                            "description",
                            e.target.value
                          )
                        }
                        rows={3}
                        className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                      />
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        onClick={() => onSave(session.id)}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        {isSaving ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onCancel(session.id)}
                        disabled={isSaving}
                        className={themeClasses.button.secondary}
                      >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => onDelete(session.id)}
                        disabled={isDeleting}
                        className="border-red-600 text-red-400 hover:bg-red-900/20 ml-auto"
                      >
                        {isDeleting ? (
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 mr-2" />
                        )}
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div
                      className={`grid grid-cols-1 md:grid-cols-2 gap-4 text-sm ${themeClasses.text.secondary} mb-4`}
                    >
                      <div className="flex items-center gap-3">
                        <User className="w-4 h-4 text-blue-400" />
                        <span>{session.facultyName || "Faculty TBD"}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <MapPin className="w-4 h-4 text-green-400" />
                        <span>
                          {session.place} - {session.roomName || session.roomId}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-purple-400" />
                        <span>
                          {parseISTTimeToLocal(session.startTime)
                            .hours.toString()
                            .padStart(2, "0")}
                          :
                          {parseISTTimeToLocal(session.startTime)
                            .minutes.toString()
                            .padStart(2, "0")}{" "}
                          -{" "}
                          {parseISTTimeToLocal(session.endTime)
                            .hours.toString()
                            .padStart(2, "0")}
                          :
                          {parseISTTimeToLocal(session.endTime)
                            .minutes.toString()
                            .padStart(2, "0")}{" "}
                          IST
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <Calendar className="w-4 h-4 text-yellow-400" />
                        <span>{session.duration || "Duration TBD"}</span>
                      </div>
                    </div>

                    {session.description && (
                      <div
                        className={`mb-4 p-4 ${themeClasses.background.secondary} rounded-lg border ${themeClasses.border}`}
                      >
                        <p
                          className={`text-sm ${themeClasses.text.secondary} leading-relaxed`}
                        >
                          {session.description}
                        </p>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(session.id)}
                        className="border-blue-600 text-blue-400 hover:bg-blue-900/20"
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Edit Session
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- CreateSessionModal Component ---
const CreateSessionModal: React.FC<CreateSessionModalProps> = ({
  isOpen,
  onClose,
  defaultDate,
  defaultHour,
  rooms,
  events,
  facultiesByEvent,
  onCreate,
  theme,
}) => {
  const [title, setTitle] = useState("");
  const [selectedEventId, setSelectedEventId] = useState("");
  const [facultyId, setFacultyId] = useState("");
  const [email, setEmail] = useState("");
  const [place, setPlace] = useState("");
  const [roomId, setRoomId] = useState("");
  const [description, setDescription] = useState("");
  const [startDateTime, setStartDateTime] = useState("");
  const [endDateTime, setEndDateTime] = useState("");
  const [status, setStatus] = useState<"Draft" | "Confirmed">("Draft");
  const [loading, setLoading] = useState(false);
  const [travelRequired, setTravelRequired] = useState("");
  const [accommodationRequired, setAccommodationRequired] = useState("");

  const themeClasses = getThemeClasses(theme);

  useEffect(() => {
    if (isOpen && defaultDate && defaultHour !== undefined) {
      const startDate = new Date(defaultDate);
      startDate.setHours(defaultHour, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);

      // **FIX**: Use the new converter to correctly set the initial IST time in the inputs
      setStartDateTime(convertISTToInputFormat(startDate.toISOString()));
      setEndDateTime(convertISTToInputFormat(endDate.toISOString()));
    }
  }, [isOpen, defaultDate, defaultHour]);

  const availableFaculty = selectedEventId
    ? facultiesByEvent[selectedEventId] || []
    : [];

  const handleFacultyChange = (id: string) => {
    setFacultyId(id);
    const fac = availableFaculty.find((f) => f.id === id);
    if (fac) setEmail(fac.email);
    else setEmail("");
  };

  const handleEventChange = (id: string) => {
    setSelectedEventId(id);
    setFacultyId("");
    setEmail("");
    const ev = events.find((e) => e.id === id);
    if (ev?.location) setPlace(ev.location);
  };

  const resetForm = () => {
    setTitle("");
    setSelectedEventId("");
    setFacultyId("");
    setEmail("");
    setPlace("");
    setRoomId("");
    setDescription("");
    setStartDateTime("");
    setEndDateTime("");
    setStatus("Draft");
    setTravelRequired("");
    setAccommodationRequired("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDateTime || !endDateTime) {
      alert("Please select a start and end time.");
      return;
    }
    setLoading(true);

    try {
      // **CRITICAL FIX**: Convert local time strings from the form to IST before sending to the API
      const istStartTime = convertLocalToIST(startDateTime);
      const istEndTime = convertLocalToIST(endDateTime);

      if (
        !istStartTime ||
        !istEndTime ||
        new Date(istEndTime) <= new Date(istStartTime)
      ) {
        alert("End time must be after start time.");
        setLoading(false);
        return;
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("facultyId", facultyId);
      formData.append("email", email);
      formData.append("place", place);
      formData.append("roomId", roomId);
      formData.append("description", description);
      formData.append("status", status);
      formData.append("inviteStatus", "Pending");
      formData.append("eventId", selectedEventId);
      formData.append("travel", travelRequired);
      formData.append("accommodation", accommodationRequired);

      // Send the corrected IST times to the server
      formData.append("startTime", istStartTime);
      formData.append("endTime", istEndTime);

      const response = await fetch("/api/sessions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create session");
      }

      resetForm();
      onCreate();
      onClose();
      alert("Session created successfully!");
    } catch (error: any) {
      console.error("❌ Error creating session:", error);
      alert(`Failed to create session: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div
        className={`${themeClasses.modal} rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl`}
      >
        <div
          className={`sticky top-0 ${themeClasses.modal} border-b ${themeClasses.border} p-6 rounded-t-xl`}
        >
          <div className="flex justify-between items-center">
            <h2 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
              Create New Session
            </h2>
            <button
              onClick={onClose}
              className={`${themeClasses.text.muted} hover:${themeClasses.text.primary} text-2xl font-bold p-2 hover:${themeClasses.background.secondary} rounded-lg transition-colors`}
            >
              ×
            </button>
          </div>
          <p className={`${themeClasses.text.muted} mt-1`}>
            Fill in the details to create a new session (All times in IST)
          </p>
        </div>

        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                >
                  Session Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                  placeholder="Enter session title"
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                >
                  Event *
                  <span className={`text-xs ${themeClasses.text.accent} ml-2`}>
                    ({events.length} events available)
                  </span>
                </label>
                <select
                  value={selectedEventId}
                  onChange={(e) => handleEventChange(e.target.value)}
                  className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                  required
                >
                  <option value="">Select Event</option>
                  {events.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name} ({event.facultyCount || 0} faculty)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
              >
                Faculty *
                <span className={`text-xs ${themeClasses.text.accent} ml-2`}>
                  ({availableFaculty.length} faculty available)
                </span>
              </label>
              <select
                value={facultyId}
                onChange={(e) => handleFacultyChange(e.target.value)}
                className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                required
                disabled={!selectedEventId}
              >
                <option value="">
                  {selectedEventId
                    ? "Select Faculty"
                    : "Please select an event first"}
                </option>
                {availableFaculty.map((faculty) => (
                  <option key={faculty.id} value={faculty.id}>
                    {faculty.name}
                    {faculty.department && ` (${faculty.department})`}
                    {faculty.institution && ` - ${faculty.institution}`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                >
                  Faculty Email *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                  placeholder="faculty@university.edu"
                  required
                  readOnly={!!facultyId}
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                >
                  Place/Location *
                </label>
                <input
                  type="text"
                  value={place}
                  onChange={(e) => setPlace(e.target.value)}
                  className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                  placeholder="e.g., Main Campus, Building A"
                  required
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
              >
                Room *
              </label>
              <select
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                required
              >
                <option value="">Select Room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                >
                  Travel *
                </label>
                <select
                  value={travelRequired}
                  onChange={(e) => setTravelRequired(e.target.value)}
                  className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                  required
                >
                  <option value="">Provide Travel</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                >
                  Accommodation *
                </label>
                <select
                  value={accommodationRequired}
                  onChange={(e) => setAccommodationRequired(e.target.value)}
                  className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                  required
                >
                  <option value="">Provide Accommodation</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                >
                  Start Time (IST) *
                </label>
                <input
                  type="datetime-local"
                  value={startDateTime}
                  onChange={(e) => setStartDateTime(e.target.value)}
                  className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                  required
                />
              </div>

              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                >
                  End Time (IST) *
                </label>
                <input
                  type="datetime-local"
                  value={endDateTime}
                  onChange={(e) => setEndDateTime(e.target.value)}
                  className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                  required
                />
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
              >
                Status
              </label>
              <select
                value={status}
                onChange={(e) =>
                  setStatus(e.target.value as "Draft" | "Confirmed")
                }
                className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
              >
                <option value="Draft">Draft</option>
                <option value="Confirmed">Confirmed</option>
              </select>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
              >
                Description *
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className={`w-full ${themeClasses.input} rounded-lg px-3 py-2 focus:outline-none`}
                placeholder="Session description, objectives, and key topics..."
                required
              />
            </div>

            <div
              className={`flex justify-end gap-3 pt-4 border-t ${themeClasses.border}`}
            >
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className={themeClasses.button.secondary}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !selectedEventId || !facultyId}
                className={themeClasses.button.primary}
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Create Session
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

// --- Main SessionsCalendarView Component ---
const SessionsCalendarView: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [rooms, setRooms] = useState<RoomLite[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [facultiesByEvent, setFacultiesByEvent] = useState<
    Record<string, Faculty[]>
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSessions, setSelectedSessions] = useState<Session[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [lastUpdateTime, setLastUpdateTime] = useState<string>("");
  const [theme, setTheme] = useState<Theme>("dark");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newSessionDate, setNewSessionDate] = useState<Date | undefined>();
  const [newSessionHour, setNewSessionHour] = useState<number | undefined>();

  const themeClasses = getThemeClasses(theme);
  const POLL_INTERVAL = 30000;

  const loadEventsAndFaculty = useCallback(async () => {
    try {
      console.log("🔄 Loading events and faculty data...");

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

      const facultyResponse = await fetch("/api/faculties", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      let allFaculties: Faculty[] = [];
      if (facultyResponse.ok) {
        allFaculties = await facultyResponse.json();
        console.log(`✅ Loaded ${allFaculties.length} faculties from database`);
      }

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

          localFaculties.forEach((localFaculty: Faculty) => {
            if (!allFaculties.find((f) => f.email === localFaculty.email)) {
              allFaculties.push(localFaculty);
            }
          });
        }
      }

      const facultyMapping: Record<string, Faculty[]> = {};
      allFaculties.forEach((faculty) => {
        if (!facultyMapping[faculty.eventId]) {
          facultyMapping[faculty.eventId] = [];
        }
        (facultyMapping[faculty.eventId] ?? []).push(faculty);
      });

      const eventsWithFacultyCounts = eventsList.map((event: Event) => ({
        ...event,
        facultyCount: facultyMapping[event.id]?.length || 0,
      }));

      return {
        events: eventsWithFacultyCounts,
        facultiesByEvent: facultyMapping,
      };
    } catch (error) {
      console.error("❌ Error loading events and faculty:", error);
      return { events: [], facultiesByEvent: {} };
    }
  }, []);

  const fetchSessions = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) setLoading(true);
        setError(null);

        const [
          sessionsRes,
          roomsRes,
          { events: eventsFromDb, facultiesByEvent: facultyMapping },
        ] = await Promise.all([
          fetch("/api/sessions", { cache: "no-store" }),
          fetch("/api/rooms", { cache: "no-store" }),
          loadEventsAndFaculty(),
        ]);

        if (!sessionsRes.ok || !roomsRes.ok) {
          throw new Error("Failed to fetch data from server");
        }

        const sessionsData = await sessionsRes.json();
        const roomsData = await roomsRes.json();

        const sessionsList =
          sessionsData?.data?.sessions ||
          sessionsData?.sessions ||
          sessionsData ||
          [];
        const roomsList = roomsData || [];

        if (Array.isArray(sessionsList)) {
          const enhancedSessions = sessionsList.map((session: any) => ({
            ...session,
            roomName:
              roomsList.find((r: RoomLite) => r.id === session.roomId)?.name ||
              session.roomName,
          }));

          setSessions(enhancedSessions);
          setRooms(roomsList);
          setEvents(eventsFromDb);
          setFacultiesByEvent(facultyMapping);
          setLastUpdateTime(new Date().toLocaleTimeString());

          console.log(
            `✅ Calendar updated: ${enhancedSessions.length} sessions, ${eventsFromDb.length} events`
          );
        } else {
          setError(sessionsData?.error || "Failed to load sessions");
        }
      } catch (err) {
        console.error("❌ Error fetching data:", err);
        setError("Failed to load data. Please try again.");
      } finally {
        if (showLoading) setLoading(false);
      }
    },
    [loadEventsAndFaculty]
  );

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => fetchSessions(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const timeSlots = useMemo(() => {
    return Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      displayLabel: format(new Date(0, 0, 0, i), "h a"),
    }));
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(start, i);
      return {
        date,
        dayName: format(date, "EEE"),
        dateNumber: format(date, "d"),
        isToday: isSameDay(date, new Date()),
      };
    }).filter((day) => !isDateInPast(day.date) || day.isToday);
  }, [currentWeek]);

  // **FIX**: Use the new `parseISTTimeToLocal` function for filtering sessions
  const getSessionsForSlot = (date: Date, hour: number) => {
    return sessions.filter((session) => {
      const sessionStartTime = parseISTTimeToLocal(session.startTime);
      const sessionEndTime = parseISTTimeToLocal(session.endTime);
      return (
        isSameDay(sessionStartTime.date, date) &&
        hour >= sessionStartTime.hours &&
        hour < sessionEndTime.hours
      );
    });
  };

  // **FIX**: Use `parseISTTimeToLocal` for calculating session position and duration
  const getSessionStyle = (session: Session) => {
    const startTime = parseISTTimeToLocal(session.startTime);
    const endTime = parseISTTimeToLocal(session.endTime);

    const startInMinutes = startTime.hours * 60 + startTime.minutes;
    const endInMinutes = endTime.hours * 60 + endTime.minutes;
    const durationInMinutes = endInMinutes - startInMinutes;

    return {
      top: `${startInMinutes}px`,
      height: `${Math.max(durationInMinutes - 4, 30)}px`,
    };
  };

  const getSessionColor = (session: Session) => {
    if (session.inviteStatus === "Accepted") {
      return "bg-green-600/90 border-l-green-400 text-white shadow-lg shadow-green-600/20";
    } else if (
      session.inviteStatus === "Declined" &&
      (session.rejectionReason === "SuggestedTopic" ||
        session.rejectionReason === "TimeConflict")
    ) {
      return "bg-yellow-600/90 border-l-yellow-400 text-white shadow-lg shadow-yellow-600/20";
    } else if (session.inviteStatus === "Declined") {
      return "bg-red-600/90 border-l-red-400 text-white shadow-lg shadow-red-600/20";
    } else if (session.inviteStatus === "Pending") {
      return "bg-blue-600/90 border-l-blue-400 text-white shadow-lg shadow-blue-600/20";
    } else {
      return "bg-gray-600/90 border-l-gray-400 text-white shadow-lg shadow-gray-600/20";
    }
  };

  const handleSlotClick = (
    date: Date,
    hour: number,
    sessionsInSlot: Session[]
  ) => {
    if (sessionsInSlot.length === 0) {
      if (!isTimeSlotInPast(date, hour)) {
        setNewSessionDate(date);
        setNewSessionHour(hour);
        setShowCreateModal(true);
      }
      return;
    }

    setSelectedSessions(sessionsInSlot);
    setSelectedDate(format(date, "EEEE, MMMM d, yyyy"));
    setSelectedTimeSlot(
      `${format(new Date().setHours(hour), "h a")} - ${format(
        new Date().setHours(hour + 1),
        "h a"
      )} IST`
    );
    setIsModalOpen(true);
  };

  const handleSessionClick = (session: Session) => {
    const sessionTime = parseISTTimeToLocal(session.startTime);
    setSelectedSessions([session]);
    setSelectedDate(format(sessionTime.date, "EEEE, MMMM d, yyyy"));
    setSelectedTimeSlot(
      `${sessionTime.hours}:${sessionTime.minutes
        .toString()
        .padStart(2, "0")} - ${
        parseISTTimeToLocal(session.endTime).hours
      }:${parseISTTimeToLocal(session.endTime)
        .minutes.toString()
        .padStart(2, "0")} IST`
    );
    setIsModalOpen(true);
  };

  const handleSessionUpdate = (
    sessionId: string,
    updates: Partial<Session>
  ) => {
    setSessions((prevSessions) =>
      prevSessions.map((session) =>
        session.id === sessionId ? { ...session, ...updates } : session
      )
    );
    fetchSessions(false);
  };

  const handleSessionDelete = (sessionId: string) => {
    setSessions((prevSessions) =>
      prevSessions.filter((session) => session.id !== sessionId)
    );
    fetchSessions(false);
  };

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek =
      direction === "next" ? addDays(currentWeek, 7) : subDays(currentWeek, 7);

    if (direction === "prev") {
      const weekStart = startOfWeek(newWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(newWeek, { weekStartsOn: 1 });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (weekEnd < today) return;
    }

    setCurrentWeek(newWeek);
  };

  const handleNewSessionClick = () => {
    const now = new Date();
    setNewSessionDate(now);
    setNewSessionHour(now.getHours() + 1);
    setShowCreateModal(true);
  };

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const totalAvailableFaculty = Object.values(facultiesByEvent).flat().length;

  if (loading) {
    return (
      <div className={themeClasses.container}>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={themeClasses.container}>
        <div className={`${themeClasses.alert.error} rounded-lg p-4`}>
          <p className={themeClasses.text.error}>{error}</p>
          <button
            onClick={() => fetchSessions(true)}
            className={`mt-2 ${themeClasses.text.primary} hover:${themeClasses.text.secondary} underline`}
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={themeClasses.container}>
      <div className={`${themeClasses.header} p-6`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${themeClasses.text.primary}`}>
                Sessions Calendar
              </h1>
              <p className={themeClasses.text.secondary}>
                IST timezone • Database-connected schedule • Last updated:{" "}
                {lastUpdateTime}
                <span className={`${themeClasses.text.accent} ml-2`}>
                  • {events.length} events • {totalAvailableFaculty} faculty
                  available
                </span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={toggleTheme}
              className={`${themeClasses.button.secondary} p-2`}
            >
              {theme === "dark" ? (
                <Sun className="w-4 h-4" />
              ) : (
                <Moon className="w-4 h-4" />
              )}
            </Button>

            <div
              className={`flex items-center gap-2 text-sm ${themeClasses.text.muted}`}
            >
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Database Connected</span>
            </div>

            <Button
              variant="outline"
              className={themeClasses.button.secondary}
              onClick={() => fetchSessions(true)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              <span className={themeClasses.text.primary}>Refresh</span>
            </Button>

            <Button
              className={themeClasses.button.primary}
              onClick={handleNewSessionClick}
              disabled={events.length === 0}
            >
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        {events.length === 0 && (
          <div
            className={`mb-4 p-3 ${themeClasses.alert.warning} rounded-lg border`}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                No events found. Please create events in Event Management or
                upload faculty lists.
              </span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek("prev")}
              className={themeClasses.button.secondary}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <h2
              className={`text-lg font-semibold ${themeClasses.text.primary}`}
            >
              {format(startOfWeek(currentWeek, { weekStartsOn: 1 }), "MMM d")} -{" "}
              {format(
                endOfWeek(currentWeek, { weekStartsOn: 1 }),
                "MMM d, yyyy"
              )}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigateWeek("next")}
              className={themeClasses.button.secondary}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentWeek(new Date())}
            className={themeClasses.button.secondary}
          >
            <span className={themeClasses.text.primary}>Today</span>
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex overflow-hidden">
        <div
          className={`${themeClasses.calendar.grid} border-r ${themeClasses.border} w-20 flex-shrink-0`}
        >
          <div className={`h-16 border-b ${themeClasses.border}`}></div>
          {timeSlots.map((slot) => (
            <div
              key={slot.hour}
              className={`h-15 border-b ${themeClasses.border} flex items-start justify-center pt-1`}
              style={{ height: "60px" }}
            >
              <span
                className={`text-xs ${themeClasses.text.muted} font-medium`}
              >
                {slot.displayLabel}
              </span>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-x-auto">
          <div className="flex min-w-full">
            {weekDays.map((day) => (
              <div
                key={day.date.toISOString()}
                className={`flex-1 border-r ${themeClasses.border} min-w-0`}
              >
                <div
                  className={`h-16 border-b ${
                    themeClasses.border
                  } flex flex-col items-center justify-center ${
                    day.isToday
                      ? themeClasses.calendar.today
                      : themeClasses.calendar.grid
                  }`}
                >
                  <div
                    className={`text-xs font-medium ${themeClasses.text.muted} uppercase`}
                  >
                    {day.dayName}
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      day.isToday ? "text-blue-400" : themeClasses.text.primary
                    }`}
                  >
                    {day.dateNumber}
                  </div>
                </div>

                <div className="relative">
                  {timeSlots.map((slot) => {
                    const sessionsInSlot = getSessionsForSlot(
                      day.date,
                      slot.hour
                    );
                    const isPastSlot = isTimeSlotInPast(day.date, slot.hour);

                    return (
                      <div
                        key={slot.hour}
                        className={`h-15 border-b relative transition-colors ${
                          isPastSlot
                            ? themeClasses.calendar.pastSlot
                            : `${themeClasses.calendar.slot} cursor-pointer`
                        }`}
                        style={{ height: "60px" }}
                        onClick={() =>
                          !isPastSlot &&
                          handleSlotClick(day.date, slot.hour, sessionsInSlot)
                        }
                      >
                        <div className="absolute inset-0" />
                        {isPastSlot && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div
                              className={`text-xs ${themeClasses.text.muted} font-medium opacity-50`}
                            >
                              Past
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* **FIX**: Session positioning with correct IST time parsing */}
                  {sessions
                    .filter((session) => {
                      if (!session.startTime) return false;
                      const sessionTime = parseISTTimeToLocal(
                        session.startTime
                      );
                      return isSameDay(sessionTime.date, day.date);
                    })
                    .map((session) => {
                      const style = getSessionStyle(session);
                      const colorClass = getSessionColor(session);
                      const sessionTime = parseISTTimeToLocal(
                        session.startTime
                      );
                      const isPastSession = isTimeSlotInPast(
                        sessionTime.date,
                        sessionTime.hours
                      );

                      return (
                        <div
                          key={session.id}
                          className={`absolute left-2 right-2 rounded-lg border-l-4 p-3 text-xs transition-all cursor-pointer ${colorClass} ${
                            isPastSession ? "opacity-60" : "hover:scale-[1.02]"
                          }`}
                          style={style}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSessionClick(session);
                          }}
                        >
                          <div className="font-semibold truncate mb-1">
                            {session.title}
                          </div>
                          <div className="text-xs opacity-90 truncate mb-1">
                            {session.facultyName}
                          </div>

                          {isPastSession && (
                            <div className="absolute top-1 left-1">
                              <div className="w-2 h-2 rounded-full bg-gray-400"></div>
                            </div>
                          )}

                          <div className="absolute top-1 right-1">
                            <div
                              className={`w-2 h-2 rounded-full ${
                                session.inviteStatus === "Accepted"
                                  ? "bg-green-300"
                                  : session.inviteStatus === "Declined" &&
                                    (session.rejectionReason ===
                                      "SuggestedTopic" ||
                                      session.rejectionReason ===
                                        "TimeConflict")
                                  ? "bg-yellow-300"
                                  : session.inviteStatus === "Declined"
                                  ? "bg-red-300"
                                  : "bg-blue-300"
                              }`}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SessionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessions={selectedSessions}
        date={selectedDate}
        timeSlot={selectedTimeSlot}
        rooms={rooms}
        onSessionUpdate={handleSessionUpdate}
        onSessionDelete={handleSessionDelete}
        theme={theme}
      />

      <CreateSessionModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultDate={newSessionDate}
        defaultHour={newSessionHour}
        rooms={rooms}
        events={events}
        facultiesByEvent={facultiesByEvent}
        onCreate={() => {
          fetchSessions(true);
          setShowCreateModal(false);
        }}
        theme={theme}
      />
    </div>
  );
};

export default SessionsCalendarView;
