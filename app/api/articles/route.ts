/* ./app/api/articles/route.ts */
import '@/core/audit-init.ts';
import { NextResponse } from "next/server";
import { ArticleAPI } from "@/actions/index.ts";
import { audit } from "intelligent-audit-trail";

/**
 * Handler untuk menghapus artikel
 * Dipanggil via fetch('/api/articles?id=...', { method: 'DELETE' })
 * @param request - The standard Web `Request` object sent by the client (containing query parameters).
 * @returns A Promise resolving to a `NextResponse`. Contains success status on success, or error details on failure.
 * @example fetch('/api/articles?id=123', { method: 'DELETE' })
 */
export const DELETE = audit(
  async function deleteArticle(request: Request) {
    try {
      const { searchParams } = new URL(request.url);
      const id = searchParams.get("id");

      if (!id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 } as Record<string, unknown>);
      }

      await ArticleAPI.deleteArticle(id);
      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 } as Record<string, unknown>);
    }
  },
  { resource: 'Article' }
);

/**
 * Handler untuk Upsert artikel
 * Dipanggil via fetch('/api/articles', { method: 'POST', body: formData })
 * @param request - The standard Web `Request` object sent by the client (containing form data).
 * @returns A Promise resolving to a `NextResponse`. Contains success status on success, or error details on failure.
 * @example fetch('/api/articles', { method: 'POST', body: formData })
 */
export const POST = audit(
  async function upsertArticle(request: Request) {
    try {
      const formData = await request.formData();
      await ArticleAPI.upsertArticle(formData);
      return NextResponse.json({ success: true });
    } catch (error: unknown) {
      return NextResponse.json({ error: (error as Error).message }, { status: 500 } as Record<string, unknown>);
    }
  },
  { resource: 'Article' }
);