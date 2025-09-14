import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/connection";


export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'


export async function GET(req: NextRequest) {
  try {
    const eventId = req.nextUrl.searchParams.get("eventId") || undefined;
    const createdBy = req.nextUrl.searchParams.get("createdBy") || undefined;
    const startFrom = req.nextUrl.searchParams.get("startFrom") || undefined; // ISO
    const startTo = req.nextUrl.searchParams.get("startTo") || undefined; // ISO

    // Build WHERE conditions dynamically
    let whereConditions: string[] = [];
    let queryParams: any[] = [];
    let paramCount = 0;

    if (eventId) {
      paramCount++;
      whereConditions.push(`cs.event_id = $${paramCount}`);
      queryParams.push(eventId);
    }

    if (createdBy) {
      paramCount++;
      whereConditions.push(`cs.created_by = $${paramCount}`);
      queryParams.push(createdBy);
    }

    if (startFrom) {
      paramCount++;
      whereConditions.push(`cs.start_time >= $${paramCount}`);
      queryParams.push(new Date(startFrom));
    }

    if (startTo) {
      paramCount++;
      whereConditions.push(`cs.start_time <= $${paramCount}`);
      queryParams.push(new Date(startTo));
    }

    // Build the final WHERE clause
    const whereClause = whereConditions.length > 0 
      ? `WHERE ${whereConditions.join(' AND ')}`
      : '';

    // SQL query with joins for halls and events
    const sqlQuery = `
      SELECT 
        cs.*,
        h.id as hall_id,
        h.name as hall_name,
        h.capacity as hall_capacity,
        h.location as hall_location,
        h.equipment as hall_equipment,
        e.id as event_id,
        e.name as event_name,
        e.description as event_description,
        e.start_date as event_start_date,
        e.end_date as event_end_date,
        e.location as event_location,
        e.status as event_status
      FROM conference_sessions cs
      LEFT JOIN halls h ON cs.hall_id = h.id
      LEFT JOIN events e ON cs.event_id = e.id
      ${whereClause}
      ORDER BY cs.start_time ASC
    `;

    const result = await query(sqlQuery, queryParams);

    // Transform the flat result back to nested structure
    const sessions = result.rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      start_time: row.start_time,
      end_time: row.end_time,
      session_type: row.session_type,
      hall_id: row.hall_id,
      event_id: row.event_id,
      max_participants: row.max_participants,
      is_break: row.is_break,
      requirements: row.requirements,
      tags: row.tags,
      created_by: row.created_by,
      created_at: row.created_at,
      updated_at: row.updated_at,
      // Nested hall object (if exists)
      halls: row.hall_id ? {
        id: row.hall_id,
        name: row.hall_name,
        capacity: row.hall_capacity,
        location: row.hall_location,
        equipment: row.hall_equipment
      } : null,
      // Nested event object (if exists)
      events: row.event_id ? {
        id: row.event_id,
        name: row.event_name,
        description: row.event_description,
        start_date: row.event_start_date,
        end_date: row.event_end_date,
        location: row.event_location,
        status: row.event_status
      } : null
    }));

    return NextResponse.json({
      success: true,
      count: sessions.length,
      data: sessions,
    });
  } catch (e: any) {
    console.error('Database query error:', e);
    return NextResponse.json(
      { success: false, error: e?.message || "Server error" },
      { status: 500 }
    );
  }
}