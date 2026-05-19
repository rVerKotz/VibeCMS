import { createBrowserClient } from "@supabase/ssr";
import process from "node:process";

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.log("Current Process Env Keys:", Object.keys(process.env).filter(k => k.includes("SUPABASE")));
    throw new Error(
      "Supabase URL atau Anon Key tidak ditemukan. Pastikan variabel NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY sudah diset di file .env.local Anda."
    );
  }

  return createBrowserClient(supabaseUrl, supabaseKey);
}