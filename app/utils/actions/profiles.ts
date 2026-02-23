"use server";

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getProfiles(user_id: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user_id)
    .single();

  return profiles;
}

export async function updateProfile(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  // Securely get the user from the authenticated session.
  // This cannot be spoofed by a malicious client.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  const full_name = formData.get("full_name") as string;
  const avatar_url = formData.get("avatar_url") as string;
  let username = formData.get("username") as string;
  
  // Format username: remove spaces, lowercase, add @ if missing
  if (username) {
    username = username.toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (!username.startsWith('@')) {
      username = '@' + username;
    }
  }

  // Melakukan update ke tabel profiles
  // updated_at dihapus karena sudah di-handle oleh trigger DB
  await supabase
    .from("profiles")
    .upsert({ 
      id: user.id, 
      full_name, 
      username, 
      avatar_url
    });

  revalidatePath("/dashboard");
  revalidatePath("/profile");
  redirect("/profile");
}

export async function updatePassword(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const newPassword = formData.get("new_password") as string;

  // Update password in Auth layer
  if (newPassword && newPassword.length >= 6) {
    await supabase.auth.updateUser({ password: newPassword });
  }

  revalidatePath("/profile");
  redirect("/profile");
}