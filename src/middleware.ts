import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { hasPermission, PermissionAction } from '@/lib/rbac';

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'super-secret-jwt-key-learnhub-2026-production'
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin dashboard routes
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/?auth=required', request.url));
    }

    try {
      const { payload }: any = await jwtVerify(token, JWT_SECRET);
      const role = payload.role;

      // Check RBAC permission for viewing user management & admin control
      const canAccessAdmin = hasPermission(role, 'user.view') || hasPermission(role, 'course.publish');

      if (!canAccessAdmin) {
        return NextResponse.redirect(new URL('/?error=forbidden', request.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/?auth=invalid', request.url));
    }
  }

  // Protect /instructor portal routes
  if (pathname.startsWith('/instructor')) {
    const token = request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.redirect(new URL('/?auth=required', request.url));
    }

    try {
      const { payload }: any = await jwtVerify(token, JWT_SECRET);
      const role = payload.role;

      if (role !== 'INSTRUCTOR' && role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/?error=forbidden', request.url));
      }
    } catch (err) {
      return NextResponse.redirect(new URL('/?auth=invalid', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/instructor/:path*']
};
