import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Comment } from "@/types/comment.ts";
import { ArticleAPI, CommentAPI } from "@/actions/index.ts";
import ArticlesClient from "@/components/features/articles/ArticlesClient.tsx";

export async function generateMetadata({ params }: { params: Promise<{ username: string; slug: string }>; }): Promise<Metadata> {
  const { username, slug } = await params;
  const article = await ArticleAPI.getArticleByUsernameAndSlug(username, slug);
  if (!article) {
    notFound();
  }
  const data = await ArticleAPI.getArticleData(article.id);

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

  const articleData = await ArticleAPI.getArticleByUsernameAndSlug(username, slug);
  if (!articleData) {
    notFound();
  }
  await ArticleAPI.incrementViews(articleData.id);
  const data = await ArticleAPI.getArticleData(articleData.id);

  if (!data || !data.article) {
    notFound();
  }

  const { article, comments, user } = data;

  return (
    <ArticlesClient
      article={article}
      comments={comments as Comment[] || []}
      user={user}
      createCommentAction={CommentAPI.createComment}
      incrementLikesAction={ArticleAPI.incrementLikes}
    />
  );
}
