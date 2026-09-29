import { describe, expect, it } from 'vitest';
import { FORMATS, getFormat } from '../lib/formats';
import { computeGtinCheckDigit, gtinCheckDigitValid, validateValue } from '../lib/validate';
import { renderLine, DEFAULT_STYLE } from '../lib/generate';

const EXPECTED_IDS = [
  'code128',
  'code39',
  'ean13',
  'ean8',
  'upca',
  'upce',
  'itf',
  'itf14',
  'codabar',
  'gs1-128',
  'qrcode',
  'datamatrix',
  'pdf417',
];

describe('supported formats', () => {
  it('exposes exactly the formats the product promises', () => {
    expect(FORMATS.map((f) => f.id).sort()).toEqual([...EXPECTED_IDS].sort());
  });

  it('every format has a unique bcid, label, samples and valid metadata', () => {
    const bcids = new Set<string>();
    for (const f of FORMATS) {
      expect(f.bcid.length).toBeGreaterThan(0);
      bcids.add(f.bcid);
      expect(f.label).toBeTruthy();
      expect(f.family).toMatch(/^(linear|2d)$/);
      expect(f.samples.length).toBeGreaterThan(0);
      expect(getFormat(f.id)).toBe(f);
    }
    expect(bcids.size).toBe(FORMATS.length);
  });

  it('every sample value validates cleanly for its own format', () => {
    for (const f of FORMATS) {
      for (const sample of f.samples) {
        expect(validateValue(f.id, sample)).toBeNull();
      }
    }
  });
});

describe('GTIN check digit math', () => {
  it('accepts known-good numbers across lengths', () => {
    expect(gtinCheckDigitValid('4006381333931')).toBe(true); // EAN-13
    expect(gtinCheckDigitValid('24032155')).toBe(true); // EAN-8
    expect(gtinCheckDigitValid('036000291452')).toBe(true); // UPC-A
    expect(gtinCheckDigitValid('15400141288763')).toBe(true); // ITF-14
    expect(gtinCheckDigitValid('00950110153403')).toBe(true); // GS1 AI(01)
  });

  it('rejects bad check digits', () => {
    expect(gtinCheckDigitValid('4006381333930')).toBe(false);
    expect(gtinCheckDigitValid('24032159')).toBe(false);
  });

  it('computes the expected check digit', () => {
    expect(computeGtinCheckDigit('400638133393')).toBe(1);
    expect(computeGtinCheckDigit('2403215')).toBe(5);
  });
});

describe('per-format validation', () => {
  it('code128: rejects non-ASCII and control characters', () => {
    expect(validateValue('code128', 'Hello-123')).toBeNull();
    expect(validateValue('code128', 'curly ‘quote’')).toMatch(/ASCII/i);
    expect(validateValue('code128', 'a\u0001b')).toMatch(/control/i);
  });

  it('code39: enforces charset', () => {
    expect(validateValue('code39', 'ABC-1234')).toBeNull();
    expect(validateValue('code39', 'abc123')).toMatch(/A-Z/i);
    expect(validateValue('code39', 'ABC~123')).toMatch(/A-Z/i);
  });

  it('ean13: requires 13 digits with valid check digit', () => {
    expect(validateValue('ean13', '4006381333931')).toBeNull();
    expect(validateValue('ean13', '400638133393')).toMatch(/exactly 13/);
    expect(validateValue('ean13', '4006381333930')).toMatch(/last digit should be 1/);
  });

  it('ean8: requires 8 digits with valid check digit', () => {
    expect(validateValue('ean8', '24032155')).toBeNull();
    expect(validateValue('ean8', '2403215')).toMatch(/exactly 8/);
    expect(validateValue('ean8', '24032159')).toMatch(/last digit should be 5/);
  });

  it('upca: requires 12 digits with valid check digit', () => {
    expect(validateValue('upca', '036000291452')).toBeNull();
    expect(validateValue('upca', '03600029145X')).toMatch(/exactly 12/);
  });

  it('upce: requires 8 digits with number system 0/1', () => {
    expect(validateValue('upce', '01234565')).toBeNull();
    expect(validateValue('upce', '21234565')).toMatch(/0 or 1/);
    expect(validateValue('upce', '0123456')).toMatch(/exactly 8/);
  });

  it('itf: digits only', () => {
    expect(validateValue('itf', '12345678')).toBeNull();
    expect(validateValue('itf', '12345A')).toMatch(/digits only/i);
  });

  it('itf14: exactly 14 digits with valid check digit', () => {
    expect(validateValue('itf14', '15400141288763')).toBeNull();
    expect(validateValue('itf14', '1540014128876')).toMatch(/exactly 14/);
    expect(validateValue('itf14', '15400141288766')).toMatch(/last digit should be 3/);
  });

  it('codabar: requires start/stop and charset', () => {
    expect(validateValue('codabar', 'C1234D')).toBeNull();
    expect(validateValue('codabar', '1234D')).toMatch(/start and end/i);
    expect(validateValue('codabar', 'C123!D')).toMatch(/payload/i);
  });

  it('gs1-128: parses AIs and validates known lengths', () => {
    expect(validateValue('gs1-128', '(01)00950110153403')).toBeNull();
    expect(validateValue('gs1-128', '(21)ABC-123')).toBeNull();
    expect(validateValue('gs1-128', '0109501101534003')).toMatch(/start with an Application Identifier/i);
    expect(validateValue('gs1-128', '(01)0950110153400')).toMatch(/14 digits; got 13/);
    expect(validateValue('gs1-128', '(01)09501101534002')).toMatch(/check digit is wrong: expected 1/);
    expect(validateValue('gs1-128', '(17)221231')).toBeNull();
    expect(validateValue('gs1-128', '(17)22123')).toMatch(/6 digits; got 5/);
    expect(validateValue('gs1-128', '(17)')).toMatch(/has no data/);
  });

  it('2d formats accept any text', () => {
    expect(validateValue('qrcode', 'anything at all ✓')).toBeNull();
    expect(validateValue('datamatrix', '')).toBeNull();
    expect(validateValue('pdf417', 'x')).toBeNull();
  });
});

describe('render pipeline', () => {
  it('renders valid values as SVG and returns errors for invalid ones', () => {
    const ok = renderLine('code128', 'Hello-123', DEFAULT_STYLE);
    expect(ok.status).toBe('valid');
    if (ok.status === 'valid') {
      expect(ok.svg).toMatch(/^<svg/);
    }

    const bad = renderLine('ean13', '4006381333930', DEFAULT_STYLE);
    expect(bad.status).toBe('error');
    if (bad.status === 'error') {
      expect(bad.message).toMatch(/check digit/i);
    }
  });

  it('renders every format sample through the full pipeline', () => {
    for (const f of FORMATS) {
      for (const sample of f.samples) {
        const result = renderLine(f.id, sample, DEFAULT_STYLE);
        expect(result.status, `${f.id}: ${sample}`).toBe('valid');
      }
    }
  });

  it('never silently truncates or modifies the value', () => {
    const result = renderLine('ean13', '4006381333930', DEFAULT_STYLE);
    if (result.status === 'error') {
      expect(result.value).toBe('4006381333930');
    }
  });
});
