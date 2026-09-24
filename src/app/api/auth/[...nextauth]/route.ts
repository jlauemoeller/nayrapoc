import NextAuth from "next-auth";
import { getAuthOptions } from "@/lib/auth/options";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ nextauth: string[] }> };

// Build the handler per request rather than at module load: `next build`
// imports this module while collecting page data, and getAuthOptions() reads
// env vars (NEXTAUTH_SECRET, EMAIL_*) that needn't exist at build time.
// getAuthOptions() memoizes, so this is cheap after the first request.
function handler(req: Request, ctx: RouteContext) {
  return NextAuth(getAuthOptions())(req, ctx);
}

export { handler as GET, handler as POST };
