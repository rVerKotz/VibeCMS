import React from "react";
import { redirect } from "next/navigation";
import { Response } from "../../../types/comment.ts";
import { auditPage } from "intelligent-audit-trail"; 
import { ArticleAPI, CommentAPI, ProfileAPI, AuthAPI } from "../../../actions/index.ts";
import DashboardClient from "../../../components/features/dashboard/DashboardClient.tsx";

/**
 * Server Component representing the main user dashboard page.
 * Fetches user profile, user-owned articles, and recent comment interactions.
 * * @returns A promise resolving to the rendered Dashboard Page.
 */
async function DashboardPage(): Promise<React.ReactNode> {

  const user = await AuthAPI.getUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await ProfileAPI.getProfiles(user.id);
  if (!profile) {
    redirect("/login");
  }

  const articles = await ArticleAPI.getArticles();

  const validArticleIds = articles
    .map((a) => a.id)
    .filter((id): id is string => typeof id === "string");

  const responses = validArticleIds.length > 0 
    ? await CommentAPI.getCommentsbyArticleIds(validArticleIds) 
    : [];

  return (
    <DashboardClient 
      initialArticles={articles} 
      profile={profile}
      initialResponses={responses as unknown as Response[]}
      deleteArticleAction={ArticleAPI.deleteArticle}
      upsertArticleAction={ArticleAPI.upsertArticle}
    />
  );
}

export default auditPage(DashboardPage, { resource: "Dashboard", functionName: "doRender", urlPath: "/dashboard" });