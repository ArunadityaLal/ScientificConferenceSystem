import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { generateSecureTempPassword } from "@/lib/auth/createTempPassword";

// In-memory user store (replace with your database)
let USERS_STORE: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const { email, name, facultyId } = await req.json();

    console.log(`👤 Auto-registering faculty: ${name} (${email})`);

    if (!email || !name || !facultyId) {
      return NextResponse.json(
        { error: "Missing required fields: email, name, facultyId" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = USERS_STORE.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );

    if (existingUser) {
      console.log(`👤 Faculty already registered: ${email}`);
      return NextResponse.json({
        success: true,
        message: "User already registered",
        user: {
          email: existingUser.email,
          name: existingUser.name,
          role: existingUser.role,
          isNewUser: false,
        },
      });
    }

    // Generate temporary password
    const tempPassword = generateSecureTempPassword();
    const hashedPassword = await hash(tempPassword, 12);

    // Create new faculty user
    const newUser = {
      id: `faculty_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      email: email.toLowerCase(),
      name: name,
      role: "FACULTY",
      facultyId: facultyId,
      password: hashedPassword,
      isFirstLogin: true,
      mustChangePassword: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    USERS_STORE.push(newUser);

    console.log(`✅ Faculty registered successfully: ${email}`);
    console.log(`🔑 Temporary password: ${tempPassword}`);

    return NextResponse.json({
      success: true,
      message: "Faculty registered successfully",
      user: {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        role: newUser.role,
        tempPassword: tempPassword,
        isNewUser: true,
      },
    });
  } catch (error) {
    console.error("❌ Error in faculty auto-registration:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";

// Export for access by other API routes
export { USERS_STORE };
