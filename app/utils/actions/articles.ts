"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/app/utils/supabase/server";
import { getProfiles } from "@/app/utils/actions/profiles";
import { getCommentsbyArticleId } from "@/app/utils/actions/comments";

export interface GetArticlesParams {
  query?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

export async function generateSlug(title: string) {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric characters with hyphens
    .replace(/(^-|-$)+/g, '');   // Remove leading or trailing hyphens
  
  // Add a unique 6-character string at the end (matches your example)
  const uniqueSuffix = Math.random().toString(36).substring(2, 8); 
  return `${baseSlug}-${uniqueSuffix}`;
}

export async function incrementLikes(articleId: string) {
  const supabase = await createClient();
  await supabase.rpc("increment_likes", { row_id: articleId });
  revalidatePath(`/articles/${articleId}`);
}

export async function incrementViews(articleId: string) {
  const supabase = await createClient();
  try {
    await supabase.rpc("increment_views", { row_id: articleId });
  } catch (err) {
    console.error("Gagal menaikkan views:", err);
  }
}

export async function getLikes(articleId: string) {
  const supabase = await createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("likes")
    .eq("id", articleId)
    .single();
  return article?.likes || 0;
}

export async function deleteArticle(id: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from("articles")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting article:", error);
    throw new Error("Failed to delete article");
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
}

export async function upsertArticle(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const id = formData.get("id") as string;
  const title = formData.get("title") as string;
  const content = formData.get("content") as string;
  const status = formData.get("status") as string;
  const file = formData.get("image") as File;
  const manualUrl = formData.get("image_url") as string; 
  const existingUrl = formData.get("featured_image") as string;
  const slugInput = formData.get("slug") as string;

  let finalImageUrl = existingUrl || null;

  // 1. LOGIKA UPLOAD & CLEANUP 
  if (file && file.size > 0 && file.name !== 'undefined') {
    try {
      // CLEANUP: Hapus file lama milik user ini di folder storage (user.id)
      const { data: oldFiles } = await supabase.storage.from('images').list(user.id);
      if (oldFiles && oldFiles.length > 0) {
        const filesToRemove = oldFiles.map(f => `${user.id}/${f.name}`);
        await supabase.storage.from('images').remove(filesToRemove);
      }

      // UPLOAD: Masukkan ke folder user.id (Best Practice)
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("images")
        .upload(fileName, file, { upsert: true });

      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from("images").getPublicUrl(fileName);
        finalImageUrl = publicUrl;
      }
    } catch (err) {
      console.error("Cleanup/Upload error:", err);
    }
  } 
  // 2. LOGIKA MANUAL URL (Jika tidak ada file yang diupload)
  else if (manualUrl && manualUrl.trim() !== "") {
    finalImageUrl = manualUrl;
  }

  // 3. LOGIKA SLUG
  let finalSlug = slugInput;
  if (!finalSlug || finalSlug.trim() === "") {
    finalSlug = await generateSlug(title);
  }

  const payload = { 
    title, 
    content, 
    status, 
    slug: finalSlug, 
    featured_image: finalImageUrl, 
    user_id: user.id
  };

  if (id && id !== "undefined" && id !== "") {
    const { error } = await supabase.from("articles").update(payload).eq("id", id).eq("user_id", user.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("articles").insert([{ ...payload, created_at: new Date().toISOString() }]);
    if (error) throw error;
  }

  revalidatePath("/dashboard");
  revalidatePath("/");
}


export async function getDashboardData() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, articles: [] };
  const { data: articles } = await supabase.from("articles").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  return { user, articles: articles || [] };
}

export async function getArticles(params: GetArticlesParams = {}) {
  const { query = "", sortBy = "created_at", order = "desc", page = 1, pageSize = 5 } = params;
  const supabase = await createClient();
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
  const supabase = await createClient();
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
  const comments = await getCommentsbyArticleId(id);
  return { article, comments, user };
}

export async function getArticleByUsernameAndSlug(username: string, slug: string) {
  const supabase = await createClient();
  // 1. Decode URL parameters (e.g., %40 back to @)
  const decodedUsername = decodeURIComponent(username);
  
  // 2. Ensure it has the @ prefix as per your database schema
  const searchUsername = decodedUsername.startsWith('@') ? decodedUsername : `@${decodedUsername}`;

  // 3. First, fetch the profile to get the user_id associated with that username
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url')
    .eq('username', searchUsername)
    .single();

  if (profileError || !profile) {
    if (profileError?.code !== 'PGRST116') {
      console.error('Error fetching profile for article:', profileError);
    }
    return null;
  }

  // 4. Then, fetch the article belonging to that user with that slug
  const { data: article, error: articleError } = await supabase
    .from('articles')
    .select('*')
    .eq('slug', slug)
    .eq('user_id', profile.id)
    .single();

  if (articleError) {
    if (articleError.code === 'PGRST116') return null;
    console.error('Error fetching article content:', articleError);
    return null;
  }

  // 5. Combine the data to match the expected structure in the UI
  return {
    ...article,
    profiles: profile
  };
}