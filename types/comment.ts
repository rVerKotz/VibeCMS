import { Profile } from "./profile.ts";


export interface Comment {
  id: string | number;
  content: string;
  created_at: string;
  article_id?: string;
  user_id?: string;
  profiles?: Profile;
  articles?: {
    title: string;
    slug: string;
  };
  [key: string]: unknown;
}

export interface Response {
  id: string;
  content: string;
  created_at: string;
  article_id: string;
  user_id: string;
  commenter_name: string;
  commenter_avatar: string;
  article_title: string;
  article_slug: string;
}
