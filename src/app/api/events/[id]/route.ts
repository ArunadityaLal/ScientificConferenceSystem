// src/app/api/events/[id]/route.ts - FIXED: Safe JSON Parsing for Edit
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { z } from 'zod';

// ✅ FIXED: Safe JSON parsing helper function with special permission handling
function safeJSONParse(jsonString: any, fallback: any = null): any {
  if (!jsonString) return fallback;
  if (typeof jsonString !== 'string') return fallback;
  
  // ✅ FIXED: Handle single permission strings like "FULL_ACCESS"
  if (jsonString === 'FULL_ACCESS' || jsonString === 'READ' || jsonString === 'WRITE') {
    return [jsonString]; // Convert single permission to array
  }
  
  // ✅ FIXED: Handle comma-separated permissions
  if (jsonString.includes(',') && !jsonString.startsWith('[')) {
    return jsonString.split(',').map(p => p.trim());
  }
  
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.warn(`Invalid JSON data: ${jsonString}`, error);
    return fallback;
  }
}

// ✅ FIXED: Safe request body parsing
async function safeParseRequestBody(request: NextRequest): Promise<any> {
  try {
    const text = await request.text();
    console.log('📥 Raw request body:', text);
    
    if (!text || text.trim() === '') {
      console.warn('⚠️ Empty request body received');
      return {};
    }
    
    const parsed = JSON.parse(text);
    console.log('✅ Parsed request body:', parsed);
    return parsed;
  } catch (error) {
    console.error('❌ Request body parsing error:', error);
    console.error('❌ Raw body that failed to parse:', await request.text().catch(() => 'Unable to read'));
    return {};
  }
}

// ✅ FIXED: Update event schema - removed capacity, registrationDeadline, isPublic (missing columns)
const UpdateEventSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  website: z.string().url().optional().or(z.literal("")),
  tags: z.array(z.string()).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});

