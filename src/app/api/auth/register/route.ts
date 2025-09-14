// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/database/connection";
import { hashPassword } from "@/lib/auth/config";
import * as z from "zod";

// UserRole enum
enum UserRole {
  ORGANIZER = "ORGANIZER",
  EVENT_MANAGER = "EVENT_MANAGER",
  FACULTY = "FACULTY",
  DELEGATE = "DELEGATE",
  HALL_COORDINATOR = "HALL_COORDINATOR",
  SPONSOR = "SPONSOR",
  VOLUNTEER = "VOLUNTEER",
  VENDOR = "VENDOR",
}

// Registration validation schema - NO phone fields
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  role: z.nativeEnum(UserRole),
  institution: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  emailVerified: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📝 Registration request body (sanitized):", {
      email: body.email,
      name: body.name,
      role: body.role,
      institution: body.institution,
      emailVerified: body.emailVerified
    });

    // Validate request data
    const validatedData = registerSchema.parse(body);

    // Check if user already exists
    const existingUserResult = await query(
      "SELECT id FROM users WHERE email = $1",
      [validatedData.email.toLowerCase()]
    );

    if (existingUserResult.rows.length > 0) {
      return NextResponse.json(
        {
          message: "A user with this email already exists",
          field: "email",
        },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await hashPassword(validatedData.password);

    // Generate user ID
    const userId = `user_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // First, check what type the email_verified column is
    console.log("🔍 Checking email_verified column type...");
    const columnTypeResult = await query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'email_verified'
    `);

    let emailVerifiedValue;
    const columnType = columnTypeResult.rows[0]?.data_type;

    if (columnType && columnType === 'boolean') {
      // Database expects boolean
      emailVerifiedValue = validatedData.emailVerified;
      console.log("📋 Using BOOLEAN value for email_verified:", emailVerifiedValue);
    } else {
      // Database expects timestamp (or column doesn't exist)
      emailVerifiedValue = validatedData.emailVerified ? new Date() : null;
      console.log("📋 Using TIMESTAMP value for email_verified:", emailVerifiedValue);
    }

    console.log("💾 Inserting user with data:", {
      userId,
      name: validatedData.name,
      email: validatedData.email.toLowerCase(),
      role: validatedData.role,
      institution: validatedData.institution || null,
      emailVerified: emailVerifiedValue,
    });

    // Insert user with flexible email_verified handling
    const insertUserQuery = `
      INSERT INTO users (
        id, name, email, role, institution, password, 
        email_verified, status, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, 'ACTIVE', NOW(), NOW()
      ) RETURNING id, name, email, role, institution, email_verified, created_at
    `;

    const userResult = await query(insertUserQuery, [
      userId,                                    // $1
      validatedData.name,                       // $2
      validatedData.email.toLowerCase(),        // $3
      validatedData.role,                       // $4
      validatedData.institution || null,       // $5
      hashedPassword,                           // $6
      emailVerifiedValue,                       // $7 - flexible boolean/timestamp
    ]);

    if (userResult.rows.length === 0) {
      throw new Error("Failed to create user - no data returned from database");
    }

    const user = userResult.rows[0];

    // Log successful registration
    console.log("✅ New user registered successfully:", {
      id: user.id,
      email: user.email,
      role: user.role,
      institution: user.institution,
      emailVerified: user.email_verified,
    });

    // Handle response based on email_verified type
    let emailVerifiedResponse;
    if (typeof user.email_verified === 'boolean') {
      emailVerifiedResponse = user.email_verified;
    } else {
      // It's a timestamp or null
      emailVerifiedResponse = !!user.email_verified;
    }

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          institution: user.institution,
          emailVerified: emailVerifiedResponse,
          createdAt: user.created_at,
        },
      },
      { status: 201 }
    );

  } catch (error) {
    console.error("❌ Registration error:", error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      const fieldErrors = error.errors.map((err) => ({
        field: err.path[0],
        message: err.message,
      }));

      return NextResponse.json(
        {
          message: "Validation failed",
          errors: fieldErrors,
        },
        { status: 400 }
      );
    }

    // Handle database errors
    if (error && typeof error === "object" && "code" in error) {
      const dbError = error as any;
      console.error("Database error details:", {
        code: dbError.code,
        message: dbError.message,
        detail: dbError.detail,
        hint: dbError.hint,
        position: dbError.position,
      });

      switch (dbError.code) {
        case "23505": // Unique violation
          return NextResponse.json(
            {
              message: "A user with this email already exists",
              field: "email",
            },
            { status: 400 }
          );
        case "42703": // Column does not exist
          return NextResponse.json(
            {
              message: "Database schema mismatch. Column may not exist.",
              error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
            },
            { status: 500 }
          );
        case "22P02": // Invalid input syntax (data type mismatch)
          return NextResponse.json(
            {
              message: "Database data type mismatch. Please check column types.",
              error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
            },
            { status: 500 }
          );
        default:
          console.error("Unhandled database error:", dbError);
          return NextResponse.json(
            {
              message: "Database error occurred. Please try again.",
              error: process.env.NODE_ENV === "development" ? dbError.message : undefined,
            },
            { status: 500 }
          );
      }
    }

    // Handle generic errors
    const genericError = error as Error;
    return NextResponse.json(
      {
        message: "Internal server error occurred. Please try again.",
        error: process.env.NODE_ENV === "development" ? genericError.message : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json(
    { message: "Method GET not allowed. Use POST for registration." }, 
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: "Method PUT not allowed. Use POST for registration." }, 
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: "Method DELETE not allowed. Use POST for registration." }, 
    { status: 405 }
  );
}

export async function PATCH() {
  return NextResponse.json(
    { message: "Method PATCH not allowed. Use POST for registration." }, 
    { status: 405 }
  );
}