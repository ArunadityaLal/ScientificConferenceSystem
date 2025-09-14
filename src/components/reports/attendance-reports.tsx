// src/components/reports/attendance-reports.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Search, 
  Download, 
  Calendar, 
  MapPin,
  QrCode,
  TrendingUp,
  TrendingDown,
  Filter,
  RefreshCw,
  Mail,
  FileText,
  Eye
} from 'lucide-react';

// Interfaces
interface SessionAttendance {
  id: string;
  sessionName: string;
  hall: string;
  date: string;
  time: string;
  capacity: number;
  registered: number;
  attended: number;
  pending: number;
  lateArrivals: number;
  qrScans: number;
  manualCheckins: number;
  attendanceRate: number;
  faculty: string;
}

interface AttendeeRecord {
  id: string;
  name: string;
  email: string;
  role: 'Faculty' | 'Delegate' | 'Speaker' | 'Volunteer';
  registrationId: string;
  checkInTime?: string;
  checkInMethod: 'QR' | 'Manual' | 'Not Checked In';
  sessionName: string;
  hall: string;
  status: 'Present' | 'Absent' | 'Late';
}

interface AttendanceTrend {
  date: string;
  totalSessions: number;
  avgAttendance: number;
  qrScans: number;
  manualCheckins: number;
  lateArrivals: number;
}

interface HallAnalytics {
  hallName: string;
  capacity: number;
  totalSessions: number;
  avgAttendance: number;
  peakAttendance: number;
  utilizationRate: number;
}

// Mock Data
const mockSessionAttendance: SessionAttendance[] = [
  {
    id: '1',
    sessionName: 'AI in Healthcare - Keynote',
    hall: 'Main Auditorium',
    date: '2025-07-14',
    time: '09:00 AM',
    capacity: 500,
    registered: 485,
    attended: 467,
    pending: 18,
    lateArrivals: 23,
    qrScans: 445,
    manualCheckins: 22,
    attendanceRate: 96.3,
    faculty: 'Dr. Sarah Johnson'
  },
  {
    id: '2',
    sessionName: 'Machine Learning Workshop',
    hall: 'Tech Hall A',
    date: '2025-07-14',
    time: '10:30 AM',
    capacity: 200,
    registered: 189,
    attended: 175,
    pending: 14,
    lateArrivals: 8,
    qrScans: 168,
    manualCheckins: 7,
    attendanceRate: 92.6,
    faculty: 'Prof. Michael Chen'
  },
  {
    id: '3',
    sessionName: 'Future of Telemedicine',
    hall: 'Medical Hall B',
    date: '2025-07-14',
    time: '02:00 PM',
    capacity: 300,
    registered: 267,
    attended: 245,
    pending: 22,
    lateArrivals: 12,
    qrScans: 235,
    manualCheckins: 10,
    attendanceRate: 91.8,
    faculty: 'Dr. Emily Davis'
  },
  {
    id: '4',
    sessionName: 'Digital Health Policy',
    hall: 'Policy Hall',
    date: '2025-07-14',
    time: '03:30 PM',
    capacity: 150,
    registered: 142,
    attended: 128,
    pending: 14,
    lateArrivals: 6,
    qrScans: 122,
    manualCheckins: 6,
    attendanceRate: 90.1,
    faculty: 'Dr. Robert Wilson'
  }
];

const mockAttendanceTrends: AttendanceTrend[] = [
  { date: '2025-07-10', totalSessions: 8, avgAttendance: 89.5, qrScans: 1245, manualCheckins: 67, lateArrivals: 45 },
  { date: '2025-07-11', totalSessions: 12, avgAttendance: 92.3, qrScans: 1689, manualCheckins: 89, lateArrivals: 52 },
  { date: '2025-07-12', totalSessions: 10, avgAttendance: 87.8, qrScans: 1456, manualCheckins: 78, lateArrivals: 38 },
  { date: '2025-07-13', totalSessions: 9, avgAttendance: 94.1, qrScans: 1567, manualCheckins: 45, lateArrivals: 41 },
  { date: '2025-07-14', totalSessions: 11, avgAttendance: 93.2, qrScans: 1678, manualCheckins: 56, lateArrivals: 49 }
];

