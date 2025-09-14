// src/lib/database/approval-queries.ts
import { query } from './connection';

export interface ApprovalFaculty {
  id: string;
  name: string;
  email: string;
  institution: string;
  designation: string;
  specialization: string;
  phone: string;
  sessionId: string;
  sessionTitle: string;
  eventId: string;
  eventName: string;
  responseStatus: 'ACCEPTED' | 'DECLINED' | 'PENDING' | 'TENTATIVE';
  responseDate: string | null;
  responseMessage: string | null;
  rejectionReason: string | null;
  invitationDate: string;
  daysPending?: number;
}

export interface EventWithStats {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  location: string;
  totalInvitations: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  tentativeCount: number;
}

export interface SessionWithStats {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  hallName: string;
  totalInvitations: number;
  acceptedCount: number;
  declinedCount: number;
  pendingCount: number;
  tentativeCount: number;
}

// FIXED: Get all events from events table and add invitation stats
export async function getEventsWithInvitationStats(): Promise<EventWithStats[]> {
  try {
    console.log('🔍 Fetching events from events table...');
    
    // First get all events from events table (like event manager does)
    const result = await query(`
      SELECT 
        e.id,
        e.name,
        e.start_date as "startDate",
        e.end_date as "endDate",
        COALESCE(e.location, '') as location
      FROM events e
      WHERE e.status IN ('PUBLISHED', 'ONGOING', 'DRAFT')
      ORDER BY e.start_date DESC
    `);
    
    console.log('📊 Events found:', result.rows.length);
    
    // Now add invitation stats for each event
    const eventsWithStats = await Promise.all(
      result.rows.map(async (event) => {
        try {
          const statsResult = await query(`
            SELECT 
              COALESCE(COUNT(fi.id), 0) as "totalInvitations",
              COALESCE(SUM(CASE WHEN fi.response_status = 'ACCEPTED' THEN 1 ELSE 0 END), 0) as "acceptedCount",
              COALESCE(SUM(CASE WHEN fi.response_status = 'DECLINED' THEN 1 ELSE 0 END), 0) as "declinedCount",
              COALESCE(SUM(CASE WHEN fi.response_status = 'PENDING' THEN 1 ELSE 0 END), 0) as "pendingCount",
              COALESCE(SUM(CASE WHEN fi.response_status = 'TENTATIVE' THEN 1 ELSE 0 END), 0) as "tentativeCount"
            FROM faculty_invitations fi
            WHERE fi.event_id = $1
          `, [event.id]);
          
          const stats = statsResult.rows[0] || {
            totalInvitations: 0,
            acceptedCount: 0,
            declinedCount: 0,
            pendingCount: 0,
            tentativeCount: 0
          };
          
          return {
            ...event,
            totalInvitations: parseInt(stats.totalInvitations) || 0,
            acceptedCount: parseInt(stats.acceptedCount) || 0,
            declinedCount: parseInt(stats.declinedCount) || 0,
            pendingCount: parseInt(stats.pendingCount) || 0,
            tentativeCount: parseInt(stats.tentativeCount) || 0
          };
        } catch (error) {
          console.error('Error getting stats for event:', event.id, error);
          return {
            ...event,
            totalInvitations: 0,
            acceptedCount: 0,
            declinedCount: 0,
            pendingCount: 0,
            tentativeCount: 0
          };
        }
      })
    );
    
    console.log('📊 Events with stats prepared:', eventsWithStats.length);
    return eventsWithStats;
    
  } catch (error) {
    console.error('Error fetching events with invitation stats:', error);
    throw error;
  }
}

// Get sessions for a specific event with invitation statistics
export async function getSessionsWithInvitationStats(eventId: string): Promise<SessionWithStats[]> {
  try {
    console.log('🔍 Fetching sessions for event:', eventId);
    
    const result = await query(`
      SELECT 
        cs.id,
        cs.title,
        cs.start_time as "startTime",
        cs.end_time as "endTime",
        COALESCE(h.name, 'TBD') as "hallName"
      FROM conference_sessions cs
      LEFT JOIN halls h ON cs.hall_id = h.id
      WHERE cs.event_id = $1
      ORDER BY cs.start_time ASC
    `, [eventId]);
    
    console.log('📊 Sessions found:', result.rows.length);
    
    // Add invitation stats for each session
    const sessionsWithStats = await Promise.all(
      result.rows.map(async (session) => {
        try {
          const statsResult = await query(`
            SELECT 
              COALESCE(COUNT(fi.id), 0) as "totalInvitations",
              COALESCE(SUM(CASE WHEN fi.response_status = 'ACCEPTED' THEN 1 ELSE 0 END), 0) as "acceptedCount",
              COALESCE(SUM(CASE WHEN fi.response_status = 'DECLINED' THEN 1 ELSE 0 END), 0) as "declinedCount",
              COALESCE(SUM(CASE WHEN fi.response_status = 'PENDING' THEN 1 ELSE 0 END), 0) as "pendingCount",
              COALESCE(SUM(CASE WHEN fi.response_status = 'TENTATIVE' THEN 1 ELSE 0 END), 0) as "tentativeCount"
            FROM faculty_invitations fi
            WHERE fi.session_id = $1
          `, [session.id]);
          
          const stats = statsResult.rows[0] || {
            totalInvitations: 0,
            acceptedCount: 0,
            declinedCount: 0,
            pendingCount: 0,
            tentativeCount: 0
          };
          
          return {
            ...session,
            totalInvitations: parseInt(stats.totalInvitations) || 0,
            acceptedCount: parseInt(stats.acceptedCount) || 0,
            declinedCount: parseInt(stats.declinedCount) || 0,
            pendingCount: parseInt(stats.pendingCount) || 0,
            tentativeCount: parseInt(stats.tentativeCount) || 0
          };
        } catch (error) {
          console.error('Error getting stats for session:', session.id, error);
          return {
            ...session,
            totalInvitations: 0,
            acceptedCount: 0,
            declinedCount: 0,
            pendingCount: 0,
            tentativeCount: 0
          };
        }
      })
    );
    
    return sessionsWithStats;
  } catch (error) {
    console.error('Error fetching sessions with invitation stats:', error);
    throw error;
  }
}

