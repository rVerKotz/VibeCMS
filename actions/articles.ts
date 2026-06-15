'use server';

import { User } from "@/types/auth.ts";
import { Comment } from "@/types/comment.ts";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { audit } from "intelligent-audit-trail";
import { createClient } from "@/lib/supabase/server.ts";
import { ProfileAPI, CommentAPI } from "@/actions/index.ts";
import { Article, ArticlePayload } from "@/types/article.ts";

export interface GetArticlesParams {
  query?: string;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
}

/**
 * Generates a URL-friendly slug from a title, appending a short random suffix
 * to ensure uniqueness across articles.
 *
 * @param title - The article title to slugify.
 * @returns A unique lowercase slug string.
 */
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  const uniqueSuffix = Math.random().toString(36).substring(2, 8);
  return `${baseSlug}-${uniqueSuffix}`;
}

/**
 * Increments the like count for an article via an RPC call, then revalidates
 * the article page cache.
 *
 * @param articleId - The UUID of the article to like.
 * @param username - The author's username for cache revalidation.
 * @param slug - The article slug for cache revalidation.
 * @returns A promise that resolves when the RPC call completes.
 */
export const incrementLikes = audit(
  async function incrementLikes(articleId: string, username: string, slug: string): Promise<void> {
    const supabase = await createClient();
    await supabase.rpc("increment_likes", { row_id: articleId });
    revalidatePath(`/${username}/${slug}`);
  },
  { resource: 'Article' }
);

/**
 * Increments the view count for an article via an RPC call. Errors are caught
 * and logged silently so a failed view-count update never breaks page rendering.
 *
 * @param articleId - The UUID of the article being viewed.
 * @returns A promise that resolves when the RPC call completes.
 */
export const incrementViews = audit(
  async function incrementViews(articleId: string): Promise<void> {
    const supabase = await createClient();
    try {
      await supabase.rpc("increment_views", { row_id: articleId });
    } catch (error) {
      console.error("Failed to increment views:", error);
    }
  },
  { resource: 'Article' }
);

/**
 * Retrieves the current like count for a specific article.
 *
 * @param articleId - The UUID of the article.
 * @returns A promise resolving to the number of likes, or `0` when the article
 *   is not found.
 */
export const getLikes = audit(
  async function getLikes(articleId: string): Promise<number> {
    const supabase = await createClient();
    const { data: article } = await supabase
      .from("articles")
      .select("likes")
      .eq("id", articleId)
      .single();

    return article?.likes || 0;
  },
  { resource: 'Article' }
);

/**
 * Retrieves dashboard data for the currently authenticated user, including all
 * of their articles ordered by creation date descending.
 *
 * @returns A promise resolving to an object containing the authenticated `user`
 *   and their `articles` array. Both fields are empty/null when the user is not
 *   authenticated.
 */
export const getDashboardData = audit(
  async function getDashboardData(): Promise<{ user: User | null; articles: Article[] }> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { user: null, articles: [] };

    const { data: articles } = await supabase
      .from("articles")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    return { user: user as unknown as User, articles: articles || [] };
  },
  { resource: 'Article' }
);

/**
 * Retrieves a single article by its primary key.
 *
 * @param id - The UUID of the article to retrieve.
 * @returns A promise resolving to the {@link Article}, or `null` when not found
 *   or when a database error occurs.
 */
export const getArticleById = audit(
  async function getArticleById(id: string): Promise<Article | null> {
    const supabase = await createClient();
    const { data: article, error } = await supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return null;
    return article;
  },
  { resource: 'Article' }
);

/**
 * Retrieves a paginated, optionally filtered and sorted list of articles.
 *
 * @param params            - Optional query parameters.
 * @param params.query      - Partial title string to filter by (case-insensitive).
 * @param params.sortBy     - Column name to sort by.
 * @param params.order      - Sort direction; defaults to descending by `created_at`.
 * @param params.page       - Page number (currently unused; reserved for future use).
 * @param params.pageSize   - Number of results per page (currently unused).
 * @returns A promise resolving to an array of {@link Article} objects, or an
 *   empty array on error.
 */
