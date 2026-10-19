import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { newDb } from 'pg-mem';
import { config } from '../config/env.js';
import { INITIAL_DEMO_CARDS, INITIAL_DEMO_PROJECTS } from '../../shared/demoData.js';

const { Pool } = pg;

let poolInstance: pg.Pool | null = null;
let isUsingEmbeddedPg = false;

const isServerless = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const SNAPSHOT_DIR = isServerless
  ? path.join('/tmp', 'kartuli-deck-data')
  : path.resolve(process.cwd(), '.data');
const SNAPSHOT_FILE = path.join(SNAPSHOT_DIR, 'kartuli-deck-pg-snapshot.json');
const MIGRATION_SQL_PATH = path.resolve(
  process.cwd(),
  'src/server/db/migrations/001_initial_schema.sql'
);

const FALLBACK_MIGRATION_SQL = `
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
`;

export function getPool(): pg.Pool {
  if (!poolInstance) {
    throw new Error('Database pool has not been initialized. Call initDatabase() first.');
  }
  return poolInstance;
}

export function isEmbeddedDatabase(): boolean {
  return isUsingEmbeddedPg;
}

/**
 * Initializes PostgreSQL database connection, runs SQL migrations from
 * `001_initial_schema.sql`, and seeds initial Georgian demo projects & cards
 * if the database is empty.
 */
export async function initDatabase(): Promise<pg.Pool> {
  if (poolInstance) {
    return poolInstance;
  }

  const dbUrl = config.DATABASE_URL?.trim();
  let connectedToExternalPg = false;

  if (dbUrl && dbUrl.startsWith('postgres')) {
    try {
      const candidatePool = new Pool({
        connectionString: dbUrl,
        connectionTimeoutMillis: 3500,
      });
      await candidatePool.query('SELECT 1');
      poolInstance = candidatePool;
      connectedToExternalPg = true;
      isUsingEmbeddedPg = false;
      console.log('[DB] Connected to external PostgreSQL database.');
    } catch (err) {
      console.warn(
        '[DB] External PostgreSQL unreachable, activating embedded PostgreSQL engine (pg-mem) with local snapshot persistence.'
      );
    }
  }

  if (!connectedToExternalPg) {
    const mem = newDb();
    mem.public.registerFunction({
      name: 'now',
      returns: mem.public.getType('timestamptz' as any),
      implementation: () => new Date().toISOString(),
    });
    const pgMemAdapter = mem.adapters.createPg();
    poolInstance = new pgMemAdapter.Pool() as unknown as pg.Pool;
    isUsingEmbeddedPg = true;
  }

  // Run SQL schema migration
  const migrationSql = fs.existsSync(MIGRATION_SQL_PATH)
    ? fs.readFileSync(MIGRATION_SQL_PATH, 'utf-8')
    : FALLBACK_MIGRATION_SQL;
  await poolInstance!.query(migrationSql);

  // Ensure default studio user exists
  await poolInstance!.query(
    `INSERT INTO users (id, email, display_name, daily_generations_used, last_generation_date)
     VALUES ($1, $2, $3, 0, $4)
     ON CONFLICT (id) DO NOTHING`,
    ['demo-user', 'studio@kartulideck.ge', 'ქართული ბანქოს სტუდია (Demo User)', new Date().toISOString().slice(0, 10)]
  );

  // If using embedded pg and snapshot exists, restore it; otherwise seed initial demo projects
  if (isUsingEmbeddedPg && config.NODE_ENV !== 'test' && fs.existsSync(SNAPSHOT_FILE)) {
    try {
      await restoreEmbeddedSnapshot(poolInstance!);
    } catch (e) {
      console.warn('[DB] Snapshot restore skipped, seeding fresh demo data:', e);
    }
  }

  const existingProjects = await poolInstance!.query('SELECT COUNT(*)::int AS cnt FROM projects');
  const count = Number(existingProjects.rows[0]?.cnt ?? 0);

  if (count === 0) {
    await seedInitialDemoData(poolInstance!);
  }

  return poolInstance!;
}

async function seedInitialDemoData(pool: pg.Pool): Promise<void> {
  for (const proj of INITIAL_DEMO_PROJECTS) {
    await pool.query(
      `INSERT INTO projects (
        id, user_id, name, description, deck_config, shared_style_spec,
        status, is_demo, card_count, completed_card_count, cover_card_url, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      ON CONFLICT (id) DO NOTHING`,
      [
        proj.id,
        proj.userId,
        proj.name,
        proj.description,
        JSON.stringify(proj.deckConfig),
        JSON.stringify(proj.sharedStyleSpec),
        proj.status,
        proj.isDemo,
        proj.cardCount,
        proj.completedCardCount,
        proj.coverCardUrl || null,
        proj.createdAt,
        proj.updatedAt,
      ]
    );
  }

  for (const card of INITIAL_DEMO_CARDS) {
    await pool.query(
      `INSERT INTO cards (
        id, project_id, rank, suit, card_type, title_ka, subject_description,
        illustration_style, complexity_level, custom_prompt, illustration_url,
        design_spec, generation_status, error_message, is_favorite, is_demo,
        model_id, prompt_used, export_metadata, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21
      ) ON CONFLICT (id) DO NOTHING`,
      [
        card.id,
        card.projectId,
        card.rank,
        card.suit,
        card.cardType,
        card.titleKa,
        card.subjectDescription,
        card.illustrationStyle,
        card.complexityLevel,
        card.customPrompt || null,
        card.illustrationUrl,
        JSON.stringify(card.designSpec),
        card.generationStatus,
        card.errorMessage || null,
        card.isFavorite,
        card.isDemo,
        card.modelId,
        card.promptUsed,
        JSON.stringify(card.exportMetadata),
        card.createdAt,
        card.updatedAt,
      ]
    );

    for (const ver of card.versionHistory) {
      await pool.query(
        `INSERT INTO card_versions (
          version_id, card_id, illustration_url, prompt_used, model_id, is_demo, design_spec, note_ka, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (version_id) DO NOTHING`,
        [
          ver.versionId,
          card.id,
          ver.illustrationUrl,
          ver.promptUsed,
          ver.modelId,
          ver.isDemo,
          JSON.stringify(ver.designSpec),
          ver.noteKa || null,
          ver.createdAt,
        ]
      );
    }
  }

  await persistEmbeddedSnapshot();
}

