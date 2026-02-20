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