// src/lib/auth/config.ts - FIXED: JWT callback that refreshes user role
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { query } from "@/lib/database/connection";
import bcrypt from "bcryptjs";

// Define User Role enum (since we don't have Prisma anymore)
export enum UserRole {
  ORGANIZER = "ORGANIZER",
  EVENT_MANAGER = "EVENT_MANAGER",
  FACULTY = "FACULTY",
  DELEGATE = "DELEGATE",
  HALL_COORDINATOR = "HALL_COORDINATOR",
  SPONSOR = "SPONSOR",
  VOLUNTEER = "VOLUNTEER",
  VENDOR = "VENDOR",
}

// User interface
export interface User {
  id: string;
  email: string;
  name?: string | null;
  phone?: string | null;
  role: UserRole;
  institution?: string | null;
  password?: string | null;
  image?: string | null;
  emailVerified?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

// Database functions for users
export const UserService = {
  async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query("SELECT * FROM users WHERE email = $1", [
        email.toLowerCase(),
      ]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by email:", error);
      return null;
    }
  },

  async findById(id: string): Promise<User | null> {
    try {
      const result = await query("SELECT * FROM users WHERE id = $1", [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error finding user by id:", error);
      return null;
    }
  },

  async create(userData: Partial<User>): Promise<User | null> {
    try {
      const result = await query(
        `INSERT INTO users (email, name, image, role, email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
         RETURNING *`,
        [
          userData.email?.toLowerCase(),
          userData.name,
          userData.image,
          userData.role || UserRole.EVENT_MANAGER,
          userData.emailVerified || new Date(),
        ]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error creating user:", error);
      return null;
    }
  },

  async updateEmailVerified(email: string): Promise<User | null> {
    try {
      const result = await query(
        `UPDATE users SET email_verified = NOW(), updated_at = NOW() 
         WHERE email = $1 RETURNING *`,
        [email.toLowerCase()]
      );
      return result.rows[0] || null;
    } catch (error) {
      console.error("Error updating email verification:", error);
      return null;
    }
  },
};

export const authOptions: NextAuthOptions = {
  // Remove Prisma adapter - use JWT sessions only
  providers: [
    // Email & Password Authentication
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: {
          label: "Email",
          type: "email",
          placeholder: "john@example.com",
        },
        password: {
          label: "Password",
          type: "password",
        },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("❌ Missing email or password");
          return null;
        }

        try {
          // Find user in database
          const user = await UserService.findByEmail(credentials.email);

          if (!user || !user.password) {
            console.log("❌ User not found or no password set");
            return null;
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.log("❌ Invalid password");
            return null;
          }

          console.log("✅ User authenticated successfully:", user.email);

          // Return user object for JWT
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            image: user.image,
          };
        } catch (error) {
          console.error("❌ Authentication error:", error);
          return null;
        }
      },
    }),

    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: UserRole.EVENT_MANAGER, // Default role for Google signups
        };
      },
    }),
  ],

  session: {
    strategy: "jwt", // JWT-only sessions (no database sessions)
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  callbacks: {
    // FIXED: JWT callback that refreshes user role from database
    async jwt({ token, user, account }) {
      // For NEW logins, set initial token data
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.email = user.email;
        console.log("🔄 JWT token updated with NEW user data:", user.role);
      }

      // CRITICAL FIX: Refresh user data from database for existing tokens
      if (token.id && !user) {
        try {
          const freshUser = await UserService.findById(token.id as string);
          if (freshUser) {
            // Update token with fresh database data
            const oldRole = token.role;
            token.role = freshUser.role;
            token.email = freshUser.email;
            token.name = freshUser.name ?? undefined;
            
            if (oldRole !== freshUser.role) {
              console.log(`🔄 Role updated in JWT: ${oldRole} → ${freshUser.role}`);
            }
          }
        } catch (error) {
          console.error("❌ Error refreshing user data in JWT:", error);
        }
      }

      // Handle first-time Google login
      if (account?.provider === "google" && user) {
        try {
          console.log("🔄 Processing Google login for:", user.email);

          // Check if user already exists
          const existingUser = await UserService.findByEmail(user.email!);

          if (!existingUser) {
            console.log("➕ Creating new Google user");
            // Create new user with Google data
            const newUser = await UserService.create({
              email: user.email!,
              name: user.name!,
              image: user.image,
              role: UserRole.DELEGATE,
              emailVerified: new Date(),
            });

            if (newUser) {
              token.role = newUser.role;
              token.id = newUser.id;
              console.log("✅ New Google user created:", newUser.email);
            }
          } else {
            console.log("✅ Existing Google user found");
            token.role = existingUser.role;
            token.id = existingUser.id;

            // Update email verification if not set
            if (!existingUser.emailVerified) {
              await UserService.updateEmailVerified(user.email!);
            }
          }
        } catch (error) {
          console.error("❌ Error handling Google login:", error);
        }
      }

      return token;
    },

    async session({ session, token }) {
      // Send properties to the client
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.email = token.email as string;
        session.user.name = token.name as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Redirect to appropriate dashboard based on role
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  events: {
    async signIn({ user, account, profile }) {
      console.log("👤 User signed in:", user.email, "via", account?.provider);
    },

    async signOut({ session }) {
      console.log("👋 User signed out:", session?.user?.email);
    },

    async createUser({ user }) {
      console.log("🆕 New user created:", user.email);

      // Send welcome email (implement later)
      // await sendWelcomeEmail(user.email, user.name)
    },
  },

  debug: process.env.NODE_ENV === "development",
};

// Helper function to get user role-based redirect URL
export function getRoleBasedRedirectUrl(role: UserRole): string {
  const roleRoutes: Record<UserRole, string> = {
    [UserRole.ORGANIZER]: "/organizer",
    [UserRole.EVENT_MANAGER]: "/event-manager",
    [UserRole.FACULTY]: "/faculty",
    [UserRole.DELEGATE]: "/delegate",
    [UserRole.HALL_COORDINATOR]: "/hall-coordinator",
    [UserRole.SPONSOR]: "/sponsor",
    [UserRole.VOLUNTEER]: "/volunteer",
    [UserRole.VENDOR]: "/vendor",
  };

  return roleRoutes[role] || "/delegate";
}

// Helper function to hash passwords
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
}

// Helper function to verify passwords
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Validate user role
export function isValidUserRole(role: string): role is UserRole {
  return Object.values(UserRole).includes(role as UserRole);
}

// Get user by session
export async function getUserBySession(
  sessionUserId: string
): Promise<User | null> {
  return await UserService.findById(sessionUserId);
}

// Type extensions for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      role?: UserRole;
      email: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: UserRole;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: UserRole;
    id?: string;
    email: string;
    name?: string;
  }
}
// Add this export at the bottom of the file
export const authConfig = authOptions;