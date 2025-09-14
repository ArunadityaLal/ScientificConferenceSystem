import { NextRequest, NextResponse } from "next/server";
import {
  getSessionById,
  updateSessionMetadata,
  deleteSession,
  getFaculties,
  getRooms,
} from "@/lib/database/session-queries";
import {
  updateSessionWithEvent,
  deleteSessionWithEvent,
} from "@/lib/database/event-session-integration";
import { sendUpdateEmail } from "../../_utils/session-email";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    console.log("🔍 Fetching session:", sessionId);

    const session = await getSessionById(sessionId);

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: session,
    });
  } catch (error: any) {
    console.error("❌ Error fetching session:", error);
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = params.sessionId;
    const body = await req.json();

    console.log("🔄 Updating session:", sessionId, body);

    // Get current session
    const currentSession = await getSessionById(sessionId);
    if (!currentSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    // Update using event-session integration if user info available
    if (session?.user) {
      await updateSessionWithEvent(
        sessionId,
        body,
        session.user.id,
        session.user.role
      );
    } else {
      // Fallback to direct metadata update
      await updateSessionMetadata(sessionId, body);
    }

    // Get updated session
    const updatedSession = await getSessionById(sessionId);
    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: "Failed to retrieve updated session" },
        { status: 500 }
      );
    }

    // Send update email if significant changes were made
    if (body.startTime || body.endTime || body.place || body.roomId) {
      try {
        const faculties = await getFaculties();
        const rooms = await getRooms();
        const faculty = faculties.find(
          (f) => f.id === updatedSession.facultyId
        );
        const room = rooms.find((r) => r.id === updatedSession.hallId);

        if (updatedSession.facultyEmail && faculty) {
          const sessionForEmail = {
            id: updatedSession.id,
            title: updatedSession.title,
            facultyId: updatedSession.facultyId || "",
            email: updatedSession.facultyEmail,
            place: updatedSession.place || "",
            roomId: updatedSession.hallId || "",
            roomName: room?.name || updatedSession.hallId || "",
            description: updatedSession.description || "",
            startTime: updatedSession.startTime,
            endTime: updatedSession.endTime,
            status: updatedSession.status as "Draft" | "Confirmed",
            inviteStatus: updatedSession.inviteStatus as
              | "Pending"
              | "Accepted"
              | "Declined",
          };

          await sendUpdateEmail(
            sessionForEmail,
            faculty.name,
            room?.name || updatedSession.hallId || "Unknown Room"
          );
        }
      } catch (emailError) {
        console.warn("⚠️ Failed to send update email:", emailError);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Session updated successfully",
      data: updatedSession,
    });
  } catch (error: any) {
    console.error("❌ Error updating session:", error);
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const sessionId = params.sessionId;

    console.log("🗑️ Deleting session:", sessionId);

    // Check if session exists
    const existingSession = await getSessionById(sessionId);
    if (!existingSession) {
      return NextResponse.json(
        { success: false, error: "Session not found" },
        { status: 404 }
      );
    }

    let success = false;

    // Delete using event-session integration if user info available
    if (session?.user) {
      success = await deleteSessionWithEvent(
        sessionId,
        session.user.id,
        session.user.role
      );
    } else {
      // Fallback to direct deletion
      success = await deleteSession(sessionId);
    }

    if (!success) {
      return NextResponse.json(
        { success: false, error: "Failed to delete session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Session deleted successfully",
    });
  } catch (error: any) {
    console.error("❌ Error deleting session:", error);
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
