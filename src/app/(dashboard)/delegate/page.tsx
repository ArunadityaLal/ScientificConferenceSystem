// src/app/(dashboard)/delegate/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner, SkeletonCard } from "@/components/ui/loading";
import { DelegateLayout } from "@/components/dashboard/layout";
import { useRouter } from "next/navigation";

import { useEvents } from "@/hooks/use-events";
import {
  useMyRegistrations,
  useRegistrationEligibility,
  useCreateRegistration,
} from "@/hooks/use-registrations";
import { useMyAttendance } from "@/hooks/use-attendance";
import { useTodaysSessions, useUpcomingSessions } from "@/hooks/use-sessions";
import { useAuth, useNotifications } from "@/hooks/use-auth";

import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  FileText,
  MapPin,
  Activity,
  ExternalLink,
  ArrowRight,
  Plus,
  Mail,
  MessageSquare,
  Award,
  Download,
  QrCode,
  Bell,
  Eye,
  Target,
  Zap,
  Globe,
  Star,
  Shield,
  User,
  Coffee,
  Wifi,
  Building,
  Phone,
  BookOpen,
  Briefcase,
  UserCheck,
  Ticket,
  CreditCard,
  Navigation,
  Info,
  Heart,
  ThumbsUp,
  Share2,
  CalendarPlus,
  CheckSquare,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function DelegateDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState<string>("");

  // Delegate-specific data fetching
  const { data: events, isLoading: eventsLoading } = useEvents({
    status: "PUBLISHED",
    limit: 10,
    sortBy: "startDate",
    sortOrder: "asc",
  });

  const { data: myRegistrations, isLoading: registrationsLoading } =
    useMyRegistrations();
  const { data: myAttendance, isLoading: attendanceLoading } =
    useMyAttendance();
  const { data: todaysSessions, isLoading: todaysLoading } =
    useTodaysSessions();
  const { data: upcomingSessions, isLoading: upcomingLoading } =
    useUpcomingSessions();
  const { data: notifications, isLoading: notificationsLoading } =
    useNotifications();

  // Get eligibility for selected event
  const { data: eligibility } = useRegistrationEligibility(selectedEventId);

  // Mutations
  const createRegistration = useCreateRegistration();

  // Navigation functions
  const handleViewRegistration = () => router.push("/delegate/registration");
  const handleViewSchedule = () => router.push("/delegate/schedule");
  const handleViewSessions = () => router.push("/delegate/sessions");
  const handleViewAttendance = () => router.push("/delegate/attendance");
  const handleViewCertificates = () => router.push("/delegate/certificates");
  const handleViewFeedback = () => router.push("/delegate/feedback");
  const handleEventClick = (eventId: string) =>
    router.push(`/delegate/events/${eventId}`);
  const handleSessionClick = (sessionId: string) =>
    router.push(`/delegate/sessions/${sessionId}`);

  // Handle event registration
  const handleRegisterForEvent = (eventId: string) => {
    if (user?.id) {
      createRegistration.mutate({
        eventId,
        userId: user.id,
        registrationData: {
          participantType: "DELEGATE",
        },
      });
    }
  };

  // Calculate delegate statistics
  const registeredEvents = myRegistrations?.data?.registrations || [];
  const approvedRegistrations = registeredEvents.filter(
    (r) => r.status === "APPROVED"
  );
  const pendingRegistrations = registeredEvents.filter(
    (r) => r.status === "PENDING"
  );
  const rejectedRegistrations = registeredEvents.filter(
    (r) => r.status === "REJECTED"
  );

  const attendanceRate = myAttendance?.data?.attendanceRate || 0;
  const attendedSessions = myAttendance?.data?.attendedSessions || 0;
  const totalSessions = myAttendance?.data?.totalSessions || 0;
  const unreadNotifications =
    notifications?.data?.notifications?.filter(
      (n: { readAt: any }) => !n.readAt
    ).length || 0;

  // Available events to register for
  const availableEvents =
    events?.data?.events?.filter(
      (event) =>
        !registeredEvents.some(
          (reg) => reg.eventId === event.id && reg.status !== "REJECTED"
        )
    ) || [];

  // My upcoming sessions (from registered events)
  const myUpcomingSessions =
    upcomingSessions?.data?.sessions?.filter((session) =>
      approvedRegistrations.some((reg) => reg.eventId === session.eventId)
    ) || [];

  // Today's sessions I can attend
  const myTodaysSessions =
    todaysSessions?.data?.sessions?.filter((session) =>
      approvedRegistrations.some((reg) => reg.eventId === session.eventId)
    ) || [];

  if (eventsLoading || registrationsLoading) {
    return (
      <DelegateLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </DelegateLayout>
    );
  }

  return (
    <DelegateLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Welcome, {user?.name}
            </h1>
            <p className="text-muted-foreground">
              Your conference participation and learning hub
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleViewSchedule} variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              My Schedule
            </Button>
            <Button
              onClick={handleViewRegistration}
              className="bg-gradient-to-r from-green-600 to-blue-600"
            >
              <Ticket className="h-4 w-4 mr-2" />
              My Registrations
            </Button>
          </div>
        </div>

        {/* Registration Status Alerts */}
        {pendingRegistrations.length > 0 && (
          <Alert className="border-orange-200 bg-orange-50">
            <Clock className="h-4 w-4" />
            <AlertDescription>
              You have {pendingRegistrations.length} registration(s) awaiting
              approval.
              <Button
                variant="link"
                className="p-0 ml-1 h-auto"
                onClick={handleViewRegistration}
              >
                Check status
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Notifications Alert */}
        {unreadNotifications > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              You have {unreadNotifications} new updates from conference
              organizers.
              <Button
                variant="link"
                className="p-0 ml-1 h-auto"
                onClick={() => router.push("/delegate/notifications")}
              >
                View updates
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Delegate Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* My Registrations */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleViewRegistration}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Events</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {registeredEvents.length}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">
                    Approved: {approvedRegistrations.length}
                  </span>
                  {pendingRegistrations.length > 0 && (
                    <span className="text-orange-600">
                      Pending: {pendingRegistrations.length}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                Active participant
              </div>
            </CardContent>
          </Card>

          {/* Attendance Rate */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleViewAttendance}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {attendanceRate.toFixed(0)}%
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Target className="h-3 w-3 mr-1" />
                {attendedSessions}/{totalSessions} sessions attended
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                {attendanceRate >= 80
                  ? "Excellent"
                  : attendanceRate >= 60
                  ? "Good"
                  : "Needs improvement"}{" "}
                participation
              </div>
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleViewSessions}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Today's Sessions
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaysLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  myTodaysSessions.length
                )}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Activity className="h-3 w-3 mr-1" />
                Sessions available to attend
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Globe className="h-3 w-3 mr-1 text-blue-500" />
                Conference in progress
              </div>
            </CardContent>
          </Card>

          {/* Certificates */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleViewCertificates}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Certificates
              </CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {
                  approvedRegistrations.filter((r) => r.certificateIssued)
                    .length
                }
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Download className="h-3 w-3 mr-1" />
                Available for download
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Shield className="h-3 w-3 mr-1 text-green-500" />
                Verified participation
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Available Events & Registration */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Available Events
                </CardTitle>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewRegistration}
                  >
                    <Ticket className="h-3 w-3 mr-1" />
                    My Registrations
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push("/delegate/events")}
                  >
                    Browse All
                    <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {eventsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : availableEvents.length > 0 ? (
                <div className="space-y-4">
                  {availableEvents.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{event.name}</h4>
                          <Badge variant="default" className="ml-2">
                            Open Registration
                          </Badge>
                        </div>
                        <div className="flex items-center text-sm text-muted-foreground mt-1">
                          <Calendar className="h-3 w-3 mr-1" />
                          {format(new Date(event.startDate), "MMM dd, yyyy")}
                          <MapPin className="h-3 w-3 ml-3 mr-1" />
                          {event.location}
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-4">
                          <span className="flex items-center">
                            <Users className="h-3 w-3 mr-1" />
                            {event._count?.sessions || 0} sessions
                          </span>
                          <span className="flex items-center">
                            <UserCheck className="h-3 w-3 mr-1" />
                            {event._count?.registrations || 0} participants
                          </span>
                          {event.registrationDeadline && (
                            <span className="flex items-center text-orange-600">
                              <Clock className="h-3 w-3 mr-1" />
                              Deadline:{" "}
                              {format(
                                new Date(event.registrationDeadline),
                                "MMM dd"
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleEventClick(event.id)}
                          variant="outline"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Details
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRegisterForEvent(event.id)}
                          disabled={createRegistration.status === "pending"}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Register
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No new events available</h3>
                  <p className="text-sm mb-4">
                    You're registered for all current events
                  </p>
                  <Button variant="outline" onClick={handleViewRegistration}>
                    <Ticket className="h-4 w-4 mr-2" />
                    View My Registrations
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Delegate Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleViewSchedule}
              >
                <Calendar className="h-4 w-4 mr-2" />
                View Full Schedule
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleViewSessions}
              >
                <BookOpen className="h-4 w-4 mr-2" />
                Browse Sessions
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleViewAttendance}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Check-in to Sessions
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleViewCertificates}
              >
                <Award className="h-4 w-4 mr-2" />
                Download Certificates
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleViewFeedback}
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Submit Feedback
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/delegate/networking")}
              >
                <Users className="h-4 w-4 mr-2" />
                Networking Hub
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={() => router.push("/delegate/support")}
              >
                <Phone className="h-4 w-4 mr-2" />
                Get Support
              </Button>
            </CardContent>
          </Card>

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Today's Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              {todaysLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : myTodaysSessions.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {myTodaysSessions.slice(0, 6).map((session) => (
                    <div
                      key={session.id}
                      className="p-3 border rounded text-sm cursor-pointer hover:bg-gray-50"
                      onClick={() => handleSessionClick(session.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h5 className="font-medium truncate">
                          {session.title}
                        </h5>
                        <Badge variant="outline" className="text-xs">
                          {session.sessionType}
                        </Badge>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 mr-1" />
                        {format(new Date(session.startTime), "HH:mm")} -{" "}
                        {format(new Date(session.endTime), "HH:mm")}
                        <MapPin className="h-3 w-3 ml-2 mr-1" />
                        {session.hall?.name || "Venue TBA"}
                      </div>
                      {session.speakers?.length &&
                        session.speakers.length > 0 && (
                          <div className="flex items-center text-xs text-muted-foreground mt-1">
                            <Users className="h-3 w-3 mr-1" />
                            {session.speakers
                              .slice(0, 2)
                              .map((speaker) => speaker.user.name)
                              .join(", ")}
                            {session.speakers.length > 2 &&
                              ` +${session.speakers.length - 2} more`}
                          </div>
                        )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-blue-600">
                          Click to check-in
                        </span>
                        <QrCode className="h-3 w-3 text-blue-600" />
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleViewSchedule}
                  >
                    View Full Schedule
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Coffee className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sessions today</p>
                  <p className="text-xs">Check back tomorrow!</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* My Registrations Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Registration Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {approvedRegistrations.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-green-800">
                      Approved Events
                    </h5>
                    <p className="text-xs text-green-600">
                      {approvedRegistrations.length} confirmed registrations
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewRegistration}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              )}

              {pendingRegistrations.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-orange-800">
                      Pending Approval
                    </h5>
                    <p className="text-xs text-orange-600">
                      {pendingRegistrations.length} awaiting organizer review
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewRegistration}
                  >
                    <Clock className="h-3 w-3 mr-1" />
                    Track
                  </Button>
                </div>
              )}

              {rejectedRegistrations.length > 0 && (
                <div className="flex items-center justify-between p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-red-800">
                      Action Required
                    </h5>
                    <p className="text-xs text-red-600">
                      {rejectedRegistrations.length} registration(s) need
                      attention
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewRegistration}
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Review
                  </Button>
                </div>
              )}

              {registeredEvents.length === 0 && (
                <div className="text-center py-6 text-muted-foreground">
                  <Ticket className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No registrations yet</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => router.push("/delegate/events")}
                  >
                    <Plus className="h-3 w-3 mr-2" />
                    Register for Events
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conference Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />
                Conference Guide
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-blue-800">
                      Welcome Package
                    </h5>
                    <p className="text-xs text-blue-600">
                      Conference guide & materials
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/delegate/welcome")}
                  >
                    <Download className="h-3 w-3 mr-1" />
                    Access
                  </Button>
                </div>

                <div className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-purple-800">Mobile App</h5>
                    <p className="text-xs text-purple-600">
                      Download for better experience
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/delegate/app")}
                  >
                    <Share2 className="h-3 w-3 mr-1" />
                    Get App
                  </Button>
                </div>
              </div>

              <div className="pt-2 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push("/delegate/venue-map")}
                >
                  <Navigation className="h-3 w-3 mr-2" />
                  Venue Map
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push("/delegate/networking")}
                >
                  <Heart className="h-3 w-3 mr-2" />
                  Connect with Peers
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => router.push("/delegate/feedback")}
                >
                  <ThumbsUp className="h-3 w-3 mr-2" />
                  Rate Sessions
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DelegateLayout>
  );
}
