import { GoogleGenAI } from '@google/genai';
import { config, isGeminiConfigured } from '../config/env.js';
import {
  CardRank,
  COLOR_PALETTES,
  ILLUSTRATION_STYLES,
  ORNAMENT_MOTIFS,
  RANK_METADATA,
  SharedStyleSpec,
  SUIT_METADATA,
  SuitType,
  SUPPORTED_GEMINI_MODELS,
} from '../../shared/types.js';
import { buildGeorgianSvgIllustrationDataUri } from '../../shared/demoData.js';
import { storeCardIllustration } from './storageService.js';

export interface CardGenerationInput {
  cardId: string;
  rank: CardRank;
  suit: SuitType;
  illustrationStyle: string;
  paletteId: string;
  ornamentMotif: 'vine' | 'geometric' | 'arch' | 'manuscript';
  subjectDescription?: string;
  backgroundStyle?: string;
  complexityLevel: 'minimal' | 'balanced' | 'royal-intricate';
  customPrompt?: string;
  imageQuality?: '1K' | '2K' | '4K';
  modelId?: string;
  sharedStyleSpec?: SharedStyleSpec;
}

export interface NormalizedGenerationResult {
  illustrationUrl: string;
  modelId: string;
  status: 'completed' | 'failed';
  isDemoFallback: boolean;
  promptUsed: string;
  metadata: {
    durationMs: number;
    aspectRatio: string;
    imageSize: string;
    storageDriver: string;
    warningKa?: string;
  };
}

/**
 * Sanitizes user-supplied prompt fragments to prevent injection or broken control chars.
 */
