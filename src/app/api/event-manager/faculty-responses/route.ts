import { NextRequest, NextResponse } from "next/server";

// Define the interface for faculty responses
interface FacultyResponse {
  id: string;
  facultyEmail: string;
  facultyName: string;
  sessionId?: string;
  sessionTitle?: string;
  status: "PENDING" | "ACCEPTED" | "DECLINED";
  invitedAt?: string;
  respondedAt?: string | null;
  rejectionReason?: string | null;
  suggestedTopic?: string | null;
}

export async function GET(req: NextRequest) {
  try {
    console.log("🔍 Fetching faculty responses for event manager");

    // ✅ FIX: Explicitly type the array
    let actualResponses: FacultyResponse[] = [];

    try {
      const savedResponses =
        typeof window !== "undefined"
          ? localStorage?.getItem("facultyResponses")
          : null;

      if (savedResponses) {
        actualResponses = JSON.parse(savedResponses) as FacultyResponse[];
      }

      // Also get invitation data to show pending responses
      const savedInvitations =
        typeof window !== "undefined"
          ? localStorage?.getItem("facultyInvitations")
          : null;

      if (savedInvitations) {
        const invitations = JSON.parse(savedInvitations);

        // Add pending invitations as responses
        invitations.forEach((inv: any) => {
          // Only add if no response exists yet
          const existingResponse = actualResponses.find(
            (r: FacultyResponse) => r.facultyEmail === inv.email
          );

          if (!existingResponse) {
            actualResponses.push({
              id: `pending-${inv.id}`,
              facultyEmail: inv.email,
              facultyName: inv.name,
              sessionId: inv.eventId,
              sessionTitle: inv.eventTitle,
              status: inv.status || "PENDING",
              invitedAt: inv.invitedAt,
              respondedAt: inv.respondedAt || null,
              rejectionReason: null,
              suggestedTopic: null,
            });
          }
        });
      }
    } catch (error) {
      console.error("Error reading responses from localStorage:", error);
    }

    console.log(`📊 Returning ${actualResponses.length} faculty responses`);

    return NextResponse.json({
      success: true,
      data: {
        responses: actualResponses,
      },
      count: actualResponses.length,
    });
  } catch (error) {
    console.error("Error fetching faculty responses:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
