export type FormatFamily = 'linear' | '2d';

export interface FormatDefinition {
  id: string;
  label: string;
  bcid: string;
  family: FormatFamily;
  samples: string[];
  /** Notes shown in UI to help users produce valid values. */
  notes?: string;
}

export const FORMATS: FormatDefinition[] = [
  {
    id: 'code128',
    label: 'Code 128',
    bcid: 'code128',
    family: 'linear',
    samples: ['Hello-123', 'ABC-987654'],
    notes: 'Any ASCII characters. Common for shipping and inventory labels.',
  },
  {
    id: 'code39',
    label: 'Code 39',
    bcid: 'code39',
    family: 'linear',
    samples: ['ABC-1234', 'PART-42/A'],
    notes: 'Uppercase letters, digits, space, and - . $ / + %.',
  },
  {
    id: 'ean13',
    label: 'EAN-13',
    bcid: 'ean13',
    family: 'linear',
    samples: ['4006381333931'],
    notes: 'Exactly 13 digits; the last digit must be the correct check digit.',
  },
  {
    id: 'ean8',
    label: 'EAN-8',
    bcid: 'ean8',
    family: 'linear',
    samples: ['24032155'],
    notes: 'Exactly 8 digits with a valid check digit.',
  },
  {
    id: 'upca',
    label: 'UPC-A',
    bcid: 'upca',
    family: 'linear',
    samples: ['036000291452'],
    notes: 'Exactly 12 digits with a valid check digit.',
  },
  {
    id: 'upce',
    label: 'UPC-E',
    bcid: 'upce',
    family: 'linear',
    samples: ['01234565'],
    notes: '8 digits starting with 0 or 1; compressed UPC.',
  },
  {
    id: 'itf',
    label: 'ITF (Interleaved 2 of 5)',
    bcid: 'interleaved2of5',
    family: 'linear',
    samples: ['12345678', '1234567890'],
    notes: 'Digits only. Even length is recommended for reliable scanning.',
  },
  {
    id: 'itf14',
    label: 'ITF-14',
    bcid: 'itf14',
    family: 'linear',
    samples: ['15400141288763'],
    notes: 'Exactly 14 digits with a valid check digit.',
  },
  {
    id: 'codabar',
    label: 'Codabar',
    bcid: 'rationalizedCodabar',
    family: 'linear',
    samples: ['C1234D', 'A40156B'],
    notes: 'Digits plus - $ / : . +. Must start and end with A-D (or a-d).',
  },
  {
    id: 'gs1-128',
    label: 'GS1-128',
    bcid: 'gs1-128',
    family: 'linear',
    samples: ['(01)00950110153403', '(21)ABC-123'],
    notes:
      'GS1 Application Identifiers in parentheses, e.g. (01) + 14-digit GTIN. Check digits are verified.',
  },
  {
    id: 'qrcode',
    label: 'QR Code',
    bcid: 'qrcode',
    family: '2d',
    samples: ['https://example.com', 'Hello QR'],
    notes: 'Any text up to ~4,300 characters or ~7,000 digits.',
  },
  {
    id: 'datamatrix',
    label: 'Data Matrix',
    bcid: 'datamatrix',
    family: '2d',
    samples: ['HELLO-WORLD-9', 'LOT-2024-001'],
    notes: 'Any text up to ~2,300 characters or ~3,000 digits.',
  },
  {
    id: 'pdf417',
    label: 'PDF417',
    bcid: 'pdf417',
    family: '2d',
    samples: ['PDF417 example value', 'DL-91357-2024'],
    notes: 'Any text. Stacked 2D symbol used on IDs and shipping labels.',
  },
];

export function getFormat(id: string): FormatDefinition | undefined {
  return FORMATS.find((f) => f.id === id);
}
