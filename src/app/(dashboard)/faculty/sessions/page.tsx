"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Calendar,
  Clock,
  MapPin,
  Activity,
  ArrowLeft,
  AlertTriangle,
  ExternalLink,
  X,
  CheckCircle,
  XCircle,
  Users,
  TrendingUp,
} from "lucide-react";
import { FacultyLayout } from "@/components/dashboard/layout";
import { useAuth } from "@/hooks/use-auth";

export default function FacultyAllSessionsPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // FIXED: Initialize with default values to prevent undefined errors
  const [sessionsStats, setSessionsStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
  });

  // Respond state
  const [respondSubmitting, setRespondSubmitting] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState<
    "NotInterested" | "SuggestedTopic" | "TimeConflict"
  >("NotInterested");
  const [suggestedTopic, setSuggestedTopic] = useState("");
  const [suggestedStart, setSuggestedStart] = useState("");
  const [suggestedEnd, setSuggestedEnd] = useState("");
  const [optionalQuery, setOptionalQuery] = useState("");

  // FIXED: Function to calculate stats from sessions
  const calculateStats = (sessionsList: any[]) => {
    const stats = {
      total: sessionsList.length,
      pending: sessionsList.filter((s) => s.inviteStatus === "Pending").length,
      accepted: sessionsList.filter((s) => s.inviteStatus === "Accepted")
        .length,
      declined: sessionsList.filter((s) => s.inviteStatus === "Declined")
        .length,
    };
    setSessionsStats(stats);
    return stats;
  };

  const fetchAll = async () => {
    if (!user?.email) {
      setError("User email not found");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("🔄 Fetching sessions for user:", user.email);

      const res = await fetch(
        `/api/faculty/sessions?email=${encodeURIComponent(user.email)}`,
        {
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(
          errorData.error || `HTTP ${res.status}: Failed to load sessions`
        );
      }

      const data = await res.json();
      console.log("✅ Sessions fetched:", data);

      if (data.success && data.data?.sessions) {
        const sessionsList = data.data.sessions;
        setSessions(sessionsList);
        calculateStats(sessionsList); // Calculate and set stats
      } else {
        setSessions([]);
        calculateStats([]); // Set empty stats
      }
    } catch (e: any) {
      console.error("❌ Error fetching sessions:", e);
      setError(e.message || "Failed to load sessions");
      setSessions([]);
      calculateStats([]); // Set empty stats on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      fetchAll();
    }
  }, [user?.email]);

  const openDecline = (id: string) => {
    setDeclineTargetId(id);
    setDeclineReason("NotInterested");
    setSuggestedTopic("");
    setSuggestedStart("");
    setSuggestedEnd("");
    setOptionalQuery("");
    setDeclineOpen(true);
  };

  const acceptInvite = async (id: string) => {
    try {
      setRespondSubmitting(true);
      const res = await fetch(`/api/sessions/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, inviteStatus: "Accepted" }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }

      // Update local state
      const updatedSessions = sessions.map((s) =>
        s.id === id ? { ...s, inviteStatus: "Accepted" } : s
      );
      setSessions(updatedSessions);
      calculateStats(updatedSessions); // Recalculate stats

      console.log("✅ Invitation accepted successfully");
    } catch (e: any) {
      console.error("❌ Error accepting invitation:", e);
      alert(e.message || "Failed to accept invitation");
    } finally {
      setRespondSubmitting(false);
    }
  };

  const submitDecline = async () => {
    if (!declineTargetId) return;

    try {
      setRespondSubmitting(true);
      const payload: any = {
        id: declineTargetId,
        inviteStatus: "Declined",
        rejectionReason: declineReason,
      };

      if (declineReason === "SuggestedTopic" && suggestedTopic.trim()) {
        payload.suggestedTopic = suggestedTopic.trim();
      }

      if (declineReason === "TimeConflict") {
        if (suggestedStart) {
          payload.suggestedTimeStart = new Date(suggestedStart).toISOString();
        }
        if (suggestedEnd) {
          payload.suggestedTimeEnd = new Date(suggestedEnd).toISOString();
        }
      }

      if (optionalQuery.trim()) {
        payload.optionalQuery = optionalQuery.trim();
      }

      const res = await fetch(`/api/sessions/respond`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to decline invitation");
      }

      // Update local state
      const updatedSessions = sessions.map((s) =>
        s.id === declineTargetId
          ? {
              ...s,
              inviteStatus: "Declined",
              rejectionReason: payload.rejectionReason,
              suggestedTopic: payload.suggestedTopic,
              suggestedTimeStart: payload.suggestedTimeStart,
              suggestedTimeEnd: payload.suggestedTimeEnd,
              optionalQuery: payload.optionalQuery,
            }
          : s
      );
      setSessions(updatedSessions);
      calculateStats(updatedSessions); // Recalculate stats

      setDeclineOpen(false);
      console.log("✅ Invitation declined successfully");
    } catch (e: any) {
      console.error("❌ Error declining invitation:", e);
      alert(e.message || "Failed to decline invitation");
    } finally {
      setRespondSubmitting(false);
    }
  };

  if (loading) {
    return (
      <FacultyLayout>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => router.push("/faculty/dashboard")}
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
              <h1 className="text-2xl font-semibold text-white">
                All Sessions
              </h1>
            </div>
          </div>

          <Card className="border-slate-800 bg-slate-900/30">
            <CardContent className="py-10 text-center text-slate-400">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
              Loading your sessions...
            </CardContent>
          </Card>
        </div>
      </FacultyLayout>
    );
  }

  return (
    <FacultyLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push("/faculty/dashboard")}
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
            <h1 className="text-2xl font-semibold text-white">All Sessions</h1>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAll}
            disabled={loading}
            className="border-slate-700 text-slate-300 hover:bg-slate-800"
          >
            Refresh
          </Button>
        </div>

        {/* FIXED: Stats Cards with Safe Access */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-slate-800 bg-slate-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Total Sessions
                  </p>
                  <div className="text-2xl font-bold text-white">
                    {sessionsStats?.total ?? 0} {/* FIXED: Safe access */}
                  </div>
                </div>
                <Users className="h-4 w-4 text-slate-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Pending</p>
                  <div className="text-2xl font-bold text-amber-400">
                    {sessionsStats?.pending ?? 0} {/* FIXED: Safe access */}
                  </div>
                </div>
                <Clock className="h-4 w-4 text-amber-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Accepted</p>
                  <div className="text-2xl font-bold text-emerald-400">
                    {sessionsStats?.accepted ?? 0} {/* FIXED: Safe access */}
                  </div>
                </div>
                <CheckCircle className="h-4 w-4 text-emerald-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-800 bg-slate-900/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Declined</p>
                  <div className="text-2xl font-bold text-red-400">
                    {sessionsStats?.declined ?? 0} {/* FIXED: Safe access */}
                  </div>
                </div>
                <XCircle className="h-4 w-4 text-red-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {error && (
          <Card className="border-red-800 bg-red-900/20">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-red-400">
                <XCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </CardContent>
          </Card>
        )}

        {!error && sessions.length === 0 ? (
          <Card className="border-slate-800 bg-slate-900/30">
            <CardContent className="py-10 text-center text-slate-400">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-slate-600" />
              <h3 className="text-lg font-medium mb-2">No sessions yet</h3>
              <p className="text-sm">
                You don't have any session invitations at the moment.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sessions.map((session: any) => (
              <Card
                key={session.id}
                className={`border transition-colors ${
                  session.inviteStatus === "Pending"
                    ? "border-amber-400/30 bg-amber-900/20 hover:bg-amber-900/30"
                    : session.inviteStatus === "Accepted"
                    ? "border-emerald-400/30 bg-emerald-900/20 hover:bg-emerald-900/30"
                    : session.inviteStatus === "Declined"
                    ? "border-rose-400/30 bg-rose-900/20 hover:bg-rose-900/30"
                    : "border-slate-700/60 bg-slate-900/30 hover:bg-slate-900/40"
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-slate-100 truncate">
                          {session.title}
                        </h4>
                        <Badge
                          variant={
                            session.inviteStatus === "Accepted"
                              ? "default"
                              : session.inviteStatus === "Pending"
                              ? "secondary"
                              : session.inviteStatus === "Declined"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {session.inviteStatus}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-300">
                        <div className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {session.formattedTime ||
                            `${session.formattedStartTime || ""}${
                              session.formattedEndTime
                                ? ` - ${session.formattedEndTime}`
                                : ""
                            }`}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {session.place} - {session.roomName}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {session.daysUntil > 0
                            ? `${session.daysUntil} days to go`
                            : session.daysUntil === 0
                            ? "Today"
                            : "Past session"}
                        </div>
                        <div className="flex items-center">
                          <Activity className="h-3 w-3 mr-1" />
                          {session.sessionStatus || session.status}
                        </div>
                      </div>

                      {session.description && (
                        <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                          {session.description}
                        </p>
                      )}

                      {session.eventName && (
                        <div className="flex items-center mt-2">
                          <span className="text-xs bg-blue-900/30 text-blue-300 px-2 py-1 rounded">
                            Event: {session.eventName}
                          </span>
                        </div>
                      )}

                      {session.inviteStatus === "Pending" && (
                        <div className="flex items-center gap-2 mt-3">
                          <AlertTriangle className="h-4 w-4 text-amber-400" />
                          <span className="text-sm text-amber-300 font-medium">
                            Response required - Please accept or decline
                          </span>
                        </div>
                      )}

                      {/* Show decline reasons if declined */}
                      {session.inviteStatus === "Declined" &&
                        session.rejectionReason && (
                          <div className="mt-3 p-2 bg-red-900/30 border border-red-800 rounded">
                            <p className="text-xs text-red-300">
                              <strong>Reason:</strong> {session.rejectionReason}
                            </p>
                            {session.suggestedTopic && (
                              <p className="text-xs text-red-300 mt-1">
                                <strong>Suggested Topic:</strong>{" "}
                                {session.suggestedTopic}
                              </p>
                            )}
                            {session.optionalQuery && (
                              <p className="text-xs text-red-300 mt-1">
                                <strong>Comment:</strong>{" "}
                                {session.optionalQuery}
                              </p>
                            )}
                          </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      {session.inviteStatus === "Accepted" && (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <Badge
                            variant="outline"
                            className="text-xs border-green-600 text-green-300"
                          >
                            Confirmed
                          </Badge>
                        </div>
                      )}

                      {session.inviteStatus === "Pending" && (
                        <div className="flex gap-2 mt-1">
                          <Button
                            size="sm"
                            disabled={respondSubmitting}
                            onClick={() => acceptInvite(session.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {respondSubmitting ? "..." : "Accept"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={respondSubmitting}
                            onClick={() => openDecline(session.id)}
                            className="border-red-600 text-red-400 hover:bg-red-900/20"
                          >
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Decline Modal */}
      {declineOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-lg rounded-lg border bg-white p-4 shadow-lg">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Decline Invitation</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setDeclineOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <div className="text-xs font-medium text-gray-700">
                  Choose a reason
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button
                    variant={
                      declineReason === "NotInterested" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setDeclineReason("NotInterested")}
                  >
                    Not Interested
                  </Button>
                  <Button
                    variant={
                      declineReason === "SuggestedTopic" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setDeclineReason("SuggestedTopic")}
                  >
                    Suggest a Topic
                  </Button>
                  <Button
                    variant={
                      declineReason === "TimeConflict" ? "default" : "outline"
                    }
                    size="sm"
                    onClick={() => setDeclineReason("TimeConflict")}
                  >
                    Time Conflict
                  </Button>
                </div>
              </div>

              {declineReason === "SuggestedTopic" && (
                <div>
                  <div className="text-xs font-medium text-gray-700">
                    Suggested Topic
                  </div>
                  <input
                    className="mt-1 w-full rounded border p-2"
                    value={suggestedTopic}
                    onChange={(e) => setSuggestedTopic(e.target.value)}
                    placeholder="e.g., Emerging Trends in GenAI"
                  />
                </div>
              )}

              {declineReason === "TimeConflict" && (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div>
                    <div className="text-xs font-medium text-gray-700">
                      Suggested Start
                    </div>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded border p-2"
                      value={suggestedStart}
                      onChange={(e) => setSuggestedStart(e.target.value)}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-medium text-gray-700">
                      Suggested End
                    </div>
                    <input
                      type="datetime-local"
                      className="mt-1 w-full rounded border p-2"
                      value={suggestedEnd}
                      onChange={(e) => setSuggestedEnd(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <div className="text-xs font-medium text-gray-700">
                  Optional message
                </div>
                <textarea
                  className="mt-1 w-full rounded border p-2"
                  value={optionalQuery}
                  onChange={(e) => setOptionalQuery(e.target.value)}
                  placeholder="Add an optional note for the organizer"
                  rows={3}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setDeclineOpen(false)}
                disabled={respondSubmitting}
              >
                Cancel
              </Button>
              <Button
                onClick={submitDecline}
                disabled={respondSubmitting}
                className="bg-red-600 hover:bg-red-700"
              >
                {respondSubmitting ? "Submitting..." : "Submit Decline"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </FacultyLayout>
  );
}
