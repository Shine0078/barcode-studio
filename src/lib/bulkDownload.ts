import { downloadBlob, safeFilename, svgToPngBlob } from './download';
import { extractDimensions } from './render';

export type BulkFormat = 'svg' | 'png';

/** Zip files are generated offline in the browser, with unique ordered filenames. */
export async function downloadBarcodeZip(
  items: ReadonlyArray<{ value: string; svg: string }>,
  format: BulkFormat,
): Promise<void> {
  if (!items.length) throw new Error('There are no valid barcodes to download.');
  if (items.length > 500) throw new Error('Download a maximum of 500 barcodes at once.');
  // Loaded on demand: normal barcode generation does not need the ZIP library.
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const filename = String(index + 1).padStart(4, '0') + '-' + safeFilename(item.value, format);
    if (format === 'svg') {
      zip.file(filename, item.svg);
    } else {
      const size = extractDimensions(item.svg);
      zip.file(filename, await svgToPngBlob(item.svg, size.widthPx, size.heightPx));
    }
  }
  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  downloadBlob(blob, 'barcode-studio-' + format + '.zip');
}