// GET /api/events/[id] - Get single event with enhanced data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    console.log('🔍 Checking permissions for user:', session.user.email, 'role:', session.user.role, 'eventId:', eventId);

    // ✅ FIXED: Enhanced permission check
    const permissionCheck = await query(
      `
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2
      `,
      [session.user.id, eventId]
    );

    // ✅ FIXED: Check if user is event creator
    const creatorCheck = await query(
      `SELECT created_by FROM events WHERE id = $1`,
      [eventId]
    );

    const isEventCreator = creatorCheck.rows.length > 0 && creatorCheck.rows[0].created_by === session.user.id;
    
    // ✅ FIXED: Allow access if user has any permission, is event creator, or has admin roles
    const hasPermission = 
      permissionCheck.rows.length > 0 || 
      isEventCreator ||
      ['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '');
    
    console.log('🔐 Permission check result:', {
      hasUserEventPermission: permissionCheck.rows.length > 0,
      isEventCreator,
      userRole: session.user.role,
      hasPermission
    });
    
    if (!hasPermission) {
      console.log('❌ Access denied for user:', session.user.email);
      return NextResponse.json(
        { error: 'You do not have permission to view this event' },
        { status: 403 }
      );
    }

    // ✅ FIXED: Get event details with only existing columns
    const eventResult = await query(
      `
      SELECT 
        e.id,
        e.name,
        e.description,
        e.start_date,
        e.end_date,
        e.location,
        e.status,
        e.created_by,
        e.created_at,
        e.updated_at,
        u.name as creator_name,
        u.email as creator_email
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1
      `,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      console.log('❌ Event not found:', eventId);
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const eventRow = eventResult.rows[0];
    console.log('✅ Event found:', eventRow.name, 'dates:', eventRow.start_date, '-', eventRow.end_date);

    // ✅ FIXED: Get sessions with proper column names
    const sessionsResult = await query(
      `
      SELECT 
        cs.id,
        cs.event_id,
        cs.title,
        cs.description,
        cs.start_time,
        cs.end_time,
        h.name as hall_name,
        h.capacity as hall_capacity
      FROM conference_sessions cs
      LEFT JOIN halls h ON cs.hall_id = h.id
      WHERE cs.event_id = $1
      ORDER BY cs.start_time ASC
      `,
      [eventId]
    );

    // ✅ FIXED: Get registrations
    const registrationsResult = await query(
      `
      SELECT 
        r.id,
        r.user_id,
        r.event_id,
        r.status,
        r.created_at as registration_date,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM registrations r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.event_id = $1
      ORDER BY r.created_at DESC
      `,
      [eventId]
    );

    // ✅ FIXED: Get event faculty/staff
    const facultyResult = await query(
      `
      SELECT 
        ue.id,
        ue.user_id,
        ue.event_id,
        ue.role,
        ue.permissions,
        u.id as user_id,
        u.name as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM user_events ue
      LEFT JOIN users u ON ue.user_id = u.id
      WHERE ue.event_id = $1 AND ue.role IN ('SPEAKER', 'MODERATOR', 'CHAIRPERSON')
      ORDER BY u.name ASC
      `,
      [eventId]
    );

    // ✅ FIXED: Get halls - Fixed query to check if halls exist for this event
    const hallsResult = await query(
      `
      SELECT id, name, capacity, equipment
      FROM halls
      WHERE event_id = $1
      ORDER BY name ASC
      `,
      [eventId]
    );

    // ✅ FIXED: Build response with safe JSON parsing and only existing fields
    const eventData = {
      id: eventRow.id,
      name: eventRow.name,
      description: eventRow.description,
      startDate: eventRow.start_date, // ✅ Direct database value
      endDate: eventRow.end_date,     // ✅ Direct database value
      location: eventRow.location,
      status: eventRow.status,
      createdBy: eventRow.created_by,
      createdAt: eventRow.created_at,
      updatedAt: eventRow.updated_at,
      creator: {
        name: eventRow.creator_name,
        email: eventRow.creator_email
      }
    };

    console.log('📊 Event data prepared:', {
      name: eventData.name,
      startDate: eventData.startDate,
      endDate: eventData.endDate,
      location: eventData.location,
      status: eventData.status
    });

    // ✅ FIXED: Process sessions
    const sessions = sessionsResult.rows.map(row => ({
      id: row.id,
      eventId: row.event_id,
      title: row.title,
      description: row.description,
      startTime: row.start_time,
      endTime: row.end_time,
      hall: {
        name: row.hall_name,
        capacity: row.hall_capacity
      }
    }));

    // ✅ FIXED: Process registrations
    const registrations = registrationsResult.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      status: row.status,
      registrationDate: row.registration_date,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        phone: row.user_phone
      }
    }));

    // ✅ FIXED: Process faculty with safe permission parsing
    const faculty = facultyResult.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      eventId: row.event_id,
      role: row.role,
      permissions: safeJSONParse(row.permissions, ['READ']), // ✅ Safe parsing with fallback
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        phone: row.user_phone
      }
    }));

    // ✅ FIXED: Process halls
    const halls = hallsResult.rows.map(row => ({
      id: row.id,
      name: row.name,
      capacity: row.capacity,
      equipment: safeJSONParse(row.equipment, []) // ✅ Safe parsing
    }));

    console.log('✅ API Response prepared successfully with', {
      sessions: sessions.length,
      registrations: registrations.length,
      faculty: faculty.length,
      halls: halls.length
    });

    return NextResponse.json({
      success: true,
      data: {
        event: eventData,
        sessions,
        registrations,
        faculty,
        halls,
        stats: {
          totalSessions: sessions.length,
          totalRegistrations: registrations.length,
          totalFaculty: faculty.length,
          totalHalls: halls.length
        }
      }
    });

  } catch (error) {
    console.error('❌ Event GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event details' },
      { status: 500 }
    );
  }
}

