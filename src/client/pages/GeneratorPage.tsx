import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Sparkles,
  RefreshCw,
  Save,
  Download,
  Layers,
  CreditCard,
  Play,
  Pause,
  XCircle,
  Sliders,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Info,
  Upload,
  Image as ImageIcon,
  Trash2,
  Wand2,
} from 'lucide-react';
import { CardRenderer } from '../components/CardRenderer';
import { GeorgianOrnamentDivider } from '../components/GeorgianOrnaments';
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  AllowedUploadMimeType,
  buildDeckCardCompositions,
  calculateEstimatedGenerationCost,
  CardRank,
  COLOR_PALETTES,
  DeckConfig,
  GenerationJob,
  ILLUSTRATION_STYLES,
  ORNAMENT_MOTIFS,
  PlayingCard,
  Project,
  RANK_METADATA,
  RANKS_36,
  RANKS_52,
  STANDARD_SUITS,
  SUIT_METADATA,
  SUIT_TYPES,
  SuitType,
  SUPPORTED_GEMINI_MODELS,
  UploadedImageInput,
} from '../../shared/types';
import { buildGeorgianPhotoCompositeSvgDataUri } from '../../shared/demoData';
import { apiClient } from '../services/apiClient';
import { downloadPngFromSvgElement } from '../utils/cardExportUtils';

export const GeneratorPage: React.FC<{
  projects: Project[];
  activeCard: PlayingCard | null;
  onCardGenerated: (card: PlayingCard) => void;
  onSelectCardForEdit: (card: PlayingCard) => void;
  onDeckCreated: (project: Project) => void;
  notify: (text: string, type?: 'info' | 'success' | 'error') => void;
}> = ({
  projects,
  activeCard,
  onCardGenerated,
  onSelectCardForEdit,
  onDeckCreated,
  notify,
}) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Mode Switcher: 'single' | 'photo' | 'deck'
  const initialModeParam = searchParams.get('mode');
  const [mode, setMode] = useState<'single' | 'photo' | 'deck'>(
    initialModeParam === 'deck'
      ? 'deck'
      : initialModeParam === 'photo'
      ? 'photo'
      : 'single'
  );

  // ==========================================================================
  // Photo Upload State (Shared across Photo-to-Card, Single Card & Deck Modes)
  // ==========================================================================
  const [uploadedImage, setUploadedImage] = useState<UploadedImageInput | null>(null);
  const [photoTransformMode, setPhotoTransformMode] = useState<
    'ai-stylize' | 'direct-frame'
  >('ai-stylize');
  const [isDraggingPhoto, setIsDraggingPhoto] = useState<boolean>(false);
  const photoInputRef = useRef<HTMLInputElement | null>(null);

  const handlePhotoFile = (file?: File | null) => {
    if (!file) return;
    if (
      !ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as AllowedUploadMimeType)
    ) {
      notify(
        'მხარდაჭერილია მხოლოდ PNG, JPG და WEBP ფორმატის ფოტოები.',
        'error'
      );
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      notify('ფოტოს ზომა არ უნდა აღემატებოდეს 8 MB-ს.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = String(reader.result || '');
      const base64Clean = resultStr.replace(
        /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
        ''
      );
      setUploadedImage({
        base64Data: base64Clean,
        mimeType: file.type as AllowedUploadMimeType,
        fileName: file.name,
        photoTransformMode,
      });
      setCurrentSingleCard(null);
      notify(`ფოტო "${file.name}" მზადაა ბანქოს დიზაინისთვის!`, 'success');
    };
    reader.onerror = () => {
      notify('ფოტოს წაკითხვისას მოხდა შეცდომა.', 'error');
    };
    reader.readAsDataURL(file);
  };

  const clearUploadedPhoto = () => {
    setUploadedImage(null);
    if (photoInputRef.current) {
      photoInputRef.current.value = '';
    }
  };

  // ==========================================================================
  // 1. Single Card Generator State
  // ==========================================================================
  const [rank, setRank] = useState<CardRank>('K');
  const [suit, setSuit] = useState<SuitType>('guli');
  const [illustrationStyle, setIllustrationStyle] = useState<string>(
    searchParams.get('style') || 'royal-enamel'
  );
  const [paletteId, setPaletteId] = useState<string>('saperavi-gold');
  const [ornamentMotif, setOrnamentMotif] = useState<
    'vine' | 'geometric' | 'arch' | 'manuscript'
  >('vine');
  const [subjectDescription, setSubjectDescription] = useState<string>(
    RANK_METADATA.K.defaultSubjectKa
  );
  const [backgroundStyle, setBackgroundStyle] = useState<string>('dark-velvet-arch');
  const [complexityLevel, setComplexityLevel] = useState<
    'minimal' | 'balanced' | 'royal-intricate'
  >('royal-intricate');
  const [customPrompt, setCustomPrompt] = useState<string>('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ''
  );
  const [modelId, setModelId] = useState<string>('gemini-nano-banana-2.1');
  const [imageQuality, setImageQuality] = useState<'1K' | '2K' | '4K'>('1K');

  const [currentSingleCard, setCurrentSingleCard] = useState<PlayingCard | null>(
    activeCard
  );
  const [isGeneratingSingle, setIsGeneratingSingle] = useState(false);
  const [singleStatusMsg, setSingleStatusMsg] = useState<string>('');
  const [singleErrorMsg, setSingleErrorMsg] = useState<string>('');
  const singleSvgRef = useRef<SVGSVGElement | null>(null);

  // Update default subject when rank changes
  const handleRankChange = (nextRank: CardRank) => {
    setRank(nextRank);
    setSubjectDescription(RANK_METADATA[nextRank].defaultSubjectKa);
  };

  const handleGenerateSingle = async () => {
    setIsGeneratingSingle(true);
    setSingleErrorMsg('');
    setSingleStatusMsg(
      uploadedImage
        ? 'მიმდინარეობს ატვირთული ფოტოდან ქართული კარტის დიზაინის გენერირება...'
        : 'მიმდინარეობს Gemini AI ილუსტრაციისა და ქართული ჩარჩოს გენერირება...'
    );

    try {
      const { card, generationMetadata } = await apiClient.generateSingleCard({
        projectId: selectedProjectId || undefined,
        rank,
        suit,
        illustrationStyle,
        paletteId,
        ornamentMotif,
        subjectDescription,
        backgroundStyle,
        complexityLevel,
        customPrompt: customPrompt || undefined,
        imageQuality,
        modelId,
        uploadedImage: uploadedImage
          ? {
              ...uploadedImage,
              photoTransformMode,
            }
          : undefined,
      });

      setCurrentSingleCard(card);
      onCardGenerated(card);
      setSingleStatusMsg(
        generationMetadata?.warningKa ||
          `კარტი წარმატებით შეიქმნა (${generationMetadata?.durationMs || 0} მწმ)`
      );
      notify(`შეიქმნა კარტი: ${card.titleKa}`, 'success');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'კარტის გენერირებისას დაფიქსირდა შეცდომა.';
      setSingleErrorMsg(msg);
      notify(msg, 'error');
    } finally {
      setIsGeneratingSingle(false);
    }
  };

  const handleRegenerateSingle = async () => {
    if (!currentSingleCard) {
      return handleGenerateSingle();
    }
    setIsGeneratingSingle(true);
    setSingleErrorMsg('');
    setSingleStatusMsg('მიმდინარეობს კარტის ხელახალი გენერირება ახალი ვერსიის შენახვით...');

    try {
      const { card } = await apiClient.regenerateCard(currentSingleCard.id, {
        subjectDescription,
        customPrompt: customPrompt || undefined,
        illustrationStyle,
        paletteId,
        ornamentMotif,
        complexityLevel,
        modelId,
        noteKa: 'გენერატორიდან ხელახლა შექმნილი',
        uploadedImage: uploadedImage
          ? {
              ...uploadedImage,
              photoTransformMode,
            }
          : undefined,
      } as any);
      setCurrentSingleCard(card);
      onCardGenerated(card);
      setSingleStatusMsg('კარტი წარმატებით განახლდა!');
      notify('კარტი ხელახლა დაგენერირდა.', 'success');
    } catch (err: any) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'ხელახალი გენერირების შეცდომა.';
      setSingleErrorMsg(msg);
      notify(msg, 'error');
    } finally {
      setIsGeneratingSingle(false);
    }
  };

  const handleSaveSingleCard = async () => {
    if (!currentSingleCard) return;
    try {
      const updated = await apiClient.updateCard(currentSingleCard.id, {
        subjectDescription,
        isFavorite: true,
      });
      setCurrentSingleCard(updated);
      onCardGenerated(updated);
      notify('კარტი შენახულია პროექტსა და რჩეულებში.', 'success');
    } catch (err: any) {
      notify('შენახვა ვერ მოხერხდა.', 'error');
    }
  };

  const handleDownloadSingleCard = async () => {
    if (!singleSvgRef.current) return;
    try {
      const targetSuit = currentSingleCard?.suit || suit;
      const targetRank = currentSingleCard?.rank || rank;
      await downloadPngFromSvgElement(
        singleSvgRef.current,
        `kartuli-card-${targetSuit}-${targetRank}.png`
      );
      notify('კარტი ჩამოტვირთულია PNG ფორმატში.', 'success');
    } catch {
      notify('ჩამოტვირთვისას მოხდა შეცდომა.', 'error');
    }
  };

  // ==========================================================================
  // 2. Complete Deck Generator State
  // ==========================================================================
  const [deckProjectName, setDeckProjectName] = useState<string>(
    'ქართული სამეფო დასტა'
  );
  const [deckDescription, setDeckDescription] = useState<string>(
    'სრული ქართული ორნამენტული სათამაშო ბანქოს დასტა.'
  );
  const [deckType, setDeckType] = useState<'36' | '52' | 'custom'>('36');
  const [customSuits, setCustomSuits] = useState<SuitType[]>([...STANDARD_SUITS]);
  const [customRanks, setCustomRanks] = useState<CardRank[]>(['A', 'K', 'Q', 'J', '10']);
  const [includeJoker, setIncludeJoker] = useState<boolean>(true);
  const [jokerCount, setJokerCount] = useState<number>(1);
  const [cardWidthMm, setCardWidthMm] = useState<number>(63);
  const [cardHeightMm, setCardHeightMm] = useState<number>(88);
  const [customDeckThemePrompt, setCustomDeckThemePrompt] = useState<string>('');

  // Cost Confirmation Modal before starting large deck generation
  const [showCostConfirmModal, setShowCostConfirmModal] = useState<boolean>(false);

  // Active Deck Job Tracking
  const [activeJob, setActiveJob] = useState<GenerationJob | null>(null);
  const [deckCards, setDeckCards] = useState<PlayingCard[]>([]);
  const [regeneratingCardId, setRegeneratingCardId] = useState<string | null>(null);

  const currentDeckConfig: DeckConfig = {
    deckType,
    suits: deckType === 'custom' ? customSuits : STANDARD_SUITS,
    ranks:
      deckType === '52'
        ? [...RANKS_52]
        : deckType === '36'
        ? [...RANKS_36]
        : customRanks,
    includeJoker,
    jokerCount: includeJoker ? jokerCount : 0,
    includeCardBack: true,
    illustrationStyle,
    paletteId,
    ornamentMotif,
    complexityLevel,
    cardWidthMm,
    cardHeightMm,
    imageQuality,
    modelId,
    customDeckThemePrompt: customDeckThemePrompt || undefined,
    uploadedReferenceImage: uploadedImage
      ? {
          ...uploadedImage,
          photoTransformMode,
        }
      : undefined,
  };

  const plannedCompositions = buildDeckCardCompositions(currentDeckConfig);
  const costEstimate = calculateEstimatedGenerationCost(
    plannedCompositions.length,
    modelId,
    imageQuality
  );

  // Poll active generation job status
  useEffect(() => {
    if (!activeJob) return;
    if (
      activeJob.status === 'completed' ||
      activeJob.status === 'cancelled' ||
      activeJob.status === 'failed' ||
      activeJob.status === 'paused'
    ) {
      return;
    }

    const timer = setInterval(async () => {
      try {
        const res = await apiClient.getGenerationJob(activeJob.id);
        setActiveJob(res.job);
        setDeckCards(res.cards);
        if (res.job.status === 'completed') {
          notify('სრული დასტის გენერირება წარმატებით დასრულდა!', 'success');
          if (res.project) onDeckCreated(res.project);
        }
      } catch {
        // ignore transient polling error
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeJob, notify, onDeckCreated]);

  // Support resuming a job via URL query `?jobId=...`
  useEffect(() => {
    const qJobId = searchParams.get('jobId');
    if (qJobId) {
      setMode('deck');
      apiClient
        .getGenerationJob(qJobId)
        .then((res) => {
          setActiveJob(res.job);
          setDeckCards(res.cards);
        })
        .catch(() => {});
    }
  }, [searchParams]);

  const handleConfirmAndStartDeck = async () => {
    setShowCostConfirmModal(false);
    try {
      const res = await apiClient.generateCompleteDeck({
        projectName: deckProjectName || 'ქართული დასტა',
        projectDescription: deckDescription,
        deckConfig: currentDeckConfig,
        confirmedCostEstimate: true,
      });
      setActiveJob(res.job);
      setDeckCards(res.cards);
      onDeckCreated(res.project);
      notify(`დასტის გენერირების რიგი შეიქმნა (${res.job.totalCards} კარტი)`, 'info');
    } catch (err: any) {
      notify(
        err?.response?.data?.error || 'დასტის გენერირების დაწყება ვერ მოხერხდა.',
        'error'
      );
    }
  };

  const handlePauseOrCancelJob = async (action: 'pause' | 'cancel') => {
    if (!activeJob) return;
    try {
      const res = await apiClient.cancelOrPauseGenerationJob(activeJob.id, action);
      setActiveJob(res.job);
      setDeckCards(res.cards);
      notify(
        action === 'pause'
          ? 'დასტის გენერირება დაპაუზდა.'
          : 'დასტის გენერირება გაუქმდა.',
        'info'
      );
    } catch {
      notify('ოპერაცია ვერ შესრულდა.', 'error');
    }
  };

  const handleRetryOrResumeJob = async () => {
    if (!activeJob) return;
    try {
      const res = await apiClient.retryGenerationJob(activeJob.id);
      setActiveJob(res.job);
      setDeckCards(res.cards);
      notify('გენერირების პროცესი განახლდა.', 'info');
    } catch {
      notify('განახლება ვერ მოხერხდა.', 'error');
    }
  };

  const handleRegenerateDeckCard = async (card: PlayingCard) => {
    setRegeneratingCardId(card.id);
    try {
      const { card: updated } = await apiClient.regenerateCard(card.id, {
        noteKa: 'დასტის გალერეიდან ინდივიდუალური ხელახალი გენერაცია',
      });
      setDeckCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      onCardGenerated(updated);
      notify(`${updated.titleKa} ხელახლა დაგენერირდა.`, 'success');
    } catch {
      notify('კარტის ხელახალი გენერირება ვერ მოხერხდა.', 'error');
    } finally {
      setRegeneratingCardId(null);
    }
  };

  const toggleCustomSuit = (s: SuitType) => {
    setCustomSuits((prev) =>
      prev.includes(s)
        ? prev.length > 1
          ? prev.filter((item) => item !== s)
          : prev
        : [...prev, s]
    );
  };

  const toggleCustomRank = (r: CardRank) => {
    setCustomRanks((prev) =>
      prev.includes(r)
        ? prev.length > 1
          ? prev.filter((item) => item !== r)
          : prev
        : [...prev, r]
    );
  };

  const selectedPaletteObj =
    COLOR_PALETTES.find((p) => p.id === paletteId) || COLOR_PALETTES[0];

  // Instant client-side preview of the uploaded photo framed inside the Georgian SVG card
  const liveUploadedPhotoIllustrationUrl = uploadedImage
    ? buildGeorgianPhotoCompositeSvgDataUri({
        base64Data: uploadedImage.base64Data,
        mimeType: uploadedImage.mimeType,
        rank,
        suit,
        primaryColor: selectedPaletteObj.primary,
        secondaryColor: selectedPaletteObj.secondary,
        accentColor: selectedPaletteObj.accent,
        stylizeFilter: photoTransformMode === 'ai-stylize',
      })
    : undefined;

  const handleGenerateRoyalSetFromPhoto = async () => {
    if (!uploadedImage) {
      notify('გთხოვთ, ჯერ ატვირთოთ ფოტო.', 'error');
      return;
    }
    try {
      const royalDeckConfig: DeckConfig = {
        deckType: 'custom',
        suits: [suit],
        ranks: ['A', 'K', 'Q', 'J'],
        includeJoker: false,
        jokerCount: 0,
        includeCardBack: true,
        illustrationStyle,
        paletteId,
        ornamentMotif,
        complexityLevel,
        cardWidthMm: 63,
        cardHeightMm: 88,
        imageQuality,
        modelId,
        customDeckThemePrompt:
          customPrompt || 'ატვირთული ფოტოს მიხედვით შექმნილი ქართული სამეფო კარტების სერია',
        uploadedReferenceImage: {
          ...uploadedImage,
          photoTransformMode,
        },
      };
      const res = await apiClient.generateCompleteDeck({
        projectName: `ფოტო-კოლექცია (${uploadedImage.fileName || 'სამეფო ნაკრები'})`,
        projectDescription: 'მომხმარებლის ატვირთული ფოტოდან გენერირებული ქართული სამეფო კარტები.',
        deckConfig: royalDeckConfig,
        confirmedCostEstimate: true,
      });
      setMode('deck');
      setActiveJob(res.job);
      setDeckCards(res.cards);
      onDeckCreated(res.project);
      notify('ფოტოდან 4 სამეფო კარტის გენერირება დაიწყო!', 'success');
    } catch (err: any) {
      notify(
        err?.response?.data?.error || 'ფოტოდან ნაკრების შექმნა ვერ მოხერხდა.',
        'error'
      );
    }
  };

  const renderPhotoUploadSection = (titleText: string) => (
    <div
      style={{
        padding: '0.95rem',
        background: isDraggingPhoto
          ? 'rgba(198, 161, 91, 0.16)'
          : 'rgba(53, 26, 34, 0.38)',
        border: isDraggingPhoto
          ? '2px dashed var(--color-gold-bright)'
          : '1px dashed rgba(198, 161, 91, 0.45)',
        borderRadius: 'var(--radius-md)',
        marginBottom: '1.15rem',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDraggingPhoto(true);
      }}
      onDragLeave={() => setIsDraggingPhoto(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingPhoto(false);
        const droppedFile = e.dataTransfer.files?.[0];
        if (droppedFile) handlePhotoFile(droppedFile);
      }}
    >
      <input
        ref={photoInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        data-testid="photo-upload-input"
        onChange={(e) => handlePhotoFile(e.target.files?.[0])}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.55rem',
          marginBottom: '0.7rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <ImageIcon size={17} color="#C6A15B" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontWeight: 600,
              fontSize: '0.86rem',
              color: 'var(--color-ivory)',
              lineHeight: 1.3,
            }}
          >
            {titleText}
          </span>
        </div>

        <button
          type="button"
          className="btn btn-gold btn-sm"
          style={{ width: '100%' }}
          onClick={() => photoInputRef.current?.click()}
        >
          <Upload size={14} />
          <span>{uploadedImage ? 'სხვა ფოტოს არჩევა' : 'ფოტოს ატვირთვა'}</span>
        </button>
      </div>

      {!uploadedImage ? (
        <div
          onClick={() => photoInputRef.current?.click()}
          style={{
            fontSize: '0.79rem',
            color: 'var(--color-stone)',
            cursor: 'pointer',
            padding: '0.2rem 0',
            lineHeight: 1.5,
          }}
        >
          გადმოიტანეთ ფოტო აქ ან დააჭირეთ ასატვირთად (PNG, JPG, WEBP — მაქს. 8MB). პროგრამა ავტომატურად შექმნის ორმხრივ სამეფო ქართულ ბანქოს თქვენი ფოტოთი.
        </div>
      ) : (
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
              padding: '0.55rem',
              background: 'rgba(15, 13, 14, 0.72)',
              borderRadius: 'var(--radius-sm)',
              border: 'var(--border-gold-thin)',
              marginBottom: '0.65rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                minWidth: 0,
                flex: 1,
              }}
            >
              <img
                src={`data:${uploadedImage.mimeType};base64,${uploadedImage.base64Data}`}
                alt="ატვირთული ფოტო"
                style={{
                  width: '46px',
                  height: '58px',
                  objectFit: 'cover',
                  borderRadius: '6px',
                  border: '1px solid var(--color-gold)',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                  title={uploadedImage.fileName || 'ატვირთული ფოტო'}
                >
                  {uploadedImage.fileName || 'ატვირთული ფოტო'}
                </div>
                <div style={{ fontSize: '0.73rem', color: '#8CD9A3', lineHeight: 1.3 }}>
                  ფოტო მზადაა ბანქოს დიზაინში
                </div>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-danger btn-sm"
              style={{ flexShrink: 0, padding: '0.4rem 0.65rem' }}
              onClick={clearUploadedPhoto}
              title="ფოტოს წაშლა"
            >
              <Trash2 size={14} />
              <span>წაშლა</span>
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <button
              type="button"
              className={`btn btn-sm ${
                photoTransformMode === 'ai-stylize' ? 'btn-primary' : 'btn-secondary'
              }`}
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={() => {
                setPhotoTransformMode('ai-stylize');
                setCurrentSingleCard(null);
                setUploadedImage((prev) =>
                  prev ? { ...prev, photoTransformMode: 'ai-stylize' } : null
                );
              }}
            >
              <Wand2 size={14} />
              <span>სამეფო ორმხრივი ბანქოს სტილიზაცია (AI / სიმეტრიული)</span>
            </button>

            <button
              type="button"
              className={`btn btn-sm ${
                photoTransformMode === 'direct-frame' ? 'btn-primary' : 'btn-secondary'
              }`}
              style={{ width: '100%', justifyContent: 'flex-start' }}
              onClick={() => {
                setPhotoTransformMode('direct-frame');
                setCurrentSingleCard(null);
                setUploadedImage((prev) =>
                  prev ? { ...prev, photoTransformMode: 'direct-frame' } : null
                );
              }}
            >
              <ImageIcon size={14} />
              <span>სრული პორტრეტი ქართულ თაღოვან ჩარჩოში</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="container" style={{ paddingTop: '2.25rem' }}>
      {/* Page Header & Segmented Mode Switcher */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.25rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
            დიზაინის გენერატორი
          </h1>
          <p style={{ color: 'var(--color-stone)', fontSize: '0.92rem' }}>
            ატვირთეთ ფოტო, შექმენით ცალკეული კარტი ან დააგენერირეთ სრული ქართული დასტა
          </p>
        </div>

        <div className="segmented-control" role="tablist" aria-label="გენერაციის რეჟიმი">
          <button
            role="tab"
            aria-selected={mode === 'single'}
            className={`segment-btn ${mode === 'single' ? 'active' : ''}`}
            onClick={() => setMode('single')}
          >
            <CreditCard size={17} />
            <span>ერთი კარტის გენერატორი</span>
          </button>
          <button
            role="tab"
            aria-selected={mode === 'photo'}
            className={`segment-btn ${mode === 'photo' ? 'active' : ''}`}
            onClick={() => setMode('photo')}
          >
            <Upload size={17} />
            <span>ფოტოდან დიზაინი</span>
          </button>
          <button
            role="tab"
            aria-selected={mode === 'deck'}
            className={`segment-btn ${mode === 'deck' ? 'active' : ''}`}
            onClick={() => setMode('deck')}
          >
            <Layers size={17} />
            <span>სრული დასტის გენერატორი</span>
          </button>
        </div>
      </div>

      {/* ====================================================================
          MODE 0: PHOTO-TO-CARD STUDIO (ფოტოდან დიზაინის სწრაფი შექმნა)
         ==================================================================== */}
      {mode === 'photo' && (
        <div className="workspace-grid">
          <div className="luxury-panel" style={{ padding: '1.6rem' }}>
            <span className="badge badge-gold" style={{ marginBottom: '0.6rem' }}>
              ფოტოდან კარტისა და დასტის ავტომატური დიზაინი
            </span>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>
              ატვირთეთ ფოტო და მიიღეთ მზა ქართული ბანქოს დიზაინი
            </h3>
            <p style={{ color: 'var(--color-stone)', fontSize: '0.86rem', marginBottom: '1.2rem' }}>
              ატვირთეთ პორტრეტი, ფოტოსურათი, ლოგო ან ილუსტრაცია — სისტემა ავტომატურად მოარგებს ქართულ ორნამენტულ ჩარჩოს, სამეფო გვირგვინს, ინდექსებსა და მხატვრულ სტილიზაციას.
            </p>

            {renderPhotoUploadSection('1. ატვირთეთ თქვენი ფოტო')}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="photo-rank-select">
                  კარტის რანგი
                </label>
                <select
                  id="photo-rank-select"
                  className="form-select"
                  value={rank}
                  onChange={(e) => handleRankChange(e.target.value as CardRank)}
                >
                  {Object.values(RANK_METADATA).map((r) => (
                    <option key={r.rank} value={r.rank}>
                      {r.labelKa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="photo-suit-select">
                  მასტი / სიმბოლო
                </label>
                <select
                  id="photo-suit-select"
                  className="form-select"
                  value={suit}
                  onChange={(e) => setSuit(e.target.value as SuitType)}
                >
                  {SUIT_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {SUIT_METADATA[s].symbol} {SUIT_METADATA[s].nameKa}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="photo-palette-select">
                  ფერთა პალიტრა
                </label>
                <select
                  id="photo-palette-select"
                  className="form-select"
                  value={paletteId}
                  onChange={(e) => setPaletteId(e.target.value)}
                >
                  {COLOR_PALETTES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nameKa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="photo-motif-select">
                  ქართული ორნამენტი
                </label>
                <select
                  id="photo-motif-select"
                  className="form-select"
                  value={ornamentMotif}
                  onChange={(e) => setOrnamentMotif(e.target.value as any)}
                >
                  {ORNAMENT_MOTIFS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nameKa}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="photo-custom-prompt">
                სურვილისამებრ: დამატებითი მითითება სტილიზაციისთვის
              </label>
              <input
                id="photo-custom-prompt"
                type="text"
                className="form-input"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="მაგ: შეინარჩუნე სახის ნაკვთები და შექმენი ქართველი მეფის სამოსით..."
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem', marginTop: '1rem' }}>
              <button
                className="btn btn-primary"
                onClick={handleGenerateSingle}
                disabled={!uploadedImage || isGeneratingSingle}
              >
                <Sparkles size={18} />
                <span>ფოტოდან კარტის დიზაინის გენერირება</span>
              </button>

              <button
                className="btn btn-gold"
                onClick={handleGenerateRoyalSetFromPhoto}
                disabled={!uploadedImage || isGeneratingSingle}
              >
                <Layers size={17} />
                <span>ფოტოდან 4 სამეფო კარტის (A, K, Q, J) შექმნა</span>
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={handleSaveSingleCard}
                  disabled={!currentSingleCard || isGeneratingSingle}
                >
                  <Save size={16} />
                  <span>შენახვა</span>
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={handleDownloadSingleCard}
                  disabled={!currentSingleCard || isGeneratingSingle}
                >
                  <Download size={16} />
                  <span>ჩამოტვირთვა</span>
                </button>
              </div>
            </div>
          </div>

          {/* Right Live Preview for Photo-to-Card Mode */}
          <div
            className="luxury-panel"
            style={{
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '640px',
            }}
          >
            <span className="badge badge-gold" style={{ marginBottom: '1rem' }}>
              {uploadedImage
                ? 'ცოცხალი გადახედვა თქვენი ატვირთული ფოტოთი'
                : 'ატვირთეთ ფოტო მარცხენა პანელში'}
            </span>
            <CardRenderer
              id={currentSingleCard?.id || 'photo-live-preview'}
              svgRef={singleSvgRef}
              rank={rank}
              suit={suit}
              illustrationUrl={
                liveUploadedPhotoIllustrationUrl || currentSingleCard?.illustrationUrl
              }
              titleKa={`${SUIT_METADATA[suit].nameKa} — ${RANK_METADATA[rank].labelKa}`}
              designSpec={{
                paletteId: selectedPaletteObj.id,
                primaryColor: selectedPaletteObj.primary,
                secondaryColor: selectedPaletteObj.secondary,
                accentColor: selectedPaletteObj.accent,
                surfaceColor: selectedPaletteObj.surface,
                ornamentMotif,
              }}
              scale={1.08}
            />

            {singleStatusMsg && (
              <div
                style={{
                  marginTop: '1.25rem',
                  padding: '0.6rem 1rem',
                  background: 'rgba(198, 161, 91, 0.12)',
                  border: 'var(--border-gold-thin)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--color-gold-bright)',
                  fontSize: '0.85rem',
                }}
              >
                {singleStatusMsg}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODE 1: SINGLE CARD GENERATOR (ერთი კარტის გენერატორი)
         ==================================================================== */}
      {mode === 'single' && (
        <div className="workspace-grid">
          {/* Configuration Form Panel */}
          <div className="luxury-panel" style={{ padding: '1.6rem' }}>
            <h3 style={{ fontSize: '1.15rem', marginBottom: '1.15rem' }}>
              კარტის პარამეტრები
            </h3>

            {/* Optional Photo Upload inside Single Card Generator */}
            {renderPhotoUploadSection('ფოტოს ატვირთვა დიზაინისთვის (არასავალდებულო)')}

            {/* Rank & Suit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="single-rank-select">
                  კარტის რანგი
                </label>
                <select
                  id="single-rank-select"
                  className="form-select"
                  value={rank}
                  onChange={(e) => handleRankChange(e.target.value as CardRank)}
                >
                  {Object.values(RANK_METADATA).map((r) => (
                    <option key={r.rank} value={r.rank}>
                      {r.labelKa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="single-suit-select">
                  მასტი / სიმბოლო
                </label>
                <select
                  id="single-suit-select"
                  className="form-select"
                  value={suit}
                  onChange={(e) => setSuit(e.target.value as SuitType)}
                >
                  {SUIT_TYPES.map((s) => (
                    <option key={s} value={s}>
                      {SUIT_METADATA[s].symbol} {SUIT_METADATA[s].nameKa}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Illustration Style */}
            <div className="form-group">
              <label className="form-label" htmlFor="single-style-select">
                ილუსტრაციის სტილი
              </label>
              <select
                id="single-style-select"
                className="form-select"
                value={illustrationStyle}
                onChange={(e) => setIllustrationStyle(e.target.value)}
              >
                {ILLUSTRATION_STYLES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.nameKa}
                  </option>
                ))}
              </select>
            </div>

            {/* Color Palette */}
            <div className="form-group">
              <label className="form-label" htmlFor="single-palette-select">
                ფერთა პალიტრა
              </label>
              <select
                id="single-palette-select"
                className="form-select"
                value={paletteId}
                onChange={(e) => setPaletteId(e.target.value)}
              >
                {COLOR_PALETTES.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nameKa}
                  </option>
                ))}
              </select>
            </div>

            {/* Georgian Ornamental Motif & Complexity */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="single-motif-select">
                  ქართული ორნამენტი
                </label>
                <select
                  id="single-motif-select"
                  className="form-select"
                  value={ornamentMotif}
                  onChange={(e) => setOrnamentMotif(e.target.value as any)}
                >
                  {ORNAMENT_MOTIFS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nameKa}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="single-complexity-select">
                  სირთულის დონე
                </label>
                <select
                  id="single-complexity-select"
                  className="form-select"
                  value={complexityLevel}
                  onChange={(e) => setComplexityLevel(e.target.value as any)}
                >
                  <option value="minimal">მინიმალისტური</option>
                  <option value="balanced">დაბალანსებული</option>
                  <option value="royal-intricate">სამეფო დეტალური</option>
                </select>
              </div>
            </div>

            {/* Character or Subject */}
            <div className="form-group">
              <label className="form-label" htmlFor="single-subject-input">
                პერსონაჟი ან თემატიკა
              </label>
              <textarea
                id="single-subject-input"
                className="form-textarea"
                rows={2}
                value={subjectDescription}
                onChange={(e) => setSubjectDescription(e.target.value)}
                placeholder="მაგ: ქართველი მეფე ოქრომკედით ნაქარგი სამოსით..."
              />
            </div>

            {/* Background Style & Gemini Model */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="single-bg-select">
                  ფონის სტილი
                </label>
                <select
                  id="single-bg-select"
                  className="form-select"
                  value={backgroundStyle}
                  onChange={(e) => setBackgroundStyle(e.target.value)}
                >
                  <option value="dark-velvet-arch">მუქი ხავერდის თაღი</option>
                  <option value="parchment-gold">ძველი პერგამენტი და ოქრო</option>
                  <option value="carved-sanctuary">ქვაზე კვეთილი საკურთხეველი</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="single-model-select">
                  Gemini მოდელი
                </label>
                <select
                  id="single-model-select"
                  className="form-select"
                  value={modelId}
                  onChange={(e) => setModelId(e.target.value)}
                >
                  {SUPPORTED_GEMINI_MODELS.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.nameKa}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Optional Custom Prompt */}
            <div className="form-group">
              <label className="form-label" htmlFor="single-custom-prompt">
                დამატებითი მითითება (არასავალდებულო)
              </label>
              <input
                id="single-custom-prompt"
                type="text"
                className="form-input"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="დამატებითი დეტალები განათების ან კომპოზიციის შესახებ..."
              />
            </div>

            {/* Target Project */}
            <div className="form-group">
              <label className="form-label" htmlFor="single-project-select">
                პროექტში მიბმა
              </label>
              <select
                id="single-project-select"
                className="form-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                <option value="">ახალი კოლექციის შექმნა</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Primary Required Georgian Action Buttons */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginTop: '1.25rem',
              }}
            >
              <button
                className="btn btn-primary"
                onClick={handleGenerateSingle}
                disabled={isGeneratingSingle}
              >
                <Sparkles size={17} />
                <span>კარტის გენერირება</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleRegenerateSingle}
                disabled={isGeneratingSingle}
              >
                <RefreshCw size={17} />
                <span>ხელახლა გენერირება</span>
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleSaveSingleCard}
                disabled={!currentSingleCard || isGeneratingSingle}
              >
                <Save size={17} />
                <span>შენახვა</span>
              </button>

              <button
                className="btn btn-gold"
                onClick={handleDownloadSingleCard}
                disabled={!currentSingleCard || isGeneratingSingle}
              >
                <Download size={17} />
                <span>ჩამოტვირთვა</span>
              </button>
            </div>
          </div>

          {/* Right Large Preview Panel */}
          <div
            className="luxury-panel"
            style={{
              padding: '2.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '640px',
            }}
          >
            {isGeneratingSingle ? (
              <div style={{ textAlign: 'center', maxWidth: '380px' }}>
                <div
                  className="skeleton"
                  style={{ width: '300px', height: '420px', margin: '0 auto 1.5rem' }}
                />
                <p style={{ color: 'var(--color-gold)', fontWeight: 600 }}>
                  {singleStatusMsg}
                </p>
              </div>
            ) : (
              <>
                <CardRenderer
                  id={currentSingleCard?.id || 'single-live-preview'}
                  svgRef={singleSvgRef}
                  rank={uploadedImage ? rank : currentSingleCard?.rank || rank}
                  suit={uploadedImage ? suit : currentSingleCard?.suit || suit}
                  illustrationUrl={
                    uploadedImage
                      ? currentSingleCard?.illustrationUrl || liveUploadedPhotoIllustrationUrl
                      : currentSingleCard?.illustrationUrl
                  }
                  titleKa={
                    uploadedImage
                      ? `${SUIT_METADATA[suit].nameKa} — ${RANK_METADATA[rank].labelKa}`
                      : currentSingleCard?.titleKa ||
                        `${SUIT_METADATA[suit].nameKa} — ${RANK_METADATA[rank].labelKa}`
                  }
                  designSpec={
                    uploadedImage
                      ? {
                          paletteId: selectedPaletteObj.id,
                          primaryColor: selectedPaletteObj.primary,
                          secondaryColor: selectedPaletteObj.secondary,
                          accentColor: selectedPaletteObj.accent,
                          surfaceColor: selectedPaletteObj.surface,
                          ornamentMotif,
                        }
                      : currentSingleCard?.designSpec || {
                          paletteId: selectedPaletteObj.id,
                          primaryColor: selectedPaletteObj.primary,
                          secondaryColor: selectedPaletteObj.secondary,
                          accentColor: selectedPaletteObj.accent,
                          surfaceColor: selectedPaletteObj.surface,
                          ornamentMotif,
                        }
                  }
                  scale={1.08}
                />

                <div
                  style={{
                    marginTop: '1.75rem',
                    textAlign: 'center',
                    maxWidth: '520px',
                  }}
                >
                  {singleErrorMsg && (
                    <div
                      style={{
                        padding: '0.75rem 1rem',
                        background: 'rgba(184, 66, 66, 0.18)',
                        border: '1px solid var(--color-danger)',
                        borderRadius: 'var(--radius-sm)',
                        color: '#F5A3A3',
                        marginBottom: '1rem',
                        fontSize: '0.88rem',
                      }}
                    >
                      {singleErrorMsg}
                    </div>
                  )}

                  {singleStatusMsg && !singleErrorMsg && (
                    <div
                      style={{
                        padding: '0.6rem 1rem',
                        background: 'rgba(198, 161, 91, 0.12)',
                        border: 'var(--border-gold-thin)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--color-gold-bright)',
                        marginBottom: '1rem',
                        fontSize: '0.85rem',
                      }}
                    >
                      {singleStatusMsg}
                    </div>
                  )}

                  {currentSingleCard && (
                    <div
                      style={{
                        display: 'flex',
                        gap: '0.75rem',
                        justifyContent: 'center',
                        flexWrap: 'wrap',
                      }}
                    >
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          onSelectCardForEdit(currentSingleCard);
                          navigate('/editor');
                        }}
                      >
                        <Sliders size={15} />
                        <span>კარტის რედაქტორში დეტალური მორგება</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ====================================================================
          MODE 2: COMPLETE DECK GENERATOR (სრული დასტის გენერატორი)
         ==================================================================== */}
      {mode === 'deck' && (
        <div>
          <div className="workspace-grid">
            {/* Left Configuration Panel */}
            <div className="luxury-panel" style={{ padding: '1.6rem' }}>
              <h3 style={{ fontSize: '1.15rem', marginBottom: '1rem' }}>
                სრული დასტის კონფიგურაცია
              </h3>

              {/* Optional Reference Photo Upload for Complete Deck */}
              {renderPhotoUploadSection('საყრდენი ფოტო დასტის დიზაინისთვის (არასავალდებულო)')}

              <div className="form-group">
                <label className="form-label" htmlFor="deck-name-input">
                  პროექტის / დასტის სახელი
                </label>
                <input
                  id="deck-name-input"
                  type="text"
                  className="form-input"
                  value={deckProjectName}
                  onChange={(e) => setDeckProjectName(e.target.value)}
                />
              </div>

              {/* Deck Size Mode: 36, 52, Custom */}
              <div className="form-group">
                <label className="form-label">დასტის ფორმატი</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                  {[
                    { id: '36', label: '36 კარტი (6–A)' },
                    { id: '52', label: '52 კარტი (2–A)' },
                    { id: 'custom', label: 'ინდივიდუალური' },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      className={`btn btn-sm ${
                        deckType === opt.id ? 'btn-primary' : 'btn-secondary'
                      }`}
                      onClick={() => setDeckType(opt.id as any)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Deck Composition Controls */}
              {deckType === 'custom' && (
                <div
                  style={{
                    padding: '0.9rem',
                    background: 'rgba(15,13,14,0.65)',
                    border: 'var(--border-gold-thin)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1rem',
                  }}
                >
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    აირჩიეთ მასტები / ქართული სიმბოლოები:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginBottom: '0.85rem' }}>
                    {SUIT_TYPES.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className={`btn btn-sm ${
                          customSuits.includes(s) ? 'btn-primary' : 'btn-secondary'
                        }`}
                        onClick={() => toggleCustomSuit(s)}
                      >
                        {SUIT_METADATA[s].symbol} {SUIT_METADATA[s].nameKa.split(' ')[0]}
                      </button>
                    ))}
                  </div>

                  <div style={{ fontSize: '0.82rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    აირჩიეთ რანგები:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                    {RANKS_52.map((r) => (
                      <button
                        key={r}
                        type="button"
                        className={`btn btn-sm ${
                          customRanks.includes(r) ? 'btn-primary' : 'btn-secondary'
                        }`}
                        onClick={() => toggleCustomRank(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Optional Joker Config */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: '1rem',
                  padding: '0.65rem 0.85rem',
                  background: 'rgba(198,161,91,0.07)',
                  borderRadius: 'var(--radius-sm)',
                }}
              >
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={includeJoker}
                    onChange={(e) => setIncludeJoker(e.target.checked)}
                  />
                  <span>ჯოკერის დამატება (ბერიკაობა)</span>
                </label>

                {includeJoker && (
                  <select
                    className="form-select"
                    style={{ width: '90px', padding: '0.3rem 0.5rem' }}
                    value={jokerCount}
                    onChange={(e) => setJokerCount(Number(e.target.value))}
                  >
                    <option value={1}>1 ჯოკერი</option>
                    <option value={2}>2 ჯოკერი</option>
                  </select>
                )}
              </div>

              {/* Style, Palette, Ornament */}
              <div className="form-group">
                <label className="form-label">დასტის მხატვრული სტილი</label>
                <select
                  className="form-select"
                  value={illustrationStyle}
                  onChange={(e) => setIllustrationStyle(e.target.value)}
                >
                  {ILLUSTRATION_STYLES.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.nameKa}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div className="form-group">
                  <label className="form-label">ფერთა პალიტრა</label>
                  <select
                    className="form-select"
                    value={paletteId}
                    onChange={(e) => setPaletteId(e.target.value)}
                  >
                    {COLOR_PALETTES.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nameKa}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">ორნამენტის თემა</label>
                  <select
                    className="form-select"
                    value={ornamentMotif}
                    onChange={(e) => setOrnamentMotif(e.target.value as any)}
                  >
                    {ORNAMENT_MOTIFS.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.nameKa}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Card Dimensions & Quality */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
                <div className="form-group">
                  <label className="form-label">სიგანე (მმ)</label>
                  <input
                    type="number"
                    className="form-input"
                    min={50}
                    max={90}
                    value={cardWidthMm}
                    onChange={(e) => setCardWidthMm(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">სიმაღლე (მმ)</label>
                  <input
                    type="number"
                    className="form-input"
                    min={75}
                    max={130}
                    value={cardHeightMm}
                    onChange={(e) => setCardHeightMm(Number(e.target.value))}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">ხარისხი</label>
                  <select
                    className="form-select"
                    value={imageQuality}
                    onChange={(e) => setImageQuality(e.target.value as any)}
                  >
                    <option value="1K">1K (სწრაფი)</option>
                    <option value="2K">2K (მაღალი)</option>
                    <option value="4K">4K (სტამბური)</option>
                  </select>
                </div>
              </div>

              {/* Cost Estimate Summary Box */}
              <div
                style={{
                  padding: '0.95rem',
                  background: 'rgba(53, 26, 34, 0.45)',
                  border: 'var(--border-gold-thin)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: '1.25rem',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.88rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span>სულ კარტების რაოდენობა:</span>
                  <strong style={{ color: 'var(--color-gold)' }}>
                    {plannedCompositions.length} კარტი
                  </strong>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '0.88rem',
                    marginBottom: '0.35rem',
                  }}
                >
                  <span>სავარაუდო API ღირებულება (Estimate):</span>
                  <strong style={{ color: 'var(--color-gold)' }}>
                    ~${costEstimate.totalUsd.toFixed(2)} USD
                  </strong>
                </div>
                <div style={{ fontSize: '0.76rem', color: 'var(--color-stone)' }}>
                  * ეს არის წინასწარი სავარაუდო შეფასება ({costEstimate.modelNameKa}) და არა ფაქტობრივი ჩამოჭრა.
                </div>
              </div>

              <button
                className="btn btn-primary"
                style={{ width: '100%' }}
                onClick={() => setShowCostConfirmModal(true)}
                disabled={activeJob?.status === 'running' || activeJob?.status === 'queued'}
              >
                <Sparkles size={18} />
                <span>
                  სრული დასტის გენერირება ({plannedCompositions.length} კარტი)
                </span>
              </button>
            </div>

            {/* Right Queue Progress & Responsive Deck Gallery */}
            <div className="luxury-panel" style={{ padding: '1.75rem' }}>
              {activeJob ? (
                <div>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '1rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div>
                      <span className="badge badge-gold" style={{ marginBottom: '0.4rem' }}>
                        დავალების კოდი: {activeJob.id}
                      </span>
                      <h3 style={{ fontSize: '1.3rem' }}>
                        {deckProjectName} — გენერირების პროგრესი
                      </h3>
                    </div>

                    {/* Queue Control Buttons: Pause, Cancel, Retry/Resume */}
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                      {(activeJob.status === 'running' || activeJob.status === 'queued') && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handlePauseOrCancelJob('pause')}
                          >
                            <Pause size={15} />
                            <span>დაპაუზება</span>
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handlePauseOrCancelJob('cancel')}
                          >
                            <XCircle size={15} />
                            <span>გაუქმება</span>
                          </button>
                        </>
                      )}

                      {(activeJob.status === 'paused' ||
                        activeJob.status === 'failed' ||
                        activeJob.status === 'cancelled') && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={handleRetryOrResumeJob}
                        >
                          <Play size={15} />
                          <span>გაგრძელება / ხარვეზების გამეორება</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Queue Telemetry Counters */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))',
                      gap: '0.85rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(15,13,14,0.75)',
                        borderRadius: 'var(--radius-sm)',
                        border: 'var(--border-gold-thin)',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-stone)' }}>
                        სულ კარტი
                      </div>
                      <div style={{ fontSize: '1.35rem', fontWeight: 700 }}>
                        {activeJob.totalCards}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(15,13,14,0.75)',
                        borderRadius: 'var(--radius-sm)',
                        border: 'var(--border-gold-thin)',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-stone)' }}>
                        დასრულებული
                      </div>
                      <div
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 700,
                          color: '#8CD9A3',
                        }}
                      >
                        {activeJob.completedCards}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(15,13,14,0.75)',
                        borderRadius: 'var(--radius-sm)',
                        border: 'var(--border-gold-thin)',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-stone)' }}>
                        გენერირდება ახლა
                      </div>
                      <div
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 700,
                          color: 'var(--color-gold)',
                        }}
                      >
                        {activeJob.generatingCards}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '0.85rem',
                        background: 'rgba(15,13,14,0.75)',
                        borderRadius: 'var(--radius-sm)',
                        border: 'var(--border-gold-thin)',
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', color: 'var(--color-stone)' }}>
                        წარუმატებელი
                      </div>
                      <div
                        style={{
                          fontSize: '1.35rem',
                          fontWeight: 700,
                          color: activeJob.failedCards > 0 ? '#F29B9B' : 'var(--color-stone)',
                        }}
                      >
                        {activeJob.failedCards}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar & Estimated Time */}
                  <div style={{ marginBottom: '1.5rem' }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.86rem',
                        marginBottom: '0.45rem',
                      }}
                    >
                      <span>{activeJob.currentCardLabel || 'მიმდინარეობს დამუშავება...'}</span>
                      <span>
                        {Math.round(
                          (activeJob.completedCards / Math.max(1, activeJob.totalCards)) * 100
                        )}
                        %
                        {activeJob.estimatedRemainingSeconds
                          ? ` • დარჩენილია ~${activeJob.estimatedRemainingSeconds} წმ`
                          : ''}
                      </span>
                    </div>
                    <div className="progress-track">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(
                            100,
                            Math.round(
                              (activeJob.completedCards / Math.max(1, activeJob.totalCards)) *
                                100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* Shared Style Specification Accordion / Info */}
                  <div
                    style={{
                      padding: '0.9rem 1.1rem',
                      background: 'rgba(198, 161, 91, 0.08)',
                      border: 'var(--border-gold-thin)',
                      borderRadius: 'var(--radius-sm)',
                      marginBottom: '1.5rem',
                      fontSize: '0.83rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--color-gold)', marginBottom: '0.25rem' }}>
                      დასტის ერთიანი სტილის სპეციფიკაცია (Shared Style Spec):
                    </div>
                    <div style={{ color: 'var(--color-ivory-muted)' }}>
                      {activeJob.sharedStyleSpec.artDirection} • ორნამენტი:{' '}
                      {activeJob.sharedStyleSpec.ornamentStyle}
                    </div>
                  </div>

                  {/* Responsive Gallery of All Cards in the Deck */}
                  <div className="cards-grid">
                    {deckCards.map((card) => (
                      <div
                        key={card.id}
                        className="luxury-panel"
                        style={{
                          padding: '1rem',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                        }}
                      >
                        {card.generationStatus === 'completed' ? (
                          <CardRenderer
                            id={`deck-card-${card.id}`}
                            rank={card.rank}
                            suit={card.suit}
                            illustrationUrl={card.illustrationUrl}
                            designSpec={card.designSpec}
                            titleKa={card.titleKa}
                            scale={0.66}
                          />
                        ) : (
                          <div
                            className={card.generationStatus === 'generating' ? 'skeleton' : ''}
                            style={{
                              width: '198px',
                              height: '277px',
                              border: 'var(--border-gold-thin)',
                              borderRadius: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '1rem',
                              textAlign: 'center',
                            }}
                          >
                            <Clock size={24} color="var(--color-gold)" />
                            <div style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>
                              {card.titleKa}
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--color-stone)' }}>
                              {card.generationStatus === 'generating'
                                ? 'იქმნება ილუსტრაცია...'
                                : card.generationStatus === 'failed'
                                ? 'შეცდომა'
                                : 'რიგშია'}
                            </div>
                          </div>
                        )}

                        <div style={{ marginTop: '0.75rem', width: '100%', textAlign: 'center' }}>
                          <div
                            style={{
                              fontSize: '0.86rem',
                              fontWeight: 600,
                              marginBottom: '0.5rem',
                            }}
                          >
                            {card.titleKa}
                          </div>

                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleRegenerateDeckCard(card)}
                              disabled={regeneratingCardId === card.id}
                              title="ამ კარტის ხელახლა გენერირება"
                            >
                              <RefreshCw size={13} />
                              <span>განახლება</span>
                            </button>

                            {card.generationStatus === 'completed' && (
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => {
                                  onSelectCardForEdit(card);
                                  navigate('/editor');
                                }}
                              >
                                <Sliders size={13} />
                                <span>რედაქტირება</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Layers
                    size={44}
                    color="var(--color-gold)"
                    style={{ marginBottom: '1rem' }}
                  />
                  <h3 style={{ fontSize: '1.35rem', marginBottom: '0.6rem' }}>
                    სრული ქართული დასტის გენერატორი
                  </h3>
                  <p
                    style={{
                      color: 'var(--color-stone)',
                      maxWidth: '520px',
                      margin: '0 auto 1.5rem',
                      fontSize: '0.92rem',
                    }}
                  >
                    აირჩიეთ 36-კარტიანი, 52-კარტიანი ან ინდივიდუალური დასტა. სისტემა
                    ჯერ შექმნის დასტის ერთიან სტილის სპეციფიკაციას (Shared Style Specification),
                    შემდეგ კი რიგის (Queue) მეშვეობით სათითაოდ დააგენერირებს ყველა კარტს.
                  </p>
                  <GeorgianOrnamentDivider />
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.6rem',
                      padding: '0.75rem 1.25rem',
                      background: 'rgba(198,161,91,0.08)',
                      borderRadius: 'var(--radius-sm)',
                      border: 'var(--border-gold-thin)',
                      fontSize: '0.86rem',
                    }}
                  >
                    <Info size={16} color="var(--color-gold)" />
                    <span>
                      არჩეული კონფიგურაცია: <strong>{plannedCompositions.length} უნიკალური კარტი</strong>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Cost & Confirmation Modal before generating dozens of cards */}
          {showCostConfirmModal && (
            <div className="modal-backdrop" role="dialog" aria-modal="true">
              <div className="modal-content">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    marginBottom: '1rem',
                  }}
                >
                  <AlertTriangle size={24} color="var(--color-gold)" />
                  <h3 style={{ fontSize: '1.25rem' }}>
                    სრული დასტის გენერირების დადასტურება
                  </h3>
                </div>

                <p style={{ color: 'var(--color-ivory-muted)', fontSize: '0.92rem', marginBottom: '1.25rem' }}>
                  თქვენ იწყებთ სრული დასტის (<strong>{plannedCompositions.length} კარტი</strong>)
                  ავტომატურ გენერირებას. თითოეული კარტი იქმნება დამოუკიდებელი მაღალი
                  გარჩევადობის ილუსტრაციითა და ერთიანი სტილის სპეციფიკაციით.
                </p>

                <div
                  style={{
                    padding: '1rem',
                    background: 'rgba(15,13,14,0.85)',
                    border: 'var(--border-gold-thin)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.25rem',
                    fontSize: '0.88rem',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span>დასტის მოცულობა:</span>
                    <strong>{plannedCompositions.length} კარტი</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span>Gemini მოდელი:</span>
                    <strong>{costEstimate.modelNameKa}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span>სავარაუდო ღირებულება 1 კარტზე:</span>
                    <strong>~${costEstimate.perCardUsd} USD</strong>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: '0.5rem',
                      borderTop: 'var(--border-gold-thin)',
                      color: 'var(--color-gold)',
                      fontSize: '0.98rem',
                    }}
                  >
                    <span>ჯამური სავარაუდო ღირებულება (Estimate):</span>
                    <strong>~${costEstimate.totalUsd.toFixed(2)} USD</strong>
                  </div>
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--color-stone)', marginBottom: '1.5rem' }}>
                  შენიშვნა: ნაჩვენები თანხა წარმოადგენს წინასწარ სავარაუდო გაანგარიშებას (Estimate)
                  და არა ფაქტობრივ საბანკო ჩამოჭრას. პროცესის დაპაუზება ან გაუქმება ნებისმიერ
                  დროს შეგიძლიათ.
                </p>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowCostConfirmModal(false)}
                  >
                    უკან დაბრუნება
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleConfirmAndStartDeck}
                  >
                    <CheckCircle2 size={17} />
                    <span>ვადასტურებ — გენერირების დაწყება</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
