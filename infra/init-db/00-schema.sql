-- ====================================================================
-- VeriFolio Single-Source-of-Truth Database Schema & DDL
-- Configures Tables, Foreign Keys, Indexes, Constraints, Roles, and RLS
-- ====================================================================

-- 1. Create Enums
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('STUDENT', 'MENTOR', 'ADMIN', 'VIEWER');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_status') THEN
    CREATE TYPE user_status AS ENUM ('ACTIVE', 'INVITED', 'SUSPENDED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entry_state') THEN
    CREATE TYPE entry_state AS ENUM ('DRAFT', 'REQUESTED', 'CHANGES_REQUESTED', 'APPROVED', 'DECLINED', 'REVOKED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_level') THEN
    CREATE TYPE skill_level AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'skill_source') THEN
    CREATE TYPE skill_source AS ENUM ('STUDENT', 'AI', 'MENTOR');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'decision_type') THEN
    CREATE TYPE decision_type AS ENUM ('APPROVE', 'CHANGES_REQUESTED', 'DECLINE');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'scan_status') THEN
    CREATE TYPE scan_status AS ENUM ('PENDING', 'PASSED', 'FAILED');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'flag_status') THEN
    CREATE TYPE flag_status AS ENUM ('PENDING', 'RESOLVED', 'DISMISSED');
  END IF;
END $$;

-- 2. Core Tables
CREATE TABLE IF NOT EXISTS school (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  erp_ref TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  class_level TEXT,
  is_minor BOOLEAN NOT NULL DEFAULT FALSE,
  erp_ref TEXT,
  status user_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_user_school_email UNIQUE (school_id, email)
);
CREATE INDEX IF NOT EXISTS idx_user_school_role ON "user"(school_id, role);

CREATE TABLE IF NOT EXISTS "group" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('CLASS', 'CLUB', 'TEAM')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_group_school ON "group"(school_id);

CREATE TABLE IF NOT EXISTS membership (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES "group"(id) ON DELETE CASCADE,
  role_in_group TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_membership_user_group UNIQUE (user_id, group_id)
);
CREATE INDEX IF NOT EXISTS idx_membership_school_user ON membership(school_id, user_id);
CREATE INDEX IF NOT EXISTS idx_membership_school_group ON membership(school_id, group_id);

CREATE TABLE IF NOT EXISTS entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  category TEXT NOT NULL CHECK (category IN ('project', 'sport', 'club')),
  current_revision INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entry_school_student ON entry(school_id, student_id);

CREATE TABLE IF NOT EXISTS entry_revision (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
  revision INT NOT NULL DEFAULT 1,
  state entry_state NOT NULL DEFAULT 'DRAFT',
  title TEXT NOT NULL CHECK (char_length(title) >= 3),
  description TEXT NOT NULL CHECK (char_length(description) >= 10),
  category TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_entry_revision_number UNIQUE (entry_id, revision),
  CONSTRAINT chk_date_range CHECK (end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS idx_entry_revision_school_state ON entry_revision(school_id, state);

CREATE TABLE IF NOT EXISTS skill (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  family TEXT NOT NULL,
  synonyms TEXT[] NOT NULL DEFAULT '{}',
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS entry_skill (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  revision_id UUID NOT NULL REFERENCES entry_revision(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL REFERENCES skill(id) ON DELETE CASCADE,
  level skill_level NOT NULL,
  source skill_source NOT NULL DEFAULT 'STUDENT',
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_entry_skill_school_revision ON entry_skill(school_id, revision_id);

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  revision_id UUID NOT NULL REFERENCES entry_revision(id) ON DELETE CASCADE,
  object_key TEXT NOT NULL,
  sha256 TEXT NOT NULL CHECK (char_length(sha256) = 64),
  mime_type TEXT NOT NULL,
  file_size INT NOT NULL CHECK (file_size > 0),
  scan_status scan_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_evidence_school_revision ON evidence(school_id, revision_id);

CREATE TABLE IF NOT EXISTS verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  revision_id UUID UNIQUE NOT NULL REFERENCES entry_revision(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  decision decision_type NOT NULL DEFAULT 'APPROVE',
  note TEXT NOT NULL CHECK (char_length(note) >= 20),
  digest TEXT NOT NULL CHECK (char_length(digest) = 64),
  signature TEXT NOT NULL,
  key_id TEXT NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_verification_school_mentor ON verification(school_id, mentor_id);

CREATE TABLE IF NOT EXISTS revocation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  revision_id UUID UNIQUE NOT NULL REFERENCES entry_revision(id) ON DELETE CASCADE,
  verification_digest TEXT NOT NULL,
  revoked_by UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  reason TEXT NOT NULL CHECK (char_length(reason) >= 5),
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  key_id TEXT NOT NULL,
  signature TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_revocation_school ON revocation(school_id);

CREATE TABLE IF NOT EXISTS audit_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  sequence INT NOT NULL,
  type TEXT NOT NULL,
  actor TEXT NOT NULL,
  payload JSONB NOT NULL,
  prev_hash TEXT NOT NULL,
  hash TEXT NOT NULL CHECK (char_length(hash) = 64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_audit_event_sequence UNIQUE (school_id, sequence)
);
CREATE INDEX IF NOT EXISTS idx_audit_event_school_hash ON audit_event(school_id, hash);

CREATE TABLE IF NOT EXISTS consent (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  guardian_name TEXT NOT NULL,
  guardian_contact TEXT NOT NULL,
  scope TEXT NOT NULL,
  notice_version TEXT NOT NULL,
  given_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  withdrawn_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_consent_school_student ON consent(school_id, student_id);

CREATE TABLE IF NOT EXISTS published_entry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID UNIQUE NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
  school_name TEXT NOT NULL,
  student_name TEXT NOT NULL,
  class_level TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  role TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  mentor_name TEXT NOT NULL,
  mentor_note TEXT NOT NULL,
  skills_json JSONB NOT NULL,
  evidence_hashes TEXT[] NOT NULL DEFAULT '{}',
  verified_at TIMESTAMPTZ NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_published_entry_verified_at ON published_entry(verified_at);

CREATE TABLE IF NOT EXISTS share_link (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
  token TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_share_link_token ON share_link(token);

CREATE TABLE IF NOT EXISTS viewer_org (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT UNIQUE NOT NULL,
  contact TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS view_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_org_id UUID NOT NULL REFERENCES viewer_org(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
  ip_address TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_view_log_org_time ON view_log(viewer_org_id, viewed_at);

CREATE TABLE IF NOT EXISTS flag (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id UUID NOT NULL REFERENCES entry(id) ON DELETE CASCADE,
  flagged_by UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status flag_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_flag_entry_status ON flag(entry_id, status);

CREATE TABLE IF NOT EXISTS notification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notification_school_user ON notification(school_id, user_id, is_read);

CREATE TABLE IF NOT EXISTS mentor_signal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES school(id) ON DELETE CASCADE,
  mentor_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  approval_duration_s INT NOT NULL,
  decision decision_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_mentor_signal_school_mentor ON mentor_signal(school_id, mentor_id);
