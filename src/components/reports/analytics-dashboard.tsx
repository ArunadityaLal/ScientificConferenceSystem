// src/components/reports/analytics-dashboard.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { Progress } from '@/components/ui';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Users, 
  Calendar, 
  Award, 
  TrendingUp, 
  Clock, 
  MapPin, 
  Mail, 
  CheckCircle2,
  AlertCircle,
  Download,
  RefreshCw,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity
} from 'lucide-react';

// Mock data interfaces
interface EventStats {
  totalAttendees: number;
  totalSessions: number;
  totalFaculty: number;
  averageAttendance: number;
  certificatesIssued: number;
  activeEvents: number;
}

interface AttendanceData {
  date: string;
  sessions: number;
  attendance: number;
  capacity: number;
}

interface SessionPopularity {
  name: string;
  attendance: number;
  capacity: number;
  rating: number;
  hall: string;
}

interface FacultyPerformance {
  name: string;
  sessions: number;
  avgRating: number;
  attendance: number;
  certificates: number;
}

interface TimeAnalytics {
  hour: string;
  checkIns: number;
  sessions: number;
}

// Sample data
const mockEventStats: EventStats = {
  totalAttendees: 1247,
  totalSessions: 48,
  totalFaculty: 89,
  averageAttendance: 87.5,
  certificatesIssued: 1156,
  activeEvents: 3
};

const mockAttendanceData: AttendanceData[] = [
  { date: '2025-07-10', sessions: 8, attendance: 92, capacity: 100 },
  { date: '2025-07-11', sessions: 12, attendance: 87, capacity: 100 },
  { date: '2025-07-12', sessions: 10, attendance: 94, capacity: 100 },
  { date: '2025-07-13', sessions: 9, attendance: 89, capacity: 100 },
  { date: '2025-07-14', sessions: 11, attendance: 91, capacity: 100 }
];

const mockSessionPopularity: SessionPopularity[] = [
  { name: 'AI in Healthcare', attendance: 245, capacity: 250, rating: 4.8, hall: 'Main Hall' },
  { name: 'Future of Medicine', attendance: 238, capacity: 250, rating: 4.7, hall: 'Hall A' },
  { name: 'Digital Transformation', attendance: 225, capacity: 250, rating: 4.6, hall: 'Hall B' },
  { name: 'Telemedicine Trends', attendance: 210, capacity: 250, rating: 4.5, hall: 'Hall C' },
  { name: 'Research Methodologies', attendance: 195, capacity: 200, rating: 4.4, hall: 'Hall D' }
];

const mockFacultyPerformance: FacultyPerformance[] = [
  { name: 'Dr. Sarah Johnson', sessions: 5, avgRating: 4.9, attendance: 96, certificates: 245 },
  { name: 'Prof. Michael Chen', sessions: 4, avgRating: 4.8, attendance: 94, certificates: 188 },
  { name: 'Dr. Emily Davis', sessions: 6, avgRating: 4.7, attendance: 92, certificates: 276 },
  { name: 'Dr. Robert Wilson', sessions: 3, avgRating: 4.6, attendance: 89, certificates: 134 },
  { name: 'Prof. Lisa Anderson', sessions: 4, avgRating: 4.5, attendance: 87, certificates: 174 }
];

const mockTimeAnalytics: TimeAnalytics[] = [
  { hour: '09:00', checkIns: 245, sessions: 3 },
  { hour: '10:00', checkIns: 189, sessions: 5 },
  { hour: '11:00', checkIns: 167, sessions: 4 },
  { hour: '12:00', checkIns: 89, sessions: 1 },
  { hour: '13:00', checkIns: 234, sessions: 4 },
  { hour: '14:00', checkIns: 198, sessions: 6 },
  { hour: '15:00', checkIns: 156, sessions: 4 },
  { hour: '16:00', checkIns: 134, sessions: 3 },
  { hour: '17:00', checkIns: 98, sessions: 2 }
];

const roleDistribution = [
  { name: 'Faculty', value: 89, color: '#3b82f6' },
  { name: 'Delegates', value: 756, color: '#10b981' },
  { name: 'Speakers', value: 234, color: '#f59e0b' },
  { name: 'Coordinators', value: 45, color: '#ef4444' },
  { name: 'Volunteers', value: 123, color: '#8b5cf6' }
];

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

interface AnalyticsDashboardProps {
  eventId?: string;
  dateRange?: { start: Date; end: Date };
}

