import { BarcodeSvg } from './BarcodeCard';
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
  const labelStyle: React.CSSProperties = {
    left: `${slot.x}mm`,
    top: `${slot.y}mm`,
    width: `${widthMm}mm`,
    height: `${heightMm}mm`,
  };
  return (
    <div className="print-label" style={labelStyle}>
      {svg ? <BarcodeSvg svg={svg} /> : <span>{slot.value}</span>}
      {showText && <span className="print-text">{slot.value}</span>}
    </div>
  );
}
