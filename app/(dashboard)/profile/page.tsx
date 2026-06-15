import { redirect } from "next/navigation";
import { auditPage } from "intelligent-audit-trail";
import { AuthAPI, ProfileAPI } from "@/actions/index.ts";
import ProfileClient from "@/components/features/profile/ProfileClient.tsx";

async function ProfilePage() {
  const user = await AuthAPI.getUser();
  if (!user) redirect("/login");
  const profile = await ProfileAPI.getProfiles(user.id);
  return <ProfileClient user={user} profile={profile} />;
}

export default auditPage(ProfilePage, { resource: "Profile", functionName: "doRender", urlPath: "/profile" });