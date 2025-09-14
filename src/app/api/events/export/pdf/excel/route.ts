// src/app/api/events/export/excel/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import * as XLSX from 'xlsx';
import { formatDate, formatDateTime, formatStatus } from '@/lib/utils/export';

// Permission check function (same as PDF)
async function checkExportPermission(userId: string, eventId?: string) {
  try {
    console.log('🔍 Checking export permissions for user:', userId, 'eventId:', eventId);
    
    if (!eventId) {
      const userResult = await query(
        'SELECT role FROM users WHERE id = $1',
        [userId]
      );
      
      if (userResult.rows.length === 0) {
        return { hasPermission: false, reason: 'User not found' };
      }
      
      const userRole = userResult.rows[0].role;
      if (['ORGANIZER', 'EVENT_MANAGER'].includes(userRole)) {
        return { hasPermission: true, role: userRole };
      }
      
      return { hasPermission: false, reason: 'Insufficient permissions for bulk export' };
    }
    
    const permissionResult = await query(`
      SELECT 
        ue.role as event_role,
        ue.permissions,
        u.role as user_role,
        e.created_by
      FROM user_events ue
      JOIN users u ON u.id = ue.user_id
      JOIN events e ON e.id = ue.event_id
      WHERE ue.user_id = $1 AND ue.event_id = $2
    `, [userId, eventId]);
    
    if (permissionResult.rows.length === 0) {
      return { hasPermission: false, reason: 'No access to this event' };
    }
    
    const { event_role, user_role, created_by } = permissionResult.rows[0];
    
    const canExport = (
      user_role === 'ORGANIZER' ||
      user_role === 'EVENT_MANAGER' ||
      event_role === 'ORGANIZER' ||
      event_role === 'EVENT_MANAGER' ||
      created_by === userId
    );
    
    return { 
      hasPermission: canExport, 
      role: user_role,
      eventRole: event_role,
      isCreator: created_by === userId
    };
    
  } catch (error) {
    console.error('❌ Permission check error:', error);
    return { hasPermission: false, reason: 'Permission check failed' };
  }
}

