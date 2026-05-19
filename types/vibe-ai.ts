export interface AnalysisArticle {
  id: string;
  title: string;
  content: string;
  views: number;
  likes: number;
  updated_at: string;
}

export interface AnalysisComment {
  id: string;
  content: string;
  article_id: string;
  updated_at: string;
}

export interface AIInsight {
  name?: string;
  views?: number;
  [key: string]: unknown;
}

export interface AnalysisRequest {
  articles: AnalysisArticle[];
  comments: AnalysisComment[];
}

export interface AnalysisResponse {
  insights: AIInsight[];
  recommendations: string[];
  auth_status?: string;
}