export const getArticles = audit(
  async function getArticles(params?: GetArticlesParams): Promise<Article[]> {
    const supabase = await createClient();
    let query = supabase.from("articles").select("*");

    if (params?.query) {
      query = query.ilike("title", `%${params.query}%`);
    }
    if (params?.sortBy) {
      query = query.order(params.sortBy, { ascending: params.order === "asc" });
    } else {
      query = query.order("created_at", { ascending: false });
    }

    const { data, error } = await query;
    if (error) return [];
    return data;
  },
  { resource: 'Article' }
);

/**
 * Retrieves a full article view including its comments and author/viewer profiles.
 *
 * Fetches the article and the authenticated user in parallel, then resolves
 * the author profile and current-user profile in a second parallel round-trip,
 * and finally fetches all comments for the article.
 *
 * @param id - The UUID of the article.
 * @returns A promise resolving to an object containing the populated `article`,
 *   its `comments`, and the current `user`; or `null` when the article is not
 *   found.
 */
export const getArticleData = audit(
  async function getArticleData(
    id: string
  ): Promise<{ article: Article; comments: Comment[]; user: User | null } | null> {
    const supabase = await createClient();
    const [articleRes, authRes] = await Promise.all([
      supabase.from("articles").select("*").eq("id", id).single(),
      supabase.auth.getUser(),
    ]);

    const articleRaw = articleRes.data;
    const authUser = authRes.data.user;
    if (!articleRaw) return null;

    const [authorProfile, currentUserProfile] = await Promise.all([
      ProfileAPI.getProfiles(articleRaw.user_id),
      authUser ? ProfileAPI.getProfiles(authUser.id) : Promise.resolve(null),
    ]);

    const article = { ...articleRaw, profiles: authorProfile };
    const user = authUser ? { ...authUser, profile: currentUserProfile } : null;
    const comments = await CommentAPI.getCommentsbyArticleId(id);

    return { article, comments, user };
  },
  { resource: 'Article' }
);

/**
 * Retrieves an article identified by the author's username and the article slug,
 * along with its comments and the author's public profile.
 *
 * Prepends `@` to `username` automatically when it is missing.
 *
 * @param username - The author's username (with or without a leading `@`).
 * @param slug     - The URL slug of the article.
 * @returns A promise resolving to an object containing the `article`, its
 *   `comments`, and the author `user`; or `null` when the profile or article
 *   cannot be found.
 */
export const getArticleByUsernameAndSlug = audit(
  async function getArticleByUsernameAndSlug(
    username: string,
    slug: string
  ): Promise<{ article: Article; comments: Comment[]; user: User } | null> {
    const supabase = await createClient();
    const decodedUsername = decodeURIComponent(username);
    const searchUsername = decodedUsername.startsWith('@')
      ? decodedUsername
      : `@${decodedUsername}`;

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

    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .eq('user_id', profile.id)
      .single();

    if (articleError) {
      if (articleError.code !== 'PGRST116') {
        console.error('Error fetching article:', articleError);
      }
      return null;
    }

    const comments = await CommentAPI.getCommentsbyArticleId(article.id);
    return { article, comments, user: profile as unknown as User };
  },
  { resource: 'Article' }
);

/**
 * Creates a new article owned by the currently authenticated user.
 *
 * Redirects to `/login` when the user is not authenticated. Throws on a
 * database error. Revalidates `/dashboard` on success.
 *
 * @param formData - Form data containing `title` and `content` fields.
 * @returns A promise that resolves when the article is persisted, or rejects
 *   with a database error.
 */
export const createArticle = audit(
  async function createArticle(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const title = formData.get("title") as string;
    const content = formData.get("content") as string;
    const slug = generateSlug(title);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const { error } = await supabase.from("articles").insert({
      title,
      content,
      slug,
      user_id: user.id,
    });

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard");
  },
  { resource: 'Article' }
);

