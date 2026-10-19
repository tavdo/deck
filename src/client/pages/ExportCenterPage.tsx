import React, { useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Download,
  Printer,
  FileText,
  Image as ImageIcon,
  Code,
  CheckCircle2,
  AlertTriangle,
  Scissors,
  Layers,
} from 'lucide-react';
import { CardRenderer } from '../components/CardRenderer';
import { GeorgianCardBackArtwork } from '../components/GeorgianOrnaments';
import { PlayingCard, Project } from '../../shared/types';
import { INITIAL_DEMO_CARDS } from '../../shared/demoData';
import { apiClient } from '../services/apiClient';
import {
  downloadPngFromSvgElement,
  downloadSvgElement,
} from '../utils/cardExportUtils';

export const ExportCenterPage: React.FC<{
  projects: Project[];
  cards: PlayingCard[];
  notify: (text: string, type?: 'info' | 'success' | 'error') => void;
}> = ({ projects, cards, notify }) => {
  const [searchParams] = useSearchParams();
  const initialProjId = searchParams.get('projectId') || projects[0]?.id || '';

  const [selectedProjectId, setSelectedProjectId] = useState<string>(initialProjId);
  const projectCards = cards.filter((c) => c.projectId === selectedProjectId);
  const availableCards = projectCards.length > 0 ? projectCards : INITIAL_DEMO_CARDS;

  const [selectedCardId, setSelectedCardId] = useState<string>(
    availableCards[0]?.id || ''
  );
  const activeCard =
    availableCards.find((c) => c.id === selectedCardId) || availableCards[0];

  // Print & PDF Configuration State
  const [layoutMode, setLayoutMode] = useState<'print-sheet' | 'one-per-page'>(
    'print-sheet'
  );
  const [pageSize, setPageSize] = useState<'A4' | 'LETTER' | 'SRA3'>('A4');
  const [cardWidthMm, setCardWidthMm] = useState<number>(63);
  const [cardHeightMm, setCardHeightMm] = useState<number>(88);
  const [bleedMm, setBleedMm] = useState<number>(3);
  const [safeMarginMm, setSafeMarginMm] = useState<number>(5);
  const [includeCropMarks, setIncludeCropMarks] = useState<boolean>(true);
  const [includeCardBack, setIncludeCardBack] = useState<boolean>(true);
  const [pngScaleDpi, setPngScaleDpi] = useState<'300' | '600'>('300');

  const singleSvgRef = useRef<SVGSVGElement | null>(null);
  const backSvgContainerRef = useRef<HTMLDivElement | null>(null);

  // Print-Ready Validation Checks
  const isBleedValid = bleedMm >= 2 && bleedMm <= 6;
  const isSafeMarginValid = safeMarginMm >= 3 && safeMarginMm <= 10;
  const isDimensionsValid =
    cardWidthMm >= 50 &&
    cardWidthMm <= 90 &&
    cardHeightMm >= 75 &&
    cardHeightMm <= 130;
  const isPrintValidated =
    isBleedValid && isSafeMarginValid && isDimensionsValid && includeCropMarks;

  const handleExportSinglePng = async () => {
    if (!activeCard || !singleSvgRef.current) return;
    const widthPx =
      pngScaleDpi === '600'
        ? Math.round((cardWidthMm / 25.4) * 600)
        : Math.round((cardWidthMm / 25.4) * 300);
    const heightPx =
      pngScaleDpi === '600'
        ? Math.round((cardHeightMm / 25.4) * 600)
        : Math.round((cardHeightMm / 25.4) * 300);

    try {
      await downloadPngFromSvgElement(
        singleSvgRef.current,
        `kartuli-card-${activeCard.suit}-${activeCard.rank}-${pngScaleDpi}dpi.png`,
        widthPx,
        heightPx
      );
      notify(
        `PNG ექსპორტი შესრულდა (${widthPx}×${heightPx}px @ ${pngScaleDpi} DPI)`,
        'success'
      );
    } catch {
      notify('PNG ექსპორტის შეცდომა.', 'error');
    }
  };

  const handleExportSingleSvg = () => {
    if (!activeCard || !singleSvgRef.current) return;
    downloadSvgElement(
      singleSvgRef.current,
      `kartuli-card-${activeCard.suit}-${activeCard.rank}.svg`
    );
    notify('ვექტორული SVG ფაილი ჩამოტვირთულია.', 'success');
  };

  const handleExportCardBackSvg = () => {
    if (!backSvgContainerRef.current) return;
    const svgEl = backSvgContainerRef.current.querySelector('svg');
    if (svgEl) {
      downloadSvgElement(svgEl, `kartuli-deck-card-back.svg`);
      notify('ბანქოს ზურგის (უკანა მხარის) SVG ფაილი ჩამოტვირთულია.', 'success');
    }
  };

  const handleDownloadDeckPdf = () => {
    const targetProjId = selectedProjectId || projects[0]?.id || 'demo-proj-royal-bagrationi';
    const pdfUrl = apiClient.getPdfExportUrl(targetProjId, {
      layout: layoutMode,
      pageSize,
      cardWidthMm,
      cardHeightMm,
      bleedMm,
      safeMarginMm,
      cropMarks: includeCropMarks,
      cardBack: includeCardBack,
    });
    window.open(pdfUrl, '_blank');
    notify(
      'მრავალგვერდიანი PDF დასტის გენერირება და ჩამოტვირთვა დაიწყო.',
      'success'
    );
  };

  return (
    <div className="container" style={{ paddingTop: '2.25rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '0.35rem' }}>
          ექსპორტისა და ბეჭდვის ცენტრი
        </h1>
        <p style={{ color: 'var(--color-stone)', fontSize: '0.92rem' }}>
          ჩამოტვირთეთ ინდივიდუალური კარტები PNG/SVG ფორმატში ან მოამზადეთ სრული დასტის
          სტამბური PDF ფურცლები ზუსტი ზომებით, Bleed-ითა და Crop Marks ნიშნებით
        </p>
      </div>

      <div className="workspace-grid">
        {/* Left Configuration Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 1. Complete Deck PDF Print-Ready Configuration */}
          <div className="luxury-panel" style={{ padding: '1.6rem' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
                marginBottom: '1rem',
              }}
            >
              <Printer size={19} color="var(--color-gold)" />
              <h3 style={{ fontSize: '1.15rem' }}>
                სრული დასტის PDF და სტამბური განლაგება
              </h3>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="export-project-select">
                აირჩიეთ პროექტი / დასტა
              </label>
              <select
                id="export-project-select"
                className="form-select"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.cardCount} კარტი)
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
              <div className="form-group">
                <label className="form-label">PDF განლაგების რეჟიმი</label>
                <select
                  className="form-select"
                  value={layoutMode}
                  onChange={(e) => setLayoutMode(e.target.value as any)}
                >
                  <option value="print-sheet">
                    საბეჭდი ფურცელი (რამდენიმე კარტი გვერდზე)
                  </option>
                  <option value="one-per-page">
                    1 კარტი თითო გვერდზე (ინდივიდუალური)
                  </option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">ფურცლის ფორმატი</label>
                <select
                  className="form-select"
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as any)}
                >
                  <option value="A4">A4 (210 × 297 მმ)</option>
                  <option value="SRA3">SRA3 სტამბური (320 × 450 მმ)</option>
                  <option value="LETTER">US Letter (215.9 × 279.4 მმ)</option>
                </select>
              </div>
            </div>

            {/* Physical Dimensions, Bleed, Safe Margins */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '0.65rem',
              }}
            >
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
                <label className="form-label">Bleed (მმ)</label>
                <input
                  type="number"
                  className="form-input"
                  min={0}
                  max={10}
                  step={0.5}
                  value={bleedMm}
                  onChange={(e) => setBleedMm(Number(e.target.value))}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Safe ზონა (მმ)</label>
                <input
                  type="number"
                  className="form-input"
                  min={2}
                  max={12}
                  step={0.5}
                  value={safeMarginMm}
                  onChange={(e) => setSafeMarginMm(Number(e.target.value))}
                />
              </div>
            </div>

            {/* Crop Marks & Card Back Checkboxes */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.55rem',
                padding: '0.85rem',
                background: 'rgba(15,13,14,0.8)',
                borderRadius: 'var(--radius-sm)',
                border: 'var(--border-gold-thin)',
                marginBottom: '1rem',
                fontSize: '0.86rem',
              }}
            >
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeCropMarks}
                  onChange={(e) => setIncludeCropMarks(e.target.checked)}
                />
                <Scissors size={15} color="var(--color-gold)" />
                <span>ჭრის ნიშნების (Crop Marks) დატანა კუთხეებში</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={includeCardBack}
                  onChange={(e) => setIncludeCardBack(e.target.checked)}
                />
                <Layers size={15} color="var(--color-gold)" />
                <span>ბანქოს ზურგის (უკანა მხარის) ფურცლების დამატება</span>
              </label>
            </div>

            {/* Print-Ready Validation Badge */}
            <div
              style={{
                padding: '0.8rem 1rem',
                background: isPrintValidated
                  ? 'rgba(78, 140, 98, 0.16)'
                  : 'rgba(198, 144, 58, 0.16)',
                border: `1px solid ${
                  isPrintValidated ? 'var(--color-success)' : 'var(--color-warning)'
                }`,
                borderRadius: 'var(--radius-sm)',
                marginBottom: '1.25rem',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
              }}
            >
              {isPrintValidated ? (
                <>
                  <CheckCircle2 size={18} color="#8CD9A3" />
                  <span>
                    <strong>სტამბური ვალიდაცია გავლილია:</strong> ზომა {cardWidthMm}×
                    {cardHeightMm} მმ, Bleed {bleedMm} მმ, უსაფრთხო ველი {safeMarginMm} მმ და
                    Crop Marks აქტიურია.
                  </span>
                </>
              ) : (
                <>
                  <AlertTriangle size={18} color="var(--color-gold)" />
                  <span>
                    სტამბური სტანდარტისთვის რეკომენდებულია მინიმუმ 2 მმ Bleed, 3 მმ Safe
                    Margin და ჩართული Crop Marks.
                  </span>
                </>
              )}
            </div>

            <button
              className="btn btn-primary"
              style={{ width: '100%' }}
              onClick={handleDownloadDeckPdf}
            >
              <FileText size={18} />
              <span>მრავალგვერდიანი PDF დასტის ჩამოტვირთვა</span>
            </button>
          </div>

          {/* 2. Single Card PNG & SVG Export Panel */}
          <div className="luxury-panel" style={{ padding: '1.6rem' }}>
            <h3 style={{ fontSize: '1.12rem', marginBottom: '1rem' }}>
              ინდივიდუალური კარტის ექსპორტი (PNG / SVG)
            </h3>

            <div className="form-group">
              <label className="form-label">აირჩიეთ კარტი</label>
              <select
                className="form-select"
                value={activeCard?.id || ''}
                onChange={(e) => setSelectedCardId(e.target.value)}
              >
                {availableCards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.titleKa} ({c.rank})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">PNG რეზოლუცია (DPI)</label>
              <select
                className="form-select"
                value={pngScaleDpi}
                onChange={(e) => setPngScaleDpi(e.target.value as any)}
              >
                <option value="300">300 DPI (სტანდარტული სტამბური — 744×1039 px)</option>
                <option value="600">600 DPI (ულტრა-მაღალი დეტალიზაცია — 1488×2078 px)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <button className="btn btn-gold" onClick={handleExportSinglePng}>
                <ImageIcon size={17} />
                <span>PNG ჩამოტვირთვა</span>
              </button>

              <button className="btn btn-secondary" onClick={handleExportSingleSvg}>
                <Code size={17} />
                <span>SVG ჩამოტვირთვა</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Print-Guide Preview & Card Back Artwork Export */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div
            className="luxury-panel"
            style={{
              padding: '2rem',
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-around',
              alignItems: 'center',
              gap: '2rem',
            }}
          >
            {/* Front Card with Bleed & Safe Margin Guides */}
            {activeCard && (
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    fontSize: '0.84rem',
                    color: 'var(--color-gold)',
                    fontWeight: 600,
                    marginBottom: '0.65rem',
                  }}
                >
                  წინა მხარე (Bleed და Safe ზონებით)
                </div>
                <CardRenderer
                  id={`export-front-${activeCard.id}`}
                  svgRef={singleSvgRef}
                  rank={activeCard.rank}
                  suit={activeCard.suit}
                  illustrationUrl={activeCard.illustrationUrl}
                  designSpec={{
                    ...activeCard.designSpec,
                    cardWidthMm,
                    cardHeightMm,
                  }}
                  titleKa={activeCard.titleKa}
                  showPrintGuides={true}
                  bleedMm={bleedMm}
                  safeMarginMm={safeMarginMm}
                  scale={0.88}
                />
              </div>
            )}

            {/* Symmetrical Card-Back Artwork */}
            <div style={{ textAlign: 'center' }}>
              <div
                style={{
                  fontSize: '0.84rem',
                  color: 'var(--color-gold)',
                  fontWeight: 600,
                  marginBottom: '0.65rem',
                }}
              >
                ბანქოს ზურგი (Card-Back Artwork)
              </div>
              <div
                ref={backSvgContainerRef}
                style={{
                  width: `${300 * 0.88}px`,
                  height: `${420 * 0.88}px`,
                  borderRadius: '14px',
                  overflow: 'hidden',
                  boxShadow: 'var(--shadow-card)',
                }}
              >
                <GeorgianCardBackArtwork
                  primaryColor={activeCard?.designSpec.secondaryColor || '#351A22'}
                  secondaryColor={activeCard?.designSpec.primaryColor || '#722F37'}
                  accentColor={activeCard?.designSpec.accentColor || '#C6A15B'}
                  motif={activeCard?.designSpec.ornamentMotif || 'vine'}
                />
              </div>
              <button
                className="btn btn-secondary btn-sm"
                style={{ marginTop: '0.85rem' }}
                onClick={handleExportCardBackSvg}
              >
                <Download size={14} />
                <span>ზურგის SVG ჩამოტვირთვა</span>
              </button>
            </div>
          </div>

          {/* Print Sheet Imposition Diagram Preview */}
          <div className="luxury-panel" style={{ padding: '1.5rem' }}>
            <h4 style={{ fontSize: '1rem', marginBottom: '0.5rem', color: 'var(--color-gold)' }}>
              საბეჭდი ფურცლის სქემა ({pageSize} — {layoutMode === 'print-sheet' ? 'მრავალკარტიანი განლაგება' : '1 კარტი გვერდზე'})
            </h4>
            <p style={{ fontSize: '0.84rem', color: 'var(--color-stone)', marginBottom: '1rem' }}>
              ცისფერი წყვეტილი ხაზი აღნიშნავს <strong>Bleed ({bleedMm} მმ)</strong> ზონას, ხოლო
              მწვანე წყვეტილი ხაზი — <strong>უსაფრთხო ველს ({safeMarginMm} მმ)</strong>, სადაც
              განთავსებულია ყველა რანგი და სიმბოლო.
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: '0.75rem',
                fontSize: '0.82rem',
              }}
            >
              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(15,13,14,0.75)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-gold-thin)',
                }}
              >
                <span style={{ color: 'var(--color-stone)' }}>საბოლოო ჭრის ზომა (Trim):</span>
                <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>
                  {cardWidthMm} × {cardHeightMm} მმ
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(15,13,14,0.75)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-gold-thin)',
                }}
              >
                <span style={{ color: 'var(--color-stone)' }}>სრული ზომა Bleed-ით:</span>
                <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>
                  {cardWidthMm + bleedMm * 2} × {cardHeightMm + bleedMm * 2} მმ
                </div>
              </div>

              <div
                style={{
                  padding: '0.75rem',
                  background: 'rgba(15,13,14,0.75)',
                  borderRadius: 'var(--radius-sm)',
                  border: 'var(--border-gold-thin)',
                }}
              >
                <span style={{ color: 'var(--color-stone)' }}>ფურცელზე კარტების რაოდენობა:</span>
                <div style={{ fontWeight: 700, marginTop: '0.2rem' }}>
                  {layoutMode === 'one-per-page'
                    ? '1 კარტი / გვერდზე'
                    : pageSize === 'SRA3'
                    ? '16 კარტი / ფურცელზე'
                    : '9 კარტი (3×3) / ფურცელზე'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
