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

// FIXED: Registration validation schema - phone is now optional
const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(), // Made phone optional
  role: z.nativeEnum(UserRole),
  institution: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  emailVerified: z.boolean().optional().default(false),
  phoneVerified: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("📝 Registration request body:", body);

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

    // FIXED: Create user in database with optional phone
    const insertUserQuery = `
      INSERT INTO users (
        id, name, email, phone, role, institution, password, 
        email_verified, phone_verified, is_active, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW(), NOW()
      ) RETURNING id, name, email, phone, role, institution, email_verified, phone_verified, created_at
    `;

    const userResult = await query(insertUserQuery, [
      userId,
      validatedData.name,
      validatedData.email.toLowerCase(),
      validatedData.phone || null, // Use null if phone not provided
      validatedData.role,
      validatedData.institution || null,
      hashedPassword,
      validatedData.emailVerified || false,
      validatedData.phoneVerified || false,
    ]);

    const user = userResult.rows[0];

    // Log successful registration
    console.log("✅ New user registered:", {
      id: user.id,
      email: user.email,
      role: user.role,
      institution: user.institution,
      emailVerified: user.email_verified,
      phoneVerified: user.phone_verified,
    });

    return NextResponse.json(
      {
        message: "User registered successfully",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
          institution: user.institution,
          emailVerified: user.email_verified,
          phoneVerified: user.phone_verified,
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
      switch (error.code) {
        case "23505": // Unique violation
          return NextResponse.json(
            {
              message: "A user with this email already exists",
              field: "email",
            },
            { status: 400 }
          );
        case "23502": // Not null violation
          return NextResponse.json(
            {
              message: "Required field is missing",
              field: "unknown",
            },
            { status: 400 }
          );
        case "22001": // String data too long
          return NextResponse.json(
            {
              message: "The provided value is too long for the database field",
              field: "unknown",
            },
            { status: 400 }
          );
        default:
          console.error("Database error:", error);
      }
    }

    return NextResponse.json(
      {
        message: "Internal server error occurred. Please try again.",
        error:
          process.env.NODE_ENV === "development" ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function PUT() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

export async function DELETE() {
  return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}