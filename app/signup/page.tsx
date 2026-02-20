import Link from "next/link";
import { signup } from "@/app/auth/actions";
import { GalleryVerticalEnd, ArrowLeft } from "lucide-react";

export default function SignupPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center pattern-boxes pattern-opacity-100 pattern-zinc-300 pattern-bg-white pattern-size-5 dark:pattern-zinc-900 dark:pattern-boxes dark:pattern-bg-black dark:bg-black p-6 transition-colors duration-300">
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center gap-2 text-sm text-zinc-500 hover:text-black dark:hover:text-white transition"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali
      </Link>

      <div className="w-full max-w-sm bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-sm p-8 transition-all hover:shadow-md">
        <div className="flex flex-col items-center text-center gap-2 mb-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-black border-black dark:bg-black dark:text-white dark:border-white border shadow-sm">
            <GalleryVerticalEnd className="size-5" />
          </div>
          <h1 className="text-2xl text-black dark:text-white font-bold tracking-tight">
            Buat Akun Baru
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Mulai perjalanan menulis Anda hari ini
          </p>
        </div>

        <form className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-black dark:text-white"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 dark:focus:ring-white/10 dark:focus:border-white transition placeholder:text-zinc-400"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="password"
                className="text-sm font-medium text-black dark:text-white"
              >
                Password
              </label>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 dark:focus:ring-white/10 dark:focus:border-white transition"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium text-black dark:text-white"
              >
                Konfirmasi Password
              </label>
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              className="w-full px-3 py-2 bg-white dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 focus:border-zinc-900 dark:focus:ring-white/10 dark:focus:border-white transition placeholder:text-zinc-400"
            />
          </div>

          <button
            formAction={signup}
            className="w-full bg-zinc-900 dark:bg-zinc-100 text-zinc-50 dark:text-zinc-900 py-2.5 rounded-lg font-medium hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all shadow-md active:scale-[0.98]"
          >
            Buat Akun Baru
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Sudah punya akun?{" "}
          <Link
            href="/login"
            className="font-medium text-black dark:text-white hover:underline"
          >
            Masuk sekarang
          </Link>
        </div>
      </div>
    </div>
  );
}