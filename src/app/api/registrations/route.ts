// src/app/api/registrations/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection'; // ✅ Fixed: Using PostgreSQL instead of Prisma
import { z } from 'zod';

// Validation schemas
const CreateRegistrationSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  registrationData: z.object({
    participantType: z.enum(['DELEGATE', 'SPEAKER', 'SPONSOR', 'VOLUNTEER']).default('DELEGATE'),
    institution: z.string().optional(),
    designation: z.string().optional(),
    experience: z.number().optional(),
    specialization: z.string().optional(),
    dietaryRequirements: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    sessionPreferences: z.array(z.string()).optional(),
    accommodationRequired: z.boolean().default(false),
    transportRequired: z.boolean().default(false),
    certificateRequired: z.boolean().default(true),
    additionalRequirements: z.string().optional(),
    consentForPhotography: z.boolean().default(false),
    consentForMarketing: z.boolean().default(false),
  }),
  paymentInfo: z.object({
    amount: z.number().positive().optional(),
    currency: z.string().default('INR'),
    paymentMethod: z.enum(['ONLINE', 'OFFLINE', 'BANK_TRANSFER', 'CHEQUE', 'FREE']).optional(),
    transactionId: z.string().optional(),
    paymentDate: z.string().transform((str) => new Date(str)).optional(),
  }).optional(),
});

const UpdateRegistrationSchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'WAITLIST']).optional(),
  registrationData: z.object({
    participantType: z.enum(['DELEGATE', 'SPEAKER', 'SPONSOR', 'VOLUNTEER']).optional(),
    institution: z.string().optional(),
    designation: z.string().optional(),
    experience: z.number().optional(),
    specialization: z.string().optional(),
    dietaryRequirements: z.string().optional(),
    emergencyContact: z.object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional(),
    }).optional(),
    sessionPreferences: z.array(z.string()).optional(),
    accommodationRequired: z.boolean().optional(),
    transportRequired: z.boolean().optional(),
    certificateRequired: z.boolean().optional(),
    additionalRequirements: z.string().optional(),
    consentForPhotography: z.boolean().optional(),
    consentForMarketing: z.boolean().optional(),
  }).optional(),
  paymentInfo: z.object({
    amount: z.number().positive().optional(),
    currency: z.string().optional(),
    paymentMethod: z.enum(['ONLINE', 'OFFLINE', 'BANK_TRANSFER', 'CHEQUE', 'FREE']).optional(),
    transactionId: z.string().optional(),
    paymentDate: z.string().transform((str) => new Date(str)).optional(),
  }).optional(),
  reviewNotes: z.string().optional(),
});

// Helper functions
function getPagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function getSorting(searchParams: URLSearchParams, allowedFields: string[]) {
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  
  // Convert camelCase to snake_case for database
  const dbSortBy = sortBy.replace(/([A-Z])/g, '_$1').toLowerCase();
  
  return { 
    sortBy: allowedFields.includes(dbSortBy) ? dbSortBy : 'created_at', 
    sortOrder: sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC' 
  };
}

