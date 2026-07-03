# Second District Visual Acceptance Bar

Status: Lumen visual-engine gate for Anaheim and Ontario promotion.

Purpose:
Prevent hidden draft scenes, source files, labels, or verifier output from being
mistaken for public-quality voxel county art. A second district can move toward
public playability only when the map reads as a coherent world before labels.

## Promotion Standard

The first three seconds must answer these questions without explanation:

- What kind of district is this?
- Which two anchors are visually important?
- Do the buildings, roads, lots, and terrain feel like one physical tile system?
- Does the scene look authored rather than generated from same-size colored
  boxes?

Passing source/data gates is not enough. Screenshots must show the object
grammar holds on desktop, `390x844` mobile, and the detail camera.

## Required Anchor Pairs

Anaheim first pair:

- Anaheim Convention Center: long glass convention hall or campus, not a generic
  civic rectangle.
- ARTIC / Angel Stadium area: ARTIC should read as a parabolic or barrel-like
  transit hall with platform/track grounding, while Angel Stadium should read
  as a venue bowl/field system. The pair must not collapse into one generic
  blue-roof venue cluster.

Anaheim secondary anchors:

- Platinum Triangle should read as district fabric, not as label-dependent
  colored blocks.

Ontario first pair:

- Ontario airport or terminal/logistics edge: wide transport footprint, apron or
  terminal rhythm, and road/lot integration without cars or filler props.
- Ontario commerce/civic core: readable inland commerce/service block, not
  another generic strip of cubes.

Ontario secondary anchors:

- Residential variety, service blocks, fitness/civic edge, and transit/logistics
  lots should stress the object kit after the first pair passes.

## Screenshot Packet

Promotion review requires:

- Public Riverside baseline desktop and mobile, to prove no regression to the
  playable anchor.
- Candidate district desktop at `1280x720`.
- Candidate district mobile at `390x844`.
- Candidate residential/detail camera if available.
- A no-label review image or review mode for the two target anchors.
- Shell/unsupported screenshots proving non-ready counties still do not expose
  playable controls.

## No-Label Review

For each required anchor, Lumen must answer:

- Does the silhouette identify the object family before reading text?
- Does the footprint/parcel shape fit the district?
- Do roof, facade, side-face, and foundation details reinforce the identity?
- Are roads/lots integrated under the object rather than painted around it?
- Does mobile still show enough of the object to recognize it?

If either first-pair anchor depends on a label, the district stays hidden draft.

## Automatic Rejections

Reject promotion if any of these appear:

- same-size colored box clusters;
- broad blank roofs used as landmarks;
- pasted-on sprites or floating foundations;
- labels, glows, panels, or UI copy doing the visual work;
- cars, humans, decorative props, or clutter used to hide weak objects;
- public switcher exposure before visual, product, and data gates pass;
- provider lookup treated as public-quality scene evidence;
- mobile crop reads as a card over a background instead of a map.

## Outcomes

`PASS_FOR_PUBLIC_PROMOTION`:
Both first-pair anchors pass no-label recognition on desktop and mobile, the
map reads as a coherent voxel district, and Mira/Forge/Axiom gates are green.

`HIDDEN_DRAFT_ONLY`:
The draft compiles and is useful internally, but one or more anchors still need
labels or the scene lacks public-quality composition.

`BLOCK_VISUAL_TUNNEL`:
One bounded visual pass failed to move the district materially closer to public
quality. Stop the art tunnel and return to product loop or data readiness.

`HARD_FAIL`:
The slice introduces fake playability, props/cars/humans, dashboard panels,
provider claims, or product-state drift.
