// app/api/faculty/presentations/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { query } from "@/lib/database/connection";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { z } from "zod";

// FIXED: Updated validation schema - make sessionId optional like CV API
const UploadSchema = z.object({
  facultyId: z.string().min(1, "Faculty ID is required"),
  sessionId: z.string().optional().nullable(), // ← FIXED: Make optional like CV API
});

// Allowed presentation types
const allowedTypes = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const maxSize = 50 * 1024 * 1024; // 50MB

// Validate file
function validateFile(file: File) {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only PDF, PPT, PPTX, DOC, DOCX files are allowed" };
  }
  if (file.size > maxSize) {
    return { valid: false, error: "File size must be 50MB or less" };
  }
  return { valid: true as const };
}

// Generate unique filename
function generateUniqueFilename(originalName: string, facultyId: string, index: number) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  return `${facultyId}_PRES_${index}_${timestamp}_${random}.${extension}`;
}

// Helper function for permission checks
function checkPermissions(session: any, facultyId: string) {
  const sessionParts = session.user.id.split('-');
  const baseSessionId = sessionParts.length >= 2 && sessionParts[0] === 'faculty' && sessionParts[1].startsWith('evt_') 
    ? sessionParts.slice(0, 2).join('-') 
    : session.user.id;
  
  return baseSessionId === facultyId || session.user.id === facultyId;
}

// Helper function to get actual faculty ID from database
async function getActualFacultyId(providedFacultyId: string, userEmail: string) {
  try {
    // First try to find by ID directly
    let facultyRes = await query(
      "SELECT id, name, email FROM users WHERE id = $1 AND role = 'FACULTY'",
      [providedFacultyId]
    );

    if (facultyRes.rows.length > 0) {
      return facultyRes.rows[0];
    }

    // If not found by ID, try to find by email
    facultyRes = await query(
      "SELECT id, name, email FROM users WHERE email = $1 AND role = 'FACULTY'",
      [userEmail]
    );

    if (facultyRes.rows.length > 0) {
      return facultyRes.rows[0];
    }

    return null;
  } catch (error) {
    console.error("Error getting faculty ID:", error);
    return null;
  }
}

