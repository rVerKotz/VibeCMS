import { redirect } from "next/navigation";
import { ProfileAPI } from "@/actions/index.ts";
import { createClient } from "@/lib/supabase/server.ts";
import ProfileClient from "@/components/features/profile/ProfileClient.tsx";

export default async function ProfilePage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profile = await ProfileAPI.getProfiles(user.id);
  return <ProfileClient user={user} profile={profile} />;
}