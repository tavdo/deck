import React from 'react';
import {
  CardDesignSpec,
  CardRank,
  DEFAULT_CARD_DESIGN_SPEC,
  RANK_METADATA,
  SUIT_METADATA,
  SuitType,
} from '../../shared/types';
import {
  GeorgianCardBackArtwork,
  GeorgianCornerOrnament,
  GeorgianSuitSymbol,
} from './GeorgianOrnaments';

export interface CardRendererProps {
  id?: string;
  rank: CardRank;
  suit: SuitType;
  illustrationUrl?: string;
  designSpec?: Partial<CardDesignSpec>;
  titleKa?: string;
  isCardBack?: boolean;
  showPrintGuides?: boolean;
  bleedMm?: number;
  safeMarginMm?: number;
  scale?: number;
  className?: string;
  svgRef?: React.Ref<SVGSVGElement>;
}

/**
 * Deterministic SVG Playing Card Renderer (`CardRenderer`).
 * - Never relies on AI-generated text for card ranks, suit symbols, or borders.
 * - Renders exact card geometry, corner indices, Georgian subscripts, ornamental frames,
 *   suit pips, and embeds the AI-generated illustration cleanly inside a clipped sanctuary frame.
 * - Can be serialized directly to `.svg` or rasterized to high-DPI `.png` / `.pdf`.
 */
