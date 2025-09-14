// src/lib/api/middleware.ts - COMPLETE FILE WITH EVENT EXPORT FIX
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { query, db } from '@/lib/database/connection'; // ✅ Fixed: using pg client instead of prisma
import { z } from 'zod';

// Types for middleware
export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export interface MiddlewareConfig {
  requireAuth?: boolean;
  allowedRoles?: string[];
  requireEventAccess?: boolean;
  requirePermissions?: string[];
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

// Rate limit middleware
export function createRateLimit(windowMs: number = 15 * 60 * 1000, max: number = 100) {
  return (identifier: string): boolean => {
    const now = Date.now();
    const key = identifier;
    const record = rateLimitStore.get(key);

    if (!record || now > record.resetTime) {
      rateLimitStore.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (record.count >= max) {
      return false;
    }

    record.count++;
    return true;
  };
}

// Authentication middleware
export async function requireAuth(request: NextRequest): Promise<{
  success: boolean;
  user?: any;
  error?: string;
  status?: number;
}> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return {
        success: false,
        error: 'Authentication required',
        status: 401
      };
    }

    // ✅ Fixed: Raw SQL query instead of Prisma
    const result = await query(
      `SELECT id, email, name, role, email_verified, is_active 
       FROM users 
       WHERE id = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        error: 'User not found',
        status: 401
      };
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return {
        success: false,
        error: 'Account is disabled',
        status: 403
      };
    }

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        emailVerified: user.email_verified,
        isActive: user.is_active
      }
    };
  } catch (error) {
    console.error('Auth middleware error:', error);
    return {
      success: false,
      error: 'Authentication failed',
      status: 500
    };
  }
}

// Role-based authorization middleware
export function requireRole(allowedRoles: string[]) {
  return (user: any): { success: boolean; error?: string; status?: number } => {
    if (!allowedRoles.includes(user.role)) {
      return {
        success: false,
        error: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
        status: 403
      };
    }

    return { success: true };
  };
}

// ✅ UPDATED: Event access middleware with EVENT_MANAGER role bypass
export async function requireEventAccess(
  userId: string,
  eventId: string,
  requiredPermissions: string[] = ['READ'],
  userRole?: string  // ✅ ADD: User role parameter
): Promise<{
  success: boolean;
  userEvent?: any;
  error?: string;
  status?: number;
}> {
  try {
    if (!eventId) {
      return {
        success: false,
        error: 'Event ID is required',
        status: 400
      };
    }

    console.log(`🔍 Checking event access for user: ${userId}, event: ${eventId}, role: ${userRole}`);

    // ✅ ADD: EVENT_MANAGER and ORGANIZER role bypass
    if (userRole && ['EVENT_MANAGER', 'ORGANIZER'].includes(userRole)) {
      console.log(`🔐 Admin access granted for ${userRole} role`);
      return { success: true };
    }

    // ✅ Fixed: Raw SQL query for user event access
    const userEventResult = await query(
      `SELECT ue.*, e.id as event_id, e.name as event_name, e.status as event_status, e.created_by
       FROM user_events ue
       JOIN events e ON e.id = ue.event_id
       WHERE ue.user_id = $1 AND ue.event_id = $2`,
      [userId, eventId]
    );

    if (userEventResult.rows.length === 0) {
      // Check if it's a public event for certain roles
      const eventResult = await query(
        `SELECT status, created_by FROM events WHERE id = $1`,
        [eventId]
      );

      if (eventResult.rows.length === 0) {
        return {
          success: false,
          error: 'Event not found',
          status: 404
        };
      }

      const event = eventResult.rows[0];

      // Event creator always has access
      if (event.created_by === userId) {
        console.log('✅ Event creator access granted');
        return { success: true };
      }

      // Public access for published events (read-only)
      if (event.status === 'PUBLISHED' && requiredPermissions.every(p => p === 'READ')) {
        console.log('✅ Public event read access granted');
        return { success: true };
      }

      console.log('❌ No access found:', { userId, eventId, createdBy: event.created_by, userRole });
      return {
        success: false,
        error: 'Access denied to this event',
        status: 403
      };
    }

    const userEvent = userEventResult.rows[0];

    // ✅ Fixed: Check permissions (assuming permissions are stored as JSON array)
    const permissions = userEvent.permissions || [];
    const hasRequiredPermissions = requiredPermissions.every(permission =>
      permissions.includes(permission)
    );

    if (!hasRequiredPermissions) {
      return {
        success: false,
        error: `Insufficient permissions. Required: ${requiredPermissions.join(', ')}`,
        status: 403
      };
    }

    console.log('✅ User event access granted via user_events table');
    return {
      success: true,
      userEvent: {
        id: userEvent.id,
        userId: userEvent.user_id,
        eventId: userEvent.event_id,
        permissions: userEvent.permissions,
        event: {
          id: userEvent.event_id,
          name: userEvent.event_name,
          status: userEvent.event_status,
          createdBy: userEvent.created_by
        }
      }
    };
  } catch (error) {
    console.error('Event access middleware error:', error);
    return {
      success: false,
      error: 'Failed to verify event access',
      status: 500
    };
  }
}

// Validation middleware
export function validateSchema<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest): Promise<{
    success: boolean;
    data?: T;
    error?: string;
    details?: any;
    status?: number;
  }> => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      
      return {
        success: true,
        data: validatedData
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          details: error.errors,
          status: 400
        };
      }

      return {
        success: false,
        error: 'Invalid request data',
        status: 400
      };
    }
  };
}

// ✅ UPDATED: Combined middleware function with user role passing
export async function withMiddleware(
  request: NextRequest,
  config: MiddlewareConfig = {}
) {
  const {
    requireAuth: needsAuth = true,
    allowedRoles = [],
    requireEventAccess: needsEventAccess = false,
    requirePermissions = ['READ'],
    rateLimit: rateLimitConfig
  } = config;

  // Rate limiting
  if (rateLimitConfig) {
    const identifier = request.ip || 'anonymous';
    const isAllowed = createRateLimit(
      rateLimitConfig.windowMs,
      rateLimitConfig.max
    )(identifier);

    if (!isAllowed) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }
  }

  // Authentication
  let user;
  if (needsAuth) {
    const authResult = await requireAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status || 500 }
      );
    }
    user = authResult.user;
  }

  // Role authorization
  if (allowedRoles.length > 0 && user) {
    const roleResult = requireRole(allowedRoles)(user);
    if (!roleResult.success) {
      return NextResponse.json(
        { error: roleResult.error },
        { status: roleResult.status || 403 }
      );
    }
  }

  // ✅ UPDATED: Event access with user role
  if (needsEventAccess && user) {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId') || 
                   (await request.clone().json().catch(() => ({})))?.eventId;

    if (eventId) {
      const eventAccessResult = await requireEventAccess(
        user.id,
        eventId,
        requirePermissions,
        user.role  // ✅ ADD: Pass user role
      );

      if (!eventAccessResult.success) {
        return NextResponse.json(
          { error: eventAccessResult.error },
          { status: eventAccessResult.status || 403 }
        );
      }
    }
  }

  return { user };
}

// Error handling middleware
export function handleApiError(error: any): NextResponse {
  console.error('API Error:', error);

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      {
        error: 'Validation failed',
        details: error.errors
      },
      { status: 400 }
    );
  }

  // ✅ Fixed: PostgreSQL error codes instead of Prisma
  if (error.code === '23505') { // Unique violation
    return NextResponse.json(
      { error: 'A record with this data already exists' },
      { status: 409 }
    );
  }

  if (error.code === '23503') { // Foreign key violation
    return NextResponse.json(
      { error: 'Related record not found' },
      { status: 400 }
    );
  }

  if (error.code === '23502') { // Not null violation
    return NextResponse.json(
      { error: 'Required field is missing' },
      { status: 400 }
    );
  }

  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  );
}

// Success response helper
export function successResponse(data: any, message?: string, status: number = 200) {
  return NextResponse.json(
    {
      success: true,
      data,
      message
    },
    { status }
  );
}

// Error response helper
export function errorResponse(error: string, status: number = 400, details?: any) {
  return NextResponse.json(
    {
      success: false,
      error,
      details
    },
    { status }
  );
}

// Pagination helper
export function getPagination(searchParams: URLSearchParams) {
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100); // Max 100 items
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

// Sorting helper
export function getSorting(searchParams: URLSearchParams, allowedFields: string[] = []) {
  const sortBy = searchParams.get('sortBy') || 'created_at';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  // Validate sortBy field
  if (allowedFields.length > 0 && !allowedFields.includes(sortBy)) {
    return { sortBy: 'created_at', sortOrder };
  }

  return { sortBy, sortOrder };
}

// Search helper for PostgreSQL
export function getSearchFilter(searchParams: URLSearchParams, searchFields: string[]) {
  const search = searchParams.get('search');
  
  if (!search || searchFields.length === 0) {
    return { where: '', params: [] };
  }

  const conditions = searchFields.map((field, index) => 
    `${field} ILIKE $${index + 1}`
  );
  
  const params = searchFields.map(() => `%${search}%`);

  return {
    where: `(${conditions.join(' OR ')})`,
    params
  };
}

// Middleware wrapper for API routes
export function createApiHandler(config: MiddlewareConfig = {}) {
  return function (
    handler: (request: NextRequest, context: any, user?: any) => Promise<NextResponse>
  ) {
    return async function (request: NextRequest, context: any) {
      try {
        const middlewareResult = await withMiddleware(request, config);
        
        if (middlewareResult instanceof NextResponse) {
          return middlewareResult;
        }

        return await handler(request, context, middlewareResult.user);
      } catch (error) {
        return handleApiError(error);
      }
    };
  };
}
// Add these exports to src/lib/api/middleware.ts:
export const withRateLimit = createRateLimit;
export const withAuth = requireAuth;
export const ApiError = errorResponse;
export const validateBody = validateSchema;