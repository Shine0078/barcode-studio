import { toSVG } from 'bwip-js/generic';
import { FORMATS } from './formats';
import { validateValue } from './validate';
import type { StyleOptions } from './styleOptions';

export type { StyleOptions };
export const DEFAULT_STYLE: StyleOptions = {
  scale: 2,
  height: 30,
  showText: true,
  fgColor: '#000000',
  bgColor: '#ffffff',
  qrEccLevel: 'M',
  pdf417EccLevel: 5,
};

export type BarcodeLineResult =
  | { status: 'valid'; svg: string; value: string }
  | { status: 'error'; value: string; message: string };

function is2d(formatId: string): boolean {
  const format = FORMATS.find((f) => f.id === formatId);
  return format?.family === '2d';
}

export function barcodeOptionsFor(
  formatId: string,
  text: string,
  style: StyleOptions,
): Record<string, unknown> {
  const format = FORMATS.find((f) => f.id === formatId);
  const opts: Record<string, unknown> = {
    bcid: format?.bcid ?? 'code128',
    text,
    scale: Math.max(1, Math.round(style.scale)),
  };

  if (!is2d(formatId)) {
    opts.height = style.height;
    opts.includetext = style.showText;
    if (style.showText) opts.textxalign = 'center';
  }

  const fg = style.fgColor.replace('#', '');
  const bg = style.bgColor.replace('#', '');
  if (fg && fg !== '000000') {
    opts.barcolor = fg;
    opts.textcolor = fg;
  }
  if (bg && bg !== 'ffffff') opts.backgroundcolor = bg;

  if (formatId === 'qrcode') opts.ecclevel = style.qrEccLevel;
  if (formatId === 'pdf417') opts.eclevel = style.pdf417EccLevel;

  return opts;
}

export function renderLine(
  formatId: string,
  raw: string,
  style: StyleOptions,
): BarcodeLineResult {
  const value = raw.trim();
  if (value.length === 0) {
    return { status: 'error', value: raw, message: 'Value is empty.' };
  }

  const validationError = validateValue(formatId, value);
  if (validationError) {
    return { status: 'error', value, message: validationError };
  }

  try {
    const svg = toSVG(barcodeOptionsFor(formatId, value, style) as unknown as Parameters<typeof toSVG>[0]);
    return { status: 'valid', svg, value };
  } catch (e) {
    return { status: 'error', value, message: String(e) };
  }
}
