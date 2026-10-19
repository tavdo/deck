import React from 'react';

export interface OrnamentProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Original Wordmark & Crest Logo: KARTULI DECK
 * Features a stylized Georgian Borjgali-diamond card emblem and wordmark
 * designed to work seamlessly on both dark charcoal and warm ivory backgrounds.
 */
export const KartuliDeckLogo: React.FC<{
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg';
}> = ({ theme = 'dark', size = 'md' }) => {
  const textColor = theme === 'dark' ? '#F4EBDD' : '#151515';
  const subColor = theme === 'dark' ? '#C6A15B' : '#722F37';
  const iconSize = size === 'sm' ? 32 : size === 'lg' ? 48 : 38;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.75rem',
        userSelect: 'none',
      }}
    >
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Outer card-shaped geometric frame */}
        <rect
          x="10"
          y="4"
          width="44"
          height="56"
          rx="6"
          fill={theme === 'dark' ? '#241117' : '#F4EBDD'}
          stroke="#C6A15B"
          strokeWidth="2.2"
        />
        <rect
          x="14"
          y="8"
          width="36"
          height="48"
          rx="3.5"
          stroke="#722F37"
          strokeWidth="1.2"
          strokeDasharray="2 2"
        />
        {/* Corner Georgian Bolnisi-style geometric points */}
        <circle cx="18" cy="12" r="1.5" fill="#C6A15B" />
        <circle cx="46" cy="12" r="1.5" fill="#C6A15B" />
        <circle cx="18" cy="52" r="1.5" fill="#C6A15B" />
        <circle cx="46" cy="52" r="1.5" fill="#C6A15B" />

        {/* Central Georgian Diamond & 7-rayed Borjgali sun-rosette motif */}
        <path
          d="M32 14L45 32L32 50L19 32L32 14Z"
          fill="#722F37"
          stroke="#C6A15B"
          strokeWidth="1.6"
        />
        {/* Inner swirling Borjgali sun-wheel */}
        <circle cx="32" cy="32" r="7.5" fill="#151515" stroke="#C6A15B" strokeWidth="1.4" />
        <path
          d="M32 24.5C34.5 24.5 36.5 26.5 36.5 29M39.5 32C39.5 34.5 37.5 36.5 35 36.5M32 39.5C29.5 39.5 27.5 37.5 27.5 35M24.5 32C24.5 29.5 26.5 27.5 29 27.5"
          stroke="#C6A15B"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <circle cx="32" cy="32" r="2.6" fill="#C6A15B" />
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
        <span
          className="brand-wordmark"
          style={{
            color: textColor,
            fontSize: size === 'sm' ? '0.95rem' : size === 'lg' ? '1.35rem' : '1.12rem',
            letterSpacing: '0.16em',
          }}
        >
          KARTULI DECK
        </span>
        <span
          style={{
            color: subColor,
            fontSize: size === 'sm' ? '0.66rem' : '0.74rem',
            fontWeight: 600,
            letterSpacing: '0.06em',
          }}
        >
          ქართული ბანქოს სტუდია
        </span>
      </div>
    </div>
  );
};

/**
 * Reusable Corner Ornament inspired by Georgian carved stone (Alaverdi / Svetitskhoveli)
 * and medieval manuscript illumination corners.
 */
export const GeorgianCornerOrnament: React.FC<
  OrnamentProps & {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
    variant?: 'vine' | 'geometric' | 'arch' | 'manuscript';
  }
