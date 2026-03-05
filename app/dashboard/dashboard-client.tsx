"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  Eye,
  Image as ImageIcon,
  LayoutGrid,
  List as ListIcon,
  PenLine,
  Search,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { deleteArticle, upsertArticle } from "@/app/utils/actions/articles";

export default function DashboardClient({
  initialArticles = [],
  totalArticles = 0,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // State Utama
  const [view, setView] = useState("card"); // "card" atau "table"
  const [editingArticle, setEditingArticle] = useState(null);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [previewUrl, setPreviewUrl] = useState("");

  // Parameter Navigasi
  const currentPage = Number(searchParams.get("page")) || 1;
  const pageSize = Number(searchParams.get("size")) || 5;
  const sortBy = searchParams.get("sort") || "created_at";
  const totalPages = Math.ceil(totalArticles / pageSize);

  // Fungsi sinkronisasi URL
  const updateParams = (updates) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.keys(updates).forEach((key) => {
      if (updates[key]) params.set(key, String(updates[key]));
      else params.delete(key);
    });
    startTransition(() => {
      router.push(`?${params.toString()}`);
    });
  };

  // Debounced Search
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchQuery !== (searchParams.get("q") || "")) {
        updateParams({ q: searchQuery, page: 1 });
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  // Update image preview saat edit
  useEffect(() => {
    if (editingArticle) {
      setPreviewUrl(
        editingArticle.image_url || editingArticle.featured_image || "",
      );
    } else {
      setPreviewUrl("");
    }
  }, [editingArticle]);

  const handleDelete = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus cerita ini?")) {
      startTransition(async () => {
        await deleteArticle(id);
        router.refresh();
      });
    }
  };

  const formAction = async (formData) => {
    startTransition(async () => {
      await upsertArticle(formData);
      setEditingArticle(null);
      router.refresh();
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Baru saja";
    const date = new Date(dateString);
    return date.toLocaleDateString("id-ID", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
      {/* HEADER & KONTROL */}
      <div className="flex flex-col space-y-8 mb-10 border-b border-gray-100 dark:border-zinc-800 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-serif font-bold text-black dark:text-white tracking-tight">
              Dashboard Cerita
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Kelola {totalArticles} publikasi Anda dengan mudah.
            </p>
          </div>

          <button
            onClick={() => setEditingArticle({})}
            className="bg-black text-white dark:bg-white dark:text-black px-6 py-2.5 rounded-full text-sm font-medium hover:opacity-90 transition-all shadow-sm flex items-center gap-2 w-full md:w-auto justify-center"
          >
            <PenLine size={16} /> Tulis Cerita
          </button>
        </div>

        {/* Filter Bar: Stacks vertically on mobile, horizontal on desktop */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center w-full">
          {/* Search Bar Wrapper */}
          <div className="relative w-full md:w-72">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Cari cerita..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-zinc-800/50 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 rounded-full text-sm focus:bg-white dark:focus:bg-zinc-900 focus:border-black dark:focus:border-white focus:ring-0 transition-all outline-none"
            />
          </div>

          {/* Controls Wrapper (Select & Toggle) - SIDE BY SIDE ON MOBILE */}
          <div className="flex flex-row items-center justify-between gap-3 w-full md:w-auto">
            {/* Select Dropdown */}
            <select
              value={sortBy}
              onChange={(e) =>
                updateParams({ sort: e.target.value, page: 1 })}
              className="text-xs sm:text-sm bg-transparent border border-gray-200 dark:border-zinc-800 rounded-full pl-4 pr-10 py-2.5 font-medium text-black dark:text-white dark:bg-zinc-950/50 cursor-pointer focus:ring-0 outline-none flex-1 md:flex-none max-w-[180px] sm:max-w-none truncate"
            >
              <option value="created_at">Urutkan: Terbaru</option>
              <option value="views">Urutkan: Terpopuler</option>
              <option value="likes">Urutkan: Paling Disukai</option>
            </select>

            {/* Toggle Tampilan Buttons */}
            <div className="flex items-center bg-gray-100 dark:bg-zinc-800 p-1 rounded-full shrink-0">
              <button
                onClick={() => setView("card")}
                className={`p-2 rounded-full transition-all ${
                  view === "card"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Tampilan Kartu"
              >
                <LayoutGrid size={18} />
              </button>
              <button
                onClick={() => setView("table")}
                className={`p-2 rounded-full transition-all ${
                  view === "table"
                    ? "bg-white dark:bg-zinc-700 shadow-sm text-black dark:text-white"
                    : "text-gray-400 hover:text-gray-600"
                }`}
                title="Tampilan Tabel"
              >
                <ListIcon size={18} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AREA KONTEN */}
      <div
        className={`transition-opacity duration-200 ${
          isPending ? "opacity-50" : "opacity-100"
        }`}
      >
        {initialArticles.length === 0
          ? (
            <div className="py-24 text-center">
              <p className="text-gray-400 dark:text-gray-500 text-lg font-serif italic">
                Tidak ada cerita yang ditemukan.
              </p>
            </div>
          )
          : (
            <>
              {view === "card"
                ? (
                  /* TAMPILAN KARTU */
                  <div className="space-y-12">
                    {initialArticles.map((article) => (
                      <div
                        key={article.id}
                        className="group flex flex-col-reverse md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-gray-100 dark:border-zinc-800 last:border-0 last:pb-0"
                      >
                        <div className="flex-1 space-y-4">
                          <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Clock size={14} />
                              {formatDate(article.created_at)}
                            </span>
                            <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-zinc-600">
                            </span>
                            <span
                              className={`px-2 py-0.5 font-bold uppercase tracking-tighter rounded ${
                                article.status === "published"
                                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400"
                                  : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400"
                              }`}
                            >
                              {article.status === "published"
                                ? "Diterbitkan"
                                : "Draf"}
                            </span>
                          </div>

                          <Link
                            href={`/articles/${article.id}`}
                            className="block group"
                          >
                            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 leading-tight mb-2">
                              {article.title}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg line-clamp-2 leading-relaxed font-serif">
                              {article.content?.substring(0, 180) ||
                                "Belum ada konten tulisan..."}
                            </p>
                          </Link>

                          <div className="flex items-center justify-between pt-2">
                            <div className="flex items-center gap-4 text-xs font-semibold text-gray-400 uppercase tracking-widest">
                              <span className="flex items-center gap-1.5">
                                <Eye size={14} /> {article.views || 0}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <ThumbsUp size={14} /> {article.likes || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => setEditingArticle(article)}
                                className="p-2.5 text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                              >
                                <PenLine size={18} />
                              </button>
                              <button
                                onClick={() => handleDelete(article.id)}
                                className="p-2.5 text-gray-400 hover:text-red-600 transition-colors rounded-full hover:bg-red-50 dark:hover:bg-red-900/10"
                              >
                                <Trash2 size={18} />
                              </button>
                              <Link
                                href={`/articles/${article.id}`}
                                className="p-2.5 text-gray-400 hover:text-black dark:hover:text-white transition-colors rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800"
                              >
                                <ExternalLink size={18} />
                              </Link>
                            </div>
                          </div>
                        </div>

                        <div className="w-full md:w-56 h-56 md:h-36 shrink-0">
                          {article.featured_image || article.image_url
                            ? (
                              <img
                                src={article.featured_image ||
                                  article.image_url}
                                alt={article.title}
                                className="w-full h-full object-cover rounded-2xl bg-gray-50 border border-gray-100 dark:border-zinc-800 shadow-sm transition-transform group-hover:scale-[1.02]"
                              />
                            )
                            : (
                              <div className="w-full h-full bg-gray-50 dark:bg-zinc-800/50 border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-300 dark:text-zinc-600 rounded-2xl">
                                <ImageIcon size={32} />
                              </div>
                            )}
                        </div>
                      </div>
                    ))}
                  </div>
                )
                : (
                  /* TAMPILAN TABEL */
                  <div className="border border-gray-200 dark:border-zinc-800 rounded-2xl overflow-x-auto bg-white dark:bg-zinc-900 shadow-sm">
                    <table className="w-full text-sm text-left border-collapse min-w-[600px]">
                      <thead>
                        <tr className="bg-gray-50 dark:bg-zinc-950 border-b border-gray-200 dark:border-zinc-800 text-xs font-bold text-gray-400 uppercase tracking-widest">
                          <th className="px-6 py-4">Judul Artikel</th>
                          <th className="px-6 py-4 w-32">Status</th>
                          <th className="px-6 py-4 text-center w-24">
                            Statistik
                          </th>
                          <th className="px-6 py-4 text-right w-40">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-zinc-800">
                        {initialArticles.map((article) => (
                          <tr
                            key={article.id}
                            className="hover:bg-gray-50/50 dark:hover:bg-zinc-800/30 transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-gray-100 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700">
                                  <img
                                    src={article.featured_image ||
                                      article.image_url ||
                                      "https://placehold.co/100x100?text=No+Img"}
                                    alt=""
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.target.style.opacity = 0;
                                    }}
                                  />
                                </div>
                                <div className="min-w-0">
                                  <span className="font-bold text-gray-900 dark:text-zinc-100 block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                    {article.title}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    {formatDate(article.created_at)}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  article.status === "published"
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                    : "bg-zinc-50 text-zinc-500 border-zinc-100 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                                }`}
                              >
                                {article.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col items-center gap-1 text-[10px] font-bold text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Eye size={12} /> {article.views || 0}
                                </span>
                                <span className="flex items-center gap-1">
                                  <ThumbsUp size={12} /> {article.likes || 0}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => setEditingArticle(article)}
                                  className="p-2 text-gray-400 hover:text-black dark:hover:text-white"
                                  title="Edit"
                                >
                                  <PenLine size={16} />
                                </button>
                                <button
                                  onClick={() => handleDelete(article.id)}
                                  className="p-2 text-gray-400 hover:text-red-600"
                                  title="Hapus"
                                >
                                  <Trash2 size={16} />
                                </button>
                                <Link
                                  href={`/articles/${article.id}`}
                                  className="p-2 text-gray-400 hover:text-blue-500"
                                  title="Lihat"
                                >
                                  <ExternalLink size={16} />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </>
          )}
      </div>

      {/* PAGINASI */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between border-t border-gray-100 dark:border-zinc-800 pt-8 mt-12 gap-4">
          <button
            disabled={currentPage <= 1 || isPending}
            onClick={() => updateParams({ page: currentPage - 1 })}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 w-full sm:w-auto justify-center"
          >
            <ChevronLeft size={16} /> Sebelumnya
          </button>

          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-2 sm:pb-0">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
              const isCurrent = currentPage === p;
              if (
                totalPages > 7 && Math.abs(p - currentPage) > 1 && p !== 1 &&
                p !== totalPages
              ) return null;
              return (
                <button
                  key={p}
                  onClick={() => updateParams({ page: p })}
                  className={`w-10 h-10 shrink-0 rounded-full text-xs font-bold transition-all border ${
                    isCurrent
                      ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white shadow-lg"
                      : "text-gray-400 hover:text-black dark:hover:text-white border-transparent hover:border-gray-200 dark:hover:border-zinc-700"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            disabled={currentPage >= totalPages || isPending}
            onClick={() => updateParams({ page: currentPage + 1 })}
            className="flex items-center gap-2 px-6 py-2 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white disabled:opacity-30 transition-all rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 border border-transparent hover:border-gray-200 dark:hover:border-zinc-700 w-full sm:w-auto justify-center"
          >
            Selanjutnya <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* MODAL EDITOR */}
      {editingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-4xl rounded-3xl shadow-2xl p-6 sm:p-10 relative my-auto border border-gray-100 dark:border-zinc-800">
            <button
              onClick={() => setEditingArticle(null)}
              className="absolute top-6 right-6 p-2.5 text-gray-400 hover:text-black dark:hover:text-white transition-all bg-gray-50 dark:bg-zinc-900 rounded-full"
            >
              <X size={20} />
            </button>

            <div className="flex items-center gap-3 mb-10">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white dark:bg-white dark:text-black">
                <PenLine size={20} />
              </div>
              <h2 className="text-2xl font-serif font-bold text-black dark:text-white tracking-tight">
                {editingArticle.id ? "Edit Tulisan" : "Mulai Menulis"}
              </h2>
            </div>

            <form action={formAction} className="space-y-8">
              {editingArticle.id && (
                <input type="hidden" name="id" value={editingArticle.id} />
              )}

              <div className="space-y-6">
                <input
                  type="text"
                  name="title"
                  defaultValue={editingArticle.title || ""}
                  placeholder="Judul Cerita Anda..."
                  className="w-full text-4xl font-serif font-bold bg-transparent border-0 border-b border-transparent hover:border-gray-100 dark:hover:border-zinc-800 focus:border-gray-200 dark:focus:border-zinc-700 pb-2 outline-none focus:ring-0 transition-all placeholder-gray-200 dark:placeholder-zinc-800 text-black dark:text-white"
                  required
                />
                <textarea
                  name="content"
                  defaultValue={editingArticle.content || ""}
                  placeholder="Ceritakan kisah Anda di sini..."
                  rows={12}
                  className="w-full text-xl font-serif bg-transparent border-0 border-b border-transparent hover:border-gray-100 dark:hover:border-zinc-800 focus:border-gray-200 dark:focus:border-zinc-700 pb-2 outline-none focus:ring-0 transition-all placeholder-gray-200 dark:placeholder-zinc-800 text-gray-800 dark:text-gray-200 resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    Status Publikasi
                  </label>
                  <select
                    name="status"
                    defaultValue={editingArticle.status || "draft"}
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white appearance-none cursor-pointer font-medium"
                  >
                    <option value="draft">Simpan sebagai Draf</option>
                    <option value="published">Terbitkan Sekarang</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    URL Gambar Sampul
                  </label>
                  <input
                    type="url"
                    name="image_url"
                    value={previewUrl}
                    onChange={(e) => setPreviewUrl(e.target.value)}
                    placeholder="Contoh: https://images.unsplash.com/..."
                    className="w-full bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-black dark:focus:border-white transition-all text-black dark:text-white font-medium"
                  />
                  {previewUrl && (
                    <div className="w-full h-40 rounded-2xl overflow-hidden border border-gray-200 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-900 mt-4 shadow-inner">
                      <img
                        src={previewUrl}
                        alt="Pratinjau"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-10 mt-6 border-t border-gray-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingArticle(null)}
                  className="px-8 py-3 text-sm font-bold text-gray-400 hover:text-black dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-zinc-800 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-10 py-3 bg-black text-white dark:bg-white dark:text-black text-sm font-bold rounded-full hover:opacity-90 transition-all disabled:opacity-50 shadow-xl"
                >
                  {isPending ? "Sedang Menyimpan..." : "Simpan Tulisan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}