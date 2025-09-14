// src/app/api/faculty/invite/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query } from '@/lib/database/connection';
import { emailSender } from '@/lib/email/sender';
import { z } from 'zod';

// Validation schemas
const FacultyInviteSchema = z.object({
  eventId: z.string().min(1, 'Event ID is required'),
  facultyList: z.array(z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().optional(),
    designation: z.string().optional(),
    institution: z.string().optional(),
    specialization: z.string().optional(),
    role: z.enum(['SPEAKER', 'MODERATOR', 'CHAIRPERSON']).default('SPEAKER'),
    sessionId: z.string().optional(),
  })).min(1, 'Please add at least one faculty member'),
  invitationMessage: z.string().min(10, 'Invitation message must be at least 10 characters'),
  invitationSubject: z.string().min(5, 'Subject must be at least 5 characters'),
  sendReminder: z.boolean().default(true),
  reminderDays: z.number().min(1).max(30).default(3),
});

type FacultyInviteData = z.infer<typeof FacultyInviteSchema>;

interface InvitationResult {
  success: boolean;
  data: {
    summary: {
      total: number;
      successful: number;
      failed: number;
    };
    invited: Array<{
      facultyId: string;
      name: string;
      email: string;
      invitationId: string;
    }>;
    errors: Array<{
      email: string;
      name: string;
      error: string;
    }>;
  };
  message: string;
}

