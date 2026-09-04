/**
 * The atlas plate.
 *
 * Pure SVG. Pan and zoom are a viewBox transform, which is why this replaced a
 * 435 KB WebGL renderer: no texture loading (the sandbox CSP blocked data-URI
 * fetches — finding G8-7), no pointer capture fighting the chat scroll
 * (finding G8-4), no context loss, and it stays crisp at any zoom because the
 * geometry is vector all the way down.
 *
 * Interaction rules, in the order they matter:
 *  - drag pans, wheel and buttons zoom, double-click zooms in
 *  - a click that did not move is a selection, not a pan
 *  - at nation and state level, clicking a county opens it
 *  - vertical drags inside the plate belong to the plate, but the chat can
 *    still scroll when the gesture starts outside it
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from "react";

import { labelBudget, placeLabels } from "@atlas/core/atlas";

import type { MapTrail } from "./AtlasMapController";
import { buildPlateGeometry, buildResearchTrailPath, niceScaleDistance, type Plate } from "./plateGeometry";

export type AtlasPlateProps = {
  plate: Plate;
  /** Highlighted county slug, when a tool opened a specific one. */
  focusSlug?: string | undefined;
  /** Called when the reader clicks through to a county. */
  onOpenCounty?: ((slug: string, name: string) => void) | undefined;
  /** Active session trail, drawn only on the national plate. */
  trail?: MapTrail | undefined;
  /** Opens a trail stop through the shared controller. */
  onOpenTrailStop?: ((index: number) => void) | undefined;
  /** Confirms that the plate and every requested trail stop reached the DOM. */
  onRendered?: ((result: { trailStopCount: number }) => void) | undefined;
  /** Coverage sentence from the tool; shown verbatim so copy stays honest. */
  coverage?: string | undefined;
};

