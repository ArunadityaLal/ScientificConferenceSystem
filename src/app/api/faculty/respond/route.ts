// src/app/api/faculty/respond/route.ts - NEW: Dynamic Faculty Response System
import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database/connection';
import { updateInvitationStatus } from '@/lib/database/event-session-integration';
import { z } from 'zod';

const responseSchema = z.object({
  sessionId: z.string(),
  response: z.enum(['accept', 'decline']),
  message: z.string().optional(),
  facultyEmail: z.string().email(),
  rejectionReason: z.string().optional(),
  suggestedTopic: z.string().optional(),
  suggestedTimeStart: z.string().optional(),
  suggestedTimeEnd: z.string().optional(),
  optionalQuery: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('📝 Faculty response received:', body);

    // Validate request data
    const validatedData = responseSchema.parse(body);
    const { sessionId, response, message, facultyEmail, ...additionalData } = validatedData;

    // Verify session exists and get details
    const sessionCheck = await query(
      `SELECT 
        cs.id, cs.title, cs.start_time, cs.end_time,
        e.name as event_name, e.id as event_id,
        sm.faculty_email, sm.invite_status,
        h.name as hall_name
       FROM conference_sessions cs
       LEFT JOIN events e ON cs.event_id = e.id
       LEFT JOIN session_metadata sm ON cs.id = sm.session_id
       LEFT JOIN halls h ON cs.hall_id = h.id
       WHERE cs.id = $1 AND sm.faculty_email = $2`,
      [sessionId, facultyEmail]
    );

    if (sessionCheck.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Session not found or faculty email does not match'
      }, { status: 404 });
    }

    const sessionData = sessionCheck.rows[0];

    // Check if already responded
    if (sessionData.invite_status !== 'Pending') {
      return NextResponse.json({
        success: false,
        error: `You have already responded with: ${sessionData.invite_status}`
      }, { status: 400 });
    }

    // Update invitation status based on response
    const newStatus = response === 'accept' ? 'Accepted' : 'Declined';
    
    await query("BEGIN");

    try {
      // Update session metadata with response
      await query(
        `UPDATE session_metadata 
         SET 
           invite_status = $1,
           rejection_reason = $2,
           suggested_topic = $3,
           suggested_time_start = $4,
           suggested_time_end = $5,
           optional_query = $6,
           updated_at = NOW()
         WHERE session_id = $7`,
        [
          newStatus,
          additionalData.rejectionReason || null,
          additionalData.suggestedTopic || null,
          additionalData.suggestedTimeStart || null,
          additionalData.suggestedTimeEnd || null,
          additionalData.optionalQuery || null,
          sessionId
        ]
      );

      // Log the response in activity logs
      await query(
        `INSERT INTO faculty_invitation_logs (
          faculty_email, session_id, session_title, event_name, 
          action, status, metadata, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          facultyEmail,
          sessionId,
          sessionData.title,
          sessionData.event_name,
          `FACULTY_RESPONSE_${newStatus.toUpperCase()}`,
          newStatus,
          JSON.stringify({
            response: response,
            message: message,
            timestamp: new Date().toISOString(),
            additionalData: additionalData
          })
        ]
      );

      await query("COMMIT");

      // Prepare response data
      const responseData = {
        sessionId: sessionId,
        sessionTitle: sessionData.title,
        eventName: sessionData.event_name,
        response: newStatus,
        message: message,
        facultyEmail: facultyEmail,
        timestamp: new Date().toISOString()
      };

      console.log(`✅ Faculty response processed: ${newStatus} for session ${sessionId}`);

      return NextResponse.json({
        success: true,
        message: `Your response has been recorded: ${newStatus}`,
        data: responseData
      });

    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }

  } catch (error) {
    console.error('❌ Error processing faculty response:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      }, { status: 400 });
    }

    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// GET: Get session details for faculty to respond
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const facultyEmail = searchParams.get('facultyEmail');

    if (!sessionId || !facultyEmail) {
      return NextResponse.json({
        success: false,
        error: 'Session ID and faculty email are required'
      }, { status: 400 });
    }

    // Get session details for faculty response
    const sessionResult = await query(
      `SELECT 
        cs.id, cs.title, cs.description,
        cs.start_time as "startTime", cs.end_time as "endTime",
        e.name as "eventName", e.location as "eventLocation",
        e.start_date as "eventStartDate", e.end_date as "eventEndDate",
        sm.invite_status as "inviteStatus",
        sm.place, sm.travel, sm.accommodation,
        h.name as "hallName", h.capacity as "hallCapacity",
        u.name as "organizerName", u.email as "organizerEmail"
       FROM conference_sessions cs
       LEFT JOIN events e ON cs.event_id = e.id
       LEFT JOIN session_metadata sm ON cs.id = sm.session_id
       LEFT JOIN halls h ON cs.hall_id = h.id
       LEFT JOIN users u ON e.created_by = u.id
       WHERE cs.id = $1 AND sm.faculty_email = $2`,
      [sessionId, facultyEmail]
    );

    if (sessionResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Session not found or not authorized'
      }, { status: 404 });
    }

    const sessionData = sessionResult.rows[0];

    return NextResponse.json({
      success: true,
      data: {
        session: sessionData,
        canRespond: sessionData.inviteStatus === 'Pending',
        responseOptions: ['accept', 'decline']
      }
    });

  } catch (error) {
    console.error('❌ Error fetching session for response:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";