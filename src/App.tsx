import { useCallback, useMemo, useRef, useState } from 'react';
import { TypeSelector } from './components/TypeSelector';
import { DataPanel } from './components/DataPanel';
import { TemplatePanel } from './components/TemplatePanel';
import { makeEntryLines, makeEntryLines2, makeEntryExtras, type TemplateEntry } from './lib/template';
import { StylePanel } from './components/StylePanel';
import { ErrorsPanel } from './components/ErrorsPanel';
import { PrintPanel } from './components/PrintPanel';
import { BarcodeCard } from './components/BarcodeCard';
import { PrintSheet } from './components/PrintSheet';
import { FORMATS, getFormat } from './lib/formats';
import { renderLine } from './lib/generate';
import { parseValueLines } from './lib/input';
import { downloadBarcodeZip, type BulkFormat } from './lib/bulkDownload';
import type { StyleOptions } from './lib/styleOptions';
import { sampleValuesFor, styleOptionsFor } from './lib/styleOptions';
import {
  DEFAULT_PRINT_CONFIG,
  buildPages,
  type LabelEntry,
  type PrintConfig,
} from './lib/printLayout';

const MAX_PREVIEW_ITEMS = 40;

type EntryMode = 'simple' | 'template';

let nextEntryId = 1;

const SAMPLE_TPL_ENTRIES: Omit<TemplateEntry, 'id'>[] = [
  { item: 'ITEM-2026-0001', item2: 'CARTON-A', qty: '12', coo: 'CN' },
  { item: 'ITEM-2026-0002', item2: '', qty: '240', coo: 'US' },
  { item: 'ITEM-2026-0003', item2: 'NOTE-FRAGILE', qty: '48', coo: 'DE' },
];

