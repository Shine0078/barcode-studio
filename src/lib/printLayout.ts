export type PaperPreset = 'letter' | 'a4' | 'a5' | '4x6' | 'custom';
export type Orientation = 'portrait' | 'landscape';

export interface PrintConfig {
  preset: PaperPreset;
  customWidthMm: number;
  customHeightMm: number;
  orientation: Orientation;
  marginMm: number;
  gapMm: number;
  labelWidthMm: number;
  labelHeightMm: number;
  rows: number;
  cols: number;
  copies: number;
  showTextOnPrint: boolean;
}

export const DEFAULT_PRINT_CONFIG: PrintConfig = {
  preset: 'a4',
  customWidthMm: 210,
  customHeightMm: 297,
  orientation: 'portrait',
  marginMm: 10,
  gapMm: 4,
  labelWidthMm: 80,
  labelHeightMm: 50,
  rows: 0,
  cols: 0,
  copies: 1,
  showTextOnPrint: true,
};

export function pageSizeMm(cfg: PrintConfig): { w: number; h: number } {
  const base =
    cfg.preset === 'custom'
      ? { w: cfg.customWidthMm, h: cfg.customHeightMm }
      : PAPER_SIZES_MM[cfg.preset];
  return cfg.orientation === 'landscape' ? { w: base.h, h: base.w } : base;
}

export interface LabelSlot {
  x: number;
  y: number;
}

/** A label to print: the value encoded in the barcode plus optional extra
 * text lines rendered below it (e.g. ITEM / QTY / COO fields), each with an
 * optional mini barcode for scanning. */
export interface LabelEntry {
  value: string;
  lines?: string[];
}

export interface LabelGrid {
  cols: number;
  rows: number;
  slots: LabelSlot[];
  labelW: number;
  labelH: number;
  fits: boolean;
}

/** Pure layout math, in mm. Positions are relative to the page's content box
 * (inside the margins), left-aligned. Rows/cols come from config or are
 * auto-computed to fill the printable area. */
export function computeGrid(cfg: PrintConfig): LabelGrid {
  const page = pageSizeMm(cfg);
  const availW = page.w - 2 * cfg.marginMm;
  const availH = page.h - 2 * cfg.marginMm;

  const stepW = cfg.labelWidthMm + cfg.gapMm;
  const stepH = cfg.labelHeightMm + cfg.gapMm;

  const autoCols = Math.max(1, Math.floor((availW + cfg.gapMm) / stepW));
  const autoRows = Math.max(1, Math.floor((availH + cfg.gapMm) / stepH));

  const fits = cfg.labelWidthMm <= availW && cfg.labelHeightMm <= availH;

  const cols = clamp(cfg.cols > 0 ? cfg.cols : autoCols, 1, MAX_COLS);
  const rows = clamp(cfg.rows > 0 ? cfg.rows : autoRows, 1, MAX_ROWS);

  const slots: LabelSlot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      slots.push({
        x: cfg.marginMm + c * stepW,
        y: cfg.marginMm + r * stepH,
      });
    }
  }

  return { cols, rows, slots, labelW: cfg.labelWidthMm, labelH: cfg.labelHeightMm, fits };
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(n)));
}

export interface PrintPage {
  slots: { x: number; y: number; value: string; lines?: string[] }[];
}

/** Expand entries × copies, cut into pages, and cap runaway print jobs. */
export function buildPages(values: (string | LabelEntry)[], copies: number, cfg: PrintConfig, maxPages = 100) {
  const grid = computeGrid(cfg);
  const perPage = grid.rows * grid.cols;
  const labels: LabelEntry[] = [];
  for (const v of values) {
    const entry = typeof v === 'string' ? { value: v } : v;
    for (let i = 0; i < copies; i++) labels.push(entry);
  }
  const total = labels.length;
  const pageCount = perPage > 0 ? Math.ceil(total / perPage) : 0;
  const pages: PrintPage[] = [];
  const renderedPages = Math.min(pageCount, maxPages);
  for (let p = 0; p < renderedPages; p++) {
    const slots = grid.slots
      .slice(0, perPage)
      .map((slot, i) => {
        const label = labels[p * perPage + i];
        return { ...slot, value: label?.value ?? '', lines: label?.lines };
      })
      .filter((s) => s.value !== '');
    pages.push({ slots });
  }
  return { grid, pages, total, perPage, pageCount, truncated: pageCount > maxPages, fits: grid.fits };
}
