"use client";

import { useRef, useState } from "react";
import {
    AlertCircle,
    ExternalLink,
    Image as ImageIcon,
    LayoutDashboard,
    Loader2,
    PenLine,
    Plus,
    Trash2,
    UploadCloud,
    X,
} from "lucide-react";
import { deleteArticle, upsertArticle } from "@/app/utils/actions/articles.ts";
import Link from "next/link";
// HAPUS import Image dari next/image untuk menghindari error Domain restriction Next.js

export default function DashboardClient(
    { articles, profile }: { articles: any[]; profile?: any },
) {
    // State untuk Edit Mode
    const [editingId, setEditingId] = useState<string | null>(null);
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [status, setStatus] = useState("draft");
    const [currentImage, setCurrentImage] = useState("");
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // FIX: Derived state untuk mengatasi masalah state desync saat profile lambat dimuat.
    // Ini memastikan banner otomatis hilang jika `profile` sudah ada!
    const isProfileComplete = Boolean(profile?.full_name && profile?.username);
    const [isBannerDismissed, setIsBannerDismissed] = useState(false);
    const showBanner = !isProfileComplete && !isBannerDismissed;
    
    const [showPublishModal, setShowPublishModal] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    // Ref untuk File Input
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fungsi saat tombol Edit ditekan
    const handleEdit = (article: any) => {
        setEditingId(article.id);
        setTitle(article.title);
        setContent(article.content || "");
        setStatus(article.status);
        setCurrentImage(article.featured_image || article.image_url || "");
        setPreviewUrl(null); // Reset preview file baru
        window.scrollTo({ top: 0, behavior: "smooth" }); // Scroll ke form
    };

    // Fungsi Reset Form
    const resetForm = () => {
        setEditingId(null);
        setTitle("");
        setContent("");
        setStatus("draft");
        setCurrentImage("");
        setPreviewUrl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    // Handle Image Preview
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
        }
    };

    const submitAsDraft = () => {
        setStatus("draft");
        setShowPublishModal(false);
        // Gunakan setTimeout agar React sempat mengubah state 'status' di dropdown sebelum form di-submit ulang
        setTimeout(() => {
            if (formRef.current) {
                formRef.current.requestSubmit();
            }
        }, 0);
    };

    return (
        <div className="space-y-6">
            {showBanner && (
                <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700/50 rounded-2xl flex items-start md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3 text-yellow-800 dark:text-yellow-200">
                        <AlertCircle size={20} className="flex-shrink-0" />
                        <p className="text-sm font-medium">
                            Anda belum melengkapi profil. Artikel Anda hanya
                            dapat disimpan sebagai Draft.
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
                            className="text-yellow-700 hover:text-yellow-900"
                        >
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri: Form Buat/Edit Artikel (CMS) */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 sticky top-8 transition-colors">
                        <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div
                                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-white transition-colors ${
                                        editingId
                                            ? "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                                            : "bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-900"
                                    }`}
                                >
                                    {editingId
                                        ? <PenLine className="h-4 w-4" />
                                        : <Plus className="h-4 w-4" />}
                                </div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                                    {editingId
                                        ? "Edit Artikel"
                                        : "Buat Artikel Baru"}
                                </h3>
                            </div>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-300"
                                >
                                    Batal
                                </button>
                            )}
                        </div>

                        <form
                            ref={formRef}
                            onSubmit={(e) => {
                                // Cegah form terkirim jika status "published" tapi profil belum lengkap!
                                if (status === "published" && !isProfileComplete) {
                                    e.preventDefault();
                                    setShowPublishModal(true);
                                }
                            }}
                            action={async (formData) => {
                                setIsSubmitting(true);
                                await upsertArticle(formData);
                                setIsSubmitting(false);
                                resetForm();
                            }}
                            className="p-6 space-y-4"
                        >
                            <input
                                type="hidden"
                                name="id"
                                value={editingId || ""}
                            />
                            <input
                                type="hidden"
                                name="current_image"
                                value={currentImage || ""}
                            />

                            {/* Drag & Drop Image Area */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                    Featured Image
                                </label>
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative group cursor-pointer flex flex-col items-center justify-center w-full h-40 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/50 dark:hover:bg-zinc-800 transition overflow-hidden"
                                >
                                    {previewUrl || currentImage
                                        ? (
                                            /* Gunakan tag <img> standar untuk mendukung URL eksternal bebas */
                                            <img
                                                src={previewUrl || currentImage}
                                                alt="Preview"
                                                className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-60 transition"
                                            />
                                        )
                                        : (
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <UploadCloud className="w-8 h-8 mb-2 text-zinc-400" />
                                                <p className="text-xs text-zinc-500">
                                                    Klik untuk upload gambar
                                                </p>
                                            </div>
                                        )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        name="image"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="title"
                                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Judul Artikel
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Judul yang menarik..."
                                    required
                                    className="w-full rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 dark:text-zinc-100 transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="content"
                                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Konten
                                </label>
                                <textarea
                                    id="content"
                                    name="content"
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    placeholder="Tulis artikel Anda di sini..."
                                    required
                                    rows={8}
                                    className="w-full resize-none rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 dark:text-zinc-100 transition"
                                />
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="status"
                                    className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                    Status
                                </label>
                                <div className="relative">
                                    <select
                                        id="status"
                                        name="status"
                                        value={status}
                                        onChange={(e) =>
                                            setStatus(e.target.value)}
                                        className="w-full appearance-none rounded-lg border border-zinc-200 bg-transparent px-3 py-2 text-sm focus:border-zinc-900 focus:outline-none focus:ring-1 focus:ring-zinc-900 dark:border-zinc-800 dark:focus:border-zinc-100 dark:focus:ring-zinc-100 dark:text-zinc-100 transition"
                                    >
                                        <option
                                            value="draft"
                                            className="dark:bg-zinc-900"
                                        >
                                            Draft (Simpan dulu)
                                        </option>
                                        <option
                                            value="published"
                                            className="dark:bg-zinc-900"
                                        >
                                            Publish (Tayangkan)
                                        </option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-white transition shadow-lg shadow-zinc-900/10 dark:shadow-none ${
                                    isSubmitting
                                        ? "bg-zinc-500 cursor-not-allowed"
                                        : "bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                                }`}
                            >
                                {isSubmitting && (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                )}
                                {editingId
                                    ? "Update Artikel"
                                    : "Simpan Artikel"}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Kolom Kanan: Tabel Artikel */}
                <div className="lg:col-span-2">
                    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900 overflow-hidden transition-colors">
                        <div className="flex items-center justify-between border-b border-zinc-100 p-6 dark:border-zinc-800">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100">
                                    <LayoutDashboard className="h-4 w-4" />
                                </div>
                                <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                                    Daftar Artikel
                                </h3>
                            </div>
                            <span className="text-xs font-medium text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-full">
                                {articles.length} Total
                            </span>
                        </div>

                        {articles.length === 0
                            ? (
                                <div className="p-12 text-center">
                                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-zinc-800 mb-4">
                                        <PenLine className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                                        Belum ada artikel
                                    </h3>
                                    <p className="text-sm text-zinc-500 mt-1 max-w-sm mx-auto">
                                        Mulai menulis artikel pertama Anda
                                        melalui formulir di samping kiri.
                                    </p>
                                </div>
                            )
                            : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-zinc-50 text-zinc-500 dark:bg-zinc-950/50 dark:text-zinc-400 border-b border-zinc-100 dark:border-zinc-800">
                                            <tr>
                                                <th className="px-6 py-4 font-medium">
                                                    Judul
                                                </th>
                                                <th className="px-6 py-4 font-medium w-32">
                                                    Status
                                                </th>
                                                <th className="px-6 py-4 font-medium text-right w-24">
                                                    Views
                                                </th>
                                                <th className="px-6 py-4 font-medium text-right w-32">
                                                    Aksi
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                                            {articles.map((article) => (
                                                <tr
                                                    key={article.id}
                                                    className="group hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                                                >
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            {/* Thumbnail Image */}
                                                            {article.featured_image || article.image_url ? (
                                                                <div className="w-8 h-8 rounded bg-zinc-100 relative overflow-hidden shrink-0">
                                                                    <img
                                                                        src={article.featured_image || article.image_url}
                                                                        alt=""
                                                                        className="absolute inset-0 w-full h-full object-cover"
                                                                    />
                                                                </div>
                                                            ) : null}
                                                            <div>
                                                                <div className="font-medium text-zinc-900 dark:text-zinc-100 line-clamp-1">
                                                                    {article.title}
                                                                </div>
                                                                <Link
                                                                    href={`/articles/${article.id}`}
                                                                    target="_blank"
                                                                    className="text-xs text-blue-500 hover:underline flex items-center gap-1 mt-0.5"
                                                                >
                                                                    Lihat{" "}
                                                                    <ExternalLink className="w-2 h-2" />
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span
                                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                                                article.status === "published"
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                                                                    : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
                                                            }`}
                                                        >
                                                            {article.status === "published"
                                                                ? "Published"
                                                                : "Draft"}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right font-mono text-zinc-600 dark:text-zinc-400">
                                                        {article.views?.toLocaleString() || 0}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleEdit(article)}
                                                                className="text-zinc-400 hover:text-blue-500 transition-colors p-2 rounded-md hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                title="Edit Artikel"
                                                            >
                                                                <PenLine className="h-4 w-4" />
                                                            </button>
                                                            <form action={deleteArticle}>
                                                                <input
                                                                    type="hidden"
                                                                    name="id"
                                                                    value={article.id}
                                                                />
                                                                <button
                                                                    type="submit"
                                                                    className="text-zinc-400 hover:text-red-500 transition-colors p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                    title="Hapus Artikel"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </form>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                    </div>
                </div>
                {showPublishModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm transition-opacity">
                        <div className="bg-white dark:bg-zinc-950 w-full max-w-sm rounded-2xl p-8 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-center mb-5 text-zinc-900 dark:text-zinc-100">
                                <AlertCircle size={40} strokeWidth={1.5} />
                            </div>
                            <h3 className="text-xl font-bold text-center text-zinc-900 dark:text-white mb-2 tracking-tight">
                                Profil Belum Lengkap
                            </h3>
                            <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
                                Anda harus melengkapi Nama dan Username sebelum
                                dapat mempublikasikan tulisan.
                            </p>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/profile"
                                    className="w-full flex justify-center items-center py-2.5 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg text-sm font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
                                >
                                    Lengkapi Profil
                                </Link>
                                <button
                                    type="button"
                                    onClick={submitAsDraft}
                                    className="w-full py-2.5 bg-transparent border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 rounded-lg text-sm font-medium hover:bg-zinc-50 dark:hover:bg-zinc-900 transition-colors"
                                >
                                    Simpan sebagai Draft
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowPublishModal(false)}
                                    className="w-full py-2.5 text-zinc-500 text-sm font-medium hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
                                >
                                    Batal
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}