import { NextRequest, NextResponse } from "next/server";
import { getSessionById, updateSession } from "../../../../_store";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const searchParams = req.nextUrl.searchParams;
  const token = searchParams.get("token");
  const suggestedTopic = searchParams.get("topic") || "";

  console.log("🔍 Topic suggestion GET:", {
    sessionId: params.id,
    token: token?.substring(0, 8) + "...",
    hasTopic: !!suggestedTopic,
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
      console.error("❌ Invalid token for topic suggestion");
      return NextResponse.json({ error: "Invalid token" }, { status: 403 });
    }

    // If topic provided via URL parameter, process it directly
    if (suggestedTopic) {
      await updateSession(params.id, {
        inviteStatus: "Declined" as const,
        rejectionReason: "SuggestedTopic" as const,
        suggestedTopic: suggestedTopic,
        suggestedTimeStart: undefined,
        suggestedTimeEnd: undefined,
        optionalQuery: undefined,
      });

      console.log("💡 Topic suggestion processed:", suggestedTopic);

      const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Topic suggestion recorded</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #222; max-width: 600px; margin: 0 auto; }
      .success { background: #f59e0b; color: white; padding: 20px; border-radius: 12px; text-align: center; }
      .session-details { background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border: 2px solid #f59e0b; }
    </style>
  </head>
  <body>
    <div class="success">
      <h2>💡 Topic Suggestion Recorded</h2>
      <p>Thank you for suggesting an alternative topic!</p>
    </div>
    
    <div class="session-details">
      <h3>Original Session:</h3>
      <p><strong>Original Topic:</strong> ${session.title}</p>
      <p><strong>Time:</strong> ${new Date(
        session.startTime
      ).toLocaleString()} - ${new Date(session.endTime).toLocaleString()}</p>
      <p><strong>Location:</strong> ${session.place}</p>
      
      <h3>Your Suggestion:</h3>
      <p><strong>Suggested Topic:</strong> "${suggestedTopic}"</p>
    </div>
    
    <p style="text-align: center; color: #d97706; font-weight: 600;">
      The organizers will review your suggestion and get back to you.
    </p>
    <p style="color: #666; text-align: center;">You can close this window now.</p>
  </body>
</html>`;

      return new NextResponse(html, {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    // Show form if no topic provided
    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Suggest Topic</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #222; max-width: 600px; margin: 0 auto; }
      .session-info { background: #f9fafb; padding: 16px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb; }
      .form-group { margin: 15px 0; }
      label { display: block; margin-bottom: 5px; font-weight: 600; }
      textarea { width: 100%; padding: 10px; border: 2px solid #d1d5db; border-radius: 6px; font-size: 14px; font-family: inherit; }
      button { background: #f59e0b; color: white; padding: 12px 24px; border: none; border-radius: 6px; cursor: pointer; font-size: 14px; font-weight: 600; }
      button:hover { background: #d97706; }
    </style>
  </head>
  <body>
    <h2>💡 Suggest Alternative Topic</h2>
    
    <div class="session-info">
      <h3>Current Session Details:</h3>
      <p><strong>Topic:</strong> ${session.title}</p>
      <p><strong>Time:</strong> ${new Date(
        session.startTime
      ).toLocaleString()} - ${new Date(session.endTime).toLocaleString()}</p>
      <p><strong>Duration:</strong> ${Math.round(
        (new Date(session.endTime).getTime() -
          new Date(session.startTime).getTime()) /
          (1000 * 60)
      )} minutes</p>
      <p><strong>Location:</strong> ${session.place}</p>
    </div>
    
    <p>Please suggest an alternative topic you'd prefer to speak about:</p>
    
    <form method="POST" style="margin: 20px 0;">
      <input type="hidden" name="token" value="${token}">
      <div class="form-group">
        <label for="suggestedTopic">Suggested Topic:</label>
        <textarea name="suggestedTopic" id="suggestedTopic" rows="4" required 
                  placeholder="Enter your suggested topic here..."></textarea>
      </div>
      <button type="submit">Submit Topic Suggestion</button>
    </form>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("❌ Error in topic suggestion GET:", error);
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
    const suggestedTopic = formData.get("suggestedTopic")?.toString();

    console.log("💡 Topic suggestion POST:", {
      sessionId: params.id,
      token: token?.substring(0, 8) + "...",
      topic: suggestedTopic,
    });

    if (!token || !suggestedTopic) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const session = await getSessionById(params.id);
    if (!session) {
      console.error("❌ Session not found for topic POST:", params.id);
      return NextResponse.json(
        { error: "Invalid session or token" },
        { status: 404 }
      );
    }

    if (session.inviteToken !== token) {
      console.error("❌ Invalid token for topic POST");
      return NextResponse.json(
        { error: "Invalid session or token" },
        { status: 404 }
      );
    }

    await updateSession(params.id, {
      inviteStatus: "Declined" as const,
      rejectionReason: "SuggestedTopic" as const,
      suggestedTopic: suggestedTopic,
      suggestedTimeStart: undefined,
      suggestedTimeEnd: undefined,
      optionalQuery: undefined,
    });

    console.log("💾 Topic suggestion saved successfully");

    const html = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>Topic suggestion recorded</title>
    <style>
      body { font-family: system-ui, sans-serif; padding: 24px; color: #222; max-width: 600px; margin: 0 auto; }
      .success { background: #f59e0b; color: white; padding: 20px; border-radius: 12px; text-align: center; }
      .details { background: #fef3c7; padding: 16px; border-radius: 8px; margin: 16px 0; border: 2px solid #f59e0b; }
    </style>
  </head>
  <body>
    <div class="success">
      <h2>✅ Topic Suggestion Submitted!</h2>
      <p>Thank you for your suggestion!</p>
    </div>
    
    <div class="details">
      <h3>Your Suggestion:</h3>
      <p><strong>Original Topic:</strong> ${session.title}</p>
      <p><strong>Your Suggested Topic:</strong> "${suggestedTopic}"</p>
      <p><strong>Session Time:</strong> ${new Date(
        session.startTime
      ).toLocaleString()} - ${new Date(session.endTime).toLocaleString()}</p>
    </div>
    
    <p style="color: #d97706; text-align: center; font-weight: 600;">
      The organizers will review your suggestion and get back to you.
    </p>
    <p style="color: #666; text-align: center;">You can close this window now.</p>
  </body>
</html>`;

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    console.error("❌ Error processing topic suggestion:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
