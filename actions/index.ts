/* ./actions/index.ts */
import '@/core/audit-init.ts';
import * as authActions from '@/actions/auth.ts';
import * as articleActions from '@/actions/articles.ts';
import * as profileActions from '@/actions/profiles.ts';
import * as commentActions from '@/actions/comments.ts';

/**
 * AUTOMATIC TRACKING
 * We wrap the imported actions with 'trackActions'. 
 * The Proxy will automatically guess the action type based on function names.
 * @example export const ArticleAPI = trackActions(articleActions);
 */
export const AuthAPI    = authActions;
export const ArticleAPI = articleActions;
export const ProfileAPI = profileActions;
export const CommentAPI = commentActions;