> = ({
  size = 42,
  color = '#C6A15B',
  secondaryColor = '#722F37',
  position = 'top-left',
  variant = 'vine',
  className,
  style,
}) => {
  const rotationMap = {
    'top-left': 'rotate(0deg)',
    'top-right': 'scaleX(-1)',
    'bottom-left': 'scaleY(-1)',
    'bottom-right': 'scale(-1, -1)',
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 60 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        transform: rotationMap[position],
        pointerEvents: 'none',
        ...style,
      }}
      aria-hidden="true"
    >
      {variant === 'vine' && (
        <>
          <path
            d="M4 56V14C4 8.477 8.477 4 14 4H56"
            stroke={color}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <path
            d="M9 48V17C9 12.582 12.582 9 17 9H48"
            stroke={secondaryColor}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
          {/* Interlaced vine tendril */}
          <path
            d="M10 10C18 10 24 16 24 23C24 27.5 20.5 30 17 30C14 30 12 27.5 12 24.5C12 21.5 15 19.5 18 20.5"
            stroke={color}
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Stylized grape cluster at corner node */}
          <circle cx="12" cy="12" r="2.5" fill={color} />
          <circle cx="17" cy="11" r="1.8" fill={secondaryColor} />
          <circle cx="11" cy="17" r="1.8" fill={secondaryColor} />
          <circle cx="16" cy="16" r="2" fill={color} />
          <path d="M28 9L32 13L28 17" stroke={color} strokeWidth="1.3" />
          <path d="M9 28L13 32L17 28" stroke={color} strokeWidth="1.3" />
        </>
      )}

      {variant === 'geometric' && (
        <>
          <path d="M4 54V4H54" stroke={color} strokeWidth="2.4" />
          <path d="M10 44V10H44" stroke={color} strokeWidth="1.2" />
          <rect
            x="7"
            y="7"
            width="14"
            height="14"
            stroke={secondaryColor}
            strokeWidth="1.8"
          />
          <path d="M14 7L21 14L14 21L7 14L14 7Z" fill={color} />
          <circle cx="14" cy="14" r="2.2" fill="#151515" />
          <path d="M25 10H38L34 15H25V10Z" fill={secondaryColor} opacity="0.75" />
          <path d="M10 25V38L15 34V25H10Z" fill={secondaryColor} opacity="0.75" />
        </>
      )}

      {variant === 'arch' && (
        <>
          <path
            d="M4 56V20C4 11.163 11.163 4 20 4H56"
            stroke={color}
            strokeWidth="2.2"
          />
          <path
            d="M8 52V22C8 14.268 14.268 8 22 8H52"
            stroke={secondaryColor}
            strokeWidth="1.5"
          />
          <path
            d="M8 24C14 24 24 14 24 8"
            stroke={color}
            strokeWidth="1.6"
          />
          <circle cx="13" cy="13" r="3" fill={color} />
          <circle cx="13" cy="13" r="1.3" fill={secondaryColor} />
        </>
      )}

      {variant === 'manuscript' && (
        <>
          <path d="M4 55V8L8 4H55" stroke={color} strokeWidth="2" />
          <path
            d="M8 46V12H46"
            stroke={secondaryColor}
            strokeWidth="1.4"
            strokeDasharray="3 2"
          />
          <path
            d="M8 8L22 14L14 22L8 8Z"
            fill={secondaryColor}
            stroke={color}
            strokeWidth="1.3"
          />
          <circle cx="24" cy="8" r="2" fill={color} />
          <circle cx="8" cy="24" r="2" fill={color} />
        </>
      )}
    </svg>
  );
};

/**
 * Horizontal Ornamental Divider / Separator with Georgian Bolnisi-Cross & Vine Rosette
 */
