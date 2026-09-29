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

export const SAMPLE_VALUES: Record<string, string[]> = {
  code128: ['Hello-123', 'ABC-987654', 'SKU-2026-0001'],
  code39: ['ABC-1234', 'PART-42/A', 'INV-2026-09'],
  ean13: ['4006381333931', '5901234123457', '5449000000996'],
  ean8: ['24032155', '73513568'],
  upca: ['036000291452', '042100005264'],
  upce: ['01234565', '03265105'],
  itf: ['12345678', '0012345678900'],
  itf14: ['15400141288763', '10614141000415'],
  codabar: ['C1234D', 'A40156B'],
  'gs1-128': ['(01)00950110153403', '(21)ABC-123'],
  qrcode: ['https://example.com', 'Hello QR'],
  datamatrix: ['HELLO-WORLD-9', 'LOT-2024-001'],
  pdf417: ['PDF417 example value', 'DL-91357-2024'],
};

export function sampleValuesFor(formatId: string): string {
  return (SAMPLE_VALUES[formatId] ?? getFormat(formatId)?.samples ?? ['Hello-123']).join('\n');
}
