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
  it('auto-computes rows/cols to fill an A4 page', () => {
    const grid = computeGrid(cfg({ labelWidthMm: 60, labelHeightMm: 30, marginMm: 10, gapMm: 4 }));
    // width: 190mm avail; step 64 → 2 cols (floor(194/64)=2? (190+4)/64 = 3.03 → 3)
    // height: 277mm avail; step 34 → 8 rows ((277+4)/34 = 8.26)
    expect(grid.cols).toBe(3);
    expect(grid.rows).toBe(8);
    expect(grid.slots).toHaveLength(24);
  });

  it('slot positions start at the margin and advance by label + gap', () => {
    const grid = computeGrid(cfg({ labelWidthMm: 50, labelHeightMm: 25, marginMm: 10, gapMm: 5 }));
    expect(grid.slots[0]).toEqual({ x: 10, y: 10 });
    expect(grid.slots[1]).toEqual({ x: 65, y: 10 });
    expect(grid.slots[3]).toEqual({ x: 10, y: 40 });
  });

  it('stacking forces one column, preserving vertical input order', () => {
    const grid = computeGrid(cfg({ stackVertical: true, labelWidthMm: 60, labelHeightMm: 30 }));
    expect(grid.cols).toBe(1);
    expect(grid.rows).toBe(8);
    // all labels in a single column: x stays at the margin
    for (const slot of grid.slots) expect(slot.x).toBe(10);
    expect(grid.slots[1]).toEqual({ x: 10, y: 44 });
  });

  it('explicit rows/cols override auto computation', () => {
    const grid = computeGrid(cfg({ rows: 2, cols: 3 }));
    expect(grid.rows).toBe(2);
    expect(grid.cols).toBe(3);
    expect(grid.slots).toHaveLength(6);
  });

  it('reports when labels do not fit on the page', () => {
    const grid = computeGrid(cfg({ preset: '4x6', labelWidthMm: 150, labelHeightMm: 100 }));
    expect(grid.fits).toBe(false);
  });

  it('labels fit on 4x6 paper with reasonable sizing', () => {
    const grid = computeGrid(cfg({ preset: '4x6', labelWidthMm: 50, labelHeightMm: 25 }));
    expect(grid.fits).toBe(true);
    expect(grid.cols).toBe(1);
    // avail height 152.4-20 = 132.4; step 25+4=29 → floor((132.4+4)/29) = 4
    expect(grid.rows).toBe(4);
  });
});

describe('buildPages', () => {
  it('expands copies and paginates correctly', () => {
    const result = buildPages(['A', 'B', 'C'], 2, cfg({ labelWidthMm: 60, labelHeightMm: 30 }));
    expect(result.total).toBe(6);
    expect(result.perPage).toBe(24);
    expect(result.pageCount).toBe(1);
    expect(result.pages[0].slots).toHaveLength(6);
  });

  it('splits across pages when values exceed one page', () => {
    const values = Array.from({ length: 30 }, (_, i) => `v${i}`);
    const result = buildPages(values, 1, cfg({ labelWidthMm: 60, labelHeightMm: 30 }));
    expect(result.pageCount).toBe(2);
    expect(result.pages[0].slots).toHaveLength(24);
    expect(result.pages[1].slots).toHaveLength(6);
  });

