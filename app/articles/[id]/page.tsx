import { notFound } from "next/navigation";
import { getArticleData } from "@/app/utils/actions/articles";
import { postComment } from "@/app/utils/actions";
import ArticlesClient from "./articles-client";
import { Metadata } from "next";

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
    />
  );
}