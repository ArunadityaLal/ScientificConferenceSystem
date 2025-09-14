// app/api/faculty/cv/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { query } from "@/lib/database/connection";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { z } from "zod";

// Validation schema
const UploadSchema = z.object({
  facultyId: z.string().min(1, "Faculty ID is required"),
  sessionId: z.string().optional().nullable(),
});

// Allowed CV types
const allowedTypes = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
const maxSize = 10 * 1024 * 1024; // 10MB

// Validate file
function validateFile(file: File) {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "Only PDF, DOC, DOCX files are allowed" };
  }
  if (file.size > maxSize) {
    return { valid: false, error: "File size must be 10MB or less" };
  }
  return { valid: true as const };
}

// Generate unique filename
function generateUniqueFilename(originalName: string, facultyId: string) {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split(".").pop();
  return `${facultyId}_CV_${timestamp}_${random}.${extension}`;
}

// Helper function for permission checks
function checkPermissions(session: any, facultyId: string) {
  // Extract base ID from session ID for comparison
  const sessionParts = session.user.id.split('-');
  const baseSessionId = sessionParts.length >= 2 && sessionParts[0] === 'faculty' && sessionParts[1].startsWith('evt_') 
    ? sessionParts.slice(0, 2).join('-') 
    : session.user.id;

  return (
    session.user.id === facultyId || 
    baseSessionId === facultyId ||
    ["ORGANIZER", "EVENT_MANAGER"].includes(session.user.role || "")
  );
}

// Helper function to get actual faculty ID
async function getActualFacultyId(facultyId: string, sessionEmail: string) {
  let facultyRes = await query(
    "SELECT id, name, email, role FROM users WHERE id = $1",
    [facultyId]
  );
  
  if (!facultyRes.rows.length) {
    facultyRes = await query(
      "SELECT id, name, email, role FROM users WHERE email = $1",
      [sessionEmail]
    );
  }
  
  if (!facultyRes.rows.length) {
    return null;
  }
  
  const faculty = facultyRes.rows[0];
  
  if (faculty.role !== 'FACULTY') {
    return null;
  }
  
  return faculty;
}

