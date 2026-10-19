import { v4 as uuidv4 } from 'uuid';
import { getPool, persistEmbeddedSnapshot } from '../db/pool.js';
import {
  CardDesignSpec,
  CardVersion,
  DeckConfig,
  GenerationJob,
  PlayingCard,
  Project,
  SharedStyleSpec,
} from '../../shared/types.js';

function parseJsonField<T>(val: any, fallback: T): T {
  if (!val) return fallback;
  if (typeof val === 'object') return val as T;
  try {
    return JSON.parse(val) as T;
  } catch {
    return fallback;
  }
}

export async function listProjects(): Promise<Project[]> {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM projects ORDER BY updated_at DESC');
  return res.rows.map(mapRowToProject);
}

export async function getProjectById(projectId: string): Promise<Project | null> {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (res.rows.length === 0) return null;
  return mapRowToProject(res.rows[0]);
}

export async function createProject(params: {
  id?: string;
  userId?: string;
  name: string;
  description?: string;
  deckConfig: DeckConfig;
  sharedStyleSpec: SharedStyleSpec;
  status?: Project['status'];
  isDemo?: boolean;
  cardCount?: number;
  completedCardCount?: number;
}): Promise<Project> {
  const pool = getPool();
  const id = params.id || `proj-${uuidv4().slice(0, 12)}`;
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO projects (
      id, user_id, name, description, deck_config, shared_style_spec,
      status, is_demo, card_count, completed_card_count, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      id,
      params.userId || 'demo-user',
      params.name,
      params.description || '',
      JSON.stringify(params.deckConfig),
      JSON.stringify(params.sharedStyleSpec),
      params.status || 'draft',
      Boolean(params.isDemo),
      params.cardCount ?? 0,
      params.completedCardCount ?? 0,
      now,
      now,
    ]
  );

  // Also insert into deck_configurations table
  await pool.query(
    `INSERT INTO deck_configurations (
      id, project_id, deck_type, suits, ranks, include_joker, joker_count,
      include_card_back, illustration_style, palette_id, ornament_motif,
      complexity_level, card_width_mm, card_height_mm, image_quality, model_id, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)`,
    [
      `dcfg-${uuidv4().slice(0, 12)}`,
      id,
      params.deckConfig.deckType,
      JSON.stringify(params.deckConfig.suits),
      JSON.stringify(params.deckConfig.ranks),
      params.deckConfig.includeJoker,
      params.deckConfig.jokerCount,
      params.deckConfig.includeCardBack,
      params.deckConfig.illustrationStyle,
      params.deckConfig.paletteId,
      params.deckConfig.ornamentMotif,
      params.deckConfig.complexityLevel,
      params.deckConfig.cardWidthMm,
      params.deckConfig.cardHeightMm,
      params.deckConfig.imageQuality,
      params.deckConfig.modelId,
      now,
    ]
  );

  await persistEmbeddedSnapshot();
  return (await getProjectById(id))!;
}

export async function updateProject(
  projectId: string,
  updates: Partial<{
    name: string;
    description: string;
    deckConfig: DeckConfig;
    sharedStyleSpec: SharedStyleSpec;
    status: Project['status'];
    cardCount: number;
    completedCardCount: number;
    coverCardUrl: string;
    activeJobId: string | null;
  }>
): Promise<Project | null> {
  const existing = await getProjectById(projectId);
  if (!existing) return null;

  const pool = getPool();
  const now = new Date().toISOString();

  const nextName = updates.name ?? existing.name;
  const nextDesc = updates.description ?? existing.description;
  const nextDeckConfig = updates.deckConfig ?? existing.deckConfig;
  const nextStyleSpec = updates.sharedStyleSpec ?? existing.sharedStyleSpec;
  const nextStatus = updates.status ?? existing.status;
  const nextCardCount = updates.cardCount ?? existing.cardCount;
  const nextCompleted = updates.completedCardCount ?? existing.completedCardCount;
  const nextCover = updates.coverCardUrl ?? existing.coverCardUrl ?? null;
  const nextJobId =
    updates.activeJobId !== undefined ? updates.activeJobId : existing.activeJobId ?? null;

  await pool.query(
    `UPDATE projects
     SET name = $1, description = $2, deck_config = $3, shared_style_spec = $4,
         status = $5, card_count = $6, completed_card_count = $7,
         cover_card_url = $8, active_job_id = $9, updated_at = $10
     WHERE id = $11`,
    [
      nextName,
      nextDesc,
      JSON.stringify(nextDeckConfig),
      JSON.stringify(nextStyleSpec),
      nextStatus,
      nextCardCount,
      nextCompleted,
      nextCover,
      nextJobId,
      now,
      projectId,
    ]
  );

  await persistEmbeddedSnapshot();
  return getProjectById(projectId);
}

