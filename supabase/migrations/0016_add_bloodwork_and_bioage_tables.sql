-- Migration: 0016_add_bloodwork_and_bioage_tables.sql
-- Description: Adds user_lab_panels, biomarker_measurements, and bioage_calculation_logs tables

CREATE TABLE IF NOT EXISTS public.user_lab_panels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    collection_date DATE NOT NULL,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    provider_name TEXT DEFAULT 'Unknown Lab'::text,
    source_files JSONB DEFAULT '[]'::jsonb,
    bioage_outputs JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_lab_panels_user_date ON public.user_lab_panels(user_id, collection_date DESC);

CREATE TABLE IF NOT EXISTS public.biomarker_measurements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    panel_id UUID REFERENCES public.user_lab_panels(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    biomarker_id TEXT NOT NULL,
    raw_name TEXT NOT NULL,
    raw_value NUMERIC NOT NULL,
    raw_unit TEXT NOT NULL,
    normalized_value NUMERIC NOT NULL,
    normalized_unit TEXT NOT NULL,
    lab_reference_range TEXT,
    lab_flag TEXT DEFAULT 'normal'::text,
    extraction_confidence NUMERIC DEFAULT 1.0,
    user_corrected BOOLEAN DEFAULT false,
    collection_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_biomarker_measurements_user_id ON public.biomarker_measurements(user_id, biomarker_id, collection_date DESC);

CREATE TABLE IF NOT EXISTS public.bioage_calculation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL,
    panel_id UUID REFERENCES public.user_lab_panels(id) ON DELETE CASCADE,
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    chronological_age NUMERIC NOT NULL,
    sex TEXT NOT NULL,
    kdm_age NUMERIC,
    pheno_age NUMERIC,
    hd_score NUMERIC,
    provenance JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_bioage_calc_user_id ON public.bioage_calculation_logs(user_id, calculated_at DESC);
