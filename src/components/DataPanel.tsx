import { useRef, useState, type RefObject } from 'react';
import { csvToValueLines } from '../lib/input';

interface DataPanelProps {
  text: string;
  onChange: (text: string) => void;
  onSample: () => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
}

/** Every value is generated locally. CSV files are parsed without uploading. */
export function DataPanel({ text, onChange, onSample, textareaRef }: DataPanelProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [prefix, setPrefix] = useState('');
  const [suffix, setSuffix] = useState('');
  const [start, setStart] = useState(1);
  const [count, setCount] = useState(10);
  const [step, setStep] = useState(1);
  const [digits, setDigits] = useState(4);

  async function importFile(file?: File) {
    if (!file) return;
    try {
      if (file.size > 2_000_000) throw new Error('Choose a CSV or TSV file smaller than 2 MB.');
      const raw = await file.text();
      onChange(csvToValueLines(raw));
      setImportError('');
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'Could not read this file.');
    } finally {
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function generateSequence() {
    const n = Math.floor(count);
    const initial = Math.floor(start);
    const increment = Math.floor(step);
    if (![n, initial, increment].every(Number.isFinite) || n < 1 || n > 1000 || increment < 1) {
      setImportError('Enter a valid start, positive step and count between 1 and 1,000.');
      return;
    }
    const values = Array.from({ length: n }, (_, i) =>
      prefix + String(initial + i * increment).padStart(Math.max(0, Math.min(12, digits)), '0') + suffix,
    );
    onChange(values.join('\n'));
    setImportError('');
  }

  return (
    <fieldset className="card">
      <legend>Barcode value(s)</legend>
      <label htmlFor="values-input" className="field hint" style={{ display: 'block' }}>
        One value per line. To show different text below a barcode, paste a tab after its value, then the caption.
      </label>
      <textarea
        id="values-input"
        ref={textareaRef}
        value={text}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        aria-describedby="values-hint"
        placeholder={'ABC-123\nABC-124\tCustom product name'}
      />
      <p id="values-hint" className="field hint">
        Generated entirely in your browser. Nothing is uploaded or tracked.
      </p>
      <div className="btn-row">
        <button type="button" className="btn btn-small" onClick={onSample}>Load examples</button>
        <button type="button" className="btn btn-small" onClick={() => onChange('')}>Clear</button>
        <button type="button" className="btn btn-small" onClick={() => fileRef.current?.click()}>
          Import CSV / TSV
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.tsv,.txt,text/csv,text/tab-separated-values,text/plain"
          aria-label="Choose CSV or TSV file"
          style={{ display: 'none' }}
          onChange={(event) => { void importFile(event.target.files?.[0]); }}
        />
      </div>
      <p className="field hint">CSV/TSV: first column is the barcode value; optional second column is the printed caption. A recognized header row is skipped.</p>
      <details className="sequence-controls">
        <summary>Create numbered sequence</summary>
        <div className="row">
          <div className="field"><label htmlFor="seq-prefix">Prefix</label><input id="seq-prefix" value={prefix} onChange={e => setPrefix(e.target.value)} /></div>
          <div className="field"><label htmlFor="seq-suffix">Suffix</label><input id="seq-suffix" value={suffix} onChange={e => setSuffix(e.target.value)} /></div>
        </div>
        <div className="row">
          <div className="field"><label htmlFor="seq-start">Start</label><input id="seq-start" type="number" value={start} onChange={e => setStart(Number(e.target.value))} /></div>
          <div className="field"><label htmlFor="seq-step">Step</label><input id="seq-step" type="number" min="1" value={step} onChange={e => setStep(Number(e.target.value))} /></div>
        </div>
        <div className="row">
          <div className="field"><label htmlFor="seq-count">Count (max 1,000)</label><input id="seq-count" type="number" min="1" max="1000" value={count} onChange={e => setCount(Number(e.target.value))} /></div>
          <div className="field"><label htmlFor="seq-digits">Minimum digits</label><input id="seq-digits" type="number" min="0" max="12" value={digits} onChange={e => setDigits(Number(e.target.value))} /></div>
        </div>
        <button type="button" className="btn btn-small" onClick={generateSequence}>Generate sequence</button>
      </details>
      {importError && <p role="alert" className="field hint" style={{ color: 'var(--danger)' }}>{importError}</p>}
    </fieldset>
  );
}