export async function persistEmbeddedSnapshot(): Promise<void> {
  if (!isUsingEmbeddedPg || !poolInstance || config.NODE_ENV === 'test') {
    return;
  }
  try {
    if (!fs.existsSync(SNAPSHOT_DIR)) {
      fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
    }
    const projects = (await poolInstance.query('SELECT * FROM projects')).rows;
    const cards = (await poolInstance.query('SELECT * FROM cards')).rows;
    const versions = (await poolInstance.query('SELECT * FROM card_versions')).rows;
    const jobs = (await poolInstance.query('SELECT * FROM generation_jobs')).rows;

    fs.writeFileSync(
      SNAPSHOT_FILE,
      JSON.stringify({ projects, cards, versions, jobs }, null, 2),
      'utf-8'
    );
  } catch (err) {
    console.warn('[DB] Failed to write local snapshot:', err);
  }
}

async function restoreEmbeddedSnapshot(pool: pg.Pool): Promise<void> {
  const raw = fs.readFileSync(SNAPSHOT_FILE, 'utf-8');
  const data = JSON.parse(raw);

  if (Array.isArray(data.projects)) {
    for (const p of data.projects) {
      await pool.query(
        `INSERT INTO projects (
          id, user_id, name, description, deck_config, shared_style_spec,
          status, is_demo, card_count, completed_card_count, cover_card_url, active_job_id, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
        ON CONFLICT (id) DO NOTHING`,
        [
          p.id,
          p.user_id || 'demo-user',
          p.name,
          p.description || '',
          typeof p.deck_config === 'string' ? p.deck_config : JSON.stringify(p.deck_config),
          typeof p.shared_style_spec === 'string' ? p.shared_style_spec : JSON.stringify(p.shared_style_spec),
          p.status,
          Boolean(p.is_demo),
          Number(p.card_count || 0),
          Number(p.completed_card_count || 0),
          p.cover_card_url || null,
          p.active_job_id || null,
          p.created_at || new Date().toISOString(),
          p.updated_at || new Date().toISOString(),
        ]
      );
    }
  }

  if (Array.isArray(data.cards)) {
    for (const c of data.cards) {
      await pool.query(
        `INSERT INTO cards (
          id, project_id, rank, suit, card_type, title_ka, subject_description,
          illustration_style, complexity_level, custom_prompt, illustration_url,
          design_spec, generation_status, error_message, is_favorite, is_demo,
          model_id, prompt_used, export_metadata, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
        ON CONFLICT (id) DO NOTHING`,
        [
          c.id,
          c.project_id,
          c.rank,
          c.suit,
          c.card_type,
          c.title_ka,
          c.subject_description || '',
          c.illustration_style,
          c.complexity_level || 'royal-intricate',
          c.custom_prompt || null,
          c.illustration_url,
          typeof c.design_spec === 'string' ? c.design_spec : JSON.stringify(c.design_spec),
          c.generation_status || 'completed',
          c.error_message || null,
          Boolean(c.is_favorite),
          Boolean(c.is_demo),
          c.model_id || 'gemini-nano-banana-2.1',
          c.prompt_used || '',
          typeof c.export_metadata === 'string' ? c.export_metadata : JSON.stringify(c.export_metadata),
          c.created_at || new Date().toISOString(),
          c.updated_at || new Date().toISOString(),
        ]
      );
    }
  }

  if (Array.isArray(data.versions)) {
    for (const v of data.versions) {
      await pool.query(
        `INSERT INTO card_versions (
          version_id, card_id, illustration_url, prompt_used, model_id, is_demo, design_spec, note_ka, created_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        ON CONFLICT (version_id) DO NOTHING`,
        [
          v.version_id,
          v.card_id,
          v.illustration_url,
          v.prompt_used,
          v.model_id,
          Boolean(v.is_demo),
          typeof v.design_spec === 'string' ? v.design_spec : JSON.stringify(v.design_spec),
          v.note_ka || null,
          v.created_at || new Date().toISOString(),
        ]
      );
    }
  }

  if (Array.isArray(data.jobs)) {
    for (const j of data.jobs) {
      await pool.query(
        `INSERT INTO generation_jobs (
          id, project_id, status, total_cards, completed_cards, failed_cards,
          generating_cards, current_card_label, estimated_remaining_seconds,
          estimated_cost_usd, model_id, shared_style_spec, error_summary, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
        ON CONFLICT (id) DO NOTHING`,
        [
          j.id,
          j.project_id,
          j.status === 'running' ? 'paused' : j.status,
          Number(j.total_cards || 0),
          Number(j.completed_cards || 0),
          Number(j.failed_cards || 0),
          0,
          j.current_card_label || null,
          j.estimated_remaining_seconds || null,
          Number(j.estimated_cost_usd || 0),
          j.model_id,
          typeof j.shared_style_spec === 'string' ? j.shared_style_spec : JSON.stringify(j.shared_style_spec),
          j.error_summary || null,
          j.created_at || new Date().toISOString(),
          j.updated_at || new Date().toISOString(),
        ]
      );
    }
  }
}
