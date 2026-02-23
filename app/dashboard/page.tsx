import { createClient } from "@/app/utils/supabase/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getDashboardData } from "@/app/utils/actions/articles";
import { 
  Eye, 
  FileCheck, 
  FileClock, 
  ThumbsUp,
  ChevronLeft
} from "lucide-react";
import DashboardClient from "@/app/dashboard/dashboard-client";
import { getProfiles } from "@/app/utils/actions/profiles";
import Link from "next/link";

function StatCard({ title, value, icon: Icon, description }: any) {
  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
          {title}
        </h3>
        <div className="rounded-full bg-zinc-100 p-2 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
           <Icon className="h-4 w-4" />
        </div>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">{value}</div>
        <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">{description}</p>
      </div>
    </div>
  );
}

export default async function Page() {
  const { user, articles } = await getDashboardData();

  if (!user) {
    redirect("/login");
  }

  const profile = await getProfiles(user.id);
  const articleList = articles || [];

  // Hitung Statistik
  const totalPublished = articleList.filter((a: any) => a.status === "published").length;
  const totalDraft = articleList.filter((a: any) => a.status === "draft").length;
  const totalViews = articleList.reduce((acc: number, curr: any) => acc + (curr.views || 0), 0);
  const totalLikes = articleList.reduce((acc: number, curr: any) => acc + (curr.likes || 0), 0);

  return (
    <div className="min-h-screen w-full bg-zinc-50/50 p-6 dark:bg-zinc-950/50 md:p-8 space-y-8 transition-colors duration-300">
      
      {/* Top Navbar */}
      <nav className="flex items-center justify-between pb-2 animate-in fade-in slide-in-from-top-2">
        <Link href="/" className="flex items-center gap-2 group text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white transition-colors">
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="font-bold text-xl tracking-tighter text-zinc-900 dark:text-white">VibeCMS</span>
        </Link>

        <div className="flex gap-4 text-sm font-medium items-center">
          {profile ? (
            <Link 
              href="/profile" 
              className="w-9 h-9 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center text-xs font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all shadow-sm"
              title="Pengaturan Profil"
            >
              {profile.avatar_url ? (
                <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                profile.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
              )}
            </Link>
          ) : (
            <Link href="/login" className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-500 transition-colors">
              Login
            </Link>
          )}
        </div>
      </nav>

      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Dashboard
        </h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">
          Selamat datang kembali, kelola konten dan pantau performa Anda.
        </p>
      </div>

      {/* Analytics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 md:grid-rows-2 lg:grid-rows-1 overflow-x-auto md:overflow-visible">
        <div className="flex gap-4 md:contents snap-x snap-mandatory overflow-x-auto md:overflow-visible pb-2 md:pb-0">
          <div className="snap-start shrink-0 w-[calc(100vw-3rem)] md:w-auto md:snap-start">
        <StatCard
          title="Total Views"
          value={totalViews.toLocaleString()}
          icon={Eye}
          description="Total pembaca"
        />
          </div>
          <div className="snap-start shrink-0 w-[calc(100vw-3rem)] md:w-auto">
        <StatCard
          title="Total Likes"
          value={totalLikes.toLocaleString()}
          icon={ThumbsUp}
          description="Apresiasi pembaca"
        />
          </div>
          <div className="snap-start shrink-0 w-[calc(100vw-3rem)] md:w-auto">
        <StatCard
          title="Artikel Terbit"
          value={totalPublished}
          icon={FileCheck}
          description="Status Published"
        />
          </div>
          <div className="snap-start shrink-0 w-[calc(100vw-3rem)] md:w-auto">
        <StatCard
          title="Draft"
          value={totalDraft}
          icon={FileClock}
          description="Status Draft"
        />
          </div>
        </div>
      </div>

      {/* @ts-ignore: Mengabaikan cache TS yang belum sinkron dengan update props terbaru */}
      <DashboardClient articles={articleList} profile={profile}/>
    </div>
  );
}