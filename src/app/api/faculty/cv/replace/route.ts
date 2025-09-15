// app/api/faculty/cv/replace/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { query } from "@/lib/database/connection";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { z } from "zod";

// Validation schema for CV replace
const ReplaceSchema = z.object({
  id: z.string().min(1, "CV ID is required"),
  facultyId: z.string().min(1, "Faculty ID is required"),
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
  const sessionParts = session.user.id.split('-');
  const baseSessionId = sessionParts.length >= 2 && sessionParts[0] === 'faculty' && sessionParts[1]?.startsWith('evt_') 
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

// POST endpoint for replacing CVs
export async function POST(request: NextRequest) {
  let actualFacultyId = "";
  
  try {
    console.log("=== CV REPLACE STARTED ===");

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
    const cvId = (formData.get("id") as string | null) ?? "";
    const facultyId = (formData.get("facultyId") as string | null) ?? "";

    console.log("📝 Form data received:", { 
      hasFile: !!file, 
      cvId,
      facultyId,
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
      ReplaceSchema.parse({ id: cvId, facultyId });
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

    // Get existing CV record to verify ownership and get old file path
    console.log("🔍 Getting existing CV record...");
    const existingCvRes = await query(
      "SELECT id, faculty_id, file_path, session_metadata_id FROM cv_uploads WHERE id = $1",
      [cvId]
    );

    if (!existingCvRes.rows.length) {
      console.log("❌ CV not found");
      return NextResponse.json({ error: "CV not found" }, { status: 404 });
    }

    const existingCv = existingCvRes.rows[0];

    // Verify ownership
    if (existingCv.faculty_id !== actualFacultyId) {
      console.log("❌ CV ownership verification failed");
      return NextResponse.json({ error: "Not authorized to replace this CV" }, { status: 403 });
    }

    console.log("✅ CV ownership verified, proceeding with replacement");

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

    // Generate unique filename and save new file
    console.log("💾 Saving new file...");
    const uniqueFilename = generateUniqueFilename(file.name, actualFacultyId);
    const filePath = join(uploadDir, uniqueFilename);
    
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      console.log("✅ New file saved");
    } catch (fileError) {
      console.error("❌ Failed to save new file:", fileError);
      throw new Error("Failed to save new file to disk");
    }

    const dbFilePath = `/uploads/cv/${uniqueFilename}`;

    // Update CV record in database
    console.log("💽 Updating CV record...");
    try {
      const updateResult = await query(
        `UPDATE cv_uploads
         SET file_path = $1, file_type = $2, file_size = $3, original_filename = $4, uploaded_at = NOW()
         WHERE id = $5 RETURNING *`,
        [dbFilePath, file.type, file.size, file.name, cvId]
      );

      const updatedRecord = updateResult.rows[0];
      console.log("✅ CV record updated");

      // Delete old file from filesystem
      try {
        const oldFilePath = join(process.cwd(), "public", existingCv.file_path);
        await unlink(oldFilePath);
        console.log("✅ Old file deleted from filesystem");
      } catch (fileError) {
        console.log("⚠️ Warning: Could not delete old file from filesystem:", fileError);
        // Continue even if old file deletion fails
      }

      return NextResponse.json(
        {
          success: true,
          message: "CV replaced successfully",
          data: {
            id: updatedRecord.id,
            fileName: updatedRecord.original_filename,
            fileType: updatedRecord.file_type,
            fileSize: updatedRecord.file_size,
            filePath: updatedRecord.file_path,
            uploadedAt: updatedRecord.uploaded_at,
            faculty: { 
              id: faculty.id, 
              name: faculty.name, 
              email: faculty.email 
            },
            sessionId: updatedRecord.session_metadata_id,
          },
        },
        { status: 200 }
      );
    } catch (dbError) {
      console.error("❌ Database update failed:", dbError);
      // If database update fails, try to delete the new file
      try {
        await unlink(filePath);
      } catch (cleanupError) {
        console.error("❌ Failed to cleanup new file after database error:", cleanupError);
      }
      throw new Error(`Database update failed: ${dbError instanceof Error ? dbError.message : 'Unknown error'}`);
    }

  } catch (error) {
    console.error("❌ CV REPLACE ERROR:", error);
    
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
        error: "Failed to replace CV",
        details: error instanceof Error ? error.message : "Unknown error"
      }, 
      { status: 500 }
    );
  }
}