export async function deleteProject(projectId: string): Promise<boolean> {
  const pool = getPool();
  await pool.query('DELETE FROM card_versions WHERE card_id IN (SELECT id FROM cards WHERE project_id = $1)', [projectId]);
  await pool.query('DELETE FROM cards WHERE project_id = $1', [projectId]);
  await pool.query('DELETE FROM generation_jobs WHERE project_id = $1', [projectId]);
  await pool.query('DELETE FROM deck_configurations WHERE project_id = $1', [projectId]);
  const res = await pool.query('DELETE FROM projects WHERE id = $1', [projectId]);
  await persistEmbeddedSnapshot();
  return (res.rowCount ?? 0) > 0;
}

export async function duplicateProject(projectId: string): Promise<Project | null> {
  const source = await getProjectById(projectId);
  if (!source) return null;

  const sourceCards = await listCards({ projectId });
  const newProj = await createProject({
    name: `${source.name} (ასლი)`,
    description: source.description,
    deckConfig: source.deckConfig,
    sharedStyleSpec: source.sharedStyleSpec,
    status: source.status,
    isDemo: source.isDemo,
    cardCount: sourceCards.length,
    completedCardCount: sourceCards.filter((c) => c.generationStatus === 'completed').length,
  });

  for (const card of sourceCards) {
    await createCard({
      ...card,
      id: `card-${uuidv4().slice(0, 12)}`,
      projectId: newProj.id,
    });
  }

  return getProjectById(newProj.id);
}

export async function listCards(filters?: {
  projectId?: string;
  style?: string;
  favoriteOnly?: boolean;
  search?: string;
}): Promise<PlayingCard[]> {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM cards ORDER BY created_at DESC');
  const versionsRes = await pool.query('SELECT * FROM card_versions ORDER BY created_at DESC');

  const versionsByCard = new Map<string, CardVersion[]>();
  for (const vRow of versionsRes.rows) {
    const cid = vRow.card_id;
    const list = versionsByCard.get(cid) || [];
    list.push({
      versionId: vRow.version_id,
      createdAt: vRow.created_at,
      illustrationUrl: vRow.illustration_url,
      promptUsed: vRow.prompt_used,
      modelId: vRow.model_id,
      isDemo: Boolean(vRow.is_demo),
      designSpec: parseJsonField(vRow.design_spec, {} as CardDesignSpec),
      noteKa: vRow.note_ka || undefined,
    });
    versionsByCard.set(cid, list);
  }

  let cards = res.rows.map((r) => mapRowToCard(r, versionsByCard.get(r.id) || []));

  if (filters?.projectId) {
    cards = cards.filter((c) => c.projectId === filters.projectId);
  }
  if (filters?.style && filters.style !== 'all') {
    cards = cards.filter((c) => c.illustrationStyle === filters.style);
  }
  if (filters?.favoriteOnly) {
    cards = cards.filter((c) => c.isFavorite);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    cards = cards.filter(
      (c) =>
        c.titleKa.toLowerCase().includes(q) ||
        c.subjectDescription.toLowerCase().includes(q) ||
        c.rank.toLowerCase().includes(q) ||
        c.suit.toLowerCase().includes(q)
    );
  }

  return cards;
}

export async function getCardById(cardId: string): Promise<PlayingCard | null> {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM cards WHERE id = $1', [cardId]);
  if (res.rows.length === 0) return null;

  const versionsRes = await pool.query(
    'SELECT * FROM card_versions WHERE card_id = $1 ORDER BY created_at DESC',
    [cardId]
  );

  const versions: CardVersion[] = versionsRes.rows.map((vRow) => ({
    versionId: vRow.version_id,
    createdAt: vRow.created_at,
    illustrationUrl: vRow.illustration_url,
    promptUsed: vRow.prompt_used,
    modelId: vRow.model_id,
    isDemo: Boolean(vRow.is_demo),
    designSpec: parseJsonField(vRow.design_spec, {} as CardDesignSpec),
    noteKa: vRow.note_ka || undefined,
  }));

  return mapRowToCard(res.rows[0], versions);
}

