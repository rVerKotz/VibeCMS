// app/api/audit-webhook/route.ts
import { auditWebhookReceiver } from 'intelligent-audit-trail'; 
export const POST = auditWebhookReceiver;