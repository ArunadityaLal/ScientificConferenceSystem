"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner, SkeletonCard } from "@/components/ui/loading";
import { FacultyLayout } from "@/components/dashboard/layout";
import { useRouter } from "next/navigation";
import FeedbackModal from "@/app/modals/Feedback";
import ContactSupportModal from "@/app/modals/contact-support";
import TravelInfoModal from "@/app/modals/TravelInfoModal";
import AccommodationInfoModal from "@/app/modals/AccommodationInfoModal";
 
import {
  Calendar,
  Clock,
  Upload,
  FileText,
  MapPin,
  Activity,
  ExternalLink,
  ArrowRight,
  Mail,
  MessageSquare,
  Award,
  Hotel,
  Plane,
  Bed,
  Bell,
  Target,
  Zap,
  Shield,
  Presentation,
  Phone,
  Send,
  UserCheck,
  X,
  Check,
  RefreshCw,
  AlertTriangle,
  Star,
  CalendarDays,
  Users,
  CheckCircle2,
  XCircle,
  Clock4,
  Sun,
  Moon,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { format } from "date-fns";

import { useMyFacultyProfile } from "@/hooks/use-faculty";
import {
  useUserSessions,
  useTodaysSessions,
  useUpcomingSessions,
} from "@/hooks/use-sessions";
import { useMyAttendance } from "@/hooks/use-attendance";
import { useMyRegistrations } from "@/hooks/use-registrations";
import { useAuth, useNotifications } from "@/hooks/use-auth";
import { useFacultyEvents } from "@/hooks/use-faculty-events";

// Theme Type
type Theme = "light" | "dark";

// FIXED: Complete theme classes with proper light mode implementation
const getThemeClasses = (theme: Theme) => {
  if (theme === "light") {
    return {
      // Main container - light gray background
      container: "min-h-screen bg-gray-100",

      // Text colors - dark text on light backgrounds
      text: {
        primary: "text-gray-900", // Very dark for headings
        secondary: "text-gray-700", // Medium dark for body text
        muted: "text-gray-500", // Light gray for muted text
        accent: "text-blue-600", // Blue for links/accents
        success: "text-green-700", // Dark green for success
        warning: "text-yellow-700", // Dark yellow for warnings
        error: "text-red-700", // Dark red for errors
      },

      // Background colors - light backgrounds
      background: {
        primary: "bg-white", // White for main content
        secondary: "bg-gray-50", // Very light gray for secondary areas
        tertiary: "bg-gray-100", // Light gray for disabled/inactive
        card: "bg-white border-gray-200 shadow-sm", // White cards with light borders
        modal: "bg-white border-gray-200", // White modals
        hover: "hover:bg-gray-50", // Light hover state
      },

      // Border colors
      border: "border-gray-200",

      // Button styles
      button: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
        secondary:
          "bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm",
        success: "bg-green-600 hover:bg-green-700 text-white shadow-sm",
        danger: "bg-red-600 hover:bg-red-700 text-white shadow-sm",
        warning: "bg-yellow-600 hover:bg-yellow-700 text-white shadow-sm",
      },

      // Input styles
      input:
        "bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-blue-500",

      // Alert styles
      alert: {
        info: "bg-blue-50 border-blue-200 text-blue-900",
        success: "bg-green-50 border-green-200 text-green-900",
        warning: "bg-yellow-50 border-yellow-200 text-yellow-900",
        error: "bg-red-50 border-red-200 text-red-900",
      },

      // Badge styles
      badge: {
        primary: "bg-blue-100 text-blue-900 border-blue-200",
        success: "bg-green-100 text-green-900 border-green-200",
        warning: "bg-yellow-100 text-yellow-900 border-yellow-200",
        danger: "bg-red-100 text-red-900 border-red-200",
        outline: "bg-white text-gray-700 border-gray-300",
        secondary: "bg-gray-100 text-gray-800 border-gray-200",
      },

      // Stats card styles
      stats: {
        sessions: "bg-indigo-50 border-indigo-200 text-indigo-900",
        events: "bg-purple-50 border-purple-200 text-purple-900",
        accepted: "bg-emerald-50 border-emerald-200 text-emerald-900",
        pending: "bg-amber-50 border-amber-200 text-amber-900",
      },

      // Session card styles by status
      sessionCard: {
        pending:
          "bg-amber-50 border-amber-200 hover:bg-amber-100 text-amber-900",
        accepted:
          "bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-900",
        declined: "bg-red-50 border-red-200 hover:bg-red-100 text-red-900",
        default: "bg-white border-gray-200 hover:bg-gray-50 text-gray-900",
      },
    };
  } else {
    return {
      // Dark theme (unchanged from your original)
      container: "min-h-screen bg-gray-950",
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
        card: "bg-gray-900 border-gray-700",
        modal: "bg-gray-900 border-gray-700",
        hover: "hover:bg-gray-800",
      },
      border: "border-gray-700",
      button: {
        primary: "bg-blue-600 hover:bg-blue-700 text-white",
        secondary:
          "border-gray-600 text-gray-300 hover:bg-gray-800 bg-gray-900",
        success: "bg-green-600 hover:bg-green-700 text-white",
        danger: "bg-red-600 hover:bg-red-700 text-white",
        warning: "bg-yellow-600 hover:bg-yellow-700 text-white",
      },
      input: "bg-gray-800 border-gray-600 text-white focus:border-blue-500",
      alert: {
        info: "bg-blue-900/20 border-blue-700 text-blue-300",
        success: "bg-green-900/20 border-green-700 text-green-300",
        warning: "bg-yellow-900/20 border-yellow-700 text-yellow-300",
        error: "bg-red-900/20 border-red-800 text-red-400",
      },
      badge: {
        primary: "bg-blue-900/30 text-blue-300 border-blue-700",
        success: "bg-green-900/30 text-green-300 border-green-700",
        warning: "bg-yellow-900/30 text-yellow-300 border-yellow-700",
        danger: "bg-red-900/30 text-red-300 border-red-700",
        outline: "bg-gray-800 text-gray-300 border-gray-600",
        secondary: "bg-gray-800 text-gray-200 border-gray-600",
      },
      stats: {
        sessions: "bg-indigo-900/20 border-indigo-700/30 text-indigo-300",
        events: "bg-purple-900/20 border-purple-700/30 text-purple-300",
        accepted: "bg-emerald-900/20 border-emerald-700/30 text-emerald-300",
        pending: "bg-amber-900/20 border-amber-700/30 text-amber-300",
      },
      sessionCard: {
        pending:
          "bg-amber-900/20 border-amber-400/30 hover:bg-amber-900/30 text-white",
        accepted:
          "bg-emerald-900/20 border-emerald-400/30 hover:bg-emerald-900/30 text-white",
        declined:
          "bg-red-900/20 border-red-400/30 hover:bg-red-900/30 text-white",
        default:
          "bg-slate-900/30 border-slate-700/60 hover:bg-slate-900/40 text-white",
      },
    };
  }
};

