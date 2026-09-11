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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { labelBudget, placeLabels } from "@atlas/core/atlas";

import { buildPlateGeometry, niceScaleDistance, type Plate } from "./plateGeometry";
import type { PlateFocus } from "./useToolPlate";

export type AtlasPlateProps = {
  plate: Plate;
  /** Highlighted county slug, when a tool opened a specific one. */
  focusSlug?: string | undefined;
  /**
   * Town/place inside a county plate. On load, the camera flies here so
   * "open Homestead" lands on Homestead — not just the county outline.
   */
  focus?: PlateFocus | undefined;
  /** Called when the reader clicks through to a county. */
  onOpenCounty?: ((slug: string, name: string) => void) | undefined;
};

/** How tight the first fly-to frame is (fraction of full plate width). */
const FOCUS_VIEW_FRACTION = 1 / 5.5;

function normalizeLabel(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

type Viewport = { x: number; y: number; width: number; height: number };

const MIN_ZOOM = 1;
const MAX_ZOOM = 40;

export function AtlasPlate({ plate, focusSlug, focus, onOpenCounty }: AtlasPlateProps) {
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

  // Reset / fly whenever the plate or focus changes. Without focus this is a
  // full-plate fit; with focus it is a town-centred frame (USA accuracy A1).
  useEffect(() => {
    if (focus && plate.plate === "county") {
      const point = geometry.toPlatePoint(focus.lon, focus.lat);
      if (point) {
        const width = base.width * FOCUS_VIEW_FRACTION;
        const height = base.height * FOCUS_VIEW_FRACTION;
        const slackX = base.width - width;
        const slackY = base.height - height;
        setView({
          width,
          height,
          x: Math.min(Math.max(point.x - width / 2, -width / 3), slackX + width / 3),
          y: Math.min(Math.max(point.y - height / 2, -height / 3), slackY + height / 3),
        });
        return;
      }
    }
    setView({ x: 0, y: 0, width: base.width, height: base.height });
  }, [plate, base.width, base.height, focus?.lon, focus?.lat, focus?.name, geometry]);

  useEffect(() => {
    const element = svgRef.current;
    if (!element || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect;
      if (rect && rect.width > 0 && rect.height > 0) setSize({ width: rect.width, height: rect.height });
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
  // Hierarchy: secondary names after light zoom; cells already show them.
  const placed = useMemo(() => {
    if (geometry.labels.length === 0) return [];
    const focusKey = focus?.name ? normalizeLabel(focus.name) : null;
    const showSecondary = zoom >= 1.35 || plate.plate !== "county";
    const showPrimaryLabels = true;
    const visible = geometry.labels.filter((label) => {
      if (label.x < view.x || label.x > view.x + view.width || label.y < view.y || label.y > view.y + view.height) {
        return false;
      }
      if (!showSecondary && label.tier === "secondary") {
        if (focusKey && normalizeLabel(label.text) === focusKey) return true;
        return false;
      }
      if (!showPrimaryLabels && label.tier === "primary") return false;
      return true;
    });
    // Zoom buys more names: denser budget when the reader is in close.
    const budgetScale = zoom >= 3 ? 1.6 : zoom >= 1.8 ? 1.25 : 1;
    return placeLabels(
      visible.map((label) => ({
        text: label.text,
        x: (label.x - view.x) * (size.width / view.width),
        y: (label.y - view.y) * (size.height / view.height),
        importance:
          focusKey && normalizeLabel(label.text) === focusKey
            ? Number.MAX_SAFE_INTEGER
            : label.importance,
        meta: label,
      })),
      {
        fontSize: labelFontSize,
        markerRadius: 2.5,
        maxLabels: Math.round(labelBudget(size.width, size.height) * budgetScale),
        bounds: { minX: 4, minY: 4, maxX: size.width - 4, maxY: size.height - 4 },
      },
    );
  }, [geometry.labels, view, size, focus?.name, labelFontSize, zoom, plate.plate]);

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

  return (
    <div className="atlas-plate">
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
        {placed.map((label) => {
          const meta = label.meta as { tier?: "seat" | "primary" | "secondary" } | undefined;
          const tier = meta?.tier;
          const isFocus =
            Boolean(focus?.name) && normalizeLabel(label.text) === normalizeLabel(focus!.name!);
          const fontSize =
            isFocus || tier === "seat"
              ? labelFontSize + 2
              : tier === "primary"
                ? labelFontSize + 0.5
                : labelFontSize - (tier === "secondary" ? 1 : 0);
          const className = [
            "atlas-plate__label",
            tier === "seat" ? "is-seat" : "",
            tier === "primary" ? "is-primary" : "",
            tier === "secondary" ? "is-secondary" : "",
            isFocus ? "is-focus" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const markClass = [
            "atlas-plate__mark",
            tier === "seat" ? "is-seat" : "",
            isFocus ? "is-focus" : "",
          ]
            .filter(Boolean)
            .join(" ");
          return (
            <span key={`${label.text}-${label.textX.toFixed(0)}-${label.textY.toFixed(0)}`}>
              <span
                className={markClass}
                style={{ left: `${label.x}px`, top: `${label.y}px` }}
              />
              <span
                className={className}
                style={{
                  left: `${label.textX}px`,
                  top: `${label.textY}px`,
                  fontSize: `${Math.max(9, fontSize)}px`,
                }}
                data-anchor={label.anchor}
                data-tier={tier ?? "unknown"}
              >
                {label.text}
              </span>
            </span>
          );
        })}
      </div>

      <div className="atlas-plate__furniture">
        <ul className="atlas-plate__legend">
          <li>
            <i className="atlas-plate__swatch is-land" aria-hidden="true" />
            land
          </li>
          <li>
            <i className="atlas-plate__swatch is-water" aria-hidden="true" />
            water
          </li>
          {plate.plate === "county" ? (
            <li>
              <i className="atlas-plate__swatch is-seat" aria-hidden="true" />
              county seat
            </li>
          ) : null}
        </ul>
        <div className="atlas-plate__measure">
          <div className="atlas-plate__scale" aria-label={`Scale bar: ${scaleBar.km} kilometres`}>
            <span className="atlas-plate__scale-bar" style={{ width: `${scaleBar.pixels}px` }} />
            <span className="atlas-plate__scale-text">
              {scaleBar.km} km
              {geometry.scaleAppliesTo === "contiguous" ? " · contiguous states" : ""}
            </span>
          </div>
          <div
            className="atlas-plate__north"
            title="North is approximate: this plate uses an equal-area projection, so meridians tilt at the edges."
          >
            <span aria-hidden="true">▲</span>
            N
          </div>
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
    </div>
  );
}