export const GeorgianOrnamentDivider: React.FC<{
  color?: string;
  accentColor?: string;
  width?: number | string;
}> = ({ color = '#C6A15B', accentColor = '#722F37', width = '100%' }) => (
  <div
    style={{
      width,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '1.25rem 0',
      overflow: 'hidden',
    }}
    aria-hidden="true"
  >
    <svg
      width="360"
      height="28"
      viewBox="0 0 360 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ maxWidth: '100%' }}
    >
      {/* Left tapering line & knots */}
      <path d="M4 14H136" stroke={color} strokeWidth="1.2" strokeOpacity="0.6" />
      <path d="M40 10L48 14L40 18" stroke={color} strokeWidth="1.2" />
      <path d="M110 9C118 9 122 19 130 19" stroke={color} strokeWidth="1.4" />
      <path d="M110 19C118 19 122 9 130 9" stroke={color} strokeWidth="1.4" />
      <circle cx="142" cy="14" r="2.5" fill={accentColor} stroke={color} strokeWidth="1.2" />

      {/* Center Georgian Diamond & Rosette */}
      <path
        d="M180 2L194 14L180 26L166 14L180 2Z"
        fill={accentColor}
        stroke={color}
        strokeWidth="1.6"
      />
      <path
        d="M180 7L187 14L180 21L173 14L180 7Z"
        fill="#151515"
        stroke={color}
        strokeWidth="1.1"
      />
      <circle cx="180" cy="14" r="2.5" fill={color} />

      {/* Right knots & tapering line */}
      <circle cx="218" cy="14" r="2.5" fill={accentColor} stroke={color} strokeWidth="1.2" />
      <path d="M230 9C238 9 242 19 250 19" stroke={color} strokeWidth="1.4" />
      <path d="M230 19C238 19 242 9 250 9" stroke={color} strokeWidth="1.4" />
      <path d="M320 10L312 14L320 18" stroke={color} strokeWidth="1.2" />
      <path d="M224 14H356" stroke={color} strokeWidth="1.2" strokeOpacity="0.6" />
    </svg>
  </div>
);

/**
 * Custom Georgian Playing Card Suit Symbols (SVG):
 * Supports both classic international suits rendered with Georgian ornamental geometry
 * AND custom Georgian heritage suits (ვაზი/ყურძენი, ფარი/ჯვარი, ხანჯალი/მახვილი, ბორჯღალი/მზე).
 */
