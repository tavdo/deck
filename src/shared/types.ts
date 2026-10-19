import { z } from 'zod';

// ============================================================================
// KARTULI DECK AI — Shared Data Models, Schemas & Georgian Domain Constants
// ============================================================================

export const SUIT_TYPES = [
  'guli',      // გული (Hearts)
  'aguri',     // აგური (Diamonds)
  'jvari',     // ჯვარი (Clubs)
  'piki',      // პიკი (Spades)
  'vazi',      // ვაზი (Georgian Grapevine - Custom Symbol)
  'khanjali',  // ხანჯალი (Georgian Dagger - Custom Symbol)
  'borjgali',  // ბორჯღალი (Georgian Sun Symbol - Custom Symbol)
] as const;

export type SuitType = (typeof SUIT_TYPES)[number];

export const STANDARD_SUITS: SuitType[] = ['guli', 'aguri', 'jvari', 'piki'];

export const SUIT_METADATA: Record<
  SuitType,
  {
    id: SuitType;
    nameKa: string;
    symbol: string;
    isRed: boolean;
    heritageMeaningKa: string;
  }
> = {
  guli: {
    id: 'guli',
    nameKa: 'გული',
    symbol: '♥',
    isRed: true,
    heritageMeaningKa: 'სიყვარული, თავდადება და ქართული სტუმართმოყვარეობა',
  },
  aguri: {
    id: 'aguri',
    nameKa: 'აგური',
    symbol: '♦',
    isRed: true,
    heritageMeaningKa: 'სამეფო საგანძური, მინანქარი და ოქრომჭედლობა',
  },
  jvari: {
    id: 'jvari',
    nameKa: 'ჯვარი',
    symbol: '♣',
    isRed: false,
    heritageMeaningKa: 'ბოლნური ჯვარი, სულიერი სიმტკიცე და ტაძართმშენებლობა',
  },
  piki: {
    id: 'piki',
    nameKa: 'პიკი',
    symbol: '♠',
    isRed: false,
    heritageMeaningKa: 'რაინდული სული, საბრძოლო ფარი და კავკასიონის მწვერვალები',
  },
  vazi: {
    id: 'vazi',
    nameKa: 'ვაზი (ქართული სიმბოლო)',
    symbol: '🍇',
    isRed: true,
    heritageMeaningKa: 'სიცოცხლის ხე, ქართული მევენახეობა და ქვევრის ტრადიცია',
  },
  khanjali: {
    id: 'khanjali',
    nameKa: 'ხანჯალი (ქართული სიმბოლო)',
    symbol: '🗡',
    isRed: false,
    heritageMeaningKa: 'ღირსება, სიმამაცე და ტრადიციული იარაღის ოსტატობა',
  },
  borjgali: {
    id: 'borjgali',
    nameKa: 'ბორჯღალი (ქართული სიმბოლო)',
    symbol: '❂',
    isRed: true,
    heritageMeaningKa: 'მარადიული მოძრაობა, მზე და უძველესი კოლხურ-იბერიული კოსმოლოგია',
  },
};

export const RANKS_52 = [
  'A',
  'K',
  'Q',
  'J',
  '10',
  '9',
  '8',
  '7',
  '6',
  '5',
  '4',
  '3',
  '2',
] as const;

export const RANKS_36 = [
  'A',
  'K',
  'Q',
  'J',
  '10',
  '9',
  '8',
  '7',
  '6',
] as const;

export type CardRank =
  | (typeof RANKS_52)[number]
  | 'JOKER';

export const RANK_METADATA: Record<
  CardRank,
  {
    rank: CardRank;
    labelKa: string;
    shortKa: string;
    cardType: 'court' | 'ace' | 'pip' | 'joker';
    defaultSubjectKa: string;
    defaultSubjectEn: string;
  }
