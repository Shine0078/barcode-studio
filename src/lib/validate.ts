/** Per-format value validation. Mirrors the rules BWIPP enforces at render
 * time so users get actionable messages before rendering is attempted.
 * The authoritative check happens at render time (bwip-js throws); the
 * purpose here is better error text and early feedback. */

export interface Gs1AiSpec {
  /** Exact allowed lengths, e.g. [14] for a fixed-length AI. */
  fixed?: number[];
  /** Maximum length for variable-length AIs. */
  maxVar?: number;
  /** Field carries a GS1 check digit (GTINs, SSCC, GRAI). */
  check?: boolean;
}

/** Common GS1 Application Identifiers (subset of the GS1 spec, covering the
 * AIs that appear on most real labels). Unknown AIs fall back to generic
 * handling: they must be 2-4 digits with non-empty contents. */
const GS1_AI_TABLE: Record<string, Gs1AiSpec> = {
  '00': { fixed: [18], check: true },
  '01': { fixed: [14], check: true },
  '02': { fixed: [14], check: true },
  '03': { fixed: [14], check: true },
  '04': { fixed: [14], check: true },
  '11': { fixed: [6] },
  '12': { fixed: [6] },
  '13': { fixed: [6] },
  '15': { fixed: [6] },
  '16': { fixed: [6] },
  '17': { fixed: [6] },
  '10': { maxVar: 20 },
  '21': { maxVar: 20 },
  '22': { maxVar: 29 },
  '235': { maxVar: 28 },
  '240': { maxVar: 30 },
  '241': { maxVar: 30 },
  '250': { maxVar: 30 },
  '251': { maxVar: 30 },
  '253': { fixed: [14], maxVar: 30 },
  '254': { maxVar: 30 },
  '30': { maxVar: 8 },
  '37': { maxVar: 8 },
  '3900': { maxVar: 15 },
  '3901': { maxVar: 15 },
  '3902': { maxVar: 15 },
  '3903': { maxVar: 15 },
  '3909': { maxVar: 15 },
  '3910': { fixed: [3], maxVar: 15 },
  '3911': { fixed: [3], maxVar: 15 },
  '3912': { fixed: [3], maxVar: 15 },
  '3913': { fixed: [3], maxVar: 15 },
  '3920': { maxVar: 15 },
  '3921': { maxVar: 15 },
  '3922': { maxVar: 15 },
  '3923': { maxVar: 15 },
  '3930': { fixed: [3], maxVar: 15 },
  '3931': { fixed: [3], maxVar: 15 },
  '3932': { fixed: [3], maxVar: 15 },
  '3933': { fixed: [3], maxVar: 15 },
  '7003': { fixed: [10] },
  '7004': { maxVar: 13 },
  '7005': { fixed: [12] },
  '7006': { fixed: [13] },
  '7007': { fixed: [6, 12] },
  '7008': { fixed: [3] },
  '7009': { fixed: [13] },
  '7010': { fixed: [13] },
  '7011': { fixed: [10] },
  '7020': { maxVar: 20 },
  '7021': { maxVar: 20 },
  '7022': { maxVar: 20 },
  '7030': { fixed: [3], maxVar: 30 },
  '7031': { fixed: [3], maxVar: 30 },
  '7032': { fixed: [3], maxVar: 30 },
  '7033': { fixed: [3], maxVar: 30 },
  '7040': { maxVar: 13 },
  '8003': { fixed: [14], maxVar: 30 },
  '8004': { maxVar: 30 },
  '8005': { fixed: [6] },
  '8006': { fixed: [18] },
  '8007': { fixed: [3, 13] },
  '8008': { fixed: [8, 12, 13] },
  '8017': { fixed: [18], check: true },
  '8018': { fixed: [18], check: true },
  '8019': { maxVar: 10 },
  '8020': { maxVar: 25 },
  '90': { maxVar: 30 },
  '91': { maxVar: 90 },
  '92': { maxVar: 90 },
  '93': { maxVar: 90 },
  '94': { maxVar: 90 },
  '95': { maxVar: 90 },
  '96': { maxVar: 90 },
  '97': { maxVar: 90 },
  '98': { maxVar: 90 },
  '99': { maxVar: 90 },
};

export function gtinCheckDigitValid(digits: string): boolean {
  // Works for GTIN-8/12/13/14 (EAN-8/UPC-A/EAN-13/GTIN-14).
  // Rule: the rightmost data digit is weighted 3, alternating 1,3,1,... leftward.
  const len = digits.length;
  let sum = 0;
  for (let i = 0; i < len - 1; i++) {
    const weight = (len - 2 - i) % 2 === 0 ? 3 : 1;
    sum += Number(digits[i]) * weight;
  }
  const check = (10 - (sum % 10)) % 10;
  return check === Number(digits[len - 1]);
}