export const GeorgianSuitSymbol: React.FC<{
  suit: string;
  size?: number;
  color?: string;
  accentColor?: string;
}> = ({ suit, size = 24, color, accentColor = '#C6A15B' }) => {
  const isRedSuit =
    suit === 'hearts' ||
    suit === 'diamonds' ||
    suit === 'guli' ||
    suit === 'aguri' ||
    suit === 'vazi' ||
    suit === 'borjgali';

  const fill = color || (isRedSuit ? '#722F37' : '#151515');

  switch (suit) {
    case 'hearts':
    case 'guli':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 28.5C16 28.5 3.5 20.2 3.5 11.2C3.5 6.8 6.9 3.5 11 3.5C13.6 3.5 15.2 4.9 16 6.8C16.8 4.9 18.4 3.5 21 3.5C25.1 3.5 28.5 6.8 28.5 11.2C28.5 20.2 16 28.5 16 28.5Z"
            fill={fill}
            stroke={accentColor}
            strokeWidth="1.4"
          />
          {/* Inner Georgian vine flourish */}
          <path
            d="M16 11L19 15.5L16 20L13 15.5L16 11Z"
            fill={accentColor}
            fillOpacity="0.45"
          />
        </svg>
      );

    case 'diamonds':
    case 'aguri':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 2.5L28 16L16 29.5L4 16L16 2.5Z"
            fill={fill}
            stroke={accentColor}
            strokeWidth="1.5"
          />
          <path
            d="M16 8.5L22.5 16L16 23.5L9.5 16L16 8.5Z"
            stroke={accentColor}
            strokeWidth="1.1"
            strokeOpacity="0.75"
          />
          <circle cx="16" cy="16" r="2.2" fill={accentColor} />
        </svg>
      );

    case 'spades':
    case 'piki':
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 3C16 3 4 12.2 4 19.5C4 23.4 7.1 26 10.6 26C12.9 26 14.5 24.8 15.2 23.5L12.5 29H19.5L16.8 23.5C17.5 24.8 19.1 26 21.4 26C24.9 26 28 23.4 28 19.5C28 12.2 16 3 16 3Z"
            fill={fill}
            stroke={accentColor}
            strokeWidth="1.4"
          />
          <path
            d="M16 10L18.8 16L16 20L13.2 16L16 10Z"
            fill={accentColor}
            fillOpacity="0.45"
          />
        </svg>
      );

    case 'clubs':
    case 'jvari':
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4C12.7 4 10 6.6 10 9.8C10 11.6 10.8 13.1 12.1 14.1C10.4 13.5 8.2 14.1 6.8 15.5C4.5 17.8 4.8 21.6 7.4 23.5C9.7 25.1 12.9 24.4 14.5 22L12.3 28.5H19.7L17.5 22C19.1 24.4 22.3 25.1 24.6 23.5C27.2 21.6 27.5 17.8 25.2 15.5C23.8 14.1 21.6 13.5 19.9 14.1C21.2 13.1 22 11.6 22 9.8C22 6.6 19.3 4 16 4Z"
            fill={fill}
            stroke={accentColor}
            strokeWidth="1.4"
          />
          <circle cx="16" cy="16.5" r="2.4" fill={accentColor} />
        </svg>
      );

    case 'vazi': // Georgian Grapevine Suit
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path d="M16 3V8" stroke={accentColor} strokeWidth="2" strokeLinecap="round" />
          <path d="M16 6C19 4 22 5 23 8" stroke={accentColor} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="12" cy="11" r="3.5" fill={fill} stroke={accentColor} strokeWidth="1.2" />
          <circle cx="20" cy="11" r="3.5" fill={fill} stroke={accentColor} strokeWidth="1.2" />
          <circle cx="16" cy="13" r="3.8" fill={fill} stroke={accentColor} strokeWidth="1.2" />
          <circle cx="10" cy="17" r="3.4" fill={fill} stroke={accentColor} strokeWidth="1.2" />
          <circle cx="16" cy="18.5" r="3.6" fill={fill} stroke={accentColor} strokeWidth="1.2" />
          <circle cx="22" cy="17" r="3.4" fill={fill} stroke={accentColor} strokeWidth="1.2" />
          <circle cx="13" cy="23" r="3.2" fill={fill} stroke={accentColor} strokeWidth="1.2" />
          <circle cx="19" cy="23" r="3.2" fill={fill} stroke={accentColor} strokeWidth="1.2" />
          <circle cx="16" cy="27.2" r="3" fill={fill} stroke={accentColor} strokeWidth="1.2" />
        </svg>
      );

    case 'khanjali': // Georgian Dagger / Sword Suit
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 2L18.5 5.5V9.5H13.5V5.5L16 2Z"
            fill={accentColor}
            stroke={fill}
            strokeWidth="1.2"
          />
          <rect x="9" y="9.5" width="14" height="3" rx="1.5" fill={fill} stroke={accentColor} strokeWidth="1.2" />
          <path
            d="M13 12.5H19L16 29.5L13 12.5Z"
            fill={fill}
            stroke={accentColor}
            strokeWidth="1.3"
          />
          <line x1="16" y1="13" x2="16" y2="26" stroke={accentColor} strokeWidth="1" />
        </svg>
      );

    case 'borjgali': // Georgian Borjgali Sun Suit
      return (
        <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
          <circle cx="16" cy="16" r="12" fill={fill} stroke={accentColor} strokeWidth="1.5" />
          <path
            d="M16 6C19.5 6 22 8.8 22 12M26 16C26 19.5 23.2 22 20 22M16 26C12.5 26 10 23.2 10 20M6 16C6 12.5 8.8 10 12 10"
            stroke={accentColor}
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <circle cx="16" cy="16" r="3.5" fill={accentColor} />
        </svg>
      );
  }
};

/**
 * Symmetrical Ornamental Composition for Playing Card Backs
 */
