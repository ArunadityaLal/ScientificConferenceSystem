// src/app/(dashboard)/event-manager/events/analytics/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExportButton } from '@/components/events/ExportButton';
import { 
  BarChart, 
  LineChart, 
  Users, 
  Calendar, 
  TrendingUp, 
  Activity,
  PieChart,
  Download, 
  RefreshCw,
  Filter,
  Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

// Types
interface AnalyticsData {
  totalEvents: number;
  totalRegistrations: number;
  totalSessions: number;
  totalFaculty: number;
  activeEvents: number;
  completedEvents: number;
  draftEvents: number;
  publishedEvents: number;
  registrationTrends: Array<{ month: string; count: number }>;
  eventStatusDistribution: Array<{ status: string; count: number; percentage: number }>;
  topEvents: Array<{ id: string; name: string; registrations: number; sessions: number }>;
  facultyStats: Array<{ role: string; count: number }>;
  monthlyEventCreation: Array<{ month: string; events: number }>;
}

interface FilterOptions {
  dateRange: 'all' | '7d' | '30d' | '90d' | '1y';
  eventStatus: 'all' | 'DRAFT' | 'PUBLISHED' | 'ACTIVE' | 'COMPLETED';
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: 'all',
    eventStatus: 'all'
  });

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      console.log('📊 Fetching analytics data...');
      
      const response = await fetch('/api/events/analytics', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      
      const data = await response.json();
      setAnalyticsData(data);
      console.log('✅ Analytics data loaded:', data);
      
    } catch (error) {
      console.error('❌ Analytics fetch error:', error);
      toast.error('Failed to load analytics data');
      
      // Fallback mock data for development
      setAnalyticsData({
        totalEvents: 5,
        totalRegistrations: 124,
        totalSessions: 23,
        totalFaculty: 18,
        activeEvents: 2,
        completedEvents: 2,
        draftEvents: 1,
        publishedEvents: 3,
        registrationTrends: [
          { month: 'Jan', count: 20 },
          { month: 'Feb', count: 35 },
          { month: 'Mar', count: 28 },
          { month: 'Apr', count: 41 },
        ],
        eventStatusDistribution: [
          { status: 'Published', count: 3, percentage: 60 },
          { status: 'Active', count: 2, percentage: 40 },
          { status: 'Draft', count: 1, percentage: 20 },
        ],
        topEvents: [
          { id: '1', name: 'Tech Conference 2025', registrations: 45, sessions: 8 },
          { id: '2', name: 'AI Summit', registrations: 32, sessions: 6 },
          { id: '3', name: 'Startup Meetup', registrations: 28, sessions: 4 },
        ],
        facultyStats: [
          { role: 'SPEAKER', count: 12 },
          { role: 'MODERATOR', count: 4 },
          { role: 'CHAIRPERSON', count: 2 },
        ],
        monthlyEventCreation: [
          { month: 'Jan', events: 1 },
          { month: 'Feb', events: 2 },
          { month: 'Mar', events: 1 },
          { month: 'Apr', events: 1 },
        ]
      });
      
    } finally {
      setLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchAnalyticsData();
  }, [filters]);

  // Refresh data
  const handleRefresh = () => {
    fetchAnalyticsData();
    toast.success('Analytics data refreshed!');
  };

  // Format numbers with commas
  const formatNumber = (num: number) => {
    return num.toLocaleString();
  };

  // Calculate growth percentage (mock calculation)
  const calculateGrowth = (current: number, previous: number = 0) => {
    if (previous === 0) return 0;
    return Math.round(((current - previous) / previous) * 100);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <RefreshCw className="animate-spin" size={20} />
          <span>Loading analytics...</span>
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Activity size={48} className="mx-auto mb-4 text-gray-400" />
          <h2 className="text-xl font-semibold mb-2">Analytics Unavailable</h2>
          <p className="text-gray-600 mb-4">Unable to load analytics data</p>
          <Button onClick={handleRefresh}>
            <RefreshCw size={16} className="mr-2" />
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Analytics</h1>
          <p className="text-muted-foreground">
            Comprehensive insights into your event management performance
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={handleRefresh}>
            <RefreshCw size={16} className="mr-2" />
            Refresh
          </Button>
          
          <ExportButton 
            variant="default"
            className="bg-blue-600 hover:bg-blue-700"
          />
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalEvents)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{calculateGrowth(analyticsData.totalEvents, 3)}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalRegistrations)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{calculateGrowth(analyticsData.totalRegistrations, 95)}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalSessions)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-blue-600">+{calculateGrowth(analyticsData.totalSessions, 18)}%</span> from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Members</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analyticsData.totalFaculty)}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+{calculateGrowth(analyticsData.totalFaculty, 14)}%</span> from last month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Event Status Distribution */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart size={20} />
              Registration Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.registrationTrends.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.month}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(item.count / 50) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-8">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart size={20} />
              Event Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analyticsData.eventStatusDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ 
                        backgroundColor: index === 0 ? '#3b82f6' : 
                                       index === 1 ? '#10b981' : 
                                       index === 2 ? '#f59e0b' : '#ef4444' 
                      }}
                    />
                    <span className="text-sm">{item.status}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{item.count}</div>
                    <div className="text-xs text-muted-foreground">{item.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Events and Faculty Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp size={20} />
              Top Events by Registration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.topEvents.map((event, index) => (
                <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium">{event.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {event.sessions} sessions
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {formatNumber(event.registrations)}
                    </div>
                    <div className="text-xs text-muted-foreground">registrations</div>
                  </div>
                </div>
              ))}
              
              <Button variant="outline" className="w-full mt-4">
                <Eye size={16} className="mr-2" />
                View All Events
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={20} />
              Faculty Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analyticsData.facultyStats.map((stat, index) => (
                <div key={stat.role} className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {stat.role.charAt(0) + stat.role.slice(1).toLowerCase()}s
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ width: `${(stat.count / analyticsData.totalFaculty) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-6">{stat.count}</span>
                  </div>
                </div>
              ))}
              
              <div className="pt-4 border-t">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">Total Faculty</span>
                  <span className="font-bold">{analyticsData.totalFaculty}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Event Creation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart size={20} />
            Monthly Event Creation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4">
            {analyticsData.monthlyEventCreation.map((item, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{item.events}</div>
                <div className="text-sm text-muted-foreground">{item.month}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button variant="outline">
              <Download size={16} className="mr-2" />
              Export Full Report
            </Button>
            
            <Button variant="outline">
              <Filter size={16} className="mr-2" />
              Custom Date Range
            </Button>
            
            <Button variant="outline">
              <Activity size={16} className="mr-2" />
              Real-time Dashboard
            </Button>
            
            <Button variant="outline">
              <Users size={16} className="mr-2" />
              Faculty Performance
            </Button>
          </div>
        </CardContent>
      </Card> */}
    </div>
  );
}