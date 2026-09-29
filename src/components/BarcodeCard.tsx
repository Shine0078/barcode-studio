import { getFormat } from '../lib/formats';

interface BarcodeSvgProps {
  svg: string;
  className?: string;
}

/** Renders a bwip-js SVG string. */
export function BarcodeSvg({ svg, className }: BarcodeSvgProps) {
  return <div className={className ?? 'barcode-svg'} dangerouslySetInnerHTML={{ __html: svg }} />;
}

interface BarcodeCardProps {
  svg: string;
  value: string;
  formatId: string;
}

export function BarcodeCard({ svg, value, formatId }: BarcodeCardProps) {
  const format = getFormat(formatId);
  return (
    <figure className="barcode-item" style={{ margin: 0 }} aria-label={`${format?.label ?? formatId} for ${value}`}>
      <BarcodeSvg svg={svg} />
      <figcaption className="value-line">{value}</figcaption>
    </figure>
  );
}
