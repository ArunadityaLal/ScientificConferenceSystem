import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/connection";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      id,
      inviteStatus,
      rejectionReason,
      suggestedTopic,
      suggestedTimeStart,
      suggestedTimeEnd,
      optionalQuery,
    } = body;

    if (!id || !inviteStatus) {
      return NextResponse.json(
        { success: false, error: "Session ID and invite status are required" },
        { status: 400 }
      );
    }

    console.log("🔄 Updating session response:", {
      id,
      inviteStatus,
      rejectionReason,
    });

    // Start transaction
    await query("BEGIN");

    try {
      // Update session metadata
      let updateQuery = `
        UPDATE session_metadata 
        SET invite_status = $1, updated_at = NOW()
      `;
      let queryParams = [inviteStatus];
      let paramIndex = 2;

      if (rejectionReason) {
        updateQuery += `, rejection_reason = $${paramIndex++}`;
        queryParams.push(rejectionReason);
      }

      if (suggestedTopic) {
        updateQuery += `, suggested_topic = $${paramIndex++}`;
        queryParams.push(suggestedTopic);
      }

      if (suggestedTimeStart) {
        updateQuery += `, suggested_time_start = $${paramIndex++}::timestamp`;
        queryParams.push(suggestedTimeStart);
      }

      if (suggestedTimeEnd) {
        updateQuery += `, suggested_time_end = $${paramIndex++}::timestamp`;
        queryParams.push(suggestedTimeEnd);
      }

      if (optionalQuery) {
        updateQuery += `, optional_query = $${paramIndex++}`;
        queryParams.push(optionalQuery);
      }

      updateQuery += ` WHERE session_id = $${paramIndex}`;
      queryParams.push(id);

      const result = await query(updateQuery, queryParams);

      if (result.rowCount === 0) {
        throw new Error("Session not found or no changes made");
      }

      await query("COMMIT");

      console.log("✅ Session response updated successfully:", id);

      return NextResponse.json({
        success: true,
        message: "Session response updated successfully",
      });
    } catch (error) {
      await query("ROLLBACK");
      throw error;
    }
  } catch (error: any) {
    console.error("❌ Error updating session response:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
        details: error?.message || "",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
