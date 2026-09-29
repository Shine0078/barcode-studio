const viewBoxPattern = /viewBox="0 0 (\d+) (\d+)"/;

export function extractDimensions(svg: string): { widthPx: number; heightPx: number } {
  const match = viewBoxPattern.exec(svg);
  if (!match) return { widthPx: 0, heightPx: 0 };
  return { widthPx: Number(match[1]), heightPx: Number(match[2]) };
}
