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

