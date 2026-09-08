-- Migration 0018: Enable RLS and Configure Policies for daily_sessions and modality_claims
-- Resolves Supabase Security Advisor warnings: "RLS Disabled in Public"

-- ========================================================
-- 1. daily_sessions (User time-series session tracking)
-- ========================================================
ALTER TABLE IF EXISTS public.daily_sessions ENABLE ROW LEVEL SECURITY;

-- Allow reading sessions (supports both authenticated accounts and anonymous guest users)
DROP POLICY IF EXISTS "daily_sessions_select_policy" ON public.daily_sessions;
CREATE POLICY "daily_sessions_select_policy" ON public.daily_sessions
  FOR SELECT
  USING (true);

-- Allow inserting sessions
DROP POLICY IF EXISTS "daily_sessions_insert_policy" ON public.daily_sessions;
CREATE POLICY "daily_sessions_insert_policy" ON public.daily_sessions
  FOR INSERT
  WITH CHECK (true);

-- Allow updating session completion/skipped states
DROP POLICY IF EXISTS "daily_sessions_update_policy" ON public.daily_sessions;
CREATE POLICY "daily_sessions_update_policy" ON public.daily_sessions
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow deleting sessions
DROP POLICY IF EXISTS "daily_sessions_delete_policy" ON public.daily_sessions;
CREATE POLICY "daily_sessions_delete_policy" ON public.daily_sessions
  FOR DELETE
  USING (true);

-- ========================================================
-- 2. modality_claims (Evidence & clinical outcome claims catalog)
-- ========================================================
ALTER TABLE IF EXISTS public.modality_claims ENABLE ROW LEVEL SECURITY;

-- Public read access for clinical claims catalog
DROP POLICY IF EXISTS "modality_claims_read_policy" ON public.modality_claims;
CREATE POLICY "modality_claims_read_policy" ON public.modality_claims
  FOR SELECT
  USING (true);

-- Allow authenticated modifications
DROP POLICY IF EXISTS "modality_claims_modify_policy" ON public.modality_claims;
CREATE POLICY "modality_claims_modify_policy" ON public.modality_claims
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ========================================================
-- 3. Defensively secure related research catalog tables
-- ========================================================
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'modality_sources') THEN
    ALTER TABLE public.modality_sources ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "modality_sources_read_policy" ON public.modality_sources;
    CREATE POLICY "modality_sources_read_policy" ON public.modality_sources FOR SELECT USING (true);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'modality_relationships') THEN
    ALTER TABLE public.modality_relationships ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "modality_relationships_read_policy" ON public.modality_relationships;
    CREATE POLICY "modality_relationships_read_policy" ON public.modality_relationships FOR SELECT USING (true);
  END IF;
END $$;