export async function createCard(card: Omit<PlayingCard, 'createdAt' | 'updatedAt' | 'versionHistory'> & {
  versionHistory?: CardVersion[];
}): Promise<PlayingCard> {
  const pool = getPool();
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO cards (
      id, project_id, rank, suit, card_type, title_ka, subject_description,
      illustration_style, complexity_level, custom_prompt, illustration_url,
      design_spec, generation_status, error_message, is_favorite, is_demo,
      model_id, prompt_used, export_metadata, created_at, updated_at
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
    )`,
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
      now,
      now,
    ]
  );

  // Save initial version if card is completed
  if (card.generationStatus === 'completed' && card.illustrationUrl) {
    await addCardVersion({
      cardId: card.id,
      illustrationUrl: card.illustrationUrl,
      promptUsed: card.promptUsed,
      modelId: card.modelId,
      isDemo: card.isDemo,
      designSpec: card.designSpec,
      noteKa: 'საწყისი გენერირებული ვერსია',
    });
  }

  await refreshProjectCardCounts(card.projectId);
  await persistEmbeddedSnapshot();
  return (await getCardById(card.id))!;
}

export async function addCardVersion(params: {
  cardId: string;
  illustrationUrl: string;
  promptUsed: string;
  modelId: string;
  isDemo: boolean;
  designSpec: CardDesignSpec;
  noteKa?: string;
}): Promise<CardVersion> {
  const pool = getPool();
  const versionId = `ver-${uuidv4().slice(0, 12)}`;
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO card_versions (
      version_id, card_id, illustration_url, prompt_used, model_id, is_demo, design_spec, note_ka, created_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
    [
      versionId,
      params.cardId,
      params.illustrationUrl,
      params.promptUsed,
      params.modelId,
      params.isDemo,
      JSON.stringify(params.designSpec),
      params.noteKa || null,
      now,
    ]
  );

  return {
    versionId,
    createdAt: now,
    illustrationUrl: params.illustrationUrl,
    promptUsed: params.promptUsed,
    modelId: params.modelId,
    isDemo: params.isDemo,
    designSpec: params.designSpec,
    noteKa: params.noteKa,
  };
}

export async function updateCard(
  cardId: string,
  updates: Partial<{
    titleKa: string;
    subjectDescription: string;
    illustrationStyle: string;
    complexityLevel: PlayingCard['complexityLevel'];
    customPrompt: string;
    illustrationUrl: string;
    designSpec: CardDesignSpec;
    generationStatus: PlayingCard['generationStatus'];
    errorMessage: string | null;
    isFavorite: boolean;
    isDemo: boolean;
    modelId: string;
    promptUsed: string;
  }>
): Promise<PlayingCard | null> {
  const existing = await getCardById(cardId);
  if (!existing) return null;

  const pool = getPool();
  const now = new Date().toISOString();

  await pool.query(
    `UPDATE cards
     SET title_ka = $1,
         subject_description = $2,
         illustration_style = $3,
         complexity_level = $4,
         custom_prompt = $5,
         illustration_url = $6,
         design_spec = $7,
         generation_status = $8,
         error_message = $9,
         is_favorite = $10,
         is_demo = $11,
         model_id = $12,
         prompt_used = $13,
         updated_at = $14
     WHERE id = $15`,
    [
      updates.titleKa ?? existing.titleKa,
      updates.subjectDescription ?? existing.subjectDescription,
      updates.illustrationStyle ?? existing.illustrationStyle,
      updates.complexityLevel ?? existing.complexityLevel,
      updates.customPrompt ?? existing.customPrompt ?? null,
      updates.illustrationUrl ?? existing.illustrationUrl,
      JSON.stringify(updates.designSpec ?? existing.designSpec),
      updates.generationStatus ?? existing.generationStatus,
      updates.errorMessage !== undefined ? updates.errorMessage : existing.errorMessage ?? null,
      updates.isFavorite ?? existing.isFavorite,
      updates.isDemo ?? existing.isDemo,
      updates.modelId ?? existing.modelId,
      updates.promptUsed ?? existing.promptUsed,
      now,
      cardId,
    ]
  );

  await refreshProjectCardCounts(existing.projectId);
  await persistEmbeddedSnapshot();
  return getCardById(cardId);
}

export async function refreshProjectCardCounts(projectId: string): Promise<void> {
  const pool = getPool();
  const cards = await listCards({ projectId });
  const total = cards.length;
  const completed = cards.filter((c) => c.generationStatus === 'completed').length;
  const cover = cards.find((c) => c.generationStatus === 'completed')?.illustrationUrl;

  await pool.query(
    `UPDATE projects
     SET card_count = $1, completed_card_count = $2, cover_card_url = COALESCE($3, cover_card_url), updated_at = $4
     WHERE id = $5`,
    [total, completed, cover || null, new Date().toISOString(), projectId]
  );
}

// ============================================================================
// Generation Job Persistence
// ============================================================================

export async function createGenerationJob(job: Omit<GenerationJob, 'createdAt' | 'updatedAt'>): Promise<GenerationJob> {
  const pool = getPool();
  const now = new Date().toISOString();

  await pool.query(
    `INSERT INTO generation_jobs (
      id, project_id, status, total_cards, completed_cards, failed_cards,
      generating_cards, current_card_label, estimated_remaining_seconds,
      estimated_cost_usd, model_id, shared_style_spec, error_summary, created_at, updated_at
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
    [
      job.id,
      job.projectId,
      job.status,
      job.totalCards,
      job.completedCards,
      job.failedCards,
      job.generatingCards,
      job.currentCardLabel || null,
      job.estimatedRemainingSeconds ?? null,
      job.estimatedCostUsd,
      job.modelId,
      JSON.stringify(job.sharedStyleSpec),
      job.errorSummary || null,
      now,
      now,
    ]
  );

  await persistEmbeddedSnapshot();
  return (await getGenerationJobById(job.id))!;
}

