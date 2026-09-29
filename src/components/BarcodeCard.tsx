import { useState } from 'react';
import { extractDimensions } from '../lib/render';
import { copyText, downloadPng, downloadSvg, safeFilename } from '../lib/download';
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

/** Renders a bwip-js SVG string. Intrinsic size attributes keep it sharp and
 * deterministic on screen and in print; CSS max constraints fit it to its
 * container without stretching. */
export function BarcodeSvg({ svg, className }: BarcodeSvgProps) {
  return (
    <div className={className ?? 'barcode-svg'} dangerouslySetInnerHTML={{ __html: withIntrinsicSize(svg) }} />
  );
}

interface BarcodeCardProps {
  svg: string;
  value: string;
  formatId: string;
  /** Extra caption lines shown under the value (template mode). */
  lines?: string[];
}

export function BarcodeCard({ svg, value, formatId, lines }: BarcodeCardProps) {
  const [copied, setCopied] = useState(false);
  const [downloadError, setDownloadError] = useState('');
  const format = getFormat(formatId);
  const caption = lines ? lines.join('  ·  ') : value;

  const onCopy = async () => {
    await copyText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  const onPng = async () => {
    try {
      const { widthPx, heightPx } = extractDimensions(svg);
      await downloadPng(svg, widthPx, heightPx, safeFilename(value, 'png'));
      setDownloadError('');
    } catch {
      setDownloadError('PNG export failed in this browser.');
    }
  };

  return (
    <figure
      className="barcode-item"
      style={{ margin: 0 }}
      aria-label={`${format?.label ?? formatId} for ${value}${lines ? ` (${lines.join(', ')})` : ''}`}
    >
      <BarcodeSvg svg={svg} />
      <figcaption className="value-line">{caption}</figcaption>
      <div className="actions">
        <button type="button" className="btn btn-small" onClick={() => downloadSvg(svg, safeFilename(value, 'svg'))}>
          SVG
        </button>
        <button type="button" className="btn btn-small" onClick={onPng}>
          PNG
        </button>
        <button type="button" className="btn btn-small" onClick={onCopy}>
          {copied ? 'Copied' : 'Copy value'}
        </button>
      </div>
      {downloadError && (
        <p role="alert" className="field hint" style={{ color: 'var(--danger)' }}>
          {downloadError}
        </p>
      )}
    </figure>
  );
}
