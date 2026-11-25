import { describe, it, expect } from 'vitest';
import { 
  buildSealFields, 
  seal, 
  verifySeal, 
  appendAuditEvent,
  computeSha256,
  canonicalizeJson
} from '../modules/seal';
import { defaultSigner, defaultKeyRegistry } from '../modules/seal/keys';
import { memoryStore } from '../services/store';

describe('E2E Lifecycle: Student Submission -> Mentor Ed25519 Signing -> Public Verification -> Tamper Detection', () => {
  it('executes full student to verifier lifecycle and detects tampering immediately', async () => {
    // 1. Student creates an entry
    const entryId = 'e2e-entry-mars-rover';
    const schoolId = 'sch-delhi-public-01';
    const studentId = 'usr-student-e2e';
    const mentorId = 'usr-mentor-e2e';
    const keyId = defaultSigner.keyId;

    const entryData = {
      title: 'Autonomous Rover Obstacle Avoidance',
      description: 'Built Arduino lidar-based rover with pathfinding algorithm.',
      category: 'STEM & Robotics',
      role: 'Lead Firmware Architect',
      start_date: '2026-01-10',
      end_date: '2026-05-15',
      skills: [
        { id: 'sk-robotics-01', name: 'Robotics', level: 'ADVANCED' as const, source: 'STUDENT' as const },
        { id: 'sk-embedded-01', name: 'Embedded Systems', level: 'ADVANCED' as const, source: 'STUDENT' as const }
      ],
      evidence: [
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      ]
    };

    // 2. Mentor evaluates and approves -> Signs with Ed25519 private key
    const decidedAt = new Date().toISOString();
    const mentorNote = 'Observed student independently lead firmware architecture and pass obstacle course.';

    const sealFields = buildSealFields({
      school_id: schoolId,
      entry_id: entryId,
      student_id: studentId,
      revision: 1,
      key_id: keyId,
      title: entryData.title,
      description: entryData.description,
      category: entryData.category,
      role: entryData.role,
      start: entryData.start_date,
      end: entryData.end_date,
      skills: entryData.skills.map((s) => ({ id: s.id, name: s.name, level: s.level })),
      evidence: entryData.evidence,
      mentor_id: mentorId,
      mentor_note: mentorNote,
      decided_at: decidedAt
    });

    const signedSeal = seal(sealFields, defaultSigner);
    expect(signedSeal.signature).toBeDefined();
    expect(signedSeal.digest).toBeDefined();

    // 3. Append to immutable SHA-256 audit log
    const genesisHash = '0000000000000000000000000000000000000000000000000000000000000000';
    const auditEvent = appendAuditEvent({
      school_id: schoolId,
      sequence: 1,
      type: 'VERIFICATION_SEALED',
      actor: mentorId,
      payload: {
        entry_id: entryId,
        revision: 1,
        digest: signedSeal.digest,
        signature: signedSeal.signature
      },
      prev_hash: genesisHash,
      created_at: decidedAt
    });
    expect(auditEvent.hash).toHaveLength(64);

    // 4. Public Check Validation (Independent verification using Public Key)
    const publicKeyPem = defaultKeyRegistry.getPublicKeyPem(keyId);
    expect(publicKeyPem).toBeDefined();

    // Recompute digest from canonical fields
    const recomputedFields = buildSealFields({
      school_id: schoolId,
      entry_id: entryId,
      student_id: studentId,
      revision: 1,
      key_id: keyId,
      title: entryData.title,
      description: entryData.description,
      category: entryData.category,
      role: entryData.role,
      start: entryData.start_date,
      end: entryData.end_date,
      skills: entryData.skills.map((s) => ({ id: s.id, name: s.name, level: s.level })),
      evidence: entryData.evidence,
      mentor_id: mentorId,
      mentor_note: mentorNote,
      decided_at: decidedAt
    });

    const isVerified = verifySeal(recomputedFields, signedSeal.digest, signedSeal.signature, publicKeyPem!);
    expect(isVerified).toBe(true);

    // 5. Tamper with title or evidence (e.g. adversary modifies record in database)
    const tamperedFields = {
      ...recomputedFields,
      title: 'Autonomous Rover Obstacle Avoidance [TAMPERED: +100 bonus grade]'
    };

    const isTamperedDetected = verifySeal(tamperedFields, signedSeal.digest, signedSeal.signature, publicKeyPem!);
    // Cryptographic signature MUST fail on altered payload
    expect(isTamperedDetected).toBe(false);

    // Recomputed digest also diverges from the sealed digest
    const tamperedCanonical = canonicalizeJson(tamperedFields);
    const tamperedDigest = computeSha256(tamperedCanonical);
    expect(tamperedDigest).not.toBe(signedSeal.digest);
  });
});
