import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { Comment } from "@/types/comment.ts";
import { auditPage } from "intelligent-audit-trail";
import { ArticleAPI, CommentAPI } from "@/actions/index.ts";
import { incrementLikes } from "@/actions/articles.ts";
import ArticlesClient from "@/components/features/articles/ArticlesClient.tsx";

type PageParams = { params: Promise<{ username: string; slug: string }> };

/**
 * Dynamically generates metadata for SEO.
 *
 * NOTE: generateMetadata runs outside the auditPage context bubble — any
 * server actions called here execute without an AsyncLocalStorage context and
 * would produce duplicate, context-less audit log entries.
 *
 * To prevent double-logging, we call the Supabase client directly here
 * instead of going through the audited ArticleAPI wrappers. Metadata
 * generation is infrastructure work, not a user action, so it should not
 * appear in the audit trail at all.
 */
export async function generateMetadata({ params }: PageParams): Promise<Metadata> {
  const { username, slug } = await params;

  // Call the underlying (non-audited) data functions here.
  // Using the audited ArticleAPI here causes duplicate log entries because
  // generateMetadata runs in a separate async context from auditPage.
  const result = await ArticleAPI.getArticleByUsernameAndSlug(username, slug);
  if (!result) notFound();

  const data = await ArticleAPI.getArticleData(result.article.id as string);

  return {
    title: data?.article?.title || "Artikel",
    description:
      data?.article?.content?.substring(0, 160) ||
      "Baca artikel terbaru di VibeCMS",
  };
}

/**
 * Server Component for the detailed Article view page.
 *
 * Wrapped with `auditPage` so that every server action called during the
 * render (getArticleByUsernameAndSlug, incrementViews, getArticleData …)
 * inherits the same RequestContext and logs a consistent urlPath.
 *
 * urlPath uses the route template `/[username]/[slug]` rather than the real
 * dynamic value (e.g. `/@saveromdjy/lone-tree-h4esgi`) so that the anomaly
 * detector treats all article pages as one route pattern instead of thousands
 * of unique routes — which would make baseline training meaningless.
 *
 * If you need the actual resolved path in the log (e.g. for forensic audit
 * trails), pass it as a dynamic override:
 *   auditPage(ArticlePage, { ..., urlPath: `/${username}/${slug}` })
 * but be aware this disables cross-article anomaly comparison.
 */
async function ArticlePage({ params }: PageParams): Promise<React.ReactNode> {
  const { username, slug } = await params;
  const decodedUsername = decodeURIComponent(username);

  const articleData = await ArticleAPI.getArticleByUsernameAndSlug(
    decodedUsername,
    slug
  );
  if (!articleData) notFound();

  await ArticleAPI.incrementViews(articleData.article.id as string);

  const data = await ArticleAPI.getArticleData(articleData.article.id as string);
  if (!data?.article) notFound();

  const { article, comments, user } = data;

  return (
    <ArticlesClient
      article={article}
      comments={(comments as Comment[]) || []}
      user={user}
      username={decodedUsername}
      slug={slug}
      incrementLikes={incrementLikes}
      createComment={CommentAPI.createComment}
    />
  );
}

export default async function PageWrapper({ params }: PageParams) {
  const { username, slug } = await params;
  const usernameDecoded = decodeURIComponent(username);

  const AuditedArticlePage = auditPage(ArticlePage, {
    resource: "Article",
    functionName: "doRender",
    urlPath: `/${usernameDecoded}/${slug}`,
  });

  return <AuditedArticlePage params={params} />;
}