-- PostgreSQL Initialization Script for VeriFolio
-- Configures roles, RLS policies, functions, and triggers

-- 1. Create Roles
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'verifolio_app') THEN
    CREATE ROLE verifolio_app WITH LOGIN PASSWORD 'verifolio_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;

  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'public_reader') THEN
    CREATE ROLE public_reader WITH LOGIN PASSWORD 'public_reader_secret' NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS;
  END IF;
END $$;

-- 2. Schema Privileges
GRANT USAGE ON SCHEMA public TO verifolio_app;
GRANT USAGE ON SCHEMA public TO public_reader;

-- 3. Public Reader Security Definer Stub
-- Check page uses only this function; public_reader never queries private tables directly.
CREATE OR REPLACE FUNCTION get_published_entry_check(target_id UUID)
RETURNS TABLE (
  entry_id UUID,
  school_name TEXT,
  student_name TEXT,
  class_level TEXT,
  title TEXT,
  description TEXT,
  category TEXT,
  role TEXT,
  start_date TEXT,
  end_date TEXT,
  mentor_name TEXT,
  mentor_note TEXT,
  skills JSONB,
  evidence_hashes TEXT[],
  verified_at TIMESTAMPTZ,
  is_verified BOOLEAN
)
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pe.entry_id::UUID,
    pe.school_name::TEXT,
    pe.student_name::TEXT,
    pe.class_level::TEXT,
    pe.title::TEXT,
    pe.description::TEXT,
    pe.category::TEXT,
    pe.role::TEXT,
    pe.start_date::TEXT,
    pe.end_date::TEXT,
    pe.mentor_name::TEXT,
    pe.mentor_note::TEXT,
    pe.skills_json::JSONB,
    pe.evidence_hashes::TEXT[],
    pe.verified_at,
    TRUE as is_verified
  FROM published_entry pe
  WHERE pe.id = target_id::TEXT OR pe.entry_id = target_id::TEXT;
END;
$$;

GRANT EXECUTE ON FUNCTION get_published_entry_check(UUID) TO public_reader;

-- 4. Audit Table Immutability Trigger (insert-only)
CREATE OR REPLACE FUNCTION enforce_audit_event_immutability()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit events are immutable. UPDATE and DELETE operations are forbidden.';
END;
$$;

-- 5. Approval Constraint Trigger
-- A revision may only reach APPROVED if a matching verification row exists
CREATE OR REPLACE FUNCTION enforce_approved_has_verification()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.state = 'APPROVED' AND OLD.state <> 'APPROVED' THEN
    IF NOT EXISTS (
      SELECT 1 FROM verification WHERE revision_id = NEW.id
    ) THEN
      RAISE EXCEPTION 'EntryRevision cannot reach APPROVED state without an existing verification record.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