> = {
  A: {
    rank: 'A',
    labelKa: 'ტუზი (Ace)',
    shortKa: 'ტ',
    cardType: 'ace',
    defaultSubjectKa: 'მონუმენტური ქართული ორნამენტული გერბი და სიცოცხლის ხე',
    defaultSubjectEn: 'Monumental Georgian ornamental crest, Tree of Life and sacred wine vessel (Qvevri) centerpiece',
  },
  K: {
    rank: 'K',
    labelKa: 'მეფე (King)',
    shortKa: 'მფ',
    cardType: 'court',
    defaultSubjectKa: 'ქართველი მეფე სამეფო გვირგვინით, კვერთხითა და ოქრომკედით ნაქარგი სამოსით',
    defaultSubjectEn: 'Regal medieval Georgian King in royal Bagrationi crown, golden scepter, and richly embroidered burgundy velvet robe',
  },
  Q: {
    rank: 'Q',
    labelKa: 'დედოფალი (Queen)',
    shortKa: 'დდ',
    cardType: 'court',
    defaultSubjectKa: 'ქართველი დედოფალი ტრადიციული თავსაბურავით, მარგალიტებითა და მინანქრის სამკაულით',
    defaultSubjectEn: 'Noble Georgian Queen inspired by Queen Tamar heritage, wearing ornate golden crown, pearl veil, and cloisonné enamel jewelry',
  },
  J: {
    rank: 'J',
    labelKa: 'ვალეტი / რაინდი (Jack)',
    shortKa: 'ვლ',
    cardType: 'court',
    defaultSubjectKa: 'ქართველი რაინდი ჩოხით, ქამარ-ხანჯლითა და ვეფხისტყაოსნის ეპოქის აღჭურვილობით',
    defaultSubjectEn: 'Chivalrous Georgian Knight (Tariel/Avtandil archetype) wearing traditional Chokha with silver Gaziri cartridges and ornate filigree dagger',
  },
  '10': {
    rank: '10',
    labelKa: 'ათიანი (10)',
    shortKa: '10',
    cardType: 'pip',
    defaultSubjectKa: 'ციხე-კოშკების ანსამბლი და ქართული კعمارული თაღები',
    defaultSubjectEn: 'Symmetrical Svaneti stone watchtowers and cathedral arches framed by grapevine arabesques',
  },
  '9': {
    rank: '9',
    labelKa: 'ცხრიანი (9)',
    shortKa: '9',
    cardType: 'pip',
    defaultSubjectKa: 'საზეიმო ქართული სუფრის თასი და ყურძნის მტევნები',
    defaultSubjectEn: 'Ceremonial Georgian silver Kantsi drinking horn and golden grape clusters in symmetrical medallion',
  },
  '8': {
    rank: '8',
    labelKa: 'რვიანი (8)',
    shortKa: '8',
    cardType: 'pip',
    defaultSubjectKa: 'რვაქიმიანი ქართული ვარსკვლავი და ქვაზე კვეთილი როზეტი',
    defaultSubjectEn: 'Eight-pointed Georgian architectural stone rosette with interlaced ribbon carving',
  },
  '7': {
    rank: '7',
    labelKa: 'შვიდიანი (7)',
    shortKa: '7',
    cardType: 'pip',
    defaultSubjectKa: 'შვიდსხივიანი ბორჯღალი და მზის ორნამენტული კომპოზიცია',
    defaultSubjectEn: 'Seven-rayed Georgian Borjgali sun wheel surrounded by golden filigree scrolls',
  },
  '6': {
    rank: '6',
    labelKa: 'ექვსიანი (6)',
    shortKa: '6',
    cardType: 'pip',
    defaultSubjectKa: 'ქართული ხელნაწერის საზედაო ასო და ვაზის ხვეულები',
    defaultSubjectEn: 'Medieval Georgian illuminated manuscript floral knotwork and golden chalice motif',
  },
  '5': {
    rank: '5',
    labelKa: 'ხუთიანი (5)',
    shortKa: '5',
    cardType: 'pip',
    defaultSubjectKa: 'ხუთჯვრიანი კომპოზიცია და ტრადიციული ხის კვეთის დეტალი',
    defaultSubjectEn: 'Symmetrical carved Georgian walnut wood rosette and shield emblem',
  },
  '4': {
    rank: '4',
    labelKa: 'ოთხიანი (4)',
    shortKa: '4',
    cardType: 'pip',
    defaultSubjectKa: 'ოთხკუთხა დარბაზული გუმბათის გეომეტრიული ორნამენტი',
    defaultSubjectEn: 'Traditional Georgian Darbazi stepped dome geometric mandala',
  },
  '3': {
    rank: '3',
    labelKa: 'სამიანი (3)',
    shortKa: '3',
    cardType: 'pip',
    defaultSubjectKa: 'სამ단იანი ქართული თაღი და ბროწეულის ყვავილები',
    defaultSubjectEn: 'Triple Georgian cathedral arch with pomegranate blossoms and gold leaf',
  },
  '2': {
    rank: '2',
    labelKa: 'ორიანი (2)',
    shortKa: '2',
    cardType: 'pip',
    defaultSubjectKa: 'წყვილი ფასკუნჯი და სიმეტრიული ვაზის კვანძი',
    defaultSubjectEn: 'Heraldic twin mythical Georgian Paskunji (phoenix-griffins) flanking a sacred vine knot',
  },
  JOKER: {
    rank: 'JOKER',
    labelKa: 'ჯოკერი (Joker)',
    shortKa: 'JOKER',
    cardType: 'joker',
    defaultSubjectKa: 'ბერიკაობა — ქართული ხალხური თეატრის მისტიკური ნიღბოსანი პერსონაჟი',
    defaultSubjectEn: 'Mystical Georgian Berikaoba folk masquerade performer with ornate ceremonial mask, golden bells, and festive cloak',
  },
};

