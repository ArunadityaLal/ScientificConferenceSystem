// src/app/api/approvals/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { z } from 'zod';

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

// आपका existing code...

// FIXED: Make all fields optional and handle null properly
const approvalQuerySchema = z.object({
  eventId: z.string().optional().nullable(),
  sessionId: z.string().optional().nullable(),
  status: z.enum(['ACCEPTED', 'DECLINED', 'PENDING', 'TENTATIVE']).optional().nullable(),
  type: z.enum(['events', 'sessions', 'faculty', 'stats']).optional().nullable()
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);

    // Get raw parameters and handle null values
    const rawParams = {
      eventId: searchParams.get('eventId'),
      sessionId: searchParams.get('sessionId'),
      status: searchParams.get('status'),
      type: searchParams.get('type')
    };

    console.log('Raw params received:', rawParams);

    // Parse and validate, but handle null gracefully
    const parsedParams = approvalQuerySchema.parse(rawParams);

    // Set defaults after parsing
    const queryData = {
      eventId: parsedParams.eventId || undefined,
      sessionId: parsedParams.sessionId || undefined,
      status: parsedParams.status || undefined,
      type: parsedParams.type || 'faculty'
    };

    console.log('Processed query data:', queryData);

    switch (queryData.type) {
      case 'events':
        console.log('📋 Fetching events...');

        // FIXED: Use session_metadata with case-insensitive status matching
        const eventsQuery = `
          SELECT 
            e.id,
            e.name,
            e.start_date as "startDate",
            e.end_date as "endDate",
            COALESCE(e.location, '') as location,
            COUNT(sm.id) as "totalInvitations",
            COUNT(CASE WHEN LOWER(sm.invite_status) = 'accepted' THEN 1 END) as "acceptedCount",
            COUNT(CASE WHEN LOWER(sm.invite_status) = 'declined' THEN 1 END) as "declinedCount",
            COUNT(CASE WHEN LOWER(sm.invite_status) = 'pending' THEN 1 END) as "pendingCount",
            0 as "tentativeCount"
          FROM events e
          LEFT JOIN conference_sessions cs ON e.id = cs.event_id
          LEFT JOIN session_metadata sm ON cs.id = sm.session_id
          WHERE e.status IN ('PUBLISHED', 'DRAFT')
          GROUP BY e.id, e.name, e.start_date, e.end_date, e.location
          ORDER BY e.start_date DESC
        `;

        const eventsResult = await query(eventsQuery);
        console.log('📊 Events found:', eventsResult.rows.length);

        return NextResponse.json({
          success: true,
          data: eventsResult.rows.map(row => ({
            id: row.id,
            name: row.name,
            startDate: row.startDate,
            endDate: row.endDate,
            location: row.location,
            totalInvitations: parseInt(row.totalInvitations) || 0,
            acceptedCount: parseInt(row.acceptedCount) || 0,
            declinedCount: parseInt(row.declinedCount) || 0,
            pendingCount: parseInt(row.pendingCount) || 0,
            tentativeCount: parseInt(row.tentativeCount) || 0
          }))
        });

      case 'sessions':
        if (!queryData.eventId) {
          return NextResponse.json(
            { success: false, error: 'eventId is required for sessions type' },
            { status: 400 }
          );
        }

        console.log('📋 Fetching sessions for event:', queryData.eventId);

        // FIXED: Use session_metadata with case-insensitive status matching
        const sessionsQuery = `
          SELECT 
            cs.id,
            cs.title,
            cs.start_time as "startTime",
            cs.end_time as "endTime",
            COALESCE(h.name, 'TBD') as "hallName",
            COUNT(sm.id) as "totalInvitations",
            COUNT(CASE WHEN LOWER(sm.invite_status) = 'accepted' THEN 1 END) as "acceptedCount",
            COUNT(CASE WHEN LOWER(sm.invite_status) = 'declined' THEN 1 END) as "declinedCount",
            COUNT(CASE WHEN LOWER(sm.invite_status) = 'pending' THEN 1 END) as "pendingCount",
            0 as "tentativeCount"
          FROM conference_sessions cs
          LEFT JOIN halls h ON cs.hall_id = h.id
          LEFT JOIN session_metadata sm ON cs.id = sm.session_id
          WHERE cs.event_id = $1
          GROUP BY cs.id, cs.title, cs.start_time, cs.end_time, h.name
          ORDER BY cs.start_time ASC
        `;

        const sessionsResult = await query(sessionsQuery, [queryData.eventId]);
        console.log('📊 Sessions found:', sessionsResult.rows.length);

        return NextResponse.json({
          success: true,
          data: sessionsResult.rows.map(row => ({
            id: row.id,
            title: row.title,
            startTime: row.startTime,
            endTime: row.endTime,
            hallName: row.hallName,
            totalInvitations: parseInt(row.totalInvitations) || 0,
            acceptedCount: parseInt(row.acceptedCount) || 0,
            declinedCount: parseInt(row.declinedCount) || 0,
            pendingCount: parseInt(row.pendingCount) || 0,
            tentativeCount: parseInt(row.tentativeCount) || 0
          }))
        });

      case 'faculty':
        if (!queryData.status) {
          return NextResponse.json(
            { success: false, error: 'status is required for faculty type' },
            { status: 400 }
          );
        }

        let facultyQuery;
        let facultyParams;

        if (queryData.sessionId) {
          console.log('📋 Fetching faculty for session:', queryData.sessionId, 'status:', queryData.status);

          // FIXED: Use case-insensitive status matching
          const dbStatusLower = queryData.status.toLowerCase();

          facultyQuery = `
            SELECT 
              sm.id,
              COALESCE(u.name, SPLIT_PART(sm.faculty_email, '@', 1), 'Unknown Faculty') as "name",
              COALESCE(u.email, sm.faculty_email) as "email",
              COALESCE(u.institution, 'Not specified') as "institution",
              COALESCE(u.designation, 'Not specified') as "designation",
              COALESCE(u.specialization, 'Not specified') as "specialization",
              COALESCE(u.phone, 'Not provided') as "phone",
              sm.session_id as "sessionId",
              cs.title as "sessionTitle",
              cs.event_id as "eventId",
              e.name as "eventName",
              sm.invite_status as "responseStatus",
              sm.updated_at as "responseDate",
              sm.rejection_reason as "rejectionReason",
              sm.created_at as "invitationDate",
              sm.place,
              sm.travel,
              sm.accommodation,
              CASE 
                WHEN LOWER(sm.invite_status) = 'pending'
                THEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - sm.created_at))::integer
                ELSE NULL
              END as "daysPending"
            FROM session_metadata sm
            LEFT JOIN users u ON sm.faculty_id = u.id
            LEFT JOIN conference_sessions cs ON sm.session_id = cs.id
            LEFT JOIN events e ON cs.event_id = e.id
            WHERE sm.session_id = $1 AND LOWER(sm.invite_status) = $2
            ORDER BY COALESCE(u.name, sm.faculty_email) ASC
          `;
          facultyParams = [queryData.sessionId, dbStatusLower];

        } else if (queryData.eventId) {
          console.log('📋 Fetching faculty for event:', queryData.eventId, 'status:', queryData.status);

          // FIXED: Use case-insensitive status matching
          const dbStatusLower = queryData.status.toLowerCase();

          facultyQuery = `
            SELECT 
              sm.id,
              COALESCE(u.name, SPLIT_PART(sm.faculty_email, '@', 1), 'Unknown Faculty') as "name",
              COALESCE(u.email, sm.faculty_email) as "email",
              COALESCE(u.institution, 'Not specified') as "institution",
              COALESCE(u.designation, 'Not specified') as "designation",
              COALESCE(u.specialization, 'Not specified') as "specialization",
              COALESCE(u.phone, 'Not provided') as "phone",
              sm.session_id as "sessionId",
              cs.title as "sessionTitle",
              cs.event_id as "eventId",
              e.name as "eventName",
              sm.invite_status as "responseStatus",
              sm.updated_at as "responseDate",
              sm.rejection_reason as "rejectionReason",
              sm.created_at as "invitationDate",
              sm.place,
              sm.travel,
              sm.accommodation,
              CASE 
                WHEN LOWER(sm.invite_status) = 'pending'
                THEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - sm.created_at))::integer
                ELSE NULL
              END as "daysPending"
            FROM session_metadata sm
            LEFT JOIN users u ON sm.faculty_id = u.id
            LEFT JOIN conference_sessions cs ON sm.session_id = cs.id
            LEFT JOIN events e ON cs.event_id = e.id
            WHERE cs.event_id = $1 AND LOWER(sm.invite_status) = $2
            ORDER BY COALESCE(u.name, sm.faculty_email) ASC
          `;
          facultyParams = [queryData.eventId, dbStatusLower];

        } else {
          return NextResponse.json(
            { success: false, error: 'Either eventId or sessionId is required' },
            { status: 400 }
          );
        }

        const facultyResult = await query(facultyQuery, facultyParams);
        console.log('📊 Faculty found:', facultyResult.rows.length);

        return NextResponse.json({
          success: true,
          data: facultyResult.rows,
          count: facultyResult.rows.length
        });

      case 'stats':
        if (!queryData.eventId) {
          return NextResponse.json(
            { success: false, error: 'eventId is required for stats type' },
            { status: 400 }
          );
        }

        // FIXED: Use session_metadata with case-insensitive status matching
        const statsQuery = `
          SELECT 
            COUNT(sm.id) as total,
            COUNT(CASE WHEN LOWER(sm.invite_status) = 'accepted' THEN 1 END) as accepted,
            COUNT(CASE WHEN LOWER(sm.invite_status) = 'declined' THEN 1 END) as declined,
            COUNT(CASE WHEN LOWER(sm.invite_status) = 'pending' THEN 1 END) as pending,
            0 as tentative
          FROM session_metadata sm
          LEFT JOIN conference_sessions cs ON sm.session_id = cs.id
          WHERE cs.event_id = $1
        `;

        const statsResult = await query(statsQuery, [queryData.eventId]);

        return NextResponse.json({
          success: true,
          data: statsResult.rows[0]
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid type parameter' },
          { status: 400 }
        );
    }

  } catch (error) {
    console.error('Error in approvals API:', error);

    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}