/**
 * Creates or updates an article, handling optional image upload and slug
 * generation. When an `id` field is present the article is updated; otherwise
 * a new article is inserted.
 *
 * Image upload flow:
 * 1. If a `File` is provided, all existing files in the user's storage folder
 *    are removed and the new file is uploaded.
 * 2. If only a `image_url` string is provided, it is used as-is.
 * 3. If neither is provided, the existing `featured_image` URL is preserved.
 *
 * Redirects to `/login` when the user is not authenticated. Revalidates
 * `/dashboard` and `/` on success.
 *
 * @param formData - Form data containing `id` (optional), `title`, `content`,
 *   `status`, `slug` (optional), `image` (File, optional), `image_url`
 *   (string, optional), and `featured_image` (existing URL, optional).
 * @returns A promise that resolves when the upsert completes.
 */
export const upsertArticle = audit(
  async function upsertArticle(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const id           = formData.get("id")?.toString();
    const title        = formData.get("title")?.toString() || "";
    const content      = formData.get("content")?.toString() || "";
    const status       = formData.get("status")?.toString() || "draft";
    const file         = formData.get("image") as File | null;
    const manualUrl    = formData.get("image_url")?.toString();
    const existingUrl  = formData.get("featured_image")?.toString();
    const slugInput    = formData.get("slug")?.toString();

    let finalImageUrl: string | undefined =
      existingUrl && existingUrl.trim() !== "" ? existingUrl : undefined;

    if (file && file.size > 0 && file.name !== 'undefined') {
      try {
        const { data: oldFiles } = await supabase.storage.from('images').list(user.id);
        if (oldFiles && oldFiles.length > 0) {
          const filesToRemove = oldFiles.map(f => `${user.id}/${f.name}`);
          await supabase.storage.from('images').remove(filesToRemove);
        }

        const fileExt = file.name.split(".").pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("images")
          .upload(fileName, file, { upsert: true });

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from("images")
            .getPublicUrl(fileName);
          finalImageUrl = publicUrl;
        }
      } catch (err) {
        console.error("Cleanup/Upload error:", err);
      }
    } else if (manualUrl && manualUrl.trim() !== "") {
      finalImageUrl = manualUrl;
    }

    const finalSlug =
      slugInput && slugInput.trim() !== "" ? slugInput : generateSlug(title);

    const payload: ArticlePayload = {
      title,
      content,
      status,
      slug: finalSlug,
      user_id: user.id,
      ...(finalImageUrl ? { featured_image: finalImageUrl } : {}),
    };

    if (id && id !== "undefined" && id !== "") {
      const { error } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("articles")
        .insert([{ ...payload, created_at: new Date().toISOString() }]);
      if (error) throw error;
    }

    revalidatePath("/dashboard");
    revalidatePath("/");
  },
  { resource: 'Article' }
);

/**
 * Updates the title and content of an existing article owned by the
 * authenticated user, then revalidates `/dashboard`.
 *
 * Redirects to `/login` when the user is not authenticated. Throws on a
 * database error.
 *
 * @param formData - Form data containing `id`, `title`, and `content` fields.
 * @returns A promise that resolves when the update is persisted.
 */
export const updateArticle = audit(
  async function updateArticle(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const id      = formData.get("id") as string;
    const title   = formData.get("title") as string;
    const content = formData.get("content") as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const { error } = await supabase
      .from("articles")
      .update({ title, content, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard");
  },
  { resource: 'Article' }
);

/**
 * Permanently deletes an article owned by the authenticated user and
 * revalidates `/dashboard`.
 *
 * Redirects to `/login` when the user is not authenticated. Throws on a
 * database error.
 *
 * @param id - The UUID of the article to delete.
 * @returns A promise that resolves when the article is removed.
 */
export const deleteArticle = audit(
  async function deleteArticle(id: string): Promise<void> {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    const { error } = await supabase
      .from("articles")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw new Error(error.message);
    revalidatePath("/dashboard");
  },
  { resource: 'Article' }
);