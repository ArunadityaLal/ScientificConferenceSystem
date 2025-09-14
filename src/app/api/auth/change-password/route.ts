import { NextRequest, NextResponse } from "next/server";
import { hash, compare } from "bcryptjs";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../[...nextauth]/route";
import { USERS_STORE } from "../../faculty/auto-register/route";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: "Current password and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { error: "New password must be at least 6 characters long" },
        { status: 400 }
      );
    }

    // Find user
    const userIndex = USERS_STORE.findIndex(
      (u) => u.email.toLowerCase() === session.user.email?.toLowerCase()
    );

    if (userIndex === -1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const user = USERS_STORE[userIndex];

    // Verify current password
    const isCurrentPasswordValid = await compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { error: "Current password is incorrect" },
        { status: 400 }
      );
    }

    // Hash new password
    const hashedNewPassword = await hash(newPassword, 12);

    // Update user
    USERS_STORE[userIndex] = {
      ...user,
      password: hashedNewPassword,
      isFirstLogin: false,
      mustChangePassword: false,
      updatedAt: new Date().toISOString(),
    };

    console.log(`🔑 Password changed successfully for: ${session.user.email}`);

    return NextResponse.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("❌ Error changing password:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