// GET /api/registrations - Get all registrations with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    const status = searchParams.get('status');
    const participantType = searchParams.get('participantType');
    const search = searchParams.get('search');
    const { page, limit, skip } = getPagination(searchParams);
    const { sortBy, sortOrder } = getSorting(searchParams, [
      'created_at', 'updated_at', 'status'
    ]);

    // Build WHERE clause
    let whereClause = 'WHERE 1=1';
    let queryParams: any[] = [];
    let paramCount = 0;

    // Role-based filtering
    if (session.user.role === 'DELEGATE') {
      paramCount++;
      whereClause += ` AND r.user_id = $${paramCount}`;
      queryParams.push(session.user.id);
    } else if (eventId) {
      paramCount++;
      whereClause += ` AND r.event_id = $${paramCount}`;
      queryParams.push(eventId);
      
      // Verify event access for organizers/managers
      if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '')) {
        const userEventResult = await query(`
          SELECT id FROM user_events 
          WHERE user_id = $1 AND event_id = $2 AND permissions @> '["read"]'
        `, [session.user.id, eventId]);

        if (userEventResult.rows.length === 0) {
          return NextResponse.json(
            { error: 'Access denied to event registrations' },
            { status: 403 }
          );
        }
      }
    }

    // Status filter
    if (status) {
      paramCount++;
      whereClause += ` AND r.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Participant type filter (JSON field)
    if (participantType) {
      paramCount++;
      whereClause += ` AND r.registration_data->>'participantType' = $${paramCount}`;
      queryParams.push(participantType);
    }

    // Search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (
        u.name ILIKE $${paramCount} OR 
        u.email ILIKE $${paramCount} OR
        r.registration_data->>'institution' ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
    }

    // Main query with joins
    const registrationsQuery = `
      SELECT 
        r.*,
        u.id as user_id, u.name as user_name, u.email as user_email, 
        u.phone as user_phone, u.role as user_role, u.image as user_image,
        e.id as event_id, e.name as event_name, e.start_date as event_start_date,
        e.end_date as event_end_date, e.location as event_location,
        ru.id as reviewer_id, ru.name as reviewer_name
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      LEFT JOIN users ru ON r.reviewed_by = ru.id
      ${whereClause}
      ORDER BY r.${sortBy} ${sortOrder}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, skip);

    // Count query
    const countQuery = `
      SELECT COUNT(*) as total
      FROM registrations r
      JOIN users u ON r.user_id = u.id
      JOIN events e ON r.event_id = e.id
      ${whereClause}
    `;

    const [registrationsResult, countResult] = await Promise.all([
      query(registrationsQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2))
    ]);

    // Format response data
    const registrations = registrationsResult.rows.map(row => ({
      id: row.id,
      registrationNumber: row.registration_number,
      status: row.status,
      registrationData: row.registration_data,
      paymentInfo: row.payment_info,
      reviewNotes: row.review_notes,
      reviewedAt: row.reviewed_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: {
        id: row.user_id,
        name: row.user_name,
        email: row.user_email,
        phone: row.user_phone,
        role: row.user_role,
        profileImage: row.user_image
      },
      event: {
        id: row.event_id,
        name: row.event_name,
        startDate: row.event_start_date,
        endDate: row.event_end_date,
        location: row.event_location
      },
      reviewedByUser: row.reviewer_id ? {
        id: row.reviewer_id,
        name: row.reviewer_name
      } : null
    }));

    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      success: true,
      data: {
        registrations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Registrations GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}

