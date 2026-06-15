'use server';

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server.ts";
import { audit } from "intelligent-audit-trail";
import { Comment } from "@/types/comment.ts";
import { Profile } from "@/types/profile.ts";
import { Article } from "../types/article.ts";

/**
 * Creates a new comment on an article owned by the authenticated user, then
 * revalidates the article page cache.
 *
 * Redirects to `/login` when the user is not authenticated.
 *
 * @param formData - Form data containing `article_id` and `content` fields.
 * @returns A promise that resolves when the comment is persisted.
 */
export const createComment = audit(
  async function createComment(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const articleId = formData.get("article_id");
    const content   = formData.get("content");
    const username  = formData.get("username");
    const slug      = formData.get("slug");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    await supabase.from("comments").insert({
      article_id: articleId,
      user_id: user.id,
      content,
    });

    revalidatePath(`/${username}/${slug}`);
  },
  { resource: 'Comment' }
);

/**
 * Permanently deletes a comment owned by the authenticated user, then
 * revalidates the article page cache.
 *
 * Redirects to `/login` when the user is not authenticated.
 *
 * @param commentId - The UUID of the comment to delete.
 * @param articleId - The UUID of the associated article; used only to
 *   revalidate the correct page cache entry.
 * @returns A promise that resolves when the comment is removed.
 */
export const deleteComment = audit(
  async function deleteComment(commentId: string, articleId: string, username: string, slug: string): Promise<void> {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    await supabase
      .from("comments")
      .delete()
      .eq("id", commentId)
      .eq("user_id", user.id);

    revalidatePath(`/${username}/${slug}`);
  },
  { resource: 'Comment' }
);

/**
 * Updates the text content of an existing comment owned by the authenticated
 * user, then revalidates the article page cache.
 *
 * Redirects to `/login` when the user is not authenticated.
 *
 * @param formData - Form data containing `id` (comment UUID), `content`, and
 *   `article_id` fields.
 * @returns A promise that resolves when the update is persisted.
 */
export const updateComment = audit(
  async function updateComment(formData: FormData): Promise<void> {
    const supabase = await createClient();
    const commentId = formData.get("id") as string;
    const content   = formData.get("content") as string;
    const articleId = formData.get("article_id") as string;
    const username  = formData.get("username") as string;
    const slug      = formData.get("slug") as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return redirect("/login");

    await supabase
      .from("comments")
      .update({ content })
      .eq("id", commentId)
      .eq("user_id", user.id);

    revalidatePath(`/${username}/${slug}`);
  },
  { resource: 'Comment' }
);

/**
 * Retrieves all comments for a given article, with each comment's author
 * profile data populated from the `profiles` table.
 *
 * Comments are returned in descending creation order. Returns an empty array
 * when no comments exist or when a database error occurs.
 *
 * @param articleId - The UUID of the article whose comments should be fetched.
 * @returns A promise resolving to an array of {@link Comment} objects, each
 *   augmented with a `profiles` field containing the author's public profile.
 */
export const getCommentsbyArticleId = audit(
  async function getCommentsbyArticleId(articleId: string): Promise<Comment[]> {
    const supabase = await createClient();

    const { data: commentsRaw, error } = await supabase
      .from("comments")
      .select("*")
      .eq("article_id", articleId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching comments:", error);
      return [];
    }

    if (!commentsRaw || commentsRaw.length === 0) return [];

    const userIds = Array.from(new Set(commentsRaw.map((c: Comment) => c.user_id)));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    const profileMap = new Map(profiles?.map((p: Profile) => [p.id, p]) || []);

    return commentsRaw.map((c: Comment) => ({
      ...c,
      profiles: profileMap.get(c.user_id),
    }));
  },
  { resource: 'Comment' }
);

/**
 * Retrieves aggregated article-view records for a set of article IDs from the
 * `article_view` view, ordered by creation date descending.
 *
 * Returns an empty array when `articleIds` is empty or when a database error
 * occurs.
 *
 * @param articleIds - Array of article UUIDs to fetch view records for.
 * @returns A promise resolving to an array of {@link Article} view records.
 */
export const getCommentsbyArticleIds = audit(
  async function getCommentsbyArticleIds(articleIds: string[]): Promise<Article[]> {
    if (!articleIds || articleIds.length === 0) return [];

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("article_view")
      .select("*")
      .in("article_id", articleIds)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching article view:", error);
      return [];
    }

    return data || [];
  },
  { resource: 'Comment' }
);