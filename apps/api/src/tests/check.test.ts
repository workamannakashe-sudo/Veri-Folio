import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { memoryStore } from '../services/store';

describe('Phase 5: Check Page, Cryptographic Tamper Detection & Signed Revocation', () => {
  let mentorToken: string;

  beforeAll(async () => {
    // 1. Authenticate linked mentor (Dr. Anand Verma)
    await request(app)
      .post('/auth/request-otp')
      .send({ email: 'bob.mentor@school1.edu', schoolId: 'school-demo-1' });

    const mentorRes = await request(app)
      .post('/auth/verify-otp')
      .send({ email: 'bob.mentor@school1.edu', code: '123456' });

    mentorToken = mentorRes.body.accessToken;

    // 2. Ensure sample entry is approved & sealed
    await request(app)
      .post('/verifications/ent-sample-rover/decision')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        decision: 'APPROVED',
        mentor_note: 'Rohan demonstrated exceptional initiative in designing the optical sorting mechanism and debugging the motor control firmware during the campus robotics exhibition.',
        skills: [
          { id: 'sk-robotics-mechatronics', level: 'ADVANCED' },
          { id: 'sk-microcontroller-programming', level: 'INTERMEDIATE' }
        ],
        otp: '123456'
      });
  });

  it('1. GET /check/:id - returns VERIFIED status and enforces Cache-Control <= 10s', async () => {
    const res = await request(app).get('/check/ent-sample-rover');

    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('public, max-age=10, must-revalidate');
    expect(res.body.status).toBe('VERIFIED');
    expect(res.body.student_name).toBe('Rohan Sharma');
    expect(res.body.mentor_name).toBe('Dr. Anand Verma');
    expect(res.body.seal.key_id).toBe('ed25519-demo-2026-v1');
    expect(res.body.seal.digest).toBeDefined();
    expect(res.body.seal.signature).toBeDefined();
    expect(res.body.verification_claim).toContain('A named, roster-linked mentor confirmed these skills');
  });

  it('2. Tamper Demo: modifying a record in database flips status to CHANGED_SINCE_VERIFICATION', async () => {
    // Trigger tamper
    const tamperRes = await request(app).post('/check/ent-sample-rover/tamper-demo');
    expect(tamperRes.status).toBe(200);
    expect(tamperRes.body.success).toBe(true);

    // Verify check page detects tampering
    const checkRes = await request(app).get('/check/ent-sample-rover');
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.status).toBe('CHANGED_SINCE_VERIFICATION');
    expect(checkRes.body.seal.is_digest_intact).toBe(false);
    expect(checkRes.body.message).toContain('Cryptographic integrity mismatch');

    // Restore for subsequent test
    const restoreRes = await request(app).post('/check/ent-sample-rover/restore-demo');
    expect(restoreRes.status).toBe(200);

    const restoredCheck = await request(app).get('/check/ent-sample-rover');
    expect(restoredCheck.body.status).toBe('VERIFIED');
  });

  it('3. POST /check/:id/revoke - signs a revocation event and reflects REVOKED on check page', async () => {
    const revokeRes = await request(app)
      .post('/check/ent-sample-rover/revoke')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        reason: 'Laboratory log audit revealed unverified external code contributions'
      });

    expect(revokeRes.status).toBe(200);
    expect(revokeRes.body.success).toBe(true);
    expect(revokeRes.body.revocation).toBeDefined();
    expect(revokeRes.body.revocation.signature).toBeDefined();
    expect(revokeRes.body.auditEvent.type).toBe('ENTRY_REVOKED');

    // Check page now returns REVOKED
    const checkRes = await request(app).get('/check/ent-sample-rover');
    expect(checkRes.status).toBe(200);
    expect(checkRes.body.status).toBe('REVOKED');
    expect(checkRes.body.message).toContain('formally revoked');
  });
});

