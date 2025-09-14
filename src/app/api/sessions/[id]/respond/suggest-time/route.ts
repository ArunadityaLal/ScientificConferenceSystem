import { NextRequest, NextResponse } from "next/server";
import { getSessionById, updateSession } from "../../../../_store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token");

  console.log("🔍 Time suggestion GET:", {
    sessionId: params.id,
    token: token?.substring(0, 8) + "...",
  });

  if (!token) {
    return NextResponse.json({ error: "Invalid token" }, { status: 400 });
  }

  try {
    const session = await getSessionById(params.id);
    console.log("📋 Session found:", !!session, session?.title);

    if (!session) {
      console.error("❌ Session not found:", params.id);
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.inviteToken !== token) {
      console.error("❌ Invalid token for time suggestion");
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    // Format current times for datetime-local input
    const currentStart = new Date(session.startTime);
    const currentEnd = new Date(session.endTime);
    const startValue = currentStart.toISOString().slice(0, 16);
    const endValue = currentEnd.toISOString().slice(0, 16);

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Suggest Time</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #222; max-width: 600px; margin: 0 auto; }
      .session-info { background: #dbeafe; padding: 16px; border-radius: 8px; margin: 20px 0; border: 2px solid #3b82f6; }
      .form-group { margin: 15px 0; }
      label { display: block; margin-bottom: 5px; font-weight: 600; }
      input, textarea { width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit; }
      input[type="datetime-local"] { width: auto; }
      button { background: #3b82f6; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
      button:hover { background: #2563eb; }
    </style>
  </head>
  <body>
    <h2>🕐 Suggest Alternative Time</h2>
    
    <div class="session-info">
      <h3>Current Session Details:</h3>
      <p><strong>Topic:</strong> ${session.title}</p>
      <p><strong>Current Start:</strong> ${currentStart.toLocaleString()}</p>
      <p><strong>Current End:</strong> ${currentEnd.toLocaleString()}</p>
      <p><strong>Duration:</strong> ${Math.round(
        (currentEnd.getTime() - currentStart.getTime()) / (1000 * 60)
      )} minutes</p>
      <p><strong>Location:</strong> ${session.place}</p>
    </div>
    
    <p>Please suggest your preferred time slot:</p>
    
    <form method="POST" style="margin: 20px 0;">
      <input type="hidden" name="token" value="${token}">
      
      <div class="form-group">
        <label for="suggestedTimeStart">Preferred Start Time:</label>
        <input type="datetime-local" name="suggestedTimeStart" id="suggestedTimeStart" 
               value="${startValue}" required>
      </div>
      
      <div class="form-group">
        <label for="suggestedTimeEnd">Preferred End Time:</label>
        <input type="datetime-local" name="suggestedTimeEnd" id="suggestedTimeEnd" 
               value="${endValue}" required>
      </div>
      
      <div class="form-group">
        <label for="optionalQuery">Additional Comments (Optional):</label>
        <textarea name="optionalQuery" id="optionalQuery" rows="3" 
                  placeholder="Any additional scheduling preferences or constraints..."></textarea>
      </div>
      
      <button type="submit">Submit Time Suggestion</button>
    </form>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("❌ Error in time suggestion GET:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const formData = await req.formData();
    const token = formData.get("token")?.toString();
    const suggestedTimeStart = formData.get("suggestedTimeStart")?.toString();
    const suggestedTimeEnd = formData.get("suggestedTimeEnd")?.toString();
    const optionalQuery = formData.get("optionalQuery")?.toString() || "";

    console.log("⏰ Time suggestion POST:", {
      sessionId: params.id,
      token: token?.substring(0, 8) + "...",
      start: suggestedTimeStart,
      end: suggestedTimeEnd,
    });

    if (!token || !suggestedTimeStart || !suggestedTimeEnd) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await getSessionById(params.id);
    if (!session) {
      console.error("❌ Session not found for time POST:", params.id);
      return NextResponse.json(
        { error: "Invalid session or token" },
        { status: 404 }
      );
    }

    if (session.inviteToken !== token) {
      console.error("❌ Invalid token for time POST");
      return NextResponse.json(
        { error: "Invalid session or token" },
        { status: 404 }
      );
    }

    await updateSession(params.id, {
      inviteStatus: "Declined" as const,
      rejectionReason: "TimeConflict" as const,
      suggestedTimeStart: suggestedTimeStart,
      suggestedTimeEnd: suggestedTimeEnd,
      optionalQuery: optionalQuery,
      suggestedTopic: undefined,
    });

    console.log("💾 Time suggestion saved successfully");

    const suggestedStart = new Date(suggestedTimeStart);
    const suggestedEnd = new Date(suggestedTimeEnd);

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Time suggestion recorded</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #222; max-width: 600px; margin: 0 auto; }
      .success { background: #3b82f6; color: white; padding: 20px; border-radius: 12px; text-align: center; }
      .details { background: #dbeafe; padding: 16px; border-radius: 8px; margin: 16px 0; border: 2px solid #3b82f6; }
      .time-comparison { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin: 16px 0; }
      .time-block { background: white; padding: 12px; border-radius: 6px; }
    </style>
  </head>
  <body>
    <div class="success">
      <h2>✅ Time Suggestion Submitted!</h2>
      <p>Thank you for suggesting an alternative time slot!</p>
    </div>
    
    <div class="details">
      <h3>Session: ${session.title}</h3>
      
      <div class="time-comparison">
        <div class="time-block">
          <h4>Original Time:</h4>
          <p><strong>Start:</strong> ${new Date(
            session.startTime
          ).toLocaleString()}</p>
          <p><strong>End:</strong> ${new Date(
            session.endTime
          ).toLocaleString()}</p>
        </div>
        <div class="time-block">
          <h4>Your Suggested Time:</h4>
          <p><strong>Start:</strong> ${suggestedStart.toLocaleString()}</p>
          <p><strong>End:</strong> ${suggestedEnd.toLocaleString()}</p>
        </div>
      </div>
      
      ${
        optionalQuery
          ? `<p><strong>Your comments:</strong> ${optionalQuery}</p>`
          : ""
      }
    </div>
    
    <p style="color: #2563eb; text-align: center; font-weight: 600;">
      The organizers will review your time suggestion and get back to you.
    </p>
    <p style="color: #666; text-align: center;">You can close this window now.</p>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("❌ Error processing time suggestion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
