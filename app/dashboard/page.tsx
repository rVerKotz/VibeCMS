import Link from "next/link";
import DashboardClient from "@/app/dashboard/dashboard-client";
import { redirect } from "next/navigation";
import { getProfiles } from "@/app/utils/actions/profiles";
import { getDashboardData, getArticles } from "@/app/utils/actions/articles";
import { ChevronLeft, Eye, FileCheck, FileClock, ThumbsUp } from "lucide-react";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    order?: string;
    page?: string;
    size?: string;
  }>;
}

function StatCard({ title, value, icon: Icon, description }: any) {
  return (
    <div className="group rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900/50">
      <div className="flex flex-row items-center justify-between space-y-0 pb-2">
        <h3 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">{title}</h3>
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

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  
  // getDashboardData used for Analytics stats
  const { user, articles: allArticles } = await getDashboardData();
  if (!user) redirect("/login");

  // getArticles used for the paginated/filtered Table
  const { articles: paginatedArticles, total } = await getArticles({
    query: params.q,
    sortBy: params.sort || "created_at",
    order: (params.order as "asc" | "desc") || "desc",
    page: params.page ? parseInt(params.page) : 1,
    pageSize: params.size ? parseInt(params.size) : 5,
  });

  const profile = await getProfiles(user.id);

  // Statistics from ALL articles
  const totalPublished = allArticles.filter((a: any) => a.status === "published").length;
  const totalDraft = allArticles.filter((a: any) => a.status === "draft").length;
  const totalViews = allArticles.reduce((acc: number, curr: any) => acc + (curr.views || 0), 0);
  const totalLikes = allArticles.reduce((acc: number, curr: any) => acc + (curr.likes || 0), 0);

  return (
    <div className="min-h-screen w-full bg-zinc-50/50 px-6 dark:bg-zinc-950/50 md:px-8 space-y-8 transition-colors duration-300">
      <nav className="sticky top-0 z-50 mb-8 border-b border-zinc-100 bg-white/80 px-6 py-4 backdrop-blur-md transition-all dark:border-zinc-800 dark:bg-zinc-950/80 md:px-8">
        <div className="flex items-center justify-between">
          <Link href="/" className="group flex items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white">
            <ChevronLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
            <span className="text-xl font-bold tracking-tighter text-zinc-900 dark:text-white">VibeCMS</span>
          </Link>
          <div className="flex items-center gap-4 text-sm font-medium">
            {profile && (
              <Link href="/profile" className="flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-zinc-900 text-xs font-bold text-white shadow-sm transition-all hover:ring-2 hover:ring-indigo-500 dark:bg-zinc-100 dark:text-zinc-900">
                {profile.avatar_url ? <img src={profile.avatar_url} alt="Profile" className="h-full w-full object-cover" /> : (profile.full_name?.[0]?.toUpperCase() || "U")}
              </Link>
            )}
          </div>
        </div>
      </nav>

      <div>
        <h2 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Dashboard</h2>
        <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kelola konten dan pantau performa Anda.</p>
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

      {/* Pass both paginated data and total count to the client */}
      <DashboardClient 
        initialArticles={paginatedArticles} 
        totalArticles={total} 
      />
    </div>
  );
}