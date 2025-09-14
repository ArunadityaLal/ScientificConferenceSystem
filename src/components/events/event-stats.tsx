// src/components/events/event-stats.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading';

import { 
  TrendingUp,
  TrendingDown,
  Users,
  Calendar,
  Clock,
  UserCheck,
  Award,
  Target,
  BarChart3,
  PieChart,
  Activity,
  Star,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Eye,
  Download,
  Share2
} from 'lucide-react';

interface EventStatsProps {
  eventId: string;
  stats: {
    totalRegistrations: number;
    approvedRegistrations: number;
    pendingRegistrations: number;
    rejectedRegistrations: number;
    totalSessions: number;
    completedSessions: number;
    ongoingSessions: number;
    upcomingSessions: number;
    totalFaculty: number;
    confirmedFaculty: number;
    pendingFaculty: number;
    averageRating?: number;
    totalAttendance?: number;
    avgSessionAttendance?: number;
    expectedAttendees?: number;
    actualAttendees?: number;
    certificatesGenerated?: number;
    revenueGenerated?: number;
    conversionRate?: number;
    engagementScore?: number;
  };
  timeSeriesData?: Array<{
    date: string;
    registrations: number;
    attendance: number;
    sessions: number;
  }>;
  loading?: boolean;
  showExportOptions?: boolean;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
}

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ElementType;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'neutral';
    period: string;
  };
  color?: 'blue' | 'green' | 'orange' | 'red' | 'purple' | 'gray';
  progress?: {
    current: number;
    total: number;
    label?: string;
  };
}

function StatCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  color = 'blue', 
  progress 
}: StatCardProps) {
  const colorClasses = {
    blue: 'text-blue-600',
    green: 'text-green-600',
    orange: 'text-orange-600',
    red: 'text-red-600',
    purple: 'text-purple-600',
    gray: 'text-gray-600'
  };

  const trendColorClasses = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600'
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {description && (
              <p className="text-xs text-muted-foreground">{description}</p>
            )}
            {trend && (
              <div className={`flex items-center text-xs ${trendColorClasses[trend.direction]}`}>
                {trend.direction === 'up' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : trend.direction === 'down' ? (
                  <TrendingDown className="h-3 w-3 mr-1" />
                ) : (
                  <Activity className="h-3 w-3 mr-1" />
                )}
                {trend.value > 0 ? '+' : ''}{trend.value}% {trend.period}
              </div>
            )}
            {progress && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{progress.label || 'Progress'}</span>
                  <span>{Math.round((progress.current / progress.total) * 100)}%</span>
                </div>
                <Progress 
                  value={(progress.current / progress.total) * 100} 
                  className="h-2"
                />
              </div>
            )}
          </div>
          <Icon className={`h-8 w-8 ${colorClasses[color]}`} />
        </div>
      </CardContent>
    </Card>
  );
}

