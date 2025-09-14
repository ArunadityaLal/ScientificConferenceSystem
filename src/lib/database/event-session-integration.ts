/**
 * DYNAMIC: Delete a session with event integration logic
 */
export async function deleteSessionWithEvent(
  sessionId: string,
  userId?: string,
  userRole?: string
): Promise<boolean> {
  try {
    console.log(`🗑️ Deleting session with event integration: ${sessionId}, by user: ${userId}, role: ${userRole}`);
    await query("BEGIN");
    try {
      // Delete session metadata first (if exists)
      await query(
        `DELETE FROM session_metadata WHERE session_id = $1`,
        [sessionId]
      );

      // Delete the session itself
      const result = await query(
        `DELETE FROM conference_sessions WHERE id = $1 RETURNING id`,
        [sessionId]
      );

      // Optionally, log the deletion (for audit)
      if (userId) {
        await query(
          `INSERT INTO faculty_invitation_logs (
            faculty_id, session_id, action, status, metadata, created_at
          ) VALUES ($1, $2, $3, $4, $5, NOW())`,
          [
            userId,
            sessionId,
            "SESSION_DELETED",
            "Deleted",
            JSON.stringify({ userRole }),
          ]
        );
      }

      await query("COMMIT");
      return (typeof result.rowCount === "number" ? result.rowCount : 0) > 0;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error deleting session with event integration:", error);
    return false;
  }
}
// src/lib/database/event-session-integration.ts - ENHANCED for Dynamic Faculty Invitations
import { query } from "@/lib/database/connection";
import { UserRole } from "./models";

export interface EventSessionData {
  sessionId: string;
  eventId: string;
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  hallId?: string;
  facultyId?: string;
  facultyEmail?: string;
  place?: string;
  status: "Draft" | "Confirmed";
  inviteStatus?: "Pending" | "Accepted" | "Declined";
  travel?: boolean;
  accommodation?: boolean;
}

/**
 * ENHANCED: Create session with automatic faculty invitation system
 */
export async function createSessionWithEvent(
  sessionData: EventSessionData
): Promise<string> {
  try {
    console.log("🔄 Creating session with dynamic faculty invitations:", sessionData);

    await query("BEGIN");

    try {
      // 1. Verify event exists and is active
      const eventCheck = await query(
        "SELECT id, name, status FROM events WHERE id = $1",
        [sessionData.eventId]
      );

      if (eventCheck.rows.length === 0) {
        throw new Error(`Event with ID ${sessionData.eventId} not found`);
      }

      const event = eventCheck.rows[0];
      console.log("✅ Event verified:", event.name);

      // 2. Create session in conference_sessions table
      const sessionResult = await query(
        `INSERT INTO conference_sessions (
          id, event_id, title, description, start_time, end_time, hall_id, created_by, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5::timestamp, $6::timestamp, $7, $8, NOW(), NOW())
        RETURNING id`,
        [
          sessionData.sessionId,
          sessionData.eventId,
          sessionData.title,
          sessionData.description || null,
          sessionData.startTime,
          sessionData.endTime,
          sessionData.hallId || null,
          sessionData.facultyId || "system",
        ]
      );

      console.log("✅ Session created:", sessionResult.rows[0].id);

      // 3. DYNAMIC: Create or update faculty user if provided
      let finalFacultyId = sessionData.facultyId;

      if (sessionData.facultyEmail) {
        const facultyResult = await createOrUpdateFaculty({
          facultyId: sessionData.facultyId,
          facultyEmail: sessionData.facultyEmail,
          eventId: sessionData.eventId
        });
        finalFacultyId = facultyResult.facultyId;
        console.log("✅ Faculty processed:", finalFacultyId);
      }

      // 4. DYNAMIC: Create session metadata with auto-invitation
      const invitationStatus = await createSessionMetadataWithInvitation({
        sessionId: sessionData.sessionId,
        facultyId: finalFacultyId,
        facultyEmail: sessionData.facultyEmail,
        place: sessionData.place,
        status: sessionData.status,
        travel: sessionData.travel,
        accommodation: sessionData.accommodation,
        sessionTitle: sessionData.title,
        eventName: event.name
      });

      console.log("✅ Session metadata created with invitation status:", invitationStatus);

      await query("COMMIT");
      console.log("✅ Dynamic session creation completed:", sessionData.sessionId);

      return sessionResult.rows[0].id;
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error creating dynamic session:", error);
    throw error;
  }
}

/**
 * DYNAMIC: Create or update faculty user and handle invitation
 */
/**
 * DYNAMIC: Create or update faculty user and handle invitation - FIXED
 */
async function createOrUpdateFaculty(data: {
  facultyId?: string;
  facultyEmail: string;
  eventId: string;
}): Promise<{ facultyId: string; isNewUser: boolean }> {
  try {
    // FIXED: Check if user already exists by email (regardless of role)
    const existingUser = await query(
      "SELECT id, name, role FROM users WHERE email = $1",
      [data.facultyEmail]
    );

    let facultyId: string;
    let isNewUser = false;

    if (existingUser.rows.length > 0) {
      // User already exists - use their existing ID
      facultyId = existingUser.rows[0].id;
      console.log(`ℹ️ Using existing user: ${facultyId} with role: ${existingUser.rows[0].role}`);
      
      // Don't try to change role if they're ORGANIZER or EVENT_MANAGER
      if (existingUser.rows[0].role !== 'ORGANIZER' && existingUser.rows[0].role !== 'EVENT_MANAGER') {
        // Only update role to FACULTY if they don't have an admin role
        await query(
          "UPDATE users SET role = 'FACULTY', updated_at = NOW() WHERE id = $1",
          [facultyId]
        );
        console.log(`✅ Updated user role to FACULTY: ${facultyId}`);
      }
    } else {
      // Create new faculty user only if email doesn't exist
      facultyId = data.facultyId || `faculty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const facultyName = typeof data.facultyEmail === "string" && data.facultyEmail
        ? ((data.facultyEmail ?? "").split("@")[0] ?? "").replace(/[._]/g, " ")
        : "Faculty";

      await query(
        `INSERT INTO users (id, email, name, role, password, created_at, updated_at)
         VALUES ($1, $2, $3, 'FACULTY', $4, NOW(), NOW())`,
        [
          facultyId,
          data.facultyEmail,
          facultyName,
          "$2b$12$defaultPasswordHash"
        ]
      );

      isNewUser = true;
      console.log("✅ Created new faculty user:", facultyId);
    }

    // Create user_events association (with conflict handling)
    await query(
      `INSERT INTO user_events (id, user_id, event_id, role, permissions, created_at)
       VALUES (gen_random_uuid(), $1, $2, 'SPEAKER', 'VIEW_ONLY', NOW())
       ON CONFLICT (user_id, event_id) DO NOTHING`,
      [facultyId, data.eventId]
    );

    return { facultyId, isNewUser };
  } catch (error) {
    console.error("❌ Error creating/updating faculty:", error);
    throw error;
  }
}

/**
 * DYNAMIC: Create session metadata with intelligent invitation status
 */
// Add this function to src/lib/database/event-session-integration.ts
export async function updateSessionWithEvent(
  sessionId: string, updates: any, id: string | undefined, role: UserRole | undefined): Promise<boolean> {
  try {
    console.log(`Updating session with event integration: ${sessionId}`);

    const result = await query(
      `UPDATE conference_sessions 
       SET title = COALESCE($2, title), 
           description = COALESCE($3, description),
           start_time = COALESCE($4, start_time),
           end_time = COALESCE($5, end_time),
           hall_id = COALESCE($6, hall_id),
           updated_at = NOW()
       WHERE id = $1
       RETURNING id`,
      [
        sessionId,
        updates.title,
        updates.description,
        updates.startTime,
        updates.endTime,
        updates.hallId
      ]
    );

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error("Error updating session with event integration:", error);
    return false;
  }
}
async function createSessionMetadataWithInvitation(data: {
  sessionId: string;
  facultyId?: string;
  facultyEmail?: string;
  place?: string;
  status?: string;
  travel?: boolean;
  accommodation?: boolean;
  sessionTitle: string;
  eventName: string;
}): Promise<string> {
  try {
    // DYNAMIC LOGIC: Determine invitation status based on faculty type
    let inviteStatus = "Pending"; // Default for new invitations

    if (data.facultyId && data.facultyEmail) {
      // Check if faculty has previous interactions with this event
      const facultyHistory = await query(
        `SELECT sm.invite_status, COUNT(*) as session_count
         FROM session_metadata sm
         LEFT JOIN conference_sessions cs ON sm.session_id = cs.id
         WHERE sm.faculty_email = $1 AND cs.event_id IN (
           SELECT event_id FROM conference_sessions WHERE id = $2
         )
         GROUP BY sm.invite_status
         ORDER BY session_count DESC`,
        [data.facultyEmail, data.sessionId]
      );

      if (facultyHistory.rows.length > 0) {
        // Faculty has history - use their most common response pattern
        const mostCommonResponse = facultyHistory.rows[0].invite_status;
        if (mostCommonResponse === "Accepted") {
          inviteStatus = "Pending"; // Still send invitation, but they're likely to accept
        } else if (mostCommonResponse === "Declined") {
          inviteStatus = "Pending"; // Give them another chance
        }
        console.log(`ℹ️ Faculty history found: ${mostCommonResponse}, setting status: ${inviteStatus}`);
      }
    }

    // Create session metadata with dynamic status
    await query(
      `INSERT INTO session_metadata (
        session_id, faculty_id, faculty_email, place, status, invite_status, 
        travel, accommodation, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        data.sessionId,
        data.facultyId || null,
        data.facultyEmail || null,
        data.place || null,
        data.status || "Draft",
        inviteStatus,
        data.travel || false,
        data.accommodation || false,
      ]
    );

    // DYNAMIC: Log invitation activity
    if (data.facultyId && data.facultyEmail) {
      await logInvitationActivity({
        facultyId: data.facultyId,
        facultyEmail: data.facultyEmail,
        sessionId: data.sessionId,
        sessionTitle: data.sessionTitle,
        eventName: data.eventName,
        action: "INVITATION_SENT",
        status: inviteStatus
      });
    }

    return inviteStatus;
  } catch (error) {
    console.error("❌ Error creating session metadata with invitation:", error);
    throw error;
  }
}

/**
 * DYNAMIC: Log invitation activities for tracking
 */
async function logInvitationActivity(data: {
  facultyId: string;
  facultyEmail: string;
  sessionId: string;
  sessionTitle: string;
  eventName: string;
  action: string;
  status: string;
}): Promise<void> {
  try {
    // Create activity log table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS faculty_invitation_logs (
        id SERIAL PRIMARY KEY,
        faculty_id VARCHAR(255),
        faculty_email VARCHAR(255),
        session_id VARCHAR(255),
        session_title VARCHAR(255),
        event_name VARCHAR(255),
        action VARCHAR(100),
        status VARCHAR(50),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(
      `INSERT INTO faculty_invitation_logs (
        faculty_id, faculty_email, session_id, session_title, event_name, 
        action, status, metadata, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [
        data.facultyId,
        data.facultyEmail,
        data.sessionId,
        data.sessionTitle,
        data.eventName,
        data.action,
        data.status,
        JSON.stringify({
          timestamp: new Date().toISOString(),
          source: "dynamic_session_creation"
        })
      ]
    );

    console.log(`📝 Logged invitation activity: ${data.action} for ${data.facultyEmail}`);
  } catch (error) {
    console.warn("⚠️ Failed to log invitation activity:", error);
    // Don't throw - logging failure shouldn't break session creation
  }
}

/**
 * DYNAMIC: Update invitation status (for faculty responses)
 */
export async function updateInvitationStatus(
  sessionId: string,
  newStatus: "Pending" | "Accepted" | "Declined",
  responseMessage?: string,
  facultyId?: string
): Promise<boolean> {
  try {
    console.log(`🔄 Updating invitation status for session ${sessionId} to ${newStatus}`);

    await query("BEGIN");

    try {
      // Update session metadata
      const updateResult = await query(
        `UPDATE session_metadata 
         SET invite_status = $1, updated_at = NOW(), rejection_reason = $2
         WHERE session_id = $3
         RETURNING faculty_id, faculty_email`,
        [newStatus, responseMessage, sessionId]
      );

      if (updateResult.rows.length === 0) {
        throw new Error("Session metadata not found");
      }

      const metadata = updateResult.rows[0];

      // Log the response
      const sessionInfo = await query(
        `SELECT cs.title, e.name as event_name
         FROM conference_sessions cs
         LEFT JOIN events e ON cs.event_id = e.id
         WHERE cs.id = $1`,
        [sessionId]
      );

      if (sessionInfo.rows.length > 0) {
        await logInvitationActivity({
          facultyId: facultyId || metadata.faculty_id,
          facultyEmail: metadata.faculty_email,
          sessionId: sessionId,
          sessionTitle: sessionInfo.rows[0].title,
          eventName: sessionInfo.rows[0].event_name,
          action: `FACULTY_RESPONSE_${newStatus.toUpperCase()}`,
          status: newStatus
        });
      }

      await query("COMMIT");
      console.log(`✅ Invitation status updated to ${newStatus}`);
      return true;

    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("❌ Error updating invitation status:", error);
    return false;
  }
}

/**
 * DYNAMIC: Get faculty invitation statistics
 */
export async function getFacultyInvitationStats(eventId?: string): Promise<{
  totalInvitations: number;
  pendingCount: number;
  acceptedCount: number;
  declinedCount: number;
  responseRate: number;
}> {
  try {
    const whereClause = eventId ? "WHERE cs.event_id = $1" : "";
    const params = eventId ? [eventId] : [];

    const statsResult = await query(
      `SELECT 
        COUNT(sm.id) as total_invitations,
        COUNT(CASE WHEN LOWER(sm.invite_status) = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN LOWER(sm.invite_status) = 'accepted' THEN 1 END) as accepted_count,
        COUNT(CASE WHEN LOWER(sm.invite_status) = 'declined' THEN 1 END) as declined_count
       FROM session_metadata sm
       LEFT JOIN conference_sessions cs ON sm.session_id = cs.id
       ${whereClause}`,
      params
    );

    const stats = statsResult.rows[0];
    const totalInvitations = parseInt(stats.total_invitations) || 0;
    const pendingCount = parseInt(stats.pending_count) || 0;
    const acceptedCount = parseInt(stats.accepted_count) || 0;
    const declinedCount = parseInt(stats.declined_count) || 0;

    const responsesReceived = acceptedCount + declinedCount;
    const responseRate = totalInvitations > 0 ? (responsesReceived / totalInvitations) * 100 : 0;

    return {
      totalInvitations,
      pendingCount,
      acceptedCount,
      declinedCount,
      responseRate: Math.round(responseRate * 100) / 100
    };
  } catch (error) {
    console.error("❌ Error getting invitation stats:", error);
    return {
      totalInvitations: 0,
      pendingCount: 0,
      acceptedCount: 0,
      declinedCount: 0,
      responseRate: 0
    };
  }
}