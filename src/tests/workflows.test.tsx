import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import App from '../App';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

describe('new barcode workflows', () => {
  it('retains different captions and duplicate codes as distinct printed labels', () => {
    render(<App />);
    const input = screen.getByLabelText(/one value per line/i);
    fireEvent.change(input, { target: { value: 'ITEM-001\tFirst label\nITEM-001\tSecond label' } });
    expect(document.querySelectorAll('.print-root .print-label')).toHaveLength(2);
    const labels = Array.from(document.querySelectorAll('.print-root .print-label'));
    expect(labels[0].textContent).toContain('First label');
    expect(labels[1].textContent).toContain('Second label');
    expect(screen.getByRole('button', { name: 'Download all SVG (ZIP)' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Download all PNG (ZIP)' })).toBeTruthy();
  });

  it('allows users to generate numbered code sequences', () => {
    render(<App />);
    fireEvent.change(screen.getByLabelText('Prefix'), { target: { value: 'BOX-' } });
    fireEvent.change(screen.getByLabelText('Start'), { target: { value: '42' } });
    fireEvent.change(screen.getByLabelText('Count (max 1,000)'), { target: { value: '3' } });
    fireEvent.click(screen.getByRole('button', { name: 'Generate sequence' }));
    expect((screen.getByLabelText(/one value per line/i) as HTMLTextAreaElement).value)
      .toBe('BOX-0042\nBOX-0043\nBOX-0044');
  });

  it('prevents invalid entries from becoming printable barcodes and preserves source line references', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('radio', { name: 'EAN-13' }));
    fireEvent.change(screen.getByLabelText(/one value per line/i), { target: { value: '\n4006381333930\tInvalid label' } });
    expect(screen.getByText('Line 2')).toBeTruthy();
    expect(document.querySelectorAll('.print-root .print-label')).toHaveLength(0);
  });
});
