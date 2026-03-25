import Link from "next/link";
import DashboardClient from "@/app/dashboard/dashboard-client";
import { redirect } from "next/navigation";
import { getProfiles } from "@/app/utils/actions/profiles";
import { getArticles, getDashboardData } from "@/app/utils/actions/articles";
import { ChevronLeft, Eye, FileCheck, FileClock, ThumbsUp } from "lucide-react";
import { getCommentsbyArticleIds } from "@/app/utils/actions/comments.ts";

interface PageProps {
  searchParams: Promise<{
    q?: string;
    sort?: string;
    order?: string;
    page?: string;
    size?: string;
  }>;
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;

  const { user, articles: allArticles } = await getDashboardData();
  if (!user) redirect("/login");

  const { articles: paginatedArticles = [], total } = await getArticles({
    query: params.q,
    sortBy: params.sort || "created_at",
    order: (params.order as "asc" | "desc") || "desc",
    page: params.page ? parseInt(params.page) : 1,
    pageSize: params.size ? parseInt(params.size) : 5,
  });

  const profile = await getProfiles(user.id);

  const responses = await getCommentsbyArticleIds(allArticles.map((a: any) => a.id));

  // Statistics Calculation
  const totalPublished =
    allArticles.filter((a: any) => a.status === "published").length;
  const totalViews = allArticles.reduce(
    (acc: number, curr: any) => acc + (curr.views || 0),
    0,
  );
  const totalLikes = allArticles.reduce(
    (acc: number, curr: any) => acc + (curr.likes || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300">
      {/* Refined Navigation */}
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 md:px-12">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
              <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center">
                V
              </div>
              VibeCMS
            </Link>
            <div className="hidden md:flex items-center gap-4 text-sm text-zinc-400">
              <span className="w-px h-4 bg-zinc-200 dark:bg-zinc-800" />
              <span>Writer Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/profile"
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-zinc-200 dark:border-zinc-800"
            >
              {profile?.avatar_url
                ? (
                  <img
                    src={profile.avatar_url}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                )
                : (
                  <span className="text-xs font-bold">
                    {profile?.full_name?.[0] || "U"}
                  </span>
                )}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-12 py-10">
        {/* Header Section - Modern Minimalist */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white">
              Your Stories
            </h1>
            <p className="text-zinc-500 font-medium">
              You have {totalPublished} published pieces and{" "}
              {totalViews.toLocaleString()} total views.
            </p>
          </div>

          <div className="flex gap-8 border-l border-zinc-100 dark:border-zinc-800 pl-8 hidden lg:flex">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
                Total Reach
              </p>
              <p className="text-xl font-bold">{totalViews.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
                Apresiasi
              </p>
              <p className="text-xl font-bold">{totalLikes.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* The 60:40 Split Layout */}
        <DashboardClient 
          initialArticles={paginatedArticles} 
          totalArticles={total} 
          profile={profile}
          initialResponses={responses || []}
        />
      </main>
    </div>
  );
}
