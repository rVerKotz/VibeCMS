"use server";

import { createClient } from "@/app/utils/supabase/server";
import { getComments } from "@/app/utils/actions/comments";
import { getProfiles } from "@/app/utils/actions/profiles";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function getLikes(articleId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: article } = await supabase
    .from("articles")
    .select("likes")
    .eq("id", articleId)
    .single();

  return article?.likes || 0;
}

export async function incrementLikes(articleId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.rpc("increment_likes", { row_id: Number(articleId) });
  revalidatePath(`/article/${articleId}`);
}

export async function upsertArticle(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/login");
  }

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const status = formData.get("status") as string;
  const file = formData.get("image") as File;
  let imageUrl = formData.get("current_image") as string; // Pertahankan gambar lama jika tidak ada upload baru

  // 1. Handle Image Upload jika ada file baru
  if (file && file.size > 0) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(fileName, file);

    if (!uploadError) {
      // Dapatkan Public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("images").getPublicUrl(fileName);
      imageUrl = publicUrl;
    }
  }

  // 2. Insert atau Update
  if (id) {
    // Mode EDIT
    await supabase
      .from("articles")
      .update({
        title,
        content,
        status,
        featured_image: imageUrl,
      })
      .eq("id", id)
      .eq("user_id", user.id);
  } else {
    // Mode CREATE
    await supabase.from("articles").insert({
      title,
      content,
      status,
      featured_image: imageUrl || undefined,
      user_id: user.id,
    });
  }

  revalidatePath("/dashboard");
}

export async function deleteArticle(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const id = formData.get("id") as string;
  await supabase.from("articles").delete().eq("id", id);
  revalidatePath("/dashboard");
}

export async function getDashboardData() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, articles: [] };

  const { data: articles } = await supabase
    .from("articles")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return { user, articles: articles || [] };
}

export async function getArticleData(id: string) {
  // 1. Validasi ID harus angka
  if (isNaN(Number(id))) {
    return null;
  }

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // 2. Fetch Artikel (Tanpa Join profiles dulu untuk menghindari error PGRST200)
  const { data: articleRaw, error } = await supabase
    .from("articles")
    .select("*")
    .eq("id", id)
    .single();

  // Handle Error (Abaikan jika 404/PGRST116)
  if (error && error.code !== "PGRST116") {
    console.error(
      "Supabase Error saat fetch artikel:",
      JSON.stringify(error, null, 2),
    );
  }

  // Jika tidak ditemukan, kembalikan null
  if (!articleRaw) return null;

  // 3. Fetch Profile Penulis
  const { data: authorProfile } = await getProfiles(articleRaw.user_id);

  // 4. Gabungkan object
  const article = {
    ...articleRaw,
    profiles: authorProfile,
  };

  // 5. Increment Views (Fire-and-forget dengan try-catch)
  try {
    // Pastikan nama parameter sesuai dengan fungsi RPC SQL Anda (biasanya 'row_id')
    await supabase.rpc("increment_views", { row_id: Number(id) });
  } catch (err) {
    // Error increment views tidak fatal, cukup log saja
    console.error("Gagal menaikkan views:", err);
  }

  // 6. Fetch Komentar
 const comments = await getComments(id);
  // 7. Cek Current User (untuk akses form komentar)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { article, comments, user };
}
