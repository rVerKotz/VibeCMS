import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getArticleData, incrementLikes, incrementViews } from "@/app/utils/actions/articles.ts";
import { postComment } from "@/app/utils/actions/comments.ts";
import ArticlesClient from "@/app/articles/[id]/articles-client.tsx";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const data = await getArticleData(id);
  
  return {
    title: data?.article?.title || "Artikel",
    description: data?.article?.content?.substring(0, 160) || "Baca artikel terbaru di VibeCMS",
  };
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await incrementViews(id);
  const data = await getArticleData(id);

  if (!data || !data.article) {
    notFound();
  }

  const { article, comments, user } = data;
  
  return (
    <ArticlesClient 
      article={article} 
      comments={comments || []} 
      user={user} 
      postCommentAction={postComment}
      incrementLikesAction={incrementLikes}
    />
  );
}