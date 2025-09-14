// src/app/api/events/route.ts - FIXED: Allow organizers to see all events for session creation
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { z } from 'zod';

// UPDATED: Validation schema without missing fields
const CreateEventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().optional(),
  startDate: z.string().transform((str) => new Date(str)),
  endDate: z.string().transform((str) => new Date(str)),
  location: z.string().min(1, 'Location is required'),
  eventType: z.enum(['CONFERENCE', 'WORKSHOP', 'SEMINAR', 'SYMPOSIUM']).default('CONFERENCE'),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('DRAFT'),
  tags: z.array(z.string()).optional(),
  website: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  // Removed: venue, maxParticipants, registrationDeadline (not in database)
});

const UpdateEventSchema = CreateEventSchema.partial();

// UPDATED: Column mapping without missing columns
const SORT_COLUMN_MAP = {
  'startDate': 'start_date',
  'endDate': 'end_date',
  'startdate': 'start_date',
  'enddate': 'end_date',
  'eventType': 'event_type',
  'contactEmail': 'contact_email',
  'createdAt': 'created_at',
  'updatedAt': 'updated_at',
  'created_at': 'created_at',
  'updated_at': 'updated_at',
  'name': 'name',
  'status': 'status',
  'location': 'location'
};

// GET /api/events - Get all events with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const sortByParam = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const sortBy = (sortByParam in SORT_COLUMN_MAP)
      ? SORT_COLUMN_MAP[sortByParam as keyof typeof SORT_COLUMN_MAP]
      : 'created_at';
    const skip = (page - 1) * limit;

    // Build WHERE clause for filtering
    let whereClause = 'WHERE 1=1';
    let queryParams: any[] = [];
    let paramCount = 0;

    // FIXED: Role-based filtering - Allow organizers to see ALL events for session creation
    if (session.user.role === 'EVENT_MANAGER') {
      // Event managers see all events (no additional filter)
    } else if (session.user.role === 'ORGANIZER') {
      // FIXED: Organizers can see all events to create sessions under them
      // Remove the restriction that limited them to only their own events
      // This allows session creation workflow to work properly
    } else if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '')) {
      // Other roles (FACULTY, DELEGATE, etc.) only see published events
      paramCount++;
      whereClause += ` AND e.status = $${paramCount}`;
      queryParams.push('PUBLISHED');
    }

    // Status filter
    if (status) {
      paramCount++;
      whereClause += ` AND e.status = $${paramCount}`;
      queryParams.push(status);
    }

    // Search filter
    if (search) {
      paramCount++;
      whereClause += ` AND (
        e.name ILIKE $${paramCount} OR 
        e.description ILIKE $${paramCount} OR 
        e.location ILIKE $${paramCount}
      )`;
      queryParams.push(`%${search}%`);
    }

    // FIXED: Query only existing columns
    const eventsQuery = `
      SELECT 
        e.id,
        e.name,
        e.description,
        e.start_date,
        e.end_date,
        e.location,
        e.event_type,
        e.status,
        e.tags,
        e.website,
        e.contact_email,
        e.created_by,
        e.created_at,
        e.updated_at,
        u.name as creator_name,
        u.email as creator_email,
        (SELECT COUNT(*) FROM conference_sessions s WHERE s.event_id = e.id) as sessions_count,
        (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id) as registrations_count,
        (SELECT COUNT(*) FROM user_events ue WHERE ue.event_id = e.id) as user_events_count
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      ${whereClause}
      ORDER BY e.${sortBy} ${sortOrder.toUpperCase()}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    queryParams.push(limit, skip);

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM events e
      ${whereClause}
    `;

    const [eventsResult, countResult] = await Promise.all([
      query(eventsQuery, queryParams),
      query(countQuery, queryParams.slice(0, -2))
    ]);

    // FIXED: Response without missing fields
    const events = eventsResult.rows.map(row => {
      // Safe JSON parsing for tags
      let tags = [];
      try {
        if (row.tags && row.tags.trim() !== '') {
          tags = JSON.parse(row.tags);
        }
      } catch (error) {
        console.warn(`Invalid JSON in tags for event ${row.id}:`, row.tags);
        tags = [];
      }

      return {
        id: row.id,
        name: row.name,
        description: row.description,
        startDate: row.start_date,
        endDate: row.end_date,
        location: row.location,
        eventType: row.event_type,
        status: row.status,
        tags: tags,
        website: row.website,
        contactEmail: row.contact_email,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Removed: venue, maxParticipants, registrationDeadline
        createdByUser: {
          id: row.created_by,
          name: row.creator_name,
          email: row.creator_email
        },
        _count: {
          sessions: parseInt(row.sessions_count || '0'),
          registrations: parseInt(row.registrations_count || '0'),
          userEvents: parseInt(row.user_events_count || '0')
        }
      };
    });

    const total = parseInt(countResult.rows[0].total);

    return NextResponse.json({
      success: true,
      data: {
        events,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });

  } catch (error) {
    console.error('Events GET Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

// POST /api/events - Create new event
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to create events' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = CreateEventSchema.parse(body);

    // Validate dates
    if (validatedData.startDate >= validatedData.endDate) {
      return NextResponse.json(
        { error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Generate new UUID for event
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // FIXED: Insert only existing columns
    const insertEventQuery = `
      INSERT INTO events (
        id, name, description, start_date, end_date, location,
        event_type, status, tags, website, contact_email, 
        created_by, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
      ) RETURNING *
    `;

    const eventResult = await query(insertEventQuery, [
      eventId,
      validatedData.name,
      validatedData.description || null,
      validatedData.startDate,
      validatedData.endDate,
      validatedData.location,
      validatedData.eventType,
      validatedData.status,
      validatedData.tags ? JSON.stringify(validatedData.tags) : null,
      validatedData.website || null,
      validatedData.contactEmail || null,
      session.user.id
    ]);

    const newEvent = eventResult.rows[0];

    // Create organizer relationship in user_events table
    const userEventId = `ue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await query(`
      INSERT INTO user_events (id, user_id, event_id, role, permissions, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `, [
      userEventId,
      session.user.id,
      eventId,
      'ORGANIZER',
      'FULL_ACCESS'
    ]);

    // Get creator details for response
    const userResult = await query(
      'SELECT name, email FROM users WHERE id = $1',
      [session.user.id]
    );

    // FIXED: Response with existing fields only
    let tags = [];
    try {
      if (newEvent.tags && newEvent.tags.trim() !== '') {
        tags = JSON.parse(newEvent.tags);
      }
    } catch (error) {
      tags = [];
    }

    const responseData = {
      id: newEvent.id,
      name: newEvent.name,
      description: newEvent.description,
      startDate: newEvent.start_date,
      endDate: newEvent.end_date,
      location: newEvent.location,
      eventType: newEvent.event_type,
      status: newEvent.status,
      tags: tags,
      website: newEvent.website,
      contactEmail: newEvent.contact_email,
      createdAt: newEvent.created_at,
      updatedAt: newEvent.updated_at,
      // Removed: venue, maxParticipants, registrationDeadline
      createdByUser: {
        id: session.user.id,
        name: userResult.rows[0]?.name,
        email: userResult.rows[0]?.email
      },
      _count: {
        sessions: 0,
        registrations: 0,
        userEvents: 1
      }
    };

    return NextResponse.json({
      success: true,
      data: responseData,
      message: 'Event created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Events POST Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create event' },
      { status: 500 }
    );
  }
}

// PUT /api/events - Bulk update events
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventIds, updates } = body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: 'Event IDs array is required' },
        { status: 400 }
      );
    }

    const validatedUpdates = UpdateEventSchema.parse(updates);

    // Check permissions for each event
    const placeholders = eventIds.map((_, i) => `$${i + 2}`).join(',');
    const permissionQuery = `
      SELECT event_id FROM user_events 
      WHERE user_id = $1 AND event_id IN (${placeholders})
    `;

    const userEventsResult = await query(permissionQuery, [session.user.id, ...eventIds]);
    const allowedEventIds = userEventsResult.rows.map(row => row.event_id);
    
    if (allowedEventIds.length !== eventIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some events' },
        { status: 403 }
      );
    }

    // FIXED: Build update query with existing columns only
    const updateFields: string[] = [];
    const updateParams: any[] = [];
    let paramCount = 0;

    Object.entries(validatedUpdates).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        // Map camelCase to snake_case for database columns
        let dbField = key;
        if (key === 'startDate') dbField = 'start_date';
        else if (key === 'endDate') dbField = 'end_date';
        else if (key === 'eventType') dbField = 'event_type';
        else if (key === 'contactEmail') dbField = 'contact_email';
        else dbField = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        
        updateFields.push(`${dbField} = $${paramCount}`);
        
        // Handle special data types
        if (key === 'tags' && Array.isArray(value)) {
          updateParams.push(JSON.stringify(value));
        } else {
          updateParams.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      return NextResponse.json({
        success: true,
        data: { updatedCount: 0 },
        message: 'No fields to update'
      });
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateParams.push(new Date());

    // Add WHERE clause parameters
    const whereInPlaceholders = allowedEventIds.map((_, i) => `$${paramCount + 1 + i}`).join(',');
    updateParams.push(...allowedEventIds);

    const updateQuery = `
      UPDATE events 
      SET ${updateFields.join(', ')}
      WHERE id IN (${whereInPlaceholders})
    `;

    const result = await query(updateQuery, updateParams);

    return NextResponse.json({
      success: true,
      data: { updatedCount: result.rowCount },
      message: `${result.rowCount} events updated successfully`
    });

  } catch (error) {
    console.error('Events PUT Error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update events' },
      { status: 500 }
    );
  }
}

// DELETE /api/events - Bulk delete events
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { eventIds } = body;

    if (!Array.isArray(eventIds) || eventIds.length === 0) {
      return NextResponse.json(
        { error: 'Event IDs array is required' },
        { status: 400 }
      );
    }

    // Check permissions for each event
    const placeholders = eventIds.map((_, i) => `$${i + 2}`).join(',');
    const permissionQuery = `
      SELECT event_id FROM user_events 
      WHERE user_id = $1 AND event_id IN (${placeholders})
    `;

    const userEventsResult = await query(permissionQuery, [session.user.id, ...eventIds]);
    const allowedEventIds = userEventsResult.rows.map(row => row.event_id);
    
    if (allowedEventIds.length !== eventIds.length) {
      return NextResponse.json(
        { error: 'Insufficient permissions for some events' },
        { status: 403 }
      );
    }

    // Soft delete - update status instead of actual deletion
    const deleteQuery = `
      UPDATE events 
      SET status = 'CANCELLED', updated_at = NOW()
      WHERE id IN (${allowedEventIds.map((_, i) => `$${i + 1}`).join(',')})
    `;

    const result = await query(deleteQuery, allowedEventIds);

    return NextResponse.json({
      success: true,
      data: { deletedCount: result.rowCount },
      message: `${result.rowCount} events deleted successfully`
    });

  } catch (error) {
    console.error('Events DELETE Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete events' },
      { status: 500 }
    );
  }
}