export async function getGenerationJobById(jobId: string): Promise<GenerationJob | null> {
  const pool = getPool();
  const res = await pool.query('SELECT * FROM generation_jobs WHERE id = $1', [jobId]);
  if (res.rows.length === 0) return null;
  return mapRowToJob(res.rows[0]);
}

export async function updateGenerationJob(
  jobId: string,
  updates: Partial<Omit<GenerationJob, 'id' | 'projectId' | 'createdAt' | 'updatedAt'>>
): Promise<GenerationJob | null> {
  const existing = await getGenerationJobById(jobId);
  if (!existing) return null;

  const pool = getPool();
  const now = new Date().toISOString();

  await pool.query(
    `UPDATE generation_jobs
     SET status = $1,
         total_cards = $2,
         completed_cards = $3,
         failed_cards = $4,
         generating_cards = $5,
         current_card_label = $6,
         estimated_remaining_seconds = $7,
         error_summary = $8,
         updated_at = $9
     WHERE id = $10`,
    [
      updates.status ?? existing.status,
      updates.totalCards ?? existing.totalCards,
      updates.completedCards ?? existing.completedCards,
      updates.failedCards ?? existing.failedCards,
      updates.generatingCards ?? existing.generatingCards,
      updates.currentCardLabel !== undefined
        ? updates.currentCardLabel
        : existing.currentCardLabel ?? null,
      updates.estimatedRemainingSeconds !== undefined
        ? updates.estimatedRemainingSeconds
        : existing.estimatedRemainingSeconds ?? null,
      updates.errorSummary !== undefined ? updates.errorSummary : existing.errorSummary ?? null,
      now,
      jobId,
    ]
  );

  await persistEmbeddedSnapshot();
  return getGenerationJobById(jobId);
}

function mapRowToProject(row: any): Project {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    description: row.description || '',
    deckConfig: parseJsonField(row.deck_config, {} as DeckConfig),
    sharedStyleSpec: parseJsonField(row.shared_style_spec, {} as SharedStyleSpec),
    status: row.status,
    isDemo: Boolean(row.is_demo),
    cardCount: Number(row.card_count || 0),
    completedCardCount: Number(row.completed_card_count || 0),
    coverCardUrl: row.cover_card_url || undefined,
    activeJobId: row.active_job_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToCard(row: any, versions: CardVersion[]): PlayingCard {
  return {
    id: row.id,
    projectId: row.project_id,
    rank: row.rank,
    suit: row.suit,
    cardType: row.card_type,
    titleKa: row.title_ka,
    subjectDescription: row.subject_description || '',
    illustrationStyle: row.illustration_style,
    complexityLevel: row.complexity_level || 'royal-intricate',
    customPrompt: row.custom_prompt || undefined,
    illustrationUrl: row.illustration_url,
    designSpec: parseJsonField(row.design_spec, {} as CardDesignSpec),
    generationStatus: row.generation_status,
    errorMessage: row.error_message || undefined,
    isFavorite: Boolean(row.is_favorite),
    isDemo: Boolean(row.is_demo),
    modelId: row.model_id,
    promptUsed: row.prompt_used || '',
    versionHistory: versions,
    exportMetadata: parseJsonField(row.export_metadata, {
      widthMm: 63,
      heightMm: 88,
      bleedMm: 3,
      dpi: 300,
    }),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapRowToJob(row: any): GenerationJob {
  return {
    id: row.id,
    projectId: row.project_id,
    status: row.status,
    totalCards: Number(row.total_cards || 0),
    completedCards: Number(row.completed_cards || 0),
    failedCards: Number(row.failed_cards || 0),
    generatingCards: Number(row.generating_cards || 0),
    currentCardLabel: row.current_card_label || undefined,
    estimatedRemainingSeconds:
      row.estimated_remaining_seconds !== null && row.estimated_remaining_seconds !== undefined
        ? Number(row.estimated_remaining_seconds)
        : undefined,
    estimatedCostUsd: Number(row.estimated_cost_usd || 0),
    modelId: row.model_id,
    sharedStyleSpec: parseJsonField(row.shared_style_spec, {} as SharedStyleSpec),
    errorSummary: row.error_summary || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
