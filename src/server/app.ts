import path from 'node:path';
import fs from 'node:fs';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { config, isGeminiConfigured } from './config/env.js';
import { isEmbeddedDatabase } from './db/pool.js';
import {
  addCardVersion,
  createCard,
  createProject,
  deleteProject,
  duplicateProject,
  getCardById,
  getGenerationJobById,
  getProjectById,
  listCards,
  listProjects,
  updateCard,
  updateProject,
} from './db/repositories.js';
import {
  buildDeckCardCompositions,
  calculateEstimatedGenerationCost,
  CardDesignSpecSchema,
  COLOR_PALETTES,
  createSharedStyleSpecification,
  DeckConfigSchema,
  DEFAULT_CARD_DESIGN_SPEC,
  FullDeckGenerateRequestSchema,
  RANK_METADATA,
  SingleCardGenerateRequestSchema,
  SUIT_METADATA,
  SUPPORTED_GEMINI_MODELS,
} from '../shared/types.js';
import { generateCardIllustrationWithGemini } from './services/geminiService.js';
import {
  cancelOrPauseGenerationJob,
  retryOrResumeGenerationJob,
  startDeckGenerationJob,
} from './services/queueService.js';
import { generateDeckPdfBuffer } from './services/pdfExportService.js';
import { getLocalStorageDir } from './services/storageService.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.CORS_ORIGIN === '*' ? true : config.CORS_ORIGIN,
    })
  );
  app.use(express.json({ limit: '5mb' }));

  // Serve locally stored card illustrations
  app.use('/storage', express.static(getLocalStorageDir()));

  // Rate limiter for API protection & cost control
  const apiLimiter = rateLimit({
    windowMs: config.RATE_LIMIT_WINDOW_MS,
    max: config.RATE_LIMIT_MAX_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: 'მოთხოვნების ლიმიტი ამოიწურა. გთხოვთ, სცადოთ რამდენიმე წამში.',
    },
  });
  app.use('/api', apiLimiter);

  // ==========================================================================
  // System Status & Configuration Endpoint
  // ==========================================================================
  app.get('/api/status', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      geminiConfigured: isGeminiConfigured(),
      activeModel: config.GEMINI_IMAGE_MODEL,
      supportedModels: SUPPORTED_GEMINI_MODELS,
      storageDriver: config.STORAGE_DRIVER,
      databaseMode: isEmbeddedDatabase()
        ? 'embedded-postgresql-snapshot'
        : 'postgresql',
      maxDeckSize: config.MAX_DECK_SIZE,
      dailyLimit: config.USER_DAILY_GENERATION_LIMIT,
    });
  });

  // ==========================================================================
  // Projects CRUD Endpoints
  // ==========================================================================
  app.get('/api/projects', async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const projects = await listProjects();
      res.json({ projects });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/projects/:projectId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const project = await getProjectById(String(req.params.projectId));
      if (!project) {
        res.status(404).json({ error: 'პროექტი ვერ მოიძებნა.' });
        return;
      }
      const cards = await listCards({ projectId: project.id });
      const activeJob = project.activeJobId
        ? await getGenerationJobById(project.activeJobId)
        : null;
      res.json({ project, cards, activeJob });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/projects', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const CreateProjectBody = z.object({
        name: z.string().min(1, 'პროექტის სახელი აუცილებელია').max(120),
        description: z.string().max(400).optional(),
        deckConfig: DeckConfigSchema.optional(),
      });
      const parsed = CreateProjectBody.parse(req.body);
      const deckConfig =
        parsed.deckConfig ||
        DeckConfigSchema.parse({
          deckType: '52',
          ranks: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'],
        });
      const sharedStyleSpec = createSharedStyleSpecification(deckConfig);

      const project = await createProject({
        name: parsed.name,
        description: parsed.description,
        deckConfig,
        sharedStyleSpec,
        status: 'draft',
        isDemo: false,
      });

      res.status(201).json({ project });
    } catch (err) {
      next(err);
    }
  });

  app.patch('/api/projects/:projectId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const UpdateProjectBody = z.object({
        name: z.string().min(1).max(120).optional(),
        description: z.string().max(400).optional(),
        deckConfig: DeckConfigSchema.partial().optional(),
      });
      const parsed = UpdateProjectBody.parse(req.body);
      const existing = await getProjectById(String(req.params.projectId));
      if (!existing) {
        res.status(404).json({ error: 'პროექტი ვერ მოიძებნა.' });
        return;
      }

      const nextConfig = parsed.deckConfig
        ? { ...existing.deckConfig, ...parsed.deckConfig }
        : existing.deckConfig;
      const nextSharedSpec = parsed.deckConfig
        ? createSharedStyleSpecification(nextConfig)
        : existing.sharedStyleSpec;

      const updated = await updateProject(existing.id, {
        name: parsed.name,
        description: parsed.description,
        deckConfig: nextConfig,
        sharedStyleSpec: nextSharedSpec,
      });

      res.json({ project: updated });
    } catch (err) {
      next(err);
    }
  });

  app.post(
    '/api/projects/:projectId/duplicate',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const duplicated = await duplicateProject(String(req.params.projectId));
        if (!duplicated) {
          res.status(404).json({ error: 'პროექტი ვერ მოიძებნა.' });
          return;
        }
        res.status(201).json({ project: duplicated });
      } catch (err) {
        next(err);
      }
    }
  );

  app.delete(
    '/api/projects/:projectId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const ok = await deleteProject(String(req.params.projectId));
        if (!ok) {
          res.status(404).json({ error: 'პროექტი ვერ მოიძებნა.' });
          return;
        }
        res.json({ deleted: true });
      } catch (err) {
        next(err);
      }
    }
  );

  // ==========================================================================
  // Cards Listing, Single-Card Generation, Editing & Regeneration
  // ==========================================================================
  app.get('/api/cards', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cards = await listCards({
        projectId: typeof req.query.projectId === 'string' ? req.query.projectId : undefined,
        style: typeof req.query.style === 'string' ? req.query.style : undefined,
        favoriteOnly: req.query.favorite === 'true',
        search: typeof req.query.search === 'string' ? req.query.search : undefined,
      });
      res.json({ cards });
    } catch (err) {
      next(err);
    }
  });

  app.get('/api/cards/:cardId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const card = await getCardById(String(req.params.cardId));
      if (!card) {
        res.status(404).json({ error: 'კარტი ვერ მოიძებნა.' });
        return;
      }
      res.json({ card });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/cards/generate', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = SingleCardGenerateRequestSchema.parse(req.body);
      const suitInfo = SUIT_METADATA[parsed.suit];
      const rankInfo = RANK_METADATA[parsed.rank];
      const palette =
        COLOR_PALETTES.find((p) => p.id === parsed.paletteId) || COLOR_PALETTES[0];

      // Resolve or create a target project for this card
      let targetProjectId = parsed.projectId;
      if (targetProjectId) {
        const found = await getProjectById(targetProjectId);
        if (!found) targetProjectId = undefined;
      }
      if (!targetProjectId) {
        const defaultConfig = DeckConfigSchema.parse({
          deckType: 'custom',
          suits: [parsed.suit],
          ranks: [parsed.rank],
          illustrationStyle: parsed.illustrationStyle,
          paletteId: parsed.paletteId,
          ornamentMotif: parsed.ornamentMotif,
          complexityLevel: parsed.complexityLevel,
          imageQuality: parsed.imageQuality,
          modelId: parsed.modelId,
        });
        const newProj = await createProject({
          name: 'ერთეული კარტების სტუდია',
          description: 'ინდივიდუალურად გენერირებული ქართული კარტების კოლექცია.',
          deckConfig: defaultConfig,
          sharedStyleSpec: createSharedStyleSpecification(defaultConfig),
          status: 'completed',
          isDemo: false,
        });
        targetProjectId = newProj.id;
      }

      const cardId = `card-${uuidv4().slice(0, 12)}`;
      const genResult = await generateCardIllustrationWithGemini({
        cardId,
        rank: parsed.rank,
        suit: parsed.suit,
        illustrationStyle: parsed.illustrationStyle,
        paletteId: parsed.paletteId,
        ornamentMotif: parsed.ornamentMotif,
        subjectDescription: parsed.subjectDescription || rankInfo.defaultSubjectKa,
        backgroundStyle: parsed.backgroundStyle,
        complexityLevel: parsed.complexityLevel,
        customPrompt: parsed.customPrompt,
        imageQuality: parsed.imageQuality,
        modelId: parsed.modelId,
      });

      const designSpec = CardDesignSpecSchema.parse({
        ...DEFAULT_CARD_DESIGN_SPEC,
        ...parsed.designSpec,
        paletteId: palette.id,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        accentColor: palette.accent,
        surfaceColor: palette.surface,
        ornamentMotif: parsed.ornamentMotif,
      });

      const createdCard = await createCard({
        id: cardId,
        projectId: targetProjectId,
        rank: parsed.rank,
        suit: parsed.suit,
        cardType: rankInfo.cardType,
        titleKa: `${suitInfo.nameKa} — ${rankInfo.labelKa}`,
        subjectDescription: parsed.subjectDescription || rankInfo.defaultSubjectKa,
        illustrationStyle: parsed.illustrationStyle,
        complexityLevel: parsed.complexityLevel,
        customPrompt: parsed.customPrompt,
        illustrationUrl: genResult.illustrationUrl,
        designSpec,
        generationStatus: 'completed',
        isFavorite: false,
        isDemo: genResult.isDemoFallback,
        modelId: genResult.modelId,
        promptUsed: genResult.promptUsed,
        exportMetadata: {
          widthMm: designSpec.cardWidthMm,
          heightMm: designSpec.cardHeightMm,
          bleedMm: 3,
          dpi: 300,
        },
      });

      res.status(201).json({
        card: createdCard,
        generationMetadata: genResult.metadata,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post(
    '/api/cards/:cardId/regenerate',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const existing = await getCardById(String(req.params.cardId));
        if (!existing) {
          res.status(404).json({ error: 'კარტი ვერ მოიძებნა.' });
          return;
        }

        const RegenBody = z
          .object({
            subjectDescription: z.string().max(500).optional(),
            customPrompt: z.string().max(800).optional(),
            illustrationStyle: z.string().optional(),
            paletteId: z.string().optional(),
            ornamentMotif: z.enum(['vine', 'geometric', 'arch', 'manuscript']).optional(),
            complexityLevel: z.enum(['minimal', 'balanced', 'royal-intricate']).optional(),
            modelId: z.string().optional(),
            noteKa: z.string().max(200).optional(),
          })
          .optional();

        const overrides = RegenBody.parse(req.body || {}) || {};
        const proj = await getProjectById(existing.projectId);

        const nextStyle = overrides.illustrationStyle || existing.illustrationStyle;
        const nextPaletteId = overrides.paletteId || existing.designSpec.paletteId;
        const nextMotif = overrides.ornamentMotif || existing.designSpec.ornamentMotif;
        const nextSubject = overrides.subjectDescription ?? existing.subjectDescription;
        const nextCustomPrompt = overrides.customPrompt ?? existing.customPrompt;
        const nextComplexity = overrides.complexityLevel || existing.complexityLevel;

        const genResult = await generateCardIllustrationWithGemini({
          cardId: existing.id,
          rank: existing.rank,
          suit: existing.suit,
          illustrationStyle: nextStyle,
          paletteId: nextPaletteId,
          ornamentMotif: nextMotif,
          subjectDescription: nextSubject,
          complexityLevel: nextComplexity,
          customPrompt: nextCustomPrompt,
          modelId: overrides.modelId || proj?.deckConfig.modelId,
          sharedStyleSpec: proj?.sharedStyleSpec,
        });

        const palette =
          COLOR_PALETTES.find((p) => p.id === nextPaletteId) || COLOR_PALETTES[0];

        const nextDesignSpec = {
          ...existing.designSpec,
          paletteId: palette.id,
          primaryColor: palette.primary,
          secondaryColor: palette.secondary,
          accentColor: palette.accent,
          surfaceColor: palette.surface,
          ornamentMotif: nextMotif,
        };

        await addCardVersion({
          cardId: existing.id,
          illustrationUrl: genResult.illustrationUrl,
          promptUsed: genResult.promptUsed,
          modelId: genResult.modelId,
          isDemo: genResult.isDemoFallback,
          designSpec: nextDesignSpec,
          noteKa: overrides.noteKa || 'ხელახლა გენერირებული ვერსია',
        });

        const updated = await updateCard(existing.id, {
          subjectDescription: nextSubject,
          customPrompt: nextCustomPrompt,
          illustrationStyle: nextStyle,
          complexityLevel: nextComplexity,
          illustrationUrl: genResult.illustrationUrl,
          designSpec: nextDesignSpec,
          generationStatus: 'completed',
          errorMessage: null,
          isDemo: genResult.isDemoFallback,
          modelId: genResult.modelId,
          promptUsed: genResult.promptUsed,
        });

        res.json({
          card: updated,
          generationMetadata: genResult.metadata,
        });
      } catch (err) {
        next(err);
      }
    }
  );

  app.patch('/api/cards/:cardId', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const existing = await getCardById(String(req.params.cardId));
      if (!existing) {
        res.status(404).json({ error: 'კარტი ვერ მოიძებნა.' });
        return;
      }

      const PatchCardBody = z.object({
        titleKa: z.string().min(1).max(160).optional(),
        subjectDescription: z.string().max(500).optional(),
        isFavorite: z.boolean().optional(),
        illustrationUrl: z.string().optional(),
        designSpec: CardDesignSpecSchema.partial().optional(),
      });

      const parsed = PatchCardBody.parse(req.body);
      const mergedDesignSpec = parsed.designSpec
        ? { ...existing.designSpec, ...parsed.designSpec }
        : existing.designSpec;

      const updated = await updateCard(existing.id, {
        titleKa: parsed.titleKa,
        subjectDescription: parsed.subjectDescription,
        isFavorite: parsed.isFavorite,
        illustrationUrl: parsed.illustrationUrl,
        designSpec: mergedDesignSpec,
      });

      res.json({ card: updated });
    } catch (err) {
      next(err);
    }
  });

  // ==========================================================================
  // Complete Deck Generation & Background Queue Control Endpoints
  // ==========================================================================
  app.post('/api/decks/estimate', (req: Request, res: Response, next: NextFunction) => {
    try {
      const cfg = DeckConfigSchema.parse(req.body);
      const compositions = buildDeckCardCompositions(cfg);
      const estimate = calculateEstimatedGenerationCost(
        compositions.length,
        cfg.modelId,
        cfg.imageQuality
      );
      res.json({
        cardCount: compositions.length,
        estimate,
      });
    } catch (err) {
      next(err);
    }
  });

  app.post('/api/decks/generate', async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = FullDeckGenerateRequestSchema.parse(req.body);

      if (!parsed.confirmedCostEstimate) {
        res.status(400).json({
          error:
            'სრული დასტის გენერირების დაწყებამდე აუცილებელია სავარაუდო ღირებულებისა და მოცულობის დადასტურება.',
        });
        return;
      }

      const { project, job } = await startDeckGenerationJob({
        projectName: parsed.projectName,
        projectDescription: parsed.projectDescription,
        deckConfig: parsed.deckConfig,
      });

      const cards = await listCards({ projectId: project.id });

      res.status(202).json({
        project,
        job,
        cards,
      });
    } catch (err) {
      next(err);
    }
  });

  app.get(
    '/api/generation-jobs/:jobId',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const job = await getGenerationJobById(String(req.params.jobId));
        if (!job) {
          res.status(404).json({ error: 'გენერირების დავალება ვერ მოიძებნა.' });
          return;
        }
        const cards = await listCards({ projectId: job.projectId });
        const project = await getProjectById(job.projectId);
        res.json({ job, project, cards });
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    '/api/generation-jobs/:jobId/retry',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const job = await retryOrResumeGenerationJob(String(req.params.jobId));
        if (!job) {
          res.status(404).json({ error: 'გენერირების დავალება ვერ მოიძებნა.' });
          return;
        }
        const cards = await listCards({ projectId: job.projectId });
        res.json({ job, cards });
      } catch (err) {
        next(err);
      }
    }
  );

  app.post(
    '/api/generation-jobs/:jobId/cancel',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const mode = req.body?.mode === 'pause' ? 'pause' : 'cancel';
        const job = await cancelOrPauseGenerationJob(String(req.params.jobId), mode);
        if (!job) {
          res.status(404).json({ error: 'გენერირების დავალება ვერ მოიძებნა.' });
          return;
        }
        const cards = await listCards({ projectId: job.projectId });
        res.json({ job, cards });
      } catch (err) {
        next(err);
      }
    }
  );

  // ==========================================================================
  // Export Endpoint (PDF Print-Ready Sheet / Single-Card-Per-Page / JSON Manifest)
  // ==========================================================================
  app.get(
    '/api/projects/:projectId/export',
    async (req: Request, res: Response, next: NextFunction) => {
      try {
        const project = await getProjectById(String(req.params.projectId));
        if (!project) {
          res.status(404).json({ error: 'პროექტი ვერ მოიძებნა.' });
          return;
        }

        const cards = await listCards({ projectId: project.id });
        const format = (req.query.format as string) || 'pdf';
        const layoutMode =
          req.query.layout === 'one-per-page' ? 'one-per-page' : 'print-sheet';
        const pageSize =
          req.query.pageSize === 'LETTER'
            ? 'LETTER'
            : req.query.pageSize === 'SRA3'
            ? 'SRA3'
            : 'A4';
        const cardWidthMm = Number(req.query.cardWidthMm) || project.deckConfig.cardWidthMm || 63;
        const cardHeightMm =
          Number(req.query.cardHeightMm) || project.deckConfig.cardHeightMm || 88;
        const bleedMm = Number(req.query.bleedMm ?? 3);
        const safeMarginMm = Number(req.query.safeMarginMm ?? 5);
        const includeCropMarks = req.query.cropMarks !== 'false';
        const includeCardBack = req.query.cardBack !== 'false';

        if (format === 'pdf') {
          const pdfBuffer = await generateDeckPdfBuffer({
            project,
            cards,
            layoutMode,
            pageSize,
            cardWidthMm,
            cardHeightMm,
            bleedMm,
            safeMarginMm,
            includeCropMarks,
            includeCardBack,
          });

          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader(
            'Content-Disposition',
            `attachment; filename="kartuli-deck-${project.id}.pdf"`
          );
          res.send(pdfBuffer);
          return;
        }

        res.json({
          project,
          cards,
          exportSpec: {
            format,
            layoutMode,
            pageSize,
            cardWidthMm,
            cardHeightMm,
            bleedMm,
            safeMarginMm,
            includeCropMarks,
            includeCardBack,
            validatedPrintReady: bleedMm >= 2 && safeMarginMm >= 3,
          },
        });
      } catch (err) {
        next(err);
      }
    }
  );

  // Serve built frontend in production
  const distPath = path.resolve(process.cwd(), 'dist');
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api') || req.path.startsWith('/storage')) {
        next();
        return;
      }
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Centralized error handler (never leaks API keys or internal stack in prod)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof z.ZodError) {
      res.status(400).json({
        error: 'შეყვანილი მონაცემები არასწორია.',
        details: err.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
      });
      return;
    }

    const safeMessage = (err?.message || 'სერვერის შიდა შეცდომა').replace(
      config.GEMINI_API_KEY || '__NONE__',
      '[REDACTED]'
    );

    console.error('[API Error]:', safeMessage);
    res.status(err?.status || 500).json({
      error: safeMessage,
    });
  });

  return app;
}
