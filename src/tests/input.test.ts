import { describe, expect, it } from 'vitest';
import { csvToValueLines, parseDelimited, parseValueLines } from '../lib/input';

describe('safe, local barcode value import', () => {
  it('keeps real line numbers and separately stores custom captions', () => {
    expect(parseValueLines('A1\tFirst item\n\nB2\tSecond item')).toEqual([
      { value: 'A1', caption: 'First item', line: 1 },
      { value: 'B2', caption: 'Second item', line: 3 },
    ]);
  });

  it('parses ordinary comma-separated values', () => {
    expect(csvToValueLines('code-1,Label 1\ncode-2,Label 2')).toBe('code-1\tLabel 1\ncode-2\tLabel 2');
  });

  it('skips a recognized header and strips a BOM', () => {
    expect(csvToValueLines('\uFEFFBarcode,Description\n123,Widget')).toBe('123\tWidget');
  });

  it('imports tab-separated Excel values', () => {
    expect(csvToValueLines('barcode\tcaption\nAB-1\tFirst')).toBe('AB-1\tFirst');
  });

  it('supports commas and line breaks inside quoted CSV captions', () => {
    expect(parseDelimited('value,caption\nABC,"One, two"\nDEF,"Multi\nline"')).toEqual([
      ['value', 'caption'], ['ABC', 'One, two'], ['DEF', 'Multi\nline'],
    ]);
    expect(csvToValueLines('value,caption\nABC,"One, two"\nDEF,"Multi\nline"'))
      .toBe('ABC\tOne, two\nDEF\tMulti line');
  });

  it('handles escaped quotes in CSV fields', () => {
    expect(csvToValueLines('value,caption\nID1,"A ""quoted"" item"')).toBe('ID1\tA "quoted" item');
  });

  it('rejects broken files instead of importing partial data', () => {
    expect(() => csvToValueLines('item,"unclosed')).toThrow(/unclosed/i);
    expect(() => csvToValueLines('')).toThrow(/no barcode values/i);
  });

  it('rejects embedded newlines inside barcode data', () => {
    expect(() => csvToValueLines('value,caption\n"ABC\nDEF",Label')).toThrow(/tabs or line breaks/i);
  });
});
