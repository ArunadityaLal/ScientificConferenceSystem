import { NextRequest, NextResponse } from "next/server";
import { SESSIONS_STORE } from "../../../../sessions/create/route";

// Function to get session by ID
function getSessionById(id: string) {
  return SESSIONS_STORE.find((session) => session.id === id);
}

// Function to update session
function updateSession(id: string, updates: any) {
  const index = SESSIONS_STORE.findIndex((session) => session.id === id);
  if (index !== -1) {
    SESSIONS_STORE[index] = { ...SESSIONS_STORE[index], ...updates };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {
      action,
      reason,
      suggestedTopic,
      suggestedTimeStart,
      suggestedTimeEnd,
      optionalQuery,
    } = await req.json();
    const sessionId = params.id;

    console.log(`🔄 Processing faculty response for session ${sessionId}:`, {
      action,
      reason,
    });

    const session = getSessionById(sessionId);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    let updates: any = {};

    switch (action) {
      case "accept":
        updates = {
          inviteStatus: "Accepted",
          rejectionReason: undefined,
          suggestedTopic: undefined,
          suggestedTimeStart: undefined,
          suggestedTimeEnd: undefined,
          optionalQuery: undefined,
        };
        break;

      case "decline":
        updates = {
          inviteStatus: "Declined",
        };

        if (reason === "not_interested") {
          updates.rejectionReason = "NotInterested";
        }
        break;

      case "suggest_topic":
        updates = {
          inviteStatus: "Declined",
          rejectionReason: "SuggestedTopic",
          suggestedTopic: suggestedTopic,
          suggestedTimeStart: undefined,
          suggestedTimeEnd: undefined,
          optionalQuery: optionalQuery || undefined,
        };
        break;

      case "suggest_time":
        updates = {
          inviteStatus: "Declined",
          rejectionReason: "TimeConflict",
          suggestedTimeStart: suggestedTimeStart,
          suggestedTimeEnd: suggestedTimeEnd,
          optionalQuery: optionalQuery || undefined,
          suggestedTopic: undefined,
        };
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    updateSession(sessionId, updates);
    const updatedSession = getSessionById(sessionId);

    console.log(`✅ Faculty response processed:`, updatedSession?.inviteStatus);

    return NextResponse.json({
      success: true,
      message: "Response recorded successfully",
      data: updatedSession,
    });
  } catch (error) {
    console.error("❌ Error processing faculty response:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
