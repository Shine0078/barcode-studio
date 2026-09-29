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

/** Renders the physical print layout: one .print-page per sheet, labels
 * absolutely positioned in mm. Hidden on screen; visible in print media. */
export function PrintSheet({ config, pages, svgs, labelWidthMm, labelHeightMm, showText }: PrintSheetProps) {
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
            <PrintLabel key={j} slot={slot} svgs={svgs} widthMm={labelWidthMm} heightMm={labelHeightMm} showText={showText} />
          ))}
        </div>
      ))}
    </div>
  );
}

function PrintLabel({ slot, svgs, widthMm, heightMm, showText }: {
  slot: PrintSlot;
  svgs: Map<string, string>;
  widthMm: number;
  heightMm: number;
  showText: boolean;
}) {
  const svg = svgs.get(slot.value) ?? '';
  const { widthPx, heightPx } = extractDimensions(svg);

  const lines = showText ? (slot.lines ?? (slot.value ? [slot.value] : [])) : [];
  const textSpaceMm = lines.length > 0 ? lines.length * 3.6 + 1 : 0;
  const padMm = 1.6;
  const availW = Math.max(1, widthMm - padMm * 2);
  const availH = Math.max(1, heightMm - textSpaceMm - padMm * 2);

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
    <div className="print-label" style={labelStyle}>
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
    </div>
  );
}
