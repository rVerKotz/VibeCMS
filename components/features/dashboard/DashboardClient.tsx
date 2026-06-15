"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Lightbulb,
  Loader2,
  MessageSquare,
  PenLine,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Profile } from "../../../types/profile.ts";
import {
  AIInsight,
  AnalysisRequest,
  AnalysisResponse,
} from "../../../types/vibe-ai.ts";
import { Article } from "../../../types/article.ts";
import { Response } from "../../../types/comment.ts";

interface DashboardClientProps {
  initialArticles: Article[];
  allArticles?: Article[];
  profile: Profile | null;
  initialResponses?: Response[];
  deleteArticleAction: (id: string) => Promise<void>;
  upsertArticleAction: (formData: FormData) => Promise<void>;
}

/**
 * Interactive Client Component representing the complete writer dashboard view.
 * Handles story editing/creation, metrics tracking, smart recommendations, VibeAI insights,
 * and unified layout container wrappers.
 * * @param props - Component parameters including articles, comments, profiles, and server-bound actions.
 * @returns The rendered dashboard page.
 */
export default function DashboardClient({
  initialArticles = [],
  allArticles = [],
  profile = null,
  initialResponses = [],
  deleteArticleAction,
  upsertArticleAction,
}: DashboardClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const isProfileComplete = Boolean(profile?.full_name && profile?.username);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const showBanner = !isProfileComplete && !isBannerDismissed;

  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [activeTab, setActiveTab] = useState<"articles" | "responses">("articles");
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  const [responseSearchQuery, setResponseSearchQuery] = useState("");
  const [articleSearchQuery, setArticleSearchQuery] = useState("");

  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [responsesData, setResponsesData] = useState<Response[]>(initialResponses);

  useEffect(() => { setArticles(initialArticles); }, [initialArticles]);
  useEffect(() => { setResponsesData(initialResponses); }, [initialResponses]);

  const username = profile?.username || "unknown";

  useEffect(() => {
    if (editingArticle?.featured_image) {
      setPreviewUrl(editingArticle.featured_image);
    } else {
      setPreviewUrl("");
    }
    setImageFile(null);
  }, [editingArticle]);

  const articlesForStats = allArticles.length > 0 ? allArticles : articles;
  const totalPublished = articlesForStats.filter((a) => a.status === "published").length;
  const totalViews = articlesForStats.reduce((acc, curr) => acc + (curr.views || 0), 0);
  const totalLikes = articlesForStats.reduce((acc, curr) => acc + (curr.likes || 0), 0);

  const filteredResponses = useMemo(() => {
    if (!responseSearchQuery) return responsesData;
    const query = responseSearchQuery.toLowerCase();
    return responsesData.filter((res) =>
      res.content.toLowerCase().includes(query) ||
      res.article_title.toLowerCase().includes(query) ||
      res.commenter_name.toLowerCase().includes(query)
    );
  }, [responsesData, responseSearchQuery]);

  const filteredArticles = useMemo(() => {
    if (!articleSearchQuery) return articles;
    const query = articleSearchQuery.toLowerCase();
    return articles.filter((a) => a.title.toLowerCase().includes(query));
  }, [articles, articleSearchQuery]);

  const performAIAnalysis = useCallback(async () => {
    if (articles.length === 0) return;
    setIsAnalyzing(true);
    try {
      const payload: AnalysisRequest = {
        articles: articles.map((a) => ({
          id: String(a.id),
          title: a.title,
          content: a.content || "",
          views: a.views || 0,
          likes: a.likes || 0,
          updated_at: a.updated_at || a.created_at,
        })),
        comments: responsesData.map((c) => {
          const matchedArticleId = 
            c.article_id || 
            articles.find((a) => a.title === c.article_title)?.id || 
            "";

          return {
            id: String(c.id),
            content: c.content,
            article_id: String(matchedArticleId),
            updated_at: c.created_at,
          };
        }),
      };

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result: AnalysisResponse = await response.json();
        setAiInsights(result.insights || []);
        setRecommendations(result.recommendations || []);
      }
    } catch (error) {
      console.error("Gagal analisis AI:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [articles, responsesData]);

  useEffect(() => {
    performAIAnalysis();
  }, [performAIAnalysis]);

  const handleDelete = (id: string) => {
    if (!confirm("Hapus cerita ini secara permanen?")) return;
    startTransition(async () => {
      try {
        await deleteArticleAction(id);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleUpsert = (fd: FormData) => {
    if (imageFile) fd.set("image", imageFile);
    if (!isProfileComplete) fd.set("status", "draft");
    startTransition(async () => {
      try {
        await upsertArticleAction(fd);
        setEditingArticle(null);
      } catch (err) {
        console.error(err);
      }
    });
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const title = e.target.value;
    const generatedSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    setEditingArticle((prev) => ({
      ...(prev || {}),
      title,
      slug: prev?.id ? prev.slug : generatedSlug,
    } as Article));
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf("image") !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          setImageFile(file);
          setPreviewUrl(URL.createObjectURL(file));
        }
      }
    }
  }, []);

  const handleRecommendationClick = (text: string) => {
    const match = text.match(/'([^']+)'/);
    if (!match) return;

    if (text.startsWith("Reader Alert:")) {
      setResponseSearchQuery(match[1]);
      setActiveTab("responses");
      globalThis.window.scrollTo({ top: 0, behavior: "smooth" });
    } else if (text.startsWith("Trending:") || text.startsWith("Fresh:")) {
      setArticleSearchQuery(match[1]);
      setActiveTab("articles");
      globalThis.window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-zinc-950 transition-colors duration-300 animate-fade-in" onPaste={handlePaste}>
      <nav className="sticky top-0 z-50 border-b border-zinc-100 bg-white/80 px-4 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/80 md:px-12">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter text-black dark:text-white">
              <div className="w-8 h-8 bg-black text-white dark:bg-white dark:text-black rounded-lg flex items-center justify-center font-bold">
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
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt="Profile"
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              ) : (
                <span className="text-xs font-bold text-black dark:text-white">
                  {profile?.full_name?.[0] || "U"}
                </span>
              )}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 md:px-12 py-10">
        {showBanner && (
          <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl flex items-start md:items-center justify-between gap-4 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm font-medium">
                Anda belum melengkapi profil. Artikel Anda hanya dapat disimpan
                sebagai <span className="font-bold underline">Draft</span>.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/profile" className="text-sm font-bold text-yellow-900 dark:text-yellow-100 underline whitespace-nowrap">
                Isi Profil
              </Link>
              <button onClick={() => setIsBannerDismissed(true)} className="text-yellow-700 hover:text-yellow-900 dark:hover:text-yellow-400">
                <X size={16} />
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-black dark:text-white">
              Your Stories
            </h1>
            <p className="text-zinc-500 font-medium">
              You have {totalPublished} published pieces and {totalViews.toLocaleString()} total views.
            </p>
          </div>

          <div className="gap-8 border-l border-zinc-100 dark:border-zinc-800 pl-8 hidden lg:flex">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
                Total Reach
              </p>
              <p className="text-xl font-bold text-black dark:text-white">{totalViews.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-1">
                Apresiasi
              </p>
              <p className="text-xl font-bold text-black dark:text-white">{totalLikes.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
          <div className="lg:col-span-7 space-y-8">
            <div className="flex flex-col gap-6 border-b border-zinc-100 dark:border-zinc-900 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-6 text-sm font-medium">
                  <button
                    onClick={() => { setActiveTab("articles"); setResponseSearchQuery(""); }}
                    className={`pb-4 px-1 font-bold transition-all ${activeTab === "articles" ? "text-black dark:text-white border-b-2 border-black dark:border-white" : "text-zinc-400 hover:text-black dark:hover:text-white"}`}
                  >
                    Articles
                  </button>
                  <button
                    onClick={() => { setActiveTab("responses"); setArticleSearchQuery(""); }}
                    className={`pb-4 px-1 font-bold transition-all ${activeTab === "responses" ? "text-black dark:text-white border-b-2 border-black dark:border-white" : "text-zinc-400 hover:text-black dark:hover:text-white"}`}
                  >
                    Responses
                  </button>
                </div>
                {activeTab === "articles" && (
                  <button
                    onClick={() => setEditingArticle({ status: "draft", title: "", content: "", slug: "", created_at: new Date().toISOString() } as Article)}
                    className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                  >
                    + Write Story
                  </button>
                )}
              </div>

              <div className="relative group animate-in fade-in slide-in-from-left-2 duration-300">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black transition-colors" />
                {activeTab === "articles" ? (
                  <>
                    <input
                      type="text"
                      placeholder="Filter cerita berdasarkan judul..."
                      value={articleSearchQuery}
                      onChange={(e) => setArticleSearchQuery(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 pl-10 pr-10 py-2.5 rounded-xl text-xs outline-none border border-transparent focus:border-zinc-200 dark:focus:border-zinc-800 transition-all text-black dark:text-white"
                    />
                    {articleSearchQuery && (
                      <button onClick={() => setArticleSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-3.5 h-3.5 text-zinc-400 hover:text-black dark:hover:text-white" />
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Filter tanggapan berdasarkan konten atau topik..."
                      value={responseSearchQuery}
                      onChange={(e) => setResponseSearchQuery(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 pl-10 pr-10 py-2.5 rounded-xl text-xs outline-none border border-transparent focus:border-zinc-200 dark:focus:border-zinc-800 transition-all text-black dark:text-white"
                    />
                    {responseSearchQuery && (
                      <button onClick={() => setResponseSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                        <X className="w-3.5 h-3.5 text-zinc-400 hover:text-black dark:hover:text-white" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className={`space-y-10 transition-opacity ${isPending ? "opacity-50" : "opacity-100"}`}>
              {activeTab === "articles" ? (
                filteredArticles.length === 0 ? (
                  <p className="text-zinc-400 italic py-10 font-serif">
                    {articleSearchQuery ? `Tidak ada cerita yang cocok dengan "${articleSearchQuery}"` : "Belum ada cerita. Mulai menulis sekarang."}
                  </p>
                ) : (
                  filteredArticles.map((article) => (
                    <div key={article.id} className="group flex items-start justify-between gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                            {new Date(article.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </span>
                          {article.status === "draft" && (
                            <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">Draft</span>
                          )}
                        </div>
                        <Link href={`/${username}/${article.slug}`} className="block">
                          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-zinc-500 transition-colors line-clamp-2">{article.title}</h2>
                          <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 font-serif leading-relaxed">
                            {article.content?.replace(/<[^>]*>/g, "").substring(0, 120)}...
                          </p>
                        </Link>
                        <div className="flex items-center gap-6 mt-4 opacity-0 group-hover:opacity-100 transition-all">
                          <button onClick={() => setEditingArticle(article)} className="text-zinc-400 hover:text-blue-500 transition-colors"><PenLine size={14} /></button>
                          <button onClick={() => article.id && handleDelete(article.id.toString())} className="text-zinc-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded overflow-hidden">
                        {article.featured_image && <img src={article.featured_image} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" alt="Article" loading="lazy" />}
                      </div>
                    </div>
                  ))
                )
              ) : (
                filteredResponses.length === 0 ? (
                  <div className="py-20 text-center space-y-3">
                    <MessageSquare className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-400 italic">{responseSearchQuery ? `Tidak ada tanggapan yang cocok dengan "${responseSearchQuery}"` : "Belum ada tanggapan pada tulisan Anda."}</p>
                  </div>
                ) : (
                  filteredResponses.map((response) => (
                    <div key={response.id} className="group pb-8 border-b border-zinc-50 dark:border-zinc-900/50 last:border-0">
                      <div className="flex items-center gap-3 mb-3">
                        <img src={response.commenter_avatar ?? "/man.avif"} className="w-6 h-6 rounded-full grayscale group-hover:grayscale-0 transition-all" alt="Avatar" loading="lazy" />
                        <div className="text-xs">
                          <span className="font-bold text-zinc-900 dark:text-white">{response.commenter_name}</span>
                          <span className="text-zinc-400 mx-2">on</span>
                          <Link href={`/${username}/${response.article_slug}`} className="text-zinc-500 hover:text-black dark:hover:text-white underline decoration-zinc-200 underline-offset-4">{response.article_title}</Link>
                        </div>
                      </div>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 font-serif italic mb-2 line-clamp-3">&quot;{response.content}&quot;</p>
                      <div className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">{new Date(response.created_at).toLocaleDateString()}</div>
                    </div>
                  ))
                )
              )}
            </div>
          </div>

          <div className="lg:col-span-5 border-none lg:border-l border-zinc-100 dark:border-zinc-900 lg:pl-12 space-y-12">
            <section>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className={`w-4 h-4 ${isAnalyzing ? "animate-pulse text-indigo-500" : "text-indigo-400"}`} />
                  <h3 className="text-sm font-black uppercase tracking-widest text-black dark:text-white">VibeAI Insights</h3>
                </div>
                {isAnalyzing && <Loader2 className="w-3 h-3 animate-spin text-zinc-300" />}
              </div>
              <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-inner">
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">Real-time Impact</p>
                <div className="space-y-6">
                  {aiInsights.length > 0 ? aiInsights.map((insight, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold text-black dark:text-white">
                        <span className="truncate pr-4">{insight.name}</span>
                        <span className="text-zinc-400 font-mono">+{insight.views} pts</span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-black dark:bg-white transition-all duration-1000" style={{ width: `${Math.min(((insight.views || 0) / ((aiInsights[0]?.views as number) || 1)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  )) : <p className="text-xs text-zinc-400 italic font-serif">Data belum tersedia.</p>}
                </div>
              </div>
            </section>

            <section>
              <div className="flex items-center gap-2 mb-6">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black uppercase tracking-widest text-black dark:text-white">Smart Recommendation</h3>
              </div>
              <div className="space-y-4">
                {recommendations.map((text, idx) => (
                  <button key={idx} onClick={() => handleRecommendationClick(text)} className="w-full text-left group p-5 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-sm hover:shadow-lg transition-all border-l-4 border-l-amber-500 flex justify-between items-start gap-4">
                    <p className="text-xs font-serif leading-relaxed text-zinc-600 dark:text-zinc-300 italic">{text}</p>
                    <ArrowRight className="w-3.5 h-3.5 mt-1 shrink-0 text-zinc-300 group-hover:text-amber-500 transition-all" />
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      {editingArticle && (
        <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center gap-4">
              <button onClick={() => setEditingArticle(null)} className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors"><X size={20} /></button>
              <span className="text-xs text-zinc-400 border-l border-zinc-200 dark:border-zinc-800 pl-4 font-medium italic">Writing by {profile?.full_name}</span>
            </div>
            <div className="flex items-center gap-4">
              <select name="status" form="article-form" defaultValue={editingArticle.status || "draft"} disabled={!isProfileComplete} className={`bg-transparent w-fit text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer text-black dark:text-white ${!isProfileComplete ? "opacity-50" : ""}`}>
                <option value="draft" className="dark:bg-zinc-900">Draft</option>
                <option value="published" className="dark:bg-zinc-900" disabled={!isProfileComplete}>Publish {!isProfileComplete && "(Lengkapi Profil)"}</option>
              </select>
              <button onClick={() => (document.getElementById("article-form") as HTMLFormElement)?.requestSubmit()} disabled={isPending} className="bg-black dark:bg-white text-white dark:text-black px-8 py-2 rounded-full text-xs font-bold hover:opacity-80 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg">
                {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check size={14} />} Simpan
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
              <div className="lg:col-span-8 space-y-8">
                <form id="article-form" onSubmit={(e) => { e.preventDefault(); handleUpsert(new FormData(e.currentTarget)); }} className="space-y-8">
                  {editingArticle.id && <input type="hidden" name="id" value={editingArticle.id} />}
                  <input type="hidden" name="featured_image" value={editingArticle.featured_image || ""} />
                  <textarea name="title" value={editingArticle.title || ""} onChange={handleTitleChange} placeholder="Judul Cerita..." rows={1} className="w-full text-5xl font-bold bg-transparent border-none outline-none resize-none leading-tight text-black dark:text-white" />
                  <textarea name="content" defaultValue={editingArticle.content || ""} placeholder="Mulai menulis cerita Anda..." className="w-full text-xl font-serif bg-transparent border-none outline-none resize-none min-h-[600px] leading-relaxed text-black dark:text-white" />
                </form>
              </div>

              <div className="lg:col-span-4 space-y-10 border-l border-zinc-100 dark:border-zinc-900 lg:pl-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">Gambar Sampul</label>
                  <div onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} onDragLeave={() => setIsDragging(false)} onDrop={handleDrop} className={`relative aspect-video bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all ${isDragging ? "border-black dark:border-white" : "border-zinc-200 dark:border-zinc-800"}`}>
                    {previewUrl ? (
                      <>
                        <img src={previewUrl} className="w-full h-full object-cover" alt="Cover" loading="lazy" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                          <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full text-[10px] font-bold uppercase">Ganti</label>
                        </div>
                      </>
                    ) : (
                      <div className="text-center p-4">
                        <Upload className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
                        <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Drag or Paste Image</p>
                      </div>
                    )}
                    <input type="file" name="image" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const file = e.target.files?.[0]; if (file) { setImageFile(file); setPreviewUrl(URL.createObjectURL(file)); } }} />
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase text-zinc-400">URL Slug (Custom)</label>
                  <input name="slug" form="article-form" value={editingArticle.slug || ""} onChange={(e) => setEditingArticle({ ...(editingArticle as Article), slug: e.target.value })} placeholder="nama-slug-cerita" className="w-full bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl text-xs font-mono outline-none shadow-inner text-black dark:text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}