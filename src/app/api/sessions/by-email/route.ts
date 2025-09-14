// app/api/sessions/by-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionsByEmail } from "../../_store";

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email" },
        { status: 400 }
      );
    }
    const sessions = await getSessionsByEmail(email);
    return NextResponse.json({ success: true, sessions });
  } catch (e: any) {
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch sessions",
        details:
          process.env.NODE_ENV === "development"
            ? e?.message || String(e)
            : undefined,
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