export default function AnalyticsDashboard({ eventId, dateRange }: AnalyticsDashboardProps) {
  const [selectedEvent, setSelectedEvent] = useState(eventId || 'all');
  const [timeFilter, setTimeFilter] = useState('7d');
  const [refreshing, setRefreshing] = useState(false);

  // Calculate metrics
  const attendanceRate = useMemo(() => {
    const totalAttendance = mockAttendanceData.reduce((sum, day) => sum + day.attendance, 0);
    const totalCapacity = mockAttendanceData.reduce((sum, day) => sum + day.capacity, 0);
    return (totalAttendance / totalCapacity) * 100;
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  };

  const handleExport = () => {
    // Export functionality
    console.log('Exporting analytics data...');
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">Real-time insights and performance metrics</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedEvent} onValueChange={setSelectedEvent}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Event" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="conf2024">Medical Conference 2024</SelectItem>
              <SelectItem value="workshop">AI Workshop</SelectItem>
              <SelectItem value="summit">Health Summit</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={timeFilter} onValueChange={setTimeFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Attendees</p>
                <p className="text-2xl font-bold">{mockEventStats.totalAttendees.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-blue-700 text-blue-100">
                +12% from last week
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Sessions</p>
                <p className="text-2xl font-bold">{mockEventStats.totalSessions}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-green-700 text-green-100">
                8 Active Today
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100 text-sm font-medium">Faculty Count</p>
                <p className="text-2xl font-bold">{mockEventStats.totalFaculty}</p>
              </div>
              <Award className="w-8 h-8 text-yellow-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-yellow-700 text-yellow-100">
                15 International
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg Attendance</p>
                <p className="text-2xl font-bold">{attendanceRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-200" />
            </div>
            <div className="mt-2">
              <Progress value={attendanceRate} className="h-2 bg-purple-700" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-indigo-100 text-sm font-medium">Certificates</p>
                <p className="text-2xl font-bold">{mockEventStats.certificatesIssued.toLocaleString()}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-indigo-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-indigo-700 text-indigo-100">
                92.7% Issued
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">Active Events</p>
                <p className="text-2xl font-bold">{mockEventStats.activeEvents}</p>
              </div>
              <Activity className="w-8 h-8 text-red-200" />
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="bg-red-700 text-red-100">
                2 This Week
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="attendance">Attendance Trends</TabsTrigger>
          <TabsTrigger value="sessions">Session Analytics</TabsTrigger>
          <TabsTrigger value="faculty">Faculty Performance</TabsTrigger>
          <TabsTrigger value="demographics">Demographics</TabsTrigger>
        </TabsList>

        {/* Attendance Trends */}
        <TabsContent value="attendance" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Daily Attendance Trend</CardTitle>
                <CardDescription>Attendance rate over the last 5 days</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="attendance" 
                      stroke="#3b82f6" 
                      fill="#3b82f6" 
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hourly Check-ins</CardTitle>
                <CardDescription>Peak hours for event check-ins</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockTimeAnalytics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="checkIns" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Session Analytics */}
        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Popular Sessions</CardTitle>
              <CardDescription>Most attended sessions and their ratings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockSessionPopularity.map((session, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{session.name}</h4>
                      <p className="text-sm text-gray-600">{session.hall}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">
                          {session.attendance}/{session.capacity} attendees
                        </Badge>
                        <Badge variant="secondary">
                          ⭐ {session.rating}
                        </Badge>
                      </div>
                    </div>
                    <div className="w-32">
                      <Progress 
                        value={(session.attendance / session.capacity) * 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        {Math.round((session.attendance / session.capacity) * 100)}% Full
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Faculty Performance */}
        <TabsContent value="faculty" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top Faculty Performance</CardTitle>
              <CardDescription>Faculty ranked by ratings and attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockFacultyPerformance.map((faculty, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <h4 className="font-semibold">{faculty.name}</h4>
                      <div className="flex items-center gap-4 mt-2">
                        <Badge variant="outline">
                          {faculty.sessions} Sessions
                        </Badge>
                        <Badge variant="secondary">
                          ⭐ {faculty.avgRating}
                        </Badge>
                        <Badge variant="outline">
                          {faculty.attendance}% Attendance
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{faculty.certificates}</p>
                      <p className="text-sm text-gray-600">Certificates</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Demographics */}
        <TabsContent value="demographics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Role Distribution</CardTitle>
                <CardDescription>Breakdown of attendees by role</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={roleDistribution}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {roleDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Registration Timeline</CardTitle>
                <CardDescription>Registration trends over time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockAttendanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="sessions" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common reporting and analytics tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col gap-2">
              <BarChart3 className="w-6 h-6" />
              <span>Generate Report</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Download className="w-6 h-6" />
              <span>Export Data</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Mail className="w-6 h-6" />
              <span>Email Summary</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col gap-2">
              <Filter className="w-6 h-6" />
              <span>Custom Filter</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}