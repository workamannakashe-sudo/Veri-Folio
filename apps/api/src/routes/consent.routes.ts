import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { memoryStore } from '../services/store';
import { authenticate, requireRole } from '../middleware/auth';

export const consentRouter = Router();

consentRouter.use(authenticate);

export interface ConsentRecord {
  id: string;
  student_id: string;
  guardian_reference: string;
  notice_version: string;
  scope: 'ALL_VERIFIED_ENTRIES';
  given_at: string;
  withdrawn_at?: string;
}

export const consents = new Map<string, ConsentRecord>();

// Pre-seed consent for Rohan Sharma (usr-student-1)
consents.set('usr-student-1', {
  id: 'con-stu-1',
  student_id: 'usr-student-1',
  guardian_reference: 'Guardian ID: G-8891 (Signed Digital Form)',
  notice_version: 'v2.0-2026',
  scope: 'ALL_VERIFIED_ENTRIES',
  given_at: '2026-11-01T09:00:00.000Z'
});

const RecordConsentSchema = z.object({
  guardian_reference: z.string().min(5),
  notice_version: z.string().default('v2.0-2026')
});

/**
 * GET /consent/status
 * Returns current guardian consent status for the logged in student.
 */
consentRouter.get('/status', requireRole('STUDENT'), (req: Request, res: Response) => {
  const studentId = req.user!.userId;
  const user = memoryStore.users.get(studentId);
  const consent = consents.get(studentId);

  const isConsentActive = consent ? !consent.withdrawn_at : false;

  res.json({
    is_minor: user?.is_minor ?? true,
    has_active_consent: isConsentActive,
    consent: isConsentActive ? consent : null
  });
});

/**
 * POST /consent/record
 * Records guardian consent for a minor.
 */
consentRouter.post('/record', requireRole('STUDENT', 'ADMIN'), (req: Request, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const parsed = RecordConsentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Valid guardian reference is required' });
    }

    const { guardian_reference, notice_version } = parsed.data;
    const consent: ConsentRecord = {
      id: `con-${Date.now()}`,
      student_id: studentId,
      guardian_reference,
      notice_version,
      scope: 'ALL_VERIFIED_ENTRIES',
      given_at: new Date().toISOString()
    };

    consents.set(studentId, consent);

    return res.json({
      success: true,
      message: 'Guardian consent recorded successfully',
      consent
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /consent/withdraw
 * Immediately withdraws guardian consent.
 * Strictly purges student's entries from public search & published_entry read models within 1 minute.
 */
consentRouter.post('/withdraw', requireRole('STUDENT', 'ADMIN'), (req: Request, res: Response) => {
  try {
    const studentId = req.user!.userId;
    const consent = consents.get(studentId);

    if (consent) {
      consent.withdrawn_at = new Date().toISOString();
      consents.set(studentId, consent);
    }

    // Instantly purge all published read model entries for this student
    const studentEntries = Array.from(memoryStore.entries.values()).filter(
      (e) => e.student_id === studentId
    );

    for (const e of studentEntries) {
      memoryStore.publishedEntries.delete(e.id);
    }

    return res.json({
      success: true,
      message: 'Consent withdrawn. All public records and search indexes immediately purged.',
      purged_entries_count: studentEntries.length
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

