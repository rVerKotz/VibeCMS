/* ./app/utils/actions/index.ts */
import * as authActions from '@/actions/auth.ts';
import * as articleActions from '@/actions/articles.ts';
import * as profileActions from '@/actions/profiles.ts';
import * as commentActions from '@/actions/comments.ts';
import { trackActions, auditTrail } from 'intelligent-audit-trail';

/**
 * 1. INITIALIZE GLOBAL ML BASELINE
 * This only needs to happen once. In a real scenario, this baseline 
 * represents 'Normal' patterns for the VibeCMS platform.
 */
auditTrail.setMode('TRAINING');
//auditTrail.loadBaseline('audit-baseline.jsonl');

/**
 * 2. AUTOMATIC TRACKING
 * We wrap the imported actions with 'trackActions'. 
 * The Proxy will automatically guess the action type based on function names.
 */
export const AuthAPI = trackActions(authActions, 'Auth') as typeof authActions;
export const ArticleAPI = trackActions(articleActions, 'Article') as typeof articleActions;
export const ProfileAPI = trackActions(profileActions, 'Profile') as typeof profileActions;
export const CommentAPI = trackActions(commentActions, 'Comment') as typeof commentActions;