import { describe, it, expect } from 'vitest';
import request from 'supertest';
import erpApp from '../../../mock-erp/src/index';
import { WebhookService } from '../services/webhook';

describe('Phase 7: ERP Seam, Signed Webhooks & Replay Defense', () => {
  const secret = 'erp-webhook-secret-demo-2026';
  const webhookHelper = new WebhookService(secret);

  it('1. GET /api/roster/students - returns student roster', async () => {
    const res = await request(erpApp).get('/api/roster/students');
    expect(res.status).toBe(200);
    expect(res.body.students.length).toBeGreaterThan(0);
    expect(res.body.students[0].name).toBe('Rohan Sharma');
  });

  it('2. POST /api/webhooks/verifolio - accepts valid signed webhook', async () => {
    const payload = {
      type: 'entry.verified',
      payload: {
        entry_id: 'ent-sample-rover',
        student_erp_id: 'ERP-STU-101',
        title: 'Autonomous Campus Waste-Sorting Rover',
        verified_by: 'Dr. Anand Verma',
        verified_at: new Date().toISOString(),
        digest: '3f7a1c8b2d9e0f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a'
      }
    };

    const timestamp = Date.now();
    const rawBody = JSON.stringify(payload);
    const signature = webhookHelper.signPayload(rawBody, timestamp);

    const res = await request(erpApp)
      .post('/api/webhooks/verifolio')
      .set('x-verifolio-signature', signature)
      .set('x-verifolio-timestamp', timestamp.toString())
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
    expect(res.body.event_id).toBeDefined();
  });

  it('3. POST /api/webhooks/verifolio - rejects invalid HMAC signature with 401', async () => {
    const payload = { type: 'entry.verified', payload: {} };
    const timestamp = Date.now();

    const res = await request(erpApp)
      .post('/api/webhooks/verifolio')
      .set('x-verifolio-signature', 'deadbeef0000111122223333444455556666777788889999aaaabbbbccccdddd')
      .set('x-verifolio-timestamp', timestamp.toString())
      .send(payload);

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid HMAC signature');
  });

  it('4. POST /api/webhooks/verifolio - rejects replayed webhook outside 5-minute window with 403', async () => {
    const payload = { type: 'entry.verified', payload: {} };
    // 10 minutes ago
    const oldTimestamp = Date.now() - 600_000;
    const rawBody = JSON.stringify(payload);
    const signature = webhookHelper.signPayload(rawBody, oldTimestamp);

    const res = await request(erpApp)
      .post('/api/webhooks/verifolio')
      .set('x-verifolio-signature', signature)
      .set('x-verifolio-timestamp', oldTimestamp.toString())
      .send(payload);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('outside 5-minute replay window');
  });

  it('5. GET /student/:id - renders SIS student record with Verified Skills tab', async () => {
    const res = await request(erpApp).get('/student/ERP-STU-101');
    expect(res.status).toBe(200);
    expect(res.text).toContain('Delhi Public School - SIS Portal');
    expect(res.text).toContain('Rohan Sharma');
    expect(res.text).toContain('Verified Skills (VeriFolio)');
  });
});