type Viewport = { x: number; y: number; width: number; height: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 40;

export function AtlasPlate({ plate, focusSlug, onOpenCounty, trail, onOpenTrailStop, onRendered, coverage }: AtlasPlateProps) {
  const [size, setSize] = useState({ width: 640, height: 448 });

  // Rebuild when the container's proportions change so the plate always fills
  // the space it has, on a phone as well as a desktop. Laying out to a fixed
  // landscape box letterboxed a wide county into a sliver on a 390px viewport
  // and left most of the widget empty.
  const geometry = useMemo(
    () => buildPlateGeometry(plate, size.width / Math.max(size.height, 1)),
    [plate, size.width, size.height],
  );
  const base = geometry.viewBox;

  const [view, setView] = useState<Viewport>({ x: 0, y: 0, width: base.width, height: base.height });
  const svgRef = useRef<SVGSVGElement | null>(null);
  const drag = useRef<{ x: number; y: number; moved: boolean; pointerId: number } | null>(null);

  // Reset the view whenever a different plate arrives, or a zoomed-in reader
  // would land somewhere arbitrary in the new geography.
  useEffect(() => {
    setView({ x: 0, y: 0, width: base.width, height: base.height });
  }, [plate, base.width, base.height]);

  useEffect(() => {
    const element = svgRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0) setSize({ width: rect.width, height: rect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const zoom = base.width / view.width;

  const clamp = useCallback(
    (next: Viewport): Viewport => {
      const width = Math.min(base.width, Math.max(base.width / MAX_ZOOM, next.width));
      const height = width * (base.height / base.width);
      // Keep at least a third of the plate on screen so it cannot be panned
      // into empty space and lost.
      const slackX = base.width - width;
      const slackY = base.height - height;
      return {
        width,
        height,
        x: Math.min(Math.max(next.x, -width / 3), slackX + width / 3),
        y: Math.min(Math.max(next.y, -height / 3), slackY + height / 3),
      };
    },
    [base.width, base.height],
  );

  const zoomBy = useCallback(
    (factor: number, originX?: number, originY?: number) => {
      setView((current) => {
        const width = current.width / factor;
        const height = current.height / factor;
        // Zoom toward the cursor when one is given, otherwise the centre.
        const focusX = originX ?? current.x + current.width / 2;
        const focusY = originY ?? current.y + current.height / 2;
        const ratioX = (focusX - current.x) / current.width;
        const ratioY = (focusY - current.y) / current.height;
        return clamp({ x: focusX - width * ratioX, y: focusY - height * ratioY, width, height });
      });
    },
    [clamp],
  );

  /** Convert a client point to plate coordinates. */
  const toPlate = useCallback(
    (clientX: number, clientY: number) => {
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return { x: 0, y: 0 };
      return {
        x: view.x + ((clientX - rect.left) / rect.width) * view.width,
        y: view.y + ((clientY - rect.top) / rect.height) * view.height,
      };
    },
    [view],
  );

  const onPointerDown = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    drag.current = { x: event.clientX, y: event.clientY, moved: false, pointerId: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
  }, []);

  const onPointerMove = useCallback(
    (event: React.PointerEvent<SVGSVGElement>) => {
      const current = drag.current;
      if (!current) return;
      const dx = event.clientX - current.x;
      const dy = event.clientY - current.y;
      // A few pixels of slop keeps a slightly shaky click from becoming a pan.
      if (!current.moved && Math.hypot(dx, dy) < 4) return;
      current.moved = true;
      current.x = event.clientX;
      current.y = event.clientY;

      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect) return;
      setView((v) =>
        clamp({ ...v, x: v.x - (dx / rect.width) * v.width, y: v.y - (dy / rect.height) * v.height }),
      );
    },
    [clamp],
  );

  const onPointerUp = useCallback((event: React.PointerEvent<SVGSVGElement>) => {
    if (drag.current?.pointerId === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      drag.current = null;
    }
  }, []);

  const onWheel = useCallback(
    (event: React.WheelEvent<SVGSVGElement>) => {
      // Only claim the wheel once the reader is actually zoomed in, so a scroll
      // over an un-zoomed plate still scrolls the conversation.
      if (zoom <= MIN_ZOOM && event.deltaY > 0) return;
      event.preventDefault();
      const point = toPlate(event.clientX, event.clientY);
      zoomBy(event.deltaY < 0 ? 1.2 : 1 / 1.2, point.x, point.y);
    },
    [toPlate, zoomBy, zoom],
  );

  const handleCountyClick = useCallback(
    (event: React.MouseEvent, slug: string | undefined, name: string | undefined) => {
      if (drag.current?.moved) return;
      if (!slug || !onOpenCounty || plate.plate === "county") return;
      event.stopPropagation();
      onOpenCounty(slug, name ?? slug);
    },
    [onOpenCounty, plate.plate],
  );

  // Type scales with the plate; the drawn size must match what placement measured.
  const labelFontSize = Math.max(9, Math.min(12, size.width / 52));

  // Labels are placed against the *visible* window, so zooming in reveals more
  // names rather than keeping the same handful spread further apart.
  const placed = useMemo(() => {
    if (geometry.labels.length === 0) return [];
    const visible = geometry.labels.filter(
      (label) =>
        label.x >= view.x &&
        label.x <= view.x + view.width &&
        label.y >= view.y &&
        label.y <= view.y + view.height,
    );
    const scale = base.width / view.width;
    return placeLabels(
      visible.map((label) => ({
        text: label.text,
        // Place in screen space so collision boxes match what is drawn.
        x: (label.x - view.x) * (size.width / view.width),
        y: (label.y - view.y) * (size.height / view.height),
        importance: label.importance,
        meta: label,
      })),
      {
        // Type scales with the plate. At a fixed 12px a phone-width plate gave
        // labels boxes so large relative to the map that collision rejection
        // dropped all but six of California's seventy-eight names — a state map
        // with no place names on it. Clamped so it never becomes unreadable.
        fontSize: labelFontSize,
        markerRadius: 2.5,
        maxLabels: labelBudget(size.width, size.height),
        bounds: { minX: 4, minY: 4, maxX: size.width - 4, maxY: size.height - 4 },
      },
    ).map((label) => ({ ...label, scale }));
  }, [geometry.labels, view, size, base.width]);

  // Scale bar: aim for roughly a fifth of the plate width, rounded to a number
  // a person can read at a glance.
  const scaleBar = useMemo(() => {
    const kmPerScreenPx = (geometry.kmPerUnit * view.width) / Math.max(size.width, 1);
    const targetKm = kmPerScreenPx * (size.width / 5);
    const km = niceScaleDistance(targetKm);
    const pixels = km / Math.max(kmPerScreenPx, 1e-9);
    return { km, pixels: Math.min(pixels, size.width * 0.4) };
  }, [geometry.kmPerUnit, view.width, size.width]);

  const strokeScale = view.width / base.width;
  const unitsPerPixel = view.width / Math.max(size.width, 1);
  const trailStops = useMemo(
    () => plate.plate === "nation" && trail ? projectTrailStops(trail, geometry.countyCenters) : [],
    [geometry.countyCenters, plate.plate, trail],
  );
  const trailPath = buildResearchTrailPath(trailStops);

  const activateTrailStop = useCallback((index: number) => {
    onOpenTrailStop?.(index);
  }, [onOpenTrailStop]);

  useLayoutEffect(() => {
    onRendered?.({ trailStopCount: trailStops.length });
  }, [onRendered, trailStops.length]);

  return (
    <div className={`atlas-plate${trailStops.length > 0 ? " has-trail" : ""}`}>
      <svg
        ref={svgRef}
        className="atlas-plate__canvas"
        viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={
          plate.plate === "county"
            ? `Map of ${plate.name ?? "a county"}`
            : plate.plate === "state"
              ? `Map of ${plate.stateName ?? "a state"} showing its counties`
              : "Map of the United States showing every county"
        }
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={(event) => {
          const point = toPlate(event.clientX, event.clientY);
          zoomBy(1.8, point.x, point.y);
        }}
      >
        <rect
          x={view.x}
          y={view.y}
          width={view.width}
          height={view.height}
          className="atlas-plate__sea"
        />

        <g className="atlas-plate__context" strokeWidth={0.5 * strokeScale}>
          {geometry.context.map((shape, i) => (
            <path key={`context-${shape.id ?? i}`} d={shape.d}>
              {shape.label ? <title>{shape.label}</title> : null}
            </path>
          ))}
        </g>

        <g className="atlas-plate__land" strokeWidth={0.6 * strokeScale}>
          {geometry.land.map((shape, i) => (
            <path
              key={`land-${shape.id ?? i}`}
              d={shape.d}
              className={shape.id && shape.id === focusSlug ? "atlas-plate__county is-focused" : "atlas-plate__county"}
              onClick={(event) => handleCountyClick(event, shape.id, shape.label)}
            >
              {shape.label ? <title>{shape.label}</title> : null}
            </path>
          ))}
        </g>

        <g className="atlas-plate__water" strokeWidth={0.4 * strokeScale}>
          {geometry.water.map((shape, i) => (
            <path key={`water-${i}`} d={shape.d} />
          ))}
        </g>

        <g className="atlas-plate__borders" fill="none" strokeWidth={1.4 * strokeScale} strokeLinejoin="round">
          {geometry.borders.map((shape, i) => (
            <path key={`border-${shape.id ?? i}`} d={shape.d} />
          ))}
        </g>

      </svg>

      {/* Labels live in an HTML overlay rather than inside the SVG so their
          size stays constant as the plate zooms — a name that scales with the
          map becomes unreadable at both ends of the range. */}
      <div className="atlas-plate__labels" aria-hidden="true">
        {placed.map((label) => (
          <span
            key={`${label.text}-${label.textX.toFixed(0)}-${label.textY.toFixed(0)}`}
            className="atlas-plate__label"
            style={{ left: `${label.textX}px`, top: `${label.textY}px`, fontSize: `${labelFontSize}px` }}
            data-anchor={label.anchor}
          >
            {label.text}
          </span>
        ))}
        {placed.map((label) => (
          <span
            key={`dot-${label.text}-${label.x.toFixed(0)}`}
            className="atlas-plate__dot"
            style={{ left: `${label.x}px`, top: `${label.y}px` }}
          />
        ))}
      </div>

      {trailStops.length > 0 ? (
        <svg
          className="atlas-plate__trail-overlay"
          viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
          preserveAspectRatio="xMidYMid meet"
          aria-label={`Research trail: ${trail?.title ?? "Untitled trail"}`}
        >
          {trailPath ? (
            <>
              <path
                className="atlas-plate__trail-route-base"
                d={trailPath}
                fill="none"
                strokeWidth={3.25 * unitsPerPixel}
              />
              <path
                className="atlas-plate__trail-route"
                d={trailPath}
                fill="none"
                pathLength={1}
                strokeWidth={3.25 * unitsPerPixel}
              />
            </>
          ) : null}
          {trailStops.map((stop) => {
            const active = stop.index === trail?.activeIndex;
            const label = `Stop ${stop.index + 1}: ${stop.name}, ${stop.state.toUpperCase()}. ${stop.prompt}`;
            const markerRadius = 11 * unitsPerPixel;
            return (
              <g
                key={`${stop.countySlug}-${stop.index}`}
                className={`atlas-plate__trail-marker${active ? " is-active" : ""}`}
                transform={`translate(${stop.x} ${stop.y})`}
                style={{ "--atlas-trail-delay": `${140 + stop.index * 70}ms` } as CSSProperties}
                role={onOpenTrailStop ? "button" : undefined}
                tabIndex={onOpenTrailStop ? 0 : undefined}
                aria-label={label}
                aria-current={active ? "step" : undefined}
                onClick={() => activateTrailStop(stop.index)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter" && event.key !== " ") return;
                  event.preventDefault();
                  activateTrailStop(stop.index);
                }}
              >
                <title>{label}</title>
                <circle className="atlas-plate__trail-hit" r={22 * unitsPerPixel} />
                {active ? <circle className="atlas-plate__trail-active-ring" r={16 * unitsPerPixel} /> : null}
                <circle className="atlas-plate__trail-pin" r={markerRadius} />
                <text
                  className="atlas-plate__trail-number"
                  y={0.5 * unitsPerPixel}
                  fontSize={11 * unitsPerPixel}
                  textAnchor="middle"
                  dominantBaseline="middle"
                >
                  {stop.index + 1}
                </text>
              </g>
            );
          })}
        </svg>
      ) : null}

      <div className="atlas-plate__furniture">
        <div className="atlas-plate__scale" aria-label={`Scale bar: ${scaleBar.km} kilometres`}>
          <span className="atlas-plate__scale-bar" style={{ width: `${scaleBar.pixels}px` }} />
          <span className="atlas-plate__scale-text">
            {scaleBar.km} km
            {/* Alaska, Hawaii, and Puerto Rico are drawn at their own reduced
                scales, so one bar cannot describe them. Saying which part of
                the plate it measures is the honest alternative to omitting it. */}
            {geometry.scaleAppliesTo === "contiguous" ? " · contiguous states" : ""}
          </span>
        </div>
        <p className="atlas-plate__attribution">{geometry.attribution}</p>
      </div>

      <div className="atlas-plate__controls">
        <button type="button" onClick={() => zoomBy(1.6)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoomBy(1 / 1.6)} aria-label="Zoom out">
          −
        </button>
        <button
          type="button"
          onClick={() => setView({ x: 0, y: 0, width: base.width, height: base.height })}
          aria-label="Fit the whole map"
        >
          Fit
        </button>
      </div>

      {coverage ? <p className="atlas-plate__coverage">{coverage}</p> : null}
    </div>
  );
}

type ProjectedTrailStop = {
  index: number;
  countySlug: string;
  name: string;
  state: string;
  prompt: string;
  x: number;
  y: number;
};

function projectTrailStops(
  trail: MapTrail,
  countyCenters: Readonly<Record<string, { x: number; y: number }>>,
): ProjectedTrailStop[] {
  const occurrences = new Map<string, number>();
  for (const stop of trail.stops) {
    occurrences.set(stop.place.countySlug, (occurrences.get(stop.place.countySlug) ?? 0) + 1);
  }

  const seen = new Map<string, number>();
  return trail.stops.flatMap((stop, index) => {
    const center = countyCenters[stop.place.countySlug];
    if (!center) return [];
    const count = occurrences.get(stop.place.countySlug) ?? 1;
    const occurrence = seen.get(stop.place.countySlug) ?? 0;
    seen.set(stop.place.countySlug, occurrence + 1);
    const angle = count > 1 ? -Math.PI / 2 + (occurrence * Math.PI * 2) / count : 0;
    const offset = count > 1 ? 54 : 0;
    return [{
      index,
      countySlug: stop.place.countySlug,
      name: stop.place.name,
      state: stop.place.state,
      prompt: stop.prompt,
      x: center.x + Math.cos(angle) * offset,
      y: center.y + Math.sin(angle) * offset,
    }];
  });
}