// Get faculty by event and response status
export async function getFacultyByEventAndStatus(
  eventId: string, 
  status: 'ACCEPTED' | 'DECLINED' | 'PENDING' | 'TENTATIVE'
): Promise<ApprovalFaculty[]> {
  try {
    const result = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COALESCE(u.institution, '') as institution,
        COALESCE(u.designation, '') as designation,
        COALESCE(u.specialization, '') as specialization,
        COALESCE(u.phone, '') as phone,
        cs.id as "sessionId",
        cs.title as "sessionTitle",
        e.id as "eventId",
        e.name as "eventName",
        fi.response_status as "responseStatus",
        fi.responded_at as "responseDate",
        COALESCE(ir.message, fi.response_message) as "responseMessage",
        ir.message as "rejectionReason",
        fi.sent_at as "invitationDate",
        CASE 
          WHEN fi.response_status = 'PENDING' 
          THEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - fi.sent_at))::integer
          ELSE NULL
        END as "daysPending"
      FROM faculty_invitations fi
      JOIN users u ON fi.faculty_id = u.id
      JOIN events e ON fi.event_id = e.id
      LEFT JOIN conference_sessions cs ON fi.session_id = cs.id
      LEFT JOIN invitation_responses ir ON fi.id = ir.invitation_id
      WHERE fi.event_id = $1 
        AND fi.response_status = $2
      ORDER BY u.name ASC
    `, [eventId, status]);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching faculty by event and status:', error);
    throw error;
  }
}

// Get faculty by session and response status
export async function getFacultyBySessionAndStatus(
  sessionId: string, 
  status: 'ACCEPTED' | 'DECLINED' | 'PENDING' | 'TENTATIVE'
): Promise<ApprovalFaculty[]> {
  try {
    const result = await query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        COALESCE(u.institution, '') as institution,
        COALESCE(u.designation, '') as designation,
        COALESCE(u.specialization, '') as specialization,
        COALESCE(u.phone, '') as phone,
        cs.id as "sessionId",
        cs.title as "sessionTitle",
        e.id as "eventId",
        e.name as "eventName",
        fi.response_status as "responseStatus",
        fi.responded_at as "responseDate",
        COALESCE(ir.message, fi.response_message) as "responseMessage",
        ir.message as "rejectionReason",
        fi.sent_at as "invitationDate",
        CASE 
          WHEN fi.response_status = 'PENDING' 
          THEN EXTRACT(DAY FROM (CURRENT_TIMESTAMP - fi.sent_at))::integer
          ELSE NULL
        END as "daysPending"
      FROM faculty_invitations fi
      JOIN users u ON fi.faculty_id = u.id
      JOIN events e ON fi.event_id = e.id
      JOIN conference_sessions cs ON fi.session_id = cs.id
      LEFT JOIN invitation_responses ir ON fi.id = ir.invitation_id
      WHERE fi.session_id = $1 
        AND fi.response_status = $2
      ORDER BY u.name ASC
    `, [sessionId, status]);
    
    return result.rows;
  } catch (error) {
    console.error('Error fetching faculty by session and status:', error);
    throw error;
  }
}

// Get approval statistics for an event
export async function getEventApprovalStats(eventId: string) {
  try {
    const result = await query(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN response_status = 'ACCEPTED' THEN 1 ELSE 0 END) as accepted,
        SUM(CASE WHEN response_status = 'DECLINED' THEN 1 ELSE 0 END) as declined,
        SUM(CASE WHEN response_status = 'PENDING' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN response_status = 'TENTATIVE' THEN 1 ELSE 0 END) as tentative
      FROM faculty_invitations 
      WHERE event_id = $1
    `, [eventId]);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching event approval stats:', error);
    throw error;
  }
}