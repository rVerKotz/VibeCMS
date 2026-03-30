import { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getArticleByUsernameAndSlug,
  getArticleData,
  incrementLikes,
  incrementViews,
} from "@/app/utils/actions/articles";
import { postComment } from "@/app/utils/actions/comments";
import ArticlesClient from "@/app/[username]/[slug]/articles-client";

export async function generateMetadata({ params }: { params: Promise<{ username: string; slug: string }>; }): Promise<Metadata> {
  const { username, slug } = await params;
  const article = await getArticleByUsernameAndSlug(username, slug);
  if (!article) {
    notFound();
  }
  const data = await getArticleData(article.id);

  return {
    title: data?.article?.title || "Artikel",
    description: data?.article?.content?.substring(0, 160) ||
      "Baca artikel terbaru di VibeCMS",
  };
}

export default async function Page({ params }: { params: Promise<{ username: string; slug: string }>; }) {
  const resolvedParams = await params;

  const username = decodeURIComponent(resolvedParams.username);
  const slug = resolvedParams.slug;

  const articleData = await getArticleByUsernameAndSlug(username, slug);
  if (!articleData) {
    notFound();
  }
  await incrementViews(articleData.id);
  const data = await getArticleData(articleData.id);

  if (!data || !data.article) {
    notFound();
  }

  const { article, comments, user } = data;

  return (
    <ArticlesClient
      article={article}
      comments={comments as any || []}
      user={user}
      postCommentAction={postComment}
      incrementLikesAction={incrementLikes}
    />
  );
}