export function EventStats({ 
  eventId, 
  stats, 
  timeSeriesData = [], 
  loading = false,
  showExportOptions = true,
  onExport 
}: EventStatsProps) {
  const registrationRate = stats.expectedAttendees ? 
    (stats.approvedRegistrations / stats.expectedAttendees) * 100 : 0;
  
  const sessionCompletionRate = stats.totalSessions ? 
    (stats.completedSessions / stats.totalSessions) * 100 : 0;
  
  const facultyConfirmationRate = stats.totalFaculty ? 
    (stats.confirmedFaculty / stats.totalFaculty) * 100 : 0;

  const attendanceRate = stats.avgSessionAttendance || 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Options */}
      {showExportOptions && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Event Analytics</h2>
            <p className="text-muted-foreground">Comprehensive insights and performance metrics</p>
          </div>
          {onExport && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onExport('pdf')}
                className="flex items-center px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                PDF
              </button>
              <button
                onClick={() => onExport('excel')}
                className="flex items-center px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                Excel
              </button>
              <button
                onClick={() => onExport('csv')}
                className="flex items-center px-3 py-2 text-sm border rounded-md hover:bg-gray-50"
              >
                <Download className="h-4 w-4 mr-2" />
                CSV
              </button>
            </div>
          )}
        </div>
      )}

      {/* Primary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Registrations"
          value={stats.totalRegistrations}
          description={`${stats.approvedRegistrations} approved, ${stats.pendingRegistrations} pending`}
          icon={Users}
          color="blue"
          trend={{
            value: 12,
            direction: 'up',
            period: 'this week'
          }}
          progress={{
            current: stats.approvedRegistrations,
            total: stats.expectedAttendees || stats.totalRegistrations,
            label: 'Fill Rate'
          }}
        />

        <StatCard
          title="Sessions"
          value={stats.totalSessions}
          description={`${stats.completedSessions} completed, ${stats.ongoingSessions} ongoing`}
          icon={Calendar}
          color="green"
          progress={{
            current: stats.completedSessions,
            total: stats.totalSessions,
            label: 'Completion Rate'
          }}
        />

        <StatCard
          title="Faculty"
          value={stats.confirmedFaculty}
          description={`${stats.totalFaculty} total invited`}
          icon={Award}
          color="purple"
          progress={{
            current: stats.confirmedFaculty,
            total: stats.totalFaculty,
            label: 'Confirmation Rate'
          }}
        />

        <StatCard
          title="Attendance Rate"
          value={`${Math.round(attendanceRate)}%`}
          description="Average across all sessions"
          icon={UserCheck}
          color="orange"
          trend={{
            value: 5,
            direction: 'up',
            period: 'vs last event'
          }}
        />
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Registration Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Registration Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-2" />
                  <span className="text-sm">Approved</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.approvedRegistrations}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.totalRegistrations > 0 ? 
                      Math.round((stats.approvedRegistrations / stats.totalRegistrations) * 100) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2" />
                  <span className="text-sm">Pending</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.pendingRegistrations}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.totalRegistrations > 0 ? 
                      Math.round((stats.pendingRegistrations / stats.totalRegistrations) * 100) : 0}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-2" />
                  <span className="text-sm">Rejected</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-medium">{stats.rejectedRegistrations}</span>
                  <Badge variant="outline" className="text-xs">
                    {stats.totalRegistrations > 0 ? 
                      Math.round((stats.rejectedRegistrations / stats.totalRegistrations) * 100) : 0}%
                  </Badge>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center text-sm">
                <span className="font-medium">Total Registrations</span>
                <span className="font-bold">{stats.totalRegistrations}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Session Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Session Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                  <span className="text-sm">Completed</span>
                </div>
                <span className="text-sm font-medium">{stats.completedSessions}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Activity className="w-4 h-4 text-blue-500 mr-2" />
                  <span className="text-sm">Ongoing</span>
                </div>
                <span className="text-sm font-medium">{stats.ongoingSessions}</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-500 mr-2" />
                  <span className="text-sm">Upcoming</span>
                </div>
                <span className="text-sm font-medium">{stats.upcomingSessions}</span>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{Math.round(sessionCompletionRate)}%</span>
                </div>
                <Progress value={sessionCompletionRate} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.averageRating && (
          <StatCard
            title="Average Rating"
            value={`${stats.averageRating.toFixed(1)} ⭐`}
            description="Event satisfaction score"
            icon={Star}
            color="purple"
          />
        )}

        {stats.certificatesGenerated !== undefined && (
          <StatCard
            title="Certificates"
            value={stats.certificatesGenerated}
            description="Generated and distributed"
            icon={Award}
            color="green"
          />
        )}

        {stats.conversionRate !== undefined && (
          <StatCard
            title="Conversion Rate"
            value={`${Math.round(stats.conversionRate)}%`}
            description="Registration to attendance"
            icon={Target}
            color="blue"
          />
        )}

        {stats.engagementScore !== undefined && (
          <StatCard
            title="Engagement"
            value={`${Math.round(stats.engagementScore)}%`}
            description="Overall participant engagement"
            icon={Activity}
            color="orange"
          />
        )}
      </div>

      {/* Key Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Eye className="h-5 w-5 mr-2" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Registration Performance</h4>
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(registrationRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {registrationRate >= 80 ? 'Excellent fill rate' :
                 registrationRate >= 60 ? 'Good attendance expected' :
                 registrationRate >= 40 ? 'Moderate interest' :
                 'Consider marketing boost'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Faculty Engagement</h4>
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(facultyConfirmationRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {facultyConfirmationRate >= 90 ? 'Excellent speaker lineup' :
                 facultyConfirmationRate >= 70 ? 'Good faculty participation' :
                 facultyConfirmationRate >= 50 ? 'Need more confirmations' :
                 'Critical: Follow up required'}
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Session Delivery</h4>
              <div className="text-2xl font-bold text-green-600">
                {Math.round(sessionCompletionRate)}%
              </div>
              <p className="text-xs text-muted-foreground">
                {sessionCompletionRate >= 80 ? 'On track for completion' :
                 sessionCompletionRate >= 50 ? 'Steady progress' :
                 sessionCompletionRate >= 20 ? 'Early stages' :
                 'Event just started'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}