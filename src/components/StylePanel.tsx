import type { StyleOptions } from '../lib/styleOptions';
import { getFormat } from '../lib/formats';

interface StylePanelProps {
  formatId: string;
  style: StyleOptions;
  onChange: (patch: Partial<StyleOptions>) => void;
  onReset: () => void;
}

export function StylePanel({ formatId, style, onChange, onReset }: StylePanelProps) {
  const format = getFormat(formatId);
  const is2d = format?.family === '2d';

  return (
    <fieldset className="card">
      <legend>Appearance</legend>

      <div className="field">
        <label htmlFor="opt-scale">Module size (scale)</label>
        <input
          id="opt-scale"
          type="number"
          min={1}
          max={8}
          step={1}
          value={style.scale}
          onChange={(e) => onChange({ scale: clamp(Number(e.target.value), 1, 8) })}
        />
        <p className="hint">Width of the narrowest bar or module, 1–8.</p>
      </div>

      {!is2d && (
        <div className="field">
          <label htmlFor="opt-height">Barcode height (mm)</label>
          <input
            id="opt-height"
            type="number"
            min={5}
            max={80}
            value={style.height}
            onChange={(e) => onChange({ height: clamp(Number(e.target.value), 5, 80) })}
          />
        </div>
      )}

      {!is2d && (
        <label className="check">
          <input
            type="checkbox"
            checked={style.showText}
            onChange={(e) => onChange({ showText: e.target.checked })}
          />
          Show the value as readable text below the bars
        </label>
      )}

      {formatId === 'qrcode' && (
        <div className="field">
          <label htmlFor="opt-qr-ecc">QR error correction</label>
          <select
            id="opt-qr-ecc"
            value={style.qrEccLevel}
            onChange={(e) => onChange({ qrEccLevel: e.target.value as StyleOptions['qrEccLevel'] })}
          >
            <option value="L">L — smallest, least robust</option>
            <option value="M">M — recommended</option>
            <option value="Q">Q — very robust</option>
            <option value="H">H — most robust</option>
          </select>
        </div>
      )}

      {formatId === 'pdf417' && (
        <div className="field">
          <label htmlFor="opt-pdf-ecc">PDF417 error correction</label>
          <select
            id="opt-pdf-ecc"
            value={style.pdf417EccLevel}
            onChange={(e) => onChange({ pdf417EccLevel: Number(e.target.value) })}
          >
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
              <option key={n} value={n}>
                {n} {n === 5 ? '— recommended' : n <= 2 ? '— least robust' : n >= 7 ? '— most robust' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="row">
        <div className="field">
          <label htmlFor="opt-fg">Foreground</label>
          <input
            id="opt-fg"
            type="color"
            value={style.fgColor}
            onChange={(e) => onChange({ fgColor: e.target.value })}
          />
        </div>
        <div className="field">
          <label htmlFor="opt-bg">Background</label>
          <input
            id="opt-bg"
            type="color"
            value={style.bgColor}
            onChange={(e) => onChange({ bgColor: e.target.value })}
          />
        </div>
      </div>

      <div className="btn-row">
        <button type="button" className="btn btn-small" onClick={onReset}>
          Reset appearance
        </button>
      </div>
    </fieldset>
  );
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
}
