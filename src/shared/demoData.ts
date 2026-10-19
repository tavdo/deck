import { PlayingCard, Project, DEFAULT_CARD_DESIGN_SPEC, createSharedStyleSpecification } from './types.js';

/**
 * Generates an intricate, culturally authentic SVG illustration encoded as a data URI.
 * Used both for realistic sample heritage cards (clearly labeled as Demo) and for
 * deterministic high-craft illustrations.
 */
export function buildGeorgianSvgIllustrationDataUri(params: {
  rank: string;
  suit: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  surfaceColor?: string;
  motif?: string;
  themeVariant?: 'king-david' | 'queen-tamar' | 'knight-tariel' | 'ace-qvevri' | 'joker-berika' | 'ornamental-pip';
  subtitleKa?: string;
}): string {
  const primary = params.primaryColor || '#722F37';
  const secondary = params.secondaryColor || '#351A22';
  const accent = params.accentColor || '#C6A15B';
  const variant = params.themeVariant || 'ornamental-pip';

  let centerArtwork = '';

  if (variant === 'king-david' || params.rank === 'K') {
    centerArtwork = `
      <!-- Royal Halo & Sunburst -->
      <circle cx="150" cy="155" r="68" fill="${secondary}" stroke="${accent}" stroke-width="2.2"/>
      <circle cx="150" cy="155" r="58" fill="none" stroke="${accent}" stroke-width="1" stroke-dasharray="3 3"/>
      <!-- Georgian Royal Crown (Bagrationi Kolkheti Crown) -->
      <path d="M110 118 L120 86 L136 105 L150 78 L164 105 L180 86 L190 118 Z" fill="${accent}" stroke="#151515" stroke-width="1.5"/>
      <circle cx="150" cy="76" r="4" fill="${primary}" stroke="${accent}" stroke-width="1.2"/>
      <path d="M147 68 H153 M150 65 V73" stroke="${accent}" stroke-width="1.6"/>
      <rect x="112" y="116" width="76" height="9" rx="3" fill="${primary}" stroke="${accent}" stroke-width="1.5"/>
      <circle cx="126" cy="120.5" r="2.2" fill="#F4EBDD"/>
      <circle cx="150" cy="120.5" r="2.8" fill="${accent}"/>
      <circle cx="174" cy="120.5" r="2.2" fill="#F4EBDD"/>
      <!-- Noble Beard & Face -->
      <path d="M126 125 C126 162 174 162 174 125 Z" fill="#E8D6C0" stroke="${accent}" stroke-width="1.4"/>
      <path d="M125 145 C128 175 150 185 150 185 C150 185 172 175 175 145 C165 154 135 154 125 145 Z" fill="#2A1F1D" stroke="${accent}" stroke-width="1.2"/>
      <!-- Eyes & Brows -->
      <path d="M134 136 Q140 133 145 136" stroke="#151515" stroke-width="1.8" fill="none"/>
      <path d="M155 136 Q160 133 166 136" stroke="#151515" stroke-width="1.8" fill="none"/>
      <circle cx="140" cy="139" r="2" fill="#151515"/>
      <circle cx="160" cy="139" r="2" fill="#151515"/>
      <!-- Royal Embroidered Mantle & Scepter -->
      <path d="M82 285 C86 212 114 188 150 188 C186 188 214 212 218 285 Z" fill="${primary}" stroke="${accent}" stroke-width="2.2"/>
      <path d="M118 190 L150 265 L182 190" fill="${secondary}" stroke="${accent}" stroke-width="1.8"/>
      <!-- Golden Bichvinta / Bolnisi Pectoral Cross -->
      <circle cx="150" cy="232" r="16" fill="${secondary}" stroke="${accent}" stroke-width="1.8"/>
      <path d="M150 220 L154 228 L162 232 L154 236 L150 244 L146 236 L138 232 L146 228 Z" fill="${accent}"/>
      <!-- Royal Scepter & Scroll -->
      <line x1="202" y1="140" x2="182" y2="275" stroke="${accent}" stroke-width="3.2"/>
      <circle cx="202" cy="136" r="9" fill="${primary}" stroke="${accent}" stroke-width="2"/>
      <!-- Symmetrical Lower Reflection -->
      <path d="M90 285 H210" stroke="${accent}" stroke-width="2.5"/>
      <path d="M105 296 L150 335 L195 296 Z" fill="${secondary}" stroke="${accent}" stroke-width="1.5"/>
    `;
  } else if (variant === 'queen-tamar' || params.rank === 'Q') {
    centerArtwork = `
      <!-- Queen Tamar Ornamental Aureole -->
      <circle cx="150" cy="158" r="68" fill="${secondary}" stroke="${accent}" stroke-width="2.2"/>
      <path d="M95 158 C95 120 205 120 205 158" fill="none" stroke="${accent}" stroke-width="1.4" stroke-dasharray="4 2"/>
      <!-- Veil (Mandili) & Pearl Pendilia -->
      <path d="M102 120 C92 175 94 235 110 275 H190 C206 235 208 175 198 120 Z" fill="#2A141B" stroke="${accent}" stroke-width="1.5"/>
      <!-- Royal Crown with Enamel Arches -->
      <path d="M112 120 L118 90 L135 106 L150 82 L165 106 L182 90 L188 120 Z" fill="${accent}" stroke="#151515" stroke-width="1.4"/>
      <circle cx="150" cy="98" r="5" fill="${primary}" stroke="#F4EBDD" stroke-width="1.2"/>
      <!-- Pearl Hanging Chains (Saltskaro) -->
      <circle cx="116" cy="132" r="3" fill="#F4EBDD"/>
      <circle cx="116" cy="142" r="3" fill="#F4EBDD"/>
      <circle cx="116" cy="152" r="3.5" fill="${accent}"/>
      <circle cx="184" cy="132" r="3" fill="#F4EBDD"/>
      <circle cx="184" cy="142" r="3" fill="#F4EBDD"/>
      <circle cx="184" cy="152" r="3.5" fill="${accent}"/>
      <!-- Queen Face -->
      <path d="M128 122 C128 164 172 164 172 122 Z" fill="#F4E2CE" stroke="${accent}" stroke-width="1.4"/>
      <path d="M134 135 Q141 131 146 135" stroke="#151515" stroke-width="1.5" fill="none"/>
      <path d="M154 135 Q159 131 166 135" stroke="#151515" stroke-width="1.5" fill="none"/>
      <circle cx="140" cy="138" r="1.8" fill="#151515"/>
      <circle cx="160" cy="138" r="1.8" fill="#151515"/>
      <path d="M145 150 Q150 153 155 150" stroke="${primary}" stroke-width="2" fill="none"/>
      <!-- Royal Collar (Maniak) & Dress -->
      <path d="M88 285 C96 210 120 184 150 184 C180 184 204 210 212 285 Z" fill="${primary}" stroke="${accent}" stroke-width="2.2"/>
      <path d="M114 188 C126 212 174 212 186 188" fill="none" stroke="${accent}" stroke-width="5"/>
      <circle cx="150" cy="202" r="5" fill="#F4EBDD" stroke="${accent}" stroke-width="1.5"/>
      <circle cx="132" cy="199" r="3.5" fill="#F4EBDD"/>
      <circle cx="168" cy="199" r="3.5" fill="#F4EBDD"/>
      <!-- Ornamental Rose & Cross Medallion -->
      <path d="M150 220 L168 245 L150 270 L132 245 Z" fill="${secondary}" stroke="${accent}" stroke-width="1.8"/>
      <circle cx="150" cy="245" r="7" fill="${accent}"/>
    `;
  } else if (variant === 'knight-tariel' || params.rank === 'J') {
    centerArtwork = `
      <!-- Knight in Chokha & Tiger Pelt (Vepkhistqaosani Heritage) -->
      <circle cx="150" cy="155" r="66" fill="${secondary}" stroke="${accent}" stroke-width="2"/>
      <!-- Papakhi / Knight Headpiece -->
      <path d="M118 122 C116 92 184 92 182 122 Z" fill="#231B1A" stroke="${accent}" stroke-width="1.6"/>
      <path d="M132 96 L150 116 L168 96" fill="${primary}" stroke="${accent}" stroke-width="1.3"/>
      <!-- Face & Mustache -->
      <path d="M128 122 C128 160 172 160 172 122 Z" fill="#E5CEB3" stroke="${accent}" stroke-width="1.4"/>
      <path d="M136 146 Q150 141 164 146" stroke="#1E1615" stroke-width="2.5" fill="none"/>
      <circle cx="140" cy="136" r="2" fill="#151515"/>
      <circle cx="160" cy="136" r="2" fill="#151515"/>
      <!-- Chokha Coat with Silver Gaziri (Masrebi) -->
      <path d="M84 285 C92 204 118 182 150 182 C182 182 208 204 216 285 Z" fill="#1F191B" stroke="${accent}" stroke-width="2.2"/>
      <path d="M132 182 L150 232 L168 182 Z" fill="${primary}" stroke="${accent}" stroke-width="1.5"/>
      <!-- Left & Right Gaziri Cartridge Rows -->
      <g fill="#F4EBDD" stroke="${accent}" stroke-width="0.9">
        <rect x="102" y="206" width="5" height="18" rx="2"/>
        <rect x="110" y="206" width="5" height="18" rx="2"/>
        <rect x="118" y="206" width="5" height="18" rx="2"/>
        <rect x="177" y="206" width="5" height="18" rx="2"/>
        <rect x="185" y="206" width="5" height="18" rx="2"/>
        <rect x="193" y="206" width="5" height="18" rx="2"/>
      </g>
      <!-- Ornate Belt & Georgian Khanjali Dagger -->
      <rect x="100" y="252" width="100" height="10" rx="2" fill="${secondary}" stroke="${accent}" stroke-width="1.6"/>
      <path d="M143 238 H157 L154 298 L150 312 L146 298 Z" fill="${accent}" stroke="#151515" stroke-width="1.3"/>
      <circle cx="150" cy="257" r="4" fill="${primary}" stroke="#F4EBDD" stroke-width="1"/>
    `;
  } else if (variant === 'ace-qvevri' || params.rank === 'A') {
    centerArtwork = `
      <!-- Monumental Ace Crest: Sacred Qvevri & Tree of Life Vine -->
      <path d="M150 64 L228 210 L150 356 L72 210 Z" fill="${secondary}" stroke="${accent}" stroke-width="2.5"/>
      <path d="M150 82 L212 210 L150 338 L88 210 Z" fill="#191215" stroke="${accent}" stroke-width="1.4"/>
      <!-- Sacred Vine Branches -->
      <path d="M150 250 V120" stroke="${accent}" stroke-width="3"/>
      <path d="M150 175 C115 165 108 135 128 122 C142 114 150 135 136 142" fill="none" stroke="${accent}" stroke-width="2"/>
      <path d="M150 175 C185 165 192 135 172 122 C158 114 150 135 164 142" fill="none" stroke="${accent}" stroke-width="2"/>
      <!-- Grape Clusters -->
      <g fill="${primary}" stroke="${accent}" stroke-width="1.1">
        <circle cx="122" cy="152" r="5"/><circle cx="130" cy="152" r="5"/><circle cx="126" cy="160" r="5"/>
        <circle cx="170" cy="152" r="5"/><circle cx="178" cy="152" r="5"/><circle cx="174" cy="160" r="5"/>
      </g>
      <!-- Royal Qvevri Amphora -->
      <path d="M132 215 H168 L162 226 C184 240 182 276 150 304 C118 276 116 240 138 226 Z" fill="${primary}" stroke="${accent}" stroke-width="2.2"/>
      <!-- Borjgali Sun on Qvevri -->
      <circle cx="150" cy="258" r="14" fill="${secondary}" stroke="${accent}" stroke-width="1.5"/>
      <circle cx="150" cy="258" r="5" fill="${accent}"/>
    `;
  } else if (variant === 'joker-berika' || params.rank === 'JOKER') {
    centerArtwork = `
      <!-- Mystical Georgian Berikaoba Ceremonial Mask -->
      <circle cx="150" cy="195" r="76" fill="${secondary}" stroke="${accent}" stroke-width="2.4"/>
      <!-- Sculpted Golden Horns -->
      <path d="M115 145 C85 105 95 72 126 84 C112 96 114 120 128 138" fill="${accent}" stroke="#151515" stroke-width="1.5"/>
      <path d="M185 145 C215 105 205 72 174 84 C188 96 186 120 172 138" fill="${accent}" stroke="#151515" stroke-width="1.5"/>
      <!-- Ceremonial Mask Face -->
      <path d="M112 140 H188 L178 242 L150 268 L122 242 Z" fill="${primary}" stroke="${accent}" stroke-width="2.2"/>
      <circle cx="134" cy="178" r="8" fill="#151515" stroke="${accent}" stroke-width="1.8"/>
      <circle cx="166" cy="178" r="8" fill="#151515" stroke="${accent}" stroke-width="1.8"/>
      <circle cx="134" cy="178" r="2.5" fill="#F4EBDD"/>
      <circle cx="166" cy="178" r="2.5" fill="#F4EBDD"/>
      <path d="M150 170 L144 205 H156 Z" fill="${accent}"/>
      <path d="M128 222 Q150 238 172 222" fill="none" stroke="${accent}" stroke-width="2.5"/>
      <!-- Festive Golden Bells -->
      <circle cx="110" cy="252" r="7" fill="${accent}"/>
      <circle cx="190" cy="252" r="7" fill="${accent}"/>
      <circle cx="150" cy="282" r="8" fill="${accent}"/>
    `;
  } else {
    // Architectural & Ornamental Pip Card Composition
    centerArtwork = `
      <circle cx="150" cy="210" r="78" fill="${secondary}" stroke="${accent}" stroke-width="2.2"/>
      <circle cx="150" cy="210" r="64" fill="#171214" stroke="${accent}" stroke-width="1.2" stroke-dasharray="4 3"/>
      <!-- Symmetrical 8-Point Georgian Star & Cathedral Rosette -->
      <path d="M150 138 L168 192 L222 210 L168 228 L150 282 L132 228 L78 210 L132 192 Z" fill="${primary}" stroke="${accent}" stroke-width="1.8"/>
      <path d="M102 162 L198 258 M198 162 L102 258" stroke="${accent}" stroke-width="1.6"/>
      <circle cx="150" cy="210" r="28" fill="${secondary}" stroke="${accent}" stroke-width="2"/>
      <circle cx="150" cy="210" r="10" fill="${accent}"/>
    `;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 420" width="600" height="840">
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="45%" r="60%">
        <stop offset="0%" stop-color="${primary}" stop-opacity="0.42"/>
        <stop offset="65%" stop-color="${secondary}" stop-opacity="0.88"/>
        <stop offset="100%" stop-color="#120E10" stop-opacity="1"/>
      </radialGradient>
      <pattern id="geoGrid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M15 0 L30 15 L15 30 L0 15 Z" fill="none" stroke="${accent}" stroke-width="0.5" stroke-opacity="0.16"/>
      </pattern>
    </defs>

    <!-- Base Velvet Sanctuary Field -->
    <rect width="300" height="420" fill="url(#bgGlow)"/>
    <rect width="300" height="420" fill="url(#geoGrid)"/>

    <!-- Georgian Cathedral Arch Inner Frame -->
    <path d="M36 376 V118 C36 62 88 38 150 38 C212 38 264 62 264 118 V376 H36 Z" fill="none" stroke="${accent}" stroke-width="1.8" stroke-opacity="0.65"/>
    <path d="M44 368 V122 C44 72 92 48 150 48 C208 48 256 72 256 122 V368 H44 Z" fill="none" stroke="${primary}" stroke-width="1.2" stroke-dasharray="3 3"/>

    <!-- Top & Bottom Ornamental Finials -->
    <circle cx="150" cy="38" r="6" fill="${accent}"/>
    <path d="M120 356 Q150 338 180 356" fill="none" stroke="${accent}" stroke-width="1.6"/>

    <!-- Main Subject Illustration -->
    ${centerArtwork}
  </svg>`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

const nowIso = new Date().toISOString();

export const INITIAL_DEMO_PROJECTS: Project[] = [
  {
    id: 'demo-proj-royal-bagrationi',
    userId: 'demo-user',
    name: 'ოქროს საწმისი და სამეფო კარი (დემო კოლექცია)',
    description:
      'შუასაუკუნეების ქართული ტიხრული მინანქრით, ბაგრატიონთა სამეფო სიმბოლიკითა და სვეტიცხოვლის ჩუქურთმებით შთაგონებული სადემონსტრაციო დასტა.',
    deckConfig: {
      deckType: '52',
      suits: ['guli', 'aguri', 'jvari', 'piki'],
      ranks: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6', '5', '4', '3', '2'],
      includeJoker: true,
      jokerCount: 1,
      includeCardBack: true,
      illustrationStyle: 'royal-enamel',
      paletteId: 'saperavi-gold',
      ornamentMotif: 'vine',
      complexityLevel: 'royal-intricate',
      cardWidthMm: 63,
      cardHeightMm: 88,
      imageQuality: '1K',
      modelId: 'gemini-nano-banana-2.1',
    },
    sharedStyleSpec: createSharedStyleSpecification({
      deckType: '52',
      suits: ['guli', 'aguri', 'jvari', 'piki'],
      ranks: ['A', 'K', 'Q', 'J', '10'],
      includeJoker: true,
      jokerCount: 1,
      includeCardBack: true,
      illustrationStyle: 'royal-enamel',
      paletteId: 'saperavi-gold',
      ornamentMotif: 'vine',
      complexityLevel: 'royal-intricate',
      cardWidthMm: 63,
      cardHeightMm: 88,
      imageQuality: '1K',
      modelId: 'gemini-nano-banana-2.1',
    }),
    status: 'completed',
    isDemo: true,
    cardCount: 6,
    completedCardCount: 6,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'demo-proj-vepkhistqaosani',
    userId: 'demo-user',
    name: 'ვეფხისტყაოსნის რაინდები (36-კარტიანი დემო)',
    description:
      'შოთა რუსთაველის უკვდავი პოემის პერსონაჟებითა და XVI საუკუნის ქართული ხელნაწერი მინიატურებით შთაგონებული საავტორო ბანქო.',
    deckConfig: {
      deckType: '36',
      suits: ['guli', 'aguri', 'jvari', 'piki'],
      ranks: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6'],
      includeJoker: false,
      jokerCount: 0,
      includeCardBack: true,
      illustrationStyle: 'manuscript-illumination',
      paletteId: 'royal-mtskheta',
      ornamentMotif: 'manuscript',
      complexityLevel: 'royal-intricate',
      cardWidthMm: 63,
      cardHeightMm: 88,
      imageQuality: '1K',
      modelId: 'gemini-nano-banana-2.1',
    },
    sharedStyleSpec: createSharedStyleSpecification({
      deckType: '36',
      suits: ['guli', 'aguri', 'jvari', 'piki'],
      ranks: ['A', 'K', 'Q', 'J', '10', '9', '8', '7', '6'],
      includeJoker: false,
      jokerCount: 0,
      includeCardBack: true,
      illustrationStyle: 'manuscript-illumination',
      paletteId: 'royal-mtskheta',
      ornamentMotif: 'manuscript',
      complexityLevel: 'royal-intricate',
      cardWidthMm: 63,
      cardHeightMm: 88,
      imageQuality: '1K',
      modelId: 'gemini-nano-banana-2.1',
    }),
    status: 'completed',
    isDemo: true,
    cardCount: 2,
    completedCardCount: 2,
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];

export const INITIAL_DEMO_CARDS: PlayingCard[] = [
  {
    id: 'demo-card-king-guli',
    projectId: 'demo-proj-royal-bagrationi',
    rank: 'K',
    suit: 'guli',
    cardType: 'court',
    titleKa: 'გულის მეფე — დავით აღმაშენებლის ეპოქა',
    subjectDescription:
      'ქართველი მეფე ბაგრატიონთა გვირგვინით, გელათის მონასტრის ორნამენტული სკიპტრითა და ბოლნური ჯვრით.',
    illustrationStyle: 'royal-enamel',
    complexityLevel: 'royal-intricate',
    illustrationUrl: buildGeorgianSvgIllustrationDataUri({
      rank: 'K',
      suit: 'guli',
      themeVariant: 'king-david',
    }),
    designSpec: {
      ...DEFAULT_CARD_DESIGN_SPEC,
      ornamentMotif: 'vine',
    },
    generationStatus: 'completed',
    isFavorite: true,
    isDemo: true,
    modelId: 'demo-heritage-svg',
    promptUsed:
      'Create an original luxury playing card illustration inspired by Georgian cultural heritage: King of Hearts in Bagrationi royal regalia, cloisonné enamel and antique gold.',
    versionHistory: [
      {
        versionId: 'v1-demo-king',
        createdAt: nowIso,
        illustrationUrl: buildGeorgianSvgIllustrationDataUri({
          rank: 'K',
          suit: 'guli',
          themeVariant: 'king-david',
        }),
        promptUsed: 'საწყისი სადემონსტრაციო ვერსია — გულის მეფე',
        modelId: 'demo-heritage-svg',
        isDemo: true,
        designSpec: DEFAULT_CARD_DESIGN_SPEC,
        noteKa: 'ორიგინალი სადემონსტრაციო ნიმუში',
      },
    ],
    exportMetadata: {
      widthMm: 63,
      heightMm: 88,
      bleedMm: 3,
      dpi: 300,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'demo-card-queen-aguri',
    projectId: 'demo-proj-royal-bagrationi',
    rank: 'Q',
    suit: 'aguri',
    cardType: 'court',
    titleKa: 'აგურის დედოფალი — თამარ მეფის ოქროს ხანა',
    subjectDescription:
      'ქართველი დედოფალი ვარძიის ფრესკით შთაგონებული გვირგვინით, საყურე-სასაფეთქლეებითა და მინანქრის საყელოთი.',
    illustrationStyle: 'royal-enamel',
    complexityLevel: 'royal-intricate',
    illustrationUrl: buildGeorgianSvgIllustrationDataUri({
      rank: 'Q',
      suit: 'aguri',
      themeVariant: 'queen-tamar',
    }),
    designSpec: {
      ...DEFAULT_CARD_DESIGN_SPEC,
      ornamentMotif: 'arch',
    },
    generationStatus: 'completed',
    isFavorite: true,
    isDemo: true,
    modelId: 'demo-heritage-svg',
    promptUsed:
      'Create an original luxury playing card illustration inspired by Georgian cultural heritage: Queen of Diamonds inspired by Queen Tamar royal frescoes and cloisonné enamel.',
    versionHistory: [
      {
        versionId: 'v1-demo-queen',
        createdAt: nowIso,
        illustrationUrl: buildGeorgianSvgIllustrationDataUri({
          rank: 'Q',
          suit: 'aguri',
          themeVariant: 'queen-tamar',
        }),
        promptUsed: 'საწყისი სადემონსტრაციო ვერსია — აგურის დედოფალი',
        modelId: 'demo-heritage-svg',
        isDemo: true,
        designSpec: { ...DEFAULT_CARD_DESIGN_SPEC, ornamentMotif: 'arch' },
        noteKa: 'ორიგინალი სადემონსტრაციო ნიმუში',
      },
    ],
    exportMetadata: {
      widthMm: 63,
      heightMm: 88,
      bleedMm: 3,
      dpi: 300,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'demo-card-jack-piki',
    projectId: 'demo-proj-royal-bagrationi',
    rank: 'J',
    suit: 'piki',
    cardType: 'court',
    titleKa: 'პიკის ვალეტი — რაინდი ტარიელი',
    subjectDescription:
      'ქართველი რაინდი ტრადიციული ჩოხით, ვერცხლის მასრებითა და მოოქროვილი ქამარ-ხანჯლით.',
    illustrationStyle: 'royal-enamel',
    complexityLevel: 'royal-intricate',
    illustrationUrl: buildGeorgianSvgIllustrationDataUri({
      rank: 'J',
      suit: 'piki',
      themeVariant: 'knight-tariel',
    }),
    designSpec: {
      ...DEFAULT_CARD_DESIGN_SPEC,
      ornamentMotif: 'geometric',
    },
    generationStatus: 'completed',
    isFavorite: true,
    isDemo: true,
    modelId: 'demo-heritage-svg',
    promptUsed:
      'Create an original luxury playing card illustration inspired by Georgian cultural heritage: Jack of Spades chivalrous knight in Chokha with filigree dagger.',
    versionHistory: [],
    exportMetadata: {
      widthMm: 63,
      heightMm: 88,
      bleedMm: 3,
      dpi: 300,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'demo-card-ace-vazi',
    projectId: 'demo-proj-royal-bagrationi',
    rank: 'A',
    suit: 'vazi',
    cardType: 'ace',
    titleKa: 'ვაზის ტუზი — ქვევრი და სიცოცხლის ხე',
    subjectDescription:
      'მონუმენტური ქართული ქვევრი ბორჯღალითა და ოქროსფერი ვაზის ყლორტებით.',
    illustrationStyle: 'royal-enamel',
    complexityLevel: 'royal-intricate',
    illustrationUrl: buildGeorgianSvgIllustrationDataUri({
      rank: 'A',
      suit: 'vazi',
      themeVariant: 'ace-qvevri',
    }),
    designSpec: {
      ...DEFAULT_CARD_DESIGN_SPEC,
      ornamentMotif: 'vine',
    },
    generationStatus: 'completed',
    isFavorite: true,
    isDemo: true,
    modelId: 'demo-heritage-svg',
    promptUsed:
      'Create an original luxury playing card illustration inspired by Georgian cultural heritage: Ace of Grapevine featuring sacred Qvevri vessel and Tree of Life.',
    versionHistory: [],
    exportMetadata: {
      widthMm: 63,
      heightMm: 88,
      bleedMm: 3,
      dpi: 300,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'demo-card-joker-berika',
    projectId: 'demo-proj-royal-bagrationi',
    rank: 'JOKER',
    suit: 'borjgali',
    cardType: 'joker',
    titleKa: 'ჯოკერი — ბერიკაობის მისტიკური ნიღაბი',
    subjectDescription:
      'უძველესი ქართული ხალხური იმპროვიზაციული თეატრის „ბერიკაობის" სარიტუალო ოქროსრქებიანი ნიღაბი და ზანზალაკები.',
    illustrationStyle: 'royal-enamel',
    complexityLevel: 'royal-intricate',
    illustrationUrl: buildGeorgianSvgIllustrationDataUri({
      rank: 'JOKER',
      suit: 'borjgali',
      themeVariant: 'joker-berika',
    }),
    designSpec: {
      ...DEFAULT_CARD_DESIGN_SPEC,
      ornamentMotif: 'manuscript',
    },
    generationStatus: 'completed',
    isFavorite: false,
    isDemo: true,
    modelId: 'demo-heritage-svg',
    promptUsed:
      'Create an original luxury playing card illustration inspired by Georgian cultural heritage: Joker card depicting mystical Berikaoba ceremonial mask.',
    versionHistory: [],
    exportMetadata: {
      widthMm: 63,
      heightMm: 88,
      bleedMm: 3,
      dpi: 300,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'demo-card-10-jvari',
    projectId: 'demo-proj-royal-bagrationi',
    rank: '10',
    suit: 'jvari',
    cardType: 'pip',
    titleKa: 'ჯვრის ათიანი — სვეტიცხოვლის როზეტი',
    subjectDescription:
      'ქართული ტაძრის ქვაზე კვეთილი რვაქიმიანი ვარსკვლავი და წნული ჩუქურთმა.',
    illustrationStyle: 'carved-stone-relief',
    complexityLevel: 'balanced',
    illustrationUrl: buildGeorgianSvgIllustrationDataUri({
      rank: '10',
      suit: 'jvari',
      themeVariant: 'ornamental-pip',
    }),
    designSpec: {
      ...DEFAULT_CARD_DESIGN_SPEC,
      ornamentMotif: 'geometric',
    },
    generationStatus: 'completed',
    isFavorite: false,
    isDemo: true,
    modelId: 'demo-heritage-svg',
    promptUsed:
      'Create an original luxury playing card illustration inspired by Georgian cultural heritage: Ten of Clubs featuring carved stone rosette.',
    versionHistory: [],
    exportMetadata: {
      widthMm: 63,
      heightMm: 88,
      bleedMm: 3,
      dpi: 300,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'demo-card-vepkhi-king',
    projectId: 'demo-proj-vepkhistqaosani',
    rank: 'K',
    suit: 'piki',
    cardType: 'court',
    titleKa: 'პიკის მეფე — როსტევან მეფე (მინიატურა)',
    subjectDescription:
      'XVI საუკუნის მამუკა თავაქარაშვილისეული ხელნაწერი მინიატურების სტილში შესრულებული მეფე როსტევანი.',
    illustrationStyle: 'manuscript-illumination',
    complexityLevel: 'royal-intricate',
    illustrationUrl: buildGeorgianSvgIllustrationDataUri({
      rank: 'K',
      suit: 'piki',
      primaryColor: '#5E272D',
      secondaryColor: '#2A1810',
      accentColor: '#D4AF37',
      themeVariant: 'king-david',
    }),
    designSpec: {
      ...DEFAULT_CARD_DESIGN_SPEC,
      paletteId: 'royal-mtskheta',
      primaryColor: '#5E272D',
      secondaryColor: '#2A1810',
      accentColor: '#D4AF37',
      ornamentMotif: 'manuscript',
    },
    generationStatus: 'completed',
    isFavorite: true,
    isDemo: true,
    modelId: 'demo-heritage-svg',
    promptUsed:
      'King Rostevan in 16th century Georgian illuminated manuscript miniature style.',
    versionHistory: [],
    exportMetadata: {
      widthMm: 63,
      heightMm: 88,
      bleedMm: 3,
      dpi: 300,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  },
  {
    id: 'demo-card-vepkhi-queen',
    projectId: 'demo-proj-vepkhistqaosani',
    rank: 'Q',
    suit: 'guli',
    cardType: 'court',
    titleKa: 'გულის დედოფალი — ნესტან-დარეჯანი',
    subjectDescription:
      'ნესტან-დარეჯანის პორტრეტი ოქროსფერი შარავანდედითა და აღმოსავლურ-ქართული მინიატურული ორნამენტებით.',
    illustrationStyle: 'manuscript-illumination',
    complexityLevel: 'royal-intricate',
    illustrationUrl: buildGeorgianSvgIllustrationDataUri({
      rank: 'Q',
      suit: 'guli',
      primaryColor: '#5E272D',
      secondaryColor: '#2A1810',
      accentColor: '#D4AF37',
      themeVariant: 'queen-tamar',
    }),
    designSpec: {
      ...DEFAULT_CARD_DESIGN_SPEC,
      paletteId: 'royal-mtskheta',
      primaryColor: '#5E272D',
      secondaryColor: '#2A1810',
      accentColor: '#D4AF37',
      ornamentMotif: 'manuscript',
    },
    generationStatus: 'completed',
    isFavorite: false,
    isDemo: true,
    modelId: 'demo-heritage-svg',
    promptUsed:
      'Queen Nestan-Darejan in Georgian manuscript miniature painting style.',
    versionHistory: [],
    exportMetadata: {
      widthMm: 63,
      heightMm: 88,
      bleedMm: 3,
      dpi: 300,
    },
    createdAt: nowIso,
    updatedAt: nowIso,
  },
];
