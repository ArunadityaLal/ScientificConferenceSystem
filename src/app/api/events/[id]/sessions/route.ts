// src/app/api/events/[id]/sessions/route.ts - FIXED for actual database schema
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');
    const hallId = searchParams.get('hallId');
    const sessionType = searchParams.get('sessionType'); // Will be ignored since column doesn't exist
    const search = searchParams.get('search');
    const sortBy = searchParams.get('sortBy') || 'start_time';
    const sortOrder = searchParams.get('sortOrder') || 'asc';
    const limit = parseInt(searchParams.get('limit') || '100');

    console.log('🔍 Fetching sessions for event:', eventId, 'user:', session.user.email, 'role:', session.user.role);

    // Check if user has access to this event - FIXED for EVENT_MANAGER role
    const accessCheck = await query(`
      SELECT 
        e.id,
        e.name,
        e.created_by,
        ue.permissions,
        ue.role as event_role
      FROM events e
      LEFT JOIN user_events ue ON e.id = ue.event_id AND ue.user_id = $1
      WHERE e.id = $2
    `, [session.user.id, eventId]);

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = accessCheck.rows[0];
    
    // FIXED: Allow EVENT_MANAGER and ORGANIZER roles to access all sessions
    const hasAccess = 
      event.created_by === session.user.id ||
      ['EVENT_MANAGER', 'ORGANIZER'].includes(session.user.role || '') ||
      accessCheck.rows[0].event_role;

    if (!hasAccess) {
      console.log('❌ Access denied for user:', session.user.email);
      return NextResponse.json(
        { error: 'You do not have permission to view sessions for this event' },
        { status: 403 }
      );
    }

    // Build the sessions query with filters
    let whereConditions = ['cs.event_id = $1'];
    let queryParams: any[] = [eventId];
    let paramCount = 2;

    // Add date filter
    if (date) {
      whereConditions.push(`DATE(cs.start_time) = $${paramCount}`);
      queryParams.push(date);
      paramCount++;
    }

    // Add hall filter
    if (hallId) {
      whereConditions.push(`cs.hall_id = $${paramCount}`);
      queryParams.push(hallId);
      paramCount++;
    }

    // Add search filter
    if (search) {
      whereConditions.push(`(cs.title ILIKE $${paramCount} OR cs.description ILIKE $${paramCount})`);
      queryParams.push(`%${search}%`);
      paramCount++;
    }

    // Build the main query - FIXED: removed session_type column
    const sessionsQuery = `
      SELECT 
        cs.id,
        cs.event_id,
        cs.title,
        cs.description,
        cs.start_time,
        cs.end_time,
        cs.hall_id,
        cs.max_participants,
        cs.is_break,
        cs.requirements,
        cs.tags,
        cs.created_by,
        cs.created_at,
        cs.updated_at,
        h.name as hall_name,
        h.capacity as hall_capacity,
        h.location as hall_location,
        h.equipment as hall_equipment,
        -- Count speakers
        (SELECT COUNT(*) FROM session_speakers ss WHERE ss.session_id = cs.id) as speaker_count,
        -- Count presentations
        (SELECT COUNT(*) FROM presentations p WHERE p.session_id = cs.id) as presentation_count,
        -- Count attendance records (placeholder)
        0 as attendance_count
      FROM conference_sessions cs
      LEFT JOIN halls h ON cs.hall_id = h.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY cs.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount}
    `;

    queryParams.push(limit);

    console.log('📊 Sessions query:', sessionsQuery);
    console.log('📊 Query params:', queryParams);

    const sessionsResult = await query(sessionsQuery, queryParams);

    // Get speakers for each session
    const sessionIds = sessionsResult.rows.map(row => row.id);
    let speakers: any[] = [];

    if (sessionIds.length > 0) {
      const speakersQuery = `
        SELECT 
          ss.session_id,
          ss.role,
          ss.assigned_at,
          u.id as user_id,
          u.name as user_name,
          u.email as user_email,
          u.institution,
          u.designation
        FROM session_speakers ss
        JOIN users u ON ss.user_id = u.id
        WHERE ss.session_id = ANY($1)
        ORDER BY ss.assigned_at ASC
      `;
      
      const speakersResult = await query(speakersQuery, [sessionIds]);
      speakers = speakersResult.rows;
    }

    // Process sessions with their speakers - FIXED: derive sessionType from is_break
    const processedSessions = sessionsResult.rows.map(session => ({
      id: session.id,
      eventId: session.event_id,
      title: session.title,
      description: session.description,
      startTime: session.start_time,
      endTime: session.end_time,
      sessionType: session.is_break ? 'BREAK' : 'PRESENTATION', // FIXED: derive from is_break
      hallId: session.hall_id,
      maxParticipants: session.max_participants,
      isBreak: session.is_break,
      requirements: session.requirements ? JSON.parse(session.requirements) : [],
      tags: session.tags ? JSON.parse(session.tags) : [],
      createdBy: session.created_by,
      createdAt: session.created_at,
      updatedAt: session.updated_at,
      hall: session.hall_name ? {
        id: session.hall_id,
        name: session.hall_name,
        capacity: session.hall_capacity,
        location: session.hall_location,
        equipment: session.hall_equipment ? JSON.parse(session.hall_equipment) : []
      } : null,
      speakers: speakers
        .filter(speaker => speaker.session_id === session.id)
        .map(speaker => ({
          user: {
            id: speaker.user_id,
            name: speaker.user_name,
            email: speaker.user_email,
            institution: speaker.institution,
            designation: speaker.designation
          },
          role: speaker.role,
          assignedAt: speaker.assigned_at
        })),
      _count: {
        speakers: parseInt(session.speaker_count),
        presentations: parseInt(session.presentation_count),
        attendanceRecords: parseInt(session.attendance_count)
      }
    }));

    console.log('✅ Sessions fetched successfully:', {
      eventId,
      totalSessions: processedSessions.length,
      userRole: session.user.role,
      hasAccess: true
    });

    return NextResponse.json({
      success: true,
      data: {
        sessions: processedSessions,
        pagination: {
          page: 1,
          limit,
          total: processedSessions.length,
          pages: Math.ceil(processedSessions.length / limit)
        }
      }
    });

  } catch (error) {
    console.error('❌ Sessions fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    const body = await request.json();

    console.log('🔄 Creating new session for event:', eventId);

    // Check if user can create sessions for this event
    const accessCheck = await query(`
      SELECT 
        e.id,
        e.created_by,
        ue.permissions,
        ue.role as event_role
      FROM events e
      LEFT JOIN user_events ue ON e.id = ue.event_id AND ue.user_id = $1
      WHERE e.id = $2
    `, [session.user.id, eventId]);

    if (accessCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = accessCheck.rows[0];
    const canCreate = 
      event.created_by === session.user.id ||
      ['EVENT_MANAGER', 'ORGANIZER'].includes(session.user.role || '') ||
      (accessCheck.rows[0].permissions && 
       (accessCheck.rows[0].permissions.includes('WRITE') || 
        accessCheck.rows[0].permissions.includes('FULL_ACCESS')));

    if (!canCreate) {
      return NextResponse.json(
        { error: 'You do not have permission to create sessions for this event' },
        { status: 403 }
      );
    }

    // Create the session - FIXED: removed session_type from insert
    const {
      title,
      description,
      startTime,
      endTime,
      hallId,
      maxParticipants,
      requirements = [],
      tags = [],
      isBreak = false,
      speakers = []
    } = body;

    // Insert session without session_type column
    const sessionResult = await query(`
      INSERT INTO conference_sessions (
        id,
        event_id,
        title,
        description,
        start_time,
        end_time,
        hall_id,
        max_participants,
        requirements,
        tags,
        is_break,
        created_by,
        created_at,
        updated_at
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *
    `, [
      `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      eventId,
      title,
      description,
      new Date(startTime),
      new Date(endTime),
      hallId || null,
      maxParticipants || null,
      JSON.stringify(requirements),
      JSON.stringify(tags),
      isBreak,
      session.user.id,
      new Date(),
      new Date()
    ]);

    const newSession = sessionResult.rows[0];

    // Add speakers if provided
    if (speakers && speakers.length > 0) {
      for (const speaker of speakers) {
        await query(`
          INSERT INTO session_speakers (session_id, user_id, role, assigned_at)
          VALUES ($1, $2, $3, $4)
        `, [newSession.id, speaker.userId, speaker.role, new Date()]);
      }
    }

    console.log('✅ Session created successfully:', newSession.id);

    return NextResponse.json({
      success: true,
      data: {
        id: newSession.id,
        eventId: newSession.event_id,
        title: newSession.title,
        description: newSession.description,
        startTime: newSession.start_time,
        endTime: newSession.end_time,
        sessionType: newSession.is_break ? 'BREAK' : 'PRESENTATION', // FIXED: derive from is_break
        hallId: newSession.hall_id,
        maxParticipants: newSession.max_participants,
        isBreak: newSession.is_break,
        requirements: JSON.parse(newSession.requirements || '[]'),
        tags: JSON.parse(newSession.tags || '[]'),
        createdBy: newSession.created_by,
        createdAt: newSession.created_at,
        updatedAt: newSession.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Session creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    );
  }
}