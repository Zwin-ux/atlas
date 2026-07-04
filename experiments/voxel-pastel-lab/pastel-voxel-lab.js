const canvas = document.querySelector("#voxel-canvas");
const ctx = canvas.getContext("2d");

const state = {
  scene: "dense",
  detail: 2,
  light: 72,
  camera: 118,
  time: 0,
};

const authoredModules = window.ATLAS_AUTHORED_MODULES ?? {};
const authoredAssetImages = new Map();

const palette = {
  sky: "#e4f5ff",
  haze: "rgba(255, 252, 235, 0.08)",
  grassTop: "#c6efa3",
  grassTop2: "#d7f6b9",
  grassLeft: "#8cca73",
  grassRight: "#9cdb82",
  grassEdge: "#6dac60",
  plotTop: "#f6e8bd",
  plotLeft: "#d2ba73",
  plotRight: "#e3ce8b",
  stoneTop: "#f4e7c8",
  stoneLeft: "#c8b281",
  stoneRight: "#ddc897",
  woodTop: "#c78f55",
  woodLeft: "#875b39",
  woodRight: "#a26f45",
  glassTop: "#fff4be",
  glassLeft: "#e1c878",
  glassRight: "#f2dd93",
  ink: "rgba(42, 64, 62, 0.15)",
  softInk: "rgba(42, 64, 62, 0.08)",
  shadow: "rgba(45, 67, 61, 0.26)",
};

const roadRamp = {
  asphalt: { top: "#9eb4ad", left: "#6f8b86", right: "#829b96" },
  curb: { top: "#f3e5c4", left: "#c4ad79", right: "#dcc790" },
  sidewalk: { top: "#f7ecca", left: "#cab17c", right: "#dec994" },
  lot: { top: "#d7ccb2", left: "#a99b7a", right: "#c0b08a" },
  shadow: "rgba(46, 64, 58, 0.16)",
};

const wallRamps = {
  cream: { top: "#fff0bf", left: "#d8bc7c", right: "#ecd39a" },
  peach: { top: "#ffd0a4", left: "#d3966d", right: "#ebb085" },
  mint: { top: "#c9ecd0", left: "#8bc5a0", right: "#a8d9b6" },
};

const roofRamps = {
  terracotta: { top: "#ef8069", left: "#bf5147", right: "#d76455" },
  honey: { top: "#f6d462", left: "#b99637", right: "#dab447" },
  slate: { top: "#77b8d5", left: "#4b87a8", right: "#61a0bf" },
};

const commercialRamps = {
  linen: { top: "#fff0c4", left: "#d4bc82", right: "#ead39a" },
  blush: { top: "#ffd0b8", left: "#d99680", right: "#efb198" },
  sage: { top: "#cfe8c9", left: "#91bd8f", right: "#add2a7" },
  powder: { top: "#cbe5ed", left: "#8db4c0", right: "#a8ccd5" },
  clay: { top: "#e5b58c", left: "#a9795d", right: "#c08d6d" },
};

const accentRamps = {
  teal: { top: "#78d0bd", left: "#3d948d", right: "#56b5a8" },
  coral: { top: "#ff9e82", left: "#c46156", right: "#e37967" },
  plum: { top: "#c3a7dc", left: "#8567a8", right: "#a586c7" },
  gold: { top: "#f7d56e", left: "#b89238", right: "#d6b24c" },
  blue: { top: "#9fd5ef", left: "#5c9bbb", right: "#80bed9" },
};

const glassRamp = {
  top: "#d9f4f3",
  left: "#88bbc2",
  right: "#a9d5d8",
};

const cottageSpecs = {
  front: {
    label: "front-gable",
    width: 1.28,
    depth: 1.08,
    wallHeight: 0.72,
    roofHeight: 0.42,
    roofAxis: "y",
  },
  side: {
    label: "side-gable",
    width: 1.38,
    depth: 1.02,
    wallHeight: 0.66,
    roofHeight: 0.34,
    roofAxis: "x",
  },
  l: {
    label: "l-footprint",
    width: 1.42,
    depth: 1.14,
    wallHeight: 0.68,
    roofHeight: 0.36,
    roofAxis: "x",
  },
};