export const ILLUSTRATION_STYLES = [
  {
    id: 'royal-enamel',
    nameKa: 'ტიხრული მინანქარი და ოქრომჭედლობა',
    descriptionKa: 'ქართული შუასაუკუნეების ტიხრული მინანქრის, ოქროს ძაფებისა და ძვირფასი თვლების ესთეტიკა.',
    promptDirective:
      'Georgian medieval cloisonné enamel (Minankari) and royal goldsmith filigree style, jewel-toned wine reds, deep lapis, warm ivory and raised polished gold partitions',
  },
  {
    id: 'manuscript-illumination',
    nameKa: 'ქართული ხელნაწერი მინიატურა',
    descriptionKa: 'XI-XII საუკუნის ქართული ოთხთავებისა და საერო მინიატურების ოქროსფერი ფურცლების სტილი.',
    promptDirective:
      '12th-century Georgian illuminated manuscript miniature painting style, fine calligraphic ink lines, antique gold leaf halos and borders, parchment texture',
  },
  {
    id: 'carved-stone-relief',
    nameKa: 'ტაძრის ქვაზე კვეთილი რელიეფი',
    descriptionKa: 'სვეტიცხოვლისა და ფიტარეთის ფასადების წნული ორნამენტებითა და ბარელიეფებით შთაგონებული სტილი.',
    promptDirective:
      'Intricate Georgian architectural carved stone bas-relief and gilt bronze engraving, deep sculptural shadows, woven geometric interlace',
  },
  {
    id: 'pirosmani-modern-luxury',
    nameKa: 'თანამედროვე ქართული მოდერნი და ფრესკა',
    descriptionKa: 'მუქი ნახშირისფერი ფონი, კეთილშობილი ღვინისფერი აქცენტები და მონუმენტური მხატვრული ფორმები.',
    promptDirective:
      'Modern luxury Georgian fine art illustration blending medieval fresco monumentality with dark charcoal velvet backgrounds and dramatic warm gold lighting',
  },
] as const;

export const COLOR_PALETTES = [
  {
    id: 'saperavi-gold',
    nameKa: 'საფერავი და ძველი ოქრო (კლასიკური)',
    primary: '#722F37',
    secondary: '#351A22',
    accent: '#C6A15B',
    surface: '#F4EBDD',
    background: '#151515',
  },
  {
    id: 'royal-mtskheta',
    nameKa: 'მცხეთური პერგამენტი და ბრინჯაო',
    primary: '#5E272D',
    secondary: '#2A1810',
    accent: '#D4AF37',
    surface: '#F7EFE2',
    background: '#181513',
  },
  {
    id: 'colchian-night',
    nameKa: 'კოლხური ღამე და ოქროს საწმისი',
    primary: '#1E293B',
    secondary: '#0F172A',
    accent: '#D9A74A',
    surface: '#F4EBDD',
    background: '#111318',
  },
  {
    id: 'kakhetian-amber',
    nameKa: 'კახური ქარვა და ქვევრის თიხა',
    primary: '#8B3A2B',
    secondary: '#3B1E16',
    accent: '#DF9B42',
    surface: '#F6EDE0',
    background: '#1A1412',
  },
] as const;

