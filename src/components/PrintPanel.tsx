import { computeGrid, halfPageLabel, pageSizeMm, type PrintConfig, type PaperPreset } from '../lib/printLayout';

interface PrintPanelProps {
  config: PrintConfig;
  onChange: (patch: Partial<PrintConfig>) => void;
  validCount: number;
  errorCount: number;
  pages: number;
  perPage: number;
  truncated: boolean;
  reviewed: boolean;
  onReview: () => void;
  onPrint: () => void;
}

const PRESETS: { id: PaperPreset; label: string }[] = [
  { id: 'a4', label: 'A4' },
  { id: 'letter', label: 'US Letter' },
  { id: 'a5', label: 'A5' },
  { id: '4x6', label: '4 × 6 in' },
  { id: 'custom', label: 'Custom' },
];

export function PrintPanel(props: PrintPanelProps) {
  const { config, onChange, validCount, errorCount, pages, perPage, truncated, reviewed, onReview, onPrint } = props;
  const grid = computeGrid(config);
  const isCustom = config.preset === 'custom';

  const onPrintClick = () => {
    if (errorCount > 0 && !reviewed) {
      onReview();
      return;
    }
    onPrint();
  };

  return (
    <fieldset className="card">
      <legend>Print setup</legend>

      <div className="row">
        <div className="field">
          <label htmlFor="print-preset">Paper size</label>
          <select
            id="print-preset"
            value={config.preset}
            onChange={(e) => onChange({ preset: e.target.value as PaperPreset })}
          >
            {PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="print-orientation">Orientation</label>
          <select
            id="print-orientation"
            value={config.orientation}
            onChange={(e) => onChange({ orientation: e.target.value as 'portrait' | 'landscape' })}
          >
            <option value="portrait">Portrait</option>
            <option value="landscape">Landscape</option>
          </select>
        </div>
      </div>

      {isCustom && (
        <div className="row">
          <div className="field">
            <label htmlFor="print-pw">Page width (mm)</label>
            <input
              id="print-pw"
              type="number"
              min={20}
              max={2000}
              value={config.customWidthMm}
              onChange={(e) => onChange({ customWidthMm: clamp(Number(e.target.value), 20, 2000) })}
            />
          </div>
          <div className="field">
            <label htmlFor="print-ph">Page height (mm)</label>
            <input
              id="print-ph"
              type="number"
              min={20}
              max={2000}
              value={config.customHeightMm}
              onChange={(e) => onChange({ customHeightMm: clamp(Number(e.target.value), 20, 2000) })}
            />
          </div>
        </div>
      )}

      <div className="row">
        <div className="field">
          <label htmlFor="print-margin">Page margin (mm)</label>
          <input
            id="print-margin"
            type="number"
            min={0}
            max={50}
            value={config.marginMm}
            onChange={(e) => onChange({ marginMm: clamp(Number(e.target.value), 0, 50) })}
          />
        </div>
        <div className="field">
          <label htmlFor="print-gap">Gap between labels (mm)</label>
          <input
            id="print-gap"
            type="number"
            min={0}
            max={50}
            value={config.gapMm}
            onChange={(e) => onChange({ gapMm: clamp(Number(e.target.value), 0, 50) })}
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="print-lw">Label width (mm)</label>
          <input
            id="print-lw"
            type="number"
            min={10}
            max={400}
            value={config.labelWidthMm}
            onChange={(e) => onChange({ labelWidthMm: clamp(Number(e.target.value), 10, 400) })}
          />
        </div>
        <div className="field">
          <label htmlFor="print-lh">Label height (mm)</label>
          <input
            id="print-lh"
            type="number"
            min={10}
            max={400}
            value={config.labelHeightMm}
            onChange={(e) => onChange({ labelHeightMm: clamp(Number(e.target.value), 10, 400) })}
          />
        </div>
      </div>

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-small"
          onClick={() => {
            const half = halfPageLabel(config);
            onChange({ labelWidthMm: half.w, labelHeightMm: half.h, rows: 2, cols: 1 });
          }}
        >
          Half page (2 labels per sheet)
        </button>
        <button
          type="button"
          className="btn btn-small"
          onClick={() => onChange({ labelWidthMm: 40, labelHeightMm: 40, rows: 2, cols: 1, gapMm: 10 })}
        >
          40 × 40 mm labels
        </button>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="print-rows">Rows per page</label>
          <input
            id="print-rows"
            type="number"
            min={0}
            max={40}
            value={config.rows}
            onChange={(e) => onChange({ rows: clamp(Number(e.target.value), 0, 40) })}
          />
          <p className="hint">0 = auto from label size</p>
        </div>
        <div className="field">
          <label htmlFor="print-cols">Columns per page</label>
          <input
            id="print-cols"
            type="number"
            min={0}
            max={20}
            value={config.cols}
            disabled={config.stackVertical}
            onChange={(e) => onChange({ cols: clamp(Number(e.target.value), 0, 20) })}
          />
          <p className="hint">{config.stackVertical ? 'Locked to 1 while stacking' : '0 = auto from label size'}</p>
        </div>
        <div className="field">
          <label htmlFor="print-copies">Copies per value</label>
          <input
            id="print-copies"
            type="number"
            min={1}
            max={100}
            value={config.copies}
            onChange={(e) => onChange({ copies: clamp(Number(e.target.value), 1, 100) })}
          />
        </div>
      </div>

      <label className="check">
        <input
          id="print-stack"
          type="checkbox"
          checked={config.stackVertical}
          onChange={(e) => onChange({ stackVertical: e.target.checked })}
        />
        Stack one label per row — each value prints on its own line, in the order entered
      </label>

      <label className="check">
        <input
          id="print-borders"
          type="checkbox"
          checked={config.showLabelBorders}
          onChange={(e) => onChange({ showLabelBorders: e.target.checked })}
        />
        Draw a border around each label (cut guide when pasting labels onto products)
      </label>

      <label className="check">
        <input
          id="print-showtext"
          type="checkbox"
          checked={config.showTextOnPrint}
          onChange={(e) => onChange({ showTextOnPrint: e.target.checked })}
        />
        Print the readable value below each barcode
      </label>

      {!grid.fits && (
        <div className="error-summary" role="alert">
          Labels do not fit on this page: reduce label size, margins, or increase the page size.
        </div>
      )}

      <PageThumbs config={config} />

      <div className="layout-summary">
        {grid.fits ? (
          <>
            <strong>
              {grid.cols} × {grid.rows} grid
            </strong>{' '}
            — {perPage} label{perPage === 1 ? '' : 's'} per page. {validCount} valid value
            {validCount === 1 ? '' : 's'} × {config.copies} cop{config.copies === 1 ? 'y' : 'ies'} ={' '}
            <strong>
              {pages} page{pages === 1 ? '' : 's'}
            </strong>
            .
            {truncated && ' Preview and output capped at 100 pages.'}
          </>
        ) : (
          'Adjust the layout to fit labels on the page.'
        )}
      </div>

      {errorCount > 0 && !reviewed && (
        <div className="error-summary" role="status" id="print-review-gate">
          {errorCount} invalid line{errorCount === 1 ? '' : 's'} will be skipped. Review the errors
          above, then confirm to print the valid barcodes only.
        </div>
      )}

      <div className="btn-row">
        <button
          type="button"
          className="btn btn-primary btn-lg"
          onClick={onPrintClick}
          disabled={validCount === 0 || !grid.fits}
        >
          Print {pages > 0 ? `(${pages} page${pages === 1 ? '' : 's'})` : ''}
        </button>
      </div>
      <p className="hint" style={{ marginTop: 8 }}>
        Opens your browser's print dialog — choose a printer or save as PDF. For exact sizing set
        margins to "None" and enable "Background graphics" in the dialog.
      </p>
    </fieldset>
  );
}

function PageThumb({ config }: { config: PrintConfig }) {
  const page = pageSizeMm(config);
  const grid = computeGrid(config);
  const thumbW = 170;
  const scale = thumbW / page.w;
  const thumbH = page.h * scale;

  return (
    <div>
      <div
        className="page-thumb"
        style={{ width: thumbW, height: thumbH }}
        role="img"
        aria-label={`Page preview: ${Math.round(page.w)} × ${Math.round(page.h)} mm with ${grid.cols} × ${grid.rows} labels`}
      >
        {grid.slots.map((s, i) => (
          <span
            key={i}
            className="thumb-label"
            style={{
              left: s.x * scale,
              top: s.y * scale,
              width: grid.labelW * scale,
              height: grid.labelH * scale,
            }}
          />
        ))}
      </div>
      <div className="page-caption">
        {Math.round(page.w)} × {Math.round(page.h)} mm
      </div>
    </div>
  );
}

export function PageThumbs({ config }: { config: PrintConfig }) {
  return (
    <div className="paper-preview">
      <PageThumb config={config} />
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}
