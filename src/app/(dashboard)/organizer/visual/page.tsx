
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
  parseISO,
  isValid,
} from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

// Session Type
export interface Session {
  id: string;
  title: string;
  facultyId: string;
  facultyName?: string; // FIXED: This will now be properly stored
  email: string;
  place: string;
  roomId: string;
  roomName?: string;
  description?: string;
  startTime: string;
  endTime: string;
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

// Updated Faculty type to match database structure
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

// Event type for dropdown
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

type DraftSession = {
  title?: string;
  place: string;
  roomId?: string;
  startTime?: string;
  endTime?: string;
  status: "Draft" | "Confirmed";
  description?: string;
};

// Theme context type
type Theme = "light" | "dark";

// Date/Time helper functions
const isDateInPast = (date: Date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0);
  return compareDate < today;
};

const isTimeSlotInPast = (date: Date, hour: number) => {
  const now = new Date();
  const slotDate = new Date(date);
  slotDate.setHours(hour, 0, 0, 0);
  return slotDate < now;
};

const getCurrentHour = () => {
  return new Date().getHours();
};

// FIXED: Utility function to parse time consistently (preserves original grid behavior)
const parseTimeString = (timeStr: string) => {
  if (!timeStr) return { hours: 0, minutes: 0, date: new Date() };

  try {
    // Handle datetime-local format first (2023-09-05T16:30)
    if (
      timeStr.includes("T") &&
      !timeStr.includes("Z") &&
      timeStr.length <= 19
    ) {
      const [datePart, timePart] = timeStr.split("T");
      const [hoursStr, minutesStr = "0"] = (timePart || "").split(":");
      const hours = parseInt(hoursStr ?? "0", 10);
      const minutes = parseInt(minutesStr ?? "0", 10);

      // Create date from the date part only
      if (!datePart) {
        return { hours, minutes, date: new Date() };
      }
      const dateParts = datePart.split("-");
      const year = parseInt(dateParts[0] ?? "0", 10);
      const month = parseInt(dateParts[1] ?? "0", 10) - 1; // Month is 0-indexed
      const day = parseInt(dateParts[2] ?? "0", 10);
      const date = new Date(year, month, day);

      return { hours, minutes, date };
    } else {
      // Handle ISO format but convert to local time for display
      const date = new Date(timeStr);
      if (isValid(date)) {
        return {
          hours: date.getHours(),
          minutes: date.getMinutes(),
          date: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        };
      }
    }
  } catch (error) {
    console.warn("Error parsing time:", timeStr, error);
  }

  return { hours: 0, minutes: 0, date: new Date() };
};

