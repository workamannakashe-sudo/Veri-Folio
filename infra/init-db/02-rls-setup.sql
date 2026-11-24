-- 02-rls-setup.sql
-- Enables FORCE ROW LEVEL SECURITY and isolation policies on all private tables

-- Macro to enable RLS and create isolation policy
DO $$
DECLARE
  tbl TEXT;
  private_tables TEXT[] := ARRAY[
    'school',
    'user',
    'group',
    'membership',
    'entry',
    'entry_revision',
    'entry_skill',
    'evidence',
    'verification',
    'revocation',
    'audit_event',
    'consent',
    'notification',
    'mentor_signal'
  ];
BEGIN
  FOREACH tbl IN ARRAY private_tables
  LOOP
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = tbl) THEN
      EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', tbl);
      EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY;', tbl);

      -- Drop existing policy if any
      EXECUTE format('DROP POLICY IF EXISTS tenant_isolation_policy ON %I;', tbl);

      -- School table matches id, other private tables match school_id
      IF tbl = 'school' THEN
        EXECUTE format(
          'CREATE POLICY tenant_isolation_policy ON %I FOR ALL TO verifolio_app USING (id = NULLIF(current_setting(''app.school_id'', true), '''')) WITH CHECK (id = NULLIF(current_setting(''app.school_id'', true), ''''));',
          tbl
        );
      ELSE
        EXECUTE format(
          'CREATE POLICY tenant_isolation_policy ON %I FOR ALL TO verifolio_app USING (school_id = NULLIF(current_setting(''app.school_id'', true), '''')) WITH CHECK (school_id = NULLIF(current_setting(''app.school_id'', true), ''''));',
          tbl
        );
      END IF;
    END IF;
  END LOOP;
END $$;

-- Hook Triggers if tables exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_event') THEN
    DROP TRIGGER IF EXISTS trg_audit_event_immutability ON audit_event;
    CREATE TRIGGER trg_audit_event_immutability
      BEFORE UPDATE OR DELETE ON audit_event
      FOR EACH ROW EXECUTE FUNCTION enforce_audit_event_immutability();
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'entry_revision') THEN
    DROP TRIGGER IF EXISTS trg_enforce_approved_has_verification ON entry_revision;
    CREATE TRIGGER trg_enforce_approved_has_verification
      BEFORE UPDATE ON entry_revision
      FOR EACH ROW EXECUTE FUNCTION enforce_approved_has_verification();
  END IF;
END $$;
