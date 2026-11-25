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

/**
 * State Machine Transition Matrix for Entry Revisions.
 * Enforces strict document lifecycle: only allowed transitions are permitted.
 */
export const ALLOWED_STATE_TRANSITIONS: Record<EntryState, readonly EntryState[]> = {
  DRAFT: ['REQUESTED'],
  REQUESTED: ['CHANGES_REQUESTED', 'APPROVED', 'DECLINED'],
  CHANGES_REQUESTED: ['DRAFT', 'REQUESTED'],
  APPROVED: ['REVOKED'], // Approved revisions can only be revoked; new work creates revision v+1
  DECLINED: [],          // Terminal state for this revision
  REVOKED: []           // Terminal state for this revision
} as const;

export function canTransitionEntryState(from: EntryState, to: EntryState): boolean {
  const allowed = ALLOWED_STATE_TRANSITIONS[from];
  return allowed ? (allowed as readonly string[]).includes(to) : false;
}

export function assertValidTransition(from: EntryState, to: EntryState): void {
  if (!canTransitionEntryState(from, to)) {
    throw new Error(`Invalid state transition: Cannot transition entry revision from '${from}' to '${to}'. Allowed: [${ALLOWED_STATE_TRANSITIONS[from]?.join(', ') || 'none'}]`);
  }
}

/**
 * Check if an entry revision is in an editable state.
 * Only DRAFT or CHANGES_REQUESTED may be modified by a student.
 */
export function isRevisionEditable(state: EntryState): boolean {
  return state === 'DRAFT' || state === 'CHANGES_REQUESTED';
}

export const EntryCategorySchema = z.enum(['project', 'sport', 'club']);
export type EntryCategory = z.infer<typeof EntryCategorySchema>;

export const CATEGORY_LABELS: Record<EntryCategory, string> = {
  project: 'Academic / STEM Project',
  sport: 'Athletics & Sports',
  club: 'Club & Society Leadership'
};

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

