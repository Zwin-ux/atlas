/**
 * Label placement for atlas plates.
 *
 * Printing every place name produces the mess visible in any naive map: names
 * stacked on names, the important ones buried under the trivial ones. A real
 * atlas decides two things — which names print at this scale, and where each
 * one sits so it collides with nothing.
 *
 * This does both, greedily and deterministically:
 *
 *  1. Rank candidates by importance (population), so when space runs out it is
 *     always the smaller place that is dropped. Los Angeles never loses its
 *     label to Hollister.
 *  2. Place in rank order. Each label tries a ring of candidate offsets around
 *     its anchor — right, left, above, below, then the diagonals — and takes
 *     the first that hits nothing already placed.
 *  3. If every candidate collides, the label is dropped rather than drawn on
 *     top of another. A dropped label is invisible; an overlapping pair makes
 *     both unreadable.
 *
 * Determinism matters: the same plate at the same size must produce the same
 * labels every render, or the map would flicker as it redraws.
 */

export type LabelCandidate = {
  /** Text to draw. */
  readonly text: string;
  /** Anchor position in screen units (where the place actually is). */
  readonly x: number;
  readonly y: number;
  /** Higher wins when space is contested. Population, typically. */
  readonly importance: number;
  /** Optional payload carried through to the placed result. */
  readonly meta?: unknown;
};

export type PlacedLabel = LabelCandidate & {
  /** Where the text is drawn. */
  readonly textX: number;
  readonly textY: number;
  /** SVG text-anchor for this placement. */
  readonly anchor: "start" | "middle" | "end";
  readonly box: LabelBox;
};

export type LabelBox = {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
};

export type LabelPlacementOptions = {
  /** Font size in screen units; drives box height and offsets. */
  readonly fontSize: number;
  /**
   * Average glyph width as a fraction of font size. 0.52 approximates a serif
   * face closely enough for collision purposes without measuring text.
   */
  readonly glyphAspect?: number;
  /** Padding added around each label box, in screen units. */
  readonly padding?: number;
  /** Radius of the dot drawn at the anchor, so text clears it. */
  readonly markerRadius?: number;
  /** Maximum labels to place. Undefined means "as many as fit". */
  readonly maxLabels?: number;
  /** Plate bounds; labels may not cross them. */
  readonly bounds?: LabelBox;
};

type CandidateOffset = {
  readonly dx: number;
  readonly dy: number;
  readonly anchor: "start" | "middle" | "end";
};

/**
 * Candidate positions in preference order.
 *
 * Right of the dot first: it is the convention on printed maps and reads
 * fastest left-to-right. Then left, then above and below centred, then the
 * diagonals. The order is fixed so placement is reproducible.
 */
function candidateOffsets(gap: number, fontSize: number): CandidateOffset[] {
  const rise = fontSize * 0.35;
  return [
    { dx: gap, dy: rise, anchor: "start" },
    { dx: -gap, dy: rise, anchor: "end" },
    { dx: 0, dy: -gap - fontSize * 0.15, anchor: "middle" },
    { dx: 0, dy: gap + fontSize * 0.85, anchor: "middle" },
    { dx: gap * 0.8, dy: -gap, anchor: "start" },
    { dx: -gap * 0.8, dy: -gap, anchor: "end" },
    { dx: gap * 0.8, dy: gap + fontSize * 0.7, anchor: "start" },
    { dx: -gap * 0.8, dy: gap + fontSize * 0.7, anchor: "end" },
  ];
}

function boxesOverlap(a: LabelBox, b: LabelBox): boolean {
  return !(a.maxX <= b.minX || b.maxX <= a.minX || a.maxY <= b.minY || b.maxY <= a.minY);
}

function boxWithin(box: LabelBox, bounds: LabelBox): boolean {
  return box.minX >= bounds.minX && box.maxX <= bounds.maxX && box.minY >= bounds.minY && box.maxY <= bounds.maxY;
}

/**
 * Place as many labels as fit without overlap, most important first.
 *
 * Returns only the labels that were placed. Callers should treat a short
 * result as correct behaviour at that zoom, not as an error.
 */
export function placeLabels(
  candidates: readonly LabelCandidate[],
  options: LabelPlacementOptions,
): PlacedLabel[] {
  const fontSize = options.fontSize;
  const glyphAspect = options.glyphAspect ?? 0.52;
  const padding = options.padding ?? 2;
  const markerRadius = options.markerRadius ?? 2;
  const maxLabels = options.maxLabels ?? Number.POSITIVE_INFINITY;
  const gap = markerRadius + 3;
  // Try the tight ring first, then progressively further out. A name sitting a
  // little away from its dot still reads correctly (printed atlases do this
  // constantly around crowded coastlines); a name not printed at all does not.
  // Without the wider rings, any place standing next to a long neighbouring
  // label is silently dropped.
  const offsets = [1, 2.2, 3.6].flatMap((spread) =>
    candidateOffsets(gap * spread, fontSize).map((offset) => ({
      ...offset,
      dy: offset.dy * (offset.anchor === "middle" ? spread : 1),
    })),
  );

  // Sort by importance, then by text so equal-importance places are stable.
  const ranked = [...candidates].sort(
    (a, b) => b.importance - a.importance || a.text.localeCompare(b.text),
  );

  const placed: PlacedLabel[] = [];
  const occupied: LabelBox[] = [];

  for (const candidate of ranked) {
    if (placed.length >= maxLabels) break;

    const width = candidate.text.length * fontSize * glyphAspect;
    let chosen: PlacedLabel | undefined;

    for (const offset of offsets) {
      const textX = candidate.x + offset.dx;
      const textY = candidate.y + offset.dy;

      // Convert the text origin to a box. SVG text sits on its baseline, so
      // the box extends upward by roughly the cap height.
      const left =
        offset.anchor === "start" ? textX : offset.anchor === "end" ? textX - width : textX - width / 2;
      const box: LabelBox = {
        minX: left - padding,
        minY: textY - fontSize * 0.8 - padding,
        maxX: left + width + padding,
        maxY: textY + fontSize * 0.25 + padding,
      };

      if (options.bounds && !boxWithin(box, options.bounds)) continue;
      if (occupied.some((existing) => boxesOverlap(existing, box))) continue;

      chosen = { ...candidate, textX, textY, anchor: offset.anchor, box };
      break;
    }

    if (!chosen) continue;

    // Reserve the anchor dot too, so a later label cannot land on this marker.
    occupied.push(chosen.box, {
      minX: candidate.x - markerRadius,
      minY: candidate.y - markerRadius,
      maxX: candidate.x + markerRadius,
      maxY: candidate.y + markerRadius,
    });
    placed.push(chosen);
  }

  return placed;
}

/**
 * How many places deserve a label at a given plate size.
 *
 * A plate the size of a chat widget cannot carry the same name density as a
 * printed page. Scaling with area rather than width keeps the visual density
 * roughly constant as the widget resizes.
 */
export function labelBudget(width: number, height: number, perMegaPixel = 220): number {
  const megapixels = (width * height) / 1_000_000;
  // Collision rejection is the real limiter — it refuses anything that would
  // overlap, so a generous budget cannot produce a cluttered plate. A tight one
  // can produce an empty one: at 55 per megapixel a phone-sized California
  // showed six names out of seventy-eight, and the cap, not the geometry, was
  // what stopped it. Bumped for populated county plates (more real anchors).
  return Math.max(12, Math.round(megapixels * perMegaPixel));
}
