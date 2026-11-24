import { z } from 'zod';

export const UserRoleSchema = z.enum(['STUDENT', 'MENTOR', 'ADMIN', 'VIEWER']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const EntryStateSchema = z.enum([
  'DRAFT',
  'REQUESTED',
  'CHANGES_REQUESTED',
  'APPROVED',
  'DECLINED',
  'REVOKED'
]);
export type EntryState = z.infer<typeof EntryStateSchema>;

export const SkillLevelSchema = z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']);
export type SkillLevel = z.infer<typeof SkillLevelSchema>;

export const SkillSourceSchema = z.enum(['STUDENT', 'AI', 'MENTOR']);
export type SkillSource = z.infer<typeof SkillSourceSchema>;

export const SealFieldsSchema = z.object({
  schema_version: z.string(),
  school_id: z.string(),
  entry_id: z.string(),
  student_id: z.string(),
  revision: z.number().int(),
  key_id: z.string(),
  title: z.string(),
  description: z.string(),
  category: z.string(),
  role: z.string(),
  start: z.string(), // YYYY-MM-DD
  end: z.string(),   // YYYY-MM-DD
  skills: z.array(
    z.object({
      id: z.string(),
      level: SkillLevelSchema
    })
  ),
  evidence: z.array(z.string()), // sorted sha256 hashes
  mentor_id: z.string(),
  mentor_note: z.string().min(20),
  decided_at: z.string() // ISO 8601 UTC
});
export type SealFields = z.infer<typeof SealFieldsSchema>;

export const SignedRevocationSchema = z.object({
  schema_version: z.string(),
  entry_id: z.string(),
  revision: z.number().int(),
  verification_digest: z.string(),
  revoked_by: z.string(),
  reason: z.string(),
  revoked_at: z.string(),
  key_id: z.string(),
  signature: z.string().optional()
});
export type SignedRevocation = z.infer<typeof SignedRevocationSchema>;

export * from './skills-data';

