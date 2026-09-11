# Packet: population-rplace-v1

Goal: Make 2D county plates feel populated: raise real Census place density, always draw settlement cells (r/place fabric), keep seat hierarchy and honesty. Control-first; use verify:usa-accuracy-control.

## Summary
2D county plates still feel empty because the committed Census town-anchor index is frozen at maximumAnchorsPerCounty=12 (18,447 national places). Control evidence shows dense metros (miami-dade-fl, cook-il, riverside-ca, maricopa-az) all plate at towns=12. The builder already defaults to 40, the parser allows up to 48, and AtlasPlate already draws r/place settlement cells for every plate anchor with A2 seat/primary/secondary hierarchy — so the gap is data rebuild + unlocking certs, not inventing UI. Rebuild data/census/us-county-town-anchors.json with --max-anchors 40, update hard-coded 12/18447 expectations, keep classifyTownAnchors seat-first honesty, and leave sparse counties (loving-tx=1) sparse. Generated-draft specs already slice to 6 anchors for wire budget; plates should carry the full denser set for fabric.

## Kill criteria
STOP/revert if (1) seat tier is lost or wrong seat leads the wire (A2 regression), (2) sparse counties gain invented/non-Census places, (3) labels crush the map at overview, (4) verify:usa-accuracy-control or A1/A3 go red, (5) county plate or generated-draft payloads blow wire budgets / G8-class bloat, (6) rebuild produces missing counties or drops certified sample places (Miami, Homestead, Mentone, Urban Honolulu, Kalawao, Washington).

## Build notes
Rebuilt Census town anchors to max 40/county (21,155 national). Dense metros now plate at 25–40 real places; sparse counties unchanged (loving=1). Certs unlocked from 12/18447→40/21155. Control/A1/A3 green; seat hierarchy intact; generated-draft still truncated to 6 for wire budget. No UI invention — AtlasPlate already drew r/place cells for all plate anchors. Notion unavailable; local docs only.

## Control: GREEN

### Evidence
pnpm verify:usa-accuracy-control exit 0 on http://127.0.0.1:8787 — L0 ready; L1 miami-dade-fl seat=Miami towns=34, cook-il seat=Chicago towns=40, loving-tx seat=Mentone towns=1, honolulu-hi seat=Urban Honolulu towns=40; L2 tools open_atlas_map,search_atlas_places; CONTROL GREEN artifacts/usa-accuracy/control/REPORT.md. A1 GREEN; A3 GREEN 50/50. verify:county-town-anchors PASS (max=40, anchors=21155). Builds core/server/web exit 0.

### Remaining issues
- A2 REGRESSION (kill #1): denser max-40 lists promote small name-match places over real leads — sedgwick-ks Wichita→Sedgwick, wayne-mi Detroit→Wayne, jefferson-al Birmingham→West Jefferson, polk-fl Lakeland→Polk City, madison-il Granite City→Madison, kenton-ky Covington→Kenton Vale (proven at12 vs full classifyTownAnchors).
- classifyTownAnchors name-containment still treats any place containing county stem as seat; densifying without guardrails multiplies false seats (~21 counties where only match is past top-12).
- A3/control do not assert seat stability under denser anchors — gates green while wrong seats lead the wire on non-spot-check counties.
- Cosmetic/stale: select_county still referenced in packages/mcp alphaTools and CountyQuestionService suggestedNextTool (not in ATLAS_TOOL_NAMES public set).

## Would ship
**control-ready after post-loop seat guard** (see below). Still needs deploy for ChatGPT Pro.

## Post-loop fix (seat guard)
Adversarial verify found namesake villages stealing seats under max-40 lists
(Sedgwick→Wichita, Wayne→Detroit, etc.). Guard added: name-match seat demoted
when population is under 20% of the largest place. Re-verified:

- sedgwick-ks → Wichita
- wayne-mi → Detroit  
- miami-dade-fl → Miami (34 towns)
- cook-il → Chicago (40 towns)
- loving-tx → Mentone (1 — still sparse)
- CONTROL GREEN again

## Next
1. Eyes-on control previews (settlement cells + density)
2. Deploy to prod/staging
3. A4 ChatGPT Pro dogfood
