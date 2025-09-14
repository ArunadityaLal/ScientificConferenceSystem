import { NextRequest, NextResponse } from "next/server";
import { query, transaction } from "@/lib/database/connection";

type CreateItem = {
  title: string;
  facultyId: string;
  email: string;
  place: string;
  roomId: string;
  description: string;
  time: string; // ISO
  status?: "Draft" | "Confirmed";
  inviteStatus?: "Pending" | "Accepted" | "Declined";
  travelStatus?: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body)
      return NextResponse.json(
        { success: false, error: "Invalid JSON" },
        { status: 400 }
      );

    const items: CreateItem[] = Array.isArray(body) ? body : [body];

    const invalid = items.find(
      (it) =>
        !it ||
        !it.title ||
        !it.facultyId ||
        !it.email ||
        !it.place ||
        !it.roomId ||
        !it.description ||
        !it.time
    );
    if (invalid) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate faculty IDs exist
    const facultyIds = Array.from(new Set(items.map((i) => i.facultyId)));
    const facultyPlaceholders = facultyIds.map((_, index) => `${index + 1}`).join(',');
    const facultiesResult = await query(
      `SELECT id FROM faculty WHERE id IN (${facultyPlaceholders})`,
      facultyIds
    );
    
    if (facultiesResult.rows.length !== facultyIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more facultyId not found" },
        { status: 400 }
      );
    }

    // Validate room IDs exist
    const roomIds = Array.from(new Set(items.map((i) => i.roomId)));
    const roomPlaceholders = roomIds.map((_, index) => `${index + 1}`).join(',');
    const roomsResult = await query(
      `SELECT id FROM room WHERE id IN (${roomPlaceholders})`,
      roomIds
    );
    
    if (roomsResult.rows.length !== roomIds.length) {
      return NextResponse.json(
        { success: false, error: "One or more roomId not found" },
        { status: 400 }
      );
    }

    // Create faculty sessions using transaction
    const created = await transaction(async (client) => {
      const createdSessions = [];
      
      for (const item of items) {
        // Insert faculty session
        const sessionResult = await client.query(
          `INSERT INTO faculty_session (
            title, faculty_id, email, place, room_id, description, time, 
            status, invite_status, travel_status, created_at, updated_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW()) 
          RETURNING *`,
          [
            item.title,
            item.facultyId,
            item.email.toLowerCase(),
            item.place,
            item.roomId,
            item.description,
            new Date(item.time),
            item.status === "Confirmed" ? "Confirmed" : "Draft",
            item.inviteStatus ?? "Pending",
            item.travelStatus ?? "Pending"
          ]
        );

        const session = sessionResult.rows[0];

        // Get related room and faculty data
        const [roomResult, facultyResult] = await Promise.all([
          client.query('SELECT * FROM room WHERE id = $1', [item.roomId]),
          client.query('SELECT * FROM faculty WHERE id = $1', [item.facultyId])
        ]);

        // Combine session with related data
        const sessionWithRelations = {
          ...session,
          room: roomResult.rows[0] || null,
          faculty: facultyResult.rows[0] || null
        };

        createdSessions.push(sessionWithRelations);
      }
      
      return createdSessions;
    });

    return NextResponse.json(
      { success: true, count: created.length, data: created },
      { status: 201 }
    );
  } catch (e: any) {
    console.error('Error creating faculty sessions:', e);
    return NextResponse.json(
      { success: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}