// Fetch event data for Excel
async function fetchEventData(eventId?: string) {
  try {
    console.log('📊 Fetching event data for Excel generation...');
    
    if (eventId) {
      // Single event data
      console.log('🎯 Fetching data for event:', eventId);
      
      const eventResult = await query(`
        SELECT 
          e.id,
          e.name,
          e.description,
          e.start_date as startDate,
          e.end_date as endDate,
          e.location,
          e.status,
          e.created_at as createdAt,
          e.updated_at as updatedAt
        FROM events e
        WHERE e.id = $1
      `, [eventId]);
      
      if (eventResult.rows.length === 0) {
        throw new Error('Event not found');
      }
      
      const event = eventResult.rows[0];
      
      // Sessions
      const sessionsResult = await query(`
        SELECT 
          cs.id,
          cs.title,
          cs.description,
          cs.start_time as startTime,
          cs.end_time as endTime,
          h.name as hallName
        FROM conference_sessions cs
        LEFT JOIN halls h ON h.id = cs.hall_id
        WHERE cs.event_id = $1
        ORDER BY cs.start_time
      `, [eventId]);
      
      // Registrations
      const registrationsResult = await query(`
        SELECT 
          r.id,
          r.status,
          r.created_at as createdAt,
          u.name as userName,
          u.email as userEmail,
          u.institution as userInstitution,
          u.phone as userPhone
        FROM registrations r
        JOIN users u ON u.id = r.user_id
        WHERE r.event_id = $1
        ORDER BY r.created_at DESC
      `, [eventId]);
      
      // Faculty
      const facultyResult = await query(`
        SELECT 
          ue.id,
          ue.role as eventRole,
          u.name,
          u.email,
          u.institution,
          u.phone
        FROM user_events ue
        JOIN users u ON u.id = ue.user_id
        WHERE ue.event_id = $1 
        AND ue.role IN ('SPEAKER', 'MODERATOR', 'CHAIRPERSON')
        ORDER BY u.name
      `, [eventId]);
      
      // Halls
      const hallsResult = await query(`
        SELECT id, name, capacity, equipment
        FROM halls
        WHERE event_id = $1
        ORDER BY name
      `, [eventId]);
      
      console.log('✅ Single event data fetched successfully');
      
      return {
        event,
        sessions: sessionsResult.rows,
        registrations: registrationsResult.rows,
        faculty: facultyResult.rows,
        halls: hallsResult.rows
      };
      
    } else {
      // All events data
      console.log('📋 Fetching all events data...');
      
      const eventsResult = await query(`
        SELECT 
          e.id,
          e.name,
          e.description,
          e.start_date as startDate,
          e.end_date as endDate,
          e.location,
          e.status,
          e.created_at as createdAt,
          (SELECT COUNT(*) FROM conference_sessions WHERE event_id = e.id) as sessionCount,
          (SELECT COUNT(*) FROM registrations WHERE event_id = e.id) as registrationCount
        FROM events e
        ORDER BY e.start_date DESC
      `);
      
      console.log('✅ All events data fetched successfully');
      
      return {
        events: eventsResult.rows,
        sessions: [],
        registrations: [],
        faculty: [],
        halls: []
      };
    }
    
  } catch (error) {
    console.error('❌ Error fetching event data:', error);
    throw new Error(`Failed to fetch event data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Generate Excel workbook
function generateExcelWorkbook(data: any, isMultipleEvents = false) {
  console.log('📊 Generating Excel workbook...');
  
  const workbook = XLSX.utils.book_new();
  
  if (isMultipleEvents && data.events) {
    // Multiple events - Events summary sheet
    const eventsData = data.events.map((event: any) => ({
      'Event ID': event.id,
      'Event Name': event.name || 'Untitled Event',
      'Description': event.description || 'No description',
      'Start Date': formatDateTime(event.startDate),
      'End Date': formatDateTime(event.endDate),
      'Location': event.location || 'TBD',
      'Status': formatStatus(event.status),
      'Sessions': event.sessionCount || 0,
      'Registrations': event.registrationCount || 0,
      'Created': formatDateTime(event.createdAt)
    }));
    
    const eventsSheet = XLSX.utils.json_to_sheet(eventsData);
    XLSX.utils.book_append_sheet(workbook, eventsSheet, 'Events Summary');
    
  } else if (data.event) {
    // Single event - Event details sheet
    const eventDetailsData = [
      { 'Property': 'Event ID', 'Value': data.event.id },
      { 'Property': 'Name', 'Value': data.event.name || 'Untitled Event' },
      { 'Property': 'Description', 'Value': data.event.description || 'No description' },
      { 'Property': 'Start Date', 'Value': formatDateTime(data.event.startDate) },
      { 'Property': 'End Date', 'Value': formatDateTime(data.event.endDate) },
      { 'Property': 'Location', 'Value': data.event.location || 'TBD' },
      { 'Property': 'Status', 'Value': formatStatus(data.event.status) },
      { 'Property': 'Created', 'Value': formatDateTime(data.event.createdAt) },
      { 'Property': 'Updated', 'Value': formatDateTime(data.event.updatedAt) }
    ];
    
    const eventSheet = XLSX.utils.json_to_sheet(eventDetailsData);
    XLSX.utils.book_append_sheet(workbook, eventSheet, 'Event Details');
  }
  
  // Sessions sheet
  if (data.sessions && data.sessions.length > 0) {
    const sessionsData = data.sessions.map((session: any) => ({
      'Session ID': session.id,
      'Title': session.title || 'Untitled Session',
      'Description': session.description || 'No description',
      'Start Time': formatDateTime(session.startTime),
      'End Time': formatDateTime(session.endTime),
      'Hall': session.hallName || 'TBD',
      'Duration (mins)': session.startTime && session.endTime 
        ? Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / (1000 * 60))
        : 'N/A'
    }));
    
    const sessionsSheet = XLSX.utils.json_to_sheet(sessionsData);
    XLSX.utils.book_append_sheet(workbook, sessionsSheet, 'Sessions');
  }
  
  // Registrations sheet
  if (data.registrations && data.registrations.length > 0) {
    const registrationsData = data.registrations.map((reg: any) => ({
      'Registration ID': reg.id,
      'Participant Name': reg.userName || 'Unknown',
      'Email': reg.userEmail || 'No email',
      'Phone': reg.userPhone || 'No phone',
      'Institution': reg.userInstitution || 'Not specified',
      'Status': formatStatus(reg.status),
      'Registration Date': formatDateTime(reg.createdAt)
    }));
    
    const registrationsSheet = XLSX.utils.json_to_sheet(registrationsData);
    XLSX.utils.book_append_sheet(workbook, registrationsSheet, 'Registrations');
  }
  
  // Faculty sheet
  if (data.faculty && data.faculty.length > 0) {
    const facultyData = data.faculty.map((faculty: any) => ({
      'Faculty ID': faculty.id,
      'Name': faculty.name || 'Unknown',
      'Email': faculty.email || 'No email',
      'Phone': faculty.phone || 'No phone',
      'Institution': faculty.institution || 'Not specified',
      'Role': formatStatus(faculty.eventRole),
    }));
    
    const facultySheet = XLSX.utils.json_to_sheet(facultyData);
    XLSX.utils.book_append_sheet(workbook, facultySheet, 'Faculty');
  }
  
  // Halls sheet
  if (data.halls && data.halls.length > 0) {
    const hallsData = data.halls.map((hall: any) => ({
      'Hall ID': hall.id,
      'Name': hall.name || 'Unnamed Hall',
      'Capacity': hall.capacity || 0,
      'Equipment': hall.equipment ? JSON.stringify(hall.equipment) : 'None specified'
    }));
    
    const hallsSheet = XLSX.utils.json_to_sheet(hallsData);
    XLSX.utils.book_append_sheet(workbook, hallsSheet, 'Halls');
  }
  
  console.log('✅ Excel workbook generated successfully');
  return workbook;
}

// GET handler - Generate Excel
export async function GET(request: NextRequest) {
  try {
    console.log('🚀 Excel Export API called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    console.log('📋 Export parameters:', { eventId });
    
    // Check permissions
    const permissionCheck = await checkExportPermission(session.user.id, eventId || undefined);
    if (!permissionCheck.hasPermission) {
      console.log('❌ Export permission denied:', permissionCheck.reason);
      return NextResponse.json(
        { error: permissionCheck.reason || 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    console.log('✅ Export permission granted');
    
    // Fetch data
    const data = await fetchEventData(eventId || undefined);
    
    // Generate Excel workbook
    const workbook = generateExcelWorkbook(data, !eventId);
    
    // Generate filename
    const filename = eventId 
      ? `event-${data.event?.name?.replace(/[^a-zA-Z0-9]/g, '-') || 'export'}-${new Date().toISOString().slice(0, 10)}.xlsx`
      : `events-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Write workbook to buffer
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer',
      compression: true
    });
    
    console.log('✅ Excel file generated successfully');
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
  } catch (error) {
    console.error('❌ Excel Export API Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Excel generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST handler - Generate Excel with custom data
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Excel Export API (POST) called');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { eventId, data, options = {} } = body;
    
    console.log('📋 POST Export parameters:', { eventId, hasData: !!data, options });
    
    // Check permissions
    const permissionCheck = await checkExportPermission(session.user.id, eventId);
    if (!permissionCheck.hasPermission) {
      return NextResponse.json(
        { error: permissionCheck.reason || 'Insufficient permissions' },
        { status: 403 }
      );
    }
    
    // Use provided data or fetch from database
    const exportData = data || await fetchEventData(eventId);
    
    // Generate Excel workbook
    const workbook = generateExcelWorkbook(exportData, options.isMultipleEvents || false);
    
    // Generate filename
    const filename = options.filename || 
      `event-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    
    // Write workbook to buffer
    const excelBuffer = XLSX.write(workbook, { 
      bookType: 'xlsx', 
      type: 'buffer',
      compression: true
    });
    
    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': excelBuffer.length.toString()
      }
    });
    
  } catch (error) {
    console.error('❌ Excel Export POST Error:', error);
    
    return NextResponse.json(
      { 
        error: 'Excel generation failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}