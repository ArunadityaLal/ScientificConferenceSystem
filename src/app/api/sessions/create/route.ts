import { NextRequest, NextResponse } from "next/server";
import { sendBulkInviteEmail } from "../../_utils/session-email";

// Example store – replace with DB
let SESSIONS_STORE: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // data = [{ title, startTime, endTime, place, roomName, facultyName, email, ... }, ...]

    // Save to store/DB
    SESSIONS_STORE.push(...data);

    // Group by faculty email
    const sessionsByEmail = data.reduce((acc: any, session: any) => {
      const key = session.email;
      if (!acc[key]) acc[key] = [];
      acc[key].push(session);
      return acc;
    }, {});

    for (const email of Object.keys(sessionsByEmail)) {
      const facultySessions = sessionsByEmail[email];
      const facultyName = facultySessions[0].facultyName || "Faculty";

      await sendBulkInviteEmail(facultySessions, facultyName, email);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Error creating sessions:", err);
    return NextResponse.json(
      { error: "Failed to create sessions" },
      { status: 500 }
    );
  }
}

export { SESSIONS_STORE };
