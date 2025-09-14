// src/app/api/events/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';

// Permission check for analytics access
async function checkAnalyticsPermission(userId: string) {
  try {
    const userResult = await query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      return { hasPermission: false, reason: 'User not found' };
    }
    
    const userRole = userResult.rows[0].role;
    
    // Allow ORGANIZER and EVENT_MANAGER to view analytics
    if (['ORGANIZER', 'EVENT_MANAGER'].includes(userRole)) {
      return { hasPermission: true, role: userRole };
    }
    
    return { hasPermission: false, reason: 'Insufficient permissions for analytics' };
    
  } catch (error) {
    console.error('❌ Analytics permission check error:', error);
    return { hasPermission: false, reason: 'Permission check failed' };
  }
}

// Fetch comprehensive analytics data
async function fetchAnalyticsData() {
  try {
    console.log('📊 Fetching comprehensive analytics data...');
    
    // Basic counts
    const [eventsCount, registrationsCount, sessionsCount, facultyCount] = await Promise.all([
      query('SELECT COUNT(*) as total FROM events'),
      query('SELECT COUNT(*) as total FROM registrations'),
      query('SELECT COUNT(*) as total FROM conference_sessions'),
      query(`
        SELECT COUNT(DISTINCT ue.user_id) as total 
        FROM user_events ue 
        WHERE ue.role IN ('SPEAKER', 'MODERATOR', 'CHAIRPERSON')
      `)
    ]);
    
    // Event status distribution
    const eventStatusResult = await query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM events 
      GROUP BY status
      ORDER BY count DESC
    `);
    
    // Top events by registration count
    const topEventsResult = await query(`
      SELECT 
        e.id,
        e.name,
        COUNT(r.id) as registrations,
        COUNT(DISTINCT cs.id) as sessions
      FROM events e
      LEFT JOIN registrations r ON r.event_id = e.id
      LEFT JOIN conference_sessions cs ON cs.event_id = e.id
      GROUP BY e.id, e.name
      ORDER BY registrations DESC
      LIMIT 5
    `);
    
    // Faculty role distribution
    const facultyStatsResult = await query(`
      SELECT 
        role,
        COUNT(*) as count
      FROM user_events 
      WHERE role IN ('SPEAKER', 'MODERATOR', 'CHAIRPERSON')
      GROUP BY role
      ORDER BY count DESC
    `);
    
    // Monthly registration trends (last 6 months)
    const registrationTrendsResult = await query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as count
      FROM registrations 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)
    `);
    
    // Monthly event creation trends
    const eventCreationResult = await query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COUNT(*) as events
      FROM events 
      WHERE created_at >= NOW() - INTERVAL '6 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)
    `);
    
    // Process event status distribution
    const totalEvents = parseInt(eventsCount.rows[0].total);
    const eventStatusDistribution = eventStatusResult.rows.map(row => ({
      status: row.status.charAt(0) + row.status.slice(1).toLowerCase(),
      count: parseInt(row.count),
      percentage: Math.round((parseInt(row.count) / totalEvents) * 100)
    }));
    
    // Count events by status
    const statusCounts = eventStatusResult.rows.reduce((acc: any, row: any) => {
      acc[row.status.toLowerCase()] = parseInt(row.count);
      return acc;
    }, {});
    
    console.log('✅ Analytics data fetched successfully');
    
    return {
      totalEvents: totalEvents,
      totalRegistrations: parseInt(registrationsCount.rows[0].total),
      totalSessions: parseInt(sessionsCount.rows[0].total),
      totalFaculty: parseInt(facultyCount.rows[0].total),
      activeEvents: statusCounts.active || 0,
      completedEvents: statusCounts.completed || 0,
      draftEvents: statusCounts.draft || 0,
      publishedEvents: statusCounts.published || 0,
      registrationTrends: registrationTrendsResult.rows.map(row => ({
        month: row.month,
        count: parseInt(row.count)
      })),
      eventStatusDistribution,
      topEvents: topEventsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        registrations: parseInt(row.registrations),
        sessions: parseInt(row.sessions)
      })),
      facultyStats: facultyStatsResult.rows.map(row => ({
        role: row.role,
        count: parseInt(row.count)
      })),
      monthlyEventCreation: eventCreationResult.rows.map(row => ({
        month: row.month,
        events: parseInt(row.events)
      }))
    };
    
  } catch (error) {
    console.error('❌ Error fetching analytics data:', error);
    throw new Error(`Failed to fetch analytics data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// GET handler - Fetch analytics data
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Analytics API called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check permissions
    const permissionCheck = await checkAnalyticsPermission(session.user.id);
    if (!permissionCheck.hasPermission) {
      console.log('❌ Analytics permission denied:', permissionCheck.reason);
      return NextResponse.json(
        { error: permissionCheck.reason || 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    console.log('✅ Analytics permission granted');
    
    // Get query parameters for filtering (optional)
    const { searchParams } = new URL(request.url);
    const dateRange = searchParams.get('dateRange') || 'all';
    const eventStatus = searchParams.get('eventStatus') || 'all';
    
    console.log('📋 Analytics parameters:', { dateRange, eventStatus });
    
    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData();
    
    console.log('✅ Analytics API response prepared');
    
    return NextResponse.json(analyticsData, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('❌ Analytics API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST handler - Export analytics data
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Analytics Export API called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check permissions
    const permissionCheck = await checkAnalyticsPermission(session.user.id);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.reason || 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { format = 'json', filters = {} } = body;
    
    console.log('📋 Analytics export parameters:', { format, filters });
    
    // Fetch analytics data
    const analyticsData = await fetchAnalyticsData();
    
    // Return data based on format
    if (format === 'json') {
      return NextResponse.json({
        success: true,
        data: analyticsData,
        exportedAt: new Date().toISOString(),
        filters
      });
    }
    
    // For other formats, redirect to appropriate export API
    return NextResponse.json({
      success: true,
      message: `Analytics data prepared for ${format} export`,
      data: analyticsData
    });
    
  } catch (error) {
    console.error('❌ Analytics Export API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to export analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}