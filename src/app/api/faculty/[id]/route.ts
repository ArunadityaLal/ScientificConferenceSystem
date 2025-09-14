// src/app/api/faculty/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { z } from 'zod';

// Validation schemas
const UpdateFacultySchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  designation: z.string().optional(),
  institution: z.string().optional(),
  specialization: z.string().optional(),
  bio: z.string().optional(),
  experience: z.number().min(0).optional(),
  qualifications: z.array(z.string()).optional(),
  achievements: z.array(z.string()).optional(),
  socialLinks: z.object({
    linkedin: z.string().url().optional().or(z.literal('')),
    twitter: z.string().url().optional().or(z.literal('')),
    website: z.string().url().optional().or(z.literal('')),
  }).optional(),
  dietaryRequirements: z.string().optional(),
  emergencyContact: z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    relationship: z.string().optional(),
  }).optional(),
  profileImage: z.string().optional(),
});

const InvitationResponseSchema = z.object({
  response: z.enum(['ACCEPT', 'DECLINE']),
  reason: z.string().optional(),
  additionalInfo: z.object({
    dietaryRequirements: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    bio: z.string().optional(),
  }).optional(),
});

// GET /api/faculty/[id] - Get single faculty profile
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const facultyId = params.id;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    // Check permissions
    const canViewFullProfile = 
      session.user.role === 'ORGANIZER' ||
      session.user.role === 'EVENT_MANAGER' ||
      session.user.id === facultyId;

    if (!canViewFullProfile) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this profile' },
        { status: 403 }
      );
    }

    // Get basic faculty profile
    const facultyResult = await query(`
      SELECT * FROM users 
      WHERE id = $1 AND role = 'FACULTY'
    `, [facultyId]);

    if (facultyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    const faculty = facultyResult.rows[0];
    const cvResult = await query(
  `SELECT file_path FROM cv_uploads WHERE faculty_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
  [facultyId]
);
faculty.cv = cvResult.rows.length > 0 ? cvResult.rows[0].file_path : null;


    // Get user events
    let userEventsQuery = `
      SELECT ue.*, e.id as event_id, e.name as event_name, 
             e.start_date, e.end_date, e.status as event_status
      FROM user_events ue
      JOIN events e ON e.id = ue.event_id
      WHERE ue.user_id = $1
    `;
    const userEventsParams = [facultyId];

    if (eventId) {
      userEventsQuery += ` AND ue.event_id = $2`;
      userEventsParams.push(eventId);
    }

    const userEventsResult = await query(userEventsQuery, userEventsParams);
    faculty.userEvents = userEventsResult.rows.map(row => ({
      ...row,
      event: {
        id: row.event_id,
        name: row.event_name,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.event_status
      }
    }));

    // Get session speakers
    const sessionSpeakersResult = await query(`
      SELECT ss.*, cs.id as session_id, cs.title as session_title,
             cs.start_time, cs.end_time, cs.event_id, h.name as hall_name
      FROM session_speakers ss
      JOIN conference_sessions cs ON cs.id = ss.session_id
      LEFT JOIN halls h ON h.id = cs.hall_id
      WHERE ss.user_id = $1
    `, [facultyId]);

    faculty.sessionSpeakers = sessionSpeakersResult.rows.map(row => ({
      ...row,
      session: {
        id: row.session_id,
        title: row.session_title,
        startTime: row.start_time,
        endTime: row.end_time,
        eventId: row.event_id,
        hall: { name: row.hall_name }
      }
    }));

    // Add sensitive data only for authorized users
    if (canViewFullProfile) {
      // Get travel details
      let travelQuery = `
        SELECT * FROM travel_details WHERE user_id = $1
      `;
      const travelParams = [facultyId];

      if (eventId) {
        travelQuery += ` AND event_id = $2`;
        travelParams.push(eventId);
      }

      const travelResult = await query(travelQuery, travelParams);
      faculty.travelDetails = travelResult.rows;

      // Get accommodations
      let accommodationQuery = `
        SELECT * FROM accommodations WHERE user_id = $1
      `;
      const accommodationParams = [facultyId];

      if (eventId) {
        accommodationQuery += ` AND event_id = $2`;
        accommodationParams.push(eventId);
      }

      const accommodationResult = await query(accommodationQuery, accommodationParams);
      faculty.accommodations = accommodationResult.rows;

      // Get presentations
      let presentationsQuery = `
        SELECT p.id, p.title, p.file_path, p.uploaded_at, cs.title as session_title
        FROM presentations p
        JOIN conference_sessions cs ON cs.id = p.session_id
        WHERE p.user_id = $1
      `;
      const presentationsParams = [facultyId];

      if (eventId) {
        presentationsQuery += ` AND cs.event_id = $2`;
        presentationsParams.push(eventId);
      }

      const presentationsResult = await query(presentationsQuery, presentationsParams);
      faculty.presentations = presentationsResult.rows.map(row => ({
        id: row.id,
        title: row.title,
        filePath: row.file_path,
        uploadedAt: row.uploaded_at,
        session: { title: row.session_title }
      }));

      // ✅ FIXED: Get certificates - Changed recipient_id to user_id
      let certificatesQuery = `
        SELECT id, type, file_path, generated_at
        FROM certificates WHERE user_id = $1
      `;
      const certificatesParams = [facultyId];

      if (eventId) {
        certificatesQuery += ` AND event_id = $2`;
        certificatesParams.push(eventId);
      }

      const certificatesResult = await query(certificatesQuery, certificatesParams);
      faculty.certificates = certificatesResult.rows.map(row => ({
        id: row.id,
        type: row.type,
        filePath: row.file_path,
        generatedAt: row.generated_at
      }));
    }

    // Remove sensitive fields for non-authorized users
    if (!canViewFullProfile) {
      const { phone, email, emergency_contact, dietary_requirements, ...publicProfile } = faculty;
      return NextResponse.json({
        success: true,
        data: publicProfile
      });
    }

    return NextResponse.json({
      success: true,
      data: faculty
    });

  } catch (error) {
    console.error('Faculty GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch faculty profile' },
      { status: 500 }
    );
  }
}

// PUT /api/faculty/[id] - Update faculty profile
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const facultyId = params.id;
    const body = await request.json();

    // Check permissions
    const canUpdate = 
      session.user.role === 'ORGANIZER' ||
      session.user.role === 'EVENT_MANAGER' ||
      session.user.id === facultyId;

    if (!canUpdate) {
      return NextResponse.json(
        { error: 'Insufficient permissions to update this profile' },
        { status: 403 }
      );
    }

    // Validate faculty exists
    const existingFacultyResult = await query(`
      SELECT * FROM users 
      WHERE id = $1 AND role = 'FACULTY'
    `, [facultyId]);

    if (existingFacultyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    // Validate and parse updates
    const validatedUpdates = UpdateFacultySchema.parse(body);

    // Process social links (handle empty strings)
    if (validatedUpdates.socialLinks) {
      const processedLinks: any = {};
      Object.entries(validatedUpdates.socialLinks).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          processedLinks[key] = value;
        }
      });
      validatedUpdates.socialLinks = processedLinks;
    }

    // Build update query
    const updateFields = [];
    const queryParams = [];
    let paramCount = 0;

    for (const [key, value] of Object.entries(validatedUpdates)) {
      if (value !== undefined) {
        paramCount++;
        // Convert camelCase to snake_case for database
        const dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        if (typeof value === 'object' && value !== null) {
          updateFields.push(`${dbField} = $${paramCount}::jsonb`);
          queryParams.push(JSON.stringify(value));
        } else {
          updateFields.push(`${dbField} = $${paramCount}`);
          queryParams.push(value);
        }
      }
    }

    // Add updated_at field
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    queryParams.push(new Date());

    // Add WHERE condition
    paramCount++;
    queryParams.push(facultyId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const updateResult = await query(updateQuery, queryParams);
    const updatedFaculty = updateResult.rows[0];

    // Get additional data for response
    // Get user events
    const userEventsResult = await query(`
      SELECT ue.*, e.id as event_id, e.name as event_name, 
             e.start_date, e.end_date
      FROM user_events ue
      JOIN events e ON e.id = ue.event_id
      WHERE ue.user_id = $1
    `, [facultyId]);

    updatedFaculty.userEvents = userEventsResult.rows.map(row => ({
      ...row,
      event: {
        id: row.event_id,
        name: row.event_name,
        startDate: row.start_date,
        endDate: row.end_date
      }
    }));

    // Get session speakers
    const sessionSpeakersResult = await query(`
      SELECT ss.*, cs.id as session_id, cs.title as session_title,
             cs.start_time, cs.end_time, h.name as hall_name
      FROM session_speakers ss
      JOIN conference_sessions cs ON cs.id = ss.session_id
      LEFT JOIN halls h ON h.id = cs.hall_id
      WHERE ss.user_id = $1
    `, [facultyId]);

    updatedFaculty.sessionSpeakers = sessionSpeakersResult.rows.map(row => ({
      ...row,
      session: {
        id: row.session_id,
        title: row.session_title,
        startTime: row.start_time,
        endTime: row.end_time,
        hall: { name: row.hall_name }
      }
    }));

    return NextResponse.json({
      success: true,
      data: updatedFaculty,
      message: 'Faculty profile updated successfully'
    });

  } catch (error) {
    console.error('Faculty PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update faculty profile' },
      { status: 500 }
    );
  }
}

// DELETE /api/faculty/[id] - Remove faculty from system
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const facultyId = params.id;
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const removeFromSystem = searchParams.get('removeFromSystem') === 'true';

    // Check permissions - only organizers can remove faculty
    if (session.user.role !== 'ORGANIZER') {
      return NextResponse.json(
        { error: 'Only organizers can remove faculty' },
        { status: 403 }
      );
    }

    // Validate faculty exists
    const existingFacultyResult = await query(`
      SELECT * FROM users 
      WHERE id = $1 AND role = 'FACULTY'
    `, [facultyId]);

    if (existingFacultyResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Faculty member not found' },
        { status: 404 }
      );
    }

    if (removeFromSystem) {
      // Complete removal from system (use with caution)
      await query('DELETE FROM users WHERE id = $1', [facultyId]);

      return NextResponse.json({
        success: true,
        message: 'Faculty member removed from system completely'
      });
    } else if (eventId) {
      // Remove from specific event only
      await query(`
        DELETE FROM user_events 
        WHERE user_id = $1 AND event_id = $2
      `, [facultyId, eventId]);

      // Also remove from session speakers for this event
      await query(`
        DELETE FROM session_speakers 
        WHERE user_id = $1 AND session_id IN (
          SELECT id FROM conference_sessions WHERE event_id = $2
        )
      `, [facultyId, eventId]);

      return NextResponse.json({
        success: true,
        message: 'Faculty member removed from event'
      });
    } else {
      return NextResponse.json(
        { error: 'Either eventId or removeFromSystem parameter is required' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Faculty DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to remove faculty member' },
      { status: 500 }
    );
  }
}

// PATCH /api/faculty/[id] - Handle invitation responses
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const facultyId = params.id;
    const body = await request.json();
    const { action } = body;

    if (action === 'respond-invitation') {
      return await handleInvitationResponse(facultyId, body);
    } else if (action === 'resend-invitation') {
      return await handleResendInvitation(facultyId, body);
    } else {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Faculty PATCH Error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}

// Helper function: Handle invitation response
async function handleInvitationResponse(facultyId: string, body: any) {
  const validatedData = InvitationResponseSchema.parse(body);
  const { response, reason, additionalInfo } = validatedData;

  // Update user event status
  const updateResult = await query(`
    UPDATE user_events 
    SET status = $1, response_at = NOW(), response_reason = $2, updated_at = NOW()
    WHERE user_id = $3 AND status = 'PENDING'
  `, [
    response === 'ACCEPT' ? 'ACTIVE' : 'DECLINED',
    reason,
    facultyId
  ]);

  // If accepted, update profile with additional info
  if (response === 'ACCEPT' && additionalInfo) {
    const updateFields = [];
    const queryParams = [];
    let paramCount = 0;

    if (additionalInfo.bio) {
      paramCount++;
      updateFields.push(`bio = $${paramCount}`);
      queryParams.push(additionalInfo.bio);
    }

    if (additionalInfo.dietaryRequirements) {
      paramCount++;
      updateFields.push(`dietary_requirements = $${paramCount}`);
      queryParams.push(additionalInfo.dietaryRequirements);
    }

    if (additionalInfo.emergencyContact) {
      paramCount++;
      updateFields.push(`emergency_contact = $${paramCount}::jsonb`);
      queryParams.push(JSON.stringify(additionalInfo.emergencyContact));
    }

    // Mark email as verified
    paramCount++;
    updateFields.push(`email_verified = $${paramCount}`);
    queryParams.push(new Date());

    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    queryParams.push(new Date());

    if (updateFields.length > 0) {
      paramCount++;
      queryParams.push(facultyId);

      await query(`
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
      `, queryParams);
    }
  }

  return NextResponse.json({
    success: true,
    data: { response, facultyId },
    message: response === 'ACCEPT' 
      ? 'Invitation accepted successfully!' 
      : 'Invitation declined'
  });
}

// Helper function: Resend invitation
async function handleResendInvitation(facultyId: string, body: any) {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { eventId, customMessage } = body;

  // Get faculty details
  const facultyResult = await query('SELECT * FROM users WHERE id = $1', [facultyId]);
  
  if (facultyResult.rows.length === 0) {
    return NextResponse.json(
      { error: 'Faculty not found' },
      { status: 404 }
    );
  }

  const faculty = facultyResult.rows[0];
  const cvResult = await query(
  `SELECT file_path FROM cv_uploads WHERE faculty_id = $1 ORDER BY uploaded_at DESC LIMIT 1`,
  [facultyId]
);
faculty.cv = cvResult.rows.length > 0 ? cvResult.rows[0].file_path : null;


  // Get user event details
  const userEventResult = await query(`
    SELECT ue.*, e.name as event_name
    FROM user_events ue
    JOIN events e ON e.id = ue.event_id
    WHERE ue.user_id = $1 AND ue.event_id = $2
  `, [facultyId, eventId]);

  if (userEventResult.rows.length === 0) {
    return NextResponse.json(
      { error: 'Event association not found' },
      { status: 404 }
    );
  }

  const userEvent = userEventResult.rows[0];

  // Generate new invitation token
  const invitationToken = Buffer.from(
    JSON.stringify({
      userId: facultyId,
      eventId: eventId,
      email: faculty.email,
      expires: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
    })
  ).toString('base64');

  // Log email for resending
  await query(`
    INSERT INTO email_logs (
      recipient, subject, content, type, status, metadata, created_at
    ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
  `, [
    faculty.email,
    `Reminder: Invitation to ${userEvent.event_name}`,
    customMessage || `This is a reminder about your invitation to participate in our conference.`,
    'FACULTY_INVITATION_REMINDER',
    'PENDING',
    JSON.stringify({
      eventId: eventId,
      facultyId: facultyId,
      invitationToken
    })
  ]);

  return NextResponse.json({
    success: true,
    message: 'Invitation resent successfully',
    data: { facultyId, eventId, invitationToken }
  });
}