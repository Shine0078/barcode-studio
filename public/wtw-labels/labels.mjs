export function parseRows(input) {
  const rows = [];
  const lines = input.split(/\r?\n/);
  for (const [index, line] of lines.entries()) {
    if (!line.trim()) continue;
    const fields = line.trim().split(/[\s,]+/);
    if (!rows.length && /^item\s+(qty|quantity)\s+coo$/i.test(fields.join(' '))) continue;
    const [item, quantity, country = 'N/A'] = fields;
    if (fields.length < 2 || fields.length > 3 || !/^[A-Za-z0-9._/-]+$/.test(item) ||
        !/^\d+$/.test(quantity) || !Number.isSafeInteger(Number(quantity)) ||
        !/^(?:[a-z]{2,3}|N\/A)$/i.test(country)) {
      throw Error('Check row ' + (index + 1) + '. Use item, whole-number quantity, and COO.');
    }
    rows.push({item, quantity, country:country.toUpperCase()});
  }
  return rows;
}

export async function makePdf(pdfLib, po, rows) {
  const doc = await pdfLib.PDFDocument.create();
  doc.setTitle('WTW from ATC — PO ' + po);
  const font = await doc.embedFont(pdfLib.StandardFonts.HelveticaBold);
  for (const row of rows) {
    const page = doc.addPage([576,288]);
    function text(value, x, baseline, size, width, center = false) {
      const fitted = Math.min(size, size * width / font.widthOfTextAtSize(value, size));
      page.drawText(value,{x:center ? (576-font.widthOfTextAtSize(value,fitted))/2 : x,
        y:288-baseline, size:fitted,font});
    }
    text('WTW from ATC',0,41.65,32,540,true);
    text('PO: '+po,0,75.47,28,540,true);
    function rule(x1, y1, x2, y2) {
      page.drawLine({start:{x:x1,y:288-y1},end:{x:x2,y:288-y2},thickness:1.875});
    }
    for (const y of [90,165.6,217.44,269.28]) rule(18,y,558,y);
    for (const x of [18.94,148.09,557.06]) rule(x,89.06,x,270.22);
    text('ITEM',30.375,139.58,34,112);
    text(row.item,159.525,141.66,40,387);
    text('COO',30.375,203.30,34,112);
    text(row.country,159.525,203.30,34,387);
    text('QTY',30.375,255.14,34,112);
    text(row.quantity,159.525,255.84,36,387);
  }
  return doc.save();
}
