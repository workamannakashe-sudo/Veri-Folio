import { z } from 'zod';
import { SkillLevelSchema } from '@verifolio/shared';

export const SealSkillItemSchema = z.object({
  id: z.string(),
  level: SkillLevelSchema
});
export type SealSkillItem = z.infer<typeof SealSkillItemSchema>;

export const SealFieldsSchema = z.object({
  schema_version: z.string(),
  school_id: z.string(),
  entry_id: z.string(),
  student_id: z.string(),
  revision: z.number().int().positive(),
  key_id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  role: z.string(),
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start must be YYYY-MM-DD'),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end must be YYYY-MM-DD'),
  skills: z.array(SealSkillItemSchema),
  evidence: z.array(z.string().regex(/^[a-f0-9]{64}$/, 'evidence must be 64-char sha256 hex')),
  mentor_id: z.string(),
  mentor_note: z.string().min(20, 'mentor_note must be at least 20 characters'),
  decided_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/, 'decided_at must be ISO 8601 UTC')
});
export type SealFields = z.infer<typeof SealFieldsSchema>;

export const RevocationFieldsSchema = z.object({
  schema_version: z.string(),
  entry_id: z.string(),
  revision: z.number().int().positive(),
  verification_digest: z.string().regex(/^[a-f0-9]{64}$/),
  revoked_by: z.string(),
  reason: z.string(),
  revoked_at: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/),
  key_id: z.string()
});
export type RevocationFields = z.infer<typeof RevocationFieldsSchema>;

export interface SignedSeal {
  digest: string;
  signature: string;
  key_id: string;
  fields: SealFields;
}

export interface SignedRevocation {
  digest: string;
  signature: string;
  fields: RevocationFields;
}

export interface AuditEventItem {
  school_id: string;
  sequence: number;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  hash: string;
  created_at: string;
}
