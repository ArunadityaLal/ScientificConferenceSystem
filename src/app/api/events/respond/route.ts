import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, email, facultyName, response, respondedAt, notes } = body;

    console.log("🔄 Processing faculty response:", {
      eventId,
      email,
      response,
    });

    if (!eventId || !email || !response) {
      console.log("❌ Missing required fields:", { eventId, email, response });
      return NextResponse.json(
        { error: "Missing required fields: eventId, email, response" },
        { status: 400 }
      );
    }

    // For demo: Store the response (in production, save to database)
    const responseRecord = {
      id: `response-${Date.now()}`,
      eventId,
      facultyEmail: email,
      facultyName: facultyName || "Faculty Member",
      response: response.toUpperCase(),
      respondedAt: respondedAt || new Date().toISOString(),
      notes: notes || "",
      createdAt: new Date().toISOString(),
    };

    console.log("✅ Response recorded successfully:", responseRecord);

    // Return success response
    return NextResponse.json(
      {
        success: true,
        data: responseRecord,
        message: `Event invitation ${response.toLowerCase()} successfully recorded`,
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("❌ Error processing event response:", error);
    return NextResponse.json(
      {
        error: "Failed to process response",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