export const ORNAMENT_MOTIFS = [
  {
    id: 'vine',
    nameKa: 'ვაზის წნული და ყურძნის მტევანი',
    promptEn: 'interlaced Georgian grapevine tendrils and sacred vineyard motifs',
  },
  {
    id: 'geometric',
    nameKa: 'ბოლნური გეომეტრიული კვანძი',
    promptEn: 'symmetrical Georgian geometric stone-carved interlace and Bolnisi rosette medallions',
  },
  {
    id: 'arch',
    nameKa: 'ქართული ტაძრის თაღოვანი ჩარჩო',
    promptEn: 'ornate Georgian cathedral archways and carved column capitals',
  },
  {
    id: 'manuscript',
    nameKa: 'ხელნაწერთა საზედაო ორნამენტი',
    promptEn: 'medieval Georgian manuscript marginalia flourishes and Asomtavruli/Mkhedruli decorative filigree',
  },
] as const;

export const SUPPORTED_GEMINI_MODELS = [
  {
    id: 'gemini-nano-banana-2.1',
    nameKa: 'Gemini Nano Banana 2.1 (რეკომენდებული)',
    descriptionKa: 'უახლესი მაღალი ეფექტურობის მოდელი 1K/2K/4K მხარდაჭერითა და სტილის სტაბილურობით.',
    estimatedCostPerImageUsd: 0.039,
  },
  {
    id: 'gemini-3-pro-image',
    nameKa: 'Gemini 3 Pro Image (Nano Banana Pro)',
    descriptionKa: 'პრემიუმ მოდელი უმაღლესი დეტალიზაციისა და კულტურული სიზუსტისთვის.',
    estimatedCostPerImageUsd: 0.065,
  },
  {
    id: 'gemini-3.1-flash-image',
    nameKa: 'Gemini 3.1 Flash Image (Nano Banana 2)',
    descriptionKa: 'სწრაფი და დაბალანსებული გენერაციის მოდელი.',
    estimatedCostPerImageUsd: 0.039,
  },
  {
    id: 'gemini-3.1-flash-lite-image',
    nameKa: 'Gemini 3.1 Flash Lite Image (Nano Banana 2 Lite)',
    descriptionKa: 'ულტრა-სწრაფი და ყველაზე ეკონომიური მოდელი დიდი დასტებისთვის.',
    estimatedCostPerImageUsd: 0.022,
  },
] as const;

export type SupportedGeminiModelId = (typeof SUPPORTED_GEMINI_MODELS)[number]['id'];

// ============================================================================
// Card Layout & Editable Specification (Deterministic SVG Renderer Config)
// ============================================================================

export const CardDesignSpecSchema = z.object({
  paletteId: z.string().default('saperavi-gold'),
  primaryColor: z.string().default('#722F37'),
  secondaryColor: z.string().default('#351A22'),
  accentColor: z.string().default('#C6A15B'),
  surfaceColor: z.string().default('#F4EBDD'),
  borderThickness: z.number().min(1).max(8).default(2.5),
  cornerRadius: z.number().min(4).max(28).default(16),
  ornamentMotif: z.enum(['vine', 'geometric', 'arch', 'manuscript']).default('vine'),
  showCornerOrnaments: z.boolean().default(true),
  showInnerFrame: z.boolean().default(true),
  showCenterWatermark: z.boolean().default(true),
  rankPosition: z.enum(['standard', 'inset', 'ornate-medallion']).default('standard'),
  rankFontFamily: z.enum(['serif', 'display', 'sans']).default('serif'),
  rankScale: z.number().min(0.75).max(1.4).default(1.0),
  useGeorgianRankSubscript: z.boolean().default(true),
  illustrationScale: z.number().min(0.7).max(1.3).default(1.0),
  illustrationFrameStyle: z.enum(['arch', 'octagonal', 'full-bleed', 'medallion']).default('arch'),
  cardWidthMm: z.number().min(50).max(90).default(63),
  cardHeightMm: z.number().min(75).max(130).default(88),
});