const scenes = {
  dense: {
    board: { width: 10, depth: 10 },
    view: { originX: 0.55, originY: 0.12, mobileOriginY: 0.18 },
    ground: [
      { type: "roadStraight", x: -0.1, y: 3.05, length: 10.2, axis: "x" },
      { type: "roadStraight", x: -0.1, y: 6.15, length: 10.2, axis: "x" },
      { type: "roadStraight", x: 4.08, y: -0.1, length: 10.2, axis: "y" },
      { type: "roadStraight", x: 7.08, y: -0.1, length: 9.4, axis: "y" },
      { type: "roadCross", x: 3.72, y: 2.72 },
      { type: "roadCross", x: 6.72, y: 2.72 },
      { type: "authoredGroundModule", key: "road.corner.two_lane.v1", x: 3.72, y: 5.82 },
      { type: "roadCross", x: 6.72, y: 5.82 },
      { type: "crosswalk", x: 3.46, y: 2.72, axis: "x" },
      { type: "crosswalk", x: 6.46, y: 5.82, axis: "x" },
      { type: "crosswalk", x: 4.72, y: 3.46, axis: "y" },
      { type: "sidewalk", x: 0.48, y: 2.76, length: 3.2, axis: "x" },
      { type: "sidewalk", x: 4.96, y: 2.76, length: 4.3, axis: "x" },
      { type: "sidewalk", x: 0.52, y: 5.86, length: 3.2, axis: "x" },
      { type: "sidewalk", x: 4.88, y: 5.86, length: 4.5, axis: "x" },
      { type: "sidewalk", x: 3.78, y: 0.52, length: 2.0, axis: "y" },
      { type: "sidewalk", x: 6.78, y: 0.48, length: 2.1, axis: "y" },
      { type: "sidewalk", x: 3.78, y: 6.98, length: 2.2, axis: "y" },
      { type: "sidewalk", x: 6.78, y: 7.08, length: 1.6, axis: "y" },
      { type: "resLot", x: 0.54, y: 0.5, width: 2.25, depth: 1.34 },
      { type: "resLot", x: 2.3, y: 0.62, width: 1.95, depth: 1.22 },
      { type: "resLot", x: 5.0, y: 0.56, width: 1.9, depth: 1.22 },
      { type: "resLot", x: 7.74, y: 0.54, width: 1.78, depth: 1.2 },
      { type: "comLot", x: 0.48, y: 3.64, width: 3.12, depth: 1.36, stripes: 2 },
      { type: "comLot", x: 4.72, y: 3.62, width: 1.8, depth: 1.28, stripes: 1 },
      { type: "comLot", x: 7.48, y: 3.58, width: 1.9, depth: 1.28, stripes: 1 },
      { type: "resLot", x: 0.64, y: 6.72, width: 1.85, depth: 1.28 },
      { type: "resLot", x: 2.78, y: 6.78, width: 2.02, depth: 1.22 },
      { type: "comLot", x: 5.2, y: 6.74, width: 2.5, depth: 1.52, stripes: 2 },
      { type: "resLot", x: 8.0, y: 6.84, width: 1.58, depth: 1.18 },
      { type: "resLot", x: 0.54, y: 8.12, width: 1.78, depth: 1.16 },
      { type: "resLot", x: 2.6, y: 8.08, width: 1.95, depth: 1.22 },
      { type: "driveway", x: 1.18, y: 1.86, axis: "y", length: 0.82 },
      { type: "driveway", x: 5.58, y: 1.82, axis: "y", length: 0.72 },
      { type: "driveway", x: 8.46, y: 1.76, axis: "y", length: 0.78 },
      { type: "driveway", x: 1.08, y: 5.1, axis: "y", length: 0.62 },
      { type: "driveway", x: 5.78, y: 5.0, axis: "y", length: 0.62 },
      { type: "driveway", x: 8.16, y: 5.0, axis: "y", length: 0.62 },
      { type: "driveway", x: 1.22, y: 6.02, axis: "y", length: 0.58 },
      { type: "driveway", x: 3.42, y: 6.0, axis: "y", length: 0.58 },
      { type: "driveway", x: 6.02, y: 6.0, axis: "y", length: 0.58 },
      { type: "driveway", x: 1.02, y: 7.18, axis: "y", length: 0.82 },
      { type: "driveway", x: 3.22, y: 7.12, axis: "y", length: 0.86 },
    ],
    modules: [
      { type: "rowhome", x: 0.72, y: 0.62, units: 4, walls: ["cream", "mint", "peach", "cream"], roofs: ["terracotta", "honey", "slate", "terracotta"], roof: "stepped" },
      { type: "apartment", x: 2.55, y: 0.68, wall: "mint", roof: "honey", levels: 3 },
      { type: "cottage", form: "l", x: 5.16, y: 0.68, wall: "cream", roof: "slate" },
      { type: "ranch", x: 7.82, y: 0.68, wall: "peach", roof: "terracotta", wing: "left" },
      { type: "authoredModule", key: "building.store.strip.three_bay.v1", x: 0.68, y: 3.72 },
      { type: "cafe", x: 4.94, y: 3.74, wall: "blush", accent: "coral", warm: true },
      { type: "cornerStore", x: 7.66, y: 3.72, wall: "sage", accent: "gold", entry: "left", compact: true },
      { type: "cottage", form: "front", x: 0.84, y: 6.84, wall: "cream", roof: "terracotta" },
      { type: "authoredModule", key: "building.house.rowhome.flat_parapet.v1", x: 2.9, y: 6.9 },
      { type: "gym", x: 5.38, y: 6.82, wall: "powder", accent: "blue", entry: "center", compact: true },
      { type: "cottage", form: "side", x: 8.08, y: 6.94, wall: "mint", roof: "honey" },
      { type: "cottage", form: "front", x: 0.74, y: 8.22, wall: "peach", roof: "slate" },
      { type: "apartment", x: 2.82, y: 8.18, wall: "cream", roof: "terracotta", levels: 2 },
    ],
  },
  straight: {
    board: { width: 8, depth: 5 },
    ground: [
      { type: "roadStraight", x: -0.1, y: 2.05, length: 8.2, axis: "x" },
      { type: "sidewalk", x: 0.35, y: 1.78, length: 3.2, axis: "x" },
      { type: "sidewalk", x: 4.15, y: 2.98, length: 2.8, axis: "x" },
      { type: "driveway", x: 1.24, y: 1.28, axis: "y", length: 0.78 },
      { type: "driveway", x: 5.06, y: 2.96, axis: "y", length: 0.72 },
      { type: "resLot", x: 0.72, y: 0.72, width: 2.28, depth: 1.44 },
      { type: "comLot", x: 4.44, y: 2.76, width: 2.88, depth: 1.38, stripes: 3 },
    ],
    modules: [
      { type: "ranch", x: 0.92, y: 0.82, wall: "cream", roof: "terracotta", wing: "right" },
      { type: "stripStore", x: 4.66, y: 2.84, wall: "linen", accents: ["teal", "coral", "gold"], roof: "blue", compact: true },
    ],
  },
  turn: {
    board: { width: 7, depth: 6 },
    ground: [
      { type: "roadCorner", x: 2.05, y: 2.05, turn: "se" },
      { type: "roadStraight", x: -0.1, y: 2.05, length: 2.35, axis: "x" },
      { type: "roadStraight", x: 2.05, y: 2.05, length: 3.9, axis: "y" },
      { type: "sidewalk", x: 0.48, y: 1.78, length: 1.62, axis: "x" },
      { type: "sidewalk", x: 2.92, y: 2.56, length: 2.0, axis: "y" },
      { type: "driveway", x: 1.14, y: 1.28, axis: "y", length: 0.78 },
      { type: "driveway", x: 4.05, y: 3.0, axis: "x", length: 0.82 },
      { type: "resLot", x: 0.78, y: 0.72, width: 2.08, depth: 1.36 },
      { type: "comLot", x: 3.62, y: 3.18, width: 2.46, depth: 1.42, stripes: 2 },
    ],
    modules: [
      { type: "cottage", form: "side", x: 0.94, y: 0.82, wall: "mint", roof: "slate" },
      { type: "cornerStore", x: 3.82, y: 3.24, wall: "blush", accent: "coral", entry: "left" },
    ],
  },
  cross: {
    board: { width: 8, depth: 6 },
    ground: [
      { type: "roadCross", x: 3.1, y: 2.1, variant: "cross" },
      { type: "roadStraight", x: -0.1, y: 2.1, length: 3.35, axis: "x" },
      { type: "roadStraight", x: 4.0, y: 2.1, length: 4.2, axis: "x" },
      { type: "roadStraight", x: 3.1, y: -0.1, length: 2.35, axis: "y" },
      { type: "roadStraight", x: 3.1, y: 3.0, length: 3.0, axis: "y" },
      { type: "crosswalk", x: 2.8, y: 1.78, axis: "x" },
      { type: "crosswalk", x: 3.82, y: 2.82, axis: "y" },
      { type: "sidewalk", x: 0.55, y: 1.83, length: 2.1, axis: "x" },
      { type: "sidewalk", x: 4.7, y: 3.0, length: 2.0, axis: "x" },
      { type: "comLot", x: 0.68, y: 0.58, width: 2.46, depth: 1.34, stripes: 2 },
      { type: "resLot", x: 4.78, y: 3.36, width: 2.0, depth: 1.34 },
    ],
    modules: [
      { type: "cafe", x: 0.86, y: 0.66, wall: "linen", accent: "coral", warm: true },
      { type: "ranch", x: 4.98, y: 3.42, wall: "peach", roof: "honey", wing: "none" },
    ],
  },
  lots: {
    board: { width: 8, depth: 5 },
    ground: [
      { type: "roadStraight", x: -0.1, y: 2.78, length: 8.2, axis: "x" },
      { type: "sidewalk", x: 0.42, y: 2.48, length: 6.8, axis: "x" },
      { type: "resLot", x: 0.72, y: 0.7, width: 1.98, depth: 1.34 },
      { type: "resLot", x: 2.86, y: 0.82, width: 1.96, depth: 1.28 },
      { type: "comLot", x: 4.94, y: 0.82, width: 2.54, depth: 1.56, stripes: 3 },
      { type: "driveway", x: 1.28, y: 1.98, axis: "y", length: 0.82 },
      { type: "driveway", x: 3.42, y: 2.02, axis: "y", length: 0.74 },
      { type: "driveway", x: 5.74, y: 2.24, axis: "y", length: 0.58 },
    ],
    modules: [
      { type: "cottage", form: "front", x: 0.92, y: 0.82, wall: "cream", roof: "terracotta" },
      { type: "ranch", x: 3.02, y: 0.94, wall: "mint", roof: "slate", wing: "left" },
      { type: "gym", x: 5.12, y: 0.94, wall: "powder", accent: "blue", entry: "center", compact: true },
    ],
  },
  corner: {
    board: { width: 7, depth: 5 },
    modules: [
      { type: "cornerStore", x: 0.86, y: 0.78, wall: "linen", accent: "teal", entry: "right" },
      { type: "cornerStore", x: 3.16, y: 0.94, wall: "blush", accent: "coral", entry: "left" },
      { type: "cornerStore", x: 1.96, y: 3.08, wall: "sage", accent: "blue", entry: "right", compact: true },
      { type: "cornerStore", x: 4.68, y: 2.92, wall: "powder", accent: "gold", entry: "left" },
    ],
  },
  strip: {
    board: { width: 8, depth: 5 },
    modules: [
      { type: "stripStore", x: 0.72, y: 0.82, wall: "linen", accents: ["teal", "coral", "gold"], roof: "blue" },
      { type: "stripStore", x: 3.22, y: 2.95, wall: "clay", accents: ["plum", "teal", "blue"], roof: "honey", compact: true },
    ],
  },
  cafe: {
    board: { width: 7, depth: 5 },
    modules: [
      { type: "cafe", x: 0.94, y: 0.82, wall: "linen", accent: "coral", warm: true },
      { type: "cafe", x: 3.08, y: 0.98, wall: "sage", accent: "gold", mirror: true },
      { type: "cafe", x: 1.82, y: 3.08, wall: "blush", accent: "teal", warm: true },
      { type: "cafe", x: 4.48, y: 2.98, wall: "powder", accent: "plum", mirror: true },
    ],
  },
  gym: {
    board: { width: 8, depth: 5 },
    modules: [
      { type: "gym", x: 0.78, y: 0.84, wall: "powder", accent: "blue", entry: "center" },
      { type: "gym", x: 3.74, y: 0.98, wall: "sage", accent: "teal", entry: "left", compact: true },
      { type: "gym", x: 1.74, y: 3.04, wall: "clay", accent: "plum", entry: "right" },
    ],
  },
  cottages: {
    board: { width: 6, depth: 5 },
    modules: [
      { type: "cottage", form: "front", x: 0.82, y: 0.82, wall: "cream", roof: "terracotta" },
      { type: "cottage", form: "side", x: 3.05, y: 0.98, wall: "peach", roof: "honey" },
      { type: "cottage", form: "l", x: 2.02, y: 2.95, wall: "mint", roof: "slate" },
    ],
  },
  ranch: {
    board: { width: 7, depth: 5 },
    modules: [
      { type: "ranch", x: 0.74, y: 0.82, wall: "cream", roof: "terracotta", wing: "right" },
      { type: "ranch", x: 3.72, y: 0.92, wall: "mint", roof: "slate", wing: "left" },
      { type: "ranch", x: 1.18, y: 3.05, wall: "peach", roof: "honey", wing: "none" },
      { type: "ranch", x: 4.42, y: 3.02, wall: "cream", roof: "honey", wing: "right" },
    ],
  },
  rowhomes: {
    board: { width: 7, depth: 5 },
    modules: [
      { type: "rowhome", x: 0.78, y: 0.92, units: 4, walls: ["cream", "peach", "mint", "cream"], roofs: ["terracotta", "honey", "slate", "terracotta"], roof: "stepped" },
      { type: "rowhome", x: 1.28, y: 3.08, units: 3, walls: ["mint", "cream", "peach"], roofs: ["slate", "honey", "terracotta"], roof: "parapet" },
    ],
  },
  apartments: {
    board: { width: 7, depth: 5 },
    modules: [
      { type: "apartment", x: 0.82, y: 0.88, wall: "cream", roof: "slate", levels: 2 },
      { type: "apartment", x: 3.46, y: 0.86, wall: "mint", roof: "honey", levels: 3 },
      { type: "apartment", x: 2.08, y: 3.08, wall: "peach", roof: "terracotta", levels: 2 },
    ],
  },
  palettes: {
    board: { width: 6, depth: 5 },
    modules: [
      { type: "cottage", form: "front", x: 0.82, y: 0.82, wall: "cream", roof: "terracotta" },
      { type: "cottage", form: "side", x: 3.05, y: 0.98, wall: "peach", roof: "honey" },
      { type: "cottage", form: "l", x: 2.02, y: 2.95, wall: "mint", roof: "slate" },
    ],
  },
  clone: {
    board: { width: 6, depth: 5 },
    modules: [
      { type: "cottage", form: "front", x: 0.72, y: 0.82, wall: "cream", roof: "terracotta" },
      { type: "cottage", form: "front", x: 2.52, y: 0.92, wall: "peach", roof: "honey", mirror: true },
      { type: "cottage", form: "front", x: 4.22, y: 1.05, wall: "mint", roof: "slate" },
      { type: "cottage", form: "side", x: 1.15, y: 3.05, wall: "cream", roof: "honey" },
      { type: "cottage", form: "side", x: 3.62, y: 3.02, wall: "peach", roof: "terracotta", mirror: true },
    ],
  },
};

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(320, window.innerWidth);
  const height = Math.max(320, window.innerHeight);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  draw();
}

