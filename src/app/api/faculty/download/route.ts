// src/app/api/faculty/download/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { query } from "@/lib/database/connection";
import fs from 'fs';
import path from 'path';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Allow ORGANIZER, EVENT_MANAGER, and FACULTY (for their own files)
    if (!['ORGANIZER', 'EVENT_MANAGER', 'FACULTY'].includes(session.user.role || '')) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const fileId = req.nextUrl.searchParams.get("fileId");
    const fileType = req.nextUrl.searchParams.get("type"); // 'cv' or 'presentation'
    const fileName = req.nextUrl.searchParams.get("name") || "download";

    if (!fileId || !fileType) {
      return NextResponse.json(
        { success: false, error: "File ID and type required" },
        { status: 400 }
      );
    }

    // Check if this is a preview request
    const isPreview = fileName === "preview";

    console.log(`📁 ${isPreview ? 'Preview' : 'Download'} request - ID: ${fileId}, Type: ${fileType}, User: ${session.user.email}`);

    let fileQuery = '';
    let queryParams = [fileId];

    // Get file record from appropriate table
    if (fileType === 'cv') {
      fileQuery = `
        SELECT 
          cv.id,
          cv.faculty_id,
          cv.file_path,
          cv.original_filename,
          cv.file_type,
          cv.file_size,
          cv.description,
          cv.is_approved,
          u.name as faculty_name,
          u.email as faculty_email
        FROM cv_uploads cv
        LEFT JOIN users u ON cv.faculty_id = u.id
        WHERE cv.id = $1
      `;
    } else if (fileType === 'presentation') {
      fileQuery = `
        SELECT 
          p.id,
          p.user_id as faculty_id,
          p.file_path,
          p.title as original_filename,
          'application/pdf' as file_type,
          p.file_size,
          p.title,
          u.name as faculty_name,
          u.email as faculty_email
        FROM presentations p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `;
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Must be 'cv' or 'presentation'" },
        { status: 400 }
      );
    }

    const result = await query(fileQuery, queryParams);

    if (result.rows.length === 0) {
      return NextResponse.json({
        success: false,
        error: "File not found",
        message: "The requested file does not exist in the database.",
        fileId: fileId,
        fileType: fileType
      }, { status: 404 });
    }

    const fileRecord = result.rows[0];

    // Additional permission check for FACULTY role
    if (session.user.role === 'FACULTY') {
      // Faculty can only access their own files
      const sessionUserId = session.user.id;
      let baseSessionId = sessionUserId;
      if (typeof sessionUserId === 'string') {
        const sessionParts = sessionUserId.split('-');
        if (
          sessionParts.length >= 2 &&
          sessionParts[0] === 'faculty' &&
          typeof sessionParts[1] === 'string' &&
          sessionParts[1]?.startsWith('evt_')
        ) {
          baseSessionId = sessionParts.slice(0, 2).join('-');
        }
      }

      const hasPermission = (
        sessionUserId === fileRecord.faculty_id || 
        baseSessionId === fileRecord.faculty_id ||
        session.user.email === fileRecord.faculty_email
      );

      if (!hasPermission) {
        return NextResponse.json({
          success: false,
          error: "Access denied",
          message: "You can only access your own files."
        }, { status: 403 });
      }
    }

    // Check if file_path exists
    if (!fileRecord.file_path) {
      return NextResponse.json({
        success: false,
        error: "No file path available",
        message: "File record exists but contains no file path.",
        suggestions: [
          "File may not have been uploaded properly",
          "Ask the faculty member to re-upload their document",
          "Contact system administrator if the issue persists"
        ]
      }, { status: 404 });
    }

    console.log(`📄 Looking for file: ${fileRecord.file_path}`);
    
    // Try multiple possible file locations based on your upload structure
    const possiblePaths = [
      path.join(process.cwd(), 'public', fileRecord.file_path),
      path.join(process.cwd(), fileRecord.file_path.startsWith('/') ? fileRecord.file_path.slice(1) : fileRecord.file_path),
      path.join(process.cwd(), 'public', 'uploads', fileType, path.basename(fileRecord.file_path)),
    ];

    let actualFilePath = null;
    let fileBuffer: Buffer;
    
    // Check each possible location
    for (const possiblePath of possiblePaths) {
      console.log(`🔍 Checking: ${possiblePath}`);
      if (fs.existsSync(possiblePath)) {
        actualFilePath = possiblePath;
        console.log(`✅ Found file at: ${actualFilePath}`);
        break;
      } else {
        console.log(`❌ Not found at: ${possiblePath}`);
      }
    }

    if (!actualFilePath) {
      return NextResponse.json({
        success: false,
        error: "File not found on disk",
        message: "File record exists but physical file is missing from server.",
        suggestions: [
          "Ask the faculty member to re-upload their document",
          "File may have been moved or deleted from server",
          "Contact system administrator if the issue persists"
        ],
        filePath: fileRecord.file_path,
        checkedPaths: possiblePaths
      }, { status: 404 });
    }

    // Read file from disk
    try {
      fileBuffer = fs.readFileSync(actualFilePath);
      console.log(`📄 File read successfully: ${fileBuffer.length} bytes`);
    } catch (error) {
      console.error(`❌ Error reading file: ${error}`);
      return NextResponse.json({
        success: false,
        error: "File read error",
        message: "Could not read the file from disk.",
        details: typeof error === "object" && error !== null && "message" in error ? (error as any).message : String(error)
      }, { status: 500 });
    }

    // Determine filename and content type
    let downloadFileName = fileRecord.original_filename || fileName;
    let contentType = fileRecord.file_type || 'application/octet-stream';
    
    // If no original filename, use the file path basename
    if (!downloadFileName || downloadFileName === fileName) {
      downloadFileName = path.basename(actualFilePath);
    }
    
    // Determine content type from file extension if not in database
    if (!contentType || contentType === 'application/octet-stream') {
      const ext = path.extname(actualFilePath).toLowerCase();
      switch (ext) {
        case '.pdf':
          contentType = 'application/pdf';
          break;
        case '.doc':
          contentType = 'application/msword';
          break;
        case '.docx':
          contentType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
          break;
        case '.ppt':
          contentType = 'application/vnd.ms-powerpoint';
          break;
        case '.pptx':
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
        default:
          contentType = 'application/octet-stream';
      }
    }

    console.log(`📄 Serving file: ${downloadFileName} (${fileBuffer.length} bytes, ${contentType}) - ${isPreview ? 'Inline Preview' : 'Download'}`);

    // Create response with proper headers
    const response = new NextResponse(new Uint8Array(fileBuffer));
    
    response.headers.set('Content-Type', contentType);
    response.headers.set('Content-Length', fileBuffer.length.toString());
    
    // Set Content-Disposition based on whether it's a preview or download
    if (isPreview) {
      response.headers.set('Content-Disposition', 'inline');
    } else {
      response.headers.set('Content-Disposition', `attachment; filename="${downloadFileName}"`);
    }
    
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');

    return response;

  } catch (error: any) {
    console.error("❌ Download error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Download failed",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";