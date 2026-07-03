import type { CityWorldCameraPreset, CityWorldPoint } from "./cityWorldTypes.js";

export type CityWorldProjectedPoint = {
  x: number;
  y: number;
};

export type CityWorldViewportFrame = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

export type CityWorldScreenCameraState = {
  x: number;
  y: number;
  zoom: number;
  viewportWidth: number;
  viewportHeight: number;
  paddingPx?: number;
};

export const CITY_WORLD_TILE_BASIS = {
  tileWidth: 44,
  tileHeight: 24,
  tileDepth: 18,
} as const;

export function projectCityWorldPoint(point: CityWorldPoint): CityWorldProjectedPoint {
  return {
    x: (point.x - point.y) * (CITY_WORLD_TILE_BASIS.tileWidth / 2),
    y: (point.x + point.y) * (CITY_WORLD_TILE_BASIS.tileHeight / 2) - point.z * CITY_WORLD_TILE_BASIS.tileDepth,
  };
}

export function cityWorldDiamondPoints(center: CityWorldProjectedPoint, width: number, height: number): number[] {
  return [center.x, center.y - height / 2, center.x + width / 2, center.y, center.x, center.y + height / 2, center.x - width / 2, center.y];
}

export function unprojectCityWorldGroundPoint(point: CityWorldProjectedPoint): CityWorldPoint {
  const projectedX = point.x / (CITY_WORLD_TILE_BASIS.tileWidth / 2);
  const projectedY = point.y / (CITY_WORLD_TILE_BASIS.tileHeight / 2);
  return {
    x: (projectedX + projectedY) / 2,
    y: (projectedY - projectedX) / 2,
    z: 0,
  };
}

export function cityWorldViewportFrameForCameraPreset(preset: Pick<CityWorldCameraPreset, "id" | "center" | "zoom">): CityWorldViewportFrame {
  return cityWorldViewportFrameForPreset(preset.id, preset.center, preset.zoom);
}

export function cityWorldViewportFrameForPreset(id: string, center: CityWorldPoint, zoom: number): CityWorldViewportFrame {
  const base =
    id === "mobile" ? { x: 8.5, y: 13 } : id === "residential_detail" ? { x: 7.5, y: 7 } : id === "commerce_detail" ? { x: 7.2, y: 6.2 } : { x: 15, y: 10 };
  const zoomFactor = cityWorldClamp(1 / Math.max(0.75, zoom), 0.65, 1.4);
  return {
    minX: center.x - base.x * zoomFactor,
    maxX: center.x + base.x * zoomFactor,
    minY: center.y - base.y * zoomFactor,
    maxY: center.y + base.y * zoomFactor,
  };
}

export function cityWorldPointInsideFrame(point: CityWorldPoint, frame: CityWorldViewportFrame): boolean {
  return point.x >= frame.minX && point.x <= frame.maxX && point.y >= frame.minY && point.y <= frame.maxY;
}

export function cityWorldViewportFrameForScreenCamera(camera: CityWorldScreenCameraState): CityWorldViewportFrame {
  const padding = camera.paddingPx ?? 0;
  const corners = [
    screenPointToCityWorldGround({ x: -padding, y: -padding }, camera),
    screenPointToCityWorldGround({ x: camera.viewportWidth + padding, y: -padding }, camera),
    screenPointToCityWorldGround({ x: -padding, y: camera.viewportHeight + padding }, camera),
    screenPointToCityWorldGround({ x: camera.viewportWidth + padding, y: camera.viewportHeight + padding }, camera),
  ];
  return {
    minX: roundFrameValue(Math.min(...corners.map((point) => point.x))),
    maxX: roundFrameValue(Math.max(...corners.map((point) => point.x))),
    minY: roundFrameValue(Math.min(...corners.map((point) => point.y))),
    maxY: roundFrameValue(Math.max(...corners.map((point) => point.y))),
  };
}

export function cityWorldScreenCenterForCamera(camera: CityWorldScreenCameraState): CityWorldPoint {
  return screenPointToCityWorldGround({
    x: camera.viewportWidth / 2,
    y: camera.viewportHeight / 2,
  }, camera);
}

export function cityWorldExpandViewportFrame(frame: CityWorldViewportFrame, marginTiles: number): CityWorldViewportFrame {
  return {
    minX: roundFrameValue(frame.minX - marginTiles),
    maxX: roundFrameValue(frame.maxX + marginTiles),
    minY: roundFrameValue(frame.minY - marginTiles),
    maxY: roundFrameValue(frame.maxY + marginTiles),
  };
}

export function cityWorldFrameContainsFrame(outer: CityWorldViewportFrame, inner: CityWorldViewportFrame): boolean {
  return outer.minX <= inner.minX && outer.maxX >= inner.maxX && outer.minY <= inner.minY && outer.maxY >= inner.maxY;
}

export function cityWorldSegmentTouchesFrame(start: CityWorldPoint, end: CityWorldPoint, frame: CityWorldViewportFrame): boolean {
  return cityWorldPointInsideFrame(start, frame) || cityWorldPointInsideFrame(end, frame) || cityWorldLineIntersectsFrame(start, end, frame);
}

export function cityWorldLineIntersectsFrame(start: CityWorldPoint, end: CityWorldPoint, frame: CityWorldViewportFrame): boolean {
  const minX = Math.min(start.x, end.x);
  const maxX = Math.max(start.x, end.x);
  const minY = Math.min(start.y, end.y);
  const maxY = Math.max(start.y, end.y);
  return maxX >= frame.minX && minX <= frame.maxX && maxY >= frame.minY && minY <= frame.maxY;
}

export function cityWorldPointInsideFootprint(point: CityWorldPoint, center: CityWorldPoint, width: number, depth: number): boolean {
  return Math.abs(point.x - center.x) <= width / 2 && Math.abs(point.y - center.y) <= depth / 2;
}

export function cityWorldPointDistanceToSegment(point: CityWorldPoint, start: CityWorldPoint, end: CityWorldPoint): number {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  if (dx === 0 && dy === 0) return cityWorldPointDistance(point, start);
  const t = cityWorldClamp(((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy), 0, 1);
  return Math.hypot(point.x - (start.x + t * dx), point.y - (start.y + t * dy));
}

export function cityWorldSegmentLength(start: CityWorldPoint, end: CityWorldPoint): number {
  return cityWorldPointDistance(start, end);
}

export function cityWorldPointDistance(first: CityWorldPoint, second: CityWorldPoint): number {
  return Math.hypot(second.x - first.x, second.y - first.y);
}

export function cityWorldClamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function screenPointToCityWorldGround(point: CityWorldProjectedPoint, camera: CityWorldScreenCameraState): CityWorldPoint {
  const zoom = Math.max(0.01, camera.zoom);
  return unprojectCityWorldGroundPoint({
    x: (point.x - camera.x) / zoom,
    y: (point.y - camera.y) / zoom,
  });
}

function roundFrameValue(value: number): number {
  return Math.round(value * 1000) / 1000;
}