// FIXED: Function to format datetime-local input value
const formatDateTimeLocal = (dateStr: string) => {
  if (!dateStr) return "";

  try {
    // If already in datetime-local format, keep as-is
    if (dateStr.includes("T") && !dateStr.includes("Z")) {
      return dateStr.length === 16 ? dateStr : dateStr.slice(0, 16);
    } else {
      // Convert from ISO to datetime-local
      const date = new Date(dateStr);
      if (isValid(date)) {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
    }
  } catch (error) {
    console.warn("Error formatting datetime local:", dateStr, error);
  }

  return "";
};

// FIXED: Theme classes helper with proper light theme support
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

// Session Details Modal Component
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
    setEditing((e) => ({ ...e, [sessionId]: true }));
    setDraft((d) => ({
      ...d,
      [sessionId]: {
        title: session.title ?? "",
        place: session.place ?? "",
        roomId: session.roomId,
        startTime: formatDateTimeLocal(session.startTime),
        endTime: formatDateTimeLocal(session.endTime),
        status: session.status,
        description: session.description ?? "",
      },
    }));
  };

  const onCancel = (sessionId: string) => {
    setEditing((e) => ({ ...e, [sessionId]: false }));
    setDraft((d) => {
      const nd = { ...d };
      delete nd[sessionId];
      return nd;
    });
  };

  const onChangeDraft = (
    sessionId: string,
    field: keyof DraftSession,
    value: string
  ) => {
    setDraft((d) => ({
      ...d,
      [sessionId]: {
        title: d[sessionId]?.title ?? "",
        place: d[sessionId]?.place ?? "",
        roomId: d[sessionId]?.roomId,
        startTime: d[sessionId]?.startTime,
        endTime: d[sessionId]?.endTime,
        status: d[sessionId]?.status ?? "Draft",
        description: d[sessionId]?.description ?? "",
        [field]: value,
      },
    }));
  };

  const onSave = async (sessionId: string) => {
    const body = draft[sessionId];
    if (!body) return;

    // FIXED: Keep datetime-local format without converting to ISO
    if (body.startTime && body.endTime) {
      const startHour = parseInt(
        body.startTime.split("T")[1]?.split(":")[0] || "0"
      );
      const endHour = parseInt(
        body.endTime.split("T")[1]?.split(":")[0] || "0"
      );

      if (endHour <= startHour) {
        alert("End time must be after start time");
        return;
      }
    }

    const payload = {
      ...body,
      startTime: body.startTime,
      endTime: body.endTime,
    };

    setSaving((s) => ({ ...s, [sessionId]: true }));

    try {
      const res = await fetch(`/api/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || "Failed to update session");
        return;
      }

      const result = await res.json();
      onSessionUpdate(sessionId, result.data);
      onCancel(sessionId);
    } catch (e) {
      console.error("Session update error:", e);
      alert("Failed to update session");
    } finally {
      setSaving((s) => ({ ...s, [sessionId]: false }));
    }
  };

  const onDelete = async (sessionId: string) => {
    if (!confirm("Are you sure you want to delete this session?")) return;

    setDeleting((d) => ({ ...d, [sessionId]: true }));

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
      setDeleting((d) => ({ ...d, [sessionId]: false }));
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
                          Start Time
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
                          End Time
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
                          {parseTimeString(session.startTime)
                            .hours.toString()
                            .padStart(2, "0")}
                          :
                          {parseTimeString(session.startTime)
                            .minutes.toString()
                            .padStart(2, "0")}{" "}
                          -{" "}
                          {parseTimeString(session.endTime)
                            .hours.toString()
                            .padStart(2, "0")}
                          :
                          {parseTimeString(session.endTime)
                            .minutes.toString()
                            .padStart(2, "0")}
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

                    {session.inviteStatus === "Declined" &&
                      session.rejectionReason && (
                        <div className="mb-4">
                          {session.rejectionReason === "SuggestedTopic" &&
                            session.suggestedTopic && (
                              <div
                                className={
                                  theme === "light"
                                    ? "bg-orange-50 border border-orange-200 rounded-lg p-3"
                                    : "bg-orange-900/20 border border-orange-700 rounded-lg p-3"
                                }
                              >
                                <div
                                  className={`font-medium mb-1 ${
                                    theme === "light"
                                      ? "text-orange-800"
                                      : "text-orange-300"
                                  }`}
                                >
                                  Topic Suggestion:
                                </div>
                                <div
                                  className={
                                    theme === "light"
                                      ? "text-orange-700"
                                      : "text-orange-200"
                                  }
                                >
                                  {session.suggestedTopic}
                                </div>
                              </div>
                            )}
                          {session.rejectionReason === "TimeConflict" && (
                            <div
                              className={
                                theme === "light"
                                  ? "bg-blue-50 border border-blue-200 rounded-lg p-3"
                                  : "bg-blue-900/20 border border-blue-700 rounded-lg p-3"
                              }
                            >
                              <div
                                className={`font-medium mb-2 ${
                                  theme === "light"
                                    ? "text-blue-800"
                                    : "text-blue-300"
                                }`}
                              >
                                Time Conflict:
                              </div>
                              {session.suggestedTimeStart &&
                                session.suggestedTimeEnd && (
                                  <div
                                    className={`space-y-1 ${
                                      theme === "light"
                                        ? "text-blue-700"
                                        : "text-blue-200"
                                    }`}
                                  >
                                    <div className="text-sm">
                                      <span
                                        className={
                                          theme === "light"
                                            ? "text-green-700"
                                            : "text-green-300"
                                        }
                                      >
                                        Suggested Start:
                                      </span>{" "}
                                      {new Date(
                                        session.suggestedTimeStart
                                      ).toLocaleString()}
                                    </div>
                                    <div className="text-sm">
                                      <span
                                        className={
                                          theme === "light"
                                            ? "text-red-700"
                                            : "text-red-300"
                                        }
                                      >
                                        Suggested End:
                                      </span>{" "}
                                      {new Date(
                                        session.suggestedTimeEnd
                                      ).toLocaleString()}
                                    </div>
                                    {session.optionalQuery && (
                                      <div
                                        className={`text-sm border-t pt-2 mt-2 ${
                                          theme === "light"
                                            ? "border-blue-200"
                                            : "border-blue-800"
                                        }`}
                                      >
                                        <span
                                          className={
                                            theme === "light"
                                              ? "text-blue-800"
                                              : "text-blue-300"
                                          }
                                        >
                                          Comment:
                                        </span>{" "}
                                        {session.optionalQuery}
                                      </div>
                                    )}
                                  </div>
                                )}
                            </div>
                          )}
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

// FIXED: Create Session Modal Component with Faculty Name Storage
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
      const now = new Date();
      const startDate = new Date(defaultDate);

      // If it's today and the default hour is in the past, use current hour + 1
      if (isSameDay(startDate, now) && defaultHour < now.getHours()) {
        startDate.setHours(now.getHours() + 1, 0, 0, 0);
      } else {
        startDate.setHours(defaultHour, 0, 0, 0);
      }

      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1, 0, 0, 0);

      // FIXED: Format as datetime-local string without timezone conversion
      const formatDateTime = (date: Date) => {
        const year = date.getFullYear();
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const hours = date.getHours().toString().padStart(2, "0");
        const minutes = date.getMinutes().toString().padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      };

      setStartDateTime(formatDateTime(startDate));
      setEndDateTime(formatDateTime(endDate));
    }
  }, [isOpen, defaultDate, defaultHour]);

  // Get faculty for selected event
  const availableFaculty = selectedEventId
    ? facultiesByEvent[selectedEventId] || []
    : [];

  // FIXED: Auto-populate email AND get faculty name when faculty is selected
  const handleFacultyChange = (selectedFacultyId: string) => {
    setFacultyId(selectedFacultyId);
    const selectedFaculty = availableFaculty.find(
      (f) => f.id === selectedFacultyId
    );
    if (selectedFaculty) {
      setEmail(selectedFaculty.email);
    } else {
      setEmail("");
    }
  };

  // Handle event selection
  const handleEventChange = (eventId: string) => {
    setSelectedEventId(eventId);
    setFacultyId(""); // Reset faculty selection
    setEmail(""); // Reset email

    // Auto-fill place with event location if available
    const selectedEvent = events.find((e) => e.id === eventId);
    if (selectedEvent?.location) {
      setPlace(selectedEvent.location);
    }
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
    setLoading(true);

    try {
      // FIXED: Validate time using local time parsing
      const startTimeLocal = parseTimeString(startDateTime);
      const endTimeLocal = parseTimeString(endDateTime);

      if (
        endTimeLocal.hours <= startTimeLocal.hours ||
        (endTimeLocal.hours === startTimeLocal.hours &&
          endTimeLocal.minutes <= startTimeLocal.minutes)
      ) {
        alert("End time must be after start time");
        return;
      }

      const durationMinutes =
        endTimeLocal.hours * 60 +
        endTimeLocal.minutes -
        (startTimeLocal.hours * 60 + startTimeLocal.minutes);
      if (durationMinutes < 15) {
        alert("Session must be at least 15 minutes long");
        return;
      }

      // FIXED: Get the faculty name from the selected faculty
      const selectedFaculty = availableFaculty.find((f) => f.id === facultyId);
      const facultyName = selectedFaculty?.name || "";

      const formData = new FormData();
      formData.append("title", title);
      formData.append("facultyId", facultyId);
      formData.append("facultyName", facultyName); // FIXED: Add faculty name to form data
      formData.append("email", email);
      formData.append("place", place);
      formData.append("roomId", roomId);
      formData.append("description", description);

      // FIXED: Send datetime-local strings directly without conversion (IST time)
      formData.append("startTime", startDateTime);
      formData.append("endTime", endDateTime);

      formData.append("status", status);
      formData.append("inviteStatus", "Pending");
      formData.append("eventId", selectedEventId);
      formData.append("travel", travelRequired);
      formData.append("accommodation", accommodationRequired);

      console.log("📋 Creating session with IST times and faculty name:", {
        facultyName: facultyName,
        startTime: startDateTime,
        endTime: endDateTime,
        startHour: startTimeLocal.hours,
        endHour: endTimeLocal.hours,
        travelRequired: travelRequired,
        accommodationRequired: accommodationRequired,
      });

      const response = await fetch("/api/sessions", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.error || "Failed to create session");
        return;
      }

      const result = await response.json();
      console.log("✅ Session created successfully with faculty name:", result);

      resetForm();
      onCreate();
      onClose();

      if (result.emailStatus === "sent") {
        alert(`Session created and invitation email sent to Dr. ${facultyName}!`);
      } else {
        alert(
          `Session created successfully for Dr. ${facultyName}! Email notification may be delayed.`
        );
      }
    } catch (error) {
      console.error("❌ Error creating session:", error);
      alert("Failed to create session. Please try again.");
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
            Fill in the details to create a new session
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
                {events.length === 0 && (
                  <p className={`text-xs ${themeClasses.text.warning} mt-1`}>
                    ⚠️ No events found. Please ensure events are created and
                    faculty lists are uploaded.
                  </p>
                )}
              </div>
            </div>

            <div>
              <label
                className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
              >
                Faculty *
                <span className={`text-xs ${themeClasses.text.accent} ml-2`}>
                  ({availableFaculty.length} faculty available for selected
                  event)
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
              {selectedEventId && availableFaculty.length === 0 && (
                <p className={`text-xs ${themeClasses.text.warning} mt-1`}>
                  ⚠️ No faculty available for this event. Please upload faculty
                  lists.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className={`block text-sm font-medium ${themeClasses.text.secondary} mb-2`}
                >
                  Faculty Email *
                  <span className={`text-xs ${themeClasses.text.muted} ml-2`}>
                    (auto-filled)
                  </span>
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
                  name="travel"
                  value={travelRequired}
                  onChange={(e) => {
                    console.log("Travel selected:", e.target.value);
                    setTravelRequired(e.target.value);
                  }}
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
                  name="accommodation"
                  value={accommodationRequired}
                  onChange={(e) => {
                    console.log("Accommodation selected:", e.target.value);
                    setAccommodationRequired(e.target.value);
                  }}
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
                  Start Time * (IST)
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
                  End Time * (IST)
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

            {/* Selected Event and Faculty Info */}
            {selectedEventId && facultyId && (
              <div
                className={
                  theme === "light"
                    ? "bg-blue-50 border border-blue-200 rounded-lg p-4"
                    : "bg-blue-900/20 border border-blue-700 rounded-lg p-4"
                }
              >
                <h4
                  className={`text-sm font-medium mb-2 ${
                    theme === "light" ? "text-blue-800" : "text-blue-200"
                  }`}
                >
                  Session Summary:
                </h4>
                <div
                  className={`grid grid-cols-1 md:grid-cols-2 gap-2 text-xs ${
                    theme === "light" ? "text-blue-700" : "text-blue-300"
                  }`}
                >
                  <div>
                    <span className="font-medium">Event:</span>{" "}
                    {events.find((e) => e.id === selectedEventId)?.name}
                  </div>
                  <div>
                    <span className="font-medium">Faculty:</span>{" "}
                    {availableFaculty.find((f) => f.id === facultyId)?.name}
                  </div>
                  <div>
                    <span className="font-medium">Time (IST):</span>{" "}
                    {startDateTime &&
                      `${
                        parseTimeString(startDateTime).hours
                      }:${parseTimeString(startDateTime)
                        .minutes.toString()
                        .padStart(2, "0")}`}{" "}
                    -{" "}
                    {endDateTime &&
                      `${parseTimeString(endDateTime).hours}:${parseTimeString(
                        endDateTime
                      )
                        .minutes.toString()
                        .padStart(2, "0")}`}
                  </div>
                  <div>
                    <span className="font-medium">Institution:</span>{" "}
                    {availableFaculty.find((f) => f.id === facultyId)
                      ?.institution || "N/A"}
                  </div>
                </div>
              </div>
            )}

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

// Main Sessions Calendar Component
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
  const [newSessionDate, setNewSessionDate] = useState<Date | undefined>(
    undefined
  );
  const [newSessionHour, setNewSessionHour] = useState<number | undefined>(
    undefined
  );

  const POLL_INTERVAL = 30000; // Reduced polling frequency

  const themeClasses = getThemeClasses(theme);

  // Load events and faculty data
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

          console.log(
            `✅ Added ${localFaculties.length} faculties from localStorage`
          );
        }
      }

      // FIXED: Group faculties by event safely
      const facultyMapping: Record<string, Faculty[]> = {};
      allFaculties.forEach((faculty) => {
        if (!facultyMapping[faculty.eventId]) {
          facultyMapping[faculty.eventId] = [];
        }
        (
          facultyMapping[faculty.eventId] ??
          (facultyMapping[faculty.eventId] = [])
        ).push(faculty);
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
      };
    } catch (error) {
      console.error("❌ Error loading events and faculty:", error);
      return { events: [], facultiesByEvent: {} };
    }
  }, []);

  // Fetch all data
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
            // FIXED: Ensure facultyName is properly preserved from database
            facultyName: session.facultyName || session.faculty?.name || "Faculty TBD"
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

  // Listen for faculty data updates
  useEffect(() => {
    const handleFacultyDataUpdate = () => {
      console.log("🔄 Faculty data updated, refreshing...");
      fetchSessions(false);
    };

    window.addEventListener("storage", handleFacultyDataUpdate);
    window.addEventListener("eventFacultyDataUpdated", handleFacultyDataUpdate);

    return () => {
      window.removeEventListener("storage", handleFacultyDataUpdate);
      window.removeEventListener(
        "eventFacultyDataUpdated",
        handleFacultyDataUpdate
      );
    };
  }, [fetchSessions]);

  useEffect(() => {
    fetchSessions();
    const interval = setInterval(() => fetchSessions(false), POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchSessions]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const handleNewSessionClick = () => {
    const now = new Date();
    setNewSessionDate(now);
    setNewSessionHour(now.getHours() + 1);
    setShowCreateModal(true);
  };

  const handleEmptySlotClick = (date: Date, hour: number) => {
    // Prevent creating sessions in past time slots
    if (isTimeSlotInPast(date, hour)) {
      return; // Do nothing for past time slots
    }

    setNewSessionDate(date);
    setNewSessionHour(hour);
    setShowCreateModal(true);
  };

  const timeSlots = useMemo(() => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({
        hour,
        label: format(new Date().setHours(hour, 0, 0, 0), "HH:mm"),
        displayLabel: format(new Date().setHours(hour, 0, 0, 0), "h a"),
      });
    }
    return slots;
  }, []);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);

      // Only include today and future dates
      if (!isDateInPast(date)) {
        days.push({
          date,
          dayName: format(date, "EEE"),
          dateNumber: format(date, "d"),
          fullDate: format(date, "MMM d, yyyy"),
          isToday: isSameDay(date, new Date()),
        });
      }
    }
    return days;
  }, [currentWeek]);

  // FIXED: Get sessions for slot using local time parsing (IST time preserved)
  const getSessionsForSlot = (date: Date, hour: number) => {
    return sessions.filter((session) => {
      if (!session.startTime || !session.endTime) return false;

      const sessionTime = parseTimeString(session.startTime);
      const sessionEndTime = parseTimeString(session.endTime);

      // Check if same date
      if (!isSameDay(sessionTime.date, date)) return false;

      // Check if hour falls within session time range
      return hour >= sessionTime.hours && hour < sessionEndTime.hours;
    });
  };

  // FIXED: Get session style using local time positioning (preserves IST grid behavior)
  const getSessionStyle = (session: Session) => {
    if (!session.startTime || !session.endTime) return {};

    const startTime = parseTimeString(session.startTime);
    const endTime = parseTimeString(session.endTime);

    // Calculate position based on local time (IST preserved)
    const startPosition = (startTime.hours * 60 + startTime.minutes) / 60;
    const duration =
      (endTime.hours * 60 +
        endTime.minutes -
        (startTime.hours * 60 + startTime.minutes)) /
      60;

    return {
      top: `${startPosition * 60}px`,
      height: `${Math.max(duration * 60 - 4, 30)}px`,
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
      // Only allow creating sessions in future time slots
      if (!isTimeSlotInPast(date, hour)) {
        handleEmptySlotClick(date, hour);
      }
      return;
    }

    setSelectedSessions(sessionsInSlot);
    setSelectedDate(format(date, "EEEE, MMMM d, yyyy"));
    setSelectedTimeSlot(
      `${format(new Date().setHours(hour), "h a")} - ${format(
        new Date().setHours(hour + 1),
        "h a"
      )}`
    );
    setIsModalOpen(true);
  };

  const handleSessionClick = (session: Session) => {
    const sessionTime = parseTimeString(session.startTime);
    setSelectedSessions([session]);
    setSelectedDate(format(sessionTime.date, "EEEE, MMMM d, yyyy"));
    setSelectedTimeSlot(
      `${sessionTime.hours}:${sessionTime.minutes
        .toString()
        .padStart(2, "0")} - ${
        parseTimeString(session.endTime).hours
      }:${parseTimeString(session.endTime).minutes.toString().padStart(2, "0")}`
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

    // Prevent navigating to weeks that are completely in the past
    if (direction === "prev") {
      const weekStart = startOfWeek(newWeek, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(newWeek, { weekStartsOn: 1 });
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // If the entire week is in the past, don't navigate
      if (weekEnd < today) {
        return;
      }
    }

    setCurrentWeek(newWeek);
  };

  // Calculate total faculty across all events
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
                Sessions Calendar (IST)
              </h1>
              <p className={themeClasses.text.secondary}>
                Database-connected schedule • Last updated: {lastUpdateTime}
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
              title={
                events.length === 0
                  ? "No events available - please create events or upload faculty lists"
                  : "Create new session"
              }
            >
              <Plus className="w-4 h-4 mr-2" />
              New Session
            </Button>
          </div>
        </div>

        {/* Status Alert */}
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

        {/* Events Summary */}
        {events.length > 0 && (
          <div className="mb-4 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className={themeClasses.text.secondary}>
                <strong className={themeClasses.text.primary}>
                  {events.length}
                </strong>{" "}
                active events
              </span>
            </div>
            {events.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={`text-xs ${themeClasses.badge.outline}`}
                >
                  <span className={themeClasses.text.primary}>
                    {event.name} ({event.facultyCount} faculty)
                  </span>
                </Badge>
              </div>
            ))}
            {events.length > 3 && (
              <span className={`${themeClasses.text.muted} text-xs`}>
                +{events.length - 3} more events
              </span>
            )}
          </div>
        )}

        {/* Week Navigation */}
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

      {/* Calendar Grid with IST Time Slots */}
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

                        {/* Add visual indicator for past slots */}
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

                  {/* FIXED: Session positioning with correct IST time parsing and faculty names */}
                  {sessions
                    .filter((session) => {
                      if (!session.startTime) return false;
                      const sessionTime = parseTimeString(session.startTime);
                      return isSameDay(sessionTime.date, day.date);
                    })
                    .map((session) => {
                      const style = getSessionStyle(session);
                      const colorClass = getSessionColor(session);
                      const sessionTime = parseTimeString(session.startTime);
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
                            Dr. {session.facultyName || "Faculty TBD"}
                          </div>

                          {/* Add past indicator */}
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