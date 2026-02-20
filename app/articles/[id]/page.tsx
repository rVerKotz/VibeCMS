import { notFound } from "next/navigation";
import { getArticleData, incrementLikes } from "@/app/utils/actions/articles";
import { postComment } from "@/app/utils/actions";
import { Metadata } from "next";
import ArticlesClient from "@/app/articles/[id]/articles-client";

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