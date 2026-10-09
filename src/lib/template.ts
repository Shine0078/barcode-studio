/** Fields of a printable two-barcode warehouse product label. */
export interface TemplateEntry {
  id: number;
  item: string;
  item2: string;
  qty: string;
  coo: string;
}

export function makeEntryLines(e: TemplateEntry): string[] {
  const lines = [`ITEM: ${e.item}`];
  if (e.qty.trim()) lines.push(`QTY: ${e.qty.trim()}`);
  if (e.coo.trim()) lines.push(`COO: ${e.coo.trim()}`);
  return lines;
}

/** Caption lines for the optional second item / note label. */
export function makeEntryLines2(e: TemplateEntry): string[] {
  const lines = [`ITEM 2: ${e.item2.trim()}`];
  if (e.qty.trim()) lines.push(`QTY: ${e.qty.trim()}`);
  if (e.coo.trim()) lines.push(`COO: ${e.coo.trim()}`);
  return lines;
}

/** Rows printed under the main barcode: text + a mini Code 128 barcode each. */
export function makeEntryExtras(e: TemplateEntry): { text: string; value: string }[] {
  const extras: { text: string; value: string }[] = [];
  if (e.qty.trim()) extras.push({ text: `QTY: ${e.qty.trim()}`, value: e.qty.trim() });
  if (e.coo.trim()) extras.push({ text: `COO: ${e.coo.trim()}`, value: e.coo.trim() });
  return extras;
}
