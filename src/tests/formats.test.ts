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
