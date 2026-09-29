import { extractDimensions } from '../lib/render';
import { getFormat } from '../lib/formats';

interface BarcodeSvgProps {
  svg: string;
  className?: string;
}

/** bwip-js SVGs carry only a viewBox (no width/height attributes); Chrome's
 * print engine can collapse such SVGs to zero size, so we inject the
 * intrinsic dimensions from the viewBox. */
function withIntrinsicSize(svg: string): string {
  const m = /<svg[^>]*viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  if (!m) return svg;
  return svg.replace(/<svg\b/, `<svg width="${m[1]}" height="${m[2]}"`);
}

export function BarcodeSvg({ svg, className }: BarcodeSvgProps) {
  return (
    <div className={className ?? 'barcode-svg'} dangerouslySetInnerHTML={{ __html: withIntrinsicSize(svg) }} />
  );
}

interface BarcodeCardProps {
  svg: string;
  value: string;
  formatId: string;
}

export function BarcodeCard({ svg, value, formatId }: BarcodeCardProps) {
  const format = getFormat(formatId);
  const dims = extractDimensions(svg);
  return (
    <figure className="barcode-item" style={{ margin: 0 }} aria-label={`${format?.label ?? formatId} for ${value}`}>
      <BarcodeSvg svg={svg} />
      <figcaption className="value-line">{value}</figcaption>
      <span hidden>{dims.widthPx}</span>
    </figure>
  );
}
