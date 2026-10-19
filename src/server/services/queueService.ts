import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env.js';
import {
  addCardVersion,
  createCard,
  createGenerationJob,
  createProject,
  getGenerationJobById,
  getProjectById,
  listCards,
  updateCard,
  updateGenerationJob,
  updateProject,
} from '../db/repositories.js';
import {
  buildDeckCardCompositions,
  calculateEstimatedGenerationCost,
  COLOR_PALETTES,
  createSharedStyleSpecification,
  DEFAULT_CARD_DESIGN_SPEC,
  DeckConfig,
  GenerationJob,
  Project,
} from '../../shared/types.js';
import { generateCardIllustrationWithGemini } from './geminiService.js';

// Track active worker controllers so jobs can be paused or cancelled safely
const activeJobControllers = new Map<
  string,
  {
    cancelled: boolean;
    paused: boolean;
  }
>();

/**
 * Enqueues and starts a full-deck generation project.
 * 1. Creates the shared style specification first.
 * 2. Creates the project and inserts all pending card records in a single batch (preventing duplicate creation).
 * 3. Creates the persistent GenerationJob record.
 * 4. Launches the background worker with bounded concurrency (`config.QUEUE_CONCURRENCY`).
 */
export async function startDeckGenerationJob(params: {
  projectName: string;
  projectDescription?: string;
  deckConfig: DeckConfig;
}): Promise<{
  project: Project;
  job: GenerationJob;
}> {
  const compositions = buildDeckCardCompositions(params.deckConfig);

  if (compositions.length > config.MAX_DECK_SIZE) {
    throw new Error(
      `დასტის ზომა (${compositions.length}) აღემატება დასაშვებ მაქსიმუმს (${config.MAX_DECK_SIZE} კარტი).`
    );
  }

  const sharedStyleSpec = createSharedStyleSpecification(params.deckConfig);
  const costEst = calculateEstimatedGenerationCost(
    compositions.length,
    params.deckConfig.modelId,
    params.deckConfig.imageQuality
  );

  const palette =
    COLOR_PALETTES.find((p) => p.id === params.deckConfig.paletteId) ||
    COLOR_PALETTES[0];

  const project = await createProject({
    name: params.projectName,
    description:
      params.projectDescription ||
      `ქართული დასტა (${compositions.length} კარტი) — ${sharedStyleSpec.artDirection}`,
    deckConfig: params.deckConfig,
    sharedStyleSpec,
    status: 'generating',
    isDemo: false,
    cardCount: compositions.length,
    completedCardCount: 0,
  });

  // Create pending card rows for every combination in the deck
  for (const item of compositions) {
    const cardId = `card-${uuidv4().slice(0, 12)}`;
    await createCard({
      id: cardId,
      projectId: project.id,
      rank: item.rank,
      suit: item.suit,
      cardType: item.cardType,
      titleKa: item.titleKa,
      subjectDescription: item.defaultSubjectKa,
      illustrationStyle: params.deckConfig.illustrationStyle,
      complexityLevel: params.deckConfig.complexityLevel,
      customPrompt: params.deckConfig.customDeckThemePrompt,
      illustrationUrl: '',
      designSpec: {
        ...DEFAULT_CARD_DESIGN_SPEC,
        paletteId: palette.id,
        primaryColor: palette.primary,
        secondaryColor: palette.secondary,
        accentColor: palette.accent,
        surfaceColor: palette.surface,
        ornamentMotif: params.deckConfig.ornamentMotif,
        cardWidthMm: params.deckConfig.cardWidthMm,
        cardHeightMm: params.deckConfig.cardHeightMm,
      },
      generationStatus: 'pending',
      isFavorite: false,
      isDemo: false,
      modelId: params.deckConfig.modelId,
      promptUsed: '',
      exportMetadata: {
        widthMm: params.deckConfig.cardWidthMm,
        heightMm: params.deckConfig.cardHeightMm,
        bleedMm: 3,
        dpi: 300,
      },
    });
  }

  const jobId = `job-${uuidv4().slice(0, 12)}`;
  const job = await createGenerationJob({
    id: jobId,
    projectId: project.id,
    status: 'queued',
    totalCards: compositions.length,
    completedCards: 0,
    failedCards: 0,
    generatingCards: 0,
    currentCardLabel: 'სტილის სპეციფიკაცია მზადაა, იწყება გენერირება...',
    estimatedRemainingSeconds: compositions.length * 2,
    estimatedCostUsd: costEst.totalUsd,
    modelId: params.deckConfig.modelId,
    sharedStyleSpec,
  });

  await updateProject(project.id, { activeJobId: job.id, status: 'generating' });

  // Trigger background worker asynchronously (do not block HTTP response)
  void processGenerationJobInBackground(job.id);

  return {
    project: (await getProjectById(project.id))!,
    job,
  };
}

/**
 * Background worker that processes pending or failed cards for a given `jobId`
 * with bounded concurrency (`config.QUEUE_CONCURRENCY`).
 * Safe against duplicate charges: only cards in `pending` status are processed.
 */
export async function processGenerationJobInBackground(jobId: string): Promise<void> {
  if (activeJobControllers.has(jobId)) {
    return; // Already running
  }

  const controller = { cancelled: false, paused: false };
  activeJobControllers.set(jobId, controller);

  try {
    const job = await getGenerationJobById(jobId);
    if (!job) return;

    const project = await getProjectById(job.projectId);
    if (!project) return;

    await updateGenerationJob(jobId, { status: 'running', errorSummary: undefined });
    await updateProject(project.id, { status: 'generating' });

    const allCards = await listCards({ projectId: project.id });
    // Sort in logical order: Aces/Court first, then pips
    const pendingQueue = allCards.filter((c) => c.generationStatus === 'pending');

    const concurrency = Math.max(1, Math.min(config.QUEUE_CONCURRENCY || 2, 4));
    let activeWorkers = 0;
    let avgDurationMs = 1400;

    const syncJobProgress = async (currentLabel?: string) => {
      const latestCards = await listCards({ projectId: project.id });
      const completed = latestCards.filter((c) => c.generationStatus === 'completed').length;
      const failed = latestCards.filter((c) => c.generationStatus === 'failed').length;
      const generating = latestCards.filter((c) => c.generationStatus === 'generating').length;
      const remaining = Math.max(0, latestCards.length - completed - failed);
      const estSeconds = Math.ceil((remaining * avgDurationMs) / (1000 * concurrency));

      await updateGenerationJob(jobId, {
        totalCards: latestCards.length,
        completedCards: completed,
        failedCards: failed,
        generatingCards: generating,
        currentCardLabel: currentLabel,
        estimatedRemainingSeconds: remaining > 0 ? estSeconds : 0,
      });
    };

    let idx = 0;

    const workerLoop = async () => {
      while (idx < pendingQueue.length) {
        if (controller.cancelled || controller.paused) {
          break;
        }
        const currentIndex = idx++;
        const targetCard = pendingQueue[currentIndex];
        if (!targetCard) break;

        activeWorkers++;
        const cardStart = Date.now();

        try {
          await updateCard(targetCard.id, {
            generationStatus: 'generating',
            errorMessage: null,
          });
          await syncJobProgress(targetCard.titleKa);

          // Small pacing delay so UI progress updates smoothly and rate limits are respected
          await new Promise((r) => setTimeout(r, 250));

          if (controller.cancelled || controller.paused) {
            await updateCard(targetCard.id, { generationStatus: 'pending' });
            break;
          }

          const result = await generateCardIllustrationWithGemini({
            cardId: targetCard.id,
            rank: targetCard.rank,
            suit: targetCard.suit,
            illustrationStyle: targetCard.illustrationStyle,
            paletteId: targetCard.designSpec.paletteId,
            ornamentMotif: targetCard.designSpec.ornamentMotif,
            subjectDescription: targetCard.subjectDescription,
            complexityLevel: targetCard.complexityLevel,
            customPrompt: targetCard.customPrompt,
            imageQuality: project.deckConfig.imageQuality,
            modelId: project.deckConfig.modelId,
            sharedStyleSpec: job.sharedStyleSpec,
          });

          const elapsed = Date.now() - cardStart;
          avgDurationMs = Math.round(avgDurationMs * 0.7 + elapsed * 0.3);

          await updateCard(targetCard.id, {
            illustrationUrl: result.illustrationUrl,
            generationStatus: 'completed',
            isDemo: result.isDemoFallback,
            modelId: result.modelId,
            promptUsed: result.promptUsed,
            errorMessage: null,
          });

          await addCardVersion({
            cardId: targetCard.id,
            illustrationUrl: result.illustrationUrl,
            promptUsed: result.promptUsed,
            modelId: result.modelId,
            isDemo: result.isDemoFallback,
            designSpec: targetCard.designSpec,
            noteKa: 'დასტის ავტომატური გენერაცია',
          });
        } catch (err: any) {
          await updateCard(targetCard.id, {
            generationStatus: 'failed',
            errorMessage: err?.message || 'გენერირების შეცდომა',
          });
        } finally {
          activeWorkers--;
          await syncJobProgress();
        }
      }
    };

    const workers = Array.from({ length: Math.min(concurrency, pendingQueue.length || 1) }, () =>
      workerLoop()
    );
    await Promise.all(workers);

    // Finalize job status
    const finalCards = await listCards({ projectId: project.id });
    const completed = finalCards.filter((c) => c.generationStatus === 'completed').length;
    const failed = finalCards.filter((c) => c.generationStatus === 'failed').length;

    if (controller.cancelled) {
      await updateGenerationJob(jobId, {
        status: 'cancelled',
        generatingCards: 0,
        currentCardLabel: 'გენერირება გაუქმებულია მომხმარებლის მიერ',
        estimatedRemainingSeconds: 0,
      });
      await updateProject(project.id, { status: 'incomplete' });
    } else if (controller.paused) {
      await updateGenerationJob(jobId, {
        status: 'paused',
        generatingCards: 0,
        currentCardLabel: 'გენერირება დაპაუზებულია',
      });
      await updateProject(project.id, { status: 'incomplete' });
    } else if (failed > 0 && completed < finalCards.length) {
      await updateGenerationJob(jobId, {
        status: 'failed',
        generatingCards: 0,
        completedCards: completed,
        failedCards: failed,
        currentCardLabel: `დასრულდა ხარვეზებით (${failed} კარტი ვერ შეიქმნა)`,
        errorSummary: `${failed} კარტის გენერირება ვერ მოხერხდა. შეგიძლიათ სცადოთ ხელახლა.`,
      });
      await updateProject(project.id, { status: 'incomplete' });
    } else {
      await updateGenerationJob(jobId, {
        status: 'completed',
        generatingCards: 0,
        completedCards: completed,
        failedCards: 0,
        currentCardLabel: 'დასტის ყველა კარტი წარმატებით შეიქმნა!',
        estimatedRemainingSeconds: 0,
      });
      await updateProject(project.id, { status: 'completed' });
    }
  } finally {
    activeJobControllers.delete(jobId);
  }
}

/**
 * Retries failed or pending cards in a job without duplicating or recharging already completed cards.
 */
export async function retryOrResumeGenerationJob(jobId: string): Promise<GenerationJob | null> {
  const job = await getGenerationJobById(jobId);
  if (!job) return null;

  const cards = await listCards({ projectId: job.projectId });
  for (const card of cards) {
    if (card.generationStatus === 'failed' || card.generationStatus === 'generating') {
      await updateCard(card.id, {
        generationStatus: 'pending',
        errorMessage: null,
      });
    }
  }

  await updateGenerationJob(jobId, {
    status: 'queued',
    failedCards: 0,
    currentCardLabel: 'ხელახალი მცდელობა იწყება...',
    errorSummary: undefined,
  });

  void processGenerationJobInBackground(jobId);
  return getGenerationJobById(jobId);
}

/**
 * Cancels or pauses an active generation job.
 */
export async function cancelOrPauseGenerationJob(
  jobId: string,
  mode: 'cancel' | 'pause' = 'cancel'
): Promise<GenerationJob | null> {
  const controller = activeJobControllers.get(jobId);
  if (controller) {
    if (mode === 'pause') {
      controller.paused = true;
    } else {
      controller.cancelled = true;
    }
  }

  const job = await getGenerationJobById(jobId);
  if (!job) return null;

  await updateGenerationJob(jobId, {
    status: mode === 'pause' ? 'paused' : 'cancelled',
    generatingCards: 0,
    currentCardLabel:
      mode === 'pause'
        ? 'გენერირება დაპაუზებულია'
        : 'გენერირება გაუქმებულია',
  });
  await updateProject(job.projectId, { status: 'incomplete' });

  return getGenerationJobById(jobId);
}
