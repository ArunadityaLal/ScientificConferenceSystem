import { NextRequest, NextResponse } from "next/server";
import { sendMail } from "@/lib/mailer";
import { format } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const { event, template, invitations } = await req.json();

    if (!invitations || !Array.isArray(invitations) || !event) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    const sentInvitations = [];
    const failedInvitations = [];
    // FIXED: Correct base URL for Vercel deployment
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://make-my-event.vercel.app";

    console.log(
      `📨 Starting REAL email campaign for ${invitations.length} faculty members`
    );

    for (const invitation of invitations) {
      try {
        // Generate unique faculty login link with event context
        const loginParams = new URLSearchParams({
          email: invitation.email,
          ref: "event-invitation",
          eventId: event.id,
          invitationId: invitation.id,
        });

        // FIXED: Correct faculty login path
        const facultyLoginLink = `${baseUrl}/faculty/login?${loginParams.toString()}`;

        // Format event dates
        const startDate = new Date(event.startDate);
        const endDate = new Date(event.endDate);
        const eventDates = `${startDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })} - ${endDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}`;

        // Replace placeholders in email template
        let personalizedMessage = template.message
          .replace(/\{\{facultyName\}\}/g, invitation.name)
          .replace(/\{\{eventDates\}\}/g, eventDates)
          .replace(/\{\{eventLocation\}\}/g, event.location)
          .replace(/\{\{eventVenue\}\}/g, event.venue)
          .replace(/\{\{eventDescription\}\}/g, event.description);

        // Create text version
        const emailText = `${personalizedMessage}

ACCESS YOUR FACULTY PORTAL:
${facultyLoginLink}

EVENT INFORMATION:
Event: ${event.title}
Location: ${event.location}
Venue: ${event.venue}
Dates: ${eventDates}

NEXT STEPS:
1. Click the link above to access your faculty portal
2. Sign in with your Google account
3. Review the complete event details
4. Confirm your participation

We look forward to your positive response!

---
This invitation was sent by the Conference Management System
If you have any questions, please contact our support team.`;

        // Create HTML version with BOTH header and footer images
        const emailHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Event Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
    
    <!-- Header -->
    <div style="background: #f8f9fa; padding: 0; text-align: center; border-radius: 10px 10px 0 0; overflow: hidden;">
        <!-- PediCritiCon Header Image -->
        <img src="https://make-my-event.vercel.app/images/pedicriticon-header.png" 
             alt="PediCritiCon 2025 Header - 6th to 9th November 2025"
             style="width: 100%; height: auto; display: block; max-width: 600px;" />
    </div>
    
    <!-- Content -->
    <div style="background: white; padding: 30px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <p style="font-size: 16px; margin-bottom: 15px;">Dear <strong style="color: #4299e1;">${invitation.name}</strong>,</p>
        
        <div style="background: #f7fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4299e1;">
            <div style="white-space: pre-line; color: #4a5568; line-height: 1.7;">
                ${personalizedMessage}
            </div>
        </div>

        <!-- Event Details Card -->
        <div style="background: #edf2f7; border: 1px solid #e2e8f0; border-radius: 8px; padding: 20px; margin: 25px 0;">
            <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">📋 Event Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
                <tr>
                    <td style="padding: 8px 0; color: #4a5568;">
                        <strong style="color: #2d3748;">📅 Event:</strong><br>
                        ${event.title}
                    </td>
                    <td style="padding: 8px 0; color: #4a5568;">
                        <strong style="color: #2d3748;">📆 Dates:</strong><br>
                        ${eventDates}
                    </td>
                </tr>
                <tr>
                    <td style="padding: 8px 0; color: #4a5568;">
                        <strong style="color: #2d3748;">📍 Location:</strong><br>
                        ${event.location}
                    </td>
                    <td style="padding: 8px 0; color: #4a5568;">
                        <strong style="color: #2d3748;">🏢 Venue:</strong><br>
                        ${event.venue}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Call to Action -->
        <div style="text-align: center; margin: 30px 0;">
            <a href="${facultyLoginLink}" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; 
                      font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);">
                🔐 Access Faculty Portal & Respond
            </a>
        </div>

        <!-- Next Steps -->
        <div style="background: #f0fff4; border: 1px solid #9ae6b4; border-radius: 6px; padding: 15px; margin: 25px 0;">
            <h4 style="color: #22543d; margin: 0 0 10px 0; font-size: 14px;">✅ Your Next Steps:</h4>
            <ol style="color: #2f855a; margin: 0; padding-left: 20px; line-height: 1.4; font-size: 14px;">
                <li>Click the link above to access your personalized faculty portal</li>
                <li>Sign in securely with your Google account</li>
                <li>Review the complete event details and agenda</li>
                <li>Confirm your participation by accepting the invitation</li>
            </ol>
        </div>

        <!-- Registration Notice -->
        <div style="background: #fff5f5; border: 1px solid #feb2b2; border-radius: 6px; padding: 15px; margin: 25px 0;">
            <h4 style="color: #9b2c2c; margin: 0 0 10px 0; font-size: 14px;">📝 Important Registration Information:</h4>
            <p style="color: #822727; margin: 0; font-size: 14px; line-height: 1.5;">
                <strong>Registration:</strong> Please complete your conference registration at the base rate.
            </p>
        </div>

        <p style="color: #4a5568; font-size: 14px; text-align: left; margin: 20px 0; line-height: 1.6;">
            Your participation will be invaluable in enriching the scientific program of PediCritiCon 2025. 
            If you are unable to accept or face a scheduling conflict, please indicate <strong>No</strong> at 
            the earliest so we may make suitable adjustments.
        </p>

        <p style="color: #4a5568; font-size: 14px; text-align: left; margin: 20px 0; line-height: 1.6;">
            We sincerely look forward to your acceptance and active contribution in making PediCritiCon 2025 
            a memorable success.
        </p>

        <!-- Final Conference Message -->
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
</body>
</html>`;

        // Send the actual email using nodemailer
        const emailResult = await sendMail({
          to: invitation.email,
          subject: `${template.subject} - Personal Invitation for ${invitation.name}`,
          text: emailText,
          html: emailHtml,
        });

        if (emailResult.ok) {
          sentInvitations.push({
            id: invitation.id,
            email: invitation.email,
            name: invitation.name,
            eventId: event.id,
            loginLink: facultyLoginLink,
            sentAt: new Date().toISOString(),
            // messageId: emailResult.messageId,
          });

          console.log(
            `✅ REAL email sent to: ${invitation.email} (${invitation.name})`
          );
        } else {
          failedInvitations.push({
            email: invitation.email,
            error: emailResult.error || "Email delivery failed",
          });
          console.log(
            `❌ Failed to send email to: ${invitation.email} - ${emailResult.error}`
          );
        }
      } catch (error) {
        console.error(
          `Failed to process invitation for ${invitation.email}:`,
          error
        );
        failedInvitations.push({
          email: invitation.email,
          error: error instanceof Error ? error.message : "Unknown error",
        });
      }

      // Add small delay between emails to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    // Log campaign summary
    console.log(`📊 REAL Email Campaign Complete:`, {
      eventTitle: event.title,
      totalInvitations: invitations.length,
      successCount: sentInvitations.length,
      failedCount: failedInvitations.length,
      successRate: `${(
        (sentInvitations.length / invitations.length) *
        100
      ).toFixed(1)}%`,
    });

    return NextResponse.json({
      success: true,
      data: {
        sentCount: sentInvitations.length,
        failedCount: failedInvitations.length,
        sentInvitations,
        failedInvitations,
        eventDetails: {
          title: event.title,
          location: event.location,
          dates: `${new Date(
            event.startDate
          ).toLocaleDateString()} - ${new Date(
            event.endDate
          ).toLocaleDateString()}`,
        },
      },
      message: `Successfully sent ${sentInvitations.length} REAL email invitations`,
    });
  } catch (error) {
    console.error("❌ Error in REAL email campaign:", error);
    return NextResponse.json(
      { error: "Failed to send event invitations" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";