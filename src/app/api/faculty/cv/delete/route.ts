// app/api/faculty/cv/delete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { query } from "@/lib/database/connection";
import { unlink } from "fs/promises";
import { join } from "path";

export async function DELETE(request: NextRequest) {
  try {
    console.log("=== CV DELETE STARTED ===");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ Unauthorized request - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", session.user.email);

    // Parse request body
    const body = await request.json();
    const { id, facultyId } = body;

    if (!id || !facultyId) {
      return NextResponse.json({ error: "CV ID and Faculty ID are required" }, { status: 400 });
    }

    console.log("📝 Delete request:", { id, facultyId });
    const userId = session?.user?.id ?? "";  

const sessionParts = typeof userId === "string" ? userId.split("-") : [];
    // Extract base ID from session ID for permission check
    const baseSessionId = sessionParts.length >= 2 && sessionParts[0] === 'faculty' && sessionParts[1]?.startsWith('evt_') 
      ? sessionParts.slice(0, 2).join('-') 
      : session.user.id;

    // Check permissions
    if (
      session.user.id !== facultyId && 
      baseSessionId !== facultyId &&
      !["ORGANIZER", "EVENT_MANAGER"].includes(session.user.role || "")
    ) {
      console.log("❌ Insufficient permissions");
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Validate faculty exists and get actual ID
    let facultyRes = await query(
      "SELECT id, name, email, role FROM users WHERE id = $1",
      [facultyId]
    );
    
    if (!facultyRes.rows.length) {
      facultyRes = await query(
        "SELECT id, name, email, role FROM users WHERE email = $1",
        [session.user.email]
      );
    }
    
    if (!facultyRes.rows.length) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }
    
    const faculty = facultyRes.rows[0];
    const actualFacultyId = faculty.id;

    // Get CV record to verify ownership and get file path
    const cvRes = await query(
      "SELECT id, faculty_id, file_path, original_filename FROM cv_uploads WHERE id = $1",
      [id]
    );

    if (!cvRes.rows.length) {
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const cvRecord = cvRes.rows[0];

    // Verify ownership
    if (cvRecord.faculty_id !== actualFacultyId) {
      console.log("❌ CV ownership verification failed");
      return NextResponse.json({ error: "Not authorized to delete this CV" }, { status: 403 });
    }

    console.log("✅ CV ownership verified, proceeding with deletion");

    // Delete file from filesystem
    try {
      const fullFilePath = join(process.cwd(), "public", cvRecord.file_path);
      await unlink(fullFilePath);
      console.log("✅ File deleted from filesystem:", fullFilePath);
    } catch (fileError) {
      console.log("⚠️ Warning: Could not delete file from filesystem:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete record from database
    await query("DELETE FROM cv_uploads WHERE id = $1", [id]);
    console.log("✅ CV record deleted from database");

    console.log("=== CV DELETE COMPLETED SUCCESSFULLY ===");

    return NextResponse.json({
      success: true,
      message: "CV deleted successfully",
      data: {
        deletedId: id,
        filename: cvRecord.original_filename,
      },
    });

  } catch (error) {
    console.error("❌ CV DELETE ERROR:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete CV",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}