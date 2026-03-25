"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  Check,
  Clock,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  Lightbulb,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  PenLine,
  Sparkles,
  ThumbsUp,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { deleteArticle, upsertArticle } from "@/app/utils/actions/articles";
import { createClient } from "@/app/utils/supabase/client";

export default function DashboardClient({
  initialArticles = [],
  totalArticles = 0,
  profile = null,
  initialResponses = [],
}: {
  initialArticles: any[];
  totalArticles: number;
  profile: any;
  initialResponses?: any[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State untuk Analitik AI (CSR)
  const [aiInsights, setAiInsights] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // State Utama
  const [activeTab, setActiveTab] = useState<"articles" | "responses">(
    "articles",
  );
  const [editingArticle, setEditingArticle] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  // Local Data State
  const [articles, setArticles] = useState<any[]>(
    Array.isArray(initialArticles) ? initialArticles : [],
  );
  const [responses, setResponses] = useState<any[]>(
    Array.isArray(initialResponses) ? initialResponses : [],
  );

  const username = profile?.username || "unknown";

  // Sinkronisasi data saat props dari server berubah
  useEffect(() => {
    setArticles(Array.isArray(initialArticles) ? initialArticles : []);
  }, [initialArticles]);

  useEffect(() => {
    setResponses(Array.isArray(initialResponses) ? initialResponses : []);
  }, [initialResponses]);

  // Set Preview saat masuk mode edit
  useEffect(() => {
    if (editingArticle?.featured_image) {
      setPreviewUrl(editingArticle.featured_image);
    } else {
      setPreviewUrl("");
    }
    setImageFile(null);
  }, [editingArticle]);

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
            views: a.views || 0,
            likes: a.likes || 0,
            updated_at: a.updated_at || a.created_at,
          })),
          comments: initialResponses.map((c) => ({
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
  }, [initialArticles, initialResponses]);

  useEffect(() => {
    performAIAnalysis();
  }, [performAIAnalysis]);

  // Handler: Judul ke Slug otomatis
  const handleTitleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const title = e.target.value;
    const generatedSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");

    setEditingArticle((prev: any) => ({
      ...prev,
      title,
      // Hanya auto-update slug jika slug masih kosong atau manual belum diutak-atik secara masif
      slug: prev.id ? prev.slug : generatedSlug,
    }));
  };

  // Handler: Hapus Artikel
  const handleDelete = async (id: string) => {
    if (confirm("Hapus cerita ini secara permanen?")) {
      startTransition(async () => {
        await deleteArticle(id);
        router.refresh();
      });
    }
  };

  // Handler: Drag & Drop Gambar
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      setImageFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  }, []);

  // Handler: Paste Gambar dari Clipboard
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

  return (
    <div
      className="grid grid-cols-1 lg:grid-cols-12 gap-16"
      onPaste={handlePaste}
    >
      {/* KOLOM KIRI: CONTENT (60%) */}
      <div className="lg:col-span-7 space-y-8">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-900 pb-4">
          <div className="flex items-center gap-6 text-sm font-medium">
            <button
              onClick={() => setActiveTab("articles")}
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
                })}
              className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-black dark:hover:text-white transition-colors"
            >
              + Write Story
            </button>
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
                            {article.content?.replace(/<[^>]*>/g, "").substring(
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
                            onClick={() => handleDelete(article.id)}
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
                            alt=""
                          />
                        )}
                      </div>
                    </div>
                  ))
                )
            )
            : (
              responses.length === 0
                ? (
                  <div className="py-20 text-center space-y-3">
                    <MessageSquare className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
                    <p className="text-zinc-400 italic">
                      Belum ada tanggapan pada tulisan Anda.
                    </p>
                  </div>
                )
                : (
                  responses.map((response: any) => (
                    <div
                      key={response.id}
                      className="group pb-8 border-b border-zinc-50 dark:border-zinc-900/50 last:border-0"
                    >
                      <div className="flex items-center gap-3 mb-3">
                        <img
                          src={response.profiles?.avatar_url ||
                            "/default-avatar.png"}
                          className="w-6 h-6 rounded-full grayscale group-hover:grayscale-0 transition-all"
                          alt=""
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
                        "{response.content}"
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
                ? aiInsights.map((insight: any, idx: number) => (
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
                              (insight.views / (aiInsights[0]?.views || 1)) *
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
              ? recommendations.map((text, idx) => (
                <div
                  key={idx}
                  className="group p-5 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-2xl shadow-sm hover:shadow-lg transition-all border-l-4 border-l-amber-500"
                >
                  <div className="flex justify-between items-start gap-4">
                    <p className="text-xs font-serif leading-relaxed text-zinc-600 dark:text-zinc-300 italic">
                      {text}
                    </p>
                    <ArrowRight className="w-3 h-3 text-zinc-300 group-hover:text-amber-500 transition-colors" />
                  </div>
                </div>
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
                className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none cursor-pointer hover:text-blue-500 transition-colors"
              >
                <option value="draft">Draft</option>
                <option value="published">Publish</option>
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
                    startTransition(async () => {
                      await upsertArticle(fd);
                      setEditingArticle(null);
                      router.refresh();
                    });
                  }}
                  className="space-y-8"
                >
                  {editingArticle.id && (
                    <input type="hidden" name="id" value={editingArticle.id} />
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
                          <img
                            src={previewUrl}
                            className="w-full h-full object-cover"
                            alt="Cover"
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
                        setEditingArticle((prev: any) => ({
                          ...prev,
                          image_url: e.target.value,
                        }));
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
  );
}
