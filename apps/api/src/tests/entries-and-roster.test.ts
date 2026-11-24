import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index';
import { memoryStore } from '../services/store';

describe('Phase 2: Entries, Evidence, Groups & Admin Roster Mapping', () => {
  let studentToken: string;
  let adminToken: string;
  let unlinkedMentorId: string;
  let linkedMentorId: string;

  beforeAll(async () => {
    // Reset seed data
    memoryStore.seedDefaults();

    // Sign in as student (Rohan Sharma, usr-student-1)
    await request(app)
      .post('/auth/request-otp')
      .send({ email: 'alice.student@school1.edu', schoolId: 'school-demo-1' });

    const studentVerify = await request(app)
      .post('/auth/verify-otp')
      .send({ email: 'alice.student@school1.edu', code: '123456' });
    studentToken = studentVerify.body.accessToken;

    // Sign in as admin (Clara Oswald, usr-admin-1)
    await request(app)
      .post('/auth/request-otp')
      .send({ email: 'clara.admin@school1.edu', schoolId: 'school-demo-1' });

    const adminVerify = await request(app)
      .post('/auth/verify-otp')
      .send({ email: 'clara.admin@school1.edu', code: '123456' });
    adminToken = adminVerify.body.accessToken;

    linkedMentorId = 'usr-mentor-1';         // Dr. Anand Verma (linked via Robotics Club)
    unlinkedMentorId = 'usr-mentor-unlinked'; // Prof. Suresh Nair (unlinked)
  });

  it('1. Skills endpoint queries ~150 controlled skills with family and keyword filtering', async () => {
    const res = await request(app).get('/skills');
    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThanOrEqual(140);

    // Filter by family
    const techRes = await request(app).get('/skills?family=technology');
    expect(techRes.status).toBe(200);
    expect(techRes.body.skills.every((s: any) => s.family === 'technology')).toBe(true);

    // Search by synonym (e.g. 'opencv' finds Computer Vision)
    const searchRes = await request(app).get('/skills?query=opencv');
    expect(searchRes.status).toBe(200);
    expect(searchRes.body.skills.some((s: any) => s.name === 'Computer Vision')).toBe(true);
  });

  it('2. Student creates an entry with evidence in DRAFT state', async () => {
    const entryPayload = {
      title: 'Autonomous Waste-Sorting Robot',
      description: 'Built a lightweight neural network running on edge device for sorting municipal recyclables.',
      category: 'project',
      role: 'Lead ML Engineer',
      start_date: '2026-08-01',
      end_date: '2026-11-15',
      skills: [
        { id: 'tech-python', level: 'ADVANCED', source: 'STUDENT' },
        { id: 'tech-computer-vision', level: 'INTERMEDIATE', source: 'STUDENT' }
      ],
      evidence: [
        {
          object_key: 'evidence/school-1/test-entry/report.pdf',
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          mime_type: 'application/pdf',
          file_size: 1048576,
          scan_status: 'PASSED'
        }
      ]
    };

    const res = await request(app)
      .post('/entries')
      .set('Authorization', `Bearer ${studentToken}`)
      .send(entryPayload);

    expect(res.status).toBe(201);
    expect(res.body.entry.id).toBeDefined();
    expect(res.body.revision.state).toBe('DRAFT');
    expect(res.body.revision.revision).toBe(1);
  });

  it('3. Pre-signed upload URL enforces file size and MIME type limits', async () => {
    // Create an entry first
    const entryRes = await request(app)
      .post('/entries')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Evidence Test Project',
        description: 'Testing upload URL generation with size and type constraints.',
        category: 'project',
        role: 'Researcher',
        start_date: '2026-09-01',
        end_date: '2026-10-01'
      });

    const entryId = entryRes.body.entry.id;

    // Reject unsupported mime type (e.g. application/x-executable)
    const badMimeRes = await request(app)
      .post(`/entries/${entryId}/evidence/upload-url`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ filename: 'virus.exe', mime_type: 'application/x-msdownload', file_size: 1024 });
    expect(badMimeRes.status).toBe(400);

    // Reject oversized file (> 25MB)
    const bigFileRes = await request(app)
      .post(`/entries/${entryId}/evidence/upload-url`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ filename: 'huge.mp4', mime_type: 'video/mp4', file_size: 30 * 1024 * 1024 });
    expect(bigFileRes.status).toBe(400);

    // Accept valid PDF
    const okRes = await request(app)
      .post(`/entries/${entryId}/evidence/upload-url`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ filename: 'design-doc.pdf', mime_type: 'application/pdf', file_size: 500000 });
    expect(okRes.status).toBe(200);
    expect(okRes.body.upload_url).toContain('http://localhost:9000/verifolio-evidence/');
    expect(okRes.body.object_key).toBeDefined();
  });

  it('4. Strict Roster Link Check: eligible-mentors returns ONLY linked mentors, never unlinked', async () => {
    // Create entry
    const entryRes = await request(app)
      .post('/entries')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Robotics Project Entry',
        description: 'Robotics competition entry linked to Robotics Club.',
        category: 'club',
        role: 'Team Lead',
        start_date: '2026-08-01',
        end_date: '2026-11-01'
      });
    const entryId = entryRes.body.entry.id;

    // Fetch eligible mentors
    const eligibleRes = await request(app)
      .get(`/entries/${entryId}/eligible-mentors`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(eligibleRes.status).toBe(200);
    const eligibleList = eligibleRes.body.eligible_mentors;

    // Must include linked mentor Dr. Anand Verma (usr-mentor-1)
    expect(eligibleList.some((m: any) => m.id === linkedMentorId)).toBe(true);

    // Must NOT include unlinked mentor Prof. Suresh Nair (usr-mentor-unlinked)
    expect(eligibleList.some((m: any) => m.id === unlinkedMentorId)).toBe(false);
  });

  it('5. Request verification rejects unlinked mentors with 403 Security Violation', async () => {
    const entryRes = await request(app)
      .post('/entries')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Unauthorized Mentor Test Entry',
        description: 'Attempting to request verification from unlinked teacher.',
        category: 'project',
        role: 'Developer',
        start_date: '2026-08-01',
        end_date: '2026-11-01'
      });
    const entryId = entryRes.body.entry.id;

    const requestRes = await request(app)
      .post(`/entries/${entryId}/request-verification`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ mentor_id: unlinkedMentorId });

    expect(requestRes.status).toBe(403);
    expect(requestRes.body.error).toContain('Security Violation');
  });

  it('6. Request verification succeeds with linked mentor and transitions to REQUESTED', async () => {
    const entryRes = await request(app)
      .post('/entries')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Valid Verification Request Entry',
        description: 'Requesting verification from legitimate robotics mentor.',
        category: 'club',
        role: 'Captain',
        start_date: '2026-08-01',
        end_date: '2026-11-01'
      });
    const entryId = entryRes.body.entry.id;

    const requestRes = await request(app)
      .post(`/entries/${entryId}/request-verification`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ mentor_id: linkedMentorId });

    expect(requestRes.status).toBe(200);
    expect(requestRes.body.revision.state).toBe('REQUESTED');
    expect(requestRes.body.revision.assigned_mentor_id).toBe(linkedMentorId);
  });

  it('7. Admin maps mentor to group, immediately making that mentor eligible', async () => {
    // Admin maps unlinked mentor (usr-mentor-unlinked) into Robotics Club (grp-robotics)
    const mapRes = await request(app)
      .put('/admin/groups/grp-robotics/members')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ user_id: unlinkedMentorId, role_in_group: 'COACH' });
    expect(mapRes.status).toBe(200);

    // Create entry for student
    const entryRes = await request(app)
      .post('/entries')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        title: 'Post-Mapping Eligibility Test',
        description: 'Checking if newly mapped mentor is now eligible.',
        category: 'project',
        role: 'Member',
        start_date: '2026-08-01',
        end_date: '2026-11-01'
      });
    const entryId = entryRes.body.entry.id;

    // Newly mapped mentor must now appear in eligible-mentors!
    const eligibleRes = await request(app)
      .get(`/entries/${entryId}/eligible-mentors`)
      .set('Authorization', `Bearer ${studentToken}`);

    expect(eligibleRes.status).toBe(200);
    expect(eligibleRes.body.eligible_mentors.some((m: any) => m.id === unlinkedMentorId)).toBe(true);
  });

  it('8. Admin CSV roster import matches ERP ID, flags duplicates, and never auto-merges', async () => {
    const csvContent = `erp_ref,email,full_name,role,group_name
ERP-STU-201,karan.mehta@school1.edu,Karan Mehta,STUDENT,Physics Lab Alpha
ERP-STU-202,anjali.sen@school1.edu,Anjali Sen,STUDENT,Physics Lab Alpha
ERP-STU-101,rohan.duplicate@school1.edu,Rohan Duplicate,STUDENT,Robotics
ERP-NEW-301,alice.student@school1.edu,Alice Existing Email,STUDENT,Robotics`;

    const res = await request(app)
      .post('/admin/import/csv')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ csv_content: csvContent });

    expect(res.status).toBe(200);
    expect(res.body.imported_count).toBe(2); // Karan Mehta and Anjali Sen imported
    expect(res.body.flagged_duplicates_count).toBe(2); // Both duplicate ERP ID and duplicate email flagged!
    expect(res.body.flagged_duplicates[0].reason).toContain('ERP reference already registered');
    expect(res.body.flagged_duplicates[1].reason).toContain('Email address conflict');
  });
});