export function computeGtinCheckDigit(base: string): number {
  // Check digit for `base` (data digits only, no check digit).
  const len = base.length;
  let sum = 0;
  for (let i = 0; i < len; i++) {
    const weight = (len - 1 - i) % 2 === 0 ? 3 : 1;
    sum += Number(base[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
}

const isDigits = (s: string): boolean => /^[0-9]+$/.test(s);

export function validateValue(formatId: string, raw: string): string | null {
  const value = raw.trim();

  if (formatId === 'code128') {
    for (const ch of value) {
      const code = ch.charCodeAt(0);
      if (code > 126) {
        return 'Code 128 supports ASCII characters only. Remove non-ASCII characters (curly quotes, emoji, accented letters).';
      }
      if (code < 32) return 'Code 128 does not support control characters.';
    }
    return null;
  }

  if (formatId === 'code39') {
    if (!/^[A-Z0-9\-. $/+%]*$/.test(value)) {
      return 'Code 39 supports A-Z, 0-9, space, and - . $ / + % only. Check for lowercase letters or unsupported symbols.';
    }
    return null;
  }

  if (formatId === 'ean13') {
    if (!isDigits(value) || value.length !== 13) {
      return 'EAN-13 requires exactly 13 digits.';
    }
    if (!gtinCheckDigitValid(value)) {
      return `Wrong check digit: the last digit should be ${computeGtinCheckDigit(value.slice(0, 12))}.`;
    }
    return null;
  }

  if (formatId === 'ean8') {
    if (!isDigits(value) || value.length !== 8) {
      return 'EAN-8 requires exactly 8 digits.';
    }
    if (!gtinCheckDigitValid(value)) {
      return `Wrong check digit: the last digit should be ${computeGtinCheckDigit(value.slice(0, 7))}.`;
    }
    return null;
  }

  if (formatId === 'upca') {
    if (!isDigits(value) || value.length !== 12) {
      return 'UPC-A requires exactly 12 digits.';
    }
    if (!gtinCheckDigitValid(value)) {
      return `Wrong check digit: the last digit should be ${computeGtinCheckDigit(value.slice(0, 11))}.`;
    }
    return null;
  }

  if (formatId === 'upce') {
    if (!isDigits(value) || value.length !== 8) {
      return 'UPC-E requires exactly 8 digits.';
    }
    if (value[0] !== '0' && value[0] !== '1') {
      return 'UPC-E number system (first digit) must be 0 or 1.';
    }
    // UPC-E check digits follow an expansion to UPC-A; a wrong digit is caught
    // authoritatively at render time. Structural checks are done here.
    return null;
  }

  if (formatId === 'itf' || formatId === 'itf14') {
    if (!isDigits(value)) return 'ITF requires digits only.';
    if (formatId === 'itf14') {
      if (value.length !== 14) return 'ITF-14 requires exactly 14 digits (GTIN-14).';
      if (!gtinCheckDigitValid(value)) {
        return `Wrong check digit: the last digit should be ${computeGtinCheckDigit(value.slice(0, 13))}.`;
      }
    }
    return null;
  }

  if (formatId === 'codabar') {
    if (value.length < 3) return 'Value is too short for Codabar.';
    if (!/^[A-Da-d]/.test(value[0]) || !/^[A-Da-d]$/.test(value[value.length - 1])) {
      return 'Codabar must start and end with a start/stop character (A, B, C, or D).';
    }
    if (!/^[A-Da-d][0-9\-$:.+/]+[A-Da-d]$/.test(value)) {
      return 'Codabar payload supports digits and - $ : / . + only.';
    }
    return null;
  }

  if (formatId === 'gs1-128') {
    return validateGs1Value(value);
  }

  // qrcode, datamatrix, pdf417: any non-empty text
  return null;
}

/** GS1-128 validation: parse AIs, check known lengths and GTIN check digits. */
export function validateGs1Value(value: string): string | null {
  if (!/^\(/.test(value)) {
    return 'GS1-128 values must start with an Application Identifier in parentheses, e.g. (01)09501101534003.';
  }

  const segments = value.match(/\((\d{2,4})\)[^(]*/g);
  if (!segments) {
    return 'No valid Application Identifiers found. Use the form (01)09501101534003.';
  }

  for (const segment of segments) {
    const m = /^\((\d{2,4})\)([^(]*)$/.exec(segment);
    if (!m) return `Invalid Application Identifier near "${segment.slice(0, 14)}".`;
    const ai = m[1];
    const data = m[2];
    if (data.length === 0) {
      return `Application Identifier (${ai}) has no data.`;
    }
    const spec = lookupAi(ai);
    if (spec) {
      if (spec.fixed) {
        if (!spec.fixed.includes(data.length)) {
          return `Application Identifier (${ai}) requires ${spec.fixed.join(' or ')} digits; got ${data.length}.`;
        }
        if (spec.check && isDigits(data) && !gtinCheckDigitValid(data)) {
          return `Application Identifier (${ai}) check digit is wrong: expected ${computeGtinCheckDigit(data.slice(0, -1))}.`;
        }
      } else if (spec.maxVar !== undefined && data.length > spec.maxVar) {
        return `Application Identifier (${ai}) allows at most ${spec.maxVar} characters; got ${data.length}.`;
      }
    } else if (ai.length > 2) {
      return `Unknown 3-4 digit Application Identifier (${ai}). Common AIs use 2 digits.`;
    }
  }

  return null;
}

function lookupAi(ai: string): Gs1AiSpec | undefined {
  return (
    GS1_AI_TABLE[ai] ??
    GS1_AI_TABLE[ai.slice(0, 3)] ??
    GS1_AI_TABLE[ai.slice(0, 4)] ??
    GS1_AI_TABLE[ai.slice(0, 2)]
  );
}
