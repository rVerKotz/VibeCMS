/* ./proxy.ts */
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy.ts";
import { setCurrentPath } from "intelligent-audit-trail";

export async function middleware(request: NextRequest) {
  setCurrentPath(request.nextUrl.pathname);
  return await updateSession(request);
}

export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/profile/:path*", 
    "/:username/:slug", "/"
  ],
};