// ✅ FIXED: PUT /api/events/[id] - Update event with safe JSON parsing
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;
    console.log('🔄 Event UPDATE started for:', eventId, 'by user:', session.user.email);

    // ✅ FIXED: Enhanced permission check for editing
    const permissionCheck = await query(
      `
      SELECT permissions FROM user_events 
      WHERE user_id = $1 AND event_id = $2
      `,
      [session.user.id, eventId]
    );

    // ✅ FIXED: Check if user is event creator
    const creatorCheck = await query(
      `SELECT created_by FROM events WHERE id = $1`,
      [eventId]
    );

    const isEventCreator = creatorCheck.rows.length > 0 && creatorCheck.rows[0].created_by === session.user.id;
    const userPermissions = permissionCheck.rows[0]?.permissions || [];
    
    const hasWriteAccess = 
      (permissionCheck.rows.length > 0 && 
       (userPermissions.includes('WRITE') || userPermissions.includes('FULL_ACCESS'))) ||
      isEventCreator ||
      ['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '');

    if (!hasWriteAccess) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this event' },
        { status: 403 }
      );
    }

    // ✅ FIXED: Check if event exists and can be edited
    const eventCheck = await query('SELECT status FROM events WHERE id = $1', [eventId]);
    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // ✅ FIXED: Safe request body parsing
    const body = await safeParseRequestBody(request);
    
    if (!body || Object.keys(body).length === 0) {
      return NextResponse.json(
        { error: 'No data provided for update' },
        { status: 400 }
      );
    }

    console.log('📥 Update data received:', body);

    // ✅ FIXED: Validate data with improved error handling
    let validatedData;
    try {
      validatedData = UpdateEventSchema.parse(body);
      console.log('✅ Data validation passed:', validatedData);
    } catch (validationError) {
      console.error('❌ Data validation failed:', validationError);
      if (validationError instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validationError.errors,
            receivedData: body
          },
          { status: 400 }
        );
      }
      throw validationError;
    }

    // ✅ FIXED: Build update query dynamically with only existing columns
    const updateFields = [];
    const updateValues = [];
    let paramCount = 1;

    Object.entries(validatedData).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (key === 'tags') {
          updateFields.push(`tags = $${paramCount}`);
          updateValues.push(JSON.stringify(value));
        } else if (key === 'startDate') {
          updateFields.push(`start_date = $${paramCount}`);
          updateValues.push(value);
        } else if (key === 'endDate') {
          updateFields.push(`end_date = $${paramCount}`);
          updateValues.push(value);
        } else {
          updateFields.push(`${key} = $${paramCount}`);
          updateValues.push(value);
        }
        paramCount++;
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({ 
        error: 'No valid fields to update',
        providedData: body,
        validatedData: validatedData
      }, { status: 400 });
    }

    // ✅ FIXED: Add updated_at
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date().toISOString());
    updateValues.push(eventId);

    const updateQuery = `
      UPDATE events 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount + 1}
      RETURNING *
    `;

    console.log('📝 Update query:', updateQuery);
    console.log('📝 Update values:', updateValues);

    const result = await query(updateQuery, updateValues);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Failed to update event' }, { status: 500 });
    }

    const updatedEvent = result.rows[0];

    console.log('✅ Event updated successfully:', updatedEvent.name);

    return NextResponse.json({
      success: true,
      message: 'Event updated successfully',
      data: {
        id: updatedEvent.id,
        name: updatedEvent.name,
        description: updatedEvent.description,
        startDate: updatedEvent.start_date,
        endDate: updatedEvent.end_date,
        location: updatedEvent.location,
        status: updatedEvent.status,
        updatedAt: updatedEvent.updated_at
      }
    });

  } catch (error) {
    console.error('❌ Event UPDATE Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to update event',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// ✅ NEW: DELETE /api/events/[id] - Delete event
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const eventId = params.id;

    // ✅ FIXED: Enhanced permission check for deletion
    const eventCheck = await query(
      'SELECT created_by, status FROM events WHERE id = $1',
      [eventId]
    );

    if (eventCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    const event = eventCheck.rows[0];
    const canDelete = 
      event.created_by === session.user.id ||
      ['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '');

    if (!canDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete this event' },
        { status: 403 }
      );
    }

    // ✅ FIXED: Prevent deletion of active events
    if (event.status === 'ACTIVE') {
      return NextResponse.json(
        { error: 'Cannot delete an active event. Please cancel it first.' },
        { status: 400 }
      );
    }

    // ✅ FIXED: Delete in correct order to handle foreign key constraints
    await query('BEGIN');

    try {
      // Delete session speakers first
      await query(
        'DELETE FROM session_speakers WHERE session_id IN (SELECT id FROM conference_sessions WHERE event_id = $1)',
        [eventId]
      );

      // Delete presentations
      await query(
        'DELETE FROM presentations WHERE session_id IN (SELECT id FROM conference_sessions WHERE event_id = $1)',
        [eventId]
      );

      // Delete halls
      await query('DELETE FROM halls WHERE event_id = $1', [eventId]);

      // Delete sessions
      await query('DELETE FROM conference_sessions WHERE event_id = $1', [eventId]);

      // Delete registrations
      await query('DELETE FROM registrations WHERE event_id = $1', [eventId]);

      // Delete user events (faculty/staff associations)
      await query('DELETE FROM user_events WHERE event_id = $1', [eventId]);

      // Finally delete the event
      const deleteResult = await query('DELETE FROM events WHERE id = $1 RETURNING *', [eventId]);

      await query('COMMIT');

      return NextResponse.json({
        success: true,
        message: 'Event deleted successfully',
        data: { deletedEventId: eventId }
      });

    } catch (deleteError) {
      await query('ROLLBACK');
      throw deleteError;
    }

  } catch (error) {
    console.error('Event DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}