// POST /api/faculty/invite - Send faculty invitations
export async function POST(request: NextRequest): Promise<NextResponse<InvitationResult | { error: string }>> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check permissions
    if (!['ORGANIZER', 'EVENT_MANAGER'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions to send invitations' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = FacultyInviteSchema.parse(body);

    // Verify event exists and user has permission
    const eventQuery = `
      SELECT e.*, u.name as creator_name, u.email as creator_email
      FROM events e
      LEFT JOIN users u ON e.created_by = u.id
      WHERE e.id = $1 AND (
        e.created_by = $2 OR 
        EXISTS (
          SELECT 1 FROM user_events ue 
          WHERE ue.event_id = e.id AND ue.user_id = $2
        )
      )
    `;

    const eventResult = await query(eventQuery, [validatedData.eventId, session.user.id]);
    
    if (eventResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Event not found or insufficient permissions' },
        { status: 404 }
      );
    }

    const event = eventResult.rows[0];

    // Process invitations
    const invited: Array<{ facultyId: string; name: string; email: string; invitationId: string }> = [];
    const errors: Array<{ email: string; name: string; error: string }> = [];

    for (const faculty of validatedData.facultyList) {
      try {
        // Check if faculty already exists in database
        let facultyId: string;
        const existingFacultyQuery = `
          SELECT id FROM users WHERE email = $1 AND role = 'FACULTY'
        `;
        const existingFaculty = await query(existingFacultyQuery, [faculty.email]);

        if (existingFaculty.rows.length > 0) {
          facultyId = existingFaculty.rows[0].id;
        } else {
          // Create new faculty user
          facultyId = `fac_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const createFacultyQuery = `
            INSERT INTO users (
              id, email, name, role, phone, institution, designation, 
              specialization, status, created_at, updated_at
            ) VALUES (
              $1, $2, $3, 'FACULTY', $4, $5, $6, $7, 'PENDING', NOW(), NOW()
            )
          `;
          
          await query(createFacultyQuery, [
            facultyId,
            faculty.email,
            faculty.name,
            faculty.phone || null,
            faculty.institution || null,
            faculty.designation || null,
            faculty.specialization || null
          ]);
        }

        // Check if invitation already exists
        const existingInvitationQuery = `
          SELECT id FROM faculty_invitations 
          WHERE faculty_id = $1 AND event_id = $2 AND status != 'CANCELLED'
        `;
        const existingInvitation = await query(existingInvitationQuery, [facultyId, validatedData.eventId]);

        let invitationId: string;
        if (existingInvitation.rows.length > 0) {
          // Update existing invitation
          invitationId = existingInvitation.rows[0].id;
          const updateInvitationQuery = `
            UPDATE faculty_invitations 
            SET 
              role = $1,
              session_id = $2,
              invitation_message = $3,
              status = 'SENT',
              sent_at = NOW(),
              updated_at = NOW()
            WHERE id = $4
          `;
          
          await query(updateInvitationQuery, [
            faculty.role,
            faculty.sessionId || null,
            validatedData.invitationMessage,
            invitationId
          ]);
        } else {
          // Create new invitation record
          invitationId = `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const createInvitationQuery = `
            INSERT INTO faculty_invitations (
              id, faculty_id, event_id, invited_by, role, session_id,
              invitation_subject, invitation_message, status, sent_at, 
              reminder_enabled, reminder_days, created_at, updated_at
            ) VALUES (
              $1, $2, $3, $4, $5, $6, $7, $8, 'SENT', NOW(), $9, $10, NOW(), NOW()
            )
          `;
          
          await query(createInvitationQuery, [
            invitationId,
            facultyId,
            validatedData.eventId,
            session.user.id,
            faculty.role,
            faculty.sessionId || null,
            validatedData.invitationSubject,
            validatedData.invitationMessage,
            validatedData.sendReminder,
            validatedData.reminderDays
          ]);
        }

        // Prepare and send email
        const personalizedMessage = prepareEmailContent(
          validatedData.invitationMessage,
          {
            facultyName: faculty.name,
            eventName: event.name,
            eventDate: new Date(event.start_date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }),
            eventVenue: event.venue || event.location,
            eventDescription: event.description,
            organizerName: session.user.name || event.creator_name,
            organizerEmail: session.user.email || event.creator_email,
            invitationLink: `${process.env.NEXTAUTH_URL}/faculty/invitation/${invitationId}`,
            role: faculty.role.toLowerCase()
          }
        );

        const emailHtml = generateEmailHTML(personalizedMessage, {
          eventName: event.name,
          eventDate: new Date(event.start_date).toLocaleDateString(),
          eventVenue: event.venue || event.location,
          facultyName: faculty.name,
          role: faculty.role,
          invitationLink: `${process.env.NEXTAUTH_URL}/faculty/invitation/${invitationId}`
        });

        // Send email
        const emailResult = await emailSender.sendEmail({
          to: faculty.email,
          subject: validatedData.invitationSubject,
          html: emailHtml,
          text: personalizedMessage,
          replyTo: session.user.email || event.creator_email
        });

        if (emailResult.success) {
          // Update invitation with email message ID
          await query(
            'UPDATE faculty_invitations SET email_message_id = $1 WHERE id = $2',
            [emailResult.messageId, invitationId]
          );

          invited.push({
            facultyId,
            name: faculty.name,
            email: faculty.email,
            invitationId
          });
        } else {
          // Mark invitation as failed
          await query(
            'UPDATE faculty_invitations SET status = $1, error_message = $2 WHERE id = $3',
            ['FAILED', emailResult.error, invitationId]
          );

          errors.push({
            email: faculty.email,
            name: faculty.name,
            error: emailResult.error || 'Failed to send email'
          });
        }

      } catch (error) {
        console.error(`Error processing invitation for ${faculty.email}:`, error);
        errors.push({
          email: faculty.email,
          name: faculty.name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // Create activity log
    try {
      const activityId = `act_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await query(`
        INSERT INTO activity_logs (
          id, user_id, event_id, action, description, metadata, created_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, NOW()
        )
      `, [
        activityId,
        session.user.id,
        validatedData.eventId,
        'FACULTY_INVITED',
        `Sent invitations to ${invited.length} faculty members`,
        JSON.stringify({
          invited: invited.length,
          failed: errors.length,
          total: validatedData.facultyList.length
        })
      ]);
    } catch (logError) {
      console.error('Failed to create activity log:', logError);
    }

    const result: InvitationResult = {
      success: true,
      data: {
        summary: {
          total: validatedData.facultyList.length,
          successful: invited.length,
          failed: errors.length
        },
        invited,
        errors
      },
      message: `Successfully sent ${invited.length} invitations${errors.length > 0 ? `, ${errors.length} failed` : ''}`
    };

    return NextResponse.json(result, { status: 200 });

  } catch (error) {
    console.error('Faculty invitation API error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to process invitations' },
      { status: 500 }
    );
  }
}

// Helper function to prepare email content with placeholders
function prepareEmailContent(
  template: string,
  variables: Record<string, string>
): string {
  let content = template;
  
  // Replace common placeholders
  const replacements = {
    '[Faculty Name]': variables.facultyName,
    '[Event Name]': variables.eventName,
    '[Event Date]': variables.eventDate,
    '[Event Venue]': variables.eventVenue,
    '[Event Theme]': variables.eventDescription,
    '[Organizer Name]': variables.organizerName,
    '[Contact Information]': variables.organizerEmail,
    '[Invitation Link]': variables.invitationLink,
    '[Role]': variables.role
  };

  Object.entries(replacements).forEach(([placeholder, value]) => {
    content = content.replace(new RegExp(placeholder, 'g'), value || placeholder);
  });

  return content;
}

// Helper function to generate HTML email template
function generateEmailHTML(
  message: string,
  details: {
    eventName: string;
    eventDate: string;
    eventVenue: string;
    facultyName: string;
    role: string;
    invitationLink: string;
  }
): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Conference Invitation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: #f9f9f9; padding: 30px; }
    .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #667eea; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; }
    .role-badge { background: #e7f3ff; color: #1976d2; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    
    <!-- Header -->
    <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 10px 10px 0 0; overflow: hidden;">
        <!-- PediCritiCon Header Image -->
        <img src="https://make-my-event.vercel.app/images/pedicriticon-header.png" 
             alt="PediCritiCon 2025 Header - 6th to 9th November 2025"
             style="width: 100%; height: auto; display: block; max-width: 600px;" />
    </div>
    
    <div class="content">
      <h2>Dear ${details.facultyName},</h2>
      <p>You're invited to participate as a <span class="role-badge">${details.role}</span></p>
      
      <div style="white-space: pre-wrap; margin: 20px 0;">${message}</div>
      
      <div class="event-details">
        <h3>📅 Event Details</h3>
        <p><strong>Conference:</strong> ${details.eventName}</p>
        <p><strong>Date:</strong> ${details.eventDate}</p>
        <p><strong>Venue:</strong> ${details.eventVenue}</p>
        <p><strong>Your Role:</strong> ${details.role}</p>
      </div>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="${details.invitationLink}" class="button">
          📝 Respond to Invitation
        </a>
      </div>
      
      <div style="background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>📌 Action Required:</strong> Please click the button above to confirm your participation or decline the invitation.</p>
      </div>

      <!-- Conference Registration & Participation -->
      <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 6px; padding: 15px; margin: 25px 0;">
          <h4 style="color: #e65100; margin: 0 0 10px 0; font-size: 14px;">📋 Conference Registration & Participation:</h4>
          <p style="color: #bf360c; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
              <strong>Registration:</strong> Please complete your conference registration at the base rate.
          </p>
          <p style="color: #4a5568; font-size: 14px; margin: 0 0 10px 0; line-height: 1.6;">
              Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. 
              If you are unable to accept or face a scheduling conflict, please indicate <strong>No</strong> at 
              the earliest so we may make suitable adjustments.
          </p>
          <p style="color: #4a5568; font-size: 14px; margin: 0; line-height: 1.6;">
              We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 
              a memorable success.
          </p>
      </div>

      <div style="margin: 25px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #4299e1; border-radius: 4px;">
          <p style="color: #2d3748; margin: 0; font-size: 14px; font-weight: 500;">
              Warm regards,<br>
              <span style="color: #4299e1;">Scientific Committee, PediCritiCon 2025</span>
          </p>
      </div>
      
    </div>

    <!-- Footer -->
    <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 0 0 10px 10px; margin-top: 10px; overflow: hidden;">
        <!-- PediCritiCon Footer Image -->
        <img src="https://make-my-event.vercel.app/images/pedicriticon-footer.png" 
             alt="PediCritiCon 2025 Footer - Scan for Website, Helpline: 63646 90353"
             style="width: 100%; height: auto; display: block; max-width: 600px;" />
    </div>
    
    <div class="footer">
      <p>This invitation was sent via Conference Management System</p>
      <p style="font-size: 12px; color: #999;">
        If you have any questions, please reply to this email or contact the organizer directly.
      </p>
    </div>
  </div>
</body>
</html>
  `;
}