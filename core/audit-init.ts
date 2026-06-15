/* ./app/core/audit-init.ts */
import process from 'node:process';
import { auditTrail, auditRules } from 'intelligent-audit-trail';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * 1. CONFIGURE SAFE PAYLOAD CAPTURE RULES (Crucial!)
 * The library strictly ignores all field-change captures UNLESS they are explicitly 
 * defined here. This prevents accidentally logging sensitive data like passwords.
 */
auditRules['articles'] = {
  captureTableName: true,
  fields: {
    title: { capture: true, maxLength: 150 }, // We want to see what they changed the title to!
    status: { capture: true },
    views: { capture: true },
    likes: { capture: true },
    // Notice 'content' is missing. We DON'T want giant blog contents blowing up our logs.
  }
};

auditRules['profiles'] = {
  captureTableName: true,
  fields: {
    full_name: { capture: true },
    username: { capture: true },
    last_login: { capture: true },
    updated_at: { capture: true },
  }
};

auditRules['comments'] = {
  captureTableName: true,
  fields: {
    article_id: { capture: true },
    user_id: { capture: true },
    created_at: { capture: true },
    updated_at: { capture: true },
  }
};

/**
 * 2. INITIALIZE GLOBAL ML BASELINE
 * This only needs to happen once. In a real scenario, this baseline 
 * represents 'Normal' patterns for the VibeCMS platform.
 * @example auditTrail.setMode('TRAINING');
 * @example auditTrail.loadBaseline('path/to/audit-baseline.jsonl');
*/
auditTrail.loadBaseline('audit-baseline.jsonl');
auditTrail.onLog(async (log) => {
    try {
        const supabase = createSupabaseClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
        );
        const { error } = await supabase.from('audit_logs').insert(log);
        if (error) {
            console.error('Failed to insert audit log', error);
        }
    } catch (err) {
        console.error('DB audit insert failed', err);
    }
});