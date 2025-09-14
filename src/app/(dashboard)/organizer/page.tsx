// src/app/(dashboard)/organizer/page.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LoadingSpinner, SkeletonCard } from "@/components/ui/loading";
import { OrganizerLayout } from "@/components/dashboard/layout";
import { useRouter } from "next/navigation";

import { useEvents } from "@/hooks/use-events";
import {
  useSessions,
  useTodaysSessions,
  useUpcomingSessions,
} from "@/hooks/use-sessions";
import {
  useRegistrations,
  usePendingRegistrations,
  useRegistrationStats,
} from "@/hooks/use-registrations";
import { useFaculty, useFacultyStats } from "@/hooks/use-faculty";
import { useAuth, useDashboardStats, useNotifications } from "@/hooks/use-auth";

import {
  Calendar,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  BarChart3,
  UserPlus,
  UserCheck,
  Settings,
  FileText,
  MapPin,
  TrendingUp,
  Activity,
  ExternalLink,
  ArrowRight,
  Plus,
  Mail,
  MessageSquare,
  Award,
  Download,
  QrCode,
  Hotel,
  Plane,
  Bell,
  Eye,
  Target,
  Zap,
  Globe,
  Star,
  Shield,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

export default function OrganizerDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedTimeRange, setSelectedTimeRange] = useState<
    "today" | "week" | "month"
  >("week");

  // Comprehensive data fetching for organizer
  const { data: events, isLoading: eventsLoading } = useEvents({
    limit: 10,
    sortBy: "startDate",
    sortOrder: "asc",
  });

  const { data: todaysSessions, isLoading: todaysLoading } =
    useTodaysSessions();
  const { data: upcomingSessions, isLoading: upcomingLoading } =
    useUpcomingSessions();
  const { data: allRegistrations, isLoading: registrationsLoading } =
    useRegistrations();
  const { data: pendingRegistrations, isLoading: pendingLoading } =
    usePendingRegistrations();
  const { data: faculty, isLoading: facultyLoading } = useFaculty();
  const { data: dashboardStats, isLoading: statsLoading } = useDashboardStats();
  const { data: notifications, isLoading: notificationsLoading } =
    useNotifications();

  // Get comprehensive stats
  const { data: registrationStats } = useRegistrationStats();
  const { data: facultyStats } = useFacultyStats();

  // Navigation functions
  const handleCreateEvent = () => router.push("/organizer/events/create");
  const handleViewAllEvents = () => router.push("/organizer/events");
  const handleManageFaculty = () => router.push("/organizer/faculty");
  const handleViewSessions = () => router.push("/organizer/sessions");
  const handleViewRegistrations = () => router.push("/organizer/sessions");
  const handleViewReports = () => router.push("/organizer/reports");
  const handleCommunication = () => router.push("/organizer/communication");
  const handleCertificates = () => router.push("/organizer/certificates");
  const handleHospitality = () => router.push("/organizer/hospitality");
  const handleAttendance = () => router.push("/organizer/attendance");
  const handleEventClick = (eventId: string) =>
    router.push(`/organizer/events/${eventId}`);

  // Calculate comprehensive statistics
  const totalEvents = events?.data?.events?.length || 0;
  const activeEvents =
    events?.data?.events?.filter((e) => e.status === "ONGOING").length || 0;
  const upcomingEvents =
    events?.data?.events?.filter(
      (e) => e.status === "PUBLISHED" && new Date(e.startDate) > new Date()
    ).length || 0;
  const completedEvents =
    events?.data?.events?.filter((e) => e.status === "COMPLETED").length || 0;

  const totalSessions = todaysSessions?.data?.sessions?.length || 0;
  const upcomingSessionsCount = upcomingSessions?.data?.sessions?.length || 0;

  const totalRegistrations = allRegistrations?.data?.registrations?.length || 0;
  const pendingCount = pendingRegistrations?.data?.registrations?.length || 0;
  const approvedRegistrations =
    allRegistrations?.data?.registrations?.filter(
      (r) => r.status === "APPROVED"
    ).length || 0;

  const totalFaculty = faculty?.data?.faculty?.length || 0;

  // const activeFaculty = faculty?.data?.faculty?.filter(f => f.status === 'ACTIVE').length || 0;
  const pendingFacultyInvitations = facultyStats?.data?.pendingInvitations || 0;

  const unreadNotifications =
    notifications?.data?.notifications?.filter(
      (n: { readAt?: Date | null }) => !n.readAt
    ).length || 0;

  if (eventsLoading || statsLoading) {
    return (
      <OrganizerLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </OrganizerLayout>
    );
  }

  return (
    <OrganizerLayout
    // userName={userName}
    // userEmail={userEmail}
    >
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Conference Organization Hub
            </h1>
            <p className="text-muted-foreground">
              Complete oversight and management of all conference operations
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {/* <Button
              onClick={handleCreateEvent}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Event
            </Button> */}
            {/* <Button variant="outline" onClick={handleCommunication}>
              <MessageSquare className="h-4 w-4 mr-2" />
              Communications
            </Button> */}
            {/* <Button
              variant="outline"
              onClick={() => router.push("/organizer/settings")}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button> */}
          </div>
        </div>

        {/* Notifications Alert */}
        {unreadNotifications > 0 && (
          <Alert className="border-blue-200 bg-blue-50">
            <Bell className="h-4 w-4" />
            <AlertDescription>
              You have {unreadNotifications} unread notifications.
              <Button
                variant="link"
                className="p-0 ml-1 h-auto"
                onClick={() => router.push("/organizer/notifications")}
              >
                View all
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Comprehensive Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Events Overview */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleViewAllEvents}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Events
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalEvents}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">Active: {activeEvents}</span>
                  <span className="text-blue-600">
                    Upcoming: {upcomingEvents}
                  </span>
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                {completedEvents} completed
              </div>
            </CardContent>
          </Card>

          {/* Faculty Management */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleManageFaculty}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Faculty Network
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalFaculty}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  {pendingFacultyInvitations > 0 && (
                    <span className="text-orange-600">
                      Pending: {pendingFacultyInvitations}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Star className="h-3 w-3 mr-1 text-yellow-500" />
                Faculty engagement:{" "}
                {facultyStats?.data?.activationRate?.toFixed(1) || 0}%
              </div>
            </CardContent>
          </Card>

          {/* Registration Analytics */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleViewRegistrations}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Registrations
              </CardTitle>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRegistrations}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">
                    Approved: {approvedRegistrations}
                  </span>
                  {pendingCount > 0 && (
                    <span className="text-orange-600">
                      Pending: {pendingCount}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                Registration rate:{" "}
                {registrationStats?.data?.registrationRate?.toFixed(1) || 0}%
              </div>
            </CardContent>
          </Card>

          {/* Sessions Overview */}
          <Card
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={handleViewSessions}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Sessions Today
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {todaysLoading ? <LoadingSpinner size="sm" /> : totalSessions}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <Activity className="h-3 w-3 mr-1" />
                {upcomingSessionsCount} upcoming sessions
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Globe className="h-3 w-3 mr-1 text-blue-500" />
                Multi-track schedule active
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* Recent Events & Quick Actions */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Event Portfolio
                </CardTitle>
                <div className="flex space-x-2">
                  {/* <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCreateEvent}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    New Event
                  </Button> */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleViewAllEvents}
                  >
                    View All
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
              ) : Array.isArray(events?.data?.events) &&
                events?.data?.events.length > 0 ? (
                <div className="space-y-4">
                  {events?.data?.events?.slice(0, 4).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-center space-x-4 p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      onClick={() => handleEventClick(event.id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium truncate">{event.name}</h4>
                          <Badge
                            variant={
                              event.status === "PUBLISHED"
                                ? "default"
                                : event.status === "ONGOING"
                                ? "secondary"
                                : event.status === "COMPLETED"
                                ? "secondary"
                                : "outline"
                            }
                            className="ml-2"
                          >
                            {event.status}
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
                            {event._count?.registrations || 0} registered
                          </span>
                          <span className="flex items-center">
                            <Star className="h-3 w-3 mr-1" />
                            {event._count?.userEvents || 0} team members
                          </span>
                        </div>
                      </div>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No events created yet</h3>
                  <p className="text-sm mb-4"></p>
                  {/* <Button onClick={handleCreateEvent}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Event
                  </Button> */}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleCreateEvent}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Event
              </Button> */}

              {/* <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleManageFaculty}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Faculty
              </Button> */}

              {/* <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleCommunication}
              >
                <Mail className="h-4 w-4 mr-2" />
                Send Communications
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleCertificates}
              >
                <Award className="h-4 w-4 mr-2" />
                Generate Certificates
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleAttendance}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Attendance Management
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleHospitality}
              >
                <Hotel className="h-4 w-4 mr-2" />
                Hospitality Services
              </Button>

              <Button
                className="w-full justify-start"
                variant="outline"
                onClick={handleViewReports}
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Analytics & Reports
              </Button>
            </CardContent>
          </Card> */}

          {/* Today's Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Today's Agenda
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
              ) : (todaysSessions?.data?.sessions?.length ?? 0) > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {(todaysSessions?.data?.sessions ?? [])
                    .slice(0, 6)
                    .map((session) => (
                      <div
                        key={session.id}
                        className="p-3 border rounded text-sm cursor-pointer hover:bg-gray-50"
                        onClick={() =>
                          router.push(`/organizer/sessions/${session.id}`)
                        }
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
                          {session.hall && (
                            <>
                              <MapPin className="h-3 w-3 ml-2 mr-1" />
                              {session.hall.name}
                            </>
                          )}
                        </div>
                        {Array.isArray(session.speakers) &&
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
                      </div>
                    ))}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full mt-2"
                    onClick={handleViewSessions}
                  >
                    View Full Schedule
                  </Button>
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No sessions scheduled for today</p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={handleViewSessions}
                  >
                    Manage Sessions
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pending Tasks & Notifications */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Action Required
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingCount > 0 && (
                <div className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-orange-800">
                      Registration Approvals
                    </h5>
                    <p className="text-xs text-orange-600">
                      {pendingCount} awaiting review
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewRegistrations}
                  >
                    Review
                  </Button>
                </div>
              )}

              {pendingFacultyInvitations > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-blue-800">
                      Faculty Invitations
                    </h5>
                    <p className="text-xs text-blue-600">
                      {pendingFacultyInvitations} pending responses
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleManageFaculty}
                  >
                    Follow Up
                  </Button>
                </div>
              )}

              {upcomingEvents > 0 && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-green-800">
                      Upcoming Events
                    </h5>
                    <p className="text-xs text-green-600">
                      {upcomingEvents} events need attention
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleViewAllEvents}
                  >
                    Manage
                  </Button>
                </div>
              )}

              {pendingCount === 0 &&
                pendingFacultyInvitations === 0 &&
                upcomingEvents === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                    <p className="text-sm">All tasks completed!</p>
                    <p className="text-xs">Great job managing everything</p>
                  </div>
                )}
            </CardContent>
          </Card> */}

          {/* Advanced Analytics Preview */}
          {/* <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Event Success Rate</span>
                  <span className="text-sm font-medium">
                    {Math.round((completedEvents / (totalEvents || 1)) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${Math.round(
                        (completedEvents / (totalEvents || 1)) * 100
                      )}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Registration Efficiency</span>
                  <span className="text-sm font-medium">
                    {registrationStats?.data?.registrationRate?.toFixed(1) || 0}
                    %
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{
                      width: `${
                        registrationStats?.data?.registrationRate || 0
                      }%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Faculty Engagement</span>
                  <span className="text-sm font-medium">
                    {facultyStats?.data?.activationRate?.toFixed(1) || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-purple-500 h-2 rounded-full"
                    style={{
                      width: `${facultyStats?.data?.activationRate || 0}%`,
                    }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 text-center">
                <div>
                  <div className="text-lg font-bold text-blue-600">
                    {totalEvents}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Total Events
                  </div>
                </div>
                <div>
                  {/* <div className="text-lg font-bold text-green-600">{activeFaculty}</div> 
                  <div className="text-xs text-muted-foreground">
                    Active Faculty
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-purple-600">
                    {approvedRegistrations}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Participants
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={handleViewReports}
              >
                <BarChart3 className="h-3 w-3 mr-2" />
                View Detailed Analytics
              </Button>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </OrganizerLayout>
  );
}
