'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers' // Import cookies
import { createClient } from '@/app/utils/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient(cookies())

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    const cookieStore = await cookies()
    cookieStore.set('auth_error', error.message, { maxAge: 10, path: '/' })
    return redirect('/login')
  }

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signup(formData: FormData) {
  const supabase = await createClient(cookies())

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  const { error, data } = await supabase.auth.signUp({
    email,
    password,
  })

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

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function signout() {
  const supabase = await createClient(cookies())
  await supabase.auth.signOut()
  redirect('/login')
}