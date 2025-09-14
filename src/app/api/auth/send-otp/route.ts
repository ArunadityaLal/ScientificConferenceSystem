// src/app/api/auth/send-otp/route.ts
import { NextRequest, NextResponse } from "next/server";

// Global storage for OTPs (use Redis in production)
declare global {
  // eslint-disable-next-line no-var
  var otpStore: Map<string, { otp: string; expireAt: number }>;
}
global.otpStore = global.otpStore || new Map();

// Generate random 6-digit OTP
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Create email transporter
const createEmailTransporter = () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const nodemailer = require("nodemailer");

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: false, // true for 465, false for 587/25
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
};

export async function POST(request: NextRequest) {
  console.log("🔄 Send OTP API called");

  try {
    const body = await request.json();
    console.log("📝 Request body:", body);

    // Only require email
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Generate OTP
    const emailOtp = generateOTP();
    const expireAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store email OTP in global memory
    global.otpStore.set(`email:${email.toLowerCase()}`, {
      otp: emailOtp,
      expireAt,
    });

    console.log("🔐 Generated Email OTP:", {
      email: email.toLowerCase(),
      emailOtp,
      storageSize: global.otpStore.size,
    });

    // Send Email OTP
    try {
      const transporter = createEmailTransporter();

      await transporter.sendMail({
        from: `"Conference Registration" <${
          process.env.FROM_EMAIL || process.env.SMTP_USER
        }>`,
        to: email,
        subject: "Email Verification Code - Conference Registration",
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
            <div style="background: white; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.07);">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px;">
                  <h1 style="margin: 0; font-size: 28px; font-weight: 600;">Email Verification</h1>
                  <p style="margin: 12px 0 0 0; opacity: 0.9; font-size: 16px;">Conference Management System</p>
                </div>
              </div>
              <div style="text-align: center; margin-bottom: 32px;">
                <h2 style="color: #374151; margin-bottom: 16px; font-size: 22px; font-weight: 600;">Your Verification Code</h2>
                <p style="color: #6b7280; margin-bottom: 24px; font-size: 16px;">
                  Please use the code below to verify your email address and complete your registration.
                </p>
                <div style="background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%); border: 3px dashed #9ca3af; border-radius: 12px; padding: 24px; margin: 24px 0; display: inline-block; min-width: 280px;">
                  <div style="font-size: 48px; font-weight: 800; letter-spacing: 12px; color: #1e40af; font-family: 'Courier New', monospace; text-shadow: 0 2px 4px rgba(30, 64, 175, 0.1);">
                    ${emailOtp}
                  </div>
                </div>
                <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 16px; margin: 24px 0;">
                  <p style="color: #92400e; margin: 0; font-size: 14px; font-weight: 500;">
                    ⏰ This code will expire in <strong>5 minutes</strong>
                  </p>
                </div>
              </div>
              <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <h3 style="color: #0c4a6e; margin: 0 0 12px 0; font-size: 16px; font-weight: 600;">📋 Next Steps:</h3>
                <ol style="color: #0c4a6e; margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.6;">
                  <li>Return to the registration page</li>
                  <li>Enter this code in the "Email Verification Code" field</li>
                  <li>Click "Verify & Register" to complete your account setup</li>
                </ol>
              </div>
              <div style="background: #fef2f2; border: 1px solid #f87171; border-radius: 8px; padding: 16px; margin: 24px 0;">
                <p style="color: #dc2626; margin: 0; font-size: 13px;">
                  🔒 <strong>Security Notice:</strong> If you didn't request this verification code, please ignore this email. Never share this code with anyone.
                </p>
              </div>
              <div style="text-align: center; margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #9ca3af; margin: 0; font-size: 13px;">
                  © ${new Date().getFullYear()} Conference Management System. All rights reserved.
                </p>
                <p style="color: #9ca3af; margin: 8px 0 0 0; font-size: 12px;">
                  This is an automated message, please do not reply to this email.
                </p>
              </div>
            </div>
          </div>
        `,
      });

      console.log("✅ Email sent successfully to:", email);

      return NextResponse.json({
        message: "Verification code sent successfully",
        sent: { email: true },
        ...(process.env.NODE_ENV === "development" && {
          debug: { emailOtp },
        }),
      });

    } catch (emailError: any) {
      console.error("❌ Email sending error:", emailError?.message || emailError);
      
      return NextResponse.json(
        { 
          message: "Failed to send verification code",
          error: String(emailError?.message || emailError)
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error("❌ Send OTP error:", error?.message || error);
    return NextResponse.json(
      {
        message: "Failed to send verification code",
        error: String(error?.message || error),
      },
      { status: 500 }
    );
  }
}