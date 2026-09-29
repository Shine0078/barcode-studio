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