// GET endpoint for fetching CVs
export async function GET(request: NextRequest) {
  try {
    console.log("=== CV FETCH STARTED ===");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ Unauthorized request - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", session.user.email);

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const facultyId = searchParams.get("facultyId");
    const sessionId = searchParams.get("sessionId"); // Add session filtering

    if (!facultyId) {
      return NextResponse.json({ error: "Faculty ID is required" }, { status: 400 });
    }

    console.log("📝 Fetching CVs for faculty:", facultyId, "session:", sessionId);

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

    // Build CV query with optional session filtering
    let cvQuery = `
      SELECT id, faculty_id, file_path, file_type, file_size, original_filename, 
             description, is_approved, uploaded_at, session_metadata_id
      FROM cv_uploads 
      WHERE faculty_id = $1
    `;
    const queryParams = [actualFacultyId];

    if (sessionId) {
      // If sessionId provided, filter CVs by session
      const sessionMappingRes = await query(
        `SELECT id, session_id FROM session_metadata WHERE id = $1`,
        [sessionId]
      );
      
      if (sessionMappingRes.rows.length > 0) {
        // Filter by the specific session, but also include CVs that might not have a session assigned (NULL)
        // This handles the case where old CVs were uploaded without proper session association
        console.log("📋 Filtering CVs by session metadata ID:", sessionId);
        cvQuery += ` AND (session_metadata_id = $2 OR session_metadata_id IS NULL)`;
        queryParams.push(sessionId);
      } else {
        // Fallback: try the sessionId directly and include NULLs
        console.log("📋 Filtering CVs by provided session ID directly:", sessionId);
        cvQuery += ` AND (session_metadata_id = $2 OR session_metadata_id IS NULL)`;
        queryParams.push(sessionId);
      }
    }

    cvQuery += ` ORDER BY uploaded_at DESC`;

    // Fetch CVs for this faculty (and optionally this session)
    const cvRes = await query(cvQuery, queryParams);

    const cvs = cvRes.rows.map(row => ({
      id: row.id,
      filePath: row.file_path,
      fileType: row.file_type,
      fileSize: row.file_size,
      originalFilename: row.original_filename,
      description: row.description,
      isApproved: row.is_approved,
      uploadedAt: row.uploaded_at,
      sessionMetadataId: row.session_metadata_id,
    }));

    console.log(`✅ Found ${cvs.length} CVs for faculty${sessionId ? ' and session' : ''}`);

    return NextResponse.json({
      success: true,
      data: {
        cvs,
        faculty: {
          id: faculty.id,
          name: faculty.name,
          email: faculty.email,
        },
      },
    });

  } catch (error) {
    console.error("❌ CV FETCH ERROR:", error);
    return NextResponse.json(
      { 
        error: "Failed to fetch CVs",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}

// POST endpoint for uploading CVs
export async function POST(request: NextRequest) {
  let actualFacultyId = "";
  
  try {
    console.log("=== CV UPLOAD STARTED ===");

    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log("❌ Unauthorized request - no session");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ User authenticated:", session.user.email);

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const facultyId = (formData.get("facultyId") as string | null) ?? "";
    const sessionId = (formData.get("sessionId") as string | null) ?? null;

    console.log("📝 Form data received:", { 
      hasFile: !!file, 
      facultyId, 
      sessionId,
      fileName: file?.name,
      fileSize: file?.size 
    });

    if (!file) {
      console.log("❌ No file provided");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate form data
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

    // Validate file
    console.log("📄 Validating file...");
    const fileValidation = validateFile(file);
    if (!fileValidation.valid) {
      console.log("❌ File validation failed:", fileValidation.error);
      return NextResponse.json({ error: fileValidation.error }, { status: 400 });
    }
    console.log("✅ File validation passed");

    // Session validation
    let validSessionId: string | null = null;
    if (sessionId) {
      console.log("🔍 Validating session...");
      const sessionRes = await query(
        `SELECT id, faculty_id FROM session_metadata
         WHERE id = $1 AND faculty_id = $2 AND invite_status = 'Accepted'`,
        [sessionId, actualFacultyId]
      );
      
      if (!sessionRes.rows.length) {
        console.log("⚠️ Session validation failed - will upload without session association");
        validSessionId = null;
      } else {
        console.log("✅ Session validated");
        validSessionId = sessionId;
      }
    }

    // Create upload directory
    console.log("📁 Creating upload directory...");
    const uploadDir = join(process.cwd(), "public", "uploads", "cv");
    try {
      await mkdir(uploadDir, { recursive: true });
      console.log("✅ Upload directory ready");
    } catch (dirError) {
      console.error("❌ Failed to create upload directory:", dirError);
      throw new Error("Failed to create upload directory");
    }

    // Generate unique filename and save file
    console.log("💾 Saving file...");
    const uniqueFilename = generateUniqueFilename(file.name, actualFacultyId);
    const filePath = join(uploadDir, uniqueFilename);
    
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      console.log("✅ File saved");
    } catch (fileError) {
      console.error("❌ Failed to save file:", fileError);
      throw new Error("Failed to save file to disk");
    }

    const dbFilePath = `/uploads/cv/${uniqueFilename}`;

    // Replace existing CV if any
    console.log("🔍 Checking for existing CV...");
    try {
      const existingCv = await query(
        "SELECT id FROM cv_uploads WHERE faculty_id = $1",
        [actualFacultyId]
      );
      
      if (existingCv.rows.length > 0) {
        console.log("🗑️ Replacing existing CV");
        await query("DELETE FROM cv_uploads WHERE faculty_id = $1", [actualFacultyId]);
      }
    } catch (error) {
      console.error("⚠️ Error checking existing CV:", error);
    }

    // Insert new record
    console.log("💽 Inserting CV record...");
    try {
      const insertResult = await query(
        `INSERT INTO cv_uploads
          (faculty_id, session_metadata_id, file_path, file_type, file_size, original_filename, description, is_approved)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [actualFacultyId, validSessionId, dbFilePath, file.type, file.size, file.name, 'CV Upload', false]
      );

      const uploadedRecord = insertResult.rows[0];
      console.log("✅ CV uploaded successfully");

      return NextResponse.json(
        {
          success: true,
          message: "CV uploaded successfully",
          data: {
            id: uploadedRecord.id,
            fileName: uploadedRecord.original_filename,
            fileType: uploadedRecord.file_type,
            fileSize: uploadedRecord.file_size,
            filePath: uploadedRecord.file_path,
            uploadedAt: uploadedRecord.uploaded_at,
            faculty: { 
              id: faculty.id, 
              name: faculty.name, 
              email: faculty.email 
            },
            sessionId: uploadedRecord.session_metadata_id,
          },
        },
        { status: 201 }
      );
    } catch (dbError) {
      console.error("❌ Database insert failed:", dbError);
      throw new Error(`Database insert failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error("❌ CV UPLOAD ERROR:", error);
    
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
        error: "Failed to upload CV",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}