function iso(x, y, z = 0) {
  const scene = scenes[state.scene];
  const tileW = state.camera;
  const tileH = state.camera * 0.5;
  const boardCenterX = (scene.board.width - scene.board.depth) * tileW * 0.25;
  const mobile = window.innerWidth < 720;
  const originXRatio = mobile ? 0.5 : (scene.view?.originX ?? 0.6);
  const originYRatio = mobile ? (scene.view?.mobileOriginY ?? 0.19) : (scene.view?.originY ?? 0.18);
  const originX = window.innerWidth * originXRatio - boardCenterX;
  const originY = window.innerHeight * originYRatio;
  return {
    x: originX + (x - y) * tileW * 0.5,
    y: originY + (x + y) * tileH * 0.5 - z * (state.camera * 0.42),
  };
}

function poly(points, fill, stroke = palette.ink, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
}

function strokeLine(a, b, color, width, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function ellipse(cx, cy, rx, ry, fill, alpha = 1) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.restore();
}

function shade(color, amount) {
  const hex = color.replace("#", "");
  const value = Number.parseInt(hex, 16);
  const r = Math.max(0, Math.min(255, (value >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((value >> 8) & 255) + amount));
  const b = Math.max(0, Math.min(255, (value & 255) + amount));
  return `rgb(${r}, ${g}, ${b})`;
}

function block(x, y, z, width, depth, height, colors, options = {}) {
  const p100 = iso(x + width, y, z);
  const p110 = iso(x + width, y + depth, z);
  const p010 = iso(x, y + depth, z);
  const p001 = iso(x, y, z + height);
  const p101 = iso(x + width, y, z + height);
  const p111 = iso(x + width, y + depth, z + height);
  const p011 = iso(x, y + depth, z + height);

  if (options.shadow !== false) {
    const center = iso(x + width * 0.5, y + depth * 0.56, z);
    ellipse(center.x, center.y + 7, state.camera * width * 0.38, state.camera * depth * 0.17, palette.shadow, 0.76);
  }

  poly([p010, p110, p111, p011], colors.left, options.stroke ?? palette.ink, options.alpha ?? 1);
  poly([p100, p110, p111, p101], colors.right, options.stroke ?? palette.ink, options.alpha ?? 1);
  poly([p001, p101, p111, p011], colors.top, options.topStroke ?? palette.ink, options.alpha ?? 1);

  if (options.ao !== false) {
    poly([p010, p110, p111, p011], "rgba(36, 54, 44, 0.095)", null, 1);
    poly([p100, p110, p111, p101], "rgba(36, 54, 44, 0.065)", null, 1);
  }
}

function gableRoof(x, y, z, width, depth, height, colors, axis) {
  const eave = 0.15;
  const lip = 0.055;
  const x0 = x - eave;
  const y0 = y - eave;
  const x1 = x + width + eave;
  const y1 = y + depth + eave;
  const base = z;
  const peak = z + height;

  if (axis === "x") {
    const p00 = iso(x0, y0, base);
    const p10 = iso(x1, y0, base);
    const p01 = iso(x0, y1, base);
    const p11 = iso(x1, y1, base);
    const ridge0 = iso(x0, y + depth * 0.5, peak);
    const ridge1 = iso(x1, y + depth * 0.5, peak);
    poly([p00, p10, ridge1, ridge0], colors.left);
    poly([p01, ridge0, ridge1, p11], colors.right);
    poly([p00, ridge0, p01], shade(colors.left, -10), palette.ink, 0.96);
    poly([p10, p11, ridge1], shade(colors.right, -8), palette.ink, 0.96);
    strokeLine(ridge0, ridge1, shade(colors.top, 18), Math.max(1.6, state.camera * 0.022), 0.92);
    strokeLine(iso(x + width * 0.12, y0 + depth * 0.22, peak - height * 0.18), iso(x + width * 0.88, y0 + depth * 0.22, peak - height * 0.18), "rgba(255,255,255,0.18)", 1.1, 0.7);
    block(x0, y1 - lip, base - lip, width + eave * 2, lip, lip, {
      top: shade(colors.top, -5),
      left: shade(colors.left, -18),
      right: shade(colors.right, -14),
    }, { shadow: false, ao: false, alpha: 0.88 });
    eaveShadow(p01, p11);
  } else {
    const p00 = iso(x0, y0, base);
    const p10 = iso(x1, y0, base);
    const p01 = iso(x0, y1, base);
    const p11 = iso(x1, y1, base);
    const ridge0 = iso(x + width * 0.5, y0, peak);
    const ridge1 = iso(x + width * 0.5, y1, peak);
    poly([p00, ridge0, ridge1, p01], colors.left);
    poly([ridge0, p10, p11, ridge1], colors.right);
    poly([p00, p10, ridge0], shade(colors.left, -10), palette.ink, 0.96);
    poly([p01, ridge1, p11], shade(colors.right, -8), palette.ink, 0.96);
    strokeLine(ridge0, ridge1, shade(colors.top, 18), Math.max(1.6, state.camera * 0.022), 0.92);
    strokeLine(iso(x + width * 0.32, y0 + depth * 0.18, peak - height * 0.2), iso(x + width * 0.32, y1 - depth * 0.18, peak - height * 0.2), "rgba(255,255,255,0.18)", 1.1, 0.7);
    block(x0, y1 - lip, base - lip, width + eave * 2, lip, lip, {
      top: shade(colors.top, -5),
      left: shade(colors.left, -18),
      right: shade(colors.right, -14),
    }, { shadow: false, ao: false, alpha: 0.88 });
    eaveShadow(p01, p11);
  }
}

function eaveShadow(a, b) {
  strokeLine({ x: a.x, y: a.y + 2 }, { x: b.x, y: b.y + 2 }, "rgba(62, 64, 50, 0.18)", Math.max(2, state.camera * 0.03), 1);
}

function faceRectY(x0, x1, y, z0, z1, fill, alpha = 1) {
  poly([iso(x0, y, z0), iso(x1, y, z0), iso(x1, y, z1), iso(x0, y, z1)], fill, "rgba(59, 70, 61, 0.12)", alpha);
}

function faceRectX(x, y0, y1, z0, z1, fill, alpha = 1) {
  poly([iso(x, y0, z0), iso(x, y1, z0), iso(x, y1, z1), iso(x, y0, z1)], fill, "rgba(59, 70, 61, 0.12)", alpha);
}

function drawWindowY(x, y, z, w = 0.16, h = 0.16) {
  faceRectY(x - 0.035, x + w + 0.035, y, z - 0.03, z + h + 0.035, "rgba(58, 73, 67, 0.2)", 0.9);
  faceRectY(x - 0.016, x + w + 0.016, y, z - 0.014, z + h + 0.014, "rgba(248, 232, 190, 0.68)", 0.9);
  faceRectY(x, x + w, y, z, z + h, palette.glassTop, 0.94);
  strokeLine(iso(x + w * 0.5, y, z), iso(x + w * 0.5, y, z + h), palette.glassLeft, 1, 0.5);
  block(x - 0.018, y + 0.012, z - 0.038, w + 0.036, 0.05, 0.025, {
    top: palette.stoneTop,
    left: shade(palette.stoneLeft, -8),
    right: shade(palette.stoneRight, -8),
  }, { shadow: false, ao: false, alpha: 0.8 });
}

function drawWindowX(x, y, z, w = 0.16, h = 0.16) {
  faceRectX(x, y - 0.035, y + w + 0.035, z - 0.03, z + h + 0.035, "rgba(58, 73, 67, 0.18)", 0.9);
  faceRectX(x, y - 0.016, y + w + 0.016, z - 0.014, z + h + 0.014, "rgba(248, 232, 190, 0.58)", 0.9);
  faceRectX(x, y, y + w, z, z + h, palette.glassRight, 0.94);
  block(x + 0.01, y - 0.018, z - 0.038, 0.05, w + 0.036, 0.025, {
    top: palette.stoneTop,
    left: shade(palette.stoneLeft, -8),
    right: shade(palette.stoneRight, -8),
  }, { shadow: false, ao: false, alpha: 0.74 });
}

function drawDoorY(x, y, z, w = 0.22, h = 0.34) {
  faceRectY(x - 0.045, x + w + 0.045, y, z - 0.035, z + h + 0.04, "rgba(72, 50, 34, 0.24)", 1);
  faceRectY(x - 0.014, x + w + 0.014, y, z - 0.014, z + h + 0.018, shade(palette.woodLeft, -8), 0.92);
  faceRectY(x, x + w, y, z, z + h, palette.woodRight, 0.98);
  drawWindowY(x + w * 0.34, y, z + h * 0.58, w * 0.32, h * 0.22);
  block(x - 0.04, y + 0.026, z - 0.04, w + 0.08, 0.075, 0.032, {
    top: palette.stoneTop,
    left: palette.stoneLeft,
    right: palette.stoneRight,
  }, { shadow: false, ao: false, alpha: 0.9 });
}

function trimBand(x, y, z, width, depth, colors) {
  block(x - 0.015, y - 0.015, z, width + 0.03, depth + 0.03, 0.055, {
    top: shade(colors.top, 5),
    left: shade(colors.left, -10),
    right: shade(colors.right, -8),
  }, { shadow: false, ao: false, alpha: 0.94 });
}

function plotPad(x, y, width, depth) {
  block(x - 0.26, y - 0.24, 0.004, width + 0.52, depth + 0.5, 0.09, {
    top: palette.plotTop,
    left: palette.plotLeft,
    right: palette.plotRight,
  }, { shadow: false, ao: false, topStroke: "rgba(112, 92, 45, 0.09)", alpha: 0.96 });
}

function commercialPad(x, y, width, depth, apron = 0.44) {
  block(x - 0.28, y - 0.22, 0.004, width + 0.56, depth + apron, 0.09, {
    top: "#f2e2bd",
    left: "#c6ad78",
    right: "#dec891",
  }, { shadow: false, ao: false, topStroke: "rgba(112, 92, 45, 0.1)", alpha: 0.96 });
  block(x - 0.16, y + depth + 0.02, 0.095, width + 0.32, 0.18, 0.035, {
    top: "#fff0cc",
    left: "#cfb781",
    right: "#e4cc94",
  }, { shadow: false, ao: false, alpha: 0.92 });
}

function parapetCap(x, y, z, width, depth, accent, inset = 0) {
  block(x - 0.04 + inset, y - 0.04 + inset, z, width + 0.08 - inset * 2, depth + 0.08 - inset * 2, 0.16, {
    top: accent.top,
    left: shade(accent.left, -5),
    right: shade(accent.right, -4),
  }, { shadow: false, ao: false, alpha: 0.98 });
  block(x + 0.08, y + 0.08, z + 0.155, width - 0.16, depth - 0.16, 0.045, {
    top: shade(accent.top, 12),
    left: shade(accent.left, -12),
    right: shade(accent.right, -10),
  }, { shadow: false, ao: false, alpha: 0.62 });
  block(x - 0.06 + inset, y + depth + 0.005 - inset, z - 0.035, width + 0.12 - inset * 2, 0.055, 0.05, {
    top: shade(accent.top, -5),
    left: shade(accent.left, -16),
    right: shade(accent.right, -12),
  }, { shadow: false, ao: false, alpha: 0.84 });
}

function glassPanelY(x, y, z, width, height, alpha = 0.96) {
  faceRectY(x - 0.025, x + width + 0.025, y, z - 0.025, z + height + 0.025, "rgba(64, 79, 78, 0.18)", 0.9);
  faceRectY(x, x + width, y, z, z + height, glassRamp.top, alpha);
  strokeLine(iso(x + width * 0.5, y, z + 0.02), iso(x + width * 0.5, y, z + height - 0.02), glassRamp.left, 1.2, 0.5);
}

function glassPanelX(x, y, z, depth, height, alpha = 0.96) {
  faceRectX(x, y - 0.025, y + depth + 0.025, z - 0.025, z + height + 0.025, "rgba(64, 79, 78, 0.15)", 0.86);
  faceRectX(x, y, y + depth, z, z + height, glassRamp.right, alpha);
  strokeLine(iso(x, y + depth * 0.5, z + 0.02), iso(x, y + depth * 0.5, z + height - 0.02), glassRamp.left, 1.1, 0.45);
}

function awningY(x, y, z, width, accent) {
  block(x, y, z, width, 0.16, 0.08, {
    top: accent.top,
    left: accent.left,
    right: accent.right,
  }, { shadow: false, ao: false, alpha: 0.98 });
  block(x + width * 0.06, y + 0.13, z - 0.045, width * 0.88, 0.045, 0.035, {
    top: shade(accent.top, -8),
    left: shade(accent.left, -18),
    right: shade(accent.right, -14),
  }, { shadow: false, ao: false, alpha: 0.78 });
  faceRectY(x + width * 0.06, x + width * 0.94, y + 0.16, z - 0.055, z, shade(accent.left, -18), 0.55);
}

function awningX(x, y, z, depth, accent) {
  block(x, y, z, 0.16, depth, 0.08, {
    top: accent.top,
    left: accent.left,
    right: accent.right,
  }, { shadow: false, ao: false, alpha: 0.95 });
}

function signBandY(x, y, z, width, accent, height = 0.12) {
  block(x, y, z, width, 0.06, height, {
    top: shade(accent.top, 6),
    left: shade(accent.left, -8),
    right: shade(accent.right, -6),
  }, { shadow: false, ao: false, alpha: 0.96 });
}

function servicePanelX(x, y, z, depth, height, fill) {
  const steps = 3;
  for (let i = 0; i < steps; i += 1) {
    const y0 = y + depth * (i / steps) + 0.035;
    const y1 = y + depth * ((i + 1) / steps) - 0.035;
    faceRectX(x, y0, y1, z, z + height, fill, 0.38);
  }
}

function wallRibY(x, y, z, height, fill, alpha = 0.34) {
  faceRectY(x, x + 0.028, y, z, z + height, fill, alpha);
}

function wallRibX(x, y, z, height, fill, alpha = 0.32) {
  faceRectX(x, y, y + 0.028, z, z + height, fill, alpha);
}

function slabShadow(x, y, width, depth, alpha = 0.38) {
  block(x + 0.02, y + 0.05, -0.012, width, depth, 0.025, {
    top: roadRamp.shadow,
    left: roadRamp.shadow,
    right: roadRamp.shadow,
  }, { shadow: false, ao: false, stroke: null, topStroke: null, alpha });
}

function roadSlab(x, y, width, depth, options = {}) {
  slabShadow(x, y, width, depth, options.shadowAlpha ?? 0.34);
  block(x, y, 0.018, width, depth, 0.075, roadRamp.asphalt, {
    shadow: false,
    ao: false,
    topStroke: "rgba(62, 77, 73, 0.12)",
    alpha: options.alpha ?? 0.98,
  });
}

function curbSlab(x, y, width, depth, alpha = 0.96) {
  block(x, y, 0.09, width, depth, 0.055, roadRamp.curb, {
    shadow: false,
    ao: false,
    topStroke: "rgba(117, 97, 56, 0.08)",
    alpha,
  });
}

function laneMarkX(x, y, width) {
  const a = iso(x + 0.24, y, 0.112);
  const b = iso(x + width - 0.24, y, 0.112);
  strokeLine(a, b, "rgba(246, 235, 193, 0.44)", Math.max(1, state.camera * 0.012), 0.72);
}

function laneMarkY(x, y, depth) {
  const a = iso(x, y + 0.24, 0.112);
  const b = iso(x, y + depth - 0.24, 0.112);
  strokeLine(a, b, "rgba(246, 235, 193, 0.38)", Math.max(1, state.camera * 0.012), 0.68);
}

const authoredCustomRamps = {
  roofHighlight: { top: "#a9dcf0", left: "#6ea8c6", right: "#88c1db" },
  roofLip: { top: "#63a8c8", left: "#3f7596", right: "#528eb0" },
  recessShadow: { top: "rgba(92, 70, 48, 0.26)", left: "rgba(92, 70, 48, 0.38)", right: "rgba(92, 70, 48, 0.3)" },
  storeRoofInset: { top: "#fff6d4", left: "#d6bf86", right: "#ead39a" },
  storeRoofLip: { top: "#e7ca84", left: "#b29457", right: "#c8aa6a" },
  sideBlock: { top: "#e7d099", left: "#bda56f", right: "#d3bc86" },
  awningUnderside: { top: "rgba(91, 63, 52, 0.34)", left: "rgba(91, 63, 52, 0.42)", right: "rgba(91, 63, 52, 0.36)" },
  asphaltJoin: { top: "#8fa9a2", left: "#66847f", right: "#78928d" },
};

function authoredRamp(name) {
  if (!name) return wallRamps.cream;
  const [group, key] = name.split(".");
  if (group === "wall") return wallRamps[key] ?? wallRamps.cream;
  if (group === "roof") return roofRamps[key] ?? roofRamps.slate;
  if (group === "commercial") return commercialRamps[key] ?? commercialRamps.linen;
  if (group === "accent") return accentRamps[key] ?? accentRamps.blue;
  if (group === "road") return roadRamp[key] ?? roadRamp.asphalt;
  if (group === "custom") return authoredCustomRamps[key] ?? wallRamps.cream;
  return wallRamps.cream;
}

function authoredAssetImage(src) {
  if (!src) return null;
  if (authoredAssetImages.has(src)) return authoredAssetImages.get(src);
  const image = new Image();
  image.decoding = "async";
  image.onload = () => draw();
  image.onerror = () => draw();
  image.src = src;
  authoredAssetImages.set(src, image);
  return image;
}

function drawAuthoredAsset(model, source) {
  const asset = source.asset;
  if (!asset?.src) return false;
  const image = authoredAssetImage(asset.src);
  if (!image?.complete || !image.naturalWidth) return false;
  const anchor = iso(model.x, model.y, 0);
  ctx.drawImage(
    image,
    anchor.x - state.camera * asset.offsetXTiles,
    anchor.y - state.camera * asset.offsetYTiles,
    state.camera * asset.widthTiles,
    state.camera * asset.heightTiles,
  );
  return true;
}

function drawAuthoredComponent(anchorX, anchorY, component) {
  const x = anchorX + (component.x ?? 0);
  const y = anchorY + (component.y ?? 0);
  const z = component.z ?? 0;
  const width = component.width ?? 0.1;
  const depth = component.depth ?? 0.1;
  const height = component.height ?? 0.1;

  if (component.kind === "pad") {
    plotPad(x, y, width, depth);
    return;
  }
  if (component.kind === "commercialPad") {
    commercialPad(x, y, width, depth, component.apron ?? 0.44);
    return;
  }
  if (component.kind === "slabShadow") {
    slabShadow(x, y, width, depth, component.alpha ?? 0.3);
    return;
  }
  if (component.kind === "block") {
    block(x, y, z, width, depth, height, authoredRamp(component.ramp), {
      shadow: component.shadow,
      ao: component.ao,
      alpha: component.alpha,
      topStroke: component.topStroke,
      stroke: component.stroke,
    });
    return;
  }
  if (component.kind === "windowY") {
    drawWindowY(x, y, z, width, height);
    return;
  }
  if (component.kind === "windowX") {
    drawWindowX(x, y, z, width, height);
    return;
  }
  if (component.kind === "doorY") {
    drawDoorY(x, y, z, width, height);
    return;
  }
  if (component.kind === "glassY") {
    glassPanelY(x, y, z, width, height, component.alpha ?? 0.96);
    return;
  }
  if (component.kind === "awningY") {
    awningY(x, y, z, width, authoredRamp(component.ramp));
    return;
  }
  if (component.kind === "signBandY") {
    signBandY(x, y, z, width, authoredRamp(component.ramp), height);
    return;
  }
  if (component.kind === "ribY") {
    faceRectY(x, x + 0.028, y, z, z + height, component.fill, component.alpha ?? 0.34);
    return;
  }
  if (component.kind === "ribX") {
    faceRectX(x, y, y + 0.028, z, z + height, component.fill, component.alpha ?? 0.32);
    return;
  }
  if (component.kind === "stoop") {
    block(x, y, z, width, 0.16, 0.036, roadRamp.sidewalk, { shadow: false, ao: false, alpha: 0.96 });
    block(x + 0.04, y + 0.13, z - 0.032, width - 0.08, 0.075, 0.026, roadRamp.sidewalk, { shadow: false, ao: false, alpha: 0.78 });
    return;
  }
  if (component.kind === "laneMarkX") {
    strokeLine(iso(x, y, 0.116), iso(x + width, y, 0.116), "rgba(246, 235, 193, 0.42)", Math.max(1, state.camera * 0.01), component.alpha ?? 0.42);
    return;
  }
  if (component.kind === "laneMarkY") {
    strokeLine(iso(x, y, 0.116), iso(x, y + depth, 0.116), "rgba(246, 235, 193, 0.38)", Math.max(1, state.camera * 0.01), component.alpha ?? 0.38);
  }
}

function drawAuthoredSource(model) {
  const source = authoredModules[model.key];
  if (!source?.components?.length) return false;
  if (drawAuthoredAsset(model, source)) return true;
  source.components.forEach((component) => drawAuthoredComponent(model.x, model.y, component));
  return true;
}

function authoredBuildingFallback(model) {
  if (model.key === "building.house.rowhome.flat_parapet.v1") {
    rowhomeStrip({
      ...model,
      type: "rowhome",
      units: 3,
      walls: ["mint", "cream", "peach"],
      roofs: ["slate", "honey", "terracotta"],
      roof: "parapet",
    });
    return;
  }
  if (model.key === "building.store.strip.three_bay.v1") {
    stripStore({
      ...model,
      type: "stripStore",
      wall: "linen",
      accents: ["teal", "coral", "gold"],
      roof: "blue",
    });
  }
}

function authoredGroundFallback(model) {
  if (model.key === "road.corner.two_lane.v1") roadCorner({ ...model, type: "roadCorner" });
}

function roadStraight(model) {
  const lane = 0.78;
  if (model.axis === "y") {
    roadSlab(model.x, model.y, lane, model.length);
    curbSlab(model.x - 0.12, model.y, 0.12, model.length);
    curbSlab(model.x + lane, model.y, 0.12, model.length);
    if (state.detail > 0) laneMarkY(model.x + lane * 0.5, model.y, model.length);
    return;
  }
  roadSlab(model.x, model.y, model.length, lane);
  curbSlab(model.x, model.y - 0.12, model.length, 0.12);
  curbSlab(model.x, model.y + lane, model.length, 0.12);
  if (state.detail > 0) laneMarkX(model.x, model.y + lane * 0.5, model.length);
}

function roadCorner(model) {
  const lane = 0.78;
  roadSlab(model.x, model.y, lane * 1.42, lane * 1.42, { shadowAlpha: 0.28 });
  roadSlab(model.x - lane * 1.25, model.y, lane * 1.35, lane, { shadowAlpha: 0.24 });
  roadSlab(model.x, model.y + lane * 0.42, lane, lane * 1.9, { shadowAlpha: 0.24 });
  curbSlab(model.x - lane * 1.25, model.y - 0.12, lane * 2.06, 0.12);
  curbSlab(model.x - 0.12, model.y + lane * 0.42, 0.12, lane * 1.9);
  curbSlab(model.x + lane, model.y + lane * 1.02, 0.12, lane * 1.3);
  curbSlab(model.x - lane * 0.5, model.y + lane, lane * 0.82, 0.12, 0.9);
  if (state.detail > 0) {
    laneMarkX(model.x - lane * 1.04, model.y + lane * 0.5, lane * 1.25);
    laneMarkY(model.x + lane * 0.5, model.y + lane * 0.58, lane * 1.5);
  }
}

function roadCross(model) {
  const lane = 0.78;
  const size = lane * 1.86;
  roadSlab(model.x, model.y, size, size, { shadowAlpha: 0.3 });
  curbSlab(model.x - 0.12, model.y - 0.12, size + 0.24, 0.12, 0.82);
  curbSlab(model.x - 0.12, model.y + size, size + 0.24, 0.12, 0.82);
  curbSlab(model.x - 0.12, model.y - 0.12, 0.12, size + 0.24, 0.82);
  curbSlab(model.x + size, model.y - 0.12, 0.12, size + 0.24, 0.82);
  if (state.detail > 0) {
    laneMarkX(model.x + 0.12, model.y + size * 0.5, size - 0.24);
    laneMarkY(model.x + size * 0.5, model.y + 0.12, size - 0.24);
  }
}

function driveway(model) {
  const w = model.axis === "y" ? 0.42 : model.length;
  const d = model.axis === "y" ? model.length : 0.42;
  slabShadow(model.x, model.y, w, d, 0.24);
  block(model.x, model.y, 0.045, w, d, 0.04, roadRamp.lot, {
    shadow: false,
    ao: false,
    topStroke: "rgba(92, 83, 64, 0.08)",
    alpha: 0.9,
  });
  if (model.axis === "y") {
    curbSlab(model.x - 0.07, model.y + d - 0.04, 0.56, 0.08, 0.66);
  } else {
    curbSlab(model.x + w - 0.04, model.y - 0.07, 0.08, 0.56, 0.66);
  }
}

function sidewalk(model) {
  if (model.axis === "y") {
    curbSlab(model.x, model.y, 0.3, model.length, 0.88);
    return;
  }
  curbSlab(model.x, model.y, model.length, 0.3, 0.88);
}

function crosswalk(model) {
  const bars = 4;
  for (let i = 0; i < bars; i += 1) {
    if (model.axis === "y") {
      curbSlab(model.x + i * 0.19, model.y, 0.08, 0.62, 0.68);
    } else {
      curbSlab(model.x, model.y + i * 0.19, 0.62, 0.08, 0.68);
    }
  }
}

function residentialLot(model) {
  slabShadow(model.x - 0.08, model.y - 0.08, model.width + 0.16, model.depth + 0.16, 0.2);
  block(model.x, model.y, 0.018, model.width, model.depth, 0.052, {
    top: "#f5e7bd",
    left: "#c9b178",
    right: "#dec892",
  }, { shadow: false, ao: false, topStroke: "rgba(107, 89, 48, 0.08)", alpha: 0.86 });
  curbSlab(model.x + model.width * 0.18, model.y + model.depth - 0.08, model.width * 0.36, 0.12, 0.82);
}

function commercialLot(model) {
  slabShadow(model.x - 0.1, model.y - 0.08, model.width + 0.2, model.depth + 0.22, 0.24);
  block(model.x, model.y, 0.018, model.width, model.depth, 0.055, roadRamp.lot, {
    shadow: false,
    ao: false,
    topStroke: "rgba(82, 77, 65, 0.1)",
    alpha: 0.9,
  });
  curbSlab(model.x, model.y + model.depth - 0.1, model.width, 0.13, 0.76);
  curbSlab(model.x - 0.08, model.y, 0.1, model.depth, 0.72);
  if (state.detail > 1) {
    const stripes = model.stripes ?? 2;
    for (let i = 0; i < stripes; i += 1) {
      const stripeX = model.x + model.width * (0.22 + i * 0.18);
      strokeLine(iso(stripeX, model.y + model.depth * 0.24, 0.08), iso(stripeX + 0.28, model.y + model.depth * 0.54, 0.08), "rgba(248, 239, 204, 0.34)", 1.2, 0.62);
    }
  }
}

function porch(x, y, width, depth, side = "front") {
  const porchY = side === "front" ? y + depth + 0.025 : y + depth * 0.55;
  const porchX = x + width * 0.35;
  block(porchX - width * 0.04, porchY - 0.015, 0.095, width * 0.42, 0.22, 0.045, {
    top: palette.stoneTop,
    left: palette.stoneLeft,
    right: palette.stoneRight,
  }, { shadow: false, ao: false, alpha: 0.98 });
  block(porchX + width * 0.02, porchY + 0.14, 0.07, width * 0.3, 0.14, 0.035, {
    top: shade(palette.stoneTop, -6),
    left: shade(palette.stoneLeft, -8),
    right: shade(palette.stoneRight, -6),
  }, { shadow: false, ao: false, alpha: 0.95 });
  block(porchX + width * 0.06, porchY + 0.25, 0.05, width * 0.22, 0.1, 0.025, {
    top: shade(palette.stoneTop, -12),
    left: shade(palette.stoneLeft, -12),
    right: shade(palette.stoneRight, -10),
  }, { shadow: false, ao: false, alpha: 0.78 });
}

function chimney(x, y, z, roof) {
  if (state.detail < 2) return;
  block(x, y, z, 0.15, 0.16, 0.3, {
    top: shade(roof.top, 12),
    left: shade(roof.left, -8),
    right: shade(roof.right, -4),
  }, { shadow: false, ao: false });
}

function cottage(model) {
  const spec = cottageSpecs[model.form];
  const wall = wallRamps[model.wall];
  const roof = roofRamps[model.roof];
  const x = model.x;
  const y = model.y;
  const w = spec.width;
  const d = spec.depth;
  const h = spec.wallHeight;

  plotPad(x, y, model.form === "l" ? w + 0.36 : w, model.form === "l" ? d + 0.38 : d);

  if (model.form === "l") {
    block(x, y, 0.08, w, d * 0.74, h, wall);
    block(x + w * 0.54, y + d * 0.46, 0.08, w * 0.74, d * 0.72, h * 0.92, wall, { shadow: false });
    wallRibX(x + w + 0.002, y + d * 0.16, 0.18, h * 0.52, shade(wall.right, -18));
    wallRibY(x + w * 0.55, y + d * 1.18, 0.18, h * 0.48, shade(wall.left, -16), 0.28);
    trimBand(x, y, h + 0.08, w, d * 0.74, wall);
    trimBand(x + w * 0.54, y + d * 0.46, h * 0.92 + 0.08, w * 0.74, d * 0.72, wall);
    gableRoof(x, y, h + 0.1, w, d * 0.74, spec.roofHeight, roof, "x");
    gableRoof(x + w * 0.54, y + d * 0.46, h * 0.92 + 0.1, w * 0.74, d * 0.72, spec.roofHeight * 0.92, roof, "y");
    drawWindowY(x + w * 0.16, y + d * 0.76, 0.42);
    drawDoorY(x + w * 0.68, y + d * 1.2, 0.12, 0.2, 0.32);
    drawWindowX(x + w * 1.28, y + d * 0.72, 0.4, 0.14, 0.15);
    porch(x + w * 0.54, y + d * 0.46, w * 0.74, d * 0.72);
    chimney(x + w * 0.18, y + d * 0.18, h + 0.36, roof);
    return;
  }

  block(x + 0.04, y + 0.04, 0.055, w - 0.08, d - 0.08, 0.12, {
    top: shade(wall.top, -5),
    left: shade(wall.left, -12),
    right: shade(wall.right, -12),
  }, { shadow: false, ao: false });
  block(x, y, 0.08, w, d, h, wall);
  wallRibX(x + w + 0.002, y + d * 0.14, 0.18, h * 0.48, shade(wall.right, -18));
  wallRibY(x + w * 0.12, y + d + 0.01, 0.18, h * 0.42, shade(wall.left, -14), 0.24);
  trimBand(x, y, h + 0.08, w, d, wall);
  gableRoof(x, y, h + 0.09, w, d, spec.roofHeight, roof, spec.roofAxis);

  drawWindowY(x + w * 0.18, y + d + 0.018, 0.42);
  drawDoorY(x + w * 0.42, y + d + 0.018, 0.12, w * 0.18, 0.34);
  drawWindowY(x + w * 0.68, y + d + 0.018, 0.42);
  drawWindowX(x + w + 0.018, y + d * 0.28, 0.42, 0.14, 0.15);
  porch(x, y, w, d);
  chimney(x + w * (model.mirror ? 0.2 : 0.68), y + d * 0.2, h + 0.28, roof);
}

function ranch(model) {
  const wall = wallRamps[model.wall];
  const roof = roofRamps[model.roof];
  const x = model.x;
  const y = model.y;
  const w = 1.9;
  const d = 1.08;
  const h = 0.58;

  plotPad(x, y, model.wing === "none" ? w : w + 0.46, d + 0.16);
  block(x, y, 0.08, w, d, h, wall);
  wallRibX(x + w + 0.002, y + d * 0.18, 0.16, h * 0.42, shade(wall.right, -18));
  wallRibY(x + w * 0.16, y + d + 0.01, 0.18, h * 0.38, shade(wall.left, -14), 0.22);
  trimBand(x, y, h + 0.08, w, d, wall);
  gableRoof(x, y, h + 0.09, w, d, 0.26, roof, "x");

  if (model.wing !== "none") {
    const wingX = model.wing === "left" ? x - 0.42 : x + w - 0.06;
    block(wingX, y + 0.5, 0.075, 0.58, 0.64, h * 0.72, wall, { shadow: false });
    wallRibX(wingX + 0.58 + 0.002, y + 0.62, 0.15, h * 0.3, shade(wall.right, -16), 0.24);
    trimBand(wingX, y + 0.5, h * 0.72 + 0.075, 0.58, 0.64, wall);
    gableRoof(wingX, y + 0.5, h * 0.72 + 0.085, 0.58, 0.64, 0.2, roof, "y");
  }

  drawDoorY(x + w * 0.22, y + d + 0.018, 0.12, 0.2, 0.31);
  drawWindowY(x + w * 0.44, y + d + 0.018, 0.39, 0.15, 0.14);
  drawWindowY(x + w * 0.62, y + d + 0.018, 0.39, 0.15, 0.14);
  drawWindowY(x + w * 0.79, y + d + 0.018, 0.39, 0.15, 0.14);
  drawWindowX(x + w + 0.018, y + d * 0.28, 0.36, 0.14, 0.14);
  porch(x - 0.02, y, w * 0.64, d);
  if (state.detail > 1) {
    block(x + w * 0.72, y + d * 0.18, h + 0.24, 0.14, 0.14, 0.24, {
      top: shade(roof.top, 10),
      left: shade(roof.left, -6),
      right: shade(roof.right, -4),
    }, { shadow: false, ao: false });
  }
}

function rowhomeStrip(model) {
  const unitWidth = 0.82;
  const d = 1.08;
  const h = 0.76;
  const totalWidth = unitWidth * model.units;
  const x = model.x;
  const y = model.y;

  plotPad(x, y, totalWidth, d);
  for (let i = 0; i < model.units; i += 1) {
    const unitX = x + i * unitWidth;
    const wall = wallRamps[model.walls[i % model.walls.length]];
    const roof = roofRamps[model.roofs[i % model.roofs.length]];
    block(unitX, y, 0.08, unitWidth, d, h, wall, { shadow: i === 0 });
    wallRibY(unitX + unitWidth * 0.1, y + d + 0.01, 0.2, h * 0.44, shade(wall.left, -14), 0.18);
    drawDoorY(unitX + unitWidth * 0.18, y + d + 0.018, 0.12, 0.16, 0.31);
    drawWindowY(unitX + unitWidth * 0.52, y + d + 0.018, 0.42, 0.14, 0.14);
    drawWindowY(unitX + unitWidth * 0.52, y + d + 0.018, 0.66, 0.14, 0.14);
    if (i > 0) {
      faceRectY(unitX, unitX + 0.018, y + d + 0.02, 0.13, h + 0.04, "rgba(92, 74, 50, 0.18)", 0.68);
    }
    if (model.roof === "stepped") {
      block(unitX - 0.02, y - 0.02, h + 0.08, unitWidth + 0.04, d + 0.04, 0.12 + (i % 2) * 0.04, {
        top: roof.top,
        left: roof.left,
        right: roof.right,
      }, { shadow: false, ao: false });
      block(unitX + 0.08, y + d - 0.04, h + 0.2 + (i % 2) * 0.04, unitWidth - 0.16, 0.05, 0.04, {
        top: shade(roof.top, 8),
        left: shade(roof.left, -8),
        right: shade(roof.right, -6),
      }, { shadow: false, ao: false, alpha: 0.58 });
    }
  }

  if (model.roof === "parapet") {
    const roof = roofRamps[model.roofs[0]];
    block(x - 0.04, y - 0.04, h + 0.08, totalWidth + 0.08, d + 0.08, 0.16, {
      top: roof.top,
      left: roof.left,
      right: roof.right,
    }, { shadow: false, ao: false });
    block(x + 0.1, y + 0.08, h + 0.25, totalWidth - 0.2, d - 0.16, 0.06, {
      top: shade(roof.top, 10),
      left: shade(roof.left, -8),
      right: shade(roof.right, -6),
    }, { shadow: false, ao: false, alpha: 0.8 });
  }

  for (let i = 0; i < model.units; i += 1) {
    const stepX = x + i * unitWidth + unitWidth * 0.12;
    block(stepX, y + d + 0.08, 0.28, 0.16, 0.035, {
      top: palette.stoneTop,
      left: palette.stoneLeft,
      right: palette.stoneRight,
    }, { shadow: false, ao: false, alpha: 0.95 });
  }
}

function smallApartment(model) {
  const wall = wallRamps[model.wall];
  const roof = roofRamps[model.roof];
  const x = model.x;
  const y = model.y;
  const w = model.levels > 2 ? 1.82 : 1.66;
  const d = model.levels > 2 ? 1.42 : 1.28;
  const baseH = 0.72;
  const secondH = 0.58;

  plotPad(x, y, w, d);
  block(x, y, 0.08, w, d, baseH, wall);
  wallRibX(x + w + 0.002, y + d * 0.18, 0.18, baseH * 0.5, shade(wall.right, -18));
  drawApartmentWindows(x, y, w, d, 0.36, 4);
  drawDoorY(x + w * 0.42, y + d + 0.018, 0.12, 0.22, 0.34);
  porch(x + w * 0.18, y, w * 0.64, d);

  const upperX = x + 0.18;
  const upperY = y + 0.12;
  block(upperX, upperY, baseH + 0.08, w - 0.36, d - 0.24, secondH, wall, { shadow: false });
  wallRibY(upperX + 0.14, upperY + d - 0.24 + 0.01, baseH + 0.22, secondH * 0.52, shade(wall.left, -14), 0.24);
  drawApartmentWindows(upperX, upperY, w - 0.36, d - 0.24, baseH + 0.36, 3);

  if (model.levels > 2) {
    block(x + 0.42, y + 0.3, baseH + secondH + 0.08, w - 0.84, d - 0.58, 0.46, wall, { shadow: false });
    drawWindowY(x + w * 0.46, y + d - 0.26, baseH + secondH + 0.32, 0.14, 0.14);
    drawWindowY(x + w * 0.66, y + d - 0.26, baseH + secondH + 0.32, 0.14, 0.14);
  }

  block(x - 0.04, y - 0.04, baseH + secondH + (model.levels > 2 ? 0.54 : 0.08), w + 0.08, d + 0.08, 0.16, {
    top: roof.top,
    left: roof.left,
    right: roof.right,
  }, { shadow: false, ao: false });
  block(x + w * 0.16, y + d * 0.12, baseH + secondH + (model.levels > 2 ? 0.72 : 0.26), w * 0.24, d * 0.24, 0.1, {
    top: shade(roof.top, 12),
    left: shade(roof.left, -8),
    right: shade(roof.right, -6),
  }, { shadow: false, ao: false, alpha: 0.88 });
}

function drawApartmentWindows(x, y, width, depth, z, count) {
  for (let i = 0; i < count; i += 1) {
    const t = (i + 1) / (count + 1);
    drawWindowY(x + width * t - 0.06, y + depth + 0.018, z, 0.13, 0.14);
  }
  drawWindowX(x + width + 0.018, y + depth * 0.3, z, 0.13, 0.14);
}

function cornerStore(model) {
  const wall = commercialRamps[model.wall];
  const accent = accentRamps[model.accent];
  const x = model.x;
  const y = model.y;
  const w = model.compact ? 1.22 : 1.46;
  const d = model.compact ? 1.02 : 1.14;
  const h = model.compact ? 0.66 : 0.72;

  commercialPad(x, y, w, d, 0.54);
  block(x, y, 0.08, w, d, h, wall);
  wallRibX(x + w + 0.002, y + d * 0.18, 0.22, h * 0.52, shade(wall.right, -18), 0.3);
  wallRibY(x + w * 0.14, y + d + 0.01, 0.22, h * 0.44, shade(wall.left, -14), 0.28);
  block(x + w * 0.08, y + d * 0.1, h + 0.08, w * 0.26, d * 0.24, 0.12, {
    top: shade(accent.top, 12),
    left: shade(accent.left, -8),
    right: shade(accent.right, -6),
  }, { shadow: false, ao: false, alpha: 0.88 });
  parapetCap(x, y, h + 0.08, w, d, accent);
  block(x + w * 0.2, y + d + 0.006, h + 0.4, w * 0.58, 0.04, 0.08, {
    top: shade(wall.top, 4),
    left: shade(wall.left, -12),
    right: shade(wall.right, -10),
  }, { shadow: false, ao: false, alpha: 0.84 });
  signBandY(x + w * 0.18, y + d + 0.012, h + 0.44, w * 0.62, accent, 0.1);
  awningY(x + w * 0.1, y + d + 0.025, h * 0.48, w * 0.74, accent);
  awningX(x + w + 0.025, y + d * 0.18, h * 0.48, d * 0.48, accent);
  glassPanelY(x + w * 0.13, y + d + 0.035, 0.23, w * 0.26, 0.24);
  drawDoorY(x + w * 0.43, y + d + 0.038, 0.13, w * 0.16, 0.35);
  glassPanelY(x + w * 0.64, y + d + 0.035, 0.24, w * 0.22, 0.22);
  glassPanelX(x + w + 0.035, y + d * 0.22, 0.28, d * 0.32, 0.22);
  glassPanelX(x + w + 0.035, y + d * 0.6, 0.28, d * 0.22, 0.2);
}

function stripStore(model) {
  const wall = commercialRamps[model.wall];
  const roof = roofRamps[model.roof] ?? accentRamps.blue;
  const x = model.x;
  const y = model.y;
  const unitW = model.compact ? 0.86 : 0.98;
  const bays = 3;
  const w = unitW * bays;
  const d = model.compact ? 1.18 : 1.28;
  const h = model.compact ? 0.7 : 0.76;

  commercialPad(x, y, w, d, 0.62);
  block(x, y, 0.08, w, d, h, wall);
  wallRibX(x + w + 0.002, y + d * 0.18, 0.22, h * 0.5, shade(wall.right, -18), 0.3);
  parapetCap(x, y, h + 0.08, w, d, roof, 0.02);

  for (let i = 0; i < bays; i += 1) {
    const bayX = x + i * unitW;
    const accent = accentRamps[model.accents[i % model.accents.length]];
    if (i > 0) {
      faceRectY(bayX, bayX + 0.018, y + d + 0.03, 0.14, h + 0.08, "rgba(91, 75, 51, 0.2)", 0.65);
      block(bayX - 0.015, y + d + 0.01, 0.12, 0.03, 0.08, h * 0.8, {
        top: shade(wall.top, -8),
        left: shade(wall.left, -18),
        right: shade(wall.right, -16),
      }, { shadow: false, ao: false, alpha: 0.5 });
    }
    block(bayX + 0.05, y + d + 0.012, h + 0.3 + (i % 2) * 0.03, unitW - 0.1, 0.045, 0.08, {
      top: shade(wall.top, 3),
      left: shade(wall.left, -14),
      right: shade(wall.right, -12),
    }, { shadow: false, ao: false, alpha: 0.72 });
    block(bayX + 0.07, y + d + 0.02, h + 0.34 + (i % 2) * 0.03, unitW - 0.14, 0.055, 0.1, {
      top: accent.top,
      left: accent.left,
      right: accent.right,
    }, { shadow: false, ao: false, alpha: 0.94 });
    awningY(bayX + 0.1, y + d + 0.035, 0.48, unitW - 0.2, accent);
    glassPanelY(bayX + unitW * 0.12, y + d + 0.045, 0.22, unitW * 0.27, 0.24);
    drawDoorY(bayX + unitW * 0.46, y + d + 0.048, 0.13, unitW * 0.16, 0.34);
    glassPanelY(bayX + unitW * 0.68, y + d + 0.045, 0.22, unitW * 0.2, 0.22);
  }

  block(x + 0.14, y + 0.11, h + 0.29, w - 0.28, d - 0.22, 0.045, {
    top: shade(roof.top, 10),
    left: shade(roof.left, -8),
    right: shade(roof.right, -6),
  }, { shadow: false, ao: false, alpha: 0.72 });
}

function cafe(model) {
  const wall = commercialRamps[model.wall];
  const accent = accentRamps[model.accent];
  const x = model.x;
  const y = model.y;
  const w = model.mirror ? 1.46 : 1.34;
  const d = 1.08;
  const h = 0.66;

  commercialPad(x, y, w, d, 0.68);
  block(x, y, 0.08, w, d, h, wall);
  wallRibX(x + w + 0.002, y + d * 0.28, 0.22, h * 0.42, shade(wall.right, -16), 0.28);
  block(x + w * 0.12, y + d * 0.12, h + 0.08, w * 0.76, d * 0.76, 0.08, {
    top: shade(wall.top, -4),
    left: shade(wall.left, -7),
    right: shade(wall.right, -7),
  }, { shadow: false, ao: false, alpha: 0.9 });
  parapetCap(x, y, h + 0.08, w, d, accent);
  block(x + w * 0.18, y + d + 0.008, h + 0.36, w * 0.62, 0.04, 0.08, {
    top: shade(wall.top, 5),
    left: shade(wall.left, -12),
    right: shade(wall.right, -10),
  }, { shadow: false, ao: false, alpha: 0.78 });
  signBandY(x + w * 0.22, y + d + 0.014, h + 0.4, w * 0.56, accent, 0.1);
  awningY(x + w * 0.12, y + d + 0.035, h * 0.49, w * 0.76, accent);
  glassPanelY(x + w * 0.14, y + d + 0.045, 0.24, w * 0.22, 0.24);
  glassPanelY(x + w * 0.38, y + d + 0.045, 0.24, w * 0.2, 0.24);
  drawDoorY(x + w * 0.64, y + d + 0.048, 0.13, w * 0.16, 0.35);
  glassPanelX(x + w + 0.035, y + d * 0.32, 0.32, d * 0.28, 0.2);
  block(x + w * 0.16, y + d + 0.26, 0.08, w * 0.54, 0.28, 0.035, {
    top: "#fff1d1",
    left: "#d0b982",
    right: "#e3cd98",
  }, { shadow: false, ao: false, alpha: 0.82 });
}

function gymService(model) {
  const wall = commercialRamps[model.wall];
  const accent = accentRamps[model.accent];
  const x = model.x;
  const y = model.y;
  const w = model.compact ? 2.08 : 2.42;
  const d = model.compact ? 1.32 : 1.48;
  const h = model.compact ? 0.82 : 0.9;

  commercialPad(x, y, w, d, 0.58);
  block(x, y, 0.08, w, d, h, wall);
  wallRibX(x + w + 0.002, y + d * 0.12, 0.18, h * 0.68, shade(wall.right, -18), 0.34);
  wallRibX(x + w + 0.002, y + d * 0.52, 0.18, h * 0.5, shade(wall.right, -18), 0.28);
  block(x + w * 0.1, y + d * 0.08, h + 0.12, w * 0.78, 0.08, 0.07, {
    top: shade(wall.top, 5),
    left: shade(wall.left, -14),
    right: shade(wall.right, -12),
  }, { shadow: false, ao: false, alpha: 0.58 });
  parapetCap(x, y, h + 0.08, w, d, accent, 0.02);

  const entryW = w * 0.34;
  const entryX = model.entry === "left" ? x + w * 0.1 : model.entry === "right" ? x + w * 0.56 : x + w * 0.33;
  block(entryX, y + d * 0.08, 0.1, entryW, d * 0.86, h * 1.04, {
    top: shade(wall.top, 8),
    left: shade(wall.left, -4),
    right: shade(wall.right, -2),
  }, { shadow: false, ao: true, alpha: 0.98 });
  block(entryX + entryW * 0.08, y + d + 0.012, 0.16, entryW * 0.84, 0.055, h * 0.82, {
    top: shade(wall.top, -2),
    left: shade(wall.left, -16),
    right: shade(wall.right, -12),
  }, { shadow: false, ao: false, alpha: 0.34 });
  signBandY(entryX + entryW * 0.14, y + d + 0.018, h + 0.52, entryW * 0.72, accent, 0.12);
  awningY(entryX + entryW * 0.14, y + d + 0.035, 0.5, entryW * 0.72, accent);
  glassPanelY(entryX + entryW * 0.16, y + d + 0.045, 0.22, entryW * 0.26, 0.34);
  drawDoorY(entryX + entryW * 0.48, y + d + 0.048, 0.12, entryW * 0.2, 0.4);
  glassPanelY(entryX + entryW * 0.72, y + d + 0.045, 0.22, entryW * 0.14, 0.32);

  servicePanelX(x + w + 0.018, y + d * 0.16, 0.34, d * 0.66, 0.28, shade(wall.right, -10));
  block(x + w * 0.15, y + d * 0.18, h + 0.31, w * 0.22, d * 0.18, 0.08, {
    top: shade(accent.top, 12),
    left: shade(accent.left, -8),
    right: shade(accent.right, -6),
  }, { shadow: false, ao: false, alpha: 0.8 });
  block(x + w * 0.5, y + d * 0.14, h + 0.31, w * 0.18, d * 0.16, 0.08, {
    top: shade(accent.top, 6),
    left: shade(accent.left, -10),
    right: shade(accent.right, -8),
  }, { shadow: false, ao: false, alpha: 0.72 });
}

function diamondTile(x, y, z, colors, alpha = 1) {
  block(x, y, z - 0.15, 1, 1, 0.15, colors, {
    alpha,
    shadow: false,
    ao: false,
    topStroke: "rgba(72, 104, 73, 0.055)",
  });
}

function drawBoard(scene) {
  const { width, depth } = scene.board;
  for (let x = 0; x < width; x += 1) {
    for (let y = 0; y < depth; y += 1) {
      const top = (x + y) % 2 ? palette.grassTop : palette.grassTop2;
      diamondTile(x, y, 0, {
        top,
        left: palette.grassLeft,
        right: palette.grassRight,
      }, 0.96);
    }
  }

  block(-0.24, depth - 0.14, -0.34, width + 0.48, 0.34, 0.28, {
    top: "rgba(92, 160, 88, 0.26)",
    left: palette.grassEdge,
    right: palette.grassRight,
  }, { shadow: false, ao: false, alpha: 0.82 });
  block(width - 0.1, -0.24, -0.34, 0.34, depth + 0.48, 0.28, {
    top: "rgba(92, 160, 88, 0.26)",
    left: palette.grassLeft,
    right: palette.grassEdge,
  }, { shadow: false, ao: false, alpha: 0.82 });
}

function drawGroundObjects(scene) {
  [...(scene.ground ?? [])]
    .sort((a, b) => a.x + a.y - (b.x + b.y))
    .forEach((model) => {
      if (model.type === "authoredGroundModule") {
        if (!drawAuthoredSource(model)) authoredGroundFallback(model);
      } else if (model.type === "roadStraight") roadStraight(model);
      else if (model.type === "roadCorner") roadCorner(model);
      else if (model.type === "roadCross") roadCross(model);
      else if (model.type === "driveway") driveway(model);
      else if (model.type === "sidewalk") sidewalk(model);
      else if (model.type === "crosswalk") crosswalk(model);
      else if (model.type === "resLot") residentialLot(model);
      else if (model.type === "comLot") commercialLot(model);
    });
}

function drawObjects(scene) {
  [...scene.modules]
    .sort((a, b) => a.x + a.y - (b.x + b.y))
    .forEach((model) => {
      if (model.type === "authoredModule") {
        if (!drawAuthoredSource(model)) authoredBuildingFallback(model);
      } else if (model.type === "cornerStore") cornerStore(model);
      else if (model.type === "stripStore") stripStore(model);
      else if (model.type === "cafe") cafe(model);
      else if (model.type === "gym") gymService(model);
      else if (model.type === "ranch") ranch(model);
      else if (model.type === "rowhome") rowhomeStrip(model);
      else if (model.type === "apartment") smallApartment(model);
      else cottage(model);
    });
}

function drawAtmosphere() {
  const light = state.light / 100;
  const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, palette.sky);
  gradient.addColorStop(0.62, "#fbfcf0");
  gradient.addColorStop(1, "#d9efc9");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  const sunX = window.innerWidth * 0.78;
  const sunY = window.innerHeight * 0.15;
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, window.innerWidth * 0.32);
  glow.addColorStop(0, `rgba(255, 237, 161, ${0.22 * light})`);
  glow.addColorStop(1, "rgba(255, 237, 161, 0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
}

function draw() {
  const scene = scenes[state.scene];
  drawAtmosphere();
  ctx.save();
  ctx.translate(0, Math.sin(state.time * 0.001) * 0.55);
  drawBoard(scene);
  drawGroundObjects(scene);
  drawObjects(scene);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = palette.haze;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
  ctx.restore();
}

function tick(now) {
  state.time = now;
  draw();
  requestAnimationFrame(tick);
}

document.querySelectorAll("[data-scene]").forEach((button) => {
  button.addEventListener("click", () => {
    state.scene = button.dataset.scene;
    document.querySelectorAll("[data-scene]").forEach((item) => item.classList.toggle("is-active", item === button));
    draw();
  });
});

document.querySelector("#detail-slider").addEventListener("input", (event) => {
  state.detail = Number(event.currentTarget.value);
  draw();
});

document.querySelector("#light-slider").addEventListener("input", (event) => {
  state.light = Number(event.currentTarget.value);
  draw();
});

document.querySelector("#camera-slider").addEventListener("input", (event) => {
  state.camera = Number(event.currentTarget.value);
  draw();
});

window.addEventListener("resize", resize);
resize();
requestAnimationFrame(tick);
