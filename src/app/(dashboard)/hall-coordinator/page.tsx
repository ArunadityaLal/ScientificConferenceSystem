// src/app/(dashboard)/hall-coordinator/page.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { LoadingSpinner, SkeletonCard } from '@/components/ui/loading';
import { HallCoordinatorLayout } from '@/components/dashboard/layout';
import { useRouter } from 'next/navigation';

import { useTodaysSessions, useOngoingSessions, useUpcomingSessions } from '@/hooks/use-sessions';
import { useSessionAttendance, useMarkAttendance, useRealtimeAttendanceCount } from '@/hooks/use-attendance';
import { useMyHalls, useHallIssues, useCreateIssue } from '@/hooks/use-halls';
import { useAuth, useNotifications } from '@/hooks/use-auth';

import { 
  MapPin, 
  Clock, 
  Users, 
  CheckSquare, 
  AlertCircle,
  Camera,
  QrCode,
  Phone,
  MessageSquare,
  Activity,
  UserCheck,
  Timer,
  Zap,
  Shield,
  Building,
  Wifi,
  Monitor,
  Mic,
  Video,
  Settings,
  Bell,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  RefreshCw,
  Radio,
  Headphones,
  Projector,
  Power,
  Thermometer,
  Volume2,
  Calendar,
  FileText,
  Send,
  Plus,
  Edit,
  Star,
  Target,
  Navigation,
  Coffee,
  Users2,
  HelpCircle,
  Clipboard,
  Flag,
  PlayCircle,
  PauseCircle,
  StopCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { useState } from 'react';

export default function HallCoordinatorDashboardPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [quickIssueText, setQuickIssueText] = useState<string>('');

  // Hall Coordinator specific data fetching
  const { data: myHalls, isLoading: hallsLoading } = useMyHalls(user?.id);
  const { data: todaysSessions, isLoading: todaysLoading } = useTodaysSessions();
  const { data: ongoingSessions, isLoading: ongoingLoading } = useOngoingSessions();
  const { data: upcomingSessions, isLoading: upcomingLoading } = useUpcomingSessions();
  const { data: hallIssues, isLoading: issuesLoading } = useHallIssues();
  const { data: notifications, isLoading: notificationsLoading } = useNotifications();
  
  // Get attendance for selected session
  const { data: sessionAttendance, isLoading: attendanceLoading } = useSessionAttendance(selectedSessionId);
  const { data: attendanceCount } = useRealtimeAttendanceCount(selectedSessionId);

  // Mutations
  const markAttendance = useMarkAttendance();
  const createIssue = useCreateIssue();

  // Navigation functions
  const handleViewHalls = () => router.push('/hall-coordinator/halls');
  const handleViewSessions = () => router.push('/hall-coordinator/sessions');
  const handleViewAttendance = () => router.push('/hall-coordinator/attendance');
  const handleViewIssues = () => router.push('/hall-coordinator/issues');
  const handleViewUpdates = () => router.push('/hall-coordinator/updates');
  const handleContactFaculty = () => router.push('/hall-coordinator/faculty');
  const handleSessionClick = (sessionId: string) => router.push(`/hall-coordinator/sessions/${sessionId}`);
  const handleHallClick = (hallId: string) => router.push(`/hall-coordinator/halls/${hallId}`);

  // Quick attendance marking
  const handleQuickAttendance = (sessionId: string, userId: string) => {
    markAttendance.mutate({
      sessionId,
      userId,
      method: 'MANUAL'
    });
  };

  // Quick issue reporting
  const handleQuickIssue = (hallId: string, priority: 'LOW' | 'MEDIUM' | 'HIGH') => {
    if (quickIssueText.trim()) {
      createIssue.mutate({
        hallId,
        title: `Quick Report: ${quickIssueText.slice(0, 50)}`,
        description: quickIssueText,
        priority,
        type: 'TECHNICAL'
      });
      setQuickIssueText('');
    }
  };

  // Filter sessions for assigned halls
  const myHallIds = myHalls?.data?.map(h => h.id) || [];
  const myTodaysSessions = todaysSessions?.data?.sessions?.filter(s => 
    myHallIds.includes(s.hallId || '')
  ) || [];
  const myOngoingSessions = ongoingSessions?.data?.sessions?.filter((s: { hallId: any; }) => 
    myHallIds.includes(s.hallId || '')
  ) || [];
  const myUpcomingSessions = upcomingSessions?.data?.sessions?.filter(s => 
    myHallIds.includes(s.hallId || '')
  ) || [];

  // Calculate statistics
  const totalHalls = myHalls?.data?.length || 0;
  const totalSessionsToday = myTodaysSessions.length;
  const ongoingSessionsCount = myOngoingSessions.length;
  const upcomingSessionsCount = myUpcomingSessions.length;
  const completedSessions = myTodaysSessions.filter(s => new Date(s.endTime) < new Date()).length;
  const openIssues = hallIssues?.data?.filter(i => i.status === 'OPEN').length || 0;
  const urgentIssues = hallIssues?.data?.filter(i => i.priority === 'HIGH' && i.status === 'OPEN').length || 0;
  const unreadNotifications = notifications?.data?.notifications?.filter((n: { readAt: any; }) => !n.readAt).length || 0;

  if (hallsLoading || todaysLoading) {
    return (
      <HallCoordinatorLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </div>
        </div>
      </HallCoordinatorLayout>
    );
  }

  return (
    <HallCoordinatorLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Hall Operations Center
            </h1>
            <p className="text-muted-foreground">
              Real-time session management and venue coordination
            </p>
            <div className="flex items-center mt-2 space-x-4 text-sm">
              <span className="flex items-center">
                <Building className="h-4 w-4 mr-1 text-blue-600" />
                {totalHalls} Halls Assigned
              </span>
              <span className="flex items-center">
                <Activity className="h-4 w-4 mr-1 text-green-600" />
                {ongoingSessionsCount} Live Sessions
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={handleViewAttendance} variant="outline">
              <QrCode className="h-4 w-4 mr-2" />
              Mark Attendance
            </Button>
            <Button onClick={handleViewIssues} className="bg-gradient-to-r from-red-600 to-orange-600">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Report Issue
            </Button>
          </div>
        </div>

        {/* Urgent Alerts */}
        {urgentIssues > 0 && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {urgentIssues} urgent issue(s) require immediate attention in your halls.
              <Button variant="link" className="p-0 ml-1 h-auto" onClick={handleViewIssues}>
                View issues
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Live Session Alert */}
        {ongoingSessionsCount > 0 && (
          <Alert className="border-green-200 bg-green-50">
            <PlayCircle className="h-4 w-4" />
            <AlertDescription>
              {ongoingSessionsCount} session(s) are currently live in your halls.
              <Button variant="link" className="p-0 ml-1 h-auto" onClick={handleViewSessions}>
                Monitor sessions
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Hall Coordinator Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* My Halls */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewHalls}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">My Halls</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalHalls}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">Active: {totalHalls}</span>
                  <span className="text-blue-600">Capacity: {myHalls?.data?.reduce((acc, h) => acc + h.capacity, 0) || 0}</span>
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Shield className="h-3 w-3 mr-1 text-blue-500" />
                Full operational control
              </div>
            </CardContent>
          </Card>

          {/* Today's Sessions */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewSessions}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Sessions</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSessionsToday}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  <span className="text-green-600">Live: {ongoingSessionsCount}</span>
                  <span className="text-blue-600">Upcoming: {upcomingSessionsCount}</span>
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                {completedSessions} completed successfully
              </div>
            </CardContent>
          </Card>

          {/* Attendance Management */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewAttendance}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Attendance</CardTitle>
              <QrCode className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {sessionAttendance?.data?.attendanceRecords?.length || 0}
              </div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <UserCheck className="h-3 w-3 mr-1" />
                Total check-ins today
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <Target className="h-3 w-3 mr-1 text-green-500" />
                Real-time tracking active
              </div>
            </CardContent>
          </Card>

          {/* Issues Status */}
          <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleViewIssues}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hall Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openIssues}</div>
              <div className="flex items-center text-xs text-muted-foreground mt-1">
                <div className="flex items-center space-x-4">
                  {urgentIssues > 0 ? (
                    <span className="text-red-600">Urgent: {urgentIssues}</span>
                  ) : (
                    <span className="text-green-600">No urgent issues</span>
                  )}
                </div>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <RefreshCw className="h-3 w-3 mr-1 text-blue-500" />
                Live monitoring
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          
          {/* Live Session Management */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Session Control
                </CardTitle>
                <div className="flex space-x-2">
                  <Badge variant="outline" className="text-green-600">
                    {ongoingSessionsCount} Live
                  </Badge>
                  <Button variant="outline" size="sm" onClick={handleViewSessions}>
                    Full Control Panel
                    <Radio className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {todaysLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              ) : myTodaysSessions.length > 0 ? (
                <div className="space-y-4">
                  {myTodaysSessions.slice(0, 4).map((session) => {
                    const isOngoing = myOngoingSessions.some((s: { id: string; }) => s.id === session.id);
                    const isUpcoming = new Date(session.startTime) > new Date();
                    const isCompleted = new Date(session.endTime) < new Date();
                    
                    return (
                      <div 
                        key={session.id} 
                        className={`flex items-center space-x-4 p-4 border rounded-lg cursor-pointer transition-colors ${
                          isOngoing ? 'bg-green-50 border-green-200' : 
                          isUpcoming ? 'bg-blue-50 border-blue-200' :
                          'bg-gray-50 border-gray-200'
                        }`}
                        onClick={() => handleSessionClick(session.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium truncate">{session.title}</h4>
                            <div className="flex items-center space-x-2">
                              <Badge 
                                variant={
                                  isOngoing ? 'default' :
                                  isUpcoming ? 'secondary' :
                                  'outline'
                                }
                              >
                                {isOngoing ? 'LIVE' : isUpcoming ? 'UPCOMING' : 'COMPLETED'}
                              </Badge>
                              {isOngoing && (
                                <div className="flex items-center text-green-600">
                                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
                                  <span className="text-xs">On Air</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center text-sm text-muted-foreground mt-1">
                            <Clock className="h-3 w-3 mr-1" />
                            {format(new Date(session.startTime), 'HH:mm')} - {format(new Date(session.endTime), 'HH:mm')}
                            <Building className="h-3 w-3 ml-3 mr-1" />
                            {session.hall?.name}
                            <Users className="h-3 w-3 ml-3 mr-1" />
                            {session.expectedAttendees || 0} expected
                          </div>
                          <div className="flex items-center text-xs text-muted-foreground mt-1 space-x-4">
                            <span className="flex items-center">
                              <Mic className="h-3 w-3 mr-1" />
                              {session.speakers?.length || 0} speakers
                            </span>
                            <span className="flex items-center">
                              <UserCheck className="h-3 w-3 mr-1" />
                              {attendanceCount?.[session.id] || 0} checked in
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {session.sessionType}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          {isOngoing && (
                            <>
                              <Button size="sm" variant="outline">
                                <QrCode className="h-3 w-3 mr-1" />
                                Check-in
                              </Button>
                              <Button size="sm" variant="outline">
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Report
                              </Button>
                            </>
                          )}
                          {isUpcoming && (
                            <Button size="sm" variant="outline">
                              <Settings className="h-3 w-3 mr-1" />
                              Prep Hall
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
                  <h3 className="font-medium mb-2">No sessions scheduled</h3>
                  <p className="text-sm mb-4">Your halls are free today</p>
                  <Button variant="outline" onClick={handleViewSessions}>
                    <Calendar className="h-4 w-4 mr-2" />
                    View Schedule
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions Panel */}
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
                onClick={handleViewAttendance}
              >
                <QrCode className="h-4 w-4 mr-2" />
                Mark Attendance
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleViewIssues}
              >
                <AlertTriangle className="h-4 w-4 mr-2" />
                Report Issue
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleContactFaculty}
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Faculty
              </Button>
              
              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push('/hall-coordinator/equipment')}
              >
                <Settings className="h-4 w-4 mr-2" />
                Check Equipment
              </Button>

              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={handleViewUpdates}
              >
                <Bell className="h-4 w-4 mr-2" />
                Live Updates
              </Button>

              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push('/hall-coordinator/emergency')}
              >
                <Phone className="h-4 w-4 mr-2" />
                Emergency Contacts
              </Button>

              <Button 
                className="w-full justify-start" 
                variant="outline"
                onClick={() => router.push('/hall-coordinator/checklist')}
              >
                <Clipboard className="h-4 w-4 mr-2" />
                Session Checklist
              </Button>
            </CardContent>
          </Card>

          {/* My Halls Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Hall Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {hallsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                      <div className="h-2 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  ))}
                </div>
              ) : (myHalls?.data?.length ?? 0) > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {myHalls?.data?.map((hall) => {
                    const hallSessions = myTodaysSessions.filter(s => s.hallId === hall.id);
                    const currentSession = myOngoingSessions.find((s: { hallId: string; }) => s.hallId === hall.id);
                    const hallIssuesCount = hallIssues?.data?.filter(i => 
                      i.hallId === hall.id && i.status === 'OPEN'
                    ).length || 0;
                    
                    return (
                      <div 
                        key={hall.id} 
                        className={`p-3 border rounded text-sm cursor-pointer transition-colors ${
                          currentSession ? 'bg-green-50 border-green-200' : 
                          hallIssuesCount > 0 ? 'bg-red-50 border-red-200' :
                          'hover:bg-gray-50'
                        }`}
                        onClick={() => handleHallClick(hall.id)}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <h5 className="font-medium">{hall.name}</h5>
                          <div className="flex items-center space-x-1">
                            {currentSession && (
                              <Badge variant="default" className="text-xs">
                                LIVE
                              </Badge>
                            )}
                            {hallIssuesCount > 0 && (
                              <Badge variant="destructive" className="text-xs">
                                {hallIssuesCount} Issues
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Users className="h-3 w-3 mr-1" />
                          Capacity: {hall.capacity}
                          <Calendar className="h-3 w-3 ml-2 mr-1" />
                          {hallSessions.length} sessions today
                        </div>
                        {currentSession && (
                          <div className="flex items-center text-xs text-green-600 mt-1">
                            <PlayCircle className="h-3 w-3 mr-1" />
                            {currentSession.title} (Live)
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2 text-xs">
                            <Wifi className={`h-3 w-3 ${hall.equipment?.includes('wifi') ? 'text-green-500' : 'text-gray-400'}`} />
                            <Projector className={`h-3 w-3 ${hall.equipment?.includes('projector') ? 'text-green-500' : 'text-gray-400'}`} />
                            <Mic className={`h-3 w-3 ${hall.equipment?.includes('microphone') ? 'text-green-500' : 'text-gray-400'}`} />
                            <Volume2 className={`h-3 w-3 ${hall.equipment?.includes('speakers') ? 'text-green-500' : 'text-gray-400'}`} />
                          </div>
                          <span className="text-xs text-blue-600">Manage →</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <Building className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No halls assigned</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => router.push('/hall-coordinator/assignment')}
                  >
                    Request Assignment
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Issue Reporter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Quick Issue Report
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <textarea
                  placeholder="Describe the issue (equipment, facility, etc.)"
                  value={quickIssueText}
                  onChange={(e) => setQuickIssueText(e.target.value)}
                  className="w-full p-2 text-sm border rounded-md resize-none"
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleQuickIssue(myHalls?.data?.[0]?.id || '', 'LOW')}
                    disabled={!quickIssueText.trim() || createIssue.isPending}
                    className="flex-1"
                  >
                    <Flag className="h-3 w-3 mr-1" />
                    Low
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleQuickIssue(myHalls?.data?.[0]?.id || '', 'MEDIUM')}
                    disabled={!quickIssueText.trim() || createIssue.isPending}
                    className="flex-1"
                  >
                    <AlertCircle className="h-3 w-3 mr-1" />
                    Medium
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleQuickIssue(myHalls?.data?.[0]?.id || '', 'HIGH')}
                    disabled={!quickIssueText.trim() || createIssue.isPending}
                    className="flex-1"
                  >
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Urgent
                  </Button>
                </div>
              </div>

              {/* Recent Issues */}
              <div className="pt-2 border-t">
                <h6 className="text-sm font-medium mb-2">Recent Reports</h6>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {hallIssues?.data?.slice(0, 3).map((issue) => (
                    <div key={issue.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-xs">
                      <div>
                        <span className="font-medium">{issue.title}</span>
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-3 w-3 mr-1" />
                          {format(new Date(issue.createdAt), 'HH:mm')}
                        </div>
                      </div>
                      <Badge 
                        variant={
                          issue.status === 'OPEN' ? 'destructive' :
                          issue.status === 'IN_PROGRESS' ? 'default' :
                          'secondary'
                        }
                        className="text-xs"
                      >
                        {issue.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Live Updates & Communications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Radio className="h-5 w-5" />
                Live Updates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {unreadNotifications > 0 && (
                <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div>
                    <h5 className="font-medium text-blue-800">New Notifications</h5>
                    <p className="text-xs text-blue-600">{unreadNotifications} unread updates</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleViewUpdates}
                  >
                    <Bell className="h-3 w-3 mr-1" />
                    View
                  </Button>
                </div>
              )}

              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push('/hall-coordinator/announcements')}
                >
                  <MessageSquare className="h-3 w-3 mr-2" />
                  Hall Announcements
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push('/hall-coordinator/emergency')}
                >
                  <Phone className="h-3 w-3 mr-2" />
                  Emergency Contacts
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => router.push('/hall-coordinator/broadcast')}
                >
                  <Radio className="h-3 w-3 mr-2" />
                  Broadcast to Team
                </Button>
              </div>

              {/* Live Stats */}
              <div className="pt-2 border-t space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Total Attendees Today:</span>
                  <span className="font-medium">{sessionAttendance?.data?.attendanceRecords?.length || 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Average Session Capacity:</span>
                  <span className="font-medium">
                    {(() => {
                      // Calculate average capacity utilization for today's sessions
                      if (!myTodaysSessions.length) return '0%';
                      // Sum expected attendees for all sessions
                      const totalExpected = myTodaysSessions.reduce((acc, s) => acc + (s.expectedAttendees || 0), 0);
                      // Sum actual check-ins for all sessions
                      const totalCheckedIn = myTodaysSessions.reduce((acc, s) => acc + (attendanceCount?.[s.id] || 0), 0);
                      if (!totalExpected) return '0%';
                      return `${Math.round((totalCheckedIn / totalExpected) * 100)}%`;
                    })()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Equipment Status:</span>
                  <span className="font-medium text-green-600">All Operational</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </HallCoordinatorLayout>
  );
}