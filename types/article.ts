import { Profile } from "./profile.ts";

export interface Article {
  id?: string | number;
  title: string;
  slug: string;
  content?: string | null;
  featured_image?: string | null;
  status?: "draft" | "published" | string;
  views?: number;
  likes?: number;
  created_at: string;
  updated_at?: string;
  user_id?: string;
  image_url?: string;
  profiles?: Profile;
}

export interface ArticlePayload {
  title: string;
  content: string;
  status: string;
  slug: string;
  user_id: string;
  featured_image?: string;
}