export type CardDesignSpec = z.infer<typeof CardDesignSpecSchema>;

export const DEFAULT_CARD_DESIGN_SPEC: CardDesignSpec = CardDesignSpecSchema.parse({});

// ============================================================================
// Shared Style Specification for Complete Deck Consistency
// ============================================================================

export const SharedStyleSpecSchema = z.object({
  artDirection: z.string(),
  palette: z.object({
    id: z.string(),
    primary: z.string(),
    secondary: z.string(),
    accent: z.string(),
    surface: z.string(),
    background: z.string(),
  }),
  illustrationTechnique: z.string(),
  ornamentStyle: z.string(),
  lineWeight: z.string(),
  lighting: z.string(),
  texture: z.string(),
  backgroundTreatment: z.string(),
  borderStyle: z.string(),
  characterDesignRules: z.string(),
  referenceImageUrl: z.string().optional(),
});

export type SharedStyleSpec = z.infer<typeof SharedStyleSpecSchema>;

// ============================================================================
// Card Version & Card Entity
// ============================================================================

export interface CardVersion {
  versionId: string;
  createdAt: string;
  illustrationUrl: string;
  promptUsed: string;
  modelId: string;
  isDemo: boolean;
  designSpec: CardDesignSpec;
  noteKa?: string;
}