// POST /api/registrations - Create new registration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = CreateRegistrationSchema.parse(body);

    // Check if event exists and is open for registration
    const eventResult = await query(`
      SELECT 
        id, name, status, start_date, registration_deadline, max_participants,
        (SELECT COUNT(*) FROM registrations WHERE event_id = $1) as registration_count
      FROM events 
      WHERE id = $1
    `, [validatedData.eventId]);

    if (eventResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    const event = eventResult.rows[0];

    if (event.status !== 'PUBLISHED') {
      return NextResponse.json(
        { error: 'Event is not open for registration' },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (event.registration_deadline && new Date() > new Date(event.registration_deadline)) {
      return NextResponse.json(
        { error: 'Registration deadline has passed' },
        { status: 400 }
      );
    }

    // Check if user already registered
    const existingResult = await query(
      'SELECT id FROM registrations WHERE user_id = $1 AND event_id = $2',
      [session.user.id, validatedData.eventId]
    );

    if (existingResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Already registered for this event' },
        { status: 409 }
      );
    }

    // Determine registration status
    let status = 'PENDING';
    if (event.max_participants && parseInt(event.registration_count) >= event.max_participants) {
      status = 'WAITLIST';
    }

    // Generate registration number
    const registrationNumber = `REG-${event.id.slice(-6).toUpperCase()}-${Date.now().toString().slice(-6)}`;
    const registrationId = `reg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Insert registration
    const insertQuery = `
      INSERT INTO registrations (
        id, user_id, event_id, registration_number, status,
        registration_data, payment_info, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, NOW(), NOW()
      ) RETURNING *
    `;

    const registrationResult = await query(insertQuery, [
      registrationId,
      session.user.id,
      validatedData.eventId,
      registrationNumber,
      status,
      JSON.stringify(validatedData.registrationData),
      JSON.stringify(validatedData.paymentInfo || {})
    ]);

    const registration = registrationResult.rows[0];

    // Get user and event details for response
    const detailsResult = await query(`
      SELECT 
        u.id as user_id, u.name as user_name, u.email as user_email, u.phone as user_phone,
        e.id as event_id, e.name as event_name, e.start_date, e.end_date
      FROM users u, events e
      WHERE u.id = $1 AND e.id = $2
    `, [session.user.id, validatedData.eventId]);

    const details = detailsResult.rows[0];

    // Log email for confirmation
    const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await query(`
      INSERT INTO email_logs (
        id, recipient, subject, content, status, user_id, created_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, NOW()
      )
    `, [
      emailId,
      session.user.email,
      `Registration Confirmation - ${event.name}`,
      `Your registration for ${event.name} has been submitted successfully. Registration Number: ${registrationNumber}`,
      'PENDING',
      session.user.id
    ]);

    // Format response
    const responseData = {
      id: registration.id,
      registrationNumber: registration.registration_number,
      status: registration.status,
      registrationData: JSON.parse(registration.registration_data),
      paymentInfo: JSON.parse(registration.payment_info),
      createdAt: registration.created_at,
      updatedAt: registration.updated_at,
      user: {
        id: details.user_id,
        name: details.user_name,
        email: details.user_email,
        phone: details.user_phone
      },
      event: {
        id: details.event_id,
        name: details.event_name,
        startDate: details.start_date,
        endDate: details.end_date
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: `Registration ${status === 'WAITLIST' ? 'added to waitlist' : 'submitted'} successfully`
    }, { status: 201 });

  } catch (error) {
    console.error('Registrations POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create registration' },
      { status: 500 }
    );
  }
}

// PUT /api/registrations - Bulk update registrations
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role permissions
    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { registrationIds, updates } = body;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'Registration IDs array is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = UpdateRegistrationSchema.parse(updates);

    // Verify permissions for each registration
    const placeholders = registrationIds.map((_, i) => `$${i + 2}`).join(',');
    const permissionQuery = `
      SELECT r.id, r.event_id, e.created_by, ue.id as user_event_id
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      LEFT JOIN user_events ue ON e.id = ue.event_id AND ue.user_id = $1 AND ue.permissions @> '["WRITE"]'
      WHERE r.id IN (${placeholders})
    `;

    const permissionResult = await query(permissionQuery, [session.user.id, ...registrationIds]);
    
    const allowedRegistrationIds = permissionResult.rows
      .filter(row => row.user_event_id || row.created_by === session.user.id)
      .map(row => row.id);
    
    if (allowedRegistrationIds.length !== registrationIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some registrations' },
        { status: 403 }
      );
    }

    // Build update query dynamically
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramCount = 0;

    if (validatedUpdates.status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      updateParams.push(validatedUpdates.status);
      
      paramCount++;
      updateFields.push(`reviewed_by = $${paramCount}`);
      updateParams.push(session.user.id);
      
      paramCount++;
      updateFields.push(`reviewed_at = $${paramCount}`);
      updateParams.push(new Date());
    }

    if (validatedUpdates.registrationData) {
      paramCount++;
      updateFields.push(`registration_data = $${paramCount}`);
      updateParams.push(JSON.stringify(validatedUpdates.registrationData));
    }

    if (validatedUpdates.paymentInfo) {
      paramCount++;
      updateFields.push(`payment_info = $${paramCount}`);
      updateParams.push(JSON.stringify(validatedUpdates.paymentInfo));
    }

    if (validatedUpdates.reviewNotes) {
      paramCount++;
      updateFields.push(`review_notes = $${paramCount}`);
      updateParams.push(validatedUpdates.reviewNotes);
    }

    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateParams.push(new Date());

    // Add WHERE clause parameters
    const whereInPlaceholders = allowedRegistrationIds.map((_, i) => `$${paramCount + 1 + i}`).join(',');
    updateParams.push(...allowedRegistrationIds);

    const updateQuery = `
      UPDATE registrations 
      SET ${updateFields.join(', ')}
      WHERE id IN (${whereInPlaceholders})
    `;

    const result = await query(updateQuery, updateParams);

    // Send status update emails if status was changed
    if (validatedUpdates.status) {
      const emailQuery = `
        SELECT r.id, u.email, u.name, e.name as event_name
        FROM registrations r
        JOIN users u ON r.user_id = u.id
        JOIN events e ON r.event_id = e.id
        WHERE r.id IN (${whereInPlaceholders})
      `;

      const emailResult = await query(emailQuery, allowedRegistrationIds);

      for (const row of emailResult.rows) {
        const emailId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await query(`
          INSERT INTO email_logs (
            id, recipient, subject, content, status, created_at
          ) VALUES (
            $1, $2, $3, $4, $5, NOW()
          )
        `, [
          emailId,
          row.email,
          `Registration Status Update - ${row.event_name}`,
          `Your registration status has been updated to: ${validatedUpdates.status}`,
          'PENDING'
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      data: { updatedCount: result.rowCount },
      message: `${result.rowCount} registrations updated successfully`
    });

  } catch (error) {
    console.error('Registrations PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update registrations' },
      { status: 500 }
    );
  }
}

// DELETE /api/registrations - Cancel registrations
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { registrationIds, reason } = body;

    if (!Array.isArray(registrationIds) || registrationIds.length === 0) {
      return NextResponse.json(
        { error: 'Registration IDs array is required' },
        { status: 400 }
      );
    }

    // Check permissions
    const placeholders = registrationIds.map((_, i) => `$${i + 2}`).join(',');
    const permissionQuery = `
      SELECT r.id, r.user_id, e.created_by, e.start_date
      FROM registrations r
      JOIN events e ON r.event_id = e.id
      WHERE r.id IN (${placeholders})
    `;

    const permissionResult = await query(permissionQuery, [session.user.id, ...registrationIds]);

    const allowedRegistrationIds = permissionResult.rows.filter(row => {
      // Users can cancel their own registrations
      if (row.user_id === session.user.id) return true;
      // Organizers can cancel any registration for their events
      if (['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '') && row.created_by === session.user.id) return true;
      return false;
    }).map(row => row.id);

    if (allowedRegistrationIds.length !== registrationIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions to cancel some registrations' },
        { status: 403 }
      );
    }

    // Check if event has already started (for non-organizers)
    if (session.user.role !== 'ORGANIZER') {
      const startedEvents = permissionResult.rows.filter(row => 
        new Date(row.start_date) <= new Date()
      );
      
      if (startedEvents.length > 0) {
        return NextResponse.json(
          { error: 'Cannot cancel registration for events that have already started' },
          { status: 400 }
        );
      }
    }

    // Update status to CANCELLED instead of actual deletion
    const cancelQuery = `
      UPDATE registrations 
      SET 
        status = 'CANCELLED',
        review_notes = $1,
        reviewed_by = $2,
        reviewed_at = NOW(),
        updated_at = NOW()
      WHERE id IN (${allowedRegistrationIds.map((_, i) => `$${i + 3}`).join(',')})
    `;

    const result = await query(cancelQuery, [
      reason || 'Registration cancelled',
      session.user.id,
      ...allowedRegistrationIds
    ]);

    return NextResponse.json({
      success: true,
      data: { cancelledCount: result.rowCount },
      message: `${result.rowCount} registrations cancelled successfully`
    });

  } catch (error) {
    console.error('Registrations DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel registrations' },
      { status: 500 }
    );
  }
}