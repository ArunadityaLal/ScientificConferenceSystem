// src/app/api/faculty/documents/route.ts - FINAL WORKING VERSION
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/connection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json(
        { success: false, error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const eventId = searchParams.get("eventId");
    const sessionId = searchParams.get("sessionId");

    if (!eventId || !sessionId) {
      return NextResponse.json(
        { success: false, error: "Event ID and Session ID are required" },
        { status: 400 }
      );
    }

    console.log(`🔍 Fetching faculty documents for event: ${eventId}, session: ${sessionId}`);

    // Step 1: Get accepted faculty for the session
    const acceptedFacultyQuery = `
      SELECT 
        sm.faculty_id,
        sm.faculty_email,
        sm.invite_status,
        sm.status as session_status,
        cs.id as session_id,
        cs.title as session_title,
        u.id as user_id,
        u.name as faculty_name,
        u.email as user_email,
        u.institution,
        u.designation
      FROM session_metadata sm
      INNER JOIN conference_sessions cs ON sm.session_id = cs.id
      LEFT JOIN users u ON sm.faculty_id = u.id
      WHERE cs.event_id = $1 
        AND cs.id = $2 
        AND sm.invite_status = 'Accepted'
    `;

    const facultyResult = await query(acceptedFacultyQuery, [eventId, sessionId]);
    console.log(`📊 Found ${facultyResult.rows.length} accepted faculty`);

    if (facultyResult.rows.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        meta: { eventId, sessionId, totalFaculty: 0 }
      });
    }

    // Step 2: For each faculty, find their documents using email as the primary identifier
    const facultyWithDocuments = [];

    for (const faculty of facultyResult.rows) {
      console.log(`🔍 Processing faculty: ${faculty.faculty_email}`);

      // Extract name from email if not available
      const emailName = faculty.faculty_email ? 
        faculty.faculty_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 
        'Unknown Faculty';

      const facultyData: {
        id: any;
        name: any;
        email: any;
        institution: any;
        designation: any;
        sessionTitle: any;
        inviteStatus: any;
        presentation: null | {
          id: any;
          fileName: any;
          fileSize: any;
          fileUrl: any;
          uploadedAt: any;
        };
        cv: null | {
          id: any;
          fileName: any;
          fileSize: any;
          fileUrl: any;
          uploadedAt: any;
          isApproved: any;
        };
      } = {
        id: faculty.faculty_id,
        name: faculty.faculty_name || emailName,
        email: faculty.faculty_email,
        institution: faculty.institution || 'Not specified',
        designation: faculty.designation || 'Faculty Member',
        sessionTitle: faculty.session_title,
        inviteStatus: faculty.invite_status,
        presentation: null,
        cv: null
      };

      // Step 3: Find presentations for this faculty/session
      // Search by email, faculty_id, and session_id
      const presentationQuery = `
        SELECT p.*, u.email as user_email
        FROM presentations p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.session_id = $1 
          AND (
            p.user_id = $2 
            OR u.email = $3
            OR p.user_id LIKE '%' || $3 || '%'
          )
      `;

      const presentationResult = await query(presentationQuery, [
        sessionId, 
        faculty.faculty_id, 
        faculty.faculty_email
      ]);

      if (presentationResult.rows.length > 0) {
        const presentation = presentationResult.rows[0];
        facultyData.presentation = {
          id: presentation.id,
          fileName: presentation.title || presentation.file_path?.split('/').pop() || `Presentation_${presentation.id}`,
          fileSize: presentation.file_size?.toString() || "0",
          fileUrl: presentation.file_path,
          uploadedAt: presentation.uploaded_at
        };
        console.log(`📎 Found presentation for ${faculty.faculty_email}`);
      }

      // Step 4: Find CV for this faculty
      // Search by faculty_id and email patterns
      const cvQuery = `
        SELECT cv.*, u.email as user_email
        FROM cv_uploads cv
        LEFT JOIN users u ON cv.faculty_id = u.id
        WHERE cv.faculty_id = $1 
          OR u.email = $2
          OR cv.faculty_id LIKE '%' || $2 || '%'
      `;

      const cvResult = await query(cvQuery, [
        faculty.faculty_id,
        faculty.faculty_email
      ]);

      if (cvResult.rows.length > 0) {
        const cv = cvResult.rows[0];
        facultyData.cv = {
          id: cv.id,
          fileName: cv.original_filename || cv.file_path?.split('/').pop() || `CV_${cv.id}`,
          fileSize: cv.file_size?.toString() || "0",
          fileUrl: cv.file_path,
          uploadedAt: cv.uploaded_at,
          isApproved: cv.is_approved
        };
        console.log(`📄 Found CV for ${faculty.faculty_email}`);
      }

      facultyWithDocuments.push(facultyData);
    }

    console.log(`✅ Processed ${facultyWithDocuments.length} faculty members with documents`);

    return NextResponse.json({
      success: true,
      data: facultyWithDocuments,
      meta: {
        eventId,
        sessionId,
        totalFaculty: facultyWithDocuments.length,
        withPresentations: facultyWithDocuments.filter(f => f.presentation).length,
        withCVs: facultyWithDocuments.filter(f => f.cv).length
      }
    });

  } catch (error: any) {
    console.error("❌ Error fetching faculty documents:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to fetch faculty documents",
        details: error?.message || "Unknown error"
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";