import { createClient } from "@/app/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import ProfileClient from "@/app/profile/profile-client";
import { getProfiles } from "@/app/utils/actions/profiles";

export default async function ProfilePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await getProfiles(user.id);

  return <ProfileClient user={user} profile={profile} />;
}