# Anaheim Venue Object Grammar Research

Status: E12.15 visual/product research brief.

Owner:
Lumen owns art judgment. Mira owns product comprehension and promotion cutline.
Axiom owns implementation/release order.

Purpose:
Stop guessing at Anaheim venue identity. E12.15 should use real architectural
signals from Anaheim anchors and convert them into native voxel object grammar.
The goal is recognizability before labels, not prettier labels.

## Product Cutline

Anaheim remains hidden and non-playable.

Do not add:

- county switcher expansion;
- public Anaheim route;
- selected-place tray;
- sticker tools;
- note input;
- fake places;
- provider-normalized claims;
- cars, humans, decorative props, glows, or UI panels as compensation.

Promotion remains blocked until at least two Anaheim anchors are recognizable
before labels in desktop, mobile, and residential-detail screenshots.

## Recommended Target Pair

### 1. Anaheim Convention Center

Why this should be first:
It has a strong architectural identity that can translate into voxel grammar:
long serpentine glass frontage, broad convention hall massing, curtain wall,
and coastal-wave/cliff geometry. It is also a major public anchor and gives the
draft scene a civic/commercial center.

Real-world signals:

- The Anaheim Convention Center is described by the city as the largest
  convention center on the West Coast.
- Guardian Glass describes the building as roughly a quarter mile long, with a
  serpentine form, large glass panel area, and curtain wall.
- Visit Anaheim says the front is all glass and design lines mimic the
  California coastline.

Voxel grammar:

- One long, low hall mass, not stacked generic boxes.
- Serpentine or stepped-wave roof edge.
- Continuous glass/arcade face along the primary frontage.
- Large forecourt/plaza plane attached to the hall.
- Secondary lower service blocks behind the main hall, not random towers.
- Roof fields should be broad, shallow, and layered, with a clear main span.

Reject if:

- It reads as a mall strip, office block, or beige warehouse.
- The identity depends on a label card.
- The hall is broken into too many small cuboids.

### 2. ARTIC

Why this should be second:
ARTIC has the clearest silhouette of the Anaheim anchors: a parabolic transit
hall with a diagrid shell and translucent ETFE skin. If this does not read, the
object grammar is not strong enough.

Real-world signals:

- HOK describes ARTIC as a flexible terminal for rail, bus, auto, cyclists, and
  pedestrians.
- The architecture uses a parabolic form, diamond-shaped steel arches, and
  translucent ETFE panels.
- HOK also notes two parabolic glass walls and a light-filled, column-free hall.
- Thornton Tomasetti describes a grand hall, ticketing/retail below a soaring
  exposed steel structure, and ETFE cushions.

Voxel grammar:

- Tall barrel/parabolic shell, not a flat civic roof.
- Diamond/diagrid rib rhythm on the shell.
- Translucent pale blue/white skin, with darker steel rib marks.
- Two end glass walls or entry portals.
- Thin platform/track edge beside or under the shell.
- Object should be taller and lighter than surrounding retail blocks.

Reject if:

- It reads as a greenhouse, airplane hangar without transit cues, or generic
  civic block.
- The shell is hidden by label/card overlap.
- The diagrid is absent at mobile scale.

## Secondary Target: Angel Stadium

Angel Stadium is important, but it is a harder third target because sports
venues collapse into generic circles in isometric voxel art.

Real-world signals:

- Ballparks of Baseball describes the original stadium as a three-tier
  structure, with seats stretching from foul pole to home plate and around to
  the other foul pole.
- Its iconic external marker is the tall A-frame scoreboard with halo, known as
  the Big A.
- MLB's official page emphasizes Angel Stadium as a ballpark with guest areas,
  tours, concessions, and addressable public venue identity.

Voxel grammar:

- Asymmetric baseball bowl, not perfect oval.
- Open field wedge / infield diamond shape visible inside.
- Tiered seating bands around the bowl.
- Small but unmistakable A-frame marker may be allowed only if it is treated as
  architectural landmark grammar, not a decorative sign spam pattern.
- Large parking/approach apron may exist as ground plane, not car props.

Reject if:

- It reads as a fountain, round mall, or generic arena.
- The Big A becomes a text/sign crutch.
- The field is not visible enough to explain baseball.

## Secondary Target: Platinum Triangle

Platinum Triangle is an area, not one object. It should read as district
texture rather than a single landmark.

Real-world signals:

- Anaheim describes it as the area around Angel Stadium, Honda Center, and The
  Grove.
- The city describes high-density mixed-use, office, restaurant, residential,
  retail, and entertainment development replacing older industrial uses.
- The zoning overlay permits residential, retail, restaurant, office, and
  continuing industrial uses.

Voxel grammar:

- Podium + tower rhythm.
- Retail/restaurant base at street edge.
- Mixed roof heights and terraces.
- Older low industrial block or service mass may remain as contrast.
- Walkable local street grain, not isolated towers on a lawn.

Reject if:

- It reads as generic apartments.
- It becomes label-only identity.
- It overwhelms Convention Center / ARTIC hierarchy.

## E12.15 Build Brief

Preferred implementation order:

1. Anaheim Convention Center native grammar.
2. ARTIC native grammar.
3. Only then decide whether Angel Stadium or Platinum Triangle gets the next
   pass.

Screenshot review method:

1. View desktop, mobile, and residential-detail.
2. Mentally hide labels and shell card.
3. Ask whether Convention Center and ARTIC are recognizable from massing alone.
4. If no, block promotion and continue object grammar or stop the Anaheim lane.

Acceptance:

- Convention Center reads as long glass convention hall/campus before labels.
- ARTIC reads as parabolic transit hall before labels.
- Mobile still shows the Anaheim boundary card and recovery CTA.
- No product UI compensates for weak object art.
- Anaheim remains hidden/non-playable and `promotionReady: false`.

## References

- Anaheim Convention Center official page:
  https://www.anaheim.net/1117/Anaheim-Convention-Center
- Guardian Glass Anaheim Convention Center project:
  https://www.guardianglass.com/us/en/projects/project-details/anaheim-convention-center
- Visit Anaheim Convention Center design/history:
  https://www.visitanaheim.org/blog/stories/post/facts-you-may-not-know-about-the-anaheim-convention-center/
- HOK ARTIC project:
  https://www.hok.com/projects/view/anaheim-regional-transportation-intermodal-center/
- Thornton Tomasetti ARTIC project:
  https://www.thorntontomasetti.com/project/anaheim-regional-transportation-intermodal-center-artic-phase-one
- Anaheim Platinum Triangle official page:
  https://www.anaheim.net/1072/Platinum-Triangle
- Anaheim PTMU overlay code:
  https://codelibrary.amlegal.com/codes/anaheim/latest/anaheim_ca/0-0-0-81543
- Ballparks of Baseball Angel Stadium:
  https://www.ballparksofbaseball.com/ballparks/angel-stadium/
- MLB Angel Stadium official page:
  https://www.mlb.com/angels/ballpark
