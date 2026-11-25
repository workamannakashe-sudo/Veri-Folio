import crypto from 'crypto';
import { canonicalizeJson } from './canonical';
import { Signer, verifyEd25519 } from './signer';
import {
  SealFields,
  SealFieldsSchema,
  SignedSeal,
  RevocationFields,
  RevocationFieldsSchema,
  SignedRevocation,
  AuditEventItem,
  SealSkillItem
} from './types';

export const CURRENT_SCHEMA_VERSION = 'verifolio-seal-v2';
export const GENESIS_HASH = '0000000000000000000000000000000000000000000000000000000000000000';

/**
 * Computes standard SHA-256 hex digest of UTF-8 string.
 */
export function computeSha256(data: string): string {
  return crypto.createHash('sha256').update(data, 'utf-8').digest('hex');
}

/**
 * Normalizes, validates, and sorts fields strictly per Build Plan v2 specifications:
 * - skills are sorted deterministically by skill `id`
 * - evidence is sorted deterministically by SHA-256 string
 */
export function buildSealFields(input: {
  school_id: string;
  entry_id: string;
  student_id: string;
  revision: number;
  key_id: string;
  title: string;
  description: string;
  category: string;
  role: string;
  start: string;
  end: string;
  skills: SealSkillItem[];
  evidence: string[];
  mentor_id: string;
  mentor_note: string;
  decided_at: string;
  schema_version?: string;
}): SealFields {
  const sortedSkills = [...input.skills].sort((a: SealSkillItem, b: SealSkillItem) => a.id.localeCompare(b.id));
  const sortedEvidence = [...input.evidence].sort((a, b) => a.localeCompare(b));

  const rawFields: SealFields = {
    schema_version: input.schema_version || CURRENT_SCHEMA_VERSION,
    school_id: input.school_id,
    entry_id: input.entry_id,
    student_id: input.student_id,
    revision: input.revision,
    key_id: input.key_id,
    title: input.title,
    description: input.description,
    category: input.category,
    role: input.role,
    start: input.start,
    end: input.end,
    skills: sortedSkills,
    evidence: sortedEvidence,
    mentor_id: input.mentor_id,
    mentor_note: input.mentor_note,
    decided_at: input.decided_at
  };

  return SealFieldsSchema.parse(rawFields);
}

/**
 * Seals an entry:
 * 1. Serializes fields using RFC 8785 canonical JSON
 * 2. Computes SHA-256 digest
 * 3. Signs digest with Ed25519 signer
 */
export function seal(fields: SealFields, signer: Signer): SignedSeal {
  const canonical = canonicalizeJson(fields);
  const digest = computeSha256(canonical);
  const signature = signer.sign(digest);

  return {
    digest,
    signature,
    key_id: signer.keyId,
    fields
  };
}

/**
 * Verifies a sealed entry:
 * 1. Checks that the revision fields yield the exact stored digest
 * 2. Verifies the Ed25519 signature against the public key
 */
export function verifySeal(
  fields: SealFields,
  storedDigest: string,
  signature: string,
  publicKeyPem: string
): boolean {
  try {
    const canonical = canonicalizeJson(fields);
    const recomputedDigest = computeSha256(canonical);

    if (recomputedDigest !== storedDigest) {
      return false;
    }

    return verifyEd25519(recomputedDigest, signature, publicKeyPem);
  } catch {
    return false;
  }
}

/**
 * Builds and signs a Revocation Event.
 * Revocation is not a simple boolean flag; it is a tamper-evident signed cryptographic event.
 */
export function buildRevocation(
  input: {
    entry_id: string;
    revision: number;
    verification_digest: string;
    revoked_by: string;
    reason: string;
    revoked_at: string;
    schema_version?: string;
  },
  signer: Signer
): SignedRevocation {
  const rawFields: RevocationFields = {
    schema_version: input.schema_version || CURRENT_SCHEMA_VERSION,
    entry_id: input.entry_id,
    revision: input.revision,
    verification_digest: input.verification_digest,
    revoked_by: input.revoked_by,
    reason: input.reason,
    revoked_at: input.revoked_at,
    key_id: signer.keyId
  };

  const fields = RevocationFieldsSchema.parse(rawFields);
  const canonical = canonicalizeJson(fields);
  const digest = computeSha256(canonical);
  const signature = signer.sign(digest);

  return {
    digest,
    signature,
    fields
  };
}

/**
 * Verifies a signed revocation record.
 */
export function verifyRevocation(
  fields: RevocationFields,
  signature: string,
  publicKeyPem: string
): boolean {
  try {
    const canonical = canonicalizeJson(fields);
    const digest = computeSha256(canonical);
    return verifyEd25519(digest, signature, publicKeyPem);
  } catch {
    return false;
  }
}

/**
 * Appends an event to a school's append-only audit hash chain:
 * event_hash = sha256(prev_event_hash || canonicalize(event))
 */
export function appendAuditEvent(params: {
  school_id: string;
  sequence: number;
  type: string;
  actor: string;
  payload: Record<string, unknown>;
  prev_hash: string;
  created_at?: string;
}): AuditEventItem {
  const createdAt = params.created_at || new Date().toISOString();
  const eventBody = {
    school_id: params.school_id,
    sequence: params.sequence,
    type: params.type,
    actor: params.actor,
    payload: params.payload,
    created_at: createdAt
  };

  const canonicalBody = canonicalizeJson(eventBody);
  const hash = computeSha256(params.prev_hash + canonicalBody);

  return {
    school_id: params.school_id,
    sequence: params.sequence,
    type: params.type,
    actor: params.actor,
    payload: params.payload,
    prev_hash: params.prev_hash,
    hash,
    created_at: createdAt
  };
}

/**
 * Validates the strict cryptographic continuity and integrity of an audit event chain.
 * Detects any modified payload, tampered hash, or missing link.
 */
export function verifyChain(events: AuditEventItem[], initialPrevHash: string = GENESIS_HASH): boolean {
  if (events.length === 0) return true;

  let expectedPrevHash = initialPrevHash;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    if (event.sequence !== i + 1) {
      return false;
    }

    if (event.prev_hash !== expectedPrevHash) {
      return false;
    }

    const eventBody = {
      school_id: event.school_id,
      sequence: event.sequence,
      type: event.type,
      actor: event.actor,
      payload: event.payload,
      created_at: event.created_at
    };

    const recomputedHash = computeSha256(event.prev_hash + canonicalizeJson(eventBody));
    if (recomputedHash !== event.hash) {
      return false;
    }

    expectedPrevHash = event.hash;
  }

  return true;
}
