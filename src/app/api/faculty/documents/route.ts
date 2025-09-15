// src/app/api/faculty/documents/route.ts - FIXED TYPESCRIPT TYPES
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/connection";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";

// FIXED: Define proper types for the faculty data structure
type FacultyDocument = {
  id: any;
  fileName: any;
  fileSize: any;
  fileUrl: any;
  uploadedAt: any;
};

type FacultyCVDocument = FacultyDocument & {
  isApproved: any;
};

type FacultyData = {
  id: any;
  name: any;
  email: any;
  institution: any;
  designation: any;
  sessionTitle: any;
  inviteStatus: any;
  presentation: FacultyDocument | null;  // FIXED: Allow both object and null
  cv: FacultyCVDocument | null;          // FIXED: Allow both object and null
};

export async function GET(req: NextRequest) {
  try {
    console.log("=== FACULTY DOCUMENTS API - MULTI-ROLE ===");
    
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const userRole = session.user.role;
    console.log("User role:", userRole);

    // Allow multiple roles with different permissions
    const allowedRoles = ['ORGANIZER', 'EVENT_MANAGER', 'FACULTY'];
    if (!allowedRoles.includes(userRole || '')) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Insufficient permissions",
          debug: { userRole, allowedRoles }
        },
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

    console.log(`Fetching faculty documents for event: ${eventId}, session: ${sessionId}`);

    // Different logic based on user role
    if (userRole === 'FACULTY') {
      console.log("FACULTY user - showing only their own documents");
      
      // For FACULTY users, only show their own documents
      const facultyEmail = session.user.email;
      const facultyId = session.user.id;
      
      // Check if this faculty is associated with the session
      const facultySessionQuery = `
        SELECT 
          sm.faculty_id,
          sm.faculty_email,
          sm.invite_status,
          cs.title as session_title
        FROM session_metadata sm
        INNER JOIN conference_sessions cs ON sm.session_id = cs.id
        WHERE cs.event_id = $1 
          AND cs.id = $2 
          AND (sm.faculty_email = $3 OR sm.faculty_id = $4)
      `;

      const facultyResult = await query(facultySessionQuery, [eventId, sessionId, facultyEmail, facultyId]);
      
      if (facultyResult.rows.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          meta: { 
            eventId, 
            sessionId, 
            totalFaculty: 0,
            message: "You are not associated with this session"
          }
        });
      }

      // FIXED: Use proper type definition
      const faculty = facultyResult.rows[0];
      const facultyData: FacultyData = {
        id: faculty.faculty_id,
        name: session.user.name || facultyEmail?.split('@')[0],
        email: facultyEmail,
        institution: 'Not specified',
        designation: 'Faculty Member',
        sessionTitle: faculty.session_title,
        inviteStatus: faculty.invite_status,
        presentation: null,  // Initially null, will be updated if found
        cv: null             // Initially null, will be updated if found
      };

      // Find presentation
      const presentationQuery = `
        SELECT p.*, u.email as user_email
        FROM presentations p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE (p.user_id = $1 OR u.email = $2)
        ORDER BY p.uploaded_at DESC
        LIMIT 1
      `;
      
      const presentationResult = await query(presentationQuery, [facultyId, facultyEmail]);
      if (presentationResult.rows.length > 0) {
        const presentation = presentationResult.rows[0];
        facultyData.presentation = {
          id: presentation.id,
          fileName: presentation.title || presentation.file_path?.split('/').pop() || `Presentation_${presentation.id}`,
          fileSize: presentation.file_size?.toString() || "0",
          fileUrl: presentation.file_path,
          uploadedAt: presentation.uploaded_at
        };
      }

      // Find CV
      const cvQuery = `
        SELECT cv.*, u.email as user_email
        FROM cv_uploads cv
        LEFT JOIN users u ON cv.faculty_id = u.id
        WHERE (cv.faculty_id = $1 OR u.email = $2)
        ORDER BY cv.uploaded_at DESC
        LIMIT 1
      `;

      const cvResult = await query(cvQuery, [facultyId, facultyEmail]);
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
      }

      return NextResponse.json({
        success: true,
        data: [facultyData],
        meta: {
          eventId,
          sessionId,
          totalFaculty: 1,
          userRole: 'FACULTY',
          viewType: 'self-only'
        }
      });

    } else {
      // For ORGANIZER/EVENT_MANAGER - show all faculty documents
      console.log("ORGANIZER/EVENT_MANAGER user - showing all faculty documents");

      const acceptedFacultyQuery = `
        SELECT 
          sm.id as session_metadata_id,
          sm.faculty_id,
          sm.faculty_email,
          sm.invite_status,
          sm.status as session_status,
          sm.session_id as conference_session_id,
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
      console.log(`Found ${facultyResult.rows.length} accepted faculty for session ${sessionId}`);

      if (facultyResult.rows.length === 0) {
        return NextResponse.json({
          success: true,
          data: [],
          meta: { eventId, sessionId, totalFaculty: 0 }
        });
      }

      const facultyWithDocuments: FacultyData[] = [];

      for (const faculty of facultyResult.rows) {
        const emailName = faculty.faculty_email ? 
          faculty.faculty_email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 
          'Unknown Faculty';

        // FIXED: Use proper type definition
        const facultyData: FacultyData = {
          id: faculty.faculty_id,
          name: faculty.faculty_name || emailName,
          email: faculty.faculty_email,
          institution: faculty.institution || 'Not specified',
          designation: faculty.designation || 'Faculty Member',
          sessionTitle: faculty.session_title,
          inviteStatus: faculty.invite_status,
          presentation: null,  // Initially null, will be updated if found
          cv: null             // Initially null, will be updated if found
        };

        // Find presentations with multiple strategies
        let presentationQuery = `
          SELECT p.*, u.email as user_email
          FROM presentations p
          LEFT JOIN users u ON p.user_id = u.id
          WHERE p.session_id = $1 
            AND (
              p.user_id = $2 
              OR u.email = $3
              OR p.user_id LIKE '%' || $3 || '%'
            )
          ORDER BY p.uploaded_at DESC
          LIMIT 1
        `;

        let presentationResult = await query(presentationQuery, [
          sessionId,
          faculty.faculty_id, 
          faculty.faculty_email
        ]);

        if (presentationResult.rows.length === 0 && faculty.session_metadata_id) {
          presentationResult = await query(presentationQuery, [
            faculty.session_metadata_id,
            faculty.faculty_id, 
            faculty.faculty_email
          ]);
        }

        if (presentationResult.rows.length === 0) {
          const emailBasedQuery = `
            SELECT p.*, u.email as user_email, cs.event_id
            FROM presentations p
            LEFT JOIN users u ON p.user_id = u.id
            LEFT JOIN conference_sessions cs ON p.session_id = cs.id
            WHERE cs.event_id = $1
              AND (
                u.email = $2
                OR p.user_id LIKE '%' || $2 || '%'
              )
            ORDER BY p.uploaded_at DESC
            LIMIT 1
          `;
          presentationResult = await query(emailBasedQuery, [eventId, faculty.faculty_email]);
        }

        if (presentationResult.rows.length > 0) {
          const presentation = presentationResult.rows[0];
          facultyData.presentation = {
            id: presentation.id,
            fileName: presentation.title || presentation.file_path?.split('/').pop() || `Presentation_${presentation.id}`,
            fileSize: presentation.file_size?.toString() || "0",
            fileUrl: presentation.file_path,
            uploadedAt: presentation.uploaded_at
          };
        }

        // Find CV
        let cvQuery = `
          SELECT cv.*, u.email as user_email
          FROM cv_uploads cv
          LEFT JOIN users u ON cv.faculty_id = u.id
          WHERE (
            cv.faculty_id = $1 
            OR u.email = $2
            OR cv.faculty_id LIKE '%' || $2 || '%'
          )
          ORDER BY cv.uploaded_at DESC
          LIMIT 1
        `;

        let cvResult = await query(cvQuery, [
          faculty.faculty_id,
          faculty.faculty_email
        ]);

        if (cvResult.rows.length === 0) {
          const emailOnlyQuery = `
            SELECT cv.*, u.email as user_email
            FROM cv_uploads cv
            LEFT JOIN users u ON cv.faculty_id = u.id
            WHERE u.email = $1
            ORDER BY cv.uploaded_at DESC
            LIMIT 1
          `;
          cvResult = await query(emailOnlyQuery, [faculty.faculty_email]);
        }

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
        }

        facultyWithDocuments.push(facultyData);
      }

      return NextResponse.json({
        success: true,
        data: facultyWithDocuments,
        meta: {
          eventId,
          sessionId,
          totalFaculty: facultyWithDocuments.length,
          withPresentations: facultyWithDocuments.filter(f => f.presentation).length,
          withCVs: facultyWithDocuments.filter(f => f.cv).length,
          userRole: userRole,
          viewType: 'all-faculty'
        }
      });
    }

  } catch (error: any) {
    console.error("Error fetching faculty documents:", error);
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