import PDFDocument from 'pdfkit';
import { PlayingCard, Project, RANK_METADATA, SUIT_METADATA } from '../../shared/types.js';

export interface PdfExportOptions {
  project: Project;
  cards: PlayingCard[];
  layoutMode: 'print-sheet' | 'one-per-page';
  pageSize: 'A4' | 'LETTER' | 'SRA3';
  cardWidthMm: number;
  cardHeightMm: number;
  bleedMm: number;
  safeMarginMm: number;
  includeCropMarks: boolean;
  includeCardBack: boolean;
}

const MM_TO_PT = 2.83464567;

const PAGE_DIMENSIONS_MM: Record<'A4' | 'LETTER' | 'SRA3', { width: number; height: number }> = {
  A4: { width: 210, height: 297 },
  LETTER: { width: 215.9, height: 279.4 },
  SRA3: { width: 320, height: 450 },
};

/**
 * Generates a print-ready or single-card-per-page PDF buffer preserving exact physical
 * card dimensions (in millimeters converted to PostScript points), bleed zones, safe margins,
 * crop marks, and optional card-back sheets.
 */
export async function generateDeckPdfBuffer(options: PdfExportOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const {
        project,
        cards,
        layoutMode,
        pageSize,
        cardWidthMm,
        cardHeightMm,
        bleedMm,
        safeMarginMm,
        includeCropMarks,
        includeCardBack,
      } = options;

      const cardW = cardWidthMm * MM_TO_PT;
      const cardH = cardHeightMm * MM_TO_PT;
      const bleedPt = bleedMm * MM_TO_PT;
      const safePt = safeMarginMm * MM_TO_PT;

      const pageDims = PAGE_DIMENSIONS_MM[pageSize] || PAGE_DIMENSIONS_MM.A4;
      const doc = new PDFDocument({
        autoFirstPage: false,
        info: {
          Title: `KARTULI DECK AI — ${project.name}`,
          Author: 'Kartuli Deck AI Studio',
          Subject: `Print-Ready Playing Card Deck (${cardWidthMm}x${cardHeightMm}mm, Bleed ${bleedMm}mm)`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      if (layoutMode === 'one-per-page') {
        const totalW = cardW + bleedPt * 2;
        const totalH = cardH + bleedPt * 2;

        for (const card of cards) {
          doc.addPage({ size: [totalW, totalH], margin: 0 });
          drawCardOnPdf(doc, card, bleedPt, bleedPt, cardW, cardH, bleedPt, safePt, includeCropMarks);
        }

        if (includeCardBack) {
          doc.addPage({ size: [totalW, totalH], margin: 0 });
          drawCardBackOnPdf(doc, project, bleedPt, bleedPt, cardW, cardH, bleedPt, includeCropMarks);
        }
      } else {
        // Multi-card Print Sheet Imposition (e.g., 3x3 on A4)
        const sheetW = pageDims.width * MM_TO_PT;
        const sheetH = pageDims.height * MM_TO_PT;
        const cellW = cardW + bleedPt * 2;
        const cellH = cardH + bleedPt * 2;
        const marginPt = 10 * MM_TO_PT;

        const cols = Math.max(1, Math.floor((sheetW - marginPt * 2) / cellW));
        const rows = Math.max(1, Math.floor((sheetH - marginPt * 2 - 24) / cellH));
        const cardsPerSheet = cols * rows;

        const gridW = cols * cellW;
        const gridH = rows * cellH;
        const startX = (sheetW - gridW) / 2;
        const startY = (sheetH - gridH) / 2 + 10;

        for (let i = 0; i < cards.length; i += cardsPerSheet) {
          const sheetCards = cards.slice(i, i + cardsPerSheet);
          doc.addPage({ size: [sheetW, sheetH], margin: 0 });

          // Sheet Calibration Header
          doc
            .fontSize(8)
            .fillColor('#351A22')
            .text(
              `KARTULI DECK AI | ${project.name} | Sheet ${Math.floor(i / cardsPerSheet) + 1} | Trim: ${cardWidthMm}x${cardHeightMm}mm | Bleed: ${bleedMm}mm | Safe: ${safeMarginMm}mm`,
              startX,
              14
            );

          sheetCards.forEach((card, idx) => {
            const col = idx % cols;
            const row = Math.floor(idx / cols);
            const trimX = startX + col * cellW + bleedPt;
            const trimY = startY + row * cellH + bleedPt;

            drawCardOnPdf(
              doc,
              card,
              trimX,
              trimY,
              cardW,
              cardH,
              bleedPt,
              safePt,
              includeCropMarks
            );
          });

          if (includeCardBack) {
            doc.addPage({ size: [sheetW, sheetH], margin: 0 });
            doc
              .fontSize(8)
              .fillColor('#351A22')
              .text(
                `KARTULI DECK AI | CARD BACK SHEET (უკანა მხარე) | Trim: ${cardWidthMm}x${cardHeightMm}mm | Bleed: ${bleedMm}mm`,
                startX,
                14
              );

            sheetCards.forEach((_, idx) => {
              const col = idx % cols;
              const row = Math.floor(idx / cols);
              const trimX = startX + col * cellW + bleedPt;
              const trimY = startY + row * cellH + bleedPt;

              drawCardBackOnPdf(
                doc,
                project,
                trimX,
                trimY,
                cardW,
                cardH,
                bleedPt,
                includeCropMarks
              );
            });
          }
        }
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawCardOnPdf(
  doc: PDFKit.PDFDocument,
  card: PlayingCard,
  trimX: number,
  trimY: number,
  cardW: number,
  cardH: number,
  bleedPt: number,
  safePt: number,
  includeCropMarks: boolean
) {
  const spec = card.designSpec;
  const suitInfo = SUIT_METADATA[card.suit] || SUIT_METADATA.guli;
  const rankInfo = RANK_METADATA[card.rank] || RANK_METADATA.A;

  // 1. Bleed Box Fill
  doc
    .rect(trimX - bleedPt, trimY - bleedPt, cardW + bleedPt * 2, cardH + bleedPt * 2)
    .fill(spec.surfaceColor || '#F4EBDD');

  // 2. Trim Card Border
  doc
    .roundedRect(trimX + 4, trimY + 4, cardW - 8, cardH - 8, 8)
    .lineWidth(spec.borderThickness || 2)
    .strokeColor(spec.accentColor || '#C6A15B')
    .stroke();

  // 3. Central Sanctuary Frame
  const archX = trimX + safePt + 12;
  const archY = trimY + safePt + 18;
  const archW = cardW - (safePt + 12) * 2;
  const archH = cardH - (safePt + 18) * 2;

  doc
    .roundedRect(archX, archY, archW, archH, 6)
    .fillAndStroke(spec.secondaryColor || '#351A22', spec.accentColor || '#C6A15B');

  // 4. Ornamental Diamond & Medallion Inside Sanctuary
  const cx = trimX + cardW / 2;
  const cy = trimY + cardH / 2;
  doc
    .save()
    .moveTo(cx, cy - archH * 0.35)
    .lineTo(cx + archW * 0.35, cy)
    .lineTo(cx, cy + archH * 0.35)
    .lineTo(cx - archW * 0.35, cy)
    .closePath()
    .fillAndStroke(spec.primaryColor || '#722F37', spec.accentColor || '#C6A15B')
    .restore();

  doc
    .circle(cx, cy, Math.min(archW, archH) * 0.18)
    .fillAndStroke('#151515', spec.accentColor || '#C6A15B');

  // 5. Top-Left & Bottom-Right Deterministic Rank Labels
  const rankColor = suitInfo.isRed ? spec.primaryColor || '#722F37' : '#151515';
  doc
    .fontSize(13)
    .fillColor(rankColor)
    .text(card.rank, trimX + safePt + 2, trimY + safePt + 2, { width: 32, align: 'left' });

  doc
    .fontSize(8)
    .fillColor(spec.accentColor || '#C6A15B')
    .text(`${rankInfo.rank} / ${card.suit.toUpperCase()}`, cx - 40, cy - 4, {
      width: 80,
      align: 'center',
    });

  doc
    .fontSize(13)
    .fillColor(rankColor)
    .text(card.rank, trimX + cardW - safePt - 34, trimY + cardH - safePt - 16, {
      width: 32,
      align: 'right',
    });

  // 6. Crop Marks at exact Trim Corners
  if (includeCropMarks) {
    drawCropMarks(doc, trimX, trimY, cardW, cardH, bleedPt);
  }
}

function drawCardBackOnPdf(
  doc: PDFKit.PDFDocument,
  project: Project,
  trimX: number,
  trimY: number,
  cardW: number,
  cardH: number,
  bleedPt: number,
  includeCropMarks: boolean
) {
  const palette = project.sharedStyleSpec?.palette;
  const primary = palette?.primary || '#722F37';
  const secondary = palette?.secondary || '#351A22';
  const accent = palette?.accent || '#C6A15B';

  doc
    .rect(trimX - bleedPt, trimY - bleedPt, cardW + bleedPt * 2, cardH + bleedPt * 2)
    .fill(secondary);

  doc
    .roundedRect(trimX + 8, trimY + 8, cardW - 16, cardH - 16, 6)
    .lineWidth(1.8)
    .strokeColor(accent)
    .stroke();

  const cx = trimX + cardW / 2;
  const cy = trimY + cardH / 2;
  doc
    .circle(cx, cy, Math.min(cardW, cardH) * 0.25)
    .fillAndStroke(primary, accent);

  doc
    .fontSize(7)
    .fillColor(accent)
    .text('KARTULI DECK', cx - 40, cy - 3, { width: 80, align: 'center' });

  if (includeCropMarks) {
    drawCropMarks(doc, trimX, trimY, cardW, cardH, bleedPt);
  }
}

function drawCropMarks(
  doc: PDFKit.PDFDocument,
  trimX: number,
  trimY: number,
  cardW: number,
  cardH: number,
  bleedPt: number
) {
  const markLen = Math.max(6, bleedPt + 4);
  const offset = 2;
  doc.save().lineWidth(0.5).strokeColor('#151515');

  // Top-Left
  doc.moveTo(trimX - offset - markLen, trimY).lineTo(trimX - offset, trimY).stroke();
  doc.moveTo(trimX, trimY - offset - markLen).lineTo(trimX, trimY - offset).stroke();

  // Top-Right
  doc.moveTo(trimX + cardW + offset, trimY).lineTo(trimX + cardW + offset + markLen, trimY).stroke();
  doc.moveTo(trimX + cardW, trimY - offset - markLen).lineTo(trimX + cardW, trimY - offset).stroke();

  // Bottom-Left
  doc.moveTo(trimX - offset - markLen, trimY + cardH).lineTo(trimX - offset, trimY + cardH).stroke();
  doc.moveTo(trimX, trimY + cardH + offset).lineTo(trimX, trimY + cardH + offset + markLen).stroke();

  // Bottom-Right
  doc
    .moveTo(trimX + cardW + offset, trimY + cardH)
    .lineTo(trimX + cardW + offset + markLen, trimY + cardH)
    .stroke();
  doc
    .moveTo(trimX + cardW, trimY + cardH + offset)
    .lineTo(trimX + cardW, trimY + cardH + offset + markLen)
    .stroke();

  doc.restore();
}
