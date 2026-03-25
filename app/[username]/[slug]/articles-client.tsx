'use client'

import{ useState, useTransition } from "react";
import Link from "next/link";
import { 
  Calendar, 
  Eye, 
  Share2, 
  MessageCircle, 
  ThumbsUp, 
  Check,
  ChevronLeft,
  Loader2
} from "lucide-react";


interface ArticlesClientProps {
  article: any;
  comments: any[];
  user: any;
  postCommentAction: (formData: FormData) => Promise<void>;
  incrementLikesAction?: (id: string) => Promise<void>;
}

export default function App({ 
  article, 
  comments = [], 
  user, 
  postCommentAction,
  incrementLikesAction 
}: ArticlesClientProps) {
  const [isPendingLike, startTransition] = useTransition();
  const [copied, setCopied] = useState(false);
  const [localLikes, setLocalLikes] = useState(article?.likes || 0);

  // Fallback data jika article belum dimuat (untuk mencegah crash)
  if (!article) return <div className="p-10 text-center">Memuat artikel...</div>;

  // Fungsi Handle Like
  const handleLike = () => {
    startTransition(async () => {
      try {
        if (incrementLikesAction) {
          await incrementLikesAction(article.id.toString());
        }
        setLocalLikes((prev: number) => prev + 1);
      } catch (error) {
        console.error("Like failed:", error);
      }
    });
  };

  // Fungsi Handle Share
  const handleShare = () => {
    const url = typeof window !== 'undefined' ? globalThis.location.href : '';
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 font-sans pb-20 transition-colors">
      
      {/* Navbar Minimalis */}
      <nav className="border-b border-zinc-100 dark:border-zinc-800 sticky top-0 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
            <a href="/" className="flex items-center gap-2 group">
                <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                <span className="font-bold text-xl tracking-tighter">VibeCMS</span>
            </a>
            <div className="flex gap-4 text-sm font-medium items-center">
          {user.profile ? (
            <Link 
              href="/profile" 
              className="w-9 h-9 rounded-full bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center text-xs font-bold overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all shadow-sm"
              title="Pengaturan Profil"
            >
              {user.profile.avatar_url ? (
                <img src={user.profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                user.profile.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"
              )}
            </Link>
          ) : (
            <Link href="/login" className="text-zinc-600 dark:text-zinc-400 hover:text-indigo-500 transition-colors">
              Login
            </Link>
          )}
        </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-6 pt-10">
        
        {/* Header Artikel */}
        <div className="space-y-6 text-center mb-10">
            <div className="flex items-center justify-center gap-2 text-sm text-zinc-500">
                <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> 
                    {new Date(article.created_at).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" /> 
                    {article.views?.toLocaleString()} Views
                </span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight text-zinc-900 dark:text-white">
                {article.title}
            </h1>
            
            <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative border border-zinc-200 dark:border-zinc-700">
                    {article.profiles?.avatar_url ? (
                         <img src={article.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                         <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-white font-bold">
                            {article.profiles?.full_name?.[0] || "A"}
                         </div>
                    )}
                </div>
                <div className="text-left">
                    <div className="font-semibold text-sm">{article.profiles?.full_name || "Anonim"}</div>
                    <div className="text-xs text-zinc-500">Penulis Artikel</div>
                </div>
            </div>
        </div>

        {/* Featured Image */}
        <div className="relative aspect-video w-full rounded-2xl overflow-hidden mb-12 shadow-xl border border-zinc-200 dark:border-zinc-800">
            <img 
                src={article.featured_image || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=1000"} 
                alt={article.title} 
                className="w-full h-full object-cover"
            />
        </div>

        {/* Konten Utama */}
        <article className="max-w-none text-lg leading-relaxed mb-16 text-zinc-800 dark:text-zinc-300">
            {article.content?.split('\n').map((line: string, i: number) => (
                <p key={i} className="mb-4">{line}</p>
            ))}
        </article>

        {/* Interaction Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-16 bg-zinc-50 dark:bg-zinc-900/50 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 transition-colors">
             <div className="font-semibold text-zinc-700 dark:text-zinc-200">Bagikan apresiasi Anda</div>
             <div className="flex items-center gap-3">
                <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 rounded-full border border-zinc-300 bg-white dark:bg-zinc-900 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-sm font-medium shadow-sm"
                >
                    {copied ? <><Check className="w-4 h-4 text-green-500" /> Tersalin!</> : <><Share2 className="w-4 h-4" /> Salin Link</>}
                </button> 
                
                <button
                    onClick={handleLike}
                    disabled={isPendingLike}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition text-sm font-medium shadow-sm
                        ${isPendingLike 
                            ? "bg-zinc-100 dark:bg-zinc-800 opacity-70 cursor-not-allowed" 
                            : "bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800"
                        }`}
                >
                    {isPendingLike ? <Loader2 className="w-4 h-4 animate-spin" /> : <ThumbsUp className="w-4 h-4" />}
                    {localLikes} Likes
                </button>
             </div>
        </div>

        {/* Section Komentar */}
        <section className="space-y-8">
            <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold flex items-center gap-2">
                    <MessageCircle className="w-6 h-6" /> 
                    Diskusi ({comments.length})
                </h3>
            </div>
            
            {user ? (
                <form 
                  onSubmit={(e) => { e.preventDefault(); postCommentAction(new FormData(e.currentTarget)); }}
                  className="flex gap-4 items-start bg-zinc-50 dark:bg-zinc-900/30 p-6 rounded-2xl border border-zinc-100 dark:border-zinc-800"
                >
                    <input type="hidden" name="article_id" value={article.id} />
                    <div className="w-10 h-10 rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 flex items-center justify-center font-bold shrink-0">
                        {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-3">
                        <textarea 
                            name="content" 
                            placeholder="Tulis pendapat atau pertanyaan Anda..." 
                            required
                            className="w-full p-4 rounded-xl border border-zinc-300 bg-white dark:bg-zinc-950 dark:border-zinc-700 outline-none transition focus:ring-2 focus:ring-zinc-900 dark:focus:ring-zinc-100 resize-none text-sm"
                            rows={3}
                        />
                        <div className="flex justify-end">
                            <button className="px-6 py-2 bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 rounded-lg font-bold text-sm hover:opacity-90 transition shadow-md">
                                Kirim Komentar
                            </button>
                        </div>
                    </div>
                </form>
            ) : (
                <div className="p-8 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl text-center border border-dashed border-zinc-300 dark:border-zinc-700">
                    <p className="text-zinc-500 mb-3 text-sm">Ingin ikut berdiskusi di artikel ini?</p>
                    <a href="/login" className="inline-block px-6 py-2 bg-zinc-900 text-white dark:bg-white dark:text-black rounded-full font-bold text-xs">
                        Login Sekarang
                    </a>
                </div>
            )}

            {/* List Komentar */}
            <div className="space-y-8 mt-10">
                {comments.length === 0 && (
                    <p className="text-center text-zinc-500 text-sm py-10">Belum ada komentar. Jadi yang pertama berdiskusi!</p>
                )}
                {comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-4 group">
                         <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden relative shrink-0 border border-zinc-200 dark:border-zinc-700">
                            {comment.profiles?.avatar_url ? (
                                <img src={comment.profiles.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-bold">
                                    {comment.profiles?.full_name?.[0] || "?"}
                                </div>
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-baseline justify-between mb-1">
                                <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                    {comment.profiles?.full_name || "User"}
                                </span>
                                <span className="text-xs text-zinc-400">
                                    {new Date(comment.created_at).toLocaleDateString('id-ID')}
                                </span>
                            </div>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                                {comment.content}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </section>
      </main>
    </div>
  );
}