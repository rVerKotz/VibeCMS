'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/app/utils/supabase/server'

// Helper to add timeout to promises
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms)
    ),
  ])
}

export async function login(formData: FormData) {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    const { error } = await withTimeout(
      supabase.auth.signInWithPassword({ email, password }),
      10000
    )

    const cookieStore = await cookies()

    if (error) {
      cookieStore.set('auth_error', error.message, { maxAge: 10, path: '/' })
      return redirect('/login')
    }

    revalidatePath('/dashboard', 'layout')
    return redirect('/dashboard')
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed'
    const cookieStore = await cookies()
    cookieStore.set('auth_error', message, { maxAge: 10, path: '/' })
    return redirect('/login')
  }
}

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  try {
    const { error, data } = await withTimeout(
      supabase.auth.signUp({
        email,
        password,
      }),
      10000 // 10 second timeout
    )

    if (error) {
      const cookieStore = await cookies()
      cookieStore.set('auth_error', error.message, { maxAge: 10, path: '/' })
      return redirect('/signup')
    }

    if (data.user && !data.session) {
      const cookieStore = await cookies()
      cookieStore.set('email_verif_pending', 'true', { maxAge: 10, path: '/' })
      
      return redirect('/login')
    }

    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
  } catch (error: unknown) {
    const cookieStore = await cookies()
    const message = error instanceof Error ? error.message : 'Signup failed - connection timeout'
    cookieStore.set('auth_error', message, { maxAge: 10, path: '/' })
    console.error('Signup error:', error)
    return redirect('/signup')
  }
}

export async function signout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return redirect('/login')
}