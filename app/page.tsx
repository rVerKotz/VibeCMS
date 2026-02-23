import { createClient } from "@/app/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  // 1. Inisialisasi Supabase Client
  const supabase = createClient(cookies());

  // 2. Cek session user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col min-h-screen font-sans bg-background text-foreground selection:bg-foreground selection:text-background">
      {/* --- NAVBAR --- */}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
            <div className="w-8 h-8 bg-foreground text-background rounded-lg flex items-center justify-center">
              V
            </div>
            VibeCMS
          </div>
         <nav className="flex gap-4">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="hidden sm:flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Profil
                </Link>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors flex items-center"
                >
                  Dashboard
                </Link>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden sm:flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors flex items-center"
                >
                  Mulai Menulis
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* --- HERO SECTION --- */}
        <section className="py-24 px-6 flex flex-col items-center text-center gap-8 border-b border-border/40">
          <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
            ✨ Versi Beta Kini Tersedia
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight max-w-4xl bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/50 pb-2">
            Platform Menulis untuk <br /> Kreator Masa Depan.
          </h1>
          <p className="text-lg text-gray-500 max-w-2xl leading-relaxed">
            Fokus pada konten Anda, biarkan VibeCMS menangani sisanya. 
            Dilengkapi dengan analitika real-time, manajemen draft simpel, dan performa tinggi.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
            <Link
              href="/login"
              className="px-8 py-3 rounded-full bg-foreground text-background font-medium hover:bg-[#383838] dark:hover:bg-[#ccc] transition-all text-center"
            >
              Buat Akun Gratis
            </Link>
            <a
              href="#features"
              className="px-8 py-3 rounded-full border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 transition-all text-center"
            >
              Pelajari Fitur
            </a>
          </div>
        </section>

        {/* --- FEATURES GRID --- */}
        <section id="features" className="py-24 px-6 bg-black/[0.02] dark:bg-white/[0.02]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight mb-4">Semua yang Anda butuhkan</h2>
              <p className="text-gray-500">Didesain minimalis agar Anda bisa fokus berkarya.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="group p-8 rounded-2xl bg-background border border-zinc-800 hover:border-foreground transition-all shadow-sm">
                <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" x2="18" y1="20" y2="10"/><line x1="12" x2="12" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="14"/></svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Analitika Real-time</h3>
                <p className="text-gray-500 leading-relaxed">
                  Pantau performa artikel Anda. Lihat jumlah pembaca (views) dan interaksi audiens dalam satu dashboard yang mudah dipahami.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="group p-8 rounded-2xl bg-background border border-zinc-800 hover:border-foreground transition-all shadow-sm">
                <div className="w-12 h-12 bg-green-500/10 text-green-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Manajemen Konten</h3>
                <p className="text-gray-500 leading-relaxed">
                  Pisahkan artikel <i>Draft</i> dan <i>Published</i>. Editor yang mendukung Markdown untuk penulisan cepat tanpa gangguan.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="group p-8 rounded-2xl bg-background border border-zinc-800 hover:border-foreground transition-all shadow-sm">
                <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <h3 className="text-xl font-semibold mb-3">Privasi Terjaga</h3>
                <p className="text-gray-500 leading-relaxed">
                  Setiap penulis memiliki ruang pribadinya sendiri. Data artikel Anda aman dan hanya bisa diakses oleh Anda sebelum dipublikasi.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- HOW IT WORKS --- */}
        <section className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold tracking-tight">Bagaimana Cara Kerjanya?</h2>
            </div>

            <div className="relative border-l border-gray-200 dark:border-gray-800 ml-4 md:ml-0 space-y-12">
              {/* Step 1 */}
              <div className="md:flex gap-8 relative pl-8 md:pl-0">
                <div className="absolute -left-1.5 md:left-auto md:right-full md:mr-8 mt-1.5 w-3 h-3 bg-foreground rounded-full ring-4 ring-background"></div>
                <div className="md:w-1/3 md:text-right mb-2 md:mb-0">
                  <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">Langkah 1</span>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-xl font-bold mb-2">Daftar & Buat Profil</h3>
                  <p className="text-gray-500">Buat akun dalam hitungan detik. Personalisasi profil penulis Anda agar dikenali pembaca.</p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="md:flex gap-8 relative pl-8 md:pl-0">
                <div className="absolute -left-1.5 md:left-auto md:right-full md:mr-8 mt-1.5 w-3 h-3 bg-foreground rounded-full ring-4 ring-background"></div>
                <div className="md:w-1/3 md:text-right mb-2 md:mb-0">
                  <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">Langkah 2</span>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-xl font-bold mb-2">Tulis Artikel</h3>
                  <p className="text-gray-500">Gunakan editor kami yang bersih. Simpan sebagai Draft jika belum selesai, atau Publish untuk menayangkannya ke dunia.</p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="md:flex gap-8 relative pl-8 md:pl-0">
                <div className="absolute -left-1.5 md:left-auto md:right-full md:mr-8 mt-1.5 w-3 h-3 bg-foreground rounded-full ring-4 ring-background"></div>
                <div className="md:w-1/3 md:text-right mb-2 md:mb-0">
                  <span className="text-sm font-bold tracking-wider text-muted-foreground uppercase">Langkah 3</span>
                </div>
                <div className="md:w-2/3">
                  <h3 className="text-xl font-bold mb-2">Analisis & Tumbuh</h3>
                  <p className="text-gray-500">Masuk ke Dashboard untuk melihat statistik. Pelajari artikel mana yang paling disukai audiens Anda.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* --- BIG CTA (Baru) --- */}
        <section className="py-24 px-6 border-t border-border/40 bg-linear-to-b from-transparent to-black/2 dark:to-white/2">
          <div className="max-w-4xl mx-auto text-center flex flex-col items-center gap-6">
            <h2 className="text-4xl font-bold tracking-tight">Siap menceritakan kisah Anda?</h2>
            <p className="text-xl text-gray-500 max-w-2xl">
              Bergabunglah dengan pemikir, kreator, dan penulis lainnya di VibeCMS hari ini.
            </p>
            <Link
              href="/dashboard"
              className="px-8 py-4 text-lg rounded-full bg-foreground text-background font-bold hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
            >
              Mulai Menulis Sekarang
            </Link>
          </div>
        </section>
      </main>

      {/* --- FOOTER (Baru & Lengkap) --- */}
      <footer className="bg-black/5 dark:bg-white/5 border-t border-border/40 pt-16 pb-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            
            {/* Kolom 1: Brand */}
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 font-bold text-xl tracking-tighter mb-4">
                <div className="w-6 h-6 bg-foreground text-background rounded flex items-center justify-center text-sm">
                  V
                </div>
                VibeCMS
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                Platform Content Management System (CMS) modern yang mengutamakan kecepatan dan kesederhanaan bagi penulis.
              </p>
            </div>

            {/* Kolom 2: Product */}
            <div>
              <h4 className="font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-foreground transition-colors">Fitur</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Harga</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Changelog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Roadmap</a></li>
              </ul>
            </div>

            {/* Kolom 3: Resources */}
            <div>
              <h4 className="font-semibold mb-4">Resource</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-foreground transition-colors">Dokumentasi</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Panduan API</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Komunitas</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Bantuan</a></li>
              </ul>
            </div>

            {/* Kolom 4: Legal */}
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-500">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-black/10 dark:border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              &copy; {new Date().getFullYear()} VibeCMS Inc. All rights reserved.
            </p>
            <div className="flex gap-4">
               {/* Social Icons (SVG) */}
               <a href="#" className="text-gray-400 hover:text-foreground transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" /></svg>
               </a>
               <a href="#" className="text-gray-400 hover:text-foreground transition-colors">
                  <span className="sr-only">GitHub</span>
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" /></svg>
               </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}