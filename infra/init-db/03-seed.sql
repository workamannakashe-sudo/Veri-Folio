-- ====================================================================
-- VeriFolio Idempotent Development & Demo Seed Data
-- ====================================================================

-- 1. Demo School
INSERT INTO school (id, name, slug, erp_ref, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'Delhi Public School Demo',
  'dps-demo',
  'SCH-DELHI-001',
  NOW(),
  NOW()
) ON CONFLICT (slug) DO NOTHING;

-- 2. Demo Users
-- Student: Rohan Sharma (Minor)
INSERT INTO "user" (id, school_id, role, email, full_name, first_name, class_level, is_minor, erp_ref, status)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'STUDENT',
  'alice.student@school1.edu',
  'Rohan Sharma',
  'Rohan',
  'Grade 11-A',
  TRUE,
  'ERP-STU-101',
  'ACTIVE'
) ON CONFLICT (school_id, email) DO NOTHING;

-- Mentor: Dr. Anand Verma
INSERT INTO "user" (id, school_id, role, email, full_name, first_name, is_minor, erp_ref, status)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'MENTOR',
  'bob.mentor@school1.edu',
  'Dr. Anand Verma',
  'Anand',
  FALSE,
  'ERP-FAC-201',
  'ACTIVE'
) ON CONFLICT (school_id, email) DO NOTHING;

-- Admin: Priya Sundaram
INSERT INTO "user" (id, school_id, role, email, full_name, first_name, is_minor, erp_ref, status)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  'ADMIN',
  'admin@school1.edu',
  'Priya Sundaram',
  'Priya',
  FALSE,
  'ERP-ADM-001',
  'ACTIVE'
) ON CONFLICT (school_id, email) DO NOTHING;

-- 3. Groups (Class, Club, Team)
INSERT INTO "group" (id, school_id, name, category)
VALUES 
  ('44444444-4444-4444-4444-444444444444', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Robotics & Automation Club', 'CLUB'),
  ('55555555-5555-5555-5555-555555555555', 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', 'Varsity Cricket Team', 'TEAM')
ON CONFLICT DO NOTHING;

-- 4. Memberships (Links Rohan & Dr. Anand Verma via Robotics Club)
INSERT INTO membership (school_id, user_id, group_id, role_in_group)
VALUES 
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '11111111-1111-1111-1111-111111111111', '44444444-4444-4444-4444-444444444444', 'STUDENT'),
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'TEACHER')
ON CONFLICT (user_id, group_id) DO NOTHING;

-- 5. Canonical Skills Seed
INSERT INTO skill (id, name, family, synonyms)
VALUES
  ('sk-robotics-mechatronics', 'Robotics & Mechatronics', 'technology', ARRAY['robotics', 'mechatronics', 'automation', 'hardware']),
  ('sk-embedded-systems', 'Embedded Systems', 'technology', ARRAY['microcontroller', 'esp32', 'arduino', 'firmware']),
  ('sk-python-programming', 'Python Programming', 'technology', ARRAY['python', 'scripting', 'algorithms']),
  ('sk-computer-vision', 'Computer Vision & AI', 'technology', ARRAY['cv', 'yolo', 'opencv', 'object detection']),
  ('sk-team-leadership', 'Team Leadership', 'leadership', ARRAY['leadership', 'captain', 'coordinator', 'lead']),
  ('sk-scientific-research', 'Scientific Research & Experimentation', 'science', ARRAY['research', 'lab', 'experiment', 'hypothesis']),
  ('sk-cricket-tactics', 'Cricket Tactics & Bowling', 'sports', ARRAY['cricket', 'bowling', 'batting', 'fielding'])
ON CONFLICT (id) DO NOTHING;

-- 6. Minor Guardian Consent
INSERT INTO consent (id, school_id, student_id, guardian_name, guardian_contact, scope, notice_version, given_at)
VALUES (
  '66666666-6666-6666-6666-666666666666',
  'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d',
  '11111111-1111-1111-1111-111111111111',
  'Kavita Sharma',
  'guardian.sharma@example.com',
  'ALL_VERIFIED_ENTRIES',
  'v2.0-2026',
  NOW()
) ON CONFLICT DO NOTHING;

-- 7. Viewer Organization
INSERT INTO viewer_org (id, name, domain, contact, is_approved)
VALUES (
  '77777777-7777-7777-7777-777777777777',
  'Acme Tech Internships & University Admissions',
  'acme-tech.org',
  'talent@acme-tech.org',
  TRUE
) ON CONFLICT (domain) DO NOTHING;
