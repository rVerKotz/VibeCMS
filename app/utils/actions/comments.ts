"use server";

import { createClient } from "@/app/utils/supabase/server";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export async function postComment(formData: FormData) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
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

export async function getComments(articleId: string) {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

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
