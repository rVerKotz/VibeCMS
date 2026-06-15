'use server';

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server.ts";
import { audit } from "intelligent-audit-trail";
import { Profile } from "@/types/profile.ts";

/**
 * Retrieves the public profile for a given user ID.
 *
 * @param user_id - The UUID of the user whose profile is requested.
 * @returns A promise resolving to the user's {@link Profile}, or `null` when
 *   no matching profile exists.
 */
export const getProfiles = audit(
  async function getProfiles(user_id: string): Promise<Profile | null> {
    const supabase = await createClient();

    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user_id)
      .single();

    return profiles;
  },
  { resource: 'Profile' }
);

/**
 * Updates the authenticated user's profile fields and revalidates the
 * `/dashboard` and `/profile` page caches, then redirects to `/profile`.
 *
 * Username handling: the value is lower-cased, stripped of any characters
 * outside `[a-z0-9_]`, and prefixed with `@` when missing.
 *
 * Redirects to `/login` when the user is not authenticated.
 *
 * @param formData - Form data containing `full_name`, `avatar_url`, and
 *   `username` fields.
 * @returns A promise that always resolves via a Next.js redirect.
 */
export const updateProfile = audit(
  async function updateProfile(formData: FormData): Promise<void> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const full_name  = formData.get("full_name") as string;
    const avatar_url = formData.get("avatar_url") as string;
    let   username   = formData.get("username") as string;

    if (username) {
      username = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
      if (!username.startsWith('@')) username = '@' + username;
    }

    await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name, username, avatar_url });

    revalidatePath("/dashboard");
    revalidatePath("/profile");
    redirect("/profile");
  },
  { resource: 'Profile' }
);

/**
 * Updates the authenticated user's password via the Supabase Auth API.
 *
 * Throws an error when the Supabase update call fails. Redirects to `/profile`
 * on success.
 *
 * @param formData - Form data containing the new `password` field.
 * @returns A promise that resolves via a Next.js redirect on success, or
 *   rejects with a descriptive error on failure.
 */
export const updatePassword = audit(
  async function updatePassword(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const newPassword = formData.get("password") as string;

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw new Error(error.message);

    redirect("/profile");
  },
  { resource: 'Profile' }
);