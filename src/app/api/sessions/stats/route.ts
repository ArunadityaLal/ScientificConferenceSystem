// src/app/api/sessions/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// आपका existing code...
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    console.log('📊 Fetching session statistics for event:', eventId, 'user:', session.user.role);

    // Check if user has access to this event
    const accessCheck = await query(`
      SELECT 
        e.id,
        e.created_by
      FROM events e
      WHERE e.id = $1
    `, [eventId]);

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = accessCheck.rows[0];
    
    // Allow access for EVENT_MANAGER, ORGANIZER, or event creator
    const hasAccess = 
      event.created_by === session.user.id ||
      ['EVENT_MANAGER', 'ORGANIZER'].includes(session.user.role || '');

    if (!hasAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to view statistics for this event' },
        { status: 403 }
      );
    }

    // Get session statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_sessions,
        COUNT(*) FILTER (WHERE session_type = 'KEYNOTE') as keynote_sessions,
        COUNT(*) FILTER (WHERE session_type = 'PRESENTATION') as presentation_sessions,
        COUNT(*) FILTER (WHERE session_type = 'PANEL') as panel_sessions,
        COUNT(*) FILTER (WHERE session_type = 'WORKSHOP') as workshop_sessions,
        COUNT(*) FILTER (WHERE session_type = 'POSTER') as poster_sessions,
        COUNT(*) FILTER (WHERE session_type = 'BREAK') as break_sessions,
        COUNT(*) FILTER (WHERE is_break = true) as total_breaks,
        COUNT(*) FILTER (WHERE start_time > NOW()) as upcoming_sessions,
        COUNT(*) FILTER (WHERE start_time <= NOW() AND end_time >= NOW()) as ongoing_sessions,
        COUNT(*) FILTER (WHERE end_time < NOW()) as completed_sessions,
        AVG(EXTRACT(EPOCH FROM (end_time - start_time))/60) as avg_duration_minutes
      FROM conference_sessions 
      WHERE event_id = $1
    `;

    const statsResult = await query(statsQuery, [eventId]);
    const stats = statsResult.rows[0];

    // Get speaker statistics
    const speakerStatsQuery = `
      SELECT 
        COUNT(DISTINCT ss.user_id) as total_speakers,
        COUNT(*) FILTER (WHERE ss.role = 'SPEAKER') as speakers,
        COUNT(*) FILTER (WHERE ss.role = 'MODERATOR') as moderators,
        COUNT(*) FILTER (WHERE ss.role = 'CHAIRPERSON') as chairpersons
      FROM session_speakers ss
      JOIN conference_sessions cs ON ss.session_id = cs.id
      WHERE cs.event_id = $1
    `;

    const speakerStatsResult = await query(speakerStatsQuery, [eventId]);
    const speakerStats = speakerStatsResult.rows[0];

    // Get hall utilization
    const hallStatsQuery = `
      SELECT 
        h.name as hall_name,
        COUNT(cs.id) as session_count,
        SUM(EXTRACT(EPOCH FROM (cs.end_time - cs.start_time))/3600) as total_hours
      FROM halls h
      LEFT JOIN conference_sessions cs ON h.id = cs.hall_id
      WHERE h.event_id = $1
      GROUP BY h.id, h.name
      ORDER BY session_count DESC
    `;

    const hallStatsResult = await query(hallStatsQuery, [eventId]);
    const hallStats = hallStatsResult.rows;

    // Get daily session distribution
    const dailyStatsQuery = `
      SELECT 
        DATE(start_time) as session_date,
        COUNT(*) as session_count,
        COUNT(*) FILTER (WHERE session_type = 'KEYNOTE') as keynotes,
        COUNT(*) FILTER (WHERE session_type = 'PRESENTATION') as presentations,
        COUNT(*) FILTER (WHERE is_break = true) as breaks
      FROM conference_sessions
      WHERE event_id = $1
      GROUP BY DATE(start_time)
      ORDER BY session_date
    `;

    const dailyStatsResult = await query(dailyStatsQuery, [eventId]);
    const dailyStats = dailyStatsResult.rows;

    // Process and format the statistics
    const processedStats = {
      totalSessions: parseInt(stats.total_sessions) || 0,
      upcomingSessions: parseInt(stats.upcoming_sessions) || 0,
      ongoingSessions: parseInt(stats.ongoing_sessions) || 0,
      completedSessions: parseInt(stats.completed_sessions) || 0,
      totalSpeakers: parseInt(speakerStats.total_speakers) || 0,
      averageDuration: parseFloat(stats.avg_duration_minutes) || 0,
      
      sessionTypes: {
        KEYNOTE: parseInt(stats.keynote_sessions) || 0,
        PRESENTATION: parseInt(stats.presentation_sessions) || 0,
        PANEL: parseInt(stats.panel_sessions) || 0,
        WORKSHOP: parseInt(stats.workshop_sessions) || 0,
        POSTER: parseInt(stats.poster_sessions) || 0,
        BREAK: parseInt(stats.break_sessions) || 0
      },

      speakerRoles: {
        speakers: parseInt(speakerStats.speakers) || 0,
        moderators: parseInt(speakerStats.moderators) || 0,
        chairpersons: parseInt(speakerStats.chairpersons) || 0
      },

      hallUtilization: hallStats.map(hall => ({
        name: hall.hall_name,
        sessionCount: parseInt(hall.session_count) || 0,
        totalHours: parseFloat(hall.total_hours) || 0
      })),

      dailyDistribution: dailyStats.map(day => ({
        date: day.session_date,
        sessionCount: parseInt(day.session_count) || 0,
        keynotes: parseInt(day.keynotes) || 0,
        presentations: parseInt(day.presentations) || 0,
        breaks: parseInt(day.breaks) || 0
      })),

      // Additional computed statistics
      breakTime: parseInt(stats.total_breaks) || 0,
      sessionDensity: dailyStats.length > 0 ? (parseInt(stats.total_sessions) / dailyStats.length) : 0
    };

    console.log('✅ Session statistics calculated:', {
      eventId,
      totalSessions: processedStats.totalSessions,
      totalSpeakers: processedStats.totalSpeakers,
      upcomingSessions: processedStats.upcomingSessions
    });

    return NextResponse.json({
      success: true,
      data: processedStats
    });

  } catch (error) {
    console.error('❌ Session statistics error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session statistics' },
      { status: 500 }
    );
  }
}