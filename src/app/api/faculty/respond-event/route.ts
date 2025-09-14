import { NextRequest, NextResponse } from "next/server";

interface RespondEventRequest {
  eventId: string;
  email: string;
  status: "ACCEPTED" | "DECLINED";
  rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict";
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: RespondEventRequest = await req.json();

    console.log("📝 Faculty event response received:", body);

    const {
      eventId,
      email,
      status,
      rejectionReason,
      suggestedTopic,
      suggestedTimeStart,
      suggestedTimeEnd,
      optionalQuery,
    } = body;

    // Validate required fields
    if (!eventId || !email || !status) {
      return NextResponse.json(
        { error: "Missing required fields: eventId, email, status" },
        { status: 400 }
      );
    }

    if (!["ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json(
        { error: "Status must be ACCEPTED or DECLINED" },
        { status: 400 }
      );
    }

    // In a real application, you would update the database here
    // For this demo, we're relying on localStorage updates on the client side

    const responseData = {
      eventId,
      email,
      status,
      respondedAt: new Date().toISOString(),
      ...(rejectionReason && { rejectionReason }),
      ...(suggestedTopic && { suggestedTopic }),
      ...(suggestedTimeStart && { suggestedTimeStart }),
      ...(suggestedTimeEnd && { suggestedTimeEnd }),
      ...(optionalQuery && { optionalQuery }),
    };

    console.log("✅ Event response processed successfully:", responseData);

    // Return success - the client will handle localStorage updates
    return NextResponse.json({
      success: true,
      message: `Event invitation ${status.toLowerCase()} successfully`,
      data: responseData,
    });
  } catch (error) {
    console.error("❌ Error processing event response:", error);
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
