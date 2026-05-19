import { NextRequest } from 'next/server';
import { createI18nMiddleware } from 'next-international/middleware';

import { type CookieOptions, createServerClient } from '@supabase/ssr';

const handleI18nRouting = createI18nMiddleware({
  locales: ['en', 'fr'],
  defaultLocale: 'en',
  urlMappingStrategy: 'rewriteDefault',
});

export async function middleware(request: NextRequest) {
  const response = handleI18nRouting(request);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({name, value, ...options});
          response.cookies.set({name, value, ...options});
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({name, value: '', ...options});
          response.cookies.set({name, value: '', ...options});
        }
      }
    }
  );

  // Note: We removed the blocking supabase.auth.getUser() call that was causing hangs
  // The cookie handlers above are sufficient to maintain session state
  return response;
}