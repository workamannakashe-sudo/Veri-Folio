import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { authenticate, requireRole } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';
import { memoryStore } from '../services/store';

export const entriesRouter = Router();

entriesRouter.use(authenticate, tenantMiddleware);

const CreateEntrySchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  category: z.enum(['project', 'sport', 'club']),
  role: z.string().min(2),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  skills: z.array(
    z.object({
      id: z.string(),
      level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
      source: z.enum(['STUDENT', 'AI', 'MENTOR']).default('STUDENT'),
      reason: z.string().optional()
    })
  ).default([]),
  evidence: z.array(
    z.object({
      object_key: z.string(),
      sha256: z.string().regex(/^[a-f0-9]{64}$/),
      mime_type: z.string(),
      file_size: z.number().int().positive(),
      scan_status: z.enum(['PENDING', 'PASSED', 'FAILED']).default('PENDING')
    })
  ).default([])
});

// 1. List current student entries
entriesRouter.get('/', requireRole('STUDENT'), (req, res) => {
  const schoolId = req.schoolId!;
  const studentId = req.user!.userId;

  const userEntries = Array.from(memoryStore.entries.values())
    .filter((e) => e.school_id === schoolId && e.student_id === studentId)
    .map((e) => {
      const rev = Array.from(memoryStore.revisions.values()).find(
        (r) => r.entry_id === e.id && r.revision === e.current_revision
      );
      return {
        ...e,
        revision: rev
      };
    });

  res.json({ entries: userEntries });
});

// 1.5 Get eligible mentors for the authenticated student (general)
entriesRouter.get('/mentors/eligible', requireRole('STUDENT'), (req, res) => {
  const schoolId = req.schoolId!;
  const studentId = req.user!.userId;

  const mentors = memoryStore.getEligibleMentorsForStudent(schoolId, studentId);

  return res.json({
    student_id: studentId,
    eligible_mentors: mentors.map((m) => ({
      id: m.id,
      name: m.full_name,
      email: m.email
    }))
  });
});

// 2. Create new entry & draft revision
entriesRouter.post('/', requireRole('STUDENT'), (req, res) => {
  const parse = CreateEntrySchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: 'Validation failed', details: parse.error });
  }

  const schoolId = req.schoolId!;
  const studentId = req.user!.userId;
  const entryId = `entry-${crypto.randomUUID()}`;
  const now = new Date().toISOString();

  const entry = {
    id: entryId,
    school_id: schoolId,
    student_id: studentId,
    category: parse.data.category,
    current_revision: 1,
    created_at: now,
    updated_at: now
  };

  const revision = {
    id: `rev-${crypto.randomUUID()}`,
    school_id: schoolId,
    entry_id: entryId,
    revision: 1,
    state: 'DRAFT' as const,
    title: parse.data.title,
    description: parse.data.description,
    category: parse.data.category,
    role: parse.data.role,
    start_date: parse.data.start_date,
    end_date: parse.data.end_date,
    skills: parse.data.skills,
    evidence: parse.data.evidence,
    created_at: now,
    updated_at: now
  };

  memoryStore.entries.set(entryId, entry);
  memoryStore.revisions.set(revision.id, revision);

  return res.status(201).json({
    message: 'Entry created in DRAFT state.',
    entry,
    revision
  });
});

// 3. Get single entry with current revision
entriesRouter.get('/:id', (req, res) => {
  const schoolId = req.schoolId!;
  const entryId = req.params.id;

  const entry = memoryStore.entries.get(entryId);
  if (!entry || entry.school_id !== schoolId) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  const revision = Array.from(memoryStore.revisions.values()).find(
    (r) => r.entry_id === entryId && r.revision === entry.current_revision
  );

  return res.json({ entry, revision });
});

// 4. Pre-signed upload URL for evidence
entriesRouter.post('/:id/evidence/upload-url', requireRole('STUDENT'), (req, res) => {
  const schoolId = req.schoolId!;
  const entryId = req.params.id;

  const entry = memoryStore.entries.get(entryId);
  if (!entry || entry.school_id !== schoolId) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  const { filename, mime_type, file_size } = req.body;
  const allowedMime = ['image/png', 'image/jpeg', 'application/pdf', 'video/mp4'];
  const maxBytes = 25 * 1024 * 1024; // 25MB limit

  if (!mime_type || !allowedMime.includes(mime_type)) {
    return res.status(400).json({ error: `Unsupported file type. Allowed: ${allowedMime.join(', ')}` });
  }

  if (file_size && file_size > maxBytes) {
    return res.status(400).json({ error: 'File size exceeds maximum 25MB limit.' });
  }

  const objectKey = `evidence/${schoolId}/${entryId}/${crypto.randomUUID()}-${filename || 'file'}`;
  const uploadUrl = `http://localhost:9000/verifolio-evidence/${objectKey}?signature=mock-presigned-url`;

  return res.json({
    object_key: objectKey,
    upload_url: uploadUrl,
    max_size: maxBytes
  });
});

// 5. Eligible Mentors for an entry (STRICT ROSTER LINK CHECK)
// Only mentors who share a group membership (class, club, or team) with this student are returned!
entriesRouter.get('/:id/eligible-mentors', requireRole('STUDENT'), (req, res) => {
  const schoolId = req.schoolId!;
  const entryId = req.params.id;

  const entry = memoryStore.entries.get(entryId);
  if (!entry || entry.school_id !== schoolId) {
    return res.status(404).json({ error: 'Entry not found' });
  }

  const mentors = memoryStore.getEligibleMentorsForStudent(schoolId, entry.student_id);

  return res.json({
    student_id: entry.student_id,
    eligible_mentors: mentors.map((m) => ({
      id: m.id,
      name: m.full_name,
      email: m.email
    }))
  });
});

// 6. Request Verification from linked mentor
entriesRouter.post('/:id/request-verification', requireRole('STUDENT'), (req, res) => {
  const schoolId = req.schoolId!;
  const entryId = req.params.id;
  const studentId = req.user!.userId;
  const { mentor_id } = req.body;

  if (!mentor_id) {
    return res.status(400).json({ error: 'mentor_id is required' });
  }

  const entry = memoryStore.entries.get(entryId);
  if (!entry || entry.school_id !== schoolId || entry.student_id !== studentId) {
    return res.status(404).json({ error: 'Entry not found or access denied' });
  }

  // Verify mentor is eligible through group roster link
  const eligibleMentors = memoryStore.getEligibleMentorsForStudent(schoolId, studentId);
  const isEligible = eligibleMentors.some((m) => m.id === mentor_id);

  if (!isEligible) {
    return res.status(403).json({
      error: 'Security Violation: Selected mentor is not linked to this student through school roster.'
    });
  }

  const revision = Array.from(memoryStore.revisions.values()).find(
    (r) => r.entry_id === entryId && r.revision === entry.current_revision
  );

  if (!revision) {
    return res.status(404).json({ error: 'Current revision not found' });
  }

  if (revision.state !== 'DRAFT' && revision.state !== 'CHANGES_REQUESTED') {
    return res.status(400).json({ error: `Cannot request verification from state '${revision.state}'` });
  }

  revision.state = 'REQUESTED';
  revision.assigned_mentor_id = mentor_id;
  revision.updated_at = new Date().toISOString();

  return res.json({
    message: 'Verification requested successfully. Revision is frozen pending mentor review.',
    entry,
    revision
  });
});