// GET endpoint for fetching presentations
export async function GET(request: NextRequest) {
  try {
    console.log("=== PRESENTATIONS FETCH STARTED ===");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ Unauthorized request - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", session.user.email);

    // Parse URL parameters
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get("facultyId");
    const sessionId = searchParams.get("sessionId");

    if (!facultyId) {
      return NextResponse.json({ error: "Faculty ID is required" }, { status: 400 });
    }

    console.log("📝 Fetching presentations for faculty:", facultyId, "session:", sessionId);

    // Check permissions
    if (!checkPermissions(session, facultyId)) {
      console.log("❌ Insufficient permissions");
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get actual faculty info
    const faculty = await getActualFacultyId(facultyId, session.user.email);
    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    const actualFacultyId = faculty.id;

    // Build presentations query with optional session filtering
    let presentationsQuery = `
      SELECT p.id, p.title, p.file_path, p.file_size, p.uploaded_at, p.session_id
      FROM presentations p
      WHERE p.user_id = $1
    `;
    const queryParams = [actualFacultyId];

    if (sessionId) {
      // Try to get the conference session ID from session_metadata
      const sessionMappingRes = await query(
        `SELECT session_id FROM session_metadata WHERE id = $1`,
        [sessionId]
      );
      
      if (sessionMappingRes.rows.length > 0 && sessionMappingRes.rows[0].session_id) {
        const conferenceSessionId = sessionMappingRes.rows[0].session_id;
        console.log("📋 Using conference session ID:", conferenceSessionId, "for presentations query");
        presentationsQuery += ` AND p.session_id = $2`;
        queryParams.push(conferenceSessionId);
      } else {
        // Fallback: try the sessionId directly
        console.log("📋 Using provided session ID directly:", sessionId);
        presentationsQuery += ` AND p.session_id = $2`;
        queryParams.push(sessionId);
      }
    }

    presentationsQuery += ` ORDER BY p.uploaded_at DESC`;

    const presRes = await query(presentationsQuery, queryParams);

    const presentations = presRes.rows.map(row => ({
      id: row.id,
      title: row.title,
      filePath: row.file_path,
      fileSize: row.file_size,
      originalFilename: row.title,
      uploadedAt: row.uploaded_at,
      session: {
        id: row.session_id,
      },
    }));

    console.log(`✅ Found ${presentations.length} presentations for faculty`);

    return NextResponse.json({
      success: true,
      data: {
        presentations,
        faculty: {
          id: faculty.id,
          name: faculty.name,
          email: faculty.email,
        },
      },
    });

  } catch (error) {
    console.error("❌ PRESENTATIONS FETCH ERROR:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch presentations",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

// POST endpoint for uploading presentations
export async function POST(request: NextRequest) {
  let actualFacultyId = "";
  let conferenceSessionId = "";
  
  try {
    console.log("=== PRESENTATIONS UPLOAD STARTED ===");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ Unauthorized request - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", session.user.email);

    // Parse form data
    const formData = await request.formData();
    const files = formData.getAll("files") as File[];
    const facultyId = (formData.get("facultyId") as string | null) ?? "";
    const sessionId = (formData.get("sessionId") as string | null) ?? null; // ← FIXED: Allow null

    console.log("📝 Form data received:", { 
      fileCount: files.length,
      facultyId, 
      sessionId,
      fileNames: files.map(f => f.name)
    });

    if (!files.length) {
      console.log("❌ No files provided");
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    // FIXED: Validate form data with optional sessionId
    try {
      console.log("🔍 Validating form data...");
      UploadSchema.parse({ facultyId, sessionId });
      console.log("✅ Form data validation passed");
    } catch (error) {
      console.log("❌ Form data validation failed:", error);
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          {
            error: "Validation failed",
            details: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Check permissions
    console.log("🔐 Checking permissions...");
    if (!checkPermissions(session, facultyId)) {
      console.log("❌ Insufficient permissions");
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }
    console.log("✅ Permission check passed");

    // Get actual faculty info
    console.log("👤 Looking up faculty...");
    const faculty = await getActualFacultyId(facultyId, session.user.email);
    if (!faculty) {
      console.log("❌ Faculty not found or not a faculty member");
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }
    
    actualFacultyId = faculty.id;
    console.log("✅ Using actual faculty ID:", actualFacultyId);

    // FIXED: Session validation - make it more flexible like CV API
    let validSessionMetadataId: string | null = null;
    
    if (sessionId) {
      console.log("🔍 Validating provided session:", sessionId);
      const sessionRes = await query(
        `SELECT id, session_id, faculty_id FROM session_metadata
         WHERE id = $1 AND faculty_id = $2 AND invite_status = 'Accepted'`,
        [sessionId, actualFacultyId]
      );
      
      if (sessionRes.rows.length > 0) {
        const sessionData = sessionRes.rows[0];
        validSessionMetadataId = sessionData.id;
        conferenceSessionId = sessionData.session_id || sessionData.id;
        console.log("✅ Using selected session:", validSessionMetadataId, "-> conference session:", conferenceSessionId);
      } else {
        // FIXED: Instead of throwing an error, just warn and continue like CV API
        console.log("⚠️ Session validation failed - will upload without session association");
        validSessionMetadataId = null;
        conferenceSessionId = sessionId; // Use provided sessionId as fallback
      }
    } else {
      console.log("ℹ️ No session provided - uploading without session association");
    }

    // Validate all files
    console.log("📄 Validating files...");
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) {
        console.log(`❌ File at index ${i} is undefined, skipping...`);
        continue;
      }
      const fileValidation = validateFile(file);
      if (!fileValidation.valid) {
        console.log(`❌ File ${i + 1} validation failed:`, fileValidation.error);
        return NextResponse.json({ 
          error: `File "${file.name}": ${fileValidation.error}` 
        }, { status: 400 });
      }
    }
    console.log("✅ All files validation passed");

    // Create upload directory
    console.log("📁 Creating upload directory...");
    const uploadDir = join(process.cwd(), "public", "uploads", "presentations");
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log("✅ Upload directory ready");
    } catch (dirError) {
      console.error("❌ Failed to create upload directory:", dirError);
      throw new Error("Failed to create upload directory");
    }

    // Process and save all files
    console.log("💾 Processing files...");
    const uploadedFiles = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file) {
        console.log(`❌ File at index ${i} is undefined, skipping...`);
        continue;
      }
      console.log(`📤 Processing file ${i + 1}/${files.length}: ${file.name}`);
      
      try {
        // Generate unique filename and save file
        const uniqueFilename = generateUniqueFilename(file.name, actualFacultyId, i + 1);
        const filePath = join(uploadDir, uniqueFilename);
        const buffer = Buffer.from(await file.arrayBuffer());
        
        await writeFile(filePath, buffer);
        console.log(`✅ File ${i + 1} saved`);
        
        const dbFilePath = `/uploads/presentations/${uniqueFilename}`;
        
        // Extract title from filename (remove extension)
        const title = file.name.replace(/\.[^/.]+$/, "");
        
        // Insert record into database
        const insertResult = await query(
          `INSERT INTO presentations
            (session_id, user_id, file_path, title, file_size)
           VALUES ($1, $2, $3, $4, $5) RETURNING *`,
          [conferenceSessionId || null, actualFacultyId, dbFilePath, title, file.size] // ← FIXED: Allow null session
        );
        
        const uploadedRecord = insertResult.rows[0];
        console.log(`✅ File ${i + 1} record created in database`);
        
        uploadedFiles.push({
          id: uploadedRecord.id,
          fileName: file.name,
          title: uploadedRecord.title,
          fileSize: uploadedRecord.file_size,
          filePath: uploadedRecord.file_path,
          uploadedAt: uploadedRecord.uploaded_at,
        });
        
      } catch (fileError) {
        console.error(`❌ Failed to process file ${i + 1}:`, fileError);
        throw new Error(`Failed to process file "${file.name}": ${fileError instanceof Error ? fileError.message : 'Unknown error'}`);
      }
    }

    console.log("✅ Presentations uploaded successfully");

    return NextResponse.json(
      {
        success: true,
        message: `${uploadedFiles.length} presentation(s) uploaded successfully`,
        data: {
          uploadedFiles,
          session: {
            id: conferenceSessionId,
          },
          faculty: { 
            id: faculty.id, 
            name: faculty.name, 
            email: faculty.email 
          },
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ PRESENTATIONS UPLOAD ERROR:", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Failed to upload presentations",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

// DELETE endpoint for deleting presentations (unchanged)
export async function DELETE(request: NextRequest) {
  try {
    console.log("=== PRESENTATION DELETE STARTED ===");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ Unauthorized request - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", session.user.email);

    // Parse request body
    const body = await request.json();
    const { fileId, facultyId } = body;

    if (!fileId || !facultyId) {
      return NextResponse.json({ error: "File ID and Faculty ID are required" }, { status: 400 });
    }

    console.log("📝 Delete request:", { fileId, facultyId });

    // Check permissions
    if (!checkPermissions(session, facultyId)) {
      console.log("❌ Insufficient permissions");
      return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 });
    }

    // Get actual faculty info
    const faculty = await getActualFacultyId(facultyId, session.user.email);
    if (!faculty) {
      return NextResponse.json({ error: "Faculty not found" }, { status: 404 });
    }

    const actualFacultyId = faculty.id;

    // Get presentation record to verify ownership and get file path
    const presRes = await query(
      "SELECT id, user_id, file_path, title FROM presentations WHERE id = $1",
      [fileId]
    );

    if (!presRes.rows.length) {
      return NextResponse.json({ error: "Presentation not found" }, { status: 404 });
    }

    const presRecord = presRes.rows[0];

    // Verify ownership
    if (presRecord.user_id !== actualFacultyId) {
      console.log("❌ Presentation ownership verification failed");
      return NextResponse.json({ error: "Not authorized to delete this presentation" }, { status: 403 });
    }

    console.log("✅ Presentation ownership verified, proceeding with deletion");

    // Delete file from filesystem
    try {
      const fullFilePath = join(process.cwd(), "public", presRecord.file_path);
      await unlink(fullFilePath);
      console.log("✅ File deleted from filesystem");
    } catch (fileError) {
      console.log("⚠️ Warning: Could not delete file from filesystem:", fileError);
      // Continue with database deletion even if file deletion fails
    }

    // Delete record from database
    await query("DELETE FROM presentations WHERE id = $1", [fileId]);
    console.log("✅ Presentation record deleted from database");

    return NextResponse.json({
      success: true,
      message: "Presentation deleted successfully",
      data: {
        deletedId: fileId,
        title: presRecord.title,
      },
    });

  } catch (error) {
    console.error("❌ PRESENTATION DELETE ERROR:", error);
    return NextResponse.json(
      { 
        error: "Failed to delete presentation",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}