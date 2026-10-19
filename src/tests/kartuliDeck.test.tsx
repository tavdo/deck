import React from 'react';
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import request from 'supertest';
import {
  buildDeckCardCompositions,
  calculateEstimatedGenerationCost,
  createSharedStyleSpecification,
  DeckConfigSchema,
  RANKS_36,
  RANKS_52,
  STANDARD_SUITS,
} from '../shared/types';
import {
  buildCardIllustrationPrompt,
  parseGeminiImageResponse,
  sanitizeUserPrompt,
} from '../server/services/geminiService';
import { initDatabase } from '../server/db/pool';
import { createApp } from '../server/app';
import { CardRenderer } from '../client/components/CardRenderer';
import { KartuliDeckLogo } from '../client/components/GeorgianOrnaments';

describe('Kartuli Deck AI — Comprehensive Suite', () => {
  // ==========================================================================
  // 1. Deck Composition Validation (52-Card, 36-Card, Custom & Jokers)
  // ==========================================================================
  describe('Deck Composition & Card Combinations', () => {
    it('generates exactly 52 unique (suit, rank) combinations for a standard 52-card deck without jokers', () => {
      const config = DeckConfigSchema.parse({
        deckType: '52',
        suits: STANDARD_SUITS,
        ranks: [...RANKS_52],
        includeJoker: false,
        jokerCount: 0,
      });

      const cards = buildDeckCardCompositions(config);
      expect(cards).toHaveLength(52);

      const uniquePairs = new Set(cards.map((c) => `${c.suit}:${c.rank}`));
      expect(uniquePairs.size).toBe(52);
    });

    it('handles optional jokers separately in a 52-card deck (52 + 2 jokers = 54 cards)', () => {
      const config = DeckConfigSchema.parse({
        deckType: '52',
        suits: STANDARD_SUITS,
        ranks: [...RANKS_52],
        includeJoker: true,
        jokerCount: 2,
      });

      const cards = buildDeckCardCompositions(config);
      expect(cards).toHaveLength(54);

      const jokers = cards.filter((c) => c.rank === 'JOKER');
      const standardCards = cards.filter((c) => c.rank !== 'JOKER');
      expect(jokers).toHaveLength(2);
      expect(standardCards).toHaveLength(52);
    });

    it('generates exactly 36 unique combinations for a 36-card deck (ranks 6 through Ace)', () => {
      const config = DeckConfigSchema.parse({
        deckType: '36',
        suits: STANDARD_SUITS,
        ranks: [...RANKS_36],
        includeJoker: false,
        jokerCount: 0,
      });

      const cards = buildDeckCardCompositions(config);
      expect(cards).toHaveLength(36);

      const hasRank2 = cards.some((c) => c.rank === '2');
      const hasRank6 = cards.some((c) => c.rank === '6');
      const hasAce = cards.some((c) => c.rank === 'A');
      expect(hasRank2).toBe(false);
      expect(hasRank6).toBe(true);
      expect(hasAce).toBe(true);
    });

    it('supports custom Georgian heritage suits (vazi, khanjali, borjgali) in custom deck compositions', () => {
      const config = DeckConfigSchema.parse({
        deckType: 'custom',
        suits: ['vazi', 'khanjali', 'borjgali'],
        ranks: ['A', 'K', 'Q', 'J'],
        includeJoker: true,
        jokerCount: 1,
      });

      const cards = buildDeckCardCompositions(config);
      expect(cards).toHaveLength(3 * 4 + 1); // 13 cards
      expect(cards.some((c) => c.suit === 'vazi' && c.rank === 'A')).toBe(true);
    });
  });

  // ==========================================================================
  // 2. Gemini API Response Parsing & Prompt Sanitization (Mocked Responses)
  // ==========================================================================
  describe('Gemini Service & Response Parsing', () => {
    it('parses Nano Banana 2.1 Interactions API output_image response format', () => {
      const mockedInteractionResponse = {
        id: 'inter_123',
        model: 'gemini-nano-banana-2.1',
        output_image: {
          mime_type: 'image/png',
          data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        },
      };

      const parsed = parseGeminiImageResponse(mockedInteractionResponse);
      expect(parsed).not.toBeNull();
      expect(parsed?.mimeType).toBe('image/png');
      expect(parsed?.base64Data).toContain('iVBORw0KGgo');
    });

    it('parses multi-step Interactions API steps array response format', () => {
      const mockedStepsResponse = {
        steps: [
          {
            type: 'model_output',
            content: [
              { type: 'text', text: 'Georgian King illustration ready' },
              {
                type: 'image',
                mime_type: 'image/jpeg',
                data: 'BASE64_JPEG_PAYLOAD',
              },
            ],
          },
        ],
      };

      const parsed = parseGeminiImageResponse(mockedStepsResponse);
      expect(parsed).toEqual({
        base64Data: 'BASE64_JPEG_PAYLOAD',
        mimeType: 'image/jpeg',
      });
    });

    it('parses models.generateContent candidates inlineData response format', () => {
      const mockedGenerateContentResponse = {
        candidates: [
          {
            content: {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/png',
                    data: 'CANDIDATE_INLINE_BASE64',
                  },
                },
              ],
            },
          },
        ],
      };

      const parsed = parseGeminiImageResponse(mockedGenerateContentResponse);
      expect(parsed).toEqual({
        base64Data: 'CANDIDATE_INLINE_BASE64',
        mimeType: 'image/png',
      });
    });

    it('constructs a shared style specification and culturally grounded prompt without unsafe characters', () => {
      const dirtyPrompt = ' Georgian King <script>alert(1)</script> {inject} ';
      const clean = sanitizeUserPrompt(dirtyPrompt);
      expect(clean).not.toContain('<');
      expect(clean).not.toContain('{');

      const deckConfig = DeckConfigSchema.parse({
        deckType: '52',
        ranks: ['A', 'K'],
      });
      const sharedSpec = createSharedStyleSpecification(deckConfig);
      const prompt = buildCardIllustrationPrompt({
        cardId: 'test-card-1',
        rank: 'K',
        suit: 'guli',
        illustrationStyle: 'royal-enamel',
        paletteId: 'saperavi-gold',
        ornamentMotif: 'vine',
        complexityLevel: 'royal-intricate',
        sharedStyleSpec: sharedSpec,
      });

      expect(prompt).toContain('Georgian cultural heritage');
      expect(prompt).toContain('#722F37');
      expect(prompt).toContain('NO unnecessary text');
    });

    it('calculates cost estimates accurately across models and resolutions', () => {
      const est1K = calculateEstimatedGenerationCost(52, 'gemini-nano-banana-2.1', '1K');
      const est4K = calculateEstimatedGenerationCost(52, 'gemini-nano-banana-2.1', '4K');
      expect(est1K.totalUsd).toBeGreaterThan(0);
      expect(est4K.totalUsd).toBeGreaterThan(est1K.totalUsd);
    });
  });

  // ==========================================================================
  // 3. Deterministic SVG Card Renderer & Brand Logo Component Tests
  // ==========================================================================
  describe('SVG CardRenderer & Georgian Visual Components', () => {
    it('renders CardRenderer with deterministic rank, Georgian subscript, and print guides', () => {
      const { container } = render(
        <CardRenderer
          id="unit-test-card"
          rank="K"
          suit="guli"
          titleKa="გულის მეფე"
          showPrintGuides={true}
        />
      );

      const svgEl = container.querySelector('svg');
      expect(svgEl).not.toBeNull();
      expect(container.textContent).toContain('K');
      expect(container.textContent).toContain('მფ');
      expect(container.textContent).toContain('გულის მეფე');
    });

    it('renders symmetrical Georgian card-back artwork when isCardBack is true', () => {
      const { container } = render(
        <CardRenderer id="back-test" rank="A" suit="vazi" isCardBack={true} />
      );
      const svgEl = container.querySelector('svg');
      expect(svgEl).not.toBeNull();
      expect(container.textContent).toContain('ქ');
    });

    it('renders KartuliDeckLogo wordmark on both dark and light themes', () => {
      render(<KartuliDeckLogo theme="dark" size="lg" />);
      expect(screen.getByText('KARTULI DECK')).toBeInTheDocument();
      expect(screen.getByText('ქართული ბანქოს სტუდია')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // 4. Backend API Integration, Persistence, Queue & PDF Export Tests
  // ==========================================================================
  describe('Backend REST API, Project Persistence, Queue & PDF Export', () => {
    let app: ReturnType<typeof createApp>;

    beforeAll(async () => {
      await initDatabase();
      app = createApp();
    });

    it('GET /api/status returns active Gemini configuration and supported models', async () => {
      const res = await request(app).get('/api/status');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(Array.isArray(res.body.supportedModels)).toBe(true);
    });

    it('GET /api/projects returns seeded Georgian demo projects', async () => {
      const res = await request(app).get('/api/projects');
      expect(res.status).toBe(200);
      expect(res.body.projects.length).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/projects, PATCH /api/projects/:id, duplicate, and DELETE work end-to-end', async () => {
      const createRes = await request(app)
        .post('/api/projects')
        .send({
          name: 'ტესტური ქართული პროექტი',
          description: 'ავტომატური ტესტის პროექტი',
        });
      expect(createRes.status).toBe(201);
      const createdId = createRes.body.project.id;

      const patchRes = await request(app)
        .patch(`/api/projects/${createdId}`)
        .send({ name: 'განახლებული ქართული პროექტი' });
      expect(patchRes.status).toBe(200);
      expect(patchRes.body.project.name).toBe('განახლებული ქართული პროექტი');

      const dupRes = await request(app).post(`/api/projects/${createdId}/duplicate`);
      expect(dupRes.status).toBe(201);
      expect(dupRes.body.project.name).toContain('(ასლი)');

      const delRes = await request(app).delete(`/api/projects/${dupRes.body.project.id}`);
      expect(delRes.status).toBe(200);
      expect(delRes.body.deleted).toBe(true);
    });

    it('POST /api/cards/generate creates a single card, and POST /api/cards/:id/regenerate records version history', async () => {
      const genRes = await request(app)
        .post('/api/cards/generate')
        .send({
          rank: 'A',
          suit: 'vazi',
          illustrationStyle: 'royal-enamel',
          paletteId: 'saperavi-gold',
          ornamentMotif: 'vine',
          subjectDescription: 'ქართული ქვევრი და ვაზის სიმფონია',
          complexityLevel: 'royal-intricate',
        });

      expect(genRes.status).toBe(201);
      const card = genRes.body.card;
      expect(card.rank).toBe('A');
      expect(card.suit).toBe('vazi');
      expect(card.illustrationUrl).toBeTruthy();

      // Regenerate card and verify version history grows
      const regenRes = await request(app)
        .post(`/api/cards/${card.id}/regenerate`)
        .send({
          subjectDescription: 'განახლებული ოქროს ქვევრი',
          noteKa: 'მეორე სატესტო ვერსია',
        });

      expect(regenRes.status).toBe(200);
      expect(regenRes.body.card.versionHistory.length).toBeGreaterThanOrEqual(2);
    });

    it('POST /api/decks/generate enforces cost confirmation and manages background queue lifecycle (pause/retry/cancel)', async () => {
      // 1. Without confirmedCostEstimate -> 400
      const unconfirmedRes = await request(app)
        .post('/api/decks/generate')
        .send({
          projectName: 'დაუდასტურებელი დასტა',
          confirmedCostEstimate: false,
          deckConfig: {
            deckType: 'custom',
            suits: ['guli'],
            ranks: ['A', 'K'],
            includeJoker: false,
            jokerCount: 0,
            includeCardBack: true,
            illustrationStyle: 'royal-enamel',
            paletteId: 'saperavi-gold',
            ornamentMotif: 'vine',
            complexityLevel: 'balanced',
            cardWidthMm: 63,
            cardHeightMm: 88,
            imageQuality: '1K',
            modelId: 'gemini-nano-banana-2.1',
          },
        });
      expect(unconfirmedRes.status).toBe(400);

      // 2. Confirmed deck generation -> 202 with job ID
      const confirmedRes = await request(app)
        .post('/api/decks/generate')
        .send({
          projectName: 'სატესტო მცირე დასტა',
          confirmedCostEstimate: true,
          deckConfig: {
            deckType: 'custom',
            suits: ['guli'],
            ranks: ['A', 'K'],
            includeJoker: false,
            jokerCount: 0,
            includeCardBack: true,
            illustrationStyle: 'royal-enamel',
            paletteId: 'saperavi-gold',
            ornamentMotif: 'vine',
            complexityLevel: 'balanced',
            cardWidthMm: 63,
            cardHeightMm: 88,
            imageQuality: '1K',
            modelId: 'gemini-nano-banana-2.1',
          },
        });

      expect(confirmedRes.status).toBe(202);
      const jobId = confirmedRes.body.job.id;
      expect(confirmedRes.body.cards).toHaveLength(2);

      // 3. Query job status
      const statusRes = await request(app).get(`/api/generation-jobs/${jobId}`);
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.job.totalCards).toBe(2);

      // 4. Pause job and retry job
      const pauseRes = await request(app)
        .post(`/api/generation-jobs/${jobId}/cancel`)
        .send({ mode: 'pause' });
      expect(pauseRes.status).toBe(200);

      const retryRes = await request(app).post(`/api/generation-jobs/${jobId}/retry`);
      expect(retryRes.status).toBe(200);
    });

    it('GET /api/projects/:projectId/export?format=pdf generates a valid PDF binary with crop marks & bleed', async () => {
      const res = await request(app)
        .get('/api/projects/demo-proj-royal-bagrationi/export')
        .query({
          format: 'pdf',
          layout: 'print-sheet',
          pageSize: 'A4',
          cardWidthMm: 63,
          cardHeightMm: 88,
          bleedMm: 3,
          safeMarginMm: 5,
          cropMarks: 'true',
          cardBack: 'true',
        })
        .buffer(true)
        .parse((res, callback) => {
          const data: Buffer[] = [];
          res.on('data', (chunk) => data.push(chunk));
          res.on('end', () => callback(null, Buffer.concat(data)));
        });

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toContain('application/pdf');
      const pdfHeader = (res.body as Buffer).subarray(0, 5).toString('ascii');
      expect(pdfHeader).toBe('%PDF-');
    });

    it('POST /api/cards/generate supports uploaded photo-to-card design generation and validates MIME types', async () => {
      // 1. Valid PNG photo upload in ai-stylize mode
      const samplePngBase64 =
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

      const photoGenRes = await request(app)
        .post('/api/cards/generate')
        .send({
          rank: 'K',
          suit: 'guli',
          illustrationStyle: 'royal-enamel',
          paletteId: 'saperavi-gold',
          ornamentMotif: 'vine',
          subjectDescription: 'ატვირთული პორტრეტი სამეფო გვირგვინით',
          uploadedImage: {
            base64Data: samplePngBase64,
            mimeType: 'image/png',
            fileName: 'portrait.png',
            photoTransformMode: 'ai-stylize',
          },
        });

      expect(photoGenRes.status).toBe(201);
      expect(photoGenRes.body.card.illustrationUrl).toContain('data:image/svg+xml');
      expect(photoGenRes.body.card.promptUsed).toContain('Transform the provided reference photo');

      // 2. Invalid MIME type rejected by Zod validation
      const invalidMimeRes = await request(app)
        .post('/api/cards/generate')
        .send({
          rank: 'K',
          suit: 'guli',
          uploadedImage: {
            base64Data: samplePngBase64,
            mimeType: 'application/x-msdownload',
          },
        });

      expect(invalidMimeRes.status).toBe(400);
    });
  });
});