export const CardRenderer: React.FC<CardRendererProps> = ({
  id = 'card-preview',
  rank,
  suit,
  illustrationUrl,
  designSpec: customSpec,
  titleKa,
  isCardBack = false,
  showPrintGuides = false,
  bleedMm = 3,
  safeMarginMm = 5,
  scale = 1,
  className,
  svgRef,
}) => {
  const spec: CardDesignSpec = {
    ...DEFAULT_CARD_DESIGN_SPEC,
    ...customSpec,
  };

  const suitInfo = SUIT_METADATA[suit] || SUIT_METADATA.guli;
  const rankInfo = RANK_METADATA[rank] || RANK_METADATA.A;

  // Base coordinate system: 300 x 420 units (matches 63mm x 88mm standard poker ratio ~ 1:1.4)
  const baseWidth = 300;
  const baseHeight = 420;
  const clipId = `card-ill-clip-${id.replace(/[^a-zA-Z0-9_-]/g, '')}`;

  if (isCardBack) {
    return (
      <div
        className={className}
        style={{
          width: `${baseWidth * scale}px`,
          height: `${baseHeight * scale}px`,
          borderRadius: `${spec.cornerRadius * scale}px`,
          boxShadow: 'var(--shadow-card)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <GeorgianCardBackArtwork
          primaryColor={spec.secondaryColor}
          secondaryColor={spec.primaryColor}
          accentColor={spec.accentColor}
          motif={spec.ornamentMotif}
        />
      </div>
    );
  }

  const suitColor = suitInfo.isRed ? spec.primaryColor : '#151515';
  const fontFamilyMap = {
    serif: "'Noto Serif Georgian', Georgia, serif",
    display: "'Cinzel', 'Noto Serif Georgian', serif",
    sans: "'Noto Sans Georgian', sans-serif",
  };
  const selectedFont = fontFamilyMap[spec.rankFontFamily] || fontFamilyMap.serif;

  // Rank index offsets
  const indexX =
    spec.rankPosition === 'inset'
      ? 34
      : spec.rankPosition === 'ornate-medallion'
      ? 32
      : 26;
  const indexY =
    spec.rankPosition === 'inset'
      ? 46
      : spec.rankPosition === 'ornate-medallion'
      ? 44
      : 38;

  // Illustration frame path based on `spec.illustrationFrameStyle`
  const renderIllustrationClipPath = () => {
    switch (spec.illustrationFrameStyle) {
      case 'octagonal':
        return (
          <polygon points="76,50 224,50 252,78 252,342 224,370 76,370 48,342 48,78" />
        );
      case 'medallion':
        return <ellipse cx="150" cy="210" rx="100" ry="148" />;
      case 'full-bleed':
        return <rect x="18" y="18" width="264" height="384" rx="10" />;
      case 'arch':
      default:
        return (
          <path d="M48 76 Q48 50 74 50 H226 Q252 50 252 76 V344 Q252 370 226 370 H74 Q48 370 48 344 Z" />
        );
    }
  };

  return (
    <div
      className={className}
      style={{
        width: `${baseWidth * scale}px`,
        height: `${baseHeight * scale}px`,
        position: 'relative',
        userSelect: 'none',
        flexShrink: 0,
      }}
    >
      <svg
        ref={svgRef}
        viewBox={`0 0 ${baseWidth} ${baseHeight}`}
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          borderRadius: `${spec.cornerRadius * scale}px`,
          boxShadow: 'var(--shadow-card)',
          display: 'block',
        }}
      >
        <defs>
          <clipPath id={clipId}>{renderIllustrationClipPath()}</clipPath>
          <linearGradient id={`goldGrad-${clipId}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={spec.accentColor} />
            <stop offset="50%" stopColor="#E6C987" />
            <stop offset="100%" stopColor={spec.accentColor} />
          </linearGradient>
        </defs>

        {/* 1. Card Base Surface (Warm Ivory or Custom Surface) */}
        <rect
          x="0"
          y="0"
          width={baseWidth}
          height={baseHeight}
          rx={spec.cornerRadius}
          fill={spec.surfaceColor}
        />

        {/* Subtle Parchment Frame Border */}
        <rect
          x="6"
          y="6"
          width={baseWidth - 12}
          height={baseHeight - 12}
          rx={Math.max(4, spec.cornerRadius - 4)}
          fill="none"
          stroke={`url(#goldGrad-${clipId})`}
          strokeWidth={spec.borderThickness}
        />

        {/* 2. Optional Inner Architectural Frame */}
        {spec.showInnerFrame && (
          <rect
            x="13"
            y="13"
            width={baseWidth - 26}
            height={baseHeight - 26}
            rx={Math.max(2, spec.cornerRadius - 8)}
            fill="none"
            stroke={spec.primaryColor}
            strokeWidth="1"
            strokeOpacity="0.45"
          />
        )}

        {/* 3. Subtle Background Watermark in Center (only when no illustration covers it) */}
        {spec.showCenterWatermark && !illustrationUrl && (
          <g opacity="0.06" transform="translate(150, 210)">
            <circle cx="0" cy="0" r="110" fill="none" stroke={spec.primaryColor} strokeWidth="2" />
            <path d="M0 -110 L110 0 L0 110 L-110 0 Z" fill={spec.primaryColor} />
          </g>
        )}

        {/* 4. Central Clipped AI Illustration Layer */}
        <g clipPath={`url(#${clipId})`}>
          {/* Dark Velvet Sanctuary Backing behind illustration */}
          <rect x="0" y="0" width="300" height="420" fill={spec.secondaryColor} />
          {illustrationUrl ? (
            <image
              href={illustrationUrl}
              x={150 - 150 * spec.illustrationScale}
              y={210 - 210 * spec.illustrationScale}
              width={300 * spec.illustrationScale}
              height={420 * spec.illustrationScale}
              preserveAspectRatio="xMidYMid slice"
            />
          ) : (
            <g transform="translate(150, 210)">
              <circle cx="0" cy="0" r="54" fill={spec.primaryColor} stroke={spec.accentColor} strokeWidth="2" />
              <text
                x="0"
                y="6"
                textAnchor="middle"
                fill={spec.surfaceColor}
                fontSize="14"
                fontFamily={selectedFont}
              >
                {rankInfo.labelKa}
              </text>
            </g>
          )}
        </g>

        {/* 5. Deterministic Ornamental Frame Outline Around Illustration */}
        <g
          fill="none"
          stroke={`url(#goldGrad-${clipId})`}
          strokeWidth={Math.max(1.5, spec.borderThickness * 0.85)}
        >
          {renderIllustrationClipPath()}
        </g>

        {/* 6. Four Georgian Corner Ornaments */}
        {spec.showCornerOrnaments && (
          <>
            {/* Top-Right & Bottom-Left Ornaments (complementing Top-Left & Bottom-Right rank indices) */}
            <g transform="translate(242, 16) scale(-0.7, 0.7)">
              <path
                d="M4 48V12C4 7.5 7.5 4 12 4H48"
                stroke={spec.accentColor}
                strokeWidth="2.5"
                fill="none"
              />
              <circle cx="12" cy="12" r="3.5" fill={spec.primaryColor} />
              <path d="M12 4L20 12L12 20L4 12Z" fill={spec.accentColor} fillOpacity="0.5" />
            </g>
            <g transform="translate(58, 404) scale(0.7, -0.7)">
              <path
                d="M4 48V12C4 7.5 7.5 4 12 4H48"
                stroke={spec.accentColor}
                strokeWidth="2.5"
                fill="none"
              />
              <circle cx="12" cy="12" r="3.5" fill={spec.primaryColor} />
              <path d="M12 4L20 12L12 20L4 12Z" fill={spec.accentColor} fillOpacity="0.5" />
            </g>
          </>
        )}

        {/* 7. TOP-LEFT Deterministic Rank & Suit Index */}
        <g transform={`translate(${indexX}, ${indexY}) scale(${spec.rankScale})`}>
          {spec.rankPosition === 'ornate-medallion' && (
            <rect
              x="-16"
              y="-24"
              width="32"
              height="68"
              rx="16"
              fill={spec.surfaceColor}
              stroke={spec.accentColor}
              strokeWidth="1.5"
            />
          )}
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill={suitColor}
            fontFamily={selectedFont}
            fontWeight="800"
            fontSize={rank === 'JOKER' ? '11' : rank === '10' ? '21' : '24'}
            letterSpacing="-0.02em"
          >
            {rank === 'JOKER' ? 'ჯოკ' : rank}
          </text>

          {spec.useGeorgianRankSubscript && rank !== 'JOKER' && (
            <text
              x="0"
              y="12"
              textAnchor="middle"
              fill={spec.primaryColor}
              fontFamily="'Noto Sans Georgian', sans-serif"
              fontWeight="700"
              fontSize="8.5"
            >
              {rankInfo.shortKa}
            </text>
          )}

          <g transform={`translate(-10, ${spec.useGeorgianRankSubscript ? 16 : 6})`}>
            <GeorgianSuitSymbol
              suit={suit}
              size={20}
              color={suitColor}
              accentColor={spec.accentColor}
            />
          </g>
        </g>

        {/* 8. BOTTOM-RIGHT Mirrored Deterministic Rank & Suit Index */}
        <g
          transform={`translate(${baseWidth - indexX}, ${baseHeight - indexY}) rotate(180) scale(${spec.rankScale})`}
        >
          {spec.rankPosition === 'ornate-medallion' && (
            <rect
              x="-16"
              y="-24"
              width="32"
              height="68"
              rx="16"
              fill={spec.surfaceColor}
              stroke={spec.accentColor}
              strokeWidth="1.5"
            />
          )}
          <text
            x="0"
            y="0"
            textAnchor="middle"
            fill={suitColor}
            fontFamily={selectedFont}
            fontWeight="800"
            fontSize={rank === 'JOKER' ? '11' : rank === '10' ? '21' : '24'}
            letterSpacing="-0.02em"
          >
            {rank === 'JOKER' ? 'ჯოკ' : rank}
          </text>

          {spec.useGeorgianRankSubscript && rank !== 'JOKER' && (
            <text
              x="0"
              y="12"
              textAnchor="middle"
              fill={spec.primaryColor}
              fontFamily="'Noto Sans Georgian', sans-serif"
              fontWeight="700"
              fontSize="8.5"
            >
              {rankInfo.shortKa}
            </text>
          )}

          <g transform={`translate(-10, ${spec.useGeorgianRankSubscript ? 16 : 6})`}>
            <GeorgianSuitSymbol
              suit={suit}
              size={20}
              color={suitColor}
              accentColor={spec.accentColor}
            />
          </g>
        </g>

        {/* 9. Optional Ribbon Title Banner Below Frame */}
        {titleKa && spec.illustrationFrameStyle !== 'full-bleed' && (
          <g transform="translate(150, 391)">
            <rect
              x="-78"
              y="-10"
              width="156"
              height="19"
              rx="9.5"
              fill={spec.secondaryColor}
              stroke={spec.accentColor}
              strokeWidth="1.1"
            />
            <text
              x="0"
              y="2.5"
              textAnchor="middle"
              fill={spec.surfaceColor}
              fontSize="8.2"
              fontFamily="'Noto Sans Georgian', sans-serif"
              fontWeight="600"
            >
              {titleKa.length > 26 ? `${titleKa.slice(0, 25)}…` : titleKa}
            </text>
          </g>
        )}

        {/* 10. Optional Print-Ready Bleed & Safe Area Guides */}
        {showPrintGuides && (
          <g pointerEvents="none">
            {/* Bleed boundary indicator */}
            <rect
              x={bleedMm * 2}
              y={bleedMm * 2}
              width={baseWidth - bleedMm * 4}
              height={baseHeight - bleedMm * 4}
              fill="none"
              stroke="#00E5FF"
              strokeWidth="0.9"
              strokeDasharray="4 2"
            />
            {/* Safe margin indicator */}
            <rect
              x={safeMarginMm * 4.5}
              y={safeMarginMm * 4.5}
              width={baseWidth - safeMarginMm * 9}
              height={baseHeight - safeMarginMm * 9}
              fill="none"
              stroke="#22C55E"
              strokeWidth="0.9"
              strokeDasharray="3 3"
            />
          </g>
        )}
      </svg>
    </div>
  );
};
