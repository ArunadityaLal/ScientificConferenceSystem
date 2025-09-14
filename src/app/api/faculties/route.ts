import { NextResponse } from "next/server";
import { getFaculties } from "@/lib/database/session-queries";
export const FACULTIES = [];

export async function GET() {
  try {
    const faculties = await getFaculties();
    return NextResponse.json(faculties);
  } catch (error) {
    console.error("Error fetching faculties:", error);
    return NextResponse.json(
      { error: "Failed to fetch faculties" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
