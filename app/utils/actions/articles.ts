"use server";

import { createClient } from "@/app/utils/supabase/server";
import { getComments } from "@/app/utils/actions/comments";
import { getProfiles } from "@/app/utils/actions/profiles";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export interface GetArticlesParams {
  query?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function incrementLikes(articleId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  await supabase.rpc("increment_likes", { row_id: Number(articleId) });
  revalidatePath(`/articles/${articleId}`);
}

export async function incrementViews(articleId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  try {
    await supabase.rpc("increment_views", { row_id: Number(articleId) });
  } catch (err) {
    console.error("Gagal menaikkan views:", err);
  }
}

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

export async function upsertArticle(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const status = formData.get("status") as string;
  const file = formData.get("image") as File;
  let imageUrl = formData.get("current_image") as string;

  if (file && file.size > 0) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("images").upload(fileName, file);
    if (!uploadError) {
      const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(fileName);
      imageUrl = publicUrl;
    }
  }

  const payload = { title, content, status, featured_image: imageUrl, user_id: user.id };

  if (id) {
    await supabase.from("articles").update(payload).eq("id", id).eq("user_id", user.id);
  } else {
    await supabase.from("articles").insert(payload);
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
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, articles: [] };
  const { data: articles } = await supabase.from("articles").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  return { user, articles: articles || [] };
}

export async function getArticles(params: GetArticlesParams = {}) {
  const { query = "", sortBy = "created_at", order = "desc", page = 1, pageSize = 5 } = params;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { user: null, articles: [], total: 0 };

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let supabaseQuery = supabase.from("articles").select("*", { count: "exact" }).eq("user_id", user.id);
  if (query) supabaseQuery = supabaseQuery.ilike("title", `%${query}%`);

  const { data: articles, count, error } = await supabaseQuery
    .order(sortBy, { ascending: order === "asc" })
    .range(from, to);

  if (error) console.error("Error fetching articles:", error);

  return { user, articles: articles || [], total: count || 0, page, pageSize };
}

export async function getArticleData(id: string) {
  if (isNaN(Number(id))) return null;
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const [articleRes, authRes] = await Promise.all([
    supabase.from("articles").select("*").eq("id", id).single(),
    supabase.auth.getUser()
  ]);
  const articleRaw = articleRes.data;
  const authUser = authRes.data.user;
  if (!articleRaw) return null;
  const [authorProfile, currentUserProfile] = await Promise.all([
    getProfiles(articleRaw.user_id),
    authUser ? getProfiles(authUser.id) : Promise.resolve(null)
  ]);
  const article = { ...articleRaw, profiles: authorProfile };
  const user = authUser ? { ...authUser, profile: currentUserProfile } : null;
  const comments = await getComments(id);
  return { article, comments, user };
}