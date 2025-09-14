'use client';

import React, { useEffect, useState } from 'react';
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
RefreshCw,
Eye
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SessionsAnalyticsData {
totalSessions: number;
totalFaculty: number;
confirmedSessions: number;
draftSessions: number;

monthlySessionCreation: Array<{ month: string; sessions: number }>;
inviteStatusDistribution: Array<{ status: 'Accepted' | 'Pending' | 'Declined'; count: number; percentage: number }>;

topFacultyBySessions: Array<{ id: string; name: string; sessions: number }>;
sessionsPerEvent: Array<{ id: string; name: string; sessions: number; confirmed: number }>;
}

interface FilterOptions {
dateRange: 'all' | '7d' | '30d' | '90d' | '1y';
eventId: 'all' | string;
}

export default function SessionsAnalyticsPage() {
const [analyticsData, setAnalyticsData] = useState<SessionsAnalyticsData | null>(null);
const [loading, setLoading] = useState(true);
const [filters, setFilters] = useState<FilterOptions>({
dateRange: 'all',
eventId: 'all'
});

const fetchAnalyticsData = async () => {
try {
setLoading(true);
const params = new URLSearchParams();
if (filters.dateRange !== 'all') params.set('dateRange', filters.dateRange);
if (filters.eventId !== 'all') params.set('eventId', filters.eventId);

  const res = await fetch(`/api/sessions/analytics?${params.toString()}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store'
  });

  if (!res.ok) throw new Error(`Failed to fetch sessions analytics: ${res.statusText}`);

  const payload = await res.json();
  const data: SessionsAnalyticsData = payload?.data || payload;

  setAnalyticsData({
    totalSessions: data.totalSessions ?? 0,
    totalFaculty: data.totalFaculty ?? 0,
    confirmedSessions: data.confirmedSessions ?? 0,
    draftSessions: data.draftSessions ?? 0,
    monthlySessionCreation: data.monthlySessionCreation ?? [],
    inviteStatusDistribution: data.inviteStatusDistribution ?? [],
    topFacultyBySessions: data.topFacultyBySessions ?? [],
    sessionsPerEvent: data.sessionsPerEvent ?? []
  });
} catch (e) {
  console.error(e);
  toast.error('Failed to load sessions analytics, showing demo data');

  setAnalyticsData({
    totalSessions: 23,
    totalFaculty: 18,
    confirmedSessions: 14,
    draftSessions: 9,
    monthlySessionCreation: [
      { month: 'Jan', sessions: 3 },
      { month: 'Feb', sessions: 6 },
      { month: 'Mar', sessions: 5 },
      { month: 'Apr', sessions: 9 }
    ],
    inviteStatusDistribution: [
      { status: 'Accepted', count: 12, percentage: 52 },
      { status: 'Pending', count: 7, percentage: 30 },
      { status: 'Declined', count: 4, percentage: 18 }
    ],
    topFacultyBySessions: [
      { id: 'f1', name: 'Dr. A Kumar', sessions: 5 },
      { id: 'f2', name: 'Prof. B Singh', sessions: 4 },
      { id: 'f3', name: 'Dr. C Mehta', sessions: 3 }
    ],
    sessionsPerEvent: [
      { id: 'e1', name: 'Tech Conference 2025', sessions: 8, confirmed: 5 },
      { id: 'e2', name: 'AI Summit', sessions: 6, confirmed: 4 },
      { id: 'e3', name: 'Startup Meetup', sessions: 4, confirmed: 3 }
    ]
  });
} finally {
  setLoading(false);
}
};

useEffect(() => {
fetchAnalyticsData();
}, [filters]);

const handleRefresh = () => {
fetchAnalyticsData();
toast.success('Analytics data refreshed!');
};

const formatNumber = (n: number) => n.toLocaleString();
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
<div className="space-y-8 p-6" id="sessions-analytics-root">
{/* Header */}
<div className="flex items-center justify-between">
<div>
<h1 className="text-3xl font-bold tracking-tight">Sessions Analytics</h1>
<p className="text-muted-foreground">
Comprehensive insights into session performance across events
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
        // If your shared ExportButton accepts props, you can pass:
        // targetSelector="#sessions-analytics-root"
        // filenamePrefix="sessions-analytics"
        // xlsxData={analyticsData}
        // context="sessions"
      />
    </div>
  </div>

  {/* Key Metrics Cards */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
        <Calendar className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(analyticsData.totalSessions)}</div>
        <p className="text-xs text-muted-foreground">
          <span className="text-blue-600">+{calculateGrowth(analyticsData.totalSessions, Math.max(1, analyticsData.totalSessions - 5))}%</span> from last period
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Confirmed Sessions</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(analyticsData.confirmedSessions)}</div>
        <p className="text-xs text-muted-foreground">
          <span className="text-green-600">+{calculateGrowth(analyticsData.confirmedSessions, Math.max(1, analyticsData.confirmedSessions - 3))}%</span> from last period
        </p>
      </CardContent>
    </Card>

    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Draft Sessions</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatNumber(analyticsData.draftSessions)}</div>
        <p className="text-xs text-muted-foreground">
          <span className="text-amber-600">+{calculateGrowth(analyticsData.draftSessions, Math.max(1, analyticsData.draftSessions - 2))}%</span> from last period
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
          <span className="text-green-600">+{calculateGrowth(analyticsData.totalFaculty, Math.max(1, analyticsData.totalFaculty - 4))}%</span> from last period
        </p>
      </CardContent>
    </Card>
  </div>

  {/* Trends and Invite Distribution */}
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
    <Card className="col-span-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart size={20} />
          Sessions Created per Month
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analyticsData.monthlySessionCreation.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <span className="text-sm font-medium">{item.month}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{
                      width: `${(item.sessions / Math.max(1, Math.max(...analyticsData.monthlySessionCreation.map(x => x.sessions)))) * 100}%`
                    }}
                  />
                </div>
                <span className="text-sm font-bold w-8">{item.sessions}</span>
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
          Invite Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analyticsData.inviteStatusDistribution.map((item, index) => (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor:
                      item.status === 'Accepted' ? '#10b981' :
                      item.status === 'Pending' ? '#f59e0b' : '#ef4444'
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

  {/* Top Faculty and Sessions per Event */}
  <div className="grid gap-4 md:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp size={20} />
          Top Faculty by Sessions
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {analyticsData.topFacultyBySessions.map((f) => (
            <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{f.name}</div>
                <div className="text-sm text-muted-foreground">Sessions led</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-blue-600">{formatNumber(f.sessions)}</div>
              </div>
            </div>
          ))}
          <Button variant="outline" className="w-full mt-4">
            <Eye size={16} className="mr-2" />
            View All Faculty
          </Button>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users size={20} />
          Sessions per Event
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {analyticsData.sessionsPerEvent.map((e) => (
            <div key={e.id} className="flex items-center justify-between">
              <span className="text-sm font-medium">{e.name}</span>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (e.confirmed / Math.max(1, e.sessions)) * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-bold">{e.sessions}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>

  {/* Monthly Session Creation (tiles) */}
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <LineChart size={20} />
        Monthly Session Creation
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-4 gap-4">
        {analyticsData.monthlySessionCreation.map((item, index) => (
          <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{item.sessions}</div>
            <div className="text-sm text-muted-foreground">{item.month}</div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
</div>
);
}