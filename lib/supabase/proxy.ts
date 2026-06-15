import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // NextRequest.headers is read-only in the Next.js Edge runtime — calling
  // .set() on it silently fails. We must clone into a mutable Headers object
  // first, then pass that clone to NextResponse.next({ request: { headers } }).
  // Next.js forwards every header in that object into the Node.js runtime where
  // next/headers() can read them inside Server Components and Server Actions.
  const mutableHeaders = new Headers(request.headers);
  mutableHeaders.set('x-current-path', request.nextUrl.pathname);

  let supabaseResponse = NextResponse.next({
    request: { headers: mutableHeaders },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))

          // Each new NextResponse.next() starts with a fresh header bag, so we
          // must re-clone and re-inject x-current-path every time Supabase
          // rotates the session cookie and reassigns supabaseResponse.
          const refreshedHeaders = new Headers(request.headers);
          refreshedHeaders.set('x-current-path', request.nextUrl.pathname);

          supabaseResponse = NextResponse.next({
            request: { headers: refreshedHeaders },
          })

          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and supabase.auth.getClaims().
  // A simple mistake could make it very hard to debug issues with users being
  // randomly logged out.
  const { data } = await supabase.auth.getClaims()
  const user = data?.claims

  if (
    !user &&
    !request.nextUrl.pathname.startsWith('/login') &&
    !request.nextUrl.pathname.startsWith('/auth')
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}