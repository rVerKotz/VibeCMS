import process from "node:process";
import { createBrowserClient } from "@supabase/ssr";

/**
 * Memasukkan Client Supabase untuk sisi Browser (Client Components).
 * Menggunakan variabel lingkungan NEXT_PUBLIC_ agar dapat diakses di sisi klien.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  console.log("Creating Supabase client with URL:", supabaseUrl);
  console.log("Creating Supabase client with Anon Key:", supabaseKey);

  if (!supabaseUrl || !supabaseKey) {
    // Memberikan pesan error yang jelas jika variabel lingkungan belum dikonfigurasi
    throw new Error(
      "Supabase URL atau Anon Key tidak ditemukan. Pastikan variabel NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah diset di file .env.local Anda."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}