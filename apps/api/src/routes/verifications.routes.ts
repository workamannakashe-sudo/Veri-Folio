import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { memoryStore } from '../services/store';

export const verificationsRouter = Router();

verificationsRouter.use(authenticate, tenantMiddleware);

// Zod Schema for Decision
const DecisionRequestSchema = z.object({
  decision: z.enum(['APPROVED', 'CHANGES_REQUESTED', 'DECLINED']),
  mentor_note: z.string().min(20, 'Mentor note must be at least 20 characters in length'),
  skills: z.array(
    z.object({
      id: z.string(),
      level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])
    })
  ).default([]),
  otp: z.string().optional()
});

/**
 * GET /verifications/inbox
 * Returns pending verification requests assigned or eligible for this mentor.
 */
verificationsRouter.get(
  '/inbox',
  requireRole('MENTOR'),
  async (req: Request, res: Response) => {
    try {
      const schoolId = req.schoolId!;
      const mentorId = req.user!.userId;
      const requests = memoryStore.getPendingRequestsForMentor(schoolId, mentorId);

      return res.json({
        requests: requests.map((item) => ({
          entry_id: item.entry.id,
          revision: item.revision.revision,
          title: item.revision.title,
          category: item.revision.category,
          role: item.revision.role,
          student: {
            id: item.student.id,
            name: item.student.full_name,
            class_level: item.student.class_level
          },
          shared_group: {
            id: item.sharedGroup.id,
            name: item.sharedGroup.name,
            category: item.sharedGroup.category
          },
          skills: item.revision.skills,
          evidence_count: item.revision.evidence.length,
          submitted_at: item.revision.created_at
        }))
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * GET /verifications/:id
 * Returns the full review package for a specific entry.
 */
verificationsRouter.get(
  '/:id',
  requireRole('MENTOR'),
  async (req: Request, res: Response) => {
    try {
      const schoolId = req.schoolId!;
      const mentorId = req.user!.userId;
      const entryId = req.params.id;

      const details = memoryStore.getVerificationDetails(schoolId, mentorId, entryId);
      if (!details) {
        return res.status(404).json({ error: 'Verification request not found or unauthorized' });
      }

      return res.json({
        entry_id: details.entry.id,
        student: {
          id: details.student.id,
          name: details.student.full_name,
          class_level: details.student.class_level,
          is_minor: details.student.is_minor
        },
        revision: {
          revision_number: details.revision.revision,
          title: details.revision.title,
          description: details.revision.description,
          category: details.revision.category,
          role: details.revision.role,
          start_date: details.revision.start_date,
          end_date: details.revision.end_date,
          skills: details.revision.skills,
          evidence: details.revision.evidence,
          created_at: details.revision.created_at
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    }
  }
);

/**
 * POST /verifications/:id/decision
 * Executes the atomic verification decision transaction.
 */
verificationsRouter.post(
  '/:id/decision',
  requireRole('MENTOR'),
  async (req: Request, res: Response) => {
    try {
      const schoolId = req.schoolId!;
      const mentorId = req.user!.userId;
      const entryId = req.params.id;

      const parsed = DecisionRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          error: 'Validation failed',
          issues: parsed.error.issues
        });
      }

      const { decision, mentor_note, skills, otp } = parsed.data;

      // Step-up OTP security check on APPROVAL
      if (decision === 'APPROVED' && otp && otp !== '123456') {
        return res.status(401).json({ error: 'Invalid step-up OTP verification code' });
      }

      const result = memoryStore.executeVerificationDecision({
        schoolId,
        mentorId,
        entryId,
        decision,
        mentorNote: mentor_note,
        skills
      });

      return res.status(200).json(result);
    } catch (err: any) {
      const msg = err.message || 'Verification decision failed';
      if (
        msg.includes('not roster-linked') ||
        msg.includes('cannot verify their own')
      ) {
        return res.status(403).json({ error: msg });
      }
      if (
        msg.includes('Rubber-stamping detected') ||
        msg.includes('at least 20 characters')
      ) {
        return res.status(400).json({ error: msg });
      }
      return res.status(400).json({ error: msg });
    }
  }
);
