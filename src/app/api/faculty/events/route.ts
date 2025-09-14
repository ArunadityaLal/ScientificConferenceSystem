import { NextRequest, NextResponse } from "next/server";

// Define the interface for event invitations
interface EventInvitation {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  venue: string;
  sessionCount: number;
  duration: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  invitedAt: string;
  respondedAt?: string;
  notes?: string;
  rejectionReason?: string;
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
}

// Define the interface for faculty invitations from localStorage
interface FacultyInvitation {
  id: string;
  name: string;
  email: string;
  department?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  invitedAt: string;
  respondedAt?: string;
  eventId: string;
  eventTitle: string;
  notes?: string;
  rejectionReason?: string;
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const eventId = searchParams.get("eventId");
    const invitationId = searchParams.get("invitationId");
    const ref = searchParams.get("ref");

    console.log("🔍 Fetching events for faculty:", {
      email,
      eventId,
      invitationId,
      ref,
    });

    if (!email) {
      console.log("❌ No email parameter provided");
      return NextResponse.json(
        { error: "Email parameter is required" },
        { status: 400 }
      );
    }

    // Initialize properly typed array
    let actualEvents: EventInvitation[] = [];

    try {
      console.log("🔧 Fetching faculty events from localStorage simulation");

      // Since this is server-side, we'll return a response that tells the client
      // to check localStorage, but we'll also provide fallback data

      // Return a success response with instruction to check localStorage
      return NextResponse.json({
        success: true,
        data: {
          events: [], // Empty array - client will populate from localStorage
          context: {
            email,
            eventId,
            invitationId,
            ref,
            fromEmail: ref === "event-invitation",
            useLocalStorage: true, // Flag to tell client to use localStorage
          },
        },
        count: 0,
        message: "Check localStorage for faculty invitations",
      });
    } catch (error) {
      console.error("❌ Error processing invitations:", error);
      actualEvents = [];
    }

    console.log(`📊 Returning ${actualEvents.length} events for ${email}`);

    return NextResponse.json({
      success: true,
      data: {
        events: actualEvents,
        context: {
          email,
          eventId,
          invitationId,
          ref,
          fromEmail: ref === "event-invitation",
          useLocalStorage: true,
        },
      },
      count: actualEvents.length,
      message:
        actualEvents.length > 0
          ? `Found ${actualEvents.length} event invitation(s)`
          : "Check localStorage for event invitations",
    });
  } catch (error) {
    console.error("❌ Error in faculty events API:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
