import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/connection";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email parameter is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Fetching sessions for faculty email:", email);

    // First, get the faculty ID from the email
    const facultyResult = await query(
      "SELECT id FROM users WHERE email = $1 AND role = 'FACULTY'",
      [email]
    );

    if (facultyResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Faculty not found" },
        { status: 404 }
      );
    }

    const facultyId = facultyResult.rows[0].id;
    console.log("👤 Faculty ID for sessions lookup:", facultyId);

    // Query sessions using faculty ID instead of email, and only show accepted sessions
    const sessionsResult = await query(
      `SELECT 
        cs.id,
        cs.title,
        cs.description,
        cs.start_time as "startTime",
        cs.end_time as "endTime",
        cs.created_at,
        h.name as room_name,
        sm.id as metadata_id,  
        sm.faculty_id,
        sm.place,
        sm.status,
        sm.invite_status,
        sm.rejection_reason,
        sm.suggested_topic,
        sm.suggested_time_start,
        sm.suggested_time_end,
        sm.optional_query,
        e.name as event_name,
        e.location as event_location
      FROM conference_sessions cs
      LEFT JOIN session_metadata sm ON cs.id = sm.session_id
      LEFT JOIN halls h ON cs.hall_id = h.id
      LEFT JOIN events e ON cs.event_id = e.id
      WHERE sm.faculty_id = $1 AND sm.invite_status = 'Accepted'
      ORDER BY cs.start_time ASC`,
      [facultyId]
    );

    const sessions = sessionsResult.rows;
    console.log(`📋 Found ${sessions.length} accepted sessions for faculty`);

    // Format sessions for faculty dashboard
    const formattedSessions = sessions.map((session) => {
      let formattedTime = "";
      let daysUntil = 0;

      if (session.startTime && session.endTime) {
        const startDate = new Date(session.startTime);
        const endDate = new Date(session.endTime);
        const now = new Date();

        // Calculate days until session
        const timeDiff = startDate.getTime() - now.getTime();
        daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Format time display
        formattedTime = `${startDate.toLocaleDateString()} ${startDate.toLocaleTimeString(
          [],
          {
            hour: "2-digit",
            minute: "2-digit",
          }
        )} - ${endDate.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })}`;
      }

      return {
        id: session.metadata_id, // Use session metadata ID for document filtering
        title: session.title || "Untitled Session",
        description: session.description,
        place: session.place,
        roomName: session.room_name || "TBD",
        status: session.status || "Draft",
        inviteStatus: session.invite_status || "Pending",
        rejectionReason: session.rejection_reason,
        suggestedTopic: session.suggested_topic,
        suggestedTimeStart: session.suggested_time_start,
        suggestedTimeEnd: session.suggested_time_end,
        optionalQuery: session.optional_query,
        eventName: session.event_name,
        eventLocation: session.event_location,
        formattedTime,
        formattedStartTime: session.startTime
          ? new Date(session.startTime).toLocaleString()
          : "",
        formattedEndTime: session.endTime
          ? new Date(session.endTime).toLocaleString()
          : "",
        daysUntil,
        sessionStatus: session.status || "Draft",
      };
    });

    console.log(
      `✅ Found ${formattedSessions.length} sessions for faculty:`,
      email
    );

    return NextResponse.json({
      success: true,
      data: {
        sessions: formattedSessions,
      },
    });
  } catch (error: any) {
    console.error("❌ Error fetching faculty sessions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";