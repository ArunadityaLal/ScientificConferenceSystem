// src/app/api/sessions/route.ts - UPDATED with Dynamic Faculty Invitations
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  getAllSessions,
  getFaculties,
  getRooms,
  getSessionById,
} from "@/lib/database/session-queries";
import { createSessionWithEvent } from "@/lib/database/event-session-integration";
import { sendInviteEmail } from "../_utils/session-email";

// Helper function to parse datetime-local strings consistently
function parseLocalDateTime(dateTimeStr: string) {
  if (!dateTimeStr) return null;

  try {
    if (
      dateTimeStr.includes("T") &&
      !dateTimeStr.includes("Z") &&
      dateTimeStr.length <= 19
    ) {
      return dateTimeStr.endsWith(":00") ? dateTimeStr : dateTimeStr + ":00";
    } else {
      return new Date(dateTimeStr).toISOString();
    }
  } catch (error) {
    console.error("Error parsing datetime:", error);
    return null;
  }
}

// Helper function to check for scheduling conflicts
async function checkSessionConflicts(
  sessionData: {
    facultyId: string;
    roomId: string;
    startTime: string;
    endTime: string;
  },
  excludeSessionId?: string
) {
  const allSessions = await getAllSessions();
  const conflicts = [];

  const newStart = new Date(sessionData.startTime);
  const newEnd = new Date(sessionData.endTime);

  for (const existingSession of allSessions) {
    if (excludeSessionId && existingSession.id === excludeSessionId) {
      continue;
    }

    const existingStart = new Date(existingSession.startTime);
    const existingEnd = new Date(existingSession.endTime);

    const hasTimeOverlap = newStart < existingEnd && newEnd > existingStart;

    if (hasTimeOverlap) {
      if (existingSession.facultyId === sessionData.facultyId) {
        conflicts.push({
          id: existingSession.id,
          title: existingSession.title,
          facultyId: existingSession.facultyId,
          roomId: existingSession.hallId,
          startTime: existingSession.startTime,
          endTime: existingSession.endTime,
          type: "faculty",
          message: `Faculty is already scheduled for "${existingSession.title}" during this time`,
          sessionTitle: existingSession.title,
        });
      }

      if (existingSession.hallId === sessionData.roomId) {
        conflicts.push({
          id: existingSession.id,
          title: existingSession.title,
          facultyId: existingSession.facultyId,
          roomId: existingSession.hallId,
          startTime: existingSession.startTime,
          endTime: existingSession.endTime,
          type: "room",
          message: `Room is already booked for "${existingSession.title}" during this time`,
          sessionTitle: existingSession.title,
        });
      }
    }
  }

  return conflicts;
}

// GET: list all sessions enriched for listing pages
export async function GET() {
  try {
    const sessions = await getAllSessions();
    const faculties = await getFaculties();
    const rooms = await getRooms();

    const enriched = sessions.map((s) => {
      const faculty = faculties.find((f) => f.id === s.facultyId);
      const room = rooms.find((r) => r.id === s.hallId);

      let durationMin = 0;
      try {
        const start = new Date(s.startTime);
        const end = new Date(s.endTime);
        durationMin = Math.max(
          0,
          Math.round((end.getTime() - start.getTime()) / 60000)
        );
      } catch (error) {
        // Handle invalid dates gracefully
      }

      return {
        ...s,
        facultyName: s.facultyName || faculty?.name || "Unknown Faculty",
        roomName: s.roomName || room?.name || s.hallId || "Unknown Room",
        roomId: s.hallId,
        email: s.facultyEmail || faculty?.email || "",
        duration: durationMin > 0 ? `${durationMin} minutes` : "",
        formattedStartTime: s.startTime,
        formattedEndTime: s.endTime,
        // ENHANCED: Add invitation status for UI
        eventName: s.eventName || "Unknown Event",
        invitationStatus: s.inviteStatus || "Pending",
        canTrack: !!(s.facultyEmail && s.inviteStatus),
      };
    });
    console.log("API Response first session:", enriched[0]); // Debug line
      // ADD THIS DEBUG LINE HERE
    console.log("🔍 Sessions data before sending:", enriched.map(s => ({
      title: s.title,
      eventName: s.eventName,
      originalEventName: s.eventName
    })));
    return NextResponse.json(
      { success: true, data: { sessions: enriched }, count: enriched.length },
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("❌ Error fetching sessions:", e);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: e?.message || "",
      },
      { status: 500 }
    );
  }
}

