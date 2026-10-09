/** Parse pasted values, optionally followed by a tab-separated caption. */
export interface BarcodeInput {
  value: string;
  caption?: string;
  line: number;
}
export function parseValueLines(text: string): BarcodeInput[] {
  return text.replace(/\r\n?/g, '\n').split('\n').flatMap((raw, index) => {
    if (!raw.trim()) return [];
    const split = raw.indexOf('\t');
    const value = (split < 0 ? raw : raw.slice(0, split)).trim();
    const caption = split < 0 ? '' : raw.slice(split + 1).trim();
    return [{ value, ...(caption ? { caption } : {}), line: index + 1 }];
  });
}

/** RFC-4180 style CSV/TSV parser: quoted separators and embedded newlines work. */
export function parseDelimited(text: string): string[][] {
  const input = text.replace(/^\uFEFF/, '');
  const delimiter = input.split(/\r?\n/, 1)[0].includes('\t') ? '\t' : ',';
  const rows: string[][] = [];
  let field = '';
  let row: string[] = [];
  let quoted = false;
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (c === '"') {
      if (quoted && input[i + 1] === '"') { field += '"'; i++; }
      else if (quoted || field === '') quoted = !quoted;
      else field += c;
    } else if (!quoted && c === delimiter) {
      row.push(field); field = '';
    } else if (!quoted && (c === '\n' || c === '\r')) {
      if (c === '\r' && input[i + 1] === '\n') i++;
      row.push(field);
      if (row.some(v => v.trim())) rows.push(row);
      row = []; field = '';
    } else {
      field += c;
    }
  }
  if (quoted) throw new Error('The CSV contains an unclosed quoted field.');
  row.push(field);
  if (row.some(v => v.trim())) rows.push(row);
  return rows;
}

/** Turn the first two columns into pasteable barcode values and custom captions. */
export function csvToValueLines(text: string): string {
  const rows = parseDelimited(text);
  if (!rows.length) throw new Error('The CSV contains no barcode values.');
  const header = rows[0][0]?.trim().toLowerCase();
  const hasHeader = ['barcode', 'barcode value', 'value', 'data', 'code', 'item'].includes(header);
  const data = hasHeader ? rows.slice(1) : rows;
  if (data.length > 5000) throw new Error('Import a maximum of 5,000 rows at a time.');
  const clean = data.filter(row => row[0]?.trim()).map(row => {
    const value = row[0].trim();
    const caption = (row[1] || '').trim().replace(/[\t\r\n]+/g, ' ');
    if (/[\t\r\n]/.test(value)) throw new Error('Barcode values cannot contain tabs or line breaks.');
    return caption ? value + '\t' + caption : value;
  });
  if (!clean.length) throw new Error('The CSV contains no barcode values.');
  return clean.join('\n');
}
