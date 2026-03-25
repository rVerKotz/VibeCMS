"use server";

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function postComment(formData: FormData) {
  const supabase = createClient(cookies());
  const articleId = formData.get("article_id");
  const content = formData.get("content");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  await supabase.from("comments").insert({
    article_id: articleId,
    user_id: user.id,
    content: content,
  });

  revalidatePath(`/article/${articleId}`);
}

export async function deleteComment(commentId: string, articleId: string) {
  const supabase = createClient(cookies());

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  await supabase.from("comments").delete().eq("id", commentId).eq("user_id", user.id);

  revalidatePath(`/article/${articleId}`);
}

export async function updateComment(formData: FormData) {
  const supabase = createClient(cookies());
  const commentId = formData.get("id") as string;
  const content = formData.get("content") as string;
  const articleId = formData.get("article_id") as string;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return redirect("/login");

  await supabase.from("comments").update({ content }).eq("id", commentId).eq("user_id", user.id);
  revalidatePath(`/article/${articleId}`);
}

export async function getCommentsbyArticleId(articleId: string) {
  const supabase = createClient(cookies());

  const { data: commentsRaw } = await supabase
    .from("comments")
    .select("*")
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  let comments: any[] = [];
  if (commentsRaw && commentsRaw.length > 0) {
    // Ambil ID user unik dari komentar untuk query efisien (IN operator)
    const userIds = Array.from(new Set(commentsRaw.map((c: any) => c.user_id)));

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url")
      .in("id", userIds);

    // Mapping cepat menggunakan Map
    const profileMap = new Map(profiles?.map((p: any) => [p.id, p]) || []);

    comments = commentsRaw.map((c: any) => ({
      ...c,
      profiles: profileMap.get(c.user_id),
    }));
  }

  return comments;
}

export async function getCommentsbyArticleIds(articleIds: string[]) {
  if (!articleIds || articleIds.length === 0) return [];

  const supabase = createClient(cookies());

  const { data, error } = await supabase
    .from("article_view")
    .select("*")
    .in("article_id", articleIds)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching from view:", error.message);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    content: item.content,
    created_at: item.created_at,
    articles: {
      title: item.article_title,
      slug: item.article_slug
    },
    profiles: {
      full_name: item.commenter_name,
      avatar_url: item.commenter_avatar
    }
  }));
}