import { extractDimensions } from '../lib/render';
import { pageSizeMm, type PrintConfig } from '../lib/printLayout';
export interface PrintSlot {
  x: number;
  y: number;
  value: string;
  lines?: string[];
  extras?: { text: string; value: string }[];
}

interface PrintPageData {
  slots: PrintSlot[];
}

interface PrintSheetProps {
  config: PrintConfig;
  pages: PrintPageData[];
  svgs: Map<string, string>;
  miniSvgs: Map<string, string>;
  labelWidthMm: number;
  labelHeightMm: number;
  showText: boolean;
}

/**
 * Renders the physical print layout: one .print-page per sheet, labels
 * absolutely positioned in mm. Hidden on screen; visible in print media
 * where the app UI is hidden. `@page` size is injected to match the paper.
 *
 * Each barcode SVG is fitted to its label with explicitly computed mm
 * dimensions (deterministic in print engines — no CSS max-height scaling),
 * and the readable value is drawn as a text line below when enabled.
 */
export function PrintSheet({ config, pages, svgs, miniSvgs, labelWidthMm, labelHeightMm, showText }: PrintSheetProps) {
  const page = pageSizeMm(config);
  const pageStyle: React.CSSProperties = {
    width: `${page.w}mm`,
    height: `${page.h}mm`,
  };

  return (
    <div className="print-root" aria-hidden="true">
      <style>{`@page { size: ${page.w}mm ${page.h}mm; margin: 0; }`}</style>
      {pages.map((p, i) => (
        <div key={i} className="print-page" style={pageStyle}>
          {p.slots.map((slot, j) => (
            <PrintLabel
              key={j}
              slot={slot}
              svgs={svgs}
              miniSvgs={miniSvgs}
              widthMm={labelWidthMm}
              heightMm={labelHeightMm}
              showText={showText}
              bordered={config.showLabelBorders}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function PrintLabel({
  slot,
  svgs,
  miniSvgs,
  widthMm,
  heightMm,
  showText,
  bordered,
}: {
  slot: PrintSlot;
  svgs: Map<string, string>;
  miniSvgs: Map<string, string>;
  widthMm: number;
  heightMm: number;
  showText: boolean;
  bordered: boolean;
}) {
  const svg = svgs.get(slot.value) ?? '';
  const { widthPx, heightPx } = extractDimensions(svg);

  // Caption lines: template fields when provided, otherwise the raw value
  // when the readable-value option is on.
  const lines = showText ? (slot.lines ?? (slot.value ? [slot.value] : [])) : [];
  const extras = showText ? (slot.extras ?? []) : [];

  // Space reserved for the caption line(s) and the field rows below.
  const captionHMm = lines.length > 0 ? 4.6 : 0;
  const rowHMm = 6.0;
  const padMm = 1.6;
  const textSpaceMm = captionHMm + extras.length * rowHMm;
  const availW = Math.max(1, widthMm - padMm * 2);
  const availH = Math.max(1, heightMm - textSpaceMm - padMm * 2);

  // Fit the main symbol into the remaining box, preserving aspect ratio.
  let wMm = availW;
  let hMm = heightPx > 0 ? (wMm * heightPx) / widthPx : availH;
  if (hMm > availH) {
    hMm = availH;
    wMm = widthPx > 0 ? (hMm * widthPx) / heightPx : availW;
  }

  const labelStyle: React.CSSProperties = {
    left: `${slot.x}mm`,
    top: `${slot.y}mm`,
    width: `${widthMm}mm`,
    height: `${heightMm}mm`,
  };

  return (
    <div
      className={`print-label${bordered ? ' print-label-bordered' : ''}`}
      style={labelStyle}
    >
      {svg ? (
        <div
          className="barcode-svg print-svg"
          style={{ width: `${wMm}mm`, height: `${hMm}mm` }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      ) : (
        <span>{slot.value}</span>
      )}
      {lines.length > 0 && (
        <div className="print-text">
          {lines.map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
      )}
      {extras.map((ex, i) => {
        const mini = miniSvgs.get(ex.value) ?? '';
        const d = extractDimensions(mini);
        let mh = 5;
        let mw = d.widthPx > 0 && d.heightPx > 0 ? (mh * d.widthPx) / d.heightPx : mh;
        const maxW = availW * 0.3;
        if (mw > maxW && d.widthPx > 0) {
          mw = maxW;
          mh = (mw * d.heightPx) / d.widthPx;
        }
        const sep = ex.text.indexOf(':');
        const name = sep > 0 ? ex.text.slice(0, sep) : '';
        const value = sep > 0 ? ex.text.slice(sep + 1).trim() : ex.text;
        return (
          <div className="print-field-row" key={i}>
            <span className="print-field-name">{name}</span>
            <span className="print-field-value">{value}</span>
            {mini ? (
              <div className="print-mini-slot">
                <div
                  className="barcode-svg print-svg print-mini"
                  style={{ width: `${mw}mm`, height: `${mh}mm` }}
                  dangerouslySetInnerHTML={{ __html: mini }}
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
