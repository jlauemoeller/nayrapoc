import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request });

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - /login, /signup, /claim, /start (public app pages)
     * - /api/auth (NextAuth API routes)
     * - /_next (Next.js internals)
     * - /favicon.ico, /sitemap.xml, /robots.txt (static files)
     */
    "/((?!login|signup|claim|start|api/auth|_next|favicon\\.ico|sitemap\\.xml|robots\\.txt|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico)$).*)"
  ]
};