// POST: create a session with DYNAMIC faculty invitations
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (!contentType.includes("multipart/form-data")) {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported content type. Use multipart/form-data",
        },
        { status: 400 }
      );
    }

    const formData = await req.formData();

    // Required fields
    const title = formData.get("title")?.toString() || "";
    const facultyId = formData.get("facultyId")?.toString() || "";
    const email = formData.get("email")?.toString() || "";
    const place = formData.get("place")?.toString() || "";
    const roomId = formData.get("roomId")?.toString() || "";
    const description = formData.get("description")?.toString() || "";
    const startTime = formData.get("startTime")?.toString() || "";
    const endTime = formData.get("endTime")?.toString() || "";
    const eventId = formData.get("eventId")?.toString() || "default-conference-2025";
    const status = (formData.get("status")?.toString() as "Draft" | "Confirmed") || "Draft";
    
    // ENHANCED: Dynamic invitation status (remove manual override)
    // const inviteStatus = "Pending"; // Always start as Pending for dynamic system
    
    const travel = formData.get("travel")?.toString();
    const accommodation = formData.get("accommodation")?.toString();

    const travelRequired = travel === "yes";
    const accommodationRequired = accommodation === "yes";

    console.log("📋 Creating session with DYNAMIC invitations:", {
      title,
      facultyId,
      email,
      place,
      roomId,
      startTime,
      endTime,
      eventId,
      status,
      travel: travelRequired,
      accommodation: accommodationRequired,
    });

    // Validation
    if (!title || !facultyId || !email || !place || !roomId || !description || !startTime) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Parse and validate time
    let finalStartTime: string;
    let finalEndTime: string;

    try {
      const parsedStartTime = parseLocalDateTime(startTime);
      const parsedEndTime = endTime ? parseLocalDateTime(endTime) : null;

      if (!parsedStartTime) {
        throw new Error("Invalid start time format");
      }

      finalStartTime = parsedStartTime;

      if (!parsedEndTime) {
        const startDate = new Date(finalStartTime);
        const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
        finalEndTime = endDate.toISOString();
      } else {
        finalEndTime = parsedEndTime;
      }

      const start = new Date(finalStartTime);
      const end = new Date(finalEndTime);

      if (end <= start) {
        return NextResponse.json(
          { success: false, error: "End time must be after start time" },
          { status: 400 }
        );
      }

      const durationMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
      if (durationMinutes < 15) {
        return NextResponse.json(
          { success: false, error: "Session must be at least 15 minutes long" },
          { status: 400 }
        );
      }

      console.log("Time validation passed:", {
        finalStart: finalStartTime,
        finalEnd: finalEndTime,
        duration: `${durationMinutes} minutes`,
      });
    } catch (timeError) {
      console.error("Time parsing error:", timeError);
      return NextResponse.json(
        { success: false, error: "Invalid time format" },
        { status: 400 }
      );
    }

    // Check for conflicts
    const conflictOnly = formData.get("conflictOnly")?.toString() === "true";
    const overwriteConflicts = formData.get("overwriteConflicts")?.toString() === "true";

    const conflicts = await checkSessionConflicts({
      facultyId,
      roomId,
      startTime: finalStartTime,
      endTime: finalEndTime,
    });

    if (conflictOnly) {
      return NextResponse.json({
        success: true,
        conflicts,
        hasConflicts: conflicts.length > 0,
      });
    }

    if (conflicts.length > 0 && !overwriteConflicts) {
      return NextResponse.json(
        {
          success: false,
          error: "Scheduling conflicts detected",
          conflicts,
          hasConflicts: true,
        },
        { status: 409 }
      );
    }

    // Generate session ID
    const sessionId = randomUUID();

    // ENHANCED: Create session with DYNAMIC faculty invitation system
    const sessionData = {
      sessionId,
      eventId,
      title,
      description,
      startTime: finalStartTime,
      endTime: finalEndTime,
      hallId: roomId,
      facultyId,
      facultyEmail: email,
      place,
      status,
      inviteStatus: "Pending" as "Pending", // Always start as Pending for dynamic tracking
      travel: travelRequired,
      accommodation: accommodationRequired,
    };

    console.log("Creating session with DYNAMIC faculty invitation system:", sessionData);

    // Use enhanced createSessionWithEvent function
    const createdSessionId = await createSessionWithEvent(sessionData);

    // Verify session was created
    const verify = await getSessionById(createdSessionId);
    if (!verify) {
      return NextResponse.json(
        { success: false, error: "Failed to save session to database" },
        { status: 500 }
      );
    }

    console.log("Session verified with dynamic invitation tracking:", verify.inviteStatus);

    // Get faculty and room info for response
    const faculties = await getFaculties();
    const rooms = await getRooms();
    const faculty = faculties.find((f) => f.id === facultyId);
    const room = rooms.find((r) => r.id === roomId);

    // Prepare enhanced session data for response
    const sessionForResponse = {
      id: createdSessionId,
      title,
      facultyId,
      email,
      place,
      roomId,
      roomName: room?.name || roomId,
      description,
      startTime: finalStartTime,
      endTime: finalEndTime,
      status,
      inviteStatus: "Pending" as "Pending", // Explicitly type as "Pending"
      eventId,
      // ENHANCED: Add invitation tracking info
      invitationSent: true,
      canTrackResponse: true,
      responseUrl: `/api/faculty/respond?sessionId=${createdSessionId}&facultyEmail=${email}`,
      travel: travelRequired,
      accommodation: accommodationRequired,
    };

    // ENHANCED: Send invitation email with response tracking
    try {
      const result = await sendInviteEmail(
        sessionForResponse,
        faculty?.name || "Faculty Member",
        email
      );

      if (!result.ok) {
        console.warn("Email failed but session created with dynamic tracking:", result.message);
        return NextResponse.json(
          {
            success: true,
            emailStatus: "failed",
            warning: "Session created with invitation tracking, but email could not be sent",
            data: {
              ...sessionForResponse,
              facultyName: faculty?.name,
              roomName: room?.name,
              invitationTracking: "enabled",
            },
          },
          { status: 201 }
        );
      }

      console.log("Session created successfully with dynamic invitation system");
      return NextResponse.json(
        {
          success: true,
          emailStatus: "sent",
          message: "Session created with dynamic faculty invitation tracking",
          data: {
            ...sessionForResponse,
            facultyName: faculty?.name,
            roomName: room?.name,
            invitationTracking: "enabled",
            emailSent: true,
          },
        },
        { status: 201 }
      );
    } catch (emailError: any) {
      console.error("Email sending error:", emailError);
      return NextResponse.json(
        {
          success: true,
          emailStatus: "error",
          warning: "Session created with invitation tracking, but email failed: " + (emailError?.message || "Unknown error"),
          data: {
            ...sessionForResponse,
            facultyName: faculty?.name,
            roomName: room?.name,
            invitationTracking: "enabled",
          },
        },
        { status: 201 }
      );
    }
  } catch (err: any) {
    console.error("Error creating session with dynamic invitations:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: err?.message || "",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";