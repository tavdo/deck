-- ============================================================================
-- KARTULI DECK AI — PostgreSQL Schema Migration (001_initial_schema.sql)
-- Covers: Users, Projects, Deck Configurations, Cards, Card Versions,
--         Generation Jobs, and Export Jobs.
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(128) PRIMARY KEY,
  email VARCHAR(255) UNIQUE,
  display_name VARCHAR(255) NOT NULL,
  daily_generations_used INTEGER NOT NULL DEFAULT 0,
  last_generation_date VARCHAR(32),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS projects (
  id VARCHAR(128) PRIMARY KEY,
  user_id VARCHAR(128) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  deck_config JSONB NOT NULL,
  shared_style_spec JSONB NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'draft',
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  card_count INTEGER NOT NULL DEFAULT 0,
  completed_card_count INTEGER NOT NULL DEFAULT 0,
  cover_card_url TEXT,
  active_job_id VARCHAR(128),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);

CREATE TABLE IF NOT EXISTS deck_configurations (
  id VARCHAR(128) PRIMARY KEY,
  project_id VARCHAR(128) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  deck_type VARCHAR(32) NOT NULL,
  suits JSONB NOT NULL,
  ranks JSONB NOT NULL,
  include_joker BOOLEAN NOT NULL DEFAULT FALSE,
  joker_count INTEGER NOT NULL DEFAULT 0,
  include_card_back BOOLEAN NOT NULL DEFAULT TRUE,
  illustration_style VARCHAR(128) NOT NULL,
  palette_id VARCHAR(128) NOT NULL,
  ornament_motif VARCHAR(64) NOT NULL,
  complexity_level VARCHAR(64) NOT NULL,
  card_width_mm NUMERIC(6,2) NOT NULL DEFAULT 63,
  card_height_mm NUMERIC(6,2) NOT NULL DEFAULT 88,
  image_quality VARCHAR(16) NOT NULL DEFAULT '1K',
  model_id VARCHAR(128) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deck_configs_project_id ON deck_configurations(project_id);

CREATE TABLE IF NOT EXISTS cards (
  id VARCHAR(128) PRIMARY KEY,
  project_id VARCHAR(128) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  rank VARCHAR(16) NOT NULL,
  suit VARCHAR(32) NOT NULL,
  card_type VARCHAR(32) NOT NULL,
  title_ka VARCHAR(255) NOT NULL,
  subject_description TEXT NOT NULL DEFAULT '',
  illustration_style VARCHAR(128) NOT NULL,
  complexity_level VARCHAR(64) NOT NULL DEFAULT 'royal-intricate',
  custom_prompt TEXT,
  illustration_url TEXT NOT NULL,
  design_spec JSONB NOT NULL,
  generation_status VARCHAR(32) NOT NULL DEFAULT 'completed',
  error_message TEXT,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  model_id VARCHAR(128) NOT NULL,
  prompt_used TEXT NOT NULL DEFAULT '',
  export_metadata JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cards_project_id ON cards(project_id);
CREATE INDEX IF NOT EXISTS idx_cards_status ON cards(generation_status);
CREATE INDEX IF NOT EXISTS idx_cards_favorite ON cards(is_favorite);

CREATE TABLE IF NOT EXISTS card_versions (
  version_id VARCHAR(128) PRIMARY KEY,
  card_id VARCHAR(128) NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  illustration_url TEXT NOT NULL,
  prompt_used TEXT NOT NULL,
  model_id VARCHAR(128) NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT FALSE,
  design_spec JSONB NOT NULL,
  note_ka TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_card_versions_card_id ON card_versions(card_id);

CREATE TABLE IF NOT EXISTS generation_jobs (
  id VARCHAR(128) PRIMARY KEY,
  project_id VARCHAR(128) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'queued',
  total_cards INTEGER NOT NULL DEFAULT 0,
  completed_cards INTEGER NOT NULL DEFAULT 0,
  failed_cards INTEGER NOT NULL DEFAULT 0,
  generating_cards INTEGER NOT NULL DEFAULT 0,
  current_card_label VARCHAR(255),
  estimated_remaining_seconds INTEGER,
  estimated_cost_usd NUMERIC(10,4) NOT NULL DEFAULT 0,
  model_id VARCHAR(128) NOT NULL,
  shared_style_spec JSONB NOT NULL,
  error_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_generation_jobs_project_id ON generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_generation_jobs_status ON generation_jobs(status);

CREATE TABLE IF NOT EXISTS export_jobs (
  id VARCHAR(128) PRIMARY KEY,
  project_id VARCHAR(128) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  format VARCHAR(32) NOT NULL,
  layout_mode VARCHAR(64) NOT NULL,
  page_size VARCHAR(32) NOT NULL DEFAULT 'A4',
  bleed_mm NUMERIC(5,2) NOT NULL DEFAULT 3,
  safe_margin_mm NUMERIC(5,2) NOT NULL DEFAULT 5,
  include_crop_marks BOOLEAN NOT NULL DEFAULT TRUE,
  include_card_back BOOLEAN NOT NULL DEFAULT TRUE,
  status VARCHAR(32) NOT NULL DEFAULT 'completed',
  file_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_export_jobs_project_id ON export_jobs(project_id);
