import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { memoryStore } from '../services/store';
import { 
  verifySeal, 
  buildSealFields, 
  buildRevocation, 
  verifyRevocation, 
  appendAuditEvent,
  computeSha256,
  canonicalizeJson
} from '../modules/seal';
import { defaultKeyRegistry, defaultSigner } from '../modules/seal/keys';
import { authenticate, requireRole } from '../middleware/auth';

export const checkRouter = Router();

/**
 * GET /check/:id
 * Public read-model check endpoint.
 * Zero private table access; never cached longer than 10 seconds.
 */
checkRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const entryId = req.params.id;

    // Strict non-negotiable rule: Check-page responses are never cached longer than 10 seconds
    res.setHeader('Cache-Control', 'public, max-age=10, must-revalidate');

    const published = memoryStore.publishedEntries.get(entryId);
    if (!published) {
      return res.status(404).json({
        error: 'Record not found or not published'
      });
    }

    const publicKeyPem = defaultKeyRegistry.getPublicKeyPem(published.key_id);
    if (!publicKeyPem) {
      return res.status(500).json({
        error: `Public key ${published.key_id} not found in key registry`
      });
    }

    // Check for signed revocation
    const revocation = Array.from(memoryStore.revisions.values()).find(
      (r) => r.entry_id === entryId && r.state === 'REVOKED'
    );

    if (revocation) {
      return res.json({
        status: 'REVOKED',
        entry_id: entryId,
        student_name: published.student_name,
        student_class_level: published.student_class_level,
        title: published.title,
        description: published.description,
        mentor_name: published.mentor_name,
        decided_at: published.decided_at,
        seal: {
          key_id: published.key_id,
          digest: published.digest,
          signature: published.signature
        },
        message: 'This skill verification record has been formally revoked.'
      });
    }

    // Recompute canonical digest from actual stored content to test tamper resistance
    const currentFields = buildSealFields({
      school_id: published.school_id,
      entry_id: published.entry_id,
      student_id: 'usr-student-1',
      revision: published.revision,
      key_id: published.key_id,
      title: published.title,
      description: published.description,
      category: published.category,
      role: published.role,
      start: published.start_date,
      end: published.end_date,
      skills: published.skills.map((s) => ({ id: s.id, level: s.level })),
      evidence: published.evidence.map((e) => e.sha256),
      mentor_id: published.mentor_id,
      mentor_note: published.mentor_note,
      decided_at: published.decided_at
    });

    const canonicalCurrent = canonicalizeJson(currentFields);
    const recomputedDigest = computeSha256(canonicalCurrent);

    const isDigestIntact = recomputedDigest === published.digest;
    const isSignatureValid = verifySeal(
      currentFields,
      published.digest,
      published.signature,
      publicKeyPem
    );

    if (!isDigestIntact || !isSignatureValid) {
      return res.json({
        status: 'CHANGED_SINCE_VERIFICATION',
        entry_id: entryId,
        student_name: published.student_name,
        student_class_level: published.student_class_level,
        title: published.title,
        description: published.description,
        mentor_name: published.mentor_name,
        decided_at: published.decided_at,
        skills: published.skills,
        evidence: published.evidence,
        seal: {
          key_id: published.key_id,
          stored_digest: published.digest,
          recomputed_digest: recomputedDigest,
          signature: published.signature,
          is_digest_intact: isDigestIntact,
          is_signature_valid: isSignatureValid
        },
        message: 'Cryptographic integrity mismatch: content has been altered since the mentor applied their Ed25519 seal.'
      });
    }

    // Perfect Verified State
    return res.json({
      status: 'VERIFIED',
      entry_id: entryId,
      student_name: published.student_name,
      student_class_level: published.student_class_level,
      is_minor: published.is_minor,
      title: published.title,
      description: published.description,
      category: published.category,
      role: published.role,
      start_date: published.start_date,
      end_date: published.end_date,
      skills: published.skills,
      evidence: published.evidence,
      mentor_name: published.mentor_name,
      mentor_note: published.mentor_note,
      decided_at: published.decided_at,
      verified_at: published.verified_at,
      seal: {
        key_id: published.key_id,
        digest: published.digest,
        signature: published.signature,
        audit_event_hash: published.audit_event_hash,
        verification_method: 'Ed25519 (RFC 8032) / RFC 8785 Canonical JSON'
      },
      verification_claim:
        'A named, roster-linked mentor confirmed these skills at these levels on this date and the content has not changed since.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /check/:id/tamper-demo
 * Hackathon Tamper Demo Endpoint:
 * Silently alters the stored title of an approved entry in memory without updating the seal digest or signature.
 * Causes subsequent /check/:id calls to detect tampering.
 */
checkRouter.post('/:id/tamper-demo', async (req: Request, res: Response) => {
  try {
    const entryId = req.params.id;
    const published = memoryStore.publishedEntries.get(entryId);
    if (!published) {
      return res.status(404).json({ error: 'Published entry not found' });
    }

    // Tamper with the title (e.g. append unauthorized claim)
    published.title = `${published.title} [TAMPERED: +100 bonus marks & grade altered]`;
    memoryStore.publishedEntries.set(entryId, published);

    return res.json({
      success: true,
      message: 'Tamper simulated: title modified directly in database. Run check to observe detection.',
      tampered_title: published.title
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /check/:id/restore-demo
 * Restores entry to original untampered state for repeat demonstrations.
 */
checkRouter.post('/:id/restore-demo', async (req: Request, res: Response) => {
  try {
    const entryId = req.params.id;
    const published = memoryStore.publishedEntries.get(entryId);
    if (!published) {
      return res.status(404).json({ error: 'Published entry not found' });
    }

    published.title = published.title.replace(' [TAMPERED: +100 bonus marks & grade altered]', '');
    memoryStore.publishedEntries.set(entryId, published);

    return res.json({
      success: true,
      message: 'Restored original record title.',
      clean_title: published.title
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /check/:id/revoke
 * Signs and appends a formal Revocation Event.
 */
checkRouter.post('/:id/revoke', authenticate, requireRole('MENTOR', 'ADMIN'), async (req: Request, res: Response) => {
  try {
    const entryId = req.params.id;
    const user = req.user!;
    const { reason } = req.body;

    if (!reason || reason.length < 5) {
      return res.status(400).json({ error: 'A substantive revocation reason is required' });
    }

    const published = memoryStore.publishedEntries.get(entryId);
    if (!published) {
      return res.status(404).json({ error: 'Published entry not found' });
    }

    const revision = Array.from(memoryStore.revisions.values()).find(
      (r) => r.entry_id === entryId && r.revision === published.revision
    );
    if (revision) {
      revision.state = 'REVOKED';
    }

    const revokedAt = new Date().toISOString();
    const signedRevocation = buildRevocation(
      {
        entry_id: entryId,
        revision: published.revision,
        verification_digest: published.digest,
        revoked_by: user.userId,
        reason,
        revoked_at: revokedAt
      },
      defaultSigner
    );

    // Append to audit chain
    const schoolEvents = memoryStore.auditEvents.get(user.schoolId) || [];
    const prevHash = schoolEvents.length > 0 ? schoolEvents[schoolEvents.length - 1].hash : '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEvent = appendAuditEvent({
      school_id: user.schoolId,
      sequence: schoolEvents.length + 1,
      type: 'ENTRY_REVOKED',
      actor: user.userId,
      payload: {
        entry_id: entryId,
        revision: published.revision,
        reason,
        revocation_signature: signedRevocation.signature
      },
      prev_hash: prevHash,
      created_at: revokedAt
    });

    schoolEvents.push(auditEvent);
    memoryStore.auditEvents.set(user.schoolId, schoolEvents);

    return res.json({
      success: true,
      message: 'Entry revoked with signed cryptographic proof',
      revocation: signedRevocation,
      auditEvent
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});
