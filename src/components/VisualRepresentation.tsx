"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Calendar, Clock, MapPin, User, Eye, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface Session {
  id: string;
  title: string;
  facultyId: string;
  facultyName?: string;
  email: string;
  place: string;
  roomId: string;
  roomName?: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "Draft" | "Confirmed";
  inviteStatus: "Pending" | "Accepted" | "Declined";
  formattedStartTime?: string;
  formattedEndTime?: string;
  duration?: string;
}

interface DaySession {
  date: string;
  displayDate: string;
  sessions: Session[];
  dayName: string;
}

interface SessionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  date: string;
}

const SessionDetailsModal: React.FC<SessionDetailsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  date,
}) => {
  if (!isOpen) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Confirmed":
        return "bg-green-100 text-green-800";
      case "Draft":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getInviteStatusColor = (status: string) => {
    switch (status) {
      case "Accepted":
        return "bg-green-100 text-green-800";
      case "Declined":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">
              Sessions for {date}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-1">
            {sessions.length} session{sessions.length !== 1 ? "s" : ""}{" "}
            scheduled
          </p>
        </div>

        <div className="p-6 space-y-4">
          {sessions.map((session) => (
            <div
              key={session.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="text-lg font-semibold text-gray-900">
                  {session.title || "Untitled Session"}
                </h3>
                <div className="flex gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      session.status
                    )}`}
                  >
                    {session.status}
                  </span>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getInviteStatusColor(
                      session.inviteStatus
                    )}`}
                  >
                    {session.inviteStatus}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>{session.facultyName || "Faculty TBD"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {session.place} - {session.roomName || session.roomId}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    {session.startTime &&
                      format(new Date(session.startTime), "HH:mm")}{" "}
                    -{" "}
                    {session.endTime &&
                      format(new Date(session.endTime), "HH:mm")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{session.duration || "Duration TBD"}</span>
                </div>
              </div>

              {session.description && (
                <div className="mt-3 p-3 bg-gray-50 rounded">
                  <p className="text-sm text-gray-700">{session.description}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const VisualRepresentation: React.FC = () => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<DaySession | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/sessions");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && Array.isArray(data.data?.sessions)) {
        setSessions(data.data.sessions);
      } else {
        setError(data.error || "Failed to fetch sessions");
      }
    } catch (err) {
      setError("Error fetching sessions");
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const groupSessionsByDay = (sessions: Session[]): DaySession[] => {
    if (!Array.isArray(sessions) || sessions.length === 0) {
      return [];
    }

    const grouped = sessions.reduce((acc, session) => {
      if (!session || typeof session.startTime !== "string") return acc;

      const startDate = new Date(session.startTime);
      if (isNaN(startDate.getTime())) return acc;

      const dateKey = startDate.toISOString().split("T")[0] ?? ""; // YYYY-MM-DD
      const displayDate = startDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      const dayName = startDate.toLocaleDateString("en-US", {
        weekday: "short",
      });

      if (dateKey && !acc[dateKey]) {
        acc[dateKey] = {
          date: dateKey,
          displayDate,
          dayName,
          sessions: [],
        };
      }
      if (dateKey && acc[dateKey]) {
        acc[dateKey].sessions.push(session);
      }
      return acc;
    }, {} as Record<string, DaySession>);

    return Object.values(grouped).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  };

  const handleDayClick = (day: DaySession) => {
    setSelectedDay(day);
    setIsModalOpen(true);
  };

  const getSessionTypeColor = (session: Session) => {
    if (session.status === "Confirmed" && session.inviteStatus === "Accepted") {
      return "bg-green-500";
    } else if (session.status === "Confirmed") {
      return "bg-blue-500";
    } else if (session.inviteStatus === "Declined") {
      return "bg-red-500";
    } else {
      return "bg-yellow-500";
    }
  };

  const dayWiseSessions = useMemo(
    () => groupSessionsByDay(sessions),
    [sessions]
  );

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
          <button
            onClick={fetchSessions}
            className="mt-2 text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Visual Representation
        </h2>
        <p className="text-gray-600">
          Click on any day to view detailed session information
        </p>
      </div>

      {dayWiseSessions.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No sessions scheduled
          </h3>
          <p className="text-gray-600">
            Sessions will appear here once they are created
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {dayWiseSessions.map((day) => (
            <div
              key={day.date}
              onClick={() => handleDayClick(day)}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer bg-white"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    {day.dayName}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {new Date(day.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <Eye className="w-4 h-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-600">
                    {day.sessions.length}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {day.sessions.slice(0, 3).map((session, index) => (
                  <div
                    key={session.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div
                      className={`w-2 h-2 rounded-full ${getSessionTypeColor(
                        session
                      )}`}
                    ></div>
                    <span className="truncate text-gray-700">
                      {session.title || "Untitled Session"}
                    </span>
                  </div>
                ))}
                {day.sessions.length > 3 && (
                  <div className="text-xs text-gray-500 pl-4">
                    +{day.sessions.length - 3} more
                  </div>
                )}
              </div>

              <div className="mt-3 pt-3 border-t border-gray-100">
                <div className="flex justify-between items-center text-xs text-gray-500">
                  <span>
                    {
                      day.sessions.filter((s) => s && s.status === "Confirmed")
                        .length
                    }{" "}
                    confirmed
                  </span>
                  <span>
                    {
                      day.sessions.filter(
                        (s) => s && s.inviteStatus === "Accepted"
                      ).length
                    }{" "}
                    accepted
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <SessionDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        sessions={selectedDay?.sessions || []}
        date={selectedDay?.displayDate || ""}
      />
    </div>
  );
};

export default VisualRepresentation;
