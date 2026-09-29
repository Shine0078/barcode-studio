import { describe, expect, it } from 'vitest';
import {
  DEFAULT_PRINT_CONFIG,
  PAPER_SIZES_MM,
  buildPages,
  computeGrid,
  pageSizeMm,
  type PrintConfig,
} from '../lib/printLayout';

const cfg = (patch: Partial<PrintConfig>): PrintConfig => ({
  ...DEFAULT_PRINT_CONFIG,
  stackVertical: false,
  ...patch,
});

describe('page sizes', () => {
  it('known presets map to correct mm dimensions', () => {
    expect(PAPER_SIZES_MM.a4).toEqual({ w: 210, h: 297 });
    expect(PAPER_SIZES_MM.letter).toEqual({ w: 215.9, h: 279.4 });
    expect(PAPER_SIZES_MM.a5).toEqual({ w: 148, h: 210 });
    expect(PAPER_SIZES_MM['4x6']).toEqual({ w: 101.6, h: 152.4 });
  });

  it('orientation swaps page dimensions', () => {
    const portrait = pageSizeMm(cfg({ preset: 'a4' }));
    const landscape = pageSizeMm(cfg({ preset: 'a4', orientation: 'landscape' }));
    expect(portrait).toEqual({ w: 210, h: 297 });
    expect(landscape).toEqual({ w: 297, h: 210 });
  });

  it('custom sizes are honored', () => {
    expect(pageSizeMm(cfg({ preset: 'custom', customWidthMm: 120, customHeightMm: 60 }))).toEqual({
      w: 120,
      h: 60,
    });
  });
});

describe('computeGrid', () => {