export default function App() {
  const [formatId, setFormatId] = useState('code128');
  const [mode, setMode] = useState<EntryMode>('simple');
  const [text, setText] = useState(sampleValuesFor('code128'));
  const [tplEntries, setTplEntries] = useState<TemplateEntry[]>([]);
  const [style, setStyle] = useState<StyleOptions>(() => styleOptionsFor('code128'));
  const [printConfig, setPrintConfig] = useState<PrintConfig>(DEFAULT_PRINT_CONFIG);
  const [reviewed, setReviewed] = useState(false);
  const [toast, setToast] = useState('');
  const [exportBusy, setExportBusy] = useState(false);
  const [exportError, setExportError] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const format = getFormat(formatId);

  const onFormatChange = (id: string) => {
    setFormatId(id);
    setStyle(styleOptionsFor(id));
    setText(sampleValuesFor(id));
    setTplEntries([]);
    setReviewed(false);
  };

  const onModeChange = (m: EntryMode) => {
    setMode(m);
    setReviewed(false);
  };
  /* ---------- shared render pipeline ---------- */

  const errors = useMemo(() => {
    if (mode === 'simple') {
      const out: { line: number; value: string; reason: string }[] = [];
      for (const input of parseValueLines(text)) {
        const r = renderLine(formatId, input.value, style);
        if (r.status === 'error') out.push({ line: input.line, value: r.value, reason: r.message });
      }
      return out;
    }
    return tplEntries
      .map((e, i) => {
        const r = renderLine(formatId, e.item, style);
        if (r.status === 'error') {
          return { line: i + 1, value: e.item, reason: r.message };
        }
        if (e.item2.trim()) {
          const r2 = renderLine(formatId, e.item2.trim(), style);
          if (r2.status === 'error') {
            return {
              line: i + 1,
              value: e.item2.trim(),
              reason: `Second item — ${r2.message}`,
            };
          }
        }
        return null;
      })
      .filter((x): x is { line: number; value: string; reason: string } => x !== null);
  }, [mode, text, tplEntries, formatId, style]);

  /* Simple mode data */
  const validLines = useMemo(() => {
    if (mode !== 'simple') return [];
    const out: { svg: string; value: string; caption?: string }[] = [];
    for (const input of parseValueLines(text)) {
      const r = renderLine(formatId, input.value, style);
      if (r.status === 'valid') out.push({ svg: r.svg, value: r.value, caption: input.caption });
    }
    return out;
  }, [mode, text, formatId, style]);

  /* Template mode data */
  const validEntries = useMemo(() => {
    if (mode !== 'template') return [];
    const out: { entry: TemplateEntry; svg: string; svg2?: string }[] = [];
    for (const e of tplEntries) {
      const r = renderLine(formatId, e.item, style);
      if (r.status !== 'valid') continue;
      let svg2: string | undefined;
      if (e.item2.trim()) {
        const r2 = renderLine(formatId, e.item2.trim(), style);
        if (r2.status !== 'valid') continue;
        svg2 = r2.svg;
      }
      out.push({ entry: e, svg: r.svg, svg2 });
    }
    return out;
  }, [mode, tplEntries, formatId, style]);

  const svgs = useMemo(() => {
    const m = new Map<string, string>();
    const source =
      mode === 'simple'
        ? validLines.map((v) => ({ value: v.value, svg: v.svg }))
        : validEntries.flatMap((v) => {
            const items = [{ value: v.entry.item, svg: v.svg }];
            if (v.svg2) items.push({ value: v.entry.item2.trim(), svg: v.svg2 });
            return items;
          });
    for (const v of source) if (!m.has(v.value)) m.set(v.value, v.svg);
    return m;
  }, [mode, validLines, validEntries]);

  const uniqueValid = useMemo(() => [...svgs.keys()], [svgs]);

  // Print symbols are rendered without embedded human-readable text; the
  // readable value / template fields are drawn as text lines under each barcode.
  const printSvgs = useMemo(() => {
    const m = new Map<string, string>();
    if (uniqueValid.length === 0) return m;
    const printStyle = { ...style, showText: false };
    for (const v of uniqueValid) {
      const r = renderLine(formatId, v, printStyle);
      if (r.status === 'valid') m.set(v, r.svg);
    }
    return m;
  }, [uniqueValid, formatId, style]);

  // Labels to lay out on the printed sheets.
  // Labels to print: template labels carry caption + mini-barcoded fields.
  const miniValues = useMemo(() => {
    const s = new Set<string>();
    if (mode === 'template') {
      for (const { entry } of validEntries) {
        if (entry.qty.trim()) s.add(entry.qty.trim());
        if (entry.coo.trim()) s.add(entry.coo.trim());
      }
    }
    return [...s];
  }, [mode, validEntries]);

  // Mini barcodes always use Code 128 with a compact height (proper wide
  // aspect), independent of the selected symbology for the ITEM barcode.
  const miniSvgs = useMemo(() => {
    const m = new Map<string, string>();
    for (const v of miniValues) {
      const r = renderLine('code128', v, { ...style, showText: false, scale: 2, height: 10 });
      if (r.status === 'valid') m.set(v, r.svg);
    }
    return m;
  }, [miniValues, style]);

  const printLabels = useMemo((): LabelEntry[] => {
    if (mode === 'simple') return validLines.map((v) => ({ value: v.value, ...(v.caption ? { lines: [v.caption] } : {}) }));
    const out: LabelEntry[] = [];
    for (const { entry } of validEntries) {
      const extras = makeEntryExtras(entry);
      out.push({ value: entry.item, lines: makeEntryLines(entry), extras });
      if (entry.item2.trim()) {
        out.push({ value: entry.item2.trim(), lines: makeEntryLines2(entry), extras });
      }
    }
    return out;
  }, [mode, validLines, validEntries]);

  const print = useMemo(
    () => buildPages(printLabels, printConfig.copies, printConfig),
    [printLabels, printConfig],
  );

  const previewCards =
    mode === 'simple'
      ? validLines.map((v) => ({ svg: v.svg, value: v.value, lines: v.caption ? [v.caption] : undefined }))
      : validEntries.flatMap((v) => {
          const cards = [{ svg: v.svg, value: v.entry.item, lines: makeEntryLines(v.entry) }];
          if (v.svg2) cards.push({ svg: v.svg2, value: v.entry.item2.trim(), lines: makeEntryLines2(v.entry) });
          return cards;
        });
  /* ---------- actions ---------- */

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(''), 1800);
  }, []);

  const onPrint = () => {
    window.print();
  };

  const exportAll = async (format: BulkFormat) => {
    const items = mode === 'simple'
      ? validLines
      : validEntries.flatMap((v) => [
          { value: v.entry.item, svg: v.svg },
          ...(v.svg2 ? [{ value: v.entry.item2.trim(), svg: v.svg2 }] : []),
        ]);
    setExportBusy(true);
    setExportError('');
    try {
      await downloadBarcodeZip(items, format);
    } catch (err) {
      setExportError(err instanceof Error ? err.message : 'Could not prepare the ZIP download.');
    } finally {
      setExportBusy(false);
    }
  };

  const onReview = () => {
    setReviewed(true);
    showToast('Invalid entries will be skipped. Printing valid barcodes only.');
    const el = document.getElementById('print-review-gate');
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const onFixLine = (lineIndex: number) => {
    if (mode === 'template') {
      document.getElementById('tpl-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    const ta = textareaRef.current;
    if (!ta) return;
    const all = text.split('\n');
    let start = 0;
    for (let i = 0; i < lineIndex; i++) start += all[i].length + 1;
    ta.focus();
    ta.setSelectionRange(start, start + (all[lineIndex]?.length ?? 0));
  };

  const addTplEntry = (e: Omit<TemplateEntry, 'id'>) => {
    setTplEntries((prev) => [...prev, { ...e, id: nextEntryId++ }]);
  };

  const loadTplSamples = () => {
    setTplEntries(SAMPLE_TPL_ENTRIES.map((e) => ({ ...e, id: nextEntryId++ })));
  };

  const patchStyle = (patch: Partial<StyleOptions>) => setStyle((s) => ({ ...s, ...patch }));
  const patchPrint = (patch: Partial<PrintConfig>) => setPrintConfig((c) => ({ ...c, ...patch }));

  return (
    <>
      <div className="app-shell">
        <a href="#main" className="skip-link">
          Skip to generator
        </a>

        <div className="screen-only">
        <header className="app-header">
          <div>
            <h1>Free Barcode Studio</h1>
            <p className="tagline">
              Generate, customize and print barcodes — 100% in your browser. No account, no uploads.
            </p>
          </div>
          <nav className="header-links" aria-label="Formats">
            {FORMATS.length} formats
          </nav>
        </header>

        <main className="app-main" id="main">
          <div className="col-controls">
            <TypeSelector value={formatId} onChange={onFormatChange} />

            <fieldset className="card">
              <legend>Data mode</legend>
              <div className="mode-switch" role="group" aria-label="Data entry mode">
                <button
                  type="button"
                  className={mode === 'simple' ? 'active' : ''}
                  aria-pressed={mode === 'simple'}
                  onClick={() => onModeChange('simple')}
                >
                  Values list
                </button>
                <button
                  type="button"
                  className={mode === 'template' ? 'active' : ''}
                  aria-pressed={mode === 'template'}
                  onClick={() => onModeChange('template')}
                >
                  Product labels (Item / Qty / COO)
                </button>
              </div>
            </fieldset>

            {mode === 'simple' ? (
              <DataPanel
                text={text}
                onChange={(t) => {
                  setText(t);
                  setReviewed(false);
                }}
                onSample={() => setText(sampleValuesFor(formatId))}
                textareaRef={textareaRef}
              />
            ) : (
              <TemplatePanel
                formatId={formatId}
                entries={tplEntries}
                onAdd={addTplEntry}
                onRemove={(id) => {
                  setTplEntries((prev) => prev.filter((e) => e.id !== id));
                  setReviewed(false);
                }}
                onClear={() => {
                  setTplEntries([]);
                  setReviewed(false);
                }}
                onLoadSamples={loadTplSamples}
              />
            )}

            <StylePanel
              formatId={formatId}
              style={style}
              onChange={patchStyle}
              onReset={() => setStyle(styleOptionsFor(formatId))}
            />
          </div>

          <div className="col-preview">
            <section className="card preview-card" aria-label="Barcode preview">
              <h2>Preview</h2>
              {previewCards.length === 0 && errors.length === 0 && (
                <p className="preview-empty">
                  {mode === 'simple'
                    ? 'Enter a value above to see barcodes here.'
                    : 'Add a product label above to see barcodes here.'}
                </p>
              )}
              {errors.length > 0 && (
                <div className="error-summary" role="status">
                  {mode === 'simple' ? `${errors.length} line` : `${errors.length} label`}
                  {errors.length === 1 ? '' : 's'} could not be encoded — see details below the
                  preview.
                </div>
              )}
              {previewCards.length > 0 && (
                <div className="preview-grid">
                  {previewCards.slice(0, MAX_PREVIEW_ITEMS).map((c, i) => (
                    <BarcodeCard key={i} svg={c.svg} value={c.value} formatId={formatId} lines={c.lines} />
                  ))}
                </div>
              )}
              {previewCards.length > 0 && (
                <div className="btn-row bulk-actions">
                  <button type="button" className="btn btn-small" disabled={exportBusy || previewCards.length > 500}
                    onClick={() => { void exportAll('svg'); }}>
                    {exportBusy ? 'Preparing files…' : 'Download all SVG (ZIP)'}
                  </button>
                  <button type="button" className="btn btn-small" disabled={exportBusy || previewCards.length > 500}
                    onClick={() => { void exportAll('png'); }}>
                    Download all PNG (ZIP)
                  </button>
                  {previewCards.length > 500 && <span className="field hint">ZIP download supports up to 500 barcodes at a time.</span>}
                  {exportError && <p role="alert" className="field hint" style={{ color: 'var(--danger)' }}>{exportError}</p>}
                </div>
              )}
              {previewCards.length > MAX_PREVIEW_ITEMS && (
                <p className="preview-more">
                  Showing first {MAX_PREVIEW_ITEMS} of {previewCards.length} barcodes. All of them are
                  included when printing.
                </p>
              )}
            </section>

            <ErrorsPanel errors={errors} onFix={onFixLine} />

            <PrintPanel
              config={printConfig}
              onChange={patchPrint}
              validCount={printLabels.length}
              errorCount={errors.length}
              pages={print.pageCount}
              perPage={print.perPage}
              truncated={print.truncated}
              reviewed={reviewed}
              onReview={onReview}
              onPrint={onPrint}
            />
          </div>
        </main>

        <footer className="app-footer">
          <div className="privacy-note">
            Privacy: {format?.label ?? 'Barcode'} data is processed entirely in your browser. Nothing
            is uploaded, stored, or tracked — no account required.
          </div>
          <p style={{ margin: 0 }}>
            Free Barcode Studio · powered by bwip-js (Barcode Writer in Pure JavaScript) · verify
            printed symbols with a scanner before production use.
          </p>
        </footer>

        {toast && (
          <div className="toast" role="status">
            {toast}
          </div>
        )}
        </div>
      </div>

      <PrintSheet
        config={printConfig}
        pages={print.pages}
        svgs={printSvgs}
        miniSvgs={miniSvgs}
        labelWidthMm={print.grid.labelW}
        labelHeightMm={print.grid.labelH}
        showText={printConfig.showTextOnPrint}
      />
    </>
  );
}
