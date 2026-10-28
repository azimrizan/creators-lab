import jwt from 'jsonwebtoken';
import { UserRole } from './types';

export const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-jwt-key-learnhub-2026-production';

export interface SessionUser {
  userId: string;
  email: string;
  role: UserRole;
}

const STAFF_ROLES: UserRole[] = ['SUPER_ADMIN', 'ADMIN', 'CONTENT_MANAGER', 'INSTRUCTOR'];

/**
 * Reads the httpOnly `token` cookie and returns the signed-in user, or null for guests.
 */
export function getSessionUser(request: Request): SessionUser | null {
  const cookieHeader = request.headers.get('cookie') || '';
  const tokenMatch = cookieHeader.match(/(?:^|;\s*)token=([^;]+)/);
  if (!tokenMatch) return null;

  try {
    const decoded = jwt.verify(tokenMatch[1], JWT_SECRET) as { userId: string; email: string; role: UserRole };
    if (!decoded?.userId) return null;
    return { userId: String(decoded.userId), email: decoded.email, role: decoded.role };
  } catch {
    return null;
  }
}

export function isStaff(role: UserRole): boolean {
  return STAFF_ROLES.includes(role);
}

export function isAdmin(role: UserRole): boolean {
  return role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'CONTENT_MANAGER';
}

/** Best-effort client IP for rate-limiting guests. */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') || 'local';
}
