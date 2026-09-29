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
