-- DevSignal Matching Engine — Schema v3
-- Unified on 384-dim vectors (Xenova/all-MiniLM-L6-v2 via Transformers.js)
-- Run this in: Supabase -> SQL Editor -> New Query

CREATE EXTENSION IF NOT EXISTS vector;

DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS roles CASCADE;
DROP TABLE IF EXISTS developers CASCADE;

CREATE TABLE developers (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name               TEXT NOT NULL,
  avatar_initials    TEXT NOT NULL,
  location_city      TEXT NOT NULL,
  location_country   TEXT NOT NULL,
  timezone           TEXT NOT NULL,
  utc_offset         INTEGER NOT NULL,
  role_title         TEXT NOT NULL,
  seniority          TEXT NOT NULL CHECK (seniority IN ('junior','mid','senior','staff','principal')),
  years_experience   INTEGER NOT NULL,
  primary_stack      TEXT[] NOT NULL,
  secondary_stack    TEXT[] DEFAULT '{}',
  specializations    TEXT[] DEFAULT '{}',
  hourly_rate_usd    INTEGER NOT NULL,
  availability       TEXT NOT NULL CHECK (availability IN ('immediate','2_weeks','1_month')),
  weekly_hours       INTEGER NOT NULL DEFAULT 40,
  english_level      TEXT NOT NULL CHECK (english_level IN ('basic','conversational','fluent','native')),
  startup_experience BOOLEAN NOT NULL DEFAULT false,
  ai_experience      BOOLEAN NOT NULL DEFAULT false,
  bio                TEXT NOT NULL,
  embedding          vector(384),
  is_active          BOOLEAN NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE roles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name      TEXT NOT NULL,
  contact_email    TEXT,
  raw_description  TEXT NOT NULL,
  parsed_spec      JSONB DEFAULT '{}',
  required_stack   TEXT[] DEFAULT '{}',
  preferred_stack  TEXT[] DEFAULT '{}',
  seniority_min    TEXT DEFAULT 'mid',
  budget_min_usd   INTEGER,
  budget_max_usd   INTEGER,
  timezone_min_utc INTEGER DEFAULT -8,
  timezone_max_utc INTEGER DEFAULT -3,
  start_date       DATE,
  team_size        INTEGER,
  embedding        vector(384),
  status           TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','matched','sent_to_client','filled','closed')),
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE matches (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id           UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  developer_id      UUID NOT NULL REFERENCES developers(id) ON DELETE CASCADE,
  semantic_score    FLOAT NOT NULL,
  stack_score       FLOAT NOT NULL,
  timezone_score    FLOAT NOT NULL,
  rate_score        FLOAT NOT NULL,
  seniority_score   FLOAT NOT NULL,
  composite_score   FLOAT NOT NULL,
  match_explanation TEXT,
  rank              INTEGER NOT NULL,
  operator_approved BOOLEAN DEFAULT NULL,
  operator_notes    TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, developer_id)
);

CREATE INDEX developers_embedding_idx
  ON developers USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

CREATE INDEX roles_embedding_idx
  ON roles USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 10);

CREATE INDEX developers_active_idx    ON developers(is_active);
CREATE INDEX developers_seniority_idx ON developers(seniority);
CREATE INDEX developers_rate_idx      ON developers(hourly_rate_usd);
CREATE INDEX matches_role_idx         ON matches(role_id);
CREATE INDEX matches_composite_idx    ON matches(composite_score DESC);

CREATE OR REPLACE FUNCTION match_developers(
  query_embedding    vector(384),
  budget_max         INTEGER DEFAULT 999,
  utc_offset_min     INTEGER DEFAULT -12,
  utc_offset_max     INTEGER DEFAULT 12,
  required_seniority TEXT[]  DEFAULT ARRAY['junior','mid','senior','staff','principal'],
  match_count        INTEGER DEFAULT 20
)
RETURNS TABLE (
  id                 UUID,
  name               TEXT,
  avatar_initials    TEXT,
  location_city      TEXT,
  location_country   TEXT,
  timezone           TEXT,
  utc_offset         INTEGER,
  role_title         TEXT,
  seniority          TEXT,
  years_experience   INTEGER,
  primary_stack      TEXT[],
  secondary_stack    TEXT[],
  specializations    TEXT[],
  hourly_rate_usd    INTEGER,
  availability       TEXT,
  english_level      TEXT,
  startup_experience BOOLEAN,
  ai_experience      BOOLEAN,
  bio                TEXT,
  semantic_score     FLOAT
)
LANGUAGE sql STABLE
AS $$
  SELECT
    d.id, d.name, d.avatar_initials, d.location_city, d.location_country,
    d.timezone, d.utc_offset, d.role_title, d.seniority, d.years_experience,
    d.primary_stack, d.secondary_stack, d.specializations, d.hourly_rate_usd,
    d.availability, d.english_level, d.startup_experience, d.ai_experience,
    d.bio,
    1 - (d.embedding <=> query_embedding) AS semantic_score
  FROM developers d
  WHERE
    d.is_active = true
    AND d.hourly_rate_usd <= budget_max
    AND d.utc_offset >= utc_offset_min
    AND d.utc_offset <= utc_offset_max
    AND d.seniority = ANY(required_seniority)
    AND d.embedding IS NOT NULL
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
$$;