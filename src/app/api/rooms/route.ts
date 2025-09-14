// src/app/api/rooms/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { query } from "@/lib/database/connection";

// GET /api/rooms - Get all rooms
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active') === 'true';

    // FIXED: Query to match your actual database schema
    let roomsQuery = `
      SELECT 
        id,
        name,
        capacity,
        location,
        amenities,
        "isActive",
        "createdAt"
      FROM rooms
    `;

    const queryParams: any[] = [];

    if (activeOnly) {
      roomsQuery += ` WHERE "isActive" = true`;
    }

    roomsQuery += ` ORDER BY name ASC`;

    console.log("🔍 Fetching rooms with query:", roomsQuery);

    const result = await query(roomsQuery, queryParams);

    console.log("✅ Rooms fetched successfully:", {
      count: result.rows.length,
      rooms: result.rows.map(r => ({ id: r.id, name: r.name }))
    });

    return NextResponse.json(result.rows);

  } catch (error) {
    console.error("❌ Error fetching rooms:", error);
    return NextResponse.json(
      { error: "Failed to fetch rooms" },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create new room
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check permissions - only ORGANIZER and EVENT_MANAGER can create rooms
    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: "Insufficient permissions to create rooms" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { name, capacity, location, amenities } = body;

    if (!name || !capacity || !location) {
      return NextResponse.json(
        { error: "Name, capacity, and location are required" },
        { status: 400 }
      );
    }

    // Generate room ID
    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // FIXED: Insert query to match your database schema
    const insertQuery = `
      INSERT INTO rooms (
        id, name, capacity, location, amenities, "isActive", "createdAt"
      ) VALUES (
        $1, $2, $3, $4, $5, true, NOW()
      ) RETURNING 
        id,
        name,
        capacity,
        location,
        amenities,
        "isActive",
        "createdAt"
    `;

    const result = await query(insertQuery, [
      roomId,
      name,
      capacity,
      location,
      amenities || null
    ]);

    const newRoom = result.rows[0];

    console.log("✅ Room created successfully:", newRoom);

    return NextResponse.json(newRoom, { status: 201 });

  } catch (error) {
    console.error("❌ Error creating room:", error);
    return NextResponse.json(
      { error: "Failed to create room" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";