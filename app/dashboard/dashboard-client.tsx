"use client";

import { useCallback, useEffect, useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import {
  AlertCircle,
  ArrowRight,
  Check,
  Lightbulb,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  PenLine,
  Sparkles,
  Trash2,
  Upload,
  X,
  Search,
} from "lucide-react";
import Link from "next/link";
import { deleteArticle, upsertArticle } from "@/app/utils/actions/articles";

interface Profile {
  full_name?: string;
  username?: string;
  avatar_url?: string;
}

interface Article {
  id?: string | number;
  title: string;
  slug: string;
  content?: string;
  featured_image?: string;
  status?: string;
  views?: number;
  likes?: number;
  created_at: string;
  updated_at?: string;
  image_url?: string;
}

interface Response {
  id: string | number;
  content: string;
  created_at: string;
  profiles?: Profile;
  articles?: { slug: string; title: string };
  article_id?: string | number;
}

interface AIInsight {
  name?: string;
  views?: number;
  [key: string]: unknown;
}

export default function DashboardClient({
  initialArticles = [],
  profile = null,
  initialResponses = [],
}: {
  initialArticles: Article[];
  profile: Profile | null;
  initialResponses?: Response[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // --- LOGIKA VALIDASI PROFIL ---
  const isProfileComplete = Boolean(profile?.full_name && profile?.username);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const showBanner = !isProfileComplete && !isBannerDismissed;

  // State untuk Analitik AI (CSR)
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State Utama
  const [activeTab, setActiveTab] = useState<"articles" | "responses">(
    "articles",
  );
  const [editingArticle, setEditingArticle] = useState<Article | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  
  // State untuk Filter Tanggapan
  const [responseSearchQuery, setResponseSearchQuery] = useState("");

  // Local Data State
  const [articles, setArticles] = useState<Article[]>(
    Array.isArray(initialArticles) ? initialArticles : [],
  );
  const [initialResponsesData, setInitialResponsesData] = useState<Response[]>(
    Array.isArray(initialResponses) ? initialResponses : [],
  );

  const username = profile?.username || "unknown";

  useEffect(() => {
    setArticles(Array.isArray(initialArticles) ? initialArticles : []);
  }, [initialArticles]);

  useEffect(() => {
    setInitialResponsesData(Array.isArray(initialResponses) ? initialResponses : []);
  }, [initialResponses]);

  useEffect(() => {
    if (editingArticle?.featured_image) {
      setPreviewUrl(editingArticle.featured_image);
    } else {
      setPreviewUrl("");
    }
    setImageFile(null);
  }, [editingArticle]);

  // Logika Filter Responses
  const filteredResponses = useMemo(() => {
    if (!responseSearchQuery) return initialResponsesData;
    const query = responseSearchQuery.toLowerCase();
    return initialResponsesData.filter(res => 
      res.content.toLowerCase().includes(query) || 
      res.articles?.title.toLowerCase().includes(query) ||
      res.profiles?.full_name?.toLowerCase().includes(query)
    );
  }, [initialResponsesData, responseSearchQuery]);

  const performAIAnalysis = useCallback(async () => {
    if (initialArticles.length === 0) return;

    setIsAnalyzing(true);
    try {
      const API_URL = window.location.hostname === "localhost"
        ? "http://localhost:10000/analyze"
        : "https://sentiment-analysis-vibe-cms.vercel.app/analyze";

      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articles: initialArticles.map((a) => ({
            id: String(a.id),
            title: a.title,
            content: a.content || "",
            views: a.views || 0,
            likes: a.likes || 0,
            updated_at: a.updated_at || a.created_at,
          })),
          comments: initialResponsesData.map((c) => ({
            id: String(c.id),
            content: c.content,
            article_id: String(c.article_id),
            updated_at: c.created_at,
          })),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAiInsights(result.insights || []);
        setRecommendations(result.recommendations || []);
      }
    } catch (error) {
      console.error("Gagal menjalankan analisis AI di sisi klien:", error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [initialArticles, initialResponsesData]);

  useEffect(() => {
    performAIAnalysis();
  }, [performAIAnalysis]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const title = e.target.value;
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setEditingArticle((prev) => ({
      ...(prev || {}),
      title,
      slug: prev?.id ? prev.slug : generatedSlug,
    } as Article));
  };

  const handleDelete = async (id: string) => {
    if (confirm("Hapus cerita ini secara permanen?")) {
      startTransition(async () => {
        await deleteArticle(id);
        router.refresh();
      });
    }
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

  // Handler untuk klik rekomendasi
  const handleRecommendationClick = (text: string) => {
    if (text.startsWith("Reader Alert:")) {
      // Ekstrak topik dari "Reader Alert: Banyak kendala dilaporkan pada 'Topic'..."
      const match = text.match(/'([^']+)'/);
      if (match) {
        setResponseSearchQuery(match[1]);
        setActiveTab("responses");
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        setActiveTab("responses");
      }
    } else if (text.includes("Artikel '")) {
      // Ekstrak judul artikel untuk navigasi (opsional)
      const match = text.match(/'([^']+)'/);
      if (match) {
        const article = articles.find(a => a.title === match[1]);
        if (article) router.push(`/${username}/${article.slug}`);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* BANNER PERINGATAN PROFIL BELUM LENGKAP */}
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
            <Link
              href="/profile"
              className="text-sm font-bold text-yellow-900 dark:text-yellow-100 underline whitespace-nowrap"
            >
              Isi Profil
            </Link>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="text-yellow-700 hover:text-yellow-900 dark:hover:text-yellow-400"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      <div
        className="grid grid-cols-1 lg:grid-cols-12 gap-16"
        onPaste={handlePaste}
      >
        {/* KOLOM KIRI: CONTENT (60%) */}
        <div className="lg:col-span-7 space-y-8">
          <div className="flex flex-col gap-6 border-b border-zinc-100 dark:border-zinc-900 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6 text-sm font-medium">
                <button
                  onClick={() => {
                    setActiveTab("articles");
                    setResponseSearchQuery("");
                  }}
                  className={`pb-4 px-1 font-bold transition-all ${
                    activeTab === "articles"
                      ? "text-black dark:text-white border-b-2 border-black dark:border-white"
                      : "text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Articles
                </button>
                <button
                  onClick={() => setActiveTab("responses")}
                  className={`pb-4 px-1 font-bold transition-all ${
                    activeTab === "responses"
                      ? "text-black dark:text-white border-b-2 border-black dark:border-white"
                      : "text-zinc-400 hover:text-black dark:hover:text-white"
                  }`}
                >
                  Responses
                </button>
              </div>
              {activeTab === "articles" && (
                <button
                  onClick={() =>
                    setEditingArticle({
                      status: "draft",
                      title: "",
                      content: "",
                      slug: "",
                      created_at: new Date().toISOString(),
                    })}
                  className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  + Write Story
                </button>
              )}
            </div>

            {/* Filter Input for Responses */}
            {activeTab === "responses" && (
              <div className="relative group animate-in fade-in slide-in-from-left-2 duration-300">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-black transition-colors" />
                <input 
                  type="text"
                  placeholder="Filter tanggapan berdasarkan konten atau topik..."
                  value={responseSearchQuery}
                  onChange={(e) => setResponseSearchQuery(e.target.value)}
                  className="w-full bg-zinc-50 dark:bg-zinc-900 pl-10 pr-10 py-2.5 rounded-xl text-xs outline-none border border-transparent focus:border-zinc-200 dark:focus:border-zinc-800 transition-all"
                />
                {responseSearchQuery && (
                  <button 
                    onClick={() => setResponseSearchQuery("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="w-3.5 h-3.5 text-zinc-400 hover:text-black" />
                  </button>
                )}
              </div>
            )}
          </div>

          <div
            className={`space-y-10 transition-opacity ${
              isPending ? "opacity-50" : "opacity-100"
            }`}
          >
            {activeTab === "articles"
              ? (
                articles.length === 0
                  ? (
                    <p className="text-zinc-400 italic py-10 font-serif">
                      Belum ada cerita. Mulai menulis sekarang.
                    </p>
                  )
                  : (
                    articles.map((article) => (
                      <div
                        key={article.id}
                        className="group flex items-start justify-between gap-6"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">
                              {new Date(article.created_at).toLocaleDateString(
                                "en-US",
                                { month: "short", day: "numeric" },
                              )}
                            </span>
                            {article.status === "draft" && (
                              <span className="bg-zinc-100 dark:bg-zinc-900 px-2 py-0.5 rounded text-[9px] font-bold text-zinc-500 uppercase tracking-tighter">
                                Draft
                              </span>
                            )}
                          </div>
                          <Link href={`/${username}/${article.slug}`}>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 leading-snug group-hover:text-zinc-500 transition-colors line-clamp-2">
                              {article.title}
                            </h2>
                            <p className="mt-2 text-zinc-500 dark:text-zinc-400 text-sm line-clamp-2 font-serif leading-relaxed">
                              {article.content?.replace(/<[^>]*>/g, "")
                                .substring(
                                  0,
                                  120,
                                )}...
                            </p>
                          </Link>
                          <div className="flex items-center gap-6 mt-4 opacity-0 group-hover:opacity-100 transition-all">
                            <button
                              onClick={() => setEditingArticle(article)}
                              className="text-zinc-400 hover:text-blue-500 transition-colors"
                            >
                              <PenLine size={14} />
                            </button>
                            <button
                              onClick={() => article.id && handleDelete(article.id.toString())}
                              className="text-zinc-400 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="w-24 h-24 md:w-32 md:h-32 shrink-0 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded overflow-hidden">
                          {article.featured_image && (
                            <img
                              src={article.featured_image}
                              className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                              alt="Article"
                              loading="lazy"
                            />
                          )}
                        </div>
                      </div>
                    ))
                  )
              )
              : (
                filteredResponses.length === 0
                  ? (
                    <div className="py-20 text-center space-y-3">
                      <MessageSquare className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                      <p className="text-zinc-400 italic">
                        {responseSearchQuery ? `Tidak ada tanggapan yang cocok dengan "${responseSearchQuery}"` : "Belum ada tanggapan pada tulisan Anda."}
                      </p>
                      {responseSearchQuery && (
                        <button 
                          onClick={() => setResponseSearchQuery("")}
                          className="text-xs font-bold text-blue-500 hover:underline"
                        >
                          Hapus Filter
                        </button>
                      )}
                    </div>
                  )
                  : (
                    filteredResponses.map((response: Response) => (
                      <div
                        key={response.id}
                        className="group pb-8 border-b border-zinc-50 dark:border-zinc-900/50 last:border-0"
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <img
                            src={response.profiles?.avatar_url ||
                              "/default-avatar.png"}
                            className="w-6 h-6 rounded-full grayscale group-hover:grayscale-0 transition-all"
                            alt="Avatar"
                            width={24}
                            height={24}
                            loading="lazy"
                          />
                          <div className="text-xs">
                            <span className="font-bold text-zinc-900 dark:text-white">
                              {response.profiles?.full_name}
                            </span>
                            <span className="text-zinc-400 mx-2">on</span>
                            <Link
                              href={`/${username}/${response.articles?.slug}`}
                              className="text-zinc-500 hover:text-black dark:hover:text-white underline decoration-zinc-200 underline-offset-4"
                            >
                              {response.articles?.title}
                            </Link>
                          </div>
                        </div>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 font-serif italic mb-2 line-clamp-3">
                          &quot;{response.content}&quot;
                        </p>
                        <div className="text-[10px] text-zinc-300 font-bold uppercase tracking-widest">
                          {new Date(response.created_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric", year: "numeric" },
                          )}
                        </div>
                      </div>
                    ))
                  )
              )}
          </div>
        </div>

        {/* KOLOM KANAN: INSIGHTS & AI (40%) */}
        <div className="lg:col-span-5 border-none lg:border-l border-zinc-100 dark:border-zinc-900 lg:pl-12 space-y-12">
          <section>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles
                  className={`w-4 h-4 ${
                    isAnalyzing
                      ? "animate-pulse text-indigo-500"
                      : "text-indigo-400"
                  }`}
                />
                <h3 className="text-sm font-black uppercase tracking-widest">
                  VibeAI Semantic Insights
                </h3>
              </div>
              {isAnalyzing && (
                <Loader2 className="w-3 h-3 animate-spin text-zinc-300" />
              )}
            </div>

            <div className="p-8 bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] border border-zinc-100 dark:border-zinc-800 shadow-inner">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-6">
                Poin Dampak Real-time
              </p>
              <div className="space-y-6">
                {aiInsights.length > 0
                  ? aiInsights.map((insight: AIInsight, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex justify-between text-xs font-bold">
                        <span className="truncate pr-4">{insight.name}</span>
                        <span className="text-zinc-400 font-mono">
                          +{insight.views} pts
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black dark:bg-white transition-all duration-1000"
                          style={{
                            width: `${
                              Math.min(
                                ((insight.views || 0) / ((aiInsights[0]?.views as number) || 1)) *
                                  100,
                                100,
                              )
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ))
                  : (
                    <p className="text-xs text-zinc-400 italic font-serif">
                      {isAnalyzing
                        ? "AI sedang membaca narasi Anda..."
                        : "Data belum cukup untuk dianalisis secara semantik."}
                    </p>
                  )}
              </div>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black uppercase tracking-widest">
                Smart Recommendation
              </h3>
            </div>
            <div className="space-y-4">
              {recommendations.length > 0
                ? recommendations.map((text: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => handleRecommendationClick(text)}
                    className="w-full text-left group p-5 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-sm hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all border-l-4 border-l-amber-500 flex justify-between items-start gap-4"
                  >
                    <p className="text-xs font-serif leading-relaxed text-zinc-600 dark:text-zinc-300 italic">
                      {text}
                    </p>
                    <ArrowRight className="w-3.5 h-3.5 mt-1 shrink-0 text-zinc-300 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))
                : (
                  <p className="text-xs text-zinc-400 italic font-serif">
                    Tulis lebih banyak cerita untuk mendapatkan saran dari AI.
                  </p>
                )}
            </div>
          </section>
        </div>

        {/* ZEN EDITOR MODAL */}
        {editingArticle && (
          <div className="fixed inset-0 z-[100] bg-white dark:bg-zinc-950 flex flex-col animate-in fade-in duration-300">
            <div className="flex justify-between items-center px-6 py-4 border-b border-zinc-100 dark:border-zinc-900">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditingArticle(null)}
                  className="text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
                <span className="text-xs text-zinc-400 border-l border-zinc-200 dark:border-zinc-800 pl-4 font-medium italic">
                  Writing in Vibe by {profile?.full_name}
                </span>
              </div>
              <div className="flex items-center gap-4">
                <select
                  name="status"
                  form="article-form"
                  defaultValue={editingArticle.status || "draft"}
                  disabled={!isProfileComplete}
                  className={`bg-transparent w-fit text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:text-blue-500 transition-colors ${
                    !isProfileComplete ? "opacity-50" : ""
                  }`}
                >
                  <option value="draft">Draft</option>
                  <option value="published" disabled={!isProfileComplete}>
                    Publish {!isProfileComplete && "(Lengkapi Profil)"}
                  </option>
                </select>
                <button
                  onClick={() =>
                    (document.getElementById("article-form") as HTMLFormElement)
                      ?.requestSubmit()}
                  disabled={isPending}
                  className="bg-black dark:bg-white text-white dark:text-black px-8 py-2 rounded-full text-xs font-bold hover:opacity-80 disabled:opacity-50 transition-all flex items-center gap-2 shadow-lg"
                >
                  {isPending
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Check size={14} />}
                  Simpan
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-8">
                  <form
                    id="article-form"
                    action={async (fd) => {
                      if (imageFile) fd.set("image", imageFile);
                      // Force status to draft if profile not complete
                      if (!isProfileComplete) fd.set("status", "draft");

                      startTransition(async () => {
                        await upsertArticle(fd);
                        setEditingArticle(null);
                        router.refresh();
                      });
                    }}
                    className="space-y-8"
                  >
                    {editingArticle.id && (
                      <input
                        type="hidden"
                        name="id"
                        value={editingArticle.id}
                      />
                    )}
                    <input
                      type="hidden"
                      name="featured_image"
                      value={editingArticle.featured_image || ""}
                    />

                    <textarea
                      name="title"
                      value={editingArticle.title || ""}
                      onChange={handleTitleChange}
                      placeholder="Judul Cerita..."
                      rows={1}
                      className="w-full text-5xl font-bold bg-transparent border-none outline-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800 resize-none h-auto overflow-hidden leading-tight"
                    />

                    <textarea
                      name="content"
                      defaultValue={editingArticle.content || ""}
                      placeholder="Mulai menulis cerita Anda..."
                      className="w-full text-xl font-serif bg-transparent border-none outline-none resize-none placeholder:text-zinc-200 dark:placeholder:text-zinc-800 min-h-[600px] leading-relaxed"
                    />
                  </form>
                </div>

                <div className="lg:col-span-4 space-y-10 border-l border-zinc-100 dark:border-zinc-900 lg:pl-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                      Gambar Sampul
                    </label>
                    <div
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragging(true);
                      }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      className={`relative aspect-video bg-zinc-50 dark:bg-zinc-900 border-2 border-dashed rounded-xl overflow-hidden flex flex-col items-center justify-center transition-all ${
                        isDragging
                          ? "border-black dark:border-white"
                          : "border-zinc-200 dark:border-zinc-800"
                      }`}
                    >
                      {previewUrl
                        ? (
                          <>
                            <Image
                              src={previewUrl}
                              className="w-full h-full object-cover"
                              alt="Cover"
                              fill
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                              <label className="cursor-pointer bg-white text-black px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                Ganti
                              </label>
                            </div>
                          </>
                        )
                        : (
                          <div className="text-center p-4">
                            <Upload className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">
                              Drag or Paste Image
                            </p>
                          </div>
                        )}
                      <input
                        type="file"
                        name="image"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImageFile(file);
                            setPreviewUrl(URL.createObjectURL(file));
                          }
                        }}
                      />
                    </div>

                    <div className="relative group">
                      <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400" />
                      <input
                        name="image_url"
                        form="article-form"
                        value={editingArticle.image_url || ""}
                        placeholder="Atau tempel link gambar..."
                        className="w-full bg-zinc-50 dark:bg-zinc-900 pl-10 pr-3 py-2 rounded-xl text-[11px] outline-none border border-transparent focus:border-zinc-200 dark:focus:border-zinc-700 transition-all shadow-inner"
                        onChange={(e) => {
                          setPreviewUrl(e.target.value);
                          setEditingArticle((prev) => ({
                            ...(prev || {}),
                            image_url: e.target.value,
                          } as Article));
                          setImageFile(null);
                        }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                      URL Slug (Custom)
                    </label>
                    <div className="space-y-2">
                      <input
                        name="slug"
                        form="article-form"
                        value={editingArticle.slug || ""}
                        onChange={(e) =>
                          setEditingArticle({
                            ...editingArticle,
                            slug: e.target.value,
                          })}
                        placeholder="nama-slug-cerita"
                        className="w-full bg-zinc-50 dark:bg-zinc-900 p-4 rounded-xl text-xs font-mono outline-none border border-transparent focus:border-zinc-300 dark:focus:border-zinc-700 transition-all shadow-inner"
                      />
                      <p className="text-[9px] text-zinc-400 italic font-medium px-1">
                        Preview: vibe.com/{username}/{editingArticle.slug ||
                          "..."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}