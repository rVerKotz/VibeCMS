import { NextResponse } from "next/server";
import { ArticleAPI } from "@/actions/index.ts";

/**
 * Handler untuk menghapus artikel
 * Dipanggil via fetch('/api/articles?id=...', { method: 'DELETE' })
 */
export async function DELETE(request: Request) {
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
}

/**
 * Handler untuk Upsert artikel
 * Dipanggil via fetch('/api/articles', { method: 'POST', body: formData })
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    await ArticleAPI.upsertArticle(formData);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 } as Record<string, unknown>);
  }
}