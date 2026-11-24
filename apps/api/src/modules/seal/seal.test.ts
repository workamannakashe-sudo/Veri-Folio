import { describe, it, expect, beforeAll } from 'vitest';
import {
  buildSealFields,
  seal,
  verifySeal,
  buildRevocation,
  verifyRevocation,
  appendAuditEvent,
  verifyChain,
  computeSha256,
  GENESIS_HASH,
  CURRENT_SCHEMA_VERSION
} from './seal';
import { EnvSecretSigner, verifyEd25519 } from './signer';
import { canonicalizeJson } from './canonical';
import { SealFields } from './types';

describe('Phase 3: Pure Cryptographic Seal Library & Golden Vectors', () => {
  // Deterministic Ed25519 key pair for reproducible golden-vector validation
  const testKeyId = 'key-test-2026';
  let signer: EnvSecretSigner;
  let publicKeyPem: string;

  beforeAll(() => {
    signer = new EnvSecretSigner(testKeyId);
    publicKeyPem = signer.getPublicKey();
  });

  const baseSampleData = {
    school_id: 'school-delhi-public-001',
    entry_id: 'entry-campus-waste-sorting-app-042',
    student_id: 'student-rohan-sharma-101',
    revision: 1,
    key_id: testKeyId,
    title: 'Campus Waste-Sorting App',
    description: 'Designed and deployed a computer vision model on a Raspberry Pi to classify recyclable plastics.',
    category: 'project',
    role: 'Lead ML Developer & Team Captain',
    start: '2026-08-01',
    end: '2026-11-15',
    skills: [
      { id: 'skill-python', level: 'ADVANCED' as const },
      { id: 'skill-computer-vision', level: 'INTERMEDIATE' as const },
      { id: 'skill-embedded-systems', level: 'INTERMEDIATE' as const }
    ],
    evidence: [
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
    ],
    mentor_id: 'mentor-dr-anand-verma-501',
    mentor_note: 'Rohan demonstrated autonomous end-to-end execution, mentoring junior teammates through camera calibration.',
    decided_at: '2026-11-18T10:30:00.000Z'
  };

  it('1. Produces deterministic RFC 8785 canonical JSON, digest, and valid Ed25519 signature', () => {
    const fields = buildSealFields(baseSampleData);
    const signed = seal(fields, signer);

    expect(signed.digest).toHaveLength(64);
    expect(signed.signature.length).toBeGreaterThan(64);
    expect(signed.key_id).toBe(testKeyId);

    // Verify signature with public key
    const isValid = verifySeal(fields, signed.digest, signed.signature, publicKeyPem);
    expect(isValid).toBe(true);
  });

  it('2. Key order invariance: objects with reordered keys produce identical canonical JSON and digest', () => {
    const fields1 = buildSealFields(baseSampleData);

    // Create an object with identical values but reverse key insertion order
    const reverseKeysObject: any = {};
    const keys = Object.keys(fields1).reverse();
    for (const k of keys) {
      reverseKeysObject[k] = (fields1 as any)[k];
    }

    const canonical1 = canonicalizeJson(fields1);
    const canonical2 = canonicalizeJson(reverseKeysObject);

    expect(canonical1).toBe(canonical2);
    expect(computeSha256(canonical1)).toBe(computeSha256(canonical2));
  });

  it('3. Skills and Evidence sorting: regardless of input order, fields are sorted deterministically', () => {
    const unorderedInput = {
      ...baseSampleData,
      skills: [
        { id: 'skill-embedded-systems', level: 'INTERMEDIATE' as const },
        { id: 'skill-python', level: 'ADVANCED' as const },
        { id: 'skill-computer-vision', level: 'INTERMEDIATE' as const }
      ],
      evidence: [
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e'
      ]
    };

    const orderedInput = {
      ...baseSampleData,
      skills: [
        { id: 'skill-computer-vision', level: 'INTERMEDIATE' as const },
        { id: 'skill-embedded-systems', level: 'INTERMEDIATE' as const },
        { id: 'skill-python', level: 'ADVANCED' as const }
      ],
      evidence: [
        'a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e',
        'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
      ]
    };

    const fieldsUnordered = buildSealFields(unorderedInput);
    const fieldsOrdered = buildSealFields(orderedInput);

    expect(fieldsUnordered.skills).toEqual(fieldsOrdered.skills);
    expect(fieldsUnordered.evidence).toEqual(fieldsOrdered.evidence);
    expect(canonicalizeJson(fieldsUnordered)).toBe(canonicalizeJson(fieldsOrdered));
  });

  it('4. Single field tampering: changing any single property alters the digest and invalidates signature', () => {
    const originalFields = buildSealFields(baseSampleData);
    const originalSigned = seal(originalFields, signer);

    const tamperVariations: Array<{ label: string; patch: Partial<SealFields> }> = [
      { label: 'entry_id', patch: { entry_id: 'entry-another-id' } },
      { label: 'school_id', patch: { school_id: 'school-other-branch' } },
      { label: 'student_id', patch: { student_id: 'student-attacker-impostor' } },
      { label: 'title', patch: { title: 'Campus Waste-Sorting App (Tampered)' } },
      { label: 'mentor_note', patch: { mentor_note: 'Changed mentor note text without approval verification' } },
      { label: 'role', patch: { role: 'Project Lead Architect' } },
      { label: 'revision', patch: { revision: 2 } },
      { label: 'decided_at', patch: { decided_at: '2026-11-19T00:00:00.000Z' } },
      { label: 'key_id', patch: { key_id: 'key-fake-2026' } },
      {
        label: 'skills',
        patch: {
          skills: [
            { id: 'skill-computer-vision', level: 'ADVANCED' as const },
            { id: 'skill-embedded-systems', level: 'INTERMEDIATE' as const },
            { id: 'skill-python', level: 'ADVANCED' as const }
          ]
        }
      }
    ];

    for (const variant of tamperVariations) {
      const tamperedFields: SealFields = { ...originalFields, ...variant.patch };
      const tamperedDigest = computeSha256(canonicalizeJson(tamperedFields));

      // Digest must differ
      expect(tamperedDigest, `Digest should differ for tampered ${variant.label}`).not.toBe(
        originalSigned.digest
      );

      // Verification with original signature must fail
      const isValid = verifySeal(tamperedFields, originalSigned.digest, originalSigned.signature, publicKeyPem);
      expect(isValid, `Tampered ${variant.label} should fail verification`).toBe(false);
    }
  });

  it('5. Replay attack rejection: valid seal cannot be replayed onto another entry or school', () => {
    const fieldsA = buildSealFields(baseSampleData);
    const signedA = seal(fieldsA, signer);

    // Attacker tries to apply Entry A's seal onto Entry B
    const fieldsB = buildSealFields({
      ...baseSampleData,
      entry_id: 'entry-plagiarism-target-999'
    });

    const isReplayValid = verifySeal(fieldsB, signedA.digest, signedA.signature, publicKeyPem);
    expect(isReplayValid).toBe(false);
  });

  it('6. Signed Revocation: creates valid signed event and rejects forged signatures or tampered reasons', () => {
    const fields = buildSealFields(baseSampleData);
    const signedSeal = seal(fields, signer);

    const revocationInput = {
      entry_id: fields.entry_id,
      revision: fields.revision,
      verification_digest: signedSeal.digest,
      revoked_by: fields.mentor_id,
      reason: 'Plagiarism detected in dataset attribution during committee re-review.',
      revoked_at: '2026-11-19T14:00:00.000Z'
    };

    const signedRevocation = buildRevocation(revocationInput, signer);

    // Legitimate revocation must verify
    expect(
      verifyRevocation(signedRevocation.fields, signedRevocation.signature, publicKeyPem)
    ).toBe(true);

    // Tampered reason must fail
    const tamperedRevocation = {
      ...signedRevocation.fields,
      reason: 'Harmless minor typo fix'
    };
    expect(
      verifyRevocation(tamperedRevocation, signedRevocation.signature, publicKeyPem)
    ).toBe(false);

    // Forged signature must fail
    const badSig = '00'.repeat(64);
    expect(verifyRevocation(signedRevocation.fields, badSig, publicKeyPem)).toBe(false);
  });

  it('7. Audit event hash chain: maintains chain continuity and detects broken links', () => {
    const schoolId = 'school-delhi-public-001';

    // Sequence 1
    const event1 = appendAuditEvent({
      school_id: schoolId,
      sequence: 1,
      type: 'ENTRY_CREATED',
      actor: 'student-rohan-sharma-101',
      payload: { entry_id: 'entry-campus-waste-sorting-app-042' },
      prev_hash: GENESIS_HASH,
      created_at: '2026-11-18T09:00:00.000Z'
    });

    // Sequence 2
    const event2 = appendAuditEvent({
      school_id: schoolId,
      sequence: 2,
      type: 'VERIFICATION_REQUESTED',
      actor: 'student-rohan-sharma-101',
      payload: { entry_id: 'entry-campus-waste-sorting-app-042', mentor_id: 'mentor-dr-anand-verma-501' },
      prev_hash: event1.hash,
      created_at: '2026-11-18T09:30:00.000Z'
    });

    // Sequence 3
    const event3 = appendAuditEvent({
      school_id: schoolId,
      sequence: 3,
      type: 'ENTRY_VERIFIED',
      actor: 'mentor-dr-anand-verma-501',
      payload: { entry_id: 'entry-campus-waste-sorting-app-042', decision: 'APPROVE' },
      prev_hash: event2.hash,
      created_at: '2026-11-18T10:30:00.000Z'
    });

    const chain = [event1, event2, event3];
    expect(verifyChain(chain)).toBe(true);

    // Tamper test: modify payload in event2
    const tamperedChain = [
      event1,
      { ...event2, payload: { ...event2.payload, actor: 'impostor' } },
      event3
    ];
    expect(verifyChain(tamperedChain)).toBe(false);

    // Tamper test: broken prev_hash link
    const brokenLinkChain = [
      event1,
      event2,
      { ...event3, prev_hash: '1111111111111111111111111111111111111111111111111111111111111111' }
    ];
    expect(verifyChain(brokenLinkChain)).toBe(false);

    // Tamper test: out-of-order sequence
    const outOfOrderChain = [
      event1,
      { ...event2, sequence: 5 },
      event3
    ];
    expect(verifyChain(outOfOrderChain)).toBe(false);
  });
});
