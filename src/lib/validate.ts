/** Per-format value validation. Mirrors the rules BWIPP enforces at render
 * time so users get actionable messages before rendering is attempted.
 * The authoritative check happens at render time (bwip-js throws); the
 * purpose here is better error text and early feedback. */

export function gtinCheckDigitValid(digits: string): boolean {
  // Works for GTIN-8/12/13/14 (EAN-8/UPC-A/EAN-13/GTIN-14).
  // Rule: the rightmost data digit is weighted 3, alternating 1,3,1,... leftward.
  const len = digits.length;
  let sum = 0;
  for (let i = 0; i < len - 1; i++) {
    const weight = (len - 1 - i) % 2 === 1 ? 3 : 1;
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
    const weight = (len - i) % 2 === 1 ? 3 : 1;
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


  // qrcode, datamatrix, pdf417: any non-empty text
  return null;
}

/** GS1-128 validation: parse AIs, check known lengths and GTIN check digits. */