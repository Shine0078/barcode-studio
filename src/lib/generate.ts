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
    return { status: 'error', value, message: friendlyRenderError(e) };
  }
}

function friendlyRenderError(e: unknown): string {
  const raw = String(e instanceof Error ? e.message : e);
  const known: [RegExp, string][] = [
    [/text is too long/i, 'The value is too long for this barcode type.'],
    [/too short/i, 'The value is too short for this barcode type.'],
    [/badCheckDigit/i, 'The check digit is incorrect.'],
    [/badCharacter/i, 'The value contains characters not supported by this barcode type.'],
    [/start and stop/i, 'Codabar must start and end with A, B, C, or D.'],
    [/number system/i, 'UPC-E number system must be 0 or 1.'],
    [/GS1|AI /i, 'The GS1 value is invalid. Check Application Identifier format and lengths.'],
  ];
  for (const [pattern, message] of known) {
    if (pattern.test(raw)) return message;
  }
  return raw;
}