const mockHallAnalytics: HallAnalytics[] = [
  { hallName: 'Main Auditorium', capacity: 500, totalSessions: 15, avgAttendance: 94.2, peakAttendance: 487, utilizationRate: 97.4 },
  { hallName: 'Tech Hall A', capacity: 200, totalSessions: 23, avgAttendance: 89.6, peakAttendance: 195, utilizationRate: 97.5 },
  { hallName: 'Medical Hall B', capacity: 300, totalSessions: 18, avgAttendance: 91.3, peakAttendance: 289, utilizationRate: 96.3 },
  { hallName: 'Policy Hall', capacity: 150, totalSessions: 12, avgAttendance: 87.5, peakAttendance: 142, utilizationRate: 94.7 }
];

const attendanceColumns = [
  { accessorKey: 'sessionName', header: 'Session Name' },
  { accessorKey: 'hall', header: 'Hall' },
  { accessorKey: 'time', header: 'Time' },
  { accessorKey: 'attended', header: 'Attended' },
  { accessorKey: 'capacity', header: 'Capacity' },
  { accessorKey: 'attendanceRate', header: 'Rate %' },
  { accessorKey: 'faculty', header: 'Faculty' }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

interface AttendanceReportsProps {
  eventId?: string;
}

export default function AttendanceReports({ eventId }: AttendanceReportsProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [hallFilter, setHallFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [selectedSession, setSelectedSession] = useState<SessionAttendance | null>(null);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalRegistered = mockSessionAttendance.reduce((sum, session) => sum + session.registered, 0);
    const totalAttended = mockSessionAttendance.reduce((sum, session) => sum + session.attended, 0);
    const totalPending = mockSessionAttendance.reduce((sum, session) => sum + session.pending, 0);
    const totalLateArrivals = mockSessionAttendance.reduce((sum, session) => sum + session.lateArrivals, 0);
    const totalQrScans = mockSessionAttendance.reduce((sum, session) => sum + session.qrScans, 0);
    const avgAttendanceRate = mockSessionAttendance.reduce((sum, session) => sum + session.attendanceRate, 0) / mockSessionAttendance.length;

    return {
      totalRegistered,
      totalAttended,
      totalPending,
      totalLateArrivals,
      totalQrScans,
      avgAttendanceRate,
      totalSessions: mockSessionAttendance.length
    };
  }, []);

  // Filter sessions based on search and filters
  const filteredSessions = useMemo(() => {
    return mockSessionAttendance.filter(session => {
      const matchesSearch = session.sessionName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          session.faculty.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesHall = hallFilter === 'all' || session.hall === hallFilter;
      const matchesDate = dateFilter === 'all' || session.date === '2025-07-14'; // Today filter
      
      return matchesSearch && matchesHall && matchesDate;
    });
  }, [searchTerm, hallFilter, dateFilter]);

  // Check-in method distribution
  const checkInDistribution = [
    { name: 'QR Code', value: summaryStats.totalQrScans, color: '#3b82f6' },
    { name: 'Manual', value: summaryStats.totalAttended - summaryStats.totalQrScans, color: '#10b981' },
    { name: 'Pending', value: summaryStats.totalPending, color: '#f59e0b' }
  ];

  const handleExportReport = () => {
    console.log('Exporting attendance report...');
  };

  const handleSendAlert = (session: SessionAttendance) => {
    console.log(`Sending alert for session: ${session.sessionName}`);
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Reports</h1>
          <p className="text-gray-600 mt-1">Detailed attendance tracking and analytics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExportReport}>
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button>
            <Mail className="w-4 h-4 mr-2" />
            Email Summary
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Attended</p>
                <p className="text-2xl font-bold">{summaryStats.totalAttended.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-blue-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-700 text-blue-100">
                {summaryStats.avgAttendanceRate.toFixed(1)}% Average
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">QR Check-ins</p>
                <p className="text-2xl font-bold">{summaryStats.totalQrScans.toLocaleString()}</p>
              </div>
              <QrCode className="w-8 h-8 text-green-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-green-700 text-green-100">
                {((summaryStats.totalQrScans / summaryStats.totalAttended) * 100).toFixed(1)}% of total
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{summaryStats.totalPending}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-yellow-700 text-yellow-100">
                {summaryStats.totalSessions} Sessions
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Late Arrivals</p>
                <p className="text-2xl font-bold">{summaryStats.totalLateArrivals}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-red-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-red-700 text-red-100">
                {((summaryStats.totalLateArrivals / summaryStats.totalAttended) * 100).toFixed(1)}% of attended
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <Input
                placeholder="Search sessions or faculty..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={hallFilter} onValueChange={setHallFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Hall" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Halls</SelectItem>
                <SelectItem value="Main Auditorium">Main Auditorium</SelectItem>
                <SelectItem value="Tech Hall A">Tech Hall A</SelectItem>
                <SelectItem value="Medical Hall B">Medical Hall B</SelectItem>
                <SelectItem value="Policy Hall">Policy Hall</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by Date" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="yesterday">Yesterday</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" className="w-full">
              <Filter className="w-4 h-4 mr-2" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="sessions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="sessions">Session Details</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="halls">Hall Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Actions</TabsTrigger>
        </TabsList>

        {/* Session Details */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Session Attendance Details</CardTitle>
              <CardDescription>
                Detailed breakdown of attendance for each session
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredSessions.map((session) => (
                  <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-lg">{session.sessionName}</h4>
                          <Badge variant={session.attendanceRate > 90 ? "default" : session.attendanceRate > 80 ? "secondary" : "destructive"}>
                            {session.attendanceRate.toFixed(1)}%
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {session.hall}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {session.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {session.faculty}
                          </div>
                          <div className="flex items-center gap-1">
                            <QrCode className="w-4 h-4" />
                            {session.qrScans} QR scans
                          </div>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Capacity</p>
                            <p className="font-semibold">{session.capacity}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Registered</p>
                            <p className="font-semibold">{session.registered}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Attended</p>
                            <p className="font-semibold text-green-600">{session.attended}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Pending</p>
                            <p className="font-semibold text-yellow-600">{session.pending}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Late Arrivals</p>
                            <p className="font-semibold text-red-600">{session.lateArrivals}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <Progress 
                            value={(session.attended / session.capacity) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button variant="outline" size="sm" onClick={() => setSelectedSession(session)}>
                          <Eye className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        {session.pending > 0 && (
                          <Button variant="outline" size="sm" onClick={() => handleSendAlert(session)}>
                            <Mail className="w-4 h-4 mr-1" />
                            Send Alert
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Trends */}
        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Trends</CardTitle>
                <CardDescription>Daily attendance rates over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockAttendanceTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="avgAttendance" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Avg Attendance %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Check-in Methods</CardTitle>
                <CardDescription>Distribution of check-in methods</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={checkInDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {checkInDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Check-in Activity</CardTitle>
              <CardDescription>QR scans vs Manual check-ins over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockAttendanceTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="qrScans" fill="#3b82f6" name="QR Scans" />
                  <Bar dataKey="manualCheckins" fill="#10b981" name="Manual Check-ins" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hall Analytics */}
        <TabsContent value="halls" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hall Utilization</CardTitle>
              <CardDescription>Performance metrics for each hall</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockHallAnalytics.map((hall, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-lg">{hall.hallName}</h4>
                      <Badge variant="outline">
                        Capacity: {hall.capacity}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                      <div>
                        <p className="text-gray-500">Total Sessions</p>
                        <p className="font-semibold">{hall.totalSessions}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Avg Attendance</p>
                        <p className="font-semibold">{hall.avgAttendance.toFixed(1)}%</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Peak Attendance</p>
                        <p className="font-semibold">{hall.peakAttendance}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Utilization Rate</p>
                        <p className="font-semibold">{hall.utilizationRate.toFixed(1)}%</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Utilization Rate</span>
                        <span>{hall.utilizationRate.toFixed(1)}%</span>
                      </div>
                      <Progress value={hall.utilizationRate} className="h-2" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts & Actions */}
        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Attendance Alerts</CardTitle>
                <CardDescription>Sessions requiring attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockSessionAttendance
                    .filter(session => session.attendanceRate < 85 || session.pending > 10)
                    .map((session) => (
                    <Alert key={session.id} variant={session.attendanceRate < 80 ? "destructive" : "default"}>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <div className="flex justify-between items-center">
                          <div>
                            <p className="font-semibold">{session.sessionName}</p>
                            <p className="text-sm">
                              {session.attendanceRate < 85 ? 
                                `Low attendance: ${session.attendanceRate.toFixed(1)}%` :
                                `${session.pending} pending check-ins`
                              }
                            </p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleSendAlert(session)}>
                            Send Alert
                          </Button>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Common attendance management tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button className="w-full justify-start" variant="outline">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh All Attendance Data
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Mail className="w-4 h-4 mr-2" />
                    Send Reminder to Pending Attendees
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Generate Daily Attendance Report
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Download className="w-4 h-4 mr-2" />
                    Export Attendance Data (Excel)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}