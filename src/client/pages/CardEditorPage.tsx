import React, { useEffect, useRef, useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RefreshCw,
  Save,
  Download,
  History,
  Eye,
  Sliders,
  Check,
  Upload,
} from 'lucide-react';
import { CardRenderer } from '../components/CardRenderer';
import {
  ALLOWED_UPLOAD_MIME_TYPES,
  AllowedUploadMimeType,
  CardDesignSpec,
  COLOR_PALETTES,
  DEFAULT_CARD_DESIGN_SPEC,
  ORNAMENT_MOTIFS,
  PlayingCard,
  RANK_METADATA,
  SUIT_METADATA,
  SUIT_TYPES,
} from '../../shared/types';
import {
  buildGeorgianPhotoCompositeSvgDataUri,
  INITIAL_DEMO_CARDS,
} from '../../shared/demoData';
import { apiClient } from '../services/apiClient';
import {
  downloadPngFromSvgElement,
  downloadSvgElement,
} from '../utils/cardExportUtils';

export const CardEditorPage: React.FC<{
  cards: PlayingCard[];
  selectedCard: PlayingCard | null;
  onSelectCard: (card: PlayingCard) => void;
  onCardUpdated: (card: PlayingCard) => void;
  notify: (text: string, type?: 'info' | 'success' | 'error') => void;
}> = ({ cards, selectedCard, onSelectCard, onCardUpdated, notify }) => {
  const availableCards = cards.length > 0 ? cards : INITIAL_DEMO_CARDS;
  const activeCard = selectedCard || availableCards[0];

  const [spec, setSpec] = useState<CardDesignSpec>(
    activeCard?.designSpec || DEFAULT_CARD_DESIGN_SPEC
  );
  const [titleKa, setTitleKa] = useState<string>(activeCard?.titleKa || '');
  const [subjectDescription, setSubjectDescription] = useState<string>(
    activeCard?.subjectDescription || ''
  );
  const [zoom, setZoom] = useState<number>(1.15);
  const [previewBg, setPreviewBg] = useState<'charcoal' | 'velvet' | 'ivory'>('charcoal');
  const [showBackSide, setShowBackSide] = useState<boolean>(false);
  const [showPrintGuides, setShowPrintGuides] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRegenerating, setIsRegenerating] = useState<boolean>(false);

  const svgRef = useRef<SVGSVGElement | null>(null);
  const editorPhotoInputRef = useRef<HTMLInputElement | null>(null);

  const handleEditorPhotoUpload = (file?: File | null) => {
    if (!file) return;
    if (
      !ALLOWED_UPLOAD_MIME_TYPES.includes(file.type as AllowedUploadMimeType)
    ) {
      notify('მხარდაჭერილია მხოლოდ PNG, JPG და WEBP ფორმატები.', 'error');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      notify('ფოტოს ზომა არ უნდა აღემატებოდეს 8 MB-ს.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const resultStr = String(reader.result || '');
      const base64Clean = resultStr.replace(
        /^data:image\/[a-zA-Z0-9+.-]+;base64,/,
        ''
      );
      const compositeUri = buildGeorgianPhotoCompositeSvgDataUri({
        base64Data: base64Clean,
        mimeType: file.type,
        rank: activeCard.rank,
        suit: activeCard.suit,
        primaryColor: spec.primaryColor,
        secondaryColor: spec.secondaryColor,
        accentColor: spec.accentColor,
        stylizeFilter: true,
      });

      try {
        const updated = await apiClient.updateCard(activeCard.id, {
          illustrationUrl: compositeUri,
          designSpec: spec,
        });
        onCardUpdated(updated);
        notify('ატვირთული ფოტო ჩასმულია კარტის დიზაინში!', 'success');
      } catch {
        notify('ფოტოს განახლება ვერ მოხერხდა.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (activeCard) {
      setSpec({ ...DEFAULT_CARD_DESIGN_SPEC, ...activeCard.designSpec });
      setTitleKa(activeCard.titleKa);
      setSubjectDescription(activeCard.subjectDescription);
    }
  }, [activeCard]);

  if (!activeCard) {
    return null;
  }

  const updateSpecField = <K extends keyof CardDesignSpec>(
    key: K,
    val: CardDesignSpec[K]
  ) => {
    setSpec((prev) => ({ ...prev, [key]: val }));
  };

  const handleApplyPalette = (paletteId: string) => {
    const p = COLOR_PALETTES.find((item) => item.id === paletteId);
    if (!p) return;
    setSpec((prev) => ({
      ...prev,
      paletteId: p.id,
      primaryColor: p.primary,
      secondaryColor: p.secondary,
      accentColor: p.accent,
      surfaceColor: p.surface,
    }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      const updated = await apiClient.updateCard(activeCard.id, {
        titleKa,
        subjectDescription,
        designSpec: spec,
      });
      onCardUpdated(updated);
      notify('კარტის SVG განლაგება და პარამეტრები შენახულია.', 'success');
    } catch {
      notify('ცვლილებების შენახვა ვერ მოხერხდა.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRegenerateArtwork = async () => {
    setIsRegenerating(true);
    try {
      const { card: updated } = await apiClient.regenerateCard(activeCard.id, {
        subjectDescription,
        paletteId: spec.paletteId,
        ornamentMotif: spec.ornamentMotif,
        noteKa: 'რედაქტორიდან განახლებული ილუსტრაცია',
      });
      onCardUpdated(updated);
      notify('ილუსტრაცია ხელახლა დაგენერირდა და დაემატა ვერსიების ისტორიაში.', 'success');
    } catch {
      notify('ხელახალი გენერირება ვერ მოხერხდა.', 'error');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleRestoreVersion = async (verIdx: number) => {
    const targetVer = activeCard.versionHistory[verIdx];
    if (!targetVer) return;
    try {
      const updated = await apiClient.updateCard(activeCard.id, {
        illustrationUrl: targetVer.illustrationUrl,
        designSpec: targetVer.designSpec,
      });
      onCardUpdated(updated);
      notify('არჩეული ვერსია აღდგენილია.', 'info');
    } catch {
      notify('ვერსიის აღდგენა ვერ მოხერხდა.', 'error');
    }
  };

  const bgStyles = {
    charcoal:
      'radial-gradient(circle at 50% 50%, #241C1E 0%, #121011 100%)',
    velvet:
      'radial-gradient(circle at 50% 50%, #4E1F28 0%, #1F0D12 100%)',
    ivory:
      'radial-gradient(circle at 50% 50%, #F4EBDD 0%, #DFD1BE 100%)',
  };

  return (
    <div className="container" style={{ paddingTop: '2.25rem' }}>
      {/* Header & Card Selector */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '2rem', marginBottom: '0.3rem' }}>
            კარტის რედაქტორი
          </h1>
          <p style={{ color: 'var(--color-stone)', fontSize: '0.9rem' }}>
            შეცვალეთ კარტის ტიპოგრაფია, ჩარჩოს სისქე, კუთხის ორნამენტები და ინდექსის პოზიცია
            ილუსტრაციის ხელახალი გენერაციის გარეშე
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <label
            htmlFor="editor-card-picker"
            style={{ fontSize: '0.86rem', color: 'var(--color-stone)' }}
          >
            აირჩიეთ კარტი:
          </label>
          <select
            id="editor-card-picker"
            className="form-select"
            style={{ width: '270px' }}
            value={activeCard.id}
            onChange={(e) => {
              const found = availableCards.find((c) => c.id === e.target.value);
              if (found) onSelectCard(found);
            }}
          >
            {availableCards.map((c) => (
              <option key={c.id} value={c.id}>
                {c.titleKa} ({c.rank})
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="workspace-grid">
        {/* Left Controls Sidebar: Deterministic SVG & CSS Layout Controls */}
        <div className="luxury-panel" style={{ padding: '1.5rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginBottom: '1.1rem',
            }}
          >
            <Sliders size={18} color="var(--color-gold)" />
            <h3 style={{ fontSize: '1.1rem' }}>SVG განლაგებისა და ჩარჩოს მართვა</h3>
          </div>

          {/* Card Title Banner */}
          <div className="form-group">
            <label className="form-label">კარტის წარწერა (ქვედა ლენტზე)</label>
            <input
              type="text"
              className="form-input"
              value={titleKa}
              onChange={(e) => setTitleKa(e.target.value)}
            />
          </div>

          {/* Color Palette Preset */}
          <div className="form-group">
            <label className="form-label">ფერთა სისტემა</label>
            <select
              className="form-select"
              value={spec.paletteId}
              onChange={(e) => handleApplyPalette(e.target.value)}
            >
              {COLOR_PALETTES.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameKa}
                </option>
              ))}
            </select>
          </div>

          {/* Typography & Rank Positioning */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">რანგის პოზიცია</label>
              <select
                className="form-select"
                value={spec.rankPosition}
                onChange={(e) => updateSpecField('rankPosition', e.target.value as any)}
              >
                <option value="standard">სტანდარტული კუთხე</option>
                <option value="inset">შიდა ჩაწეული</option>
                <option value="ornate-medallion">ოქროს მედალიონში</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">კარტის შრიფტი</label>
              <select
                className="form-select"
                value={spec.rankFontFamily}
                onChange={(e) => updateSpecField('rankFontFamily', e.target.value as any)}
              >
                <option value="serif">ქართული სერიფული</option>
                <option value="display">სამეფო მონუმენტური</option>
                <option value="sans">თანამედროვე გეომეტრიული</option>
              </select>
            </div>
          </div>

          {/* Illustration Frame Shape & Ornament Motif */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">ილუსტრაციის ჩარჩო</label>
              <select
                className="form-select"
                value={spec.illustrationFrameStyle}
                onChange={(e) =>
                  updateSpecField('illustrationFrameStyle', e.target.value as any)
                }
              >
                <option value="arch">ქართული თაღი</option>
                <option value="octagonal">რვაკუთხა გუმბათი</option>
                <option value="medallion">ოვალური მედალიონი</option>
                <option value="full-bleed">სრული ველი</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">კუთხის ორნამენტი</label>
              <select
                className="form-select"
                value={spec.ornamentMotif}
                onChange={(e) => updateSpecField('ornamentMotif', e.target.value as any)}
              >
                {ORNAMENT_MOTIFS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nameKa}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sliders: Border Thickness, Corner Radius, Rank Scale, Illustration Scale */}
          <div className="form-group">
            <label className="form-label">
              <span>ოქროს ჩარჩოს სისქე</span>
              <span>{spec.borderThickness}px</span>
            </label>
            <input
              type="range"
              min={1}
              max={6}
              step={0.5}
              value={spec.borderThickness}
              onChange={(e) => updateSpecField('borderThickness', Number(e.target.value))}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <span>კუთხის მომრგვალება</span>
              <span>{spec.cornerRadius}px</span>
            </label>
            <input
              type="range"
              min={4}
              max={26}
              step={1}
              value={spec.cornerRadius}
              onChange={(e) => updateSpecField('cornerRadius', Number(e.target.value))}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div className="form-group">
              <label className="form-label">
                <span>ინდექსის ზომა</span>
                <span>{Math.round(spec.rankScale * 100)}%</span>
              </label>
              <input
                type="range"
                min={0.8}
                max={1.3}
                step={0.05}
                value={spec.rankScale}
                onChange={(e) => updateSpecField('rankScale', Number(e.target.value))}
              />
            </div>

            <div className="form-group">
              <label className="form-label">
                <span>ილუსტრაციის მასშტაბი</span>
                <span>{Math.round(spec.illustrationScale * 100)}%</span>
              </label>
              <input
                type="range"
                min={0.8}
                max={1.25}
                step={0.05}
                value={spec.illustrationScale}
                onChange={(e) =>
                  updateSpecField('illustrationScale', Number(e.target.value))
                }
              />
            </div>
          </div>

          {/* Ornament Visibility Toggles */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              padding: '0.85rem',
              background: 'rgba(15,13,14,0.75)',
              borderRadius: 'var(--radius-sm)',
              border: 'var(--border-gold-thin)',
              marginBottom: '1.15rem',
              fontSize: '0.85rem',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={spec.showCornerOrnaments}
                onChange={(e) =>
                  updateSpecField('showCornerOrnaments', e.target.checked)
                }
              />
              <span>კუთხის ქართული ჩუქურთმების ჩვენება</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={spec.showInnerFrame}
                onChange={(e) => updateSpecField('showInnerFrame', e.target.checked)}
              />
              <span>შიდა ორმაგი კანტის ჩვენება</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={spec.useGeorgianRankSubscript}
                onChange={(e) =>
                  updateSpecField('useGeorgianRankSubscript', e.target.checked)
                }
              />
              <span>ქართული ასო-ნიშნის ჩვენება რანგის ქვეშ ({RANK_METADATA[activeCard.rank]?.shortKa})</span>
            </label>
          </div>

          {/* Save & Regenerate Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            <input
              ref={editorPhotoInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => handleEditorPhotoUpload(e.target.files?.[0])}
            />

            <button
              type="button"
              className="btn btn-gold"
              onClick={() => editorPhotoInputRef.current?.click()}
            >
              <Upload size={17} />
              <span>საკუთარი ფოტოს ატვირთვა კარტში</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={handleSaveChanges}
              disabled={isSaving}
            >
              <Save size={17} />
              <span>{isSaving ? 'ინახება...' : 'ცვლილებების შენახვა'}</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={handleRegenerateArtwork}
              disabled={isRegenerating}
            >
              <RefreshCw size={17} />
              <span>
                {isRegenerating
                  ? 'მიმდინარეობს გენერირება...'
                  : 'ილუსტრაციის ხელახლა გენერირება'}
              </span>
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
              <button
                className="btn btn-gold btn-sm"
                onClick={() =>
                  downloadPngFromSvgElement(
                    svgRef.current,
                    `kartuli-card-${activeCard.id}.png`
                  )
                }
              >
                <Download size={15} />
                <span>PNG ექსპორტი</span>
              </button>

              <button
                className="btn btn-secondary btn-sm"
                onClick={() =>
                  downloadSvgElement(
                    svgRef.current,
                    `kartuli-card-${activeCard.id}.svg`
                  )
                }
              >
                <Download size={15} />
                <span>SVG ექსპორტი</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Interactive Canvas Preview & Version History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            className="luxury-panel"
            style={{
              padding: '1.5rem',
              background: bgStyles[previewBg],
              minHeight: '580px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            {/* Top Toolbar: Zoom Controls, Background Preview, Card-Back Toggle, Print Guides */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                flexWrap: 'wrap',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.6rem 0.9rem',
                background: 'rgba(15, 13, 14, 0.85)',
                borderRadius: 'var(--radius-sm)',
                border: 'var(--border-gold-thin)',
              }}
            >
              {/* Zoom Controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setZoom((z) => Math.max(0.7, Number((z - 0.1).toFixed(2))))}
                  title="დაპატარავება"
                >
                  <ZoomOut size={15} />
                </button>
                <span style={{ fontSize: '0.84rem', minWidth: '48px', textAlign: 'center' }}>
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setZoom((z) => Math.min(1.45, Number((z + 0.1).toFixed(2))))}
                  title="გადიდება"
                >
                  <ZoomIn size={15} />
                </button>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setZoom(1.15)}
                  title="საწყისი მასშტაბი"
                >
                  <RotateCcw size={14} />
                </button>
              </div>

              {/* Background Surface Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--color-stone)' }}>ფონი:</span>
                {(['charcoal', 'velvet', 'ivory'] as const).map((bg) => (
                  <button
                    key={bg}
                    className={`btn btn-sm ${
                      previewBg === bg ? 'btn-primary' : 'btn-secondary'
                    }`}
                    onClick={() => setPreviewBg(bg)}
                  >
                    {bg === 'charcoal' ? 'ნახშირი' : bg === 'velvet' ? 'ხავერდი' : 'სპილოსძვალი'}
                  </button>
                ))}
              </div>

              {/* Backside & Bleed Guides */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <button
                  className={`btn btn-sm ${showBackSide ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowBackSide((b) => !b)}
                >
                  <Eye size={14} />
                  <span>{showBackSide ? 'წინა მხარე' : 'უკანა მხარე'}</span>
                </button>

                <button
                  className={`btn btn-sm ${showPrintGuides ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setShowPrintGuides((g) => !g)}
                  title="საბეჭდი საზღვრების (Bleed / Safe Margin) ჩვენება"
                >
                  <span>Bleed ხაზები</span>
                </button>
              </div>
            </div>

            {/* Center Card Preview */}
            <div style={{ padding: '2rem 0' }}>
              <CardRenderer
                id={`editor-${activeCard.id}`}
                svgRef={svgRef}
                rank={activeCard.rank}
                suit={activeCard.suit}
                illustrationUrl={activeCard.illustrationUrl}
                designSpec={spec}
                titleKa={titleKa}
                isCardBack={showBackSide}
                showPrintGuides={showPrintGuides}
                scale={zoom}
              />
            </div>

            {/* Bottom Metadata Bar */}
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.5rem',
                fontSize: '0.8rem',
                color: previewBg === 'ivory' ? '#151515' : 'var(--color-stone)',
              }}
            >
              <span>
                ზომა: {spec.cardWidthMm}×{spec.cardHeightMm} მმ • მასტი:{' '}
                {SUIT_METADATA[activeCard.suit]?.nameKa}
              </span>
              <span>
                სტატუსი: {activeCard.isDemo ? 'სადემონსტრაციო ნიმუში' : 'AI გენერირებული'}
              </span>
            </div>
          </div>

          {/* Version History Panel */}
          <div className="luxury-panel" style={{ padding: '1.35rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                marginBottom: '0.85rem',
              }}
            >
              <History size={18} color="var(--color-gold)" />
              <h4 style={{ fontSize: '1rem' }}>
                ვერსიების ისტორია ({activeCard.versionHistory?.length || 1})
              </h4>
            </div>

            {activeCard.versionHistory && activeCard.versionHistory.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                  gap: '0.75rem',
                }}
              >
                {activeCard.versionHistory.map((ver, idx) => (
                  <div
                    key={ver.versionId}
                    style={{
                      padding: '0.75rem',
                      background: 'rgba(15,13,14,0.8)',
                      border: 'var(--border-gold-thin)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '0.5rem',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-gold)' }}>
                        ვერსია #{activeCard.versionHistory.length - idx}
                      </div>
                      <div style={{ fontSize: '0.76rem', color: 'var(--color-stone)' }}>
                        {ver.noteKa || 'შენახული ვერსია'}
                      </div>
                    </div>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleRestoreVersion(idx)}
                    >
                      <Check size={13} />
                      <span>ამ ვერსიის აღდგენა</span>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '0.85rem', color: 'var(--color-stone)' }}>
                ამ კარტს აქვს მიმდინარე აქტიური ვერსია. ხელახალი გენერირებისას ყველა წინა
                ვერსია ავტომატურად შეინახება აქ.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
