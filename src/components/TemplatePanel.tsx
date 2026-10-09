import { useState } from 'react';
import { validateValue } from '../lib/validate';
import { getFormat } from '../lib/formats';
import type { TemplateEntry } from '../lib/template';

interface TemplatePanelProps {
  formatId: string;
  entries: TemplateEntry[];
  onAdd: (entry: Omit<TemplateEntry, 'id'>) => void;
  onRemove: (id: number) => void;
  onClear: () => void;
  onLoadSamples: () => void;
}

export function TemplatePanel({ formatId, entries, onAdd, onRemove, onClear, onLoadSamples }: TemplatePanelProps) {
  const [item, setItem] = useState('');
  const [item2, setItem2] = useState('');
  const [qty, setQty] = useState('');
  const [coo, setCoo] = useState('');
  const [touched, setTouched] = useState(false);
  const format = getFormat(formatId);

  const itemError = item.trim() ? validateValue(formatId, item.trim()) : null;
  const item2Error = item2.trim() ? validateValue(formatId, item2.trim()) : null;
  const showItemError = touched && (itemError ?? (item.trim() ? null : 'ITEM is required.'));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!item.trim() || itemError || item2Error) return;
    onAdd({ item: item.trim(), item2: item2.trim(), qty, coo });
    setItem('');
    setItem2('');
    setQty('');
    setCoo('');
    setTouched(false);
  };

  return (
    <fieldset className="card">
      <legend>Product labels — Item / Qty / COO</legend>
      <form id="tpl-form" onSubmit={submit}>
        <div className="field">
          <label htmlFor="tpl-item">ITEM (encoded in the barcode)</label>
          <input
            id="tpl-item"
            type="text"
            value={item}
            onChange={(e) => setItem(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={format?.samples[0] ?? 'ITEM-001'}
            aria-invalid={Boolean(showItemError)}
          />
          <p className="hint">{format?.notes}</p>
          {showItemError && (
            <p className="hint" style={{ color: 'var(--danger)' }} role="alert">
              {showItemError}
            </p>
          )}
        </div>
        <div className="field">
          <label htmlFor="tpl-item2">Second item / note (optional)</label>
          <input
            id="tpl-item2"
            type="text"
            value={item2}
            onChange={(e) => setItem2(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Optional — prints a second label"
            aria-invalid={Boolean(item2Error)}
          />
          {item2Error && (
            <p className="hint" style={{ color: 'var(--danger)' }} role="alert">
              Second item: {item2Error}
            </p>
          )}
        </div>
        <div className="row">
          <div className="field">
            <label htmlFor="tpl-qty">Quantity</label>
            <input
              id="tpl-qty"
              type="text"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="12"
            />
          </div>
          <div className="field">
            <label htmlFor="tpl-coo">COO (country of origin)</label>
            <input
              id="tpl-coo"
              type="text"
              value={coo}
              onChange={(e) => setCoo(e.target.value)}
              placeholder="CN"
            />
          </div>
        </div>
        <div className="btn-row">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!item.trim() || Boolean(itemError) || Boolean(item2Error)}
          >
            Add label{item2.trim() ? 's (2)' : ''}
          </button>
          <button type="button" className="btn btn-small" onClick={onLoadSamples}>
            Load examples
          </button>
          <button type="button" className="btn btn-small" onClick={onClear} disabled={entries.length === 0}>
            Clear list
          </button>
        </div>
      </form>

      {entries.length > 0 && (
        <div style={{ marginTop: 14 }} aria-label="Label list">
          {entries.map((e, i) => {
            const err = validateValue(formatId, e.item);
            return (
              <div key={e.id} className={`tpl-row${err ? ' tpl-row-invalid' : ''}`}>
                <span className="tpl-cell-no">#{i + 1}</span>
                <span className="tpl-cell mono">
                  {e.item}
                  {e.item2 ? ` → ${e.item2}` : ''}
                </span>
                <span>QTY: {e.qty || '—'}</span>
                <span>COO: {e.coo || '—'}</span>
                <button
                  type="button"
                  className="btn btn-small"
                  onClick={() => onRemove(e.id)}
                  aria-label={`Remove label ${i + 1}`}
                >
                  ✕
                </button>
                {err && <div className="tpl-row-error">{err}</div>}
              </div>
            );
          })}
        </div>
      )}
    </fieldset>
  );
}
