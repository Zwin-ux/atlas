import { describe, expect, it } from "vitest";
import { labelBudget, placeLabels, type LabelCandidate } from "../src/atlas/labels.js";

function candidate(text: string, x: number, y: number, importance: number): LabelCandidate {
  return { text, x, y, importance };
}

describe("placeLabels", () => {
  it("places isolated labels", () => {
    const placed = placeLabels(
      [candidate("Fresno", 100, 100, 500_000), candidate("Bakersfield", 400, 400, 400_000)],
      { fontSize: 12 },
    );
    expect(placed).toHaveLength(2);
  });

  it("never lets two labels overlap", () => {
    // Twelve places crowded into a tiny area — most cannot be drawn.
    const crowded = Array.from({ length: 12 }, (_, i) =>
      candidate(`Place ${i}`, 100 + (i % 3), 100 + Math.floor(i / 3), 1000 - i),
    );
    const placed = placeLabels(crowded, { fontSize: 12 });

    for (let i = 0; i < placed.length; i += 1) {
      for (let j = i + 1; j < placed.length; j += 1) {
        const a = placed[i]!.box;
        const b = placed[j]!.box;
        const overlaps = !(a.maxX <= b.minX || b.maxX <= a.minX || a.maxY <= b.minY || b.maxY <= a.minY);
        expect(overlaps).toBe(false);
      }
    }
  });

  it("drops the less important place when space is contested", () => {
    // Two places at effectively the same point. The bigger one must win.
    const placed = placeLabels(
      [
        candidate("Hollister", 200, 200, 41_000),
        candidate("Los Angeles", 201, 200, 3_900_000),
      ],
      { fontSize: 14, maxLabels: 1 },
    );

    expect(placed).toHaveLength(1);
    expect(placed[0]!.text).toBe("Los Angeles");
  });

  it("prefers placing text to the right of the marker", () => {
    const [placed] = placeLabels([candidate("Fresno", 100, 100, 1)], { fontSize: 12 });
    expect(placed!.anchor).toBe("start");
    expect(placed!.textX).toBeGreaterThan(100);
  });

  it("falls back to another side rather than dropping the label", () => {
    // Block the right-hand side with a big important label, then check the
    // second label still gets placed somewhere.
    const placed = placeLabels(
      [
        candidate("AAAAAAAAAAAAAAAAAAAA", 100, 100, 1000),
        candidate("Bee", 130, 100, 900),
      ],
      { fontSize: 12 },
    );
    expect(placed).toHaveLength(2);
    expect(placed[1]!.anchor).not.toBe("start");
  });

  it("respects plate bounds", () => {
    const bounds = { minX: 0, minY: 0, maxX: 200, maxY: 200 };
    // A place hard against the right edge cannot take the right-hand slot.
    const placed = placeLabels([candidate("Edgeville", 195, 100, 1)], { fontSize: 12, bounds });

    if (placed.length > 0) {
      expect(placed[0]!.box.maxX).toBeLessThanOrEqual(bounds.maxX);
      expect(placed[0]!.box.minX).toBeGreaterThanOrEqual(bounds.minX);
    }
  });

  it("drops labels that cannot be placed inside bounds at all", () => {
    const bounds = { minX: 0, minY: 0, maxX: 30, maxY: 30 };
    const placed = placeLabels([candidate("A very long place name indeed", 15, 15, 1)], {
      fontSize: 14,
      bounds,
    });
    expect(placed).toHaveLength(0);
  });

  it("honours maxLabels", () => {
    const many = Array.from({ length: 40 }, (_, i) => candidate(`P${i}`, i * 60, 50, 100 - i));
    expect(placeLabels(many, { fontSize: 11, maxLabels: 7 })).toHaveLength(7);
  });

  it("is deterministic across runs", () => {
    const input = Array.from({ length: 25 }, (_, i) =>
      candidate(`Place${i}`, (i * 37) % 500, (i * 53) % 300, (i * 17) % 100),
    );
    const first = placeLabels(input, { fontSize: 12 });
    const second = placeLabels(input, { fontSize: 12 });
    expect(first.map((l) => `${l.text}@${l.textX},${l.textY}`)).toEqual(
      second.map((l) => `${l.text}@${l.textX},${l.textY}`),
    );
  });

  it("breaks importance ties by name so ordering never wobbles", () => {
    const tied = [candidate("Zeta", 400, 50, 100), candidate("Alpha", 50, 50, 100)];
    const placed = placeLabels(tied, { fontSize: 12 });
    expect(placed[0]!.text).toBe("Alpha");
  });
});

describe("labelBudget", () => {
  it("scales with plate area and stays usable when tiny", () => {
    expect(labelBudget(1600, 1000)).toBeGreaterThan(labelBudget(800, 500));
    expect(labelBudget(320, 200)).toBeGreaterThanOrEqual(6);
  });
});
