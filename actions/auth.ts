'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { audit } from 'intelligent-audit-trail'
import { createClient } from '@/lib/supabase/server.ts'

/**
 * Races a promise against a timeout rejection.
 *
 * @param promise - The operation to execute.
 * @param ms      - Maximum number of milliseconds to wait before rejecting.
 * @returns A promise that resolves with the original value, or rejects with a
 *   timeout error if `ms` elapses first.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Authenticates a user with email and password.
 *
 * On success the session is established and the user is redirected to
 * `/dashboard`. On failure an `auth_error` cookie is set and the user is
 * redirected back to `/login`.
 *
 * @param formData - Form data containing `email` and `password` fields.
 * @returns A promise that always resolves via a Next.js redirect.
 */
export const login = audit(
  async function login(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    let redirectToPath: string = '/dashboard';
    let isSuccess = false;

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        10000
      );

      if (error || !data.session) {
        const cookieStore = await cookies();
        cookieStore.set('auth_error', error?.message || 'Login failed', { maxAge: 180, path: '/' });
        redirectToPath = '/login';
      } else {
        isSuccess = true;
      }
    } catch (error: unknown) {
      const cookieStore = await cookies();
      const message = error instanceof Error ? error.message : 'Login failed';
      cookieStore.set('auth_error', message, { maxAge: 180, path: '/' });
      redirectToPath = '/login';
    }

    if (isSuccess) {
      revalidatePath('/', 'layout');
    }

    redirect(redirectToPath);
  },
  { resource: 'Auth' }
);

/**
 * Registers a new user account with email and password.
 *
 * Redirects to `/dashboard` on successful sign-up with an active session.
 * Redirects to `/login` when email verification is pending. Redirects back
 * to `/signup` and sets an `auth_error` cookie on any failure.
 *
 * @param formData - Form data containing `email` and `password` fields.
 * @returns A promise that always resolves via a Next.js redirect.
 */
export const signup = audit(
  async function signup(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    let redirectToPath: string = '/dashboard';

    try {
      const { data, error } = await withTimeout(
        supabase.auth.signUp({ email, password }),
        15000
      );

      if (error) {
        const cookieStore = await cookies();
        cookieStore.set('auth_error', error.message, { maxAge: 60, path: '/' });
        redirectToPath = '/signup';
      } else if (data.user && !data.session) {
        const cookieStore = await cookies();
        cookieStore.set('email_verif_pending', 'true', { maxAge: 60, path: '/' });
        redirectToPath = '/login';
      } else {
        revalidatePath('/', 'layout');
      }
    } catch (error: unknown) {
      const cookieStore = await cookies();
      const message = error instanceof Error ? error.message : 'Signup failed - connection timeout';
      cookieStore.set('auth_error', message, { maxAge: 60, path: '/' });
      redirectToPath = '/signup';
    }
    
    redirect(redirectToPath);
  },
  { resource: 'Auth' }
);

/**
 * Signs out the currently authenticated user and redirects to `/login`.
 *
 * @returns A promise that always resolves via a Next.js redirect.
 */
export const logout = audit(
  async function logout(): Promise<void> {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  },
  { resource: 'Auth' }
);

/**
 * Returns the currently authenticated user, or `null` if no user is signed in.
 *
 * @returns A promise resolving to the user object or `null`.
 */
export const getUser = audit(
  async function getUser() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  }, { resource: 'Auth' }
);