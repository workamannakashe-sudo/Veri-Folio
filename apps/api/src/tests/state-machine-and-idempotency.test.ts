import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { memoryStore } from '../services/store';
import { 
  canTransitionEntryState, 
  assertValidTransition, 
  isRevisionEditable,
  ALLOWED_STATE_TRANSITIONS 
} from '@verifolio/shared';

describe('Document Lifecycle & State Machine (Phase 1.3)', () => {
  it('allows valid state transitions', () => {
    expect(canTransitionEntryState('DRAFT', 'REQUESTED')).toBe(true);
    expect(canTransitionEntryState('REQUESTED', 'APPROVED')).toBe(true);
    expect(canTransitionEntryState('REQUESTED', 'CHANGES_REQUESTED')).toBe(true);
    expect(canTransitionEntryState('REQUESTED', 'DECLINED')).toBe(true);
    expect(canTransitionEntryState('APPROVED', 'REVOKED')).toBe(true);
    expect(canTransitionEntryState('CHANGES_REQUESTED', 'DRAFT')).toBe(true);
  });

  it('rejects invalid or illegal state transitions', () => {
    expect(canTransitionEntryState('DRAFT', 'APPROVED')).toBe(false); // Student cannot self-approve
    expect(canTransitionEntryState('APPROVED', 'DRAFT')).toBe(false); // Approved revisions are immutable
    expect(canTransitionEntryState('DECLINED', 'APPROVED')).toBe(false); // Terminal
    expect(canTransitionEntryState('REVOKED', 'APPROVED')).toBe(false); // Terminal

    expect(() => assertValidTransition('DRAFT', 'APPROVED')).toThrow(/Invalid state transition/);
  });

  it('only permits editing when in DRAFT or CHANGES_REQUESTED', () => {
    expect(isRevisionEditable('DRAFT')).toBe(true);
    expect(isRevisionEditable('CHANGES_REQUESTED')).toBe(true);
    expect(isRevisionEditable('REQUESTED')).toBe(false);
    expect(isRevisionEditable('APPROVED')).toBe(false);
    expect(isRevisionEditable('DECLINED')).toBe(false);
    expect(isRevisionEditable('REVOKED')).toBe(false);
  });
});

describe('Idempotency & Admin Audit Integrity (AUD-004 & Phase 1.6)', () => {
  let adminToken: string;

  beforeEach(async () => {
    memoryStore.seedDefaults();

    // Authenticate as ADMIN
    const loginRes = await request(app)
      .post('/auth/demo-login')
      .send({ role: 'ADMIN' });
    adminToken = loginRes.body.accessToken;
  });

  it('GET /admin/audit/integrity returns live chain status and counts (AUD-004 fix)', async () => {
    const res = await request(app)
      .get('/admin/audit/integrity')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(res.body.chain_continuous).toBe(true);
    expect(typeof res.body.total_events).toBe('number');
    expect(typeof res.body.head_hash).toBe('string');
    expect(res.body.students_count).toBeGreaterThanOrEqual(1);
    expect(res.body.mentors_count).toBeGreaterThanOrEqual(1);
  });

  it('GET /admin/audit/events returns immutable audit log array', async () => {
    const res = await request(app)
      .get('/admin/audit/events')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
  });

  it('Idempotency-Key prevents duplicate state mutations and replays cached response', async () => {
    const idempotencyKey = `idemp-test-${Date.now()}`;

    // First request
    const firstRes = await request(app)
      .post('/admin/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ name: 'Robotics Team B', category: 'CLUB' });

    expect(firstRes.status).toBe(201);
    const createdGroupId = firstRes.body.group.id;

    // Duplicate retry request with same Idempotency-Key
    const secondRes = await request(app)
      .post('/admin/groups')
      .set('Authorization', `Bearer ${adminToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ name: 'Robotics Team B', category: 'CLUB' });

    expect(secondRes.status).toBe(201);
    expect(secondRes.headers['x-idempotent-replay']).toBe('true');
    expect(secondRes.body.group.id).toBe(createdGroupId); // Returns exact same resource without duplicating
  });
});

describe('Dynamic Dashboards (AUD-003 fix)', () => {
  it('GET /dashboard/student returns live dynamic entries and counts', async () => {
    const loginRes = await request(app)
      .post('/auth/demo-login')
      .send({ role: 'STUDENT' });
    const studentToken = loginRes.body.accessToken;

    const res = await request(app)
      .get('/dashboard/student')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('STUDENT');
    expect(Array.isArray(res.body.entries)).toBe(true);
    expect(typeof res.body.pendingDecisions).toBe('number');
    expect(typeof res.body.publishedCount).toBe('number');
  });

  it('GET /dashboard/mentor returns live pending requests and confirmed counts', async () => {
    const loginRes = await request(app)
      .post('/auth/demo-login')
      .send({ role: 'MENTOR' });
    const mentorToken = loginRes.body.accessToken;

    const res = await request(app)
      .get('/dashboard/mentor')
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.role).toBe('MENTOR');
    expect(Array.isArray(res.body.requests)).toBe(true);
    expect(typeof res.body.confirmedCount).toBe('number');
  });
});
