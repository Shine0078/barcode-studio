import { cleanup, render, screen, fireEvent, waitFor } from '@testing-library/react';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
import App from '../App';
import { FORMATS } from '../lib/formats';
import { buildPages, computeGrid, DEFAULT_PRINT_CONFIG, halfPageLabel } from '../lib/printLayout';

beforeEach(() => {
  vi.stubGlobal('print', vi.fn());
  window.print = vi.fn();
});

afterEach(() => {
  cleanup();
});

describe('App', () => {
  it('renders every supported format in the type selector', () => {
    render(<App />);
    for (const f of FORMATS) {
      const radio = screen.getByRole('radio', { name: f.label });
      expect(radio).toBeTruthy();
    }
  });

  it('previews a valid default value', () => {
    render(<App />);
    // default sample for code128 (preview caption + print label)
    expect(screen.getAllByText('Hello-123').length).toBeGreaterThan(0);
    const svgs = document.querySelectorAll('.barcode-svg svg');
    expect(svgs.length).toBeGreaterThan(0);
  });

  it('shows a per-line error and never prints invalid data', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: 'EAN-13' }));
    const input = screen.getByLabelText(/one value per line/i);
    fireEvent.change(input, { target: { value: 'Good-value\n4006381333930' } });

    await waitFor(() => {
      expect(screen.getAllByText(/check digit/i).length).toBeGreaterThan(0);
    });

    // invalid line is not rendered as a barcode
    const cards = document.querySelectorAll('.barcode-item .value-line');
    for (const el of cards) {
      expect(el.textContent).not.toBe('4006381333930');
    }
  });

  it('does not open the print dialog while errors are unreviewed', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: 'EAN-13' }));
    const input = screen.getByLabelText(/one value per line/i);
    fireEvent.change(input, { target: { value: '4006381333930' } });
    await waitFor(() => expect(screen.getAllByText(/check digit/i).length).toBeGreaterThan(0));

    const printBtn = screen.getByRole('button', { name: /^Print/ });
    fireEvent.click(printBtn);
    expect(window.print).not.toHaveBeenCalled();
  });

  it('opens the native print dialog when the Print button is clicked with valid data', () => {
    render(<App />);
    const printBtn = screen.getByRole('button', { name: /^Print/ });
    fireEvent.click(printBtn);
    expect(window.print).toHaveBeenCalledTimes(1);
  });

  it('renders a dedicated print layout separate from app controls', () => {
    render(<App />);
    const printRoot = document.querySelector('.print-root');
    expect(printRoot).toBeTruthy();
    expect(printRoot!.querySelector('.print-page')).toBeTruthy();
    // the skip link and header live in .screen-only, hidden via print CSS
    const screenOnly = document.querySelector('.screen-only');
    expect(screenOnly).toBeTruthy();
    expect(screenOnly!.querySelector('h1')).toBeTruthy();
  });

  it('print CSS excludes app UI and shows only the print sheet', () => {
    const css = readFileSync(join(process.cwd(), 'src', 'styles.css'), 'utf-8');
    expect(css).toMatch(/@media print/);
    expect(css).toMatch(/\.screen-only[^{]*\{[^}]*display:\s*none/s);
    expect(css).toMatch(/\.print-root[^{]*\{[^}]*display:\s*block/s);
  });

  it('changing format resets options and samples without leaking state', () => {
    render(<App />);
    const qrRadio = screen.getByRole('radio', { name: 'QR Code' }) as HTMLInputElement;
    fireEvent.click(qrRadio);
    expect(qrRadio.checked).toBe(true);
    // sample swapped to QR example
    expect(screen.getAllByText('https://example.com').length).toBeGreaterThan(0);
  });
});

describe('template mode (Item / Qty / COO)', () => {
  afterEach(() => cleanup());

  function switchToTemplate() {
    fireEvent.click(screen.getByRole('button', { name: /product labels/i }));
  }

  it('adds an entry and prints it with ITEM/QTY/COO lines below the barcode', () => {
    render(<App />);
    switchToTemplate();
    fireEvent.change(screen.getByLabelText(/ITEM \(encoded/i), { target: { value: 'ITEM-2026-0001' } });
    fireEvent.change(screen.getByLabelText(/^Quantity/), { target: { value: '12' } });
    fireEvent.change(screen.getByLabelText(/COO/i), { target: { value: 'CN' } });
    fireEvent.click(screen.getByRole('button', { name: /add label/i }));

    // listed
    expect(screen.getAllByText('ITEM-2026-0001').length).toBeGreaterThan(0);
    // preview shows the fields
    expect(screen.getAllByText(/ITEM: ITEM-2026-0001/).length).toBeGreaterThan(0);

    // print sheet label carries the ITEM caption, the field rows and a
    // mini barcode for each of QTY and COO
    const labels = [...document.querySelectorAll('.print-root .print-label')];
    expect(labels.some((n) => (n.textContent ?? '').includes('ITEM: ITEM-2026-0001'))).toBe(true);
    const names = [...document.querySelectorAll('.print-root .print-field-name')].map((n) => n.textContent);
    const extraTexts = [...document.querySelectorAll('.print-root .print-field-value')].map((n) => n.textContent);
    expect(names).toContain('QTY');
    expect(names).toContain('COO');
    expect(extraTexts).toContain('12');
    expect(extraTexts).toContain('CN');
    const miniBarcodes = document.querySelectorAll('.print-root .print-field-row svg');
    expect(miniBarcodes.length).toBe(2);
  });

  it('rejects an invalid item with an inline message and does not add it', () => {
    render(<App />);
    switchToTemplate();
    const item = screen.getByLabelText(/ITEM \(encoded/i);
    fireEvent.change(item, { target: { value: '4006381333930' } });
    fireEvent.blur(item);
    fireEvent.click(screen.getByRole('button', { name: /add label/i }));
    // EAN-13 check digit error shown inline... default format is code128, so
    // this value is valid for code128; switch to EAN-13 first.
    cleanup();
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: 'EAN-13' }));
    switchToTemplate();
    const input = screen.getByLabelText(/ITEM \(encoded/i);
    fireEvent.change(input, { target: { value: '4006381333930' } });
    fireEvent.blur(input);
    expect(screen.getAllByText(/last digit should be/i).length).toBeGreaterThan(0);
    const before = document.querySelectorAll('.tpl-row').length;
    fireEvent.click(screen.getByRole('button', { name: /add label/i }));
    expect(document.querySelectorAll('.tpl-row').length).toBe(before);
  });

  it('prints a second label for the optional second item / note', () => {
    render(<App />);
    switchToTemplate();
    fireEvent.change(screen.getByLabelText(/ITEM \(encoded/i), { target: { value: 'HIP-001' } });
    fireEvent.change(screen.getByLabelText(/Second item/i), { target: { value: 'CARTON-A' } });
    fireEvent.change(screen.getByLabelText(/^Quantity/), { target: { value: '5' } });
    fireEvent.click(screen.getByRole('button', { name: /add label/i }));

    const labels = [...document.querySelectorAll('.print-root .print-label')];
    expect(labels).toHaveLength(2);
    const texts = labels.map((n) => n.textContent ?? '');
    expect(texts.some((t) => t.includes('ITEM: HIP-001'))).toBe(true);
    expect(texts.some((t) => t.includes('ITEM 2: CARTON-A'))).toBe(true);
    for (const t of texts) expect(t).toContain('5');
  });

