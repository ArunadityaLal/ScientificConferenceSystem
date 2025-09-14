// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow NextAuth routes and static files
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static")
  ) {
    return NextResponse.next();
  }

  // Example: If user is logged in and hits root "/", send to dashboard
  // You might read a cookie or session header here
  // If you don’t have a quick way to know, skip this optimization
  return NextResponse.next();
}

export const config = {
  matcher: [
    // Apply to all paths except public assets; refine as needed
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