export function sanitizeUserPrompt(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/[<>`{}]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 750);
}

/**
 * Constructs a rich, culturally grounded Georgian luxury playing card prompt
 * combining the shared deck style specification and card-specific attributes.
 */
export function buildCardIllustrationPrompt(input: CardGenerationInput): string {
  const rankMeta = RANK_METADATA[input.rank] || RANK_METADATA.A;
  const suitMeta = SUIT_METADATA[input.suit] || SUIT_METADATA.guli;
  const styleMeta =
    ILLUSTRATION_STYLES.find((s) => s.id === input.illustrationStyle) ||
    ILLUSTRATION_STYLES[0];
  const paletteMeta =
    COLOR_PALETTES.find((p) => p.id === input.paletteId) || COLOR_PALETTES[0];
  const motifMeta =
    ORNAMENT_MOTIFS.find((m) => m.id === input.ornamentMotif) ||
    ORNAMENT_MOTIFS[0];

  const subjectText = sanitizeUserPrompt(input.subjectDescription) || rankMeta.defaultSubjectEn;
  const customExtra = sanitizeUserPrompt(input.customPrompt);

  const sharedBlock = input.sharedStyleSpec
    ? [
        `Art Direction: ${input.sharedStyleSpec.artDirection}.`,
        `Illustration Technique: ${input.sharedStyleSpec.illustrationTechnique}.`,
        `Ornamental Language: ${input.sharedStyleSpec.ornamentStyle}.`,
        `Line & Lighting: ${input.sharedStyleSpec.lineWeight}; ${input.sharedStyleSpec.lighting}.`,
        `Character & Composition Rules: ${input.sharedStyleSpec.characterDesignRules}`,
      ].join(' ')
    : `Technique: ${styleMeta.promptDirective}. Ornamental motif: ${motifMeta.promptEn}.`;

  return [
    'Create an original luxury playing card illustration inspired by Georgian cultural heritage.',
    'Incorporate carefully researched Georgian ornamental motifs, traditional decorative craftsmanship, elegant geometric framing, and a sophisticated palette of wine red, antique gold, and warm ivory.',
    `Color Palette Tokens: Primary ${paletteMeta.primary}, Deep Burgundy ${paletteMeta.secondary}, Antique Gold ${paletteMeta.accent}, Warm Ivory ${paletteMeta.surface}.`,
    `Card Identity: ${rankMeta.labelKa} of ${suitMeta.nameKa} (${suitMeta.heritageMeaningKa}).`,
    `Central Subject: ${subjectText}.`,
    sharedBlock,
    `Complexity Level: ${input.complexityLevel}.`,
    customExtra ? `Additional Artistic Direction: ${customExtra}.` : '',
    'The artwork must follow the established visual identity of the current deck.',
    'Use a centered composition suitable for a vertical playing card (3:4 / 2:3 ratio).',
    'Keep the central illustration visually clear, with balanced negative space and NO unnecessary text, NO letters, NO numbers, NO watermarks, NO logos, or mockup elements (ranks and suit indices are rendered separately by our deterministic SVG layer).',
    'Do not imitate a specific copyrighted playing card design.',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Parses a Gemini API response from either `ai.interactions.create(...)` or
 * `ai.models.generateContent(...)` to extract base64 image data and MIME type.
 * Exported for unit testing against diverse model response shapes.
 */
export function parseGeminiImageResponse(response: any): {
  base64Data: string;
  mimeType: string;
} | null {
  if (!response) return null;

  // 1. Check `interaction.output_image` (Google GenAI Interactions API convenience property)
  if (response.output_image && typeof response.output_image.data === 'string') {
    return {
      base64Data: response.output_image.data,
      mimeType: response.output_image.mime_type || 'image/png',
    };
  }

  // 2. Check `interaction.steps` (Interleaved or multi-step Interactions API output)
  if (Array.isArray(response.steps)) {
    for (const step of response.steps) {
      if (Array.isArray(step?.content)) {
        for (const block of step.content) {
          if (block?.type === 'image' && typeof block.data === 'string') {
            return {
              base64Data: block.data,
              mimeType: block.mime_type || 'image/png',
            };
          }
        }
      }
    }
  }

  // 3. Check `candidates[0].content.parts` (`models.generateContent` response format)
  if (Array.isArray(response.candidates)) {
    for (const candidate of response.candidates) {
      const parts = candidate?.content?.parts;
      if (Array.isArray(parts)) {
        for (const part of parts) {
          if (part?.inlineData && typeof part.inlineData.data === 'string') {
            return {
              base64Data: part.inlineData.data,
              mimeType: part.inlineData.mimeType || 'image/png',
            };
          }
        }
      }
    }
  }

  return null;
}

/**
 * Executes a function with timeout and exponential backoff retry policy.
 */
async function withTimeoutAndRetry<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  maxRetries: number
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.race<T>([
        fn(),
        new Promise<T>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Gemini API request timed out after ${timeoutMs}ms`)),
            timeoutMs
          )
        ),
      ]);
      return result;
    } catch (err: any) {
      lastError = err;
      const status = err?.status || err?.statusCode;
      // Do not retry 400 Bad Request or 401/403 Auth errors
      if (status === 400 || status === 401 || status === 403) {
        throw err;
      }
      if (attempt < maxRetries) {
        const delayMs = 800 * Math.pow(2, attempt);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastError;
}

/**
 * Generates a playing card illustration using the official Google Gemini API.
 * If `GEMINI_API_KEY` is not configured in the environment, falls back cleanly to
 * the clearly labeled local demo heritage SVG generator without faking an API charge.
 */
export async function generateCardIllustrationWithGemini(
  input: CardGenerationInput
): Promise<NormalizedGenerationResult> {
  const startTime = Date.now();
  const validModels = SUPPORTED_GEMINI_MODELS.map((m) => m.id as string);
  const selectedModel =
    input.modelId && validModels.includes(input.modelId)
      ? input.modelId
      : config.GEMINI_IMAGE_MODEL;

  const promptUsed = buildCardIllustrationPrompt(input);
  const imageSize = input.imageQuality || '1K';
  const aspectRatio = '3:4';

  const paletteMeta =
    COLOR_PALETTES.find((p) => p.id === input.paletteId) || COLOR_PALETTES[0];

  // If Gemini API key is not configured, return clearly marked Demo mode artwork
  if (!isGeminiConfigured()) {
    const themeVariant =
      input.rank === 'K'
        ? 'king-david'
        : input.rank === 'Q'
        ? 'queen-tamar'
        : input.rank === 'J'
        ? 'knight-tariel'
        : input.rank === 'A'
        ? 'ace-qvevri'
        : input.rank === 'JOKER'
        ? 'joker-berika'
        : 'ornamental-pip';

    const svgDataUri = buildGeorgianSvgIllustrationDataUri({
      rank: input.rank,
      suit: input.suit,
      primaryColor: paletteMeta.primary,
      secondaryColor: paletteMeta.secondary,
      accentColor: paletteMeta.accent,
      surfaceColor: paletteMeta.surface,
      motif: input.ornamentMotif,
      themeVariant,
    });

    return {
      illustrationUrl: svgDataUri,
      modelId: `${selectedModel} (ლოკალური დემო რეჟიმი)`,
      status: 'completed',
      isDemoFallback: true,
      promptUsed,
      metadata: {
        durationMs: Date.now() - startTime,
        aspectRatio,
        imageSize,
        storageDriver: 'data-uri',
        warningKa:
          'GEMINI_API_KEY არ არის მითითებული .env ფაილში — კარტი შეიქმნა სადემონსტრაციო ქართული ორნამენტული ძრავით.',
      },
    };
  }

  // Real Gemini API call using `@google/genai`
  const ai = new GoogleGenAI({ apiKey: config.GEMINI_API_KEY });

  const parsedImage = await withTimeoutAndRetry(
    async () => {
      const aiAny = ai as any;
      // Primary documented Nano Banana 2.1 Interactions API
      if (aiAny.interactions && typeof aiAny.interactions.create === 'function') {
        const interaction = await aiAny.interactions.create({
          model: selectedModel,
          input: promptUsed,
          response_format: {
            type: 'image',
            aspect_ratio: aspectRatio,
            image_size: imageSize,
          },
        });
        const extracted = parseGeminiImageResponse(interaction);
        if (extracted) return extracted;
      }

      // Fallback to `ai.models.generateContent` for Gemini native image output
      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: promptUsed,
        config: {
          responseModalities: ['IMAGE', 'TEXT'],
        } as any,
      });

      const extracted = parseGeminiImageResponse(response);
      if (!extracted) {
        throw new Error(
          `Gemini მოდელმა (${selectedModel}) სურათის მონაცემები არ დააბრუნა.`
        );
      }
      return extracted;
    },
    config.GEMINI_TIMEOUT_MS,
    config.GEMINI_MAX_RETRIES
  );

  // Store generated binary image in S3 or local file storage
  const stored = await storeCardIllustration({
    base64Data: parsedImage.base64Data,
    mimeType: parsedImage.mimeType,
    cardId: input.cardId,
  });

  return {
    illustrationUrl: stored.url,
    modelId: selectedModel,
    status: 'completed',
    isDemoFallback: false,
    promptUsed,
    metadata: {
      durationMs: Date.now() - startTime,
      aspectRatio,
      imageSize,
      storageDriver: stored.driver,
    },
  };
}