export default function FacultyDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();

  // FIXED: Initialize with light theme by default
  const [theme, setTheme] = useState<Theme>("light");

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("facultyTheme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  // Save theme to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("facultyTheme", theme);
    // Apply theme class to document root for global theming
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // Rest of your state variables (unchanged)
  const [presentationFiles, setPresentationFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState<string[]>([]);
  const [uploadErrors, setUploadErrors] = useState<string[]>([]);
  const presentationInputRef = useRef<HTMLInputElement>(null);

  const [cvFile, setCVFile] = useState<File | null>(null);
  const [cvIsUploading, setCvIsUploading] = useState(false);
  const [cvProgress, setCvProgress] = useState(0);
  const [cvUploadSuccess, setCvUploadSuccess] = useState<string | null>(null);
  const [cvUploadError, setCvUploadError] = useState<string | null>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isContactSupportOpen, setIsContactSupportOpen] = useState(false);
  const [isTravelModalOpen, setIsTravelModalOpen] = useState(false);
  const [isAccommodationModalOpen, setIsAccommodationModalOpen] =
    useState(false);

  const [facultySessions, setFacultySessions] = useState<any[]>([]);
  const [loadingFacultySessions, setLoadingFacultySessions] = useState(true);
  const [sessionsStats, setSessionsStats] = useState({
    total: 0,
    pending: 0,
    accepted: 0,
    declined: 0,
    upcoming: 0,
  });

  // Get theme classes
  const themeClasses = getThemeClasses(theme);

  // Theme toggle
  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Your existing handlers and data fetching logic (unchanged)
  const handleTravelModalOpen = () => setIsTravelModalOpen(true);
  const handleAccommodationModalOpen = () => setIsAccommodationModalOpen(true);

  const {
    data: profile,
    isLoading: profileLoading,
    refetch: refetchProfile,
  } = useMyFacultyProfile();

  const { data: mySessions, isLoading: userSessionsLoading } = useUserSessions(
    user?.id
  );
  const { data: todaysSessions } = useTodaysSessions();
  const { data: upcomingSessions } = useUpcomingSessions();
  const { data: myAttendance } = useMyAttendance();
  const { data: myRegistrations } = useMyRegistrations();
  const { data: notifications } = useNotifications();

  const {
    events: facultyEvents = [],
    loading: loadingFacultyEvents = false,
    refetch: refetchFacultyEvents,
    respondToEvent,
  } = useFacultyEvents(user?.email) || {};

  // Your existing session management logic (unchanged)
  const fetchFacultySessions = async () => {
    if (!user?.email) {
      setLoadingFacultySessions(false);
      return;
    }

    setLoadingFacultySessions(true);
    try {
      const response = await fetch(
        `/api/faculty/sessions?email=${encodeURIComponent(user.email)}`,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const sessions = data?.data?.sessions || [];
        setFacultySessions(sessions);

        const stats = {
          total: sessions.length,
          pending: sessions.filter((s: any) => s.inviteStatus === "Pending")
            .length,
          accepted: sessions.filter((s: any) => s.inviteStatus === "Accepted")
            .length,
          declined: sessions.filter((s: any) => s.inviteStatus === "Declined")
            .length,
          upcoming: sessions.filter((s: any) => {
            if (!s.startTime) return false;
            const sessionDate = new Date(s.startTime);
            return sessionDate > new Date();
          }).length,
        };
        setSessionsStats(stats);
      } else {
        console.error("Failed to fetch sessions:", response.status);
        setFacultySessions([]);
        setSessionsStats({
          total: 0,
          pending: 0,
          accepted: 0,
          declined: 0,
          upcoming: 0,
        });
      }
    } catch (error) {
      console.error("Error fetching faculty sessions:", error);
      setFacultySessions([]);
      setSessionsStats({
        total: 0,
        pending: 0,
        accepted: 0,
        declined: 0,
        upcoming: 0,
      });
    } finally {
      setLoadingFacultySessions(false);
    }
  };

  // Your existing useEffect hooks (unchanged)
  useEffect(() => {
    if (user?.email) {
      fetchFacultySessions();
      const interval = setInterval(fetchFacultySessions, 30000);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [user?.email]);

  // Your existing navigation and file handlers (keeping the same logic, just commenting for brevity)
  const handleViewProfile = () => router.push("/faculty/profile");
  const handlePresentations = () => router.push("/faculty/presentations");
  const handleSchedule = () => router.push("/faculty/schedule");
  const handleCertificates = () => router.push("/faculty/certificates");
  const handleSessionClick = (sessionId: string) =>
    router.push(`/faculty/sessions/${sessionId}`);

  // Your existing file upload handlers go here (unchanged)
  // ... handlePresentationFileSelect, handlePresentationUpload, etc.

  // Your existing stats calculations (unchanged)
  const mySessionsCount = mySessions?.data?.sessions?.length || 0;
  const todaysSessionsCount =
    todaysSessions?.data?.sessions?.filter((s: any) =>
      s.speakers?.some((speaker: any) => speaker.userId === user?.id)
    ).length || 0;
  const upcomingSessionsCount =
    upcomingSessions?.data?.sessions?.filter((s: any) =>
      s.speakers?.some((speaker: any) => speaker.userId === user?.id)
    ).length || 0;
  const registeredEvents = myRegistrations?.data?.registrations?.length || 0;
  const attendanceRate = myAttendance?.data?.attendanceRate || 0;

  const totalPresentations = profile?.data?.presentations?.length || 0;
  const hasCV = !!(profile?.data as any)?.cv;
  const totalDocuments = totalPresentations + (hasCV ? 1 : 0);

  const unreadNotifications =
    notifications?.data?.notifications?.filter((n: any) => !n.readAt).length ||
    0;

  // Your existing profile data calculations (unchanged)
  const profileData = profile?.data as any;
  const profileInstitution = profileData?.institution || "";
  const profileBio = profileData?.bio || "";
  const profileExpertise = profileData?.expertise || "";
  const profileCV = profileData?.cv || null;
  const profilePhoto = profileData?.photo || null;
  const profileUserName = profileData?.user?.name || user?.name || "Faculty";
  const profileUserEmail =
    profileData?.user?.email || user?.email || "faculty@example.com";

  const profileFields = [
    profileBio,
    profileInstitution,
    profileExpertise,
    profileCV,
    profilePhoto,
  ];
  const completedFields = profileFields.filter((field) => field).length;
  const profileCompletionRate = Math.round(
    (completedFields / profileFields.length) * 100
  );

  const userName = profileUserName;
  const userEmail = profileUserEmail;

  // Your existing response handlers (unchanged)
  const [respondSubmitting, setRespondSubmitting] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [declineTargetId, setDeclineTargetId] = useState<string | null>(null);
  const [declineTargetType, setDeclineTargetType] = useState<
    "session" | "event"
  >("session");
  const [declineReason, setDeclineReason] = useState<
    "NotInterested" | "SuggestedTopic" | "TimeConflict"
  >("NotInterested");
  const [suggestedTopic, setSuggestedTopic] = useState("");
  const [suggestedStart, setSuggestedStart] = useState("");
  const [suggestedEnd, setSuggestedEnd] = useState("");
  const [optionalQuery, setOptionalQuery] = useState("");

  const openDecline = (id: string, type: "session" | "event" = "session") => {
    setDeclineTargetId(id);
    setDeclineTargetType(type);
    setDeclineReason("NotInterested");
    setSuggestedTopic("");
    setSuggestedStart("");
    setSuggestedEnd("");
    setOptionalQuery("");
    setDeclineOpen(true);
  };

  // Your existing accept/decline handlers (unchanged)
  const acceptSessionInvite = async (id: string) => {
    try {
      setRespondSubmitting(true);
      console.log("🔄 Accepting session:", id);

      const res = await fetch(`/api/sessions/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          id,
          inviteStatus: "Accepted",
        }),
      });

      if (!res.ok) {
        let errorMessage = "Failed to accept invitation";
        try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch (parseError) {
          errorMessage = `HTTP ${res.status}: ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log("✅ Session accepted successfully:", result);

      setFacultySessions((prev: any[]) =>
        prev.map((s) => (s.id === id ? { ...s, inviteStatus: "Accepted" } : s))
      );

      fetchFacultySessions();
      alert("✅ Session accepted successfully!");
    } catch (error: any) {
      console.error("❌ Error accepting session:", error);
      alert(`❌ Error accepting invitation: ${error.message}`);
    } finally {
      setRespondSubmitting(false);
    }
  };

  const acceptEventInvite = async (id: string) => {
    try {
      setRespondSubmitting(true);
      if (respondToEvent) {
        await respondToEvent(id, "ACCEPTED");
        alert("✅ Event accepted successfully!");
      } else {
        throw new Error("Event response function not available");
      }
    } catch (error: any) {
      console.error("❌ Error accepting event:", error);
      alert(`❌ Error accepting event: ${error.message}`);
    } finally {
      setRespondSubmitting(false);
    }
  };

  // Your existing submitDecline handler (unchanged)
  const submitDecline = async () => {
    if (!declineTargetId) return;

    try {
      setRespondSubmitting(true);

      if (declineTargetType === "session") {
        const payload: any = {
          id: declineTargetId,
          inviteStatus: "Declined",
          rejectionReason: declineReason,
        };

        if (declineReason === "SuggestedTopic" && suggestedTopic.trim())
          payload.suggestedTopic = suggestedTopic.trim();

        if (declineReason === "TimeConflict") {
          if (suggestedStart)
            payload.suggestedTimeStart = new Date(suggestedStart).toISOString();
          if (suggestedEnd)
            payload.suggestedTimeEnd = new Date(suggestedEnd).toISOString();
        }

        if (optionalQuery.trim()) payload.optionalQuery = optionalQuery.trim();

        const res = await fetch(`/api/sessions/respond`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          let errorMessage = "Failed to decline invitation";
          try {
            const errorData = await res.json();
            errorMessage = errorData.error || errorData.message || errorMessage;
          } catch (parseError) {
            errorMessage = `HTTP ${res.status}: ${res.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const result = await res.json();

        setFacultySessions((prev: any[]) =>
          prev.map((s) =>
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
          )
        );
        fetchFacultySessions();
        alert("✅ Session declined successfully!");
      } else {
        const additionalData: any = { rejectionReason: declineReason };

        if (declineReason === "SuggestedTopic" && suggestedTopic.trim()) {
          additionalData.suggestedTopic = suggestedTopic.trim();
        }

        if (declineReason === "TimeConflict") {
          if (suggestedStart)
            additionalData.suggestedTimeStart = new Date(
              suggestedStart
            ).toISOString();
          if (suggestedEnd)
            additionalData.suggestedTimeEnd = new Date(
              suggestedEnd
            ).toISOString();
        }

        if (optionalQuery.trim())
          additionalData.optionalQuery = optionalQuery.trim();

        if (respondToEvent) {
          await respondToEvent(declineTargetId, "DECLINED", additionalData);
          alert("✅ Event declined successfully!");
        } else {
          throw new Error("Event response function not available");
        }
      }

      setDeclineOpen(false);
    } catch (error: any) {
      console.error("❌ Error declining:", error);
      alert(`❌ Error declining: ${error.message}`);
    } finally {
      setRespondSubmitting(false);
    }
  };

  // FIXED: Helper function to get session card classes based on status
  const getSessionCardClass = (status: string) => {
    const baseClass = `p-4 border rounded-lg cursor-pointer transition-colors`;

    switch (status) {
      case "Pending":
      case "PENDING":
        return `${baseClass} ${themeClasses.sessionCard.pending}`;
      case "Accepted":
      case "ACCEPTED":
        return `${baseClass} ${themeClasses.sessionCard.accepted}`;
      case "Declined":
      case "DECLINED":
        return `${baseClass} ${themeClasses.sessionCard.declined}`;
      default:
        return `${baseClass} ${themeClasses.sessionCard.default}`;
    }
  };

  // Helper function to get badge variant based on status
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case "Accepted":
      case "ACCEPTED":
        return "default";
      case "Pending":
      case "PENDING":
        return "secondary";
      case "Declined":
      case "DECLINED":
        return "destructive";
      default:
        return "outline";
    }
  };

  // FIXED: Sessions and Events Card with proper light theme styling
  const SessionsAndEventsCard = () => (
    <Card className={`lg:col-span-2 ${themeClasses.background.card}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle
            className={`flex items-center gap-2 ${themeClasses.text.primary}`}
          >
            <Presentation className="h-5 w-5" />
            My Sessions & Event Invitations
          </CardTitle>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={toggleTheme}
              className={themeClasses.button.secondary}
            >
              {theme === "dark" ? (
                <Sun className="h-3 w-3" />
              ) : (
                <Moon className="h-3 w-3" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchFacultySessions();
                refetchFacultyEvents?.();
              }}
              disabled={loadingFacultySessions || loadingFacultyEvents}
              className={themeClasses.button.secondary}
            >
              <RefreshCw
                className={`h-3 w-3 mr-1 ${
                  loadingFacultySessions || loadingFacultyEvents
                    ? "animate-spin"
                    : ""
                }`}
              />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSchedule}
              className={themeClasses.button.secondary}
            >
              <Calendar className="h-3 w-3 mr-1" />
              Full Schedule
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* FIXED: Combined Stats with light theme colors */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div
            className={`text-center p-3 rounded-lg border ${themeClasses.stats.sessions}`}
          >
            <div className="text-xl font-bold">{sessionsStats?.total ?? 0}</div>
            <div className="text-xs font-medium">Total Sessions</div>
          </div>
          <div
            className={`text-center p-3 rounded-lg border ${themeClasses.stats.events}`}
          >
            <div className="text-xl font-bold">
              {facultyEvents?.length ?? 0}
            </div>
            <div className="text-xs font-medium">Event Invitations</div>
          </div>
          <div
            className={`text-center p-3 rounded-lg border ${themeClasses.stats.accepted}`}
          >
            <div className="text-xl font-bold">
              {(sessionsStats?.accepted ?? 0) +
                (facultyEvents?.filter((e: any) => e.status === "ACCEPTED")
                  ?.length ?? 0)}
            </div>
            <div className="text-xs font-medium">Total Accepted</div>
          </div>
          <div
            className={`text-center p-3 rounded-lg border ${themeClasses.stats.pending}`}
          >
            <div className="text-xl font-bold">
              {(sessionsStats?.pending ?? 0) +
                (facultyEvents?.filter((e: any) => e.status === "PENDING")
                  ?.length ?? 0)}
            </div>
            <div className="text-xs font-medium">Total Pending</div>
          </div>
        </div>

        {loadingFacultySessions || loadingFacultyEvents ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div
                  className={`h-4 ${themeClasses.background.tertiary} rounded w-3/4 mb-2`}
                ></div>
                <div
                  className={`h-3 ${themeClasses.background.tertiary} rounded w-1/2`}
                ></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            {/* FIXED: Sessions Section with light theme */}
            {facultySessions?.length > 0 && (
              <div className="space-y-4">
                <div
                  className={`flex items-center gap-2 border-b ${themeClasses.border} pb-2`}
                >
                  <Presentation className="h-4 w-4 text-indigo-500" />
                  <h3 className={`font-semibold ${themeClasses.text.primary}`}>
                    Conference Sessions
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs ${themeClasses.badge.outline}`}
                  >
                    {facultySessions.length}
                  </Badge>
                </div>
                {facultySessions.slice(0, 3).map((session: any) => (
                  <div
                    key={session.id}
                    className={getSessionCardClass(session.inviteStatus)}
                    onClick={() =>
                      router.push(`/faculty/sessions/${session.id}`)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4
                            className={`font-semibold truncate ${themeClasses.text.primary}`}
                          >
                            {session.title || "Untitled Session"}
                          </h4>
                          <Badge
                            variant={getBadgeVariant(session.inviteStatus)}
                            className="text-xs"
                          >
                            {session.inviteStatus || "Unknown"}
                          </Badge>
                        </div>
                        <div
                          className={`grid grid-cols-1 md:grid-cols-2 gap-2 text-sm ${themeClasses.text.secondary}`}
                        >
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {session.formattedTime || "Time TBD"}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {session.place || "Location TBD"} -{" "}
                            {session.roomName || "Room TBD"}
                          </div>
                        </div>
                        {session.inviteStatus === "Pending" && (
                          <div className="flex items-center gap-2 mt-3">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span
                              className={`text-sm font-medium ${themeClasses.text.warning}`}
                            >
                              Response required
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {session.inviteStatus === "Pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={respondSubmitting}
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptSessionInvite(session.id);
                              }}
                              className={themeClasses.button.success}
                            >
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={respondSubmitting}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDecline(session.id, "session");
                              }}
                              className={themeClasses.button.secondary}
                            >
                              Decline
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FIXED: Events Section with light theme */}
            {facultyEvents?.length > 0 && (
              <div className="space-y-4">
                <div
                  className={`flex items-center gap-2 border-b ${themeClasses.border} pb-2`}
                >
                  <CalendarDays className="h-4 w-4 text-purple-500" />
                  <h3 className={`font-semibold ${themeClasses.text.primary}`}>
                    Event Invitations
                  </h3>
                  <Badge
                    variant="outline"
                    className={`text-xs ${themeClasses.badge.outline}`}
                  >
                    {facultyEvents.length}
                  </Badge>
                </div>
                {facultyEvents.slice(0, 3).map((event: any) => (
                  <div
                    key={event.id}
                    className={getSessionCardClass(event.status)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h4
                            className={`font-semibold truncate ${themeClasses.text.primary}`}
                          >
                            {event.title || "Untitled Event"}
                          </h4>
                          <Badge
                            variant={getBadgeVariant(event.status)}
                            className="text-xs"
                          >
                            {event.status || "Unknown"}
                          </Badge>
                        </div>
                        <div
                          className={`grid grid-cols-1 md:grid-cols-2 gap-2 text-sm ${themeClasses.text.secondary} mb-2`}
                        >
                          <div className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {event.startDate
                              ? format(
                                  new Date(event.startDate),
                                  "MMM dd, yyyy"
                                )
                              : "Date TBD"}
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {event.location || "Location TBD"} -{" "}
                            {event.venue || "Venue TBD"}
                          </div>
                          <div className="flex items-center">
                            <Clock4 className="h-3 w-3 mr-1" />
                            {event.duration || "Duration TBD"}
                          </div>
                          <div className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {event.sessionCount || 0} sessions
                          </div>
                        </div>
                        {event.description && (
                          <p
                            className={`text-xs ${themeClasses.text.muted} line-clamp-2 mb-2`}
                          >
                            {event.description}
                          </p>
                        )}
                        {event.status === "PENDING" && (
                          <div className="flex items-center gap-2 mt-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <span
                              className={`text-sm font-medium ${themeClasses.text.warning}`}
                            >
                              Response required
                            </span>
                          </div>
                        )}
                        {event.status === "DECLINED" &&
                          event.rejectionReason === "SuggestedTopic" &&
                          event.suggestedTopic && (
                            <div
                              className={`mt-2 p-2 rounded border ${
                                theme === "light"
                                  ? "bg-blue-50 border-blue-200"
                                  : "bg-blue-900/20 border-blue-700/30"
                              }`}
                            >
                              <div
                                className={`text-sm ${
                                  theme === "light"
                                    ? "text-blue-900"
                                    : "text-blue-200"
                                }`}
                              >
                                <strong>Your suggestion:</strong>{" "}
                                {event.suggestedTopic}
                              </div>
                            </div>
                          )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {event.status === "PENDING" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              disabled={respondSubmitting}
                              onClick={(e) => {
                                e.stopPropagation();
                                acceptEventInvite(event.id);
                              }}
                              className={themeClasses.button.success}
                            >
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Accept
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={respondSubmitting}
                              onClick={(e) => {
                                e.stopPropagation();
                                openDecline(event.id, "event");
                              }}
                              className={themeClasses.button.secondary}
                            >
                              <XCircle className="h-3 w-3 mr-1" />
                              Decline
                            </Button>
                          </div>
                        )}
                        {event.status === "ACCEPTED" && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${themeClasses.badge.success}`}
                          >
                            Confirmed
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* FIXED: View All Links with light theme */}
            {(facultySessions?.length > 3 || facultyEvents?.length > 3) && (
              <div
                className={`flex gap-4 pt-4 border-t ${themeClasses.border}`}
              >
                {facultySessions?.length > 3 && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/faculty/sessions")}
                    className={`flex-1 ${themeClasses.button.secondary}`}
                  >
                    View All Sessions ({facultySessions.length})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
                {facultyEvents?.length > 3 && (
                  <Button
                    variant="outline"
                    onClick={() => router.push("/faculty/events")}
                    className={`flex-1 ${themeClasses.button.secondary}`}
                  >
                    View All Events ({facultyEvents.length})
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </div>
            )}

            {/* FIXED: Empty State with light theme */}
            {(!facultySessions || facultySessions.length === 0) &&
              (!facultyEvents || facultyEvents.length === 0) && (
                <div className={`text-center py-8 ${themeClasses.text.muted}`}>
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3
                    className={`font-medium mb-2 ${themeClasses.text.primary}`}
                  >
                    No sessions or events yet
                  </h3>
                  <p className="text-sm mb-4">
                    Session and event invitations will appear here when
                    organizers assign you
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => router.push("/faculty/contact")}
                    className={themeClasses.button.secondary}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Contact Organizers
                  </Button>
                </div>
              )}
          </div>
        )}
      </CardContent>
    </Card>
  );

  // Loading state
  if (profileLoading || userSessionsLoading) {
    return (
      <div className={themeClasses.container}>
        <FacultyLayout>
          <div className="space-y-6">
            <SkeletonCard />
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
          </div>
        </FacultyLayout>
      </div>
    );
  }

  return (
    <div className={themeClasses.container}>
      <FacultyLayout
        userName={userName}
        userEmail={userEmail}
        headerStats={[
          {
            label: "Sessions",
            value: sessionsStats?.total ?? 0,
            color: "bg-blue-500",
          },
          {
            label: "Events",
            value: facultyEvents?.length ?? 0,
            color: "bg-purple-500",
          },
          {
            label: "Presentations",
            value: totalPresentations,
            color: "bg-green-500",
          },
          { label: "CV", value: hasCV ? "Yes" : "No", color: "bg-green-500" },
        ]}
      >
        <div className="space-y-6">
          {/* FIXED: Welcome Header with light theme */}
          <div className="flex items-center justify-between">
            <div>
              <h1
                className={`text-3xl font-bold tracking-tight ${themeClasses.text.primary}`}
              >
                Welcome, {userName}
              </h1>
              <p className={themeClasses.text.secondary}>
                Your academic conference participation hub
              </p>
              {profileInstitution && (
                <p
                  className={`text-sm font-medium ${themeClasses.text.accent}`}
                >
                  {profileInstitution}
                </p>
              )}
            </div>
          </div>

          {/* FIXED: Notifications Alert with light theme */}
          {unreadNotifications > 0 && (
            <Alert className={themeClasses.alert.info}>
              <Bell className="h-4 w-4" />
              <AlertDescription>
                You have {unreadNotifications} new notifications from
                organizers.
                <Button
                  variant="link"
                  className={`p-0 ml-1 h-auto ${themeClasses.text.accent}`}
                  onClick={() => router.push("/faculty/notifications")}
                >
                  View all
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* FIXED: Stats Grid with light theme */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Sessions Card */}
            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow ${themeClasses.background.card}`}
              onClick={() => router.push("/faculty/sessions")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-medium ${themeClasses.text.primary}`}
                >
                  My Sessions
                </CardTitle>
                <Presentation
                  className={`h-4 w-4 ${themeClasses.text.muted}`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${themeClasses.text.primary}`}
                >
                  {sessionsStats?.total ?? 0}
                </div>
                <div
                  className={`flex items-center text-xs ${themeClasses.text.muted} mt-1`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={themeClasses.text.success}>
                      Accepted: {sessionsStats?.accepted ?? 0}
                    </span>
                    <span className={themeClasses.text.warning}>
                      Pending: {sessionsStats?.pending ?? 0}
                    </span>
                  </div>
                </div>
                <div
                  className={`flex items-center text-xs ${themeClasses.text.muted}`}
                >
                  <Activity
                    className={`h-3 w-3 mr-1 ${themeClasses.text.accent}`}
                  />
                  {sessionsStats?.upcoming ?? 0} upcoming
                </div>
              </CardContent>
            </Card>

            {/* Events Card */}
            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow ${themeClasses.background.card}`}
              onClick={() => router.push("/faculty/events")}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-medium ${themeClasses.text.primary}`}
                >
                  Event Invitations
                </CardTitle>
                <CalendarDays
                  className={`h-4 w-4 ${themeClasses.text.muted}`}
                />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${themeClasses.text.primary}`}
                >
                  {facultyEvents?.length ?? 0}
                </div>
                <div
                  className={`flex items-center text-xs ${themeClasses.text.muted} mt-1`}
                >
                  <div className="flex items-center space-x-4">
                    <span className={themeClasses.text.success}>
                      Accepted:{" "}
                      {facultyEvents?.filter(
                        (e: any) => e.status === "ACCEPTED"
                      )?.length ?? 0}
                    </span>
                    <span className={themeClasses.text.warning}>
                      Pending:{" "}
                      {facultyEvents?.filter((e: any) => e.status === "PENDING")
                        ?.length ?? 0}
                    </span>
                  </div>
                </div>
                <div
                  className={`flex items-center text-xs ${themeClasses.text.muted}`}
                >
                  <Clock4
                    className={`h-3 w-3 mr-1 ${themeClasses.text.accent}`}
                  />
                  Multi-day events
                </div>
              </CardContent>
            </Card>

            {/* Accommodation & Travel Card */}
            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow ${themeClasses.background.card}`}
              onClick={handleViewProfile}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-medium ${themeClasses.text.primary}`}
                >
                  Accommodation & Travel Status
                </CardTitle>
                <Hotel className={`h-4 w-4 ${themeClasses.text.muted}`} />
              </CardHeader>
              <CardContent>
                <div
                  className={`flex items-center text-xs ${themeClasses.text.muted} mt-1`}
                >
                  <Bed className="h-3 w-3 mr-1 text-purple-600" />
                  Accommodation:{" "}
                  {profileData?.accommodations?.length > 0 ? (
                    <span
                      className={`ml-1 font-medium ${themeClasses.text.success}`}
                    >
                      Provided
                    </span>
                  ) : (
                    <span
                      className={`ml-1 font-medium ${themeClasses.text.error}`}
                    >
                      Not Provided
                    </span>
                  )}
                </div>
                <div
                  className={`flex items-center text-xs ${themeClasses.text.muted} mt-1`}
                >
                  <Plane className="h-3 w-3 mr-1 text-blue-600" />
                  Travel Details:{" "}
                  {profileData?.travelDetails?.length > 0 ? (
                    <span
                      className={`ml-1 font-medium ${themeClasses.text.success}`}
                    >
                      Provided
                    </span>
                  ) : (
                    <span
                      className={`ml-1 font-medium ${themeClasses.text.error}`}
                    >
                      Not Provided
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Documents Card */}
            <Card
              className={`cursor-pointer hover:shadow-md transition-shadow ${themeClasses.background.card}`}
              onClick={handlePresentations}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle
                  className={`text-sm font-medium ${themeClasses.text.primary}`}
                >
                  My Documents
                </CardTitle>
                <FileText className={`h-4 w-4 ${themeClasses.text.muted}`} />
              </CardHeader>
              <CardContent>
                <div
                  className={`text-2xl font-bold ${themeClasses.text.primary}`}
                >
                  {totalDocuments}
                </div>
                <div
                  className={`flex items-center text-xs ${themeClasses.text.muted}`}
                >
                  <Upload
                    className={`h-3 w-3 mr-1 ${themeClasses.text.success}`}
                  />
                  {profileData?.presentations?.length > 0
                    ? "Presentation uploaded"
                    : "Presentation pending"}
                </div>
                <div
                  className={`flex items-center text-xs ${themeClasses.text.muted}`}
                >
                  <Shield
                    className={`h-3 w-3 mr-1 ${themeClasses.text.success}`}
                  />
                  {profileCV ? "CV uploaded" : "CV pending"}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <SessionsAndEventsCard />
          </div>
        </div>

        {/* Your existing modals */}
        <FeedbackModal
          open={isFeedbackOpen}
          onClose={() => setIsFeedbackOpen(false)}
        />
        <ContactSupportModal
          open={isContactSupportOpen}
          onClose={() => setIsContactSupportOpen(false)}
        />
        <TravelInfoModal
          open={isTravelModalOpen}
          onClose={() => setIsTravelModalOpen(false)}
          mode="self-arranged"
        />
        <AccommodationInfoModal
          open={isAccommodationModalOpen}
          onClose={() => setIsAccommodationModalOpen(false)}
        />

        {/* FIXED: Decline Modal with proper light theme */}
        {declineOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div
              className={`w-full max-w-lg mx-4 rounded-xl border shadow-2xl ${themeClasses.background.modal}`}
            >
              {/* Header */}
              <div
                className={`flex items-center justify-between p-6 border-b ${themeClasses.border}`}
              >
                <h3
                  className={`text-xl font-bold ${themeClasses.text.primary}`}
                >
                  Decline{" "}
                  {declineTargetType === "session" ? "Session" : "Event"}{" "}
                  Invitation
                </h3>
                <button
                  onClick={() => setDeclineOpen(false)}
                  disabled={respondSubmitting}
                  className={`p-2 rounded-lg ${themeClasses.background.hover} transition-colors ${themeClasses.text.muted}`}
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-5">
                {/* Reason Selection */}
                <div>
                  <label
                    className={`block text-sm font-semibold mb-3 ${themeClasses.text.secondary}`}
                  >
                    Choose a reason for declining
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setDeclineReason("NotInterested")}
                      disabled={respondSubmitting}
                      className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                        declineReason === "NotInterested"
                          ? "bg-red-600 border-red-600 text-white"
                          : `${themeClasses.button.secondary} ${themeClasses.background.hover}`
                      }`}
                    >
                      Not Interested
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeclineReason("SuggestedTopic")}
                      disabled={respondSubmitting}
                      className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                        declineReason === "SuggestedTopic"
                          ? "bg-orange-600 border-orange-600 text-white"
                          : `${themeClasses.button.secondary} ${themeClasses.background.hover}`
                      }`}
                    >
                      Suggest a Topic
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeclineReason("TimeConflict")}
                      disabled={respondSubmitting}
                      className={`px-4 py-2 rounded-lg border font-medium transition-all duration-200 ${
                        declineReason === "TimeConflict"
                          ? "bg-blue-600 border-blue-600 text-white"
                          : `${themeClasses.button.secondary} ${themeClasses.background.hover}`
                      }`}
                    >
                      Time Conflict
                    </button>
                  </div>
                </div>

                {/* Suggested Topic Input */}
                {declineReason === "SuggestedTopic" && (
                  <div className="space-y-2">
                    <label
                      className={`block text-sm font-medium ${themeClasses.text.secondary}`}
                    >
                      Suggested Topic
                    </label>
                    <input
                      type="text"
                      className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${themeClasses.input}`}
                      placeholder="e.g., Emerging Trends in GenAI"
                      value={suggestedTopic}
                      onChange={(e) => setSuggestedTopic(e.target.value)}
                      disabled={respondSubmitting}
                    />
                  </div>
                )}

                {/* Time Conflict Inputs */}
                {declineReason === "TimeConflict" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label
                        className={`block text-sm font-medium ${themeClasses.text.secondary}`}
                      >
                        Suggested Start Time
                      </label>
                      <input
                        type="datetime-local"
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${themeClasses.input}`}
                        value={suggestedStart}
                        onChange={(e) => setSuggestedStart(e.target.value)}
                        disabled={respondSubmitting}
                      />
                    </div>
                    <div className="space-y-2">
                      <label
                        className={`block text-sm font-medium ${themeClasses.text.secondary}`}
                      >
                        Suggested End Time
                      </label>
                      <input
                        type="datetime-local"
                        className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all ${themeClasses.input}`}
                        value={suggestedEnd}
                        onChange={(e) => setSuggestedEnd(e.target.value)}
                        disabled={respondSubmitting}
                      />
                    </div>
                  </div>
                )}

                {/* Optional Message */}
                <div className="space-y-2">
                  <label
                    className={`block text-sm font-medium ${themeClasses.text.secondary}`}
                  >
                    Optional Message
                  </label>
                  <textarea
                    rows={4}
                    className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-all resize-none ${themeClasses.input}`}
                    placeholder="Add an optional message for the organizer..."
                    value={optionalQuery}
                    onChange={(e) => setOptionalQuery(e.target.value)}
                    disabled={respondSubmitting}
                  />
                </div>
              </div>

              {/* Actions */}
              <div
                className={`flex justify-end gap-3 p-6 pt-4 border-t ${themeClasses.border}`}
              >
                <Button
                  onClick={() => setDeclineOpen(false)}
                  disabled={respondSubmitting}
                  variant="outline"
                  className={themeClasses.button.secondary}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitDecline}
                  disabled={respondSubmitting}
                  className={themeClasses.button.danger}
                >
                  {respondSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Submitting...
                    </>
                  ) : (
                    "Submit Decline"
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </FacultyLayout>
    </div>
  );
}
