import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { memoryStore } from '../services/store';

describe('Phase 6: Minor Guardian Consent & Viewer Organization Search', () => {
  let studentToken: string;
  let viewerToken: string;

  beforeAll(async () => {
    // 1. Authenticate student (Rohan Sharma, usr-student-1)
    await request(app)
      .post('/auth/request-otp')
      .send({ email: 'alice.student@school1.edu', schoolId: 'school-demo-1' });

    const stuRes = await request(app)
      .post('/auth/verify-otp')
      .send({ email: 'alice.student@school1.edu', code: '123456' });

    studentToken = stuRes.body.accessToken;

    // 2. Register/Authenticate Viewer Organization
    memoryStore.users.set('usr-viewer-1', {
      id: 'usr-viewer-1',
      school_id: 'school-demo-1',
      role: 'VIEWER',
      email: 'recruiter@techventures.org',
      full_name: 'Tech Ventures Hiring Partner',
      first_name: 'TechVentures',
      is_minor: false,
      is_approved: true
    });

    await request(app)
      .post('/auth/request-otp')
      .send({ email: 'recruiter@techventures.org', schoolId: 'school-demo-1' });

    const viewerRes = await request(app)
      .post('/auth/verify-otp')
      .send({ email: 'recruiter@techventures.org', code: '123456' });

    viewerToken = viewerRes.body.accessToken;

    // 3. Ensure an entry is published in read model
    memoryStore.publishedEntries.set('ent-sample-rover', {
      id: 'pub-ent-sample-rover',
      entry_id: 'ent-sample-rover',
      revision: 1,
      school_id: 'school-demo-1',
      student_name: 'Rohan Sharma',
      student_class_level: 'Grade 11-A',
      is_minor: true,
      title: 'Autonomous Campus Waste-Sorting Rover',
      description: 'Designed and built an autonomous robot with camera mast.',
      category: 'STEM & Robotics',
      role: 'Lead Hardware & Firmware Developer',
      start_date: '2026-09-01',
      end_date: '2026-11-15',
      skills: [
        { id: 'tech-robotics', name: 'Robotics Engineering', level: 'ADVANCED' }
      ],
      evidence: [
        { sha256: 'a4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5', mime_type: 'video/mp4' }
      ],
      mentor_id: 'usr-mentor-1',
      mentor_name: 'Dr. Anand Verma',
      mentor_note: 'Rohan demonstrated exceptional robotics mastery.',
      decided_at: '2026-11-19T10:00:00.000Z',
      digest: '3f7a1c8b2d9e0f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a',
      signature: '8e4f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f',
      key_id: 'ed25519-demo-2026-v1',
      audit_event_hash: '0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b',
      verified_at: '2026-11-19T10:00:00.000Z'
    });
  });

  it('1. GET /consent/status - returns active guardian consent for minor student', async () => {
    const res = await request(app)
      .get('/consent/status')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(res.status).toBe(200);
    expect(res.body.is_minor).toBe(true);
    expect(res.body.has_active_consent).toBe(true);
    expect(res.body.consent.guardian_reference).toBeDefined();
  });

  it('2. GET /viewer/search - allows approved viewer to search and strictly masks minor names', async () => {
    const res = await request(app)
      .get('/viewer/search?q=robotics')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.results.length).toBeGreaterThan(0);

    const first = res.body.results[0];
    expect(first.title).toContain('Autonomous Campus Waste-Sorting Rover');
    expect(first.is_minor).toBe(true);
    // Strict privacy guarantee: Minor full last name and contact info are NEVER shown
    expect(first.student_display_name).toBe('Rohan (Grade 11-A)');
    expect(first.student_name).toBeUndefined();
    expect(first.student_email).toBeUndefined();
  });

  it('3. POST /consent/withdraw - immediately purges all public records for the minor student', async () => {
    const withdrawRes = await request(app)
      .post('/consent/withdraw')
      .set('Authorization', `Bearer ${studentToken}`);

    expect(withdrawRes.status).toBe(200);
    expect(withdrawRes.body.success).toBe(true);
    expect(withdrawRes.body.purged_entries_count).toBeGreaterThan(0);

    // Verify subsequent viewer search returns 0 results
    const searchRes = await request(app)
      .get('/viewer/search?q=robotics')
      .set('Authorization', `Bearer ${viewerToken}`);

    expect(searchRes.status).toBe(200);
    expect(searchRes.body.results).toEqual([]);
  });
});