export const GeorgianCardBackArtwork: React.FC<{
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  motif?: 'vine' | 'geometric' | 'arch' | 'manuscript';
}> = ({
  primaryColor = '#351A22',
  secondaryColor = '#722F37',
  accentColor = '#C6A15B',
  motif = 'vine',
}) => {
  return (
    <svg
      viewBox="0 0 300 420"
      width="100%"
      height="100%"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <pattern
          id={`card-back-pattern-${motif}`}
          x="0"
          y="0"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M20 0L40 20L20 40L0 20L20 0Z"
            fill="none"
            stroke={accentColor}
            strokeWidth="0.6"
            strokeOpacity="0.3"
          />
          <circle cx="20" cy="20" r="3" fill={secondaryColor} fillOpacity="0.45" />
          <circle cx="20" cy="20" r="1.2" fill={accentColor} fillOpacity="0.5" />
        </pattern>
      </defs>

      {/* Deep Burgundy Base */}
      <rect x="0" y="0" width="300" height="420" rx="16" fill={primaryColor} />

      {/* Patterned Inner Field */}
      <rect
        x="16"
        y="16"
        width="268"
        height="388"
        rx="10"
        fill={`url(#card-back-pattern-${motif})`}
        stroke={accentColor}
        strokeWidth="2"
      />

      {/* Double Ornamental Frame */}
      <rect
        x="24"
        y="24"
        width="252"
        height="372"
        rx="6"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.2"
        strokeDasharray="4 3"
      />

      {/* Top and Bottom Symmetrical Georgian Arch Crowns */}
      <path
        d="M65 24C95 58 205 58 235 24"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.8"
      />
      <path
        d="M65 396C95 362 205 362 235 396"
        fill="none"
        stroke={accentColor}
        strokeWidth="1.8"
      />

      {/* Four Corner Medallions */}
      {[
        [44, 44],
        [256, 44],
        [44, 376],
        [256, 376],
      ].map(([cx, cy], idx) => (
        <g key={idx}>
          <circle cx={cx} cy={cy} r="12" fill={secondaryColor} stroke={accentColor} strokeWidth="1.5" />
          <path
            d={`M${cx} ${cy - 7}L${cx + 7} ${cy}L${cx} ${cy + 7}L${cx - 7} ${cy}Z`}
            fill={accentColor}
          />
        </g>
      ))}

      {/* Central Symmetrical Georgian Cross-Vine Medallion */}
      <g transform="translate(150, 210)">
        <path
          d="M0 -115L85 0L0 115L-85 0Z"
          fill={secondaryColor}
          stroke={accentColor}
          strokeWidth="2.2"
        />
        <path
          d="M0 -92L68 0L0 92L-68 0Z"
          fill={primaryColor}
          stroke={accentColor}
          strokeWidth="1.4"
        />
        <circle cx="0" cy="0" r="46" fill={secondaryColor} stroke={accentColor} strokeWidth="2" />
        <circle cx="0" cy="0" r="34" fill="#151515" stroke={accentColor} strokeWidth="1.2" />

        {/* Symmetrical 8-point Georgian star & Borjgali */}
        <path
          d="M0 -28L7 -7L28 0L7 7L0 28L-7 7L-28 0L-7 -7Z"
          fill={accentColor}
        />
        <circle cx="0" cy="0" r="8" fill={secondaryColor} stroke={accentColor} strokeWidth="1.5" />

        {/* Top & Bottom Georgian Alphabet Mkhedruli decorative monogram ("ქ" - Kartuli) */}
        <text
          x="0"
          y="-58"
          textAnchor="middle"
          fill={accentColor}
          fontSize="16"
          fontFamily="Noto Serif Georgian, serif"
          fontWeight="700"
        >
          ქ
        </text>
        <text
          x="0"
          y="68"
          textAnchor="middle"
          fill={accentColor}
          fontSize="16"
          fontFamily="Noto Serif Georgian, serif"
          fontWeight="700"
        >
          ქ
        </text>
      </g>
    </svg>
  );
};
