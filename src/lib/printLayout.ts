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
