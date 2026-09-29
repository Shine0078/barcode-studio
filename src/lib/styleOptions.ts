import { getFormat } from './formats';

export interface StyleOptions {
  scale: number;
  height: number;
  showText: boolean;
  fgColor: string;
  bgColor: string;
  qrEccLevel: 'L' | 'M' | 'Q' | 'H';
  pdf417EccLevel: number;
}

export const DEFAULT_STYLE_OPTIONS: StyleOptions = {
  scale: 2,
  height: 30,
  showText: true,
  fgColor: '#000000',
  bgColor: '#ffffff',
  qrEccLevel: 'M',
  pdf417EccLevel: 5,
};

export function styleOptionsFor(formatId: string): StyleOptions {
  const base = { ...DEFAULT_STYLE_OPTIONS };
  const format = getFormat(formatId);
  if (!format) return base;
  if (format.family === '2d') {
    // 2D symbols manage their own height/aspect
    base.height = 0;
  }
  return base;
}
