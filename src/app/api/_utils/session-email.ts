import { sendMail } from "@/lib/mailer";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://scientific-conference-system-cd9g.vercel.app/";

export type Session = {
  id: string;
  title: string;
  facultyId: string;
  facultyName?: string; 
  email: string;
  place: string;
  roomId: string;
  roomName?: string;
  description?: string;
  startTime: string;
  endTime: string;
  status: "Draft" | "Confirmed";
  inviteStatus: "Pending" | "Accepted" | "Declined";
  rejectionReason?: "NotInterested" | "SuggestedTopic" | "TimeConflict";
  suggestedTopic?: string;
  suggestedTimeStart?: string;
  suggestedTimeEnd?: string;
  optionalQuery?: string;
  eventId?: string;
};

function formatDate(val?: string) {
  if (!val) return "-";
  const d = new Date(val);
  return isNaN(d.getTime()) ? "-" : d.toLocaleString();
}

function safe(val?: string) {
  return val || "-";
}

function renderHTML(sessions: Session[], facultyName: string) {
  const firstSession = sessions[0];
  const loginUrl = `${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(firstSession?.email || "")}`;

  const rows = sessions
    .map(
      (s) => `
      <tr style="border-bottom: 1px solid #eaeaea;">
        <td style="padding:12px; border-right:1px solid #ddd;">${safe(
          s.title
        )}</td>
        <td style="padding:12px; border-right:1px solid #ddd;">${formatDate(
          s.startTime
        )}</td>
        <td style="padding:12px; border-right:1px solid #ddd;">${formatDate(
          s.endTime
        )}</td>
        <td style="padding:12px; border-right:1px solid #ddd;">${safe(
          s.place
        )} - ${safe(s.roomName || s.roomId)}</td>
        <td style="padding:12px;">${safe(s.description)}</td>
      </tr>`
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Faculty Invitation</title>
</head>
<body style="font-family: Arial, sans-serif; line-height:1.5; color:#333; max-width:600px; margin:0 auto; padding:20px;">
  
  <div style="background:#fff; padding:30px; border:1px solid #ddd; border-radius:8px;">
    <h1 style="color:#764ba2; text-align:center; margin-bottom:20px;">Faculty Invitation</h1>
    
    <p>Dear <strong>${safe(facultyName)}</strong>,</p>
    <p>Greetings from the Scientific Committee!</p>
    <p>It gives us immense pleasure to invite you as a distinguished faculty member.</p>
    <p>Your proposed faculty role${sessions.length > 1 ? "s are" : " is"} outlined below:</p>

    <!-- Session Details Table -->
    <table style="width:100%; border-collapse: collapse; margin:20px 0;">
      <thead style="background:#efefef;">
        <tr>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Title</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Start</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">End</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd; border-right:1px solid #ddd;">Location</th>
          <th style="text-align:left; padding:12px; border-bottom:1px solid #ddd;">Description</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>

    <!-- Conference Acceptance -->
    <div style="background: #fff8e1; border: 1px solid #ffcc02; border-radius: 6px; padding: 15px; margin: 25px 0;">
      <h4 style="color: #e65100; margin: 0 0 10px 0; font-size: 14px;">Conference Acceptance:</h4>
      <p style="color: #bf360c; margin: 0 0 10px 0; font-size: 14px; line-height: 1.5;">
          <strong>Please confirm your acceptance by clicking Accept or Decline on the faculty dashboard</strong>
      </p>
    </div>

    <!-- Access Faculty Portal Button -->
    <p style="text-align:center; margin: 30px 0;">
      <a href="${loginUrl}" target="_blank" style="
        background:#764ba2;
        color:#fff;
        padding:15px 25px;
        border-radius:25px;
        text-decoration:none;
        font-weight:bold;
        font-size:16px;
        box-shadow:0 4px 15px rgba(118,75,162,0.4);
        ">
        Access Faculty Portal
      </a>
    </p>

    <!-- Signature -->
    <div style="margin: 25px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #764ba2; border-radius: 4px;">
        <p style="color: #2d3748; margin: 0; font-size: 14px; font-weight: 500;">
            Warm regards,<br>
            <span style="color: #764ba2;">Scientific Committee</span>
        </p>
    </div>
    
    <p style="font-size:12px; color:#666; text-align:center; margin-top:20px;">
      If you have questions, contact your event coordinator. This message was sent automatically.
    </p>
  </div>
</body>
</html>
`;
}

function renderUpdateHTML(
  session: Session,
  facultyName: string,
  roomName: string
) {
  const loginUrl = `${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(session.email)}`;

  return `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>Session Updated</title>
</head>
<body style="font-family: Arial, sans-serif; line-height:1.5; color:#333; max-width:600px; margin:0 auto; padding:20px;">
  
  <div style="background:#fff; padding:30px; border:1px solid #ddd; border-radius:8px;">
    <h1 style="color:#ff6b35; text-align:center; margin-bottom:20px;">Session Updated</h1>
    
    <p>Dear <strong>${safe(facultyName)}</strong>,</p>
    <p>Your session has been updated with new details:</p>
    
    <table style="width:100%; border-collapse: collapse; margin:20px 0;">
      <tr style="background:#f8f9fa;">
        <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd;">Title:</td>
        <td style="padding:12px; border-bottom:1px solid #ddd;">${safe(
          session.title
        )}</td>
      </tr>
      <tr style="background:#fff;">
        <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd;">Start Time:</td>
        <td style="padding:12px; border-bottom:1px solid #ddd;">${formatDate(
          session.startTime
        )}</td>
      </tr>
      <tr style="background:#f8f9fa;">
        <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd;">End Time:</td>
        <td style="padding:12px; border-bottom:1px solid #ddd;">${formatDate(
          session.endTime
        )}</td> 
      </tr>
      <tr style="background:#fff;">
        <td style="padding:12px; font-weight:bold; border-bottom:1px solid #ddd;">Location:</td>
        <td style="padding:12px; border-bottom:1px solid #ddd;">${safe(
          session.place
        )} - ${safe(roomName)}</td>
      </tr>
      <tr style="background:#f8f9fa;">
        <td style="padding:12px; font-weight:bold;">Description:</td>
        <td style="padding:12px;">${safe(session.description)}</td>
      </tr>
    </table>
    
    <p><strong>Please confirm your availability again as the schedule has changed.</strong></p>

    <!-- Access Faculty Portal Button -->
    <p style="text-align:center; margin:30px 0;">
      <a href="${loginUrl}" target="_blank" style="
        background:#ff6b35;
        color:#fff;
        padding:15px 25px;
        border-radius:25px;
        text-decoration:none;
        font-weight:bold;
        font-size:16px;
        box-shadow:0 4px 15px rgba(255,107,53,0.4);
        ">
        Confirm Availability
      </a>
    </p>

    <!-- Signature -->
    <div style="margin: 25px 0; padding: 15px; background: #f7fafc; border-left: 4px solid #ff6b35; border-radius: 4px;">
        <p style="color: #2d3748; margin: 0; font-size: 14px; font-weight: 500;">
            Warm regards,<br>
            <span style="color: #ff6b35;">Scientific Committee</span>
        </p>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Send multiple session invitations in one email
 */
export async function sendBulkInviteEmail(
  sessions: Session[],
  facultyName: string,
  email: string
) {
  if (!sessions?.length || !facultyName || !email) {
    return { ok: false, message: "Invalid arguments" };
  }

  const html = renderHTML(sessions, facultyName);
  const text = `Subject: Invitation to Join as Faculty

Dear ${facultyName},

Greetings from the Scientific Committee!

It gives us immense pleasure to invite you as a distinguished faculty member.

Your proposed faculty role${sessions.length > 1 ? "s are" : " is"} outlined below:

${sessions
  .map(
    (s) => `Date: ${formatDate(s.startTime).split(',')[0]}
Session: ${safe(s.title)}
Location: ${safe(s.place)} - ${safe(s.roomName || s.roomId)}
Description: ${safe(s.description)}`
  )
  .join("\n\n")}

Please confirm your acceptance by clicking Accept or Decline.
Login here: ${baseUrl.replace(
    /\/+$/,
    ""
  )}/faculty-login?email=${encodeURIComponent(email)}

Warm regards,
Scientific Committee
`;

  return sendMail({
    to: email,
    subject: `Faculty Invitation`,
    text,
    html,
  });
}

/**
 * Wrapper for sending a single session invite
 */
export async function sendInviteEmail(
  session: Session,
  facultyName: string,
  email: string
) {
  return sendBulkInviteEmail([session], facultyName, email);
}

/**
 * Send session update notification email
 */
export async function sendUpdateEmail(
  session: Session,
  facultyName: string,
  roomName: string
): Promise<{ ok: boolean; message?: string }> {
  if (!session || !facultyName || !session.email) {
    return { ok: false, message: "Invalid arguments for update email" };
  }

  try {
    const html = renderUpdateHTML(session, facultyName, roomName);
    const text = `Hello ${facultyName},

Your session "${safe(session.title)}" has been updated:

Start Time: ${formatDate(session.startTime)}
End Time: ${formatDate(session.endTime)}
Location: ${safe(session.place)} - ${safe(roomName)}
Description: ${safe(session.description)}

Please confirm your availability again as the schedule has changed.

Login here: ${baseUrl.replace(
      /\/+$/,
      ""
    )}/faculty-login?email=${encodeURIComponent(session.email)}

Warm regards,
Scientific Committee
`;

    const result = await sendMail({
      to: session.email,
      subject: `Session Updated: ${session.title}`,
      text,
      html,
    });

    return result;
  } catch (error) {
    console.error("Failed to send update email:", error);
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Email sending failed",
    };
  }
}