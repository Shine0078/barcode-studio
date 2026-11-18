const pageWidth = 576;
const pageHeight = 288;
const countryPattern = /^(?:[a-z]{2,3}|N\/A)$/i;
const lpPattern = /^[A-Za-z0-9._/-]+$/;

export function parseRows(input) {
  const rows = [];
  for (const [index, line] of input.split(/\r?\n/).entries()) {
    if (!line.trim()) continue;

    // Keep empty clipboard cells in place so a blank COO never consumes an LP.
    const separator = line.includes('\t') ? '\t' : line.includes(',') ? ',' : /\s+/;
    const fields = line.trimEnd().split(separator).map(value => value.trim());
    if (typeof separator !== 'string' && fields[0] === '') fields.shift();

    if (rows.length === 0 && /^item\s+(qty|quantity)\s+coo(?:\s+lp)?$/i.test(fields.join(' '))) continue;
    const [item, quantity, country = '', lp = ''] = fields;
    if (fields.length < 2 || fields.length > 4 || !/^[A-Za-z0-9._/-]+$/.test(item) ||
        !/^\d+$/.test(quantity) || !Number.isSafeInteger(Number(quantity)) ||
        (country && !countryPattern.test(country))) {
      throw Error('Check row ' + (index + 1) + '. Use Item, whole-number Quantity, COO and optional LP.');
    }
    if (lp && !lpPattern.test(lp)) {
      throw Error('Check the LP on row ' + (index + 1) + '. Use letters, numbers, periods, underscores, slashes or hyphens.');
    }
    rows.push({ item, quantity, country: country.toUpperCase() || 'N/A', lp });
  }
  return rows;
}

function drawLpBarcode(page, barcode, lp) {
  const [{ sbs: widths }] = barcode.raw({ bcid: 'code128', text: lp });
  const moduleCount = widths.reduce((sum, width) => sum + width, 0);
  // Leave ten quiet modules on both sides. Keep at least three printer dots
  // per module at 203 dpi and prefer five when there is room.
  const pointPerDot = 72 / 203;
  const dotCount = Math.min(5, Math.floor(520 / ((moduleCount + 20) * pointPerDot)));
  if (dotCount < 3) throw Error('LP ' + lp + ' is too long for a readable barcode on an 8 × 4 inch label.');
  const moduleWidth = dotCount * pointPerDot;
  let x = (pageWidth - moduleCount * moduleWidth) / 2;
  for (const [index, width] of widths.entries()) {
    const size = width * moduleWidth;
    if (index % 2 === 0) page.drawRectangle({ x, y: pageHeight - 269, width: size, height: 43, borderWidth: 0 });
    x += size;
  }
}

export async function makePdf(pdfLib, po, rows, barcode) {
  const doc = await pdfLib.PDFDocument.create();
  doc.setTitle('WTW from ATC - PO ' + po);
  doc.catalog.getOrCreateViewerPreferences().setPrintScaling(pdfLib.PrintScaling.None);
  const font = await doc.embedFont(pdfLib.StandardFonts.HelveticaBold);
  for (const row of rows) {
    const page = doc.addPage([pageWidth, pageHeight]);
    function text(value, x, baseline, size, width, center = false) {
      const fitted = Math.min(size, size * width / font.widthOfTextAtSize(value, size));
      page.drawText(value, { x: center ? (pageWidth - font.widthOfTextAtSize(value, fitted)) / 2 : x,
        y: pageHeight - baseline, size: fitted, font });
    }
    function rule(x1, y1, x2, y2) {
      page.drawLine({ start: { x: x1, y: pageHeight - y1 }, end: { x: x2, y: pageHeight - y2 }, thickness: 1.875 });
    }

    const hasLp = Boolean(row.lp);
    const bounds = hasLp ? [71, 112, 153, 194] : [90, 165.6, 217.44, 269.28];
    for (const y of bounds) rule(18, y, 558, y);
    for (const x of [18.94, 148.09, 557.06]) rule(x, bounds[0] - 0.94, x, bounds.at(-1) + 0.94);

    text('WTW from ATC', 0, hasLp ? 33 : 41.65, hasLp ? 28 : 32, 540, true);
    text('PO: ' + po, 0, hasLp ? 61 : 75.47, hasLp ? 23 : 28, 540, true);
    text('ITEM', 30.375, hasLp ? 101 : 139.58, hasLp ? 25 : 34, 112);
    text(row.item, 159.525, hasLp ? 102 : 141.66, hasLp ? 29 : 40, 387);
    text('COO', 30.375, hasLp ? 142 : 203.30, hasLp ? 25 : 34, 112);
    text(row.country, 159.525, hasLp ? 142 : 203.30, hasLp ? 25 : 34, 387);
    text('QTY', 30.375, hasLp ? 183 : 255.14, hasLp ? 25 : 34, 112);
    text(row.quantity, 159.525, hasLp ? 183 : 255.84, hasLp ? 26 : 36, 387);
    if (hasLp) {
      text('LP: ' + row.lp, 0, 217, 21, 518, true);
      drawLpBarcode(page, barcode, row.lp);
    }
  }
  return doc.save();
}
