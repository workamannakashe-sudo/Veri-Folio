import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { memoryStore } from '../services/store';
import { verifySeal } from '../modules/seal';
import { defaultKeyRegistry } from '../modules/seal/keys';

describe('Phase 4: Mentor Inbox & Atomic Approval Transaction', () => {
  let mentorToken: string;
  let unlinkedMentorToken: string;
  let studentToken: string;

  beforeAll(async () => {
    // 1. Authenticate linked mentor (Dr. Anand Verma)
    await request(app)
      .post('/auth/request-otp')
      .send({ email: 'bob.mentor@school1.edu', schoolId: 'school-demo-1' });

    const mentorRes = await request(app)
      .post('/auth/verify-otp')
      .send({ email: 'bob.mentor@school1.edu', code: '123456' });

    mentorToken = mentorRes.body.accessToken;

    // 2. Authenticate unlinked mentor (Prof. Suresh Nair)
    await request(app)
      .post('/auth/request-otp')
      .send({ email: 'unlinked.mentor@school1.edu', schoolId: 'school-demo-1' });

    const unlinkedRes = await request(app)
      .post('/auth/verify-otp')
      .send({ email: 'unlinked.mentor@school1.edu', code: '123456' });

    unlinkedMentorToken = unlinkedRes.body.accessToken;

    // 3. Authenticate student (Rohan Sharma)
    await request(app)
      .post('/auth/request-otp')
      .send({ email: 'alice.student@school1.edu', schoolId: 'school-demo-1' });

    const studentRes = await request(app)
      .post('/auth/verify-otp')
      .send({ email: 'alice.student@school1.edu', code: '123456' });

    studentToken = studentRes.body.accessToken;
  });

  it('GET /verifications/inbox - returns pending requests for roster-linked mentor', async () => {
    const res = await request(app)
      .get('/verifications/inbox')
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.requests).toBeDefined();
    expect(res.body.requests.length).toBeGreaterThan(0);

    const firstReq = res.body.requests[0];
    expect(firstReq.entry_id).toBe('ent-sample-rover');
    expect(firstReq.title).toBe('Autonomous Campus Waste-Sorting Rover');
    expect(firstReq.student.name).toBe('Rohan Sharma');
    expect(firstReq.shared_group.name).toBe('Robotics & Automation Club');
    expect(firstReq.skills.length).toBe(2);
  });

  it('GET /verifications/inbox - returns empty inbox for mentor with no linked pending requests', async () => {
    const res = await request(app)
      .get('/verifications/inbox')
      .set('Authorization', `Bearer ${unlinkedMentorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.requests).toEqual([]);
  });

  it('GET /verifications/:id - retrieves full review package for linked mentor', async () => {
    const res = await request(app)
      .get('/verifications/ent-sample-rover')
      .set('Authorization', `Bearer ${mentorToken}`);

    expect(res.status).toBe(200);
    expect(res.body.student.name).toBe('Rohan Sharma');
    expect(res.body.revision.title).toBe('Autonomous Campus Waste-Sorting Rover');
    expect(res.body.revision.evidence.length).toBe(2);
    expect(res.body.revision.evidence[0].sha256).toBeDefined();
  });

  it('GET /verifications/:id - rejects unlinked mentor with 404/unauthorized', async () => {
    const res = await request(app)
      .get('/verifications/ent-sample-rover')
      .set('Authorization', `Bearer ${unlinkedMentorToken}`);

    expect(res.status).toBe(404);
  });

  it('POST /verifications/:id/decision - rejects non-mentor roles with 403', async () => {
    const res = await request(app)
      .post('/verifications/ent-sample-rover/decision')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        decision: 'APPROVED',
        mentor_note: 'Rohan showed outstanding robotics initiative.',
        skills: [{ id: 'sk-robotics-mechatronics', level: 'ADVANCED' }]
      });

    expect(res.status).toBe(403);
  });

  it('POST /verifications/:id/decision - rejects notes shorter than 20 characters with 400', async () => {
    const res = await request(app)
      .post('/verifications/ent-sample-rover/decision')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        decision: 'APPROVED',
        mentor_note: 'Good job rohan', // 14 chars < 20
        skills: [{ id: 'sk-robotics-mechatronics', level: 'ADVANCED' }]
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Validation failed');
  });

  it('POST /verifications/:id/decision - rejects rubber-stamping template notes with 400', async () => {
    const res = await request(app)
      .post('/verifications/ent-sample-rover/decision')
      .set('Authorization', `Bearer ${mentorToken}`)
      .send({
        decision: 'APPROVED',
        mentor_note: 'I confirm this student performed the work as described in the report.',
        skills: [{ id: 'sk-robotics-mechatronics', level: 'ADVANCED' }]
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Rubber-stamping detected');
  });

  it('POST /verifications/:id/decision - rejects unlinked mentor decision with 403', async () => {
    const res = await request(app)
      .post('/verifications/ent-sample-rover/decision')
      .set('Authorization', `Bearer ${unlinkedMentorToken}`)
      .send({
        decision: 'APPROVED',
        mentor_note: 'Supervised the waste sorting trials in campus testing grounds.',
        skills: [{ id: 'sk-robotics-mechatronics', level: 'ADVANCED' }]
      });

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('not roster-linked');
  });

  it('POST /verifications/:id/decision - atomic approval creates Ed25519 seal, audit log, and sets state to APPROVED', async () => {
    const res = await request(app)
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

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.verification).toBeDefined();
    expect(res.body.verification.decision).toBe('APPROVED');
    expect(res.body.seal).toBeDefined();
    expect(res.body.seal.digest).toBeDefined();
    expect(res.body.seal.signature).toBeDefined();
    expect(res.body.auditEvent).toBeDefined();
    expect(res.body.auditEvent.type).toBe('VERIFICATION_CREATED');

    // Verify cryptographic seal mathematically with public key from registry
    const publicKeyPem = defaultKeyRegistry.getPublicKeyPem(res.body.seal.key_id);
    expect(publicKeyPem).toBeDefined();

    const isSealValid = verifySeal(
      res.body.seal.fields,
      res.body.seal.digest,
      res.body.seal.signature,
      publicKeyPem!
    );
    expect(isSealValid).toBe(true);

    // Verify stored revision is now frozen in APPROVED state
    const rev = memoryStore.revisions.get('rev-sample-rover-1');
    expect(rev?.state).toBe('APPROVED');

    // Verify published entry read model was populated
    const pub = memoryStore.publishedEntries.get('ent-sample-rover');
    expect(pub).toBeDefined();
    expect(pub?.student_name).toBe('Rohan Sharma');
    expect(pub?.mentor_name).toBe('Dr. Anand Verma');
  });
});