export interface PlayingCard {
  id: string;
  projectId: string;
  rank: CardRank;
  suit: SuitType;
  cardType: 'court' | 'ace' | 'pip' | 'joker' | 'back';
  titleKa: string;
  subjectDescription: string;
  illustrationStyle: string;
  complexityLevel: 'minimal' | 'balanced' | 'royal-intricate';
  customPrompt?: string;
  illustrationUrl: string;
  designSpec: CardDesignSpec;
  generationStatus: 'pending' | 'generating' | 'completed' | 'failed';
  errorMessage?: string;
  isFavorite: boolean;
  isDemo: boolean;
  modelId: string;
  promptUsed: string;
  versionHistory: CardVersion[];
  exportMetadata: {
    widthMm: number;
    heightMm: number;
    bleedMm: number;
    dpi: number;
    lastExportedAt?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Uploaded Photo & Reference Image Validation
// ============================================================================

export const ALLOWED_UPLOAD_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export type AllowedUploadMimeType = (typeof ALLOWED_UPLOAD_MIME_TYPES)[number];

export const UploadedImageSchema = z.object({
  base64Data: z
    .string()
    .min(16, 'ატვირთული ფოტოს მონაცემები ცარიელია')
    .max(12_000_000, 'ფოტოს ზომა აღემატება დასაშვებ ლიმიტს (მაქს. 8MB)'),
  mimeType: z.enum(ALLOWED_UPLOAD_MIME_TYPES, {
    errorMap: () => ({
      message: 'მხარდაჭერილია მხოლოდ PNG, JPG და WEBP ფორმატის ფოტოები',
    }),
  }),
  fileName: z.string().max(255).optional(),
  photoTransformMode: z
    .enum(['ai-stylize', 'direct-frame'])
    .default('ai-stylize'),
});

export type UploadedImageInput = z.infer<typeof UploadedImageSchema>;

// ============================================================================
// Deck Configuration & Project Entity
// ============================================================================

export const DeckConfigSchema = z.object({
  deckType: z.enum(['36', '52', 'custom']).default('52'),
  suits: z.array(z.enum(SUIT_TYPES)).min(1).default(['guli', 'aguri', 'jvari', 'piki']),
  ranks: z.array(z.string()).min(1),
  includeJoker: z.boolean().default(false),
  jokerCount: z.number().min(0).max(2).default(0),
  includeCardBack: z.boolean().default(true),
  illustrationStyle: z.string().default('royal-enamel'),
  paletteId: z.string().default('saperavi-gold'),
  ornamentMotif: z.enum(['vine', 'geometric', 'arch', 'manuscript']).default('vine'),
  complexityLevel: z.enum(['minimal', 'balanced', 'royal-intricate']).default('royal-intricate'),
  cardWidthMm: z.number().default(63),
  cardHeightMm: z.number().default(88),
  imageQuality: z.enum(['1K', '2K', '4K']).default('1K'),
  modelId: z.string().default('gemini-nano-banana-2.1'),
  customDeckThemePrompt: z.string().optional(),
  uploadedReferenceImage: UploadedImageSchema.optional(),
});

export type DeckConfig = z.infer<typeof DeckConfigSchema>;

export interface GenerationJob {
  id: string;
  projectId: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  totalCards: number;
  completedCards: number;
  failedCards: number;
  generatingCards: number;
  currentCardLabel?: string;
  estimatedRemainingSeconds?: number;
  estimatedCostUsd: number;
  modelId: string;
  sharedStyleSpec: SharedStyleSpec;
  errorSummary?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  description: string;
  deckConfig: DeckConfig;
  sharedStyleSpec: SharedStyleSpec;
  status: 'draft' | 'generating' | 'completed' | 'incomplete';
  isDemo: boolean;
  cardCount: number;
  completedCardCount: number;
  coverCardUrl?: string;
  activeJobId?: string;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Validation Requests for API Endpoints
// ============================================================================

export const SingleCardGenerateRequestSchema = z.object({
  projectId: z.string().optional(),
  rank: z.enum(['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2', 'JOKER']),
  suit: z.enum(SUIT_TYPES),
  illustrationStyle: z.string().default('royal-enamel'),
  paletteId: z.string().default('saperavi-gold'),
  ornamentMotif: z.enum(['vine', 'geometric', 'arch', 'manuscript']).default('vine'),
  subjectDescription: z.string().max(500).optional(),
  backgroundStyle: z.string().default('dark-velvet-arch'),
  complexityLevel: z.enum(['minimal', 'balanced', 'royal-intricate']).default('royal-intricate'),
  customPrompt: z.string().max(800).optional(),
  imageQuality: z.enum(['1K', '2K', '4K']).default('1K'),
  modelId: z.string().default('gemini-nano-banana-2.1'),
  designSpec: CardDesignSpecSchema.optional(),
  uploadedImage: UploadedImageSchema.optional(),
});

export type SingleCardGenerateRequest = z.infer<typeof SingleCardGenerateRequestSchema>;

export const FullDeckGenerateRequestSchema = z.object({
  projectName: z.string().min(1).max(120),
  projectDescription: z.string().max(400).optional(),
  deckConfig: DeckConfigSchema,
  confirmedCostEstimate: z.boolean(),
});

export type FullDeckGenerateRequest = z.infer<typeof FullDeckGenerateRequestSchema>;

/**
 * Helper to build the exact list of (suit, rank) combinations for a deck configuration.
 * Ensures a 52-card deck has 4 suits x 13 ranks = 52 unique cards (+ optional Jokers),
 * and a 36-card deck has 4 suits x 9 ranks (6..A) = 36 unique cards.
 */
export function buildDeckCardCompositions(config: DeckConfig): Array<{
  suit: SuitType;
  rank: CardRank;
  cardType: 'court' | 'ace' | 'pip' | 'joker';
  titleKa: string;
  defaultSubjectKa: string;
  defaultSubjectEn: string;
}> {
  const targetSuits: SuitType[] =
    config.suits && config.suits.length > 0 ? config.suits : STANDARD_SUITS;

  let targetRanks: CardRank[];
  if (config.deckType === '52') {
    targetRanks = [...RANKS_52];
  } else if (config.deckType === '36') {
    targetRanks = [...RANKS_36];
  } else {
    targetRanks = (config.ranks.filter((r) => r in RANK_METADATA) as CardRank[]);
    if (targetRanks.length === 0) {
      targetRanks = ['A', 'K', 'Q', 'J', '10'];
    }
  }

  const combinations: Array<{
    suit: SuitType;
    rank: CardRank;
    cardType: 'court' | 'ace' | 'pip' | 'joker';
    titleKa: string;
    defaultSubjectKa: string;
    defaultSubjectEn: string;
  }> = [];

  for (const suit of targetSuits) {
    const suitInfo = SUIT_METADATA[suit];
    for (const rank of targetRanks) {
      if (rank === 'JOKER') continue;
      const rankInfo = RANK_METADATA[rank];
      combinations.push({
        suit,
        rank,
        cardType: rankInfo.cardType,
        titleKa: `${suitInfo.nameKa} — ${rankInfo.labelKa}`,
        defaultSubjectKa: rankInfo.defaultSubjectKa,
        defaultSubjectEn: `${rankInfo.defaultSubjectEn} (Suit theme: ${suitInfo.nameKa})`,
      });
    }
  }

  if (config.includeJoker && config.jokerCount > 0) {
    const jokerInfo = RANK_METADATA.JOKER;
    for (let i = 0; i < config.jokerCount; i++) {
      const suit: SuitType = i % 2 === 0 ? 'guli' : 'piki';
      combinations.push({
        suit,
        rank: 'JOKER',
        cardType: 'joker',
        titleKa: `ჯოკერი #${i + 1} (ბერიკაობა)`,
        defaultSubjectKa: jokerInfo.defaultSubjectKa,
        defaultSubjectEn: jokerInfo.defaultSubjectEn,
      });
    }
  }

  return combinations;
}

/**
 * Generates a shared deck-level style specification for consistent AI generation across all cards.
 */
export function createSharedStyleSpecification(config: DeckConfig): SharedStyleSpec {
  const palette =
    COLOR_PALETTES.find((p) => p.id === config.paletteId) || COLOR_PALETTES[0];
  const styleObj =
    ILLUSTRATION_STYLES.find((s) => s.id === config.illustrationStyle) ||
    ILLUSTRATION_STYLES[0];
  const motifObj =
    ORNAMENT_MOTIFS.find((m) => m.id === config.ornamentMotif) ||
    ORNAMENT_MOTIFS[0];

  return {
    artDirection: `Luxury Georgian Cultural Playing Card Studio — ${styleObj.nameKa}`,
    palette: {
      id: palette.id,
      primary: palette.primary,
      secondary: palette.secondary,
      accent: palette.accent,
      surface: palette.surface,
      background: palette.background,
    },
    illustrationTechnique: styleObj.promptDirective,
    ornamentStyle: motifObj.promptEn,
    lineWeight:
      config.complexityLevel === 'minimal'
        ? 'Clean crisp geometric gold linework with open breathing room'
        : config.complexityLevel === 'balanced'
        ? 'Medium-weight calligraphically modulated lines with filigree highlights'
        : 'Rich museum-grade ornamental engraving and intricate cloisonné partitions',
    lighting: 'Warm candlelit museum lustre with subtle metallic gold specular reflections',
    texture: 'Fine woven silk and vellum paper grain with embossed antique gold leaf accents',
    backgroundTreatment:
      'Deep burgundy-charcoal recessed sanctuary arch with subtle symmetrical Georgian arabesque tracery',
    borderStyle:
      'Symmetrical Georgian architectural frame with corner stone-carved rosettes (rendered deterministically by SVG layer)',
    characterDesignRules:
      'Authentic historical Georgian attire (Chokha, Sartyeli, royal Bagrationi crowns, medieval velvet robes), noble serene expressions, symmetrical playing-card composition, strictly NO text, NO numbers, and NO watermarks inside the illustration.',
  };
}

/**
 * Calculates estimated cost for generating N cards based on the selected Gemini model and resolution.
 */
export function calculateEstimatedGenerationCost(
  cardCount: number,
  modelId: string,
  imageQuality: '1K' | '2K' | '4K' = '1K'
): {
  perCardUsd: number;
  totalUsd: number;
  modelNameKa: string;
  resolutionMultiplier: number;
} {
  const modelMeta =
    SUPPORTED_GEMINI_MODELS.find((m) => m.id === modelId) ||
    SUPPORTED_GEMINI_MODELS[0];
  const resolutionMultiplier =
    imageQuality === '4K' ? 1.8 : imageQuality === '2K' ? 1.35 : 1.0;
  const perCardUsd = Number(
    (modelMeta.estimatedCostPerImageUsd * resolutionMultiplier).toFixed(4)
  );
  const totalUsd = Number((perCardUsd * cardCount).toFixed(2));

  return {
    perCardUsd,
    totalUsd,
    modelNameKa: modelMeta.nameKa,
    resolutionMultiplier,
  };
}
