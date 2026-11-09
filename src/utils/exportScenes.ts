/** Shortest gap (seconds) kept as black; anything smaller is treated as clips touching. */
export const MIN_GAP = 1 / 30;

export interface ExportScenePiece {
  startTime: number; // timeline seconds
  duration: number;
  gap?: boolean; // black frames + silence
  item?: any; // the picture clip for non-gap pieces
}

/**
 * Lay the picture clips out on the timeline, from the earliest clip to the end of the last
 * one. `extent` widens that range (e.g. to cover audio-track clips). Empty space becomes a
 * gap piece (black + silence) so the export keeps the timeline's timing; an overlapping
 * clip is cut where the next one starts.
 */
export function layoutScenePieces(visualItems: any[], extent?: { start?: number; end?: number }): ExportScenePiece[] {
  const sorted = [...visualItems]
    .filter((v) => v && (v.duration || 0) > 0)
    .sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
  const pieces: ExportScenePiece[] = [];
  if (sorted.length === 0) return [];
  let cursor = Math.min(sorted[0].startTime || 0, extent?.start ?? Infinity);
  sorted.forEach((v, i) => {
    const start = Math.max(cursor, v.startTime || 0);
    if (start - cursor >= MIN_GAP) pieces.push({ startTime: cursor, duration: start - cursor, gap: true });
    const nextStart = i + 1 < sorted.length ? sorted[i + 1].startTime || 0 : Infinity;
    const end = Math.min((v.startTime || 0) + v.duration, nextStart);
    if (end - start >= MIN_GAP) {
      pieces.push({ startTime: start, duration: end - start, item: v });
      cursor = end;
    } else {
      cursor = Math.max(cursor, start);
    }
  });
  const end = extent?.end ?? 0;
  if (end - cursor >= MIN_GAP) pieces.push({ startTime: cursor, duration: end - cursor, gap: true });
  return pieces;
}
