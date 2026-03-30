import { type NextRequest } from 'next/server'
import { middleware as _middleware } from '@/app/utils/supabase/middleware'

export async function proxy(request: NextRequest) {
  return await _middleware(request)
}

export const config = {
  matcher: [
    // Only run middleware on protected routes, NOT on auth routes
    '/dashboard/:path*',
    '/profile/:path*',
    '/:username/:slug',
    '/', // Home page only
    // EXCLUDE /login, /signup - these run Server Actions that need cookies()
  ],
}