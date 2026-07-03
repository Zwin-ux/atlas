# ChatGPT Entry Surface Proof

Generated: 2026-07-03T17:56:53.932Z

## Product Model Protected

- Play Riverside/Eastvale now.
- Browse California shell counties honestly.
- Lookup places without saving or proving county readiness.
- Anaheim and Ontario remain non-public until visual/product/release gates pass.
- Keep the seven-tool list stable.
- Do not expose compiler, GEOID, packet, verifier, persistence, XP, evidence, automation, or paid language in user-facing tool responses.

## Structured Summary

```json
{
  "districtSlug": "anaheim-candidate",
  "proofStatus": "passed",
  "promotionReady": false,
  "publicPlayable": false,
  "miraAcceptance": false,
  "productBoundary": {
    "riversidePlayableNow": true,
    "shellCountiesBrowseOnly": true,
    "lookupNotSaved": true,
    "lookupNotCoverageProof": true,
    "noInternalLanguage": true,
    "noPersistencePaidXpEvidenceAutomationClaims": true,
    "sevenToolListStable": true
  },
  "scenarios": [
    {
      "id": "direct-play-riverside",
      "status": "passed",
      "toolName": "select_county",
      "structuredSummary": {
        "type": "voxelSceneSummary",
        "selectedNodeId": "eastvale"
      }
    },
    {
      "id": "shell-browse-orange",
      "status": "passed",
      "toolName": "select_county",
      "structuredSummary": {
        "type": "countyCoverageSummary",
        "countySlug": "orange-ca",
        "coverageTier": "L1_COUNTY_SHELL",
        "playableDistrictCount": 0,
        "placeCount": 0,
        "supported": true
      }
    },
    {
      "id": "negative-anaheim-not-playable",
      "status": "passed",
      "toolName": "render_voxel_county",
      "structuredSummary": {
        "type": "countyCoverageSummary",
        "countySlug": "orange-ca",
        "coverageTier": "L1_COUNTY_SHELL",
        "playableDistrictCount": 0,
        "placeCount": 0,
        "supported": true
      }
    },
    {
      "id": "lookup-places-not-saved",
      "status": "passed",
      "toolName": "lookup_world_places",
      "structuredSummary": {
        "type": "worldPlaceLookup",
        "placeCount": 20,
        "categories": [
          "fitness",
          "food_drink",
          "landmark",
          "park",
          "school",
          "shop"
        ],
        "cacheHit": false
      }
    },
    {
      "id": "unsupported-unknown-county",
      "status": "passed",
      "toolName": "select_county",
      "structuredSummary": {
        "type": "countyCoverageSummary",
        "countySlug": "made-up-ca",
        "coverageTier": "L0_UNSUPPORTED",
        "playableDistrictCount": 0,
        "placeCount": 0,
        "supported": false
      }
    }
  ],
  "structuredSummary": {
    "selectCountyPlayable": {
      "type": "voxelSceneSummary",
      "selectedNodeId": "eastvale"
    },
    "selectCountyShell": {
      "type": "countyCoverageSummary",
      "coverageTier": "L1_COUNTY_SHELL",
      "playableDistrictCount": 0,
      "placeCount": 0
    },
    "renderVoxelCountyPlayable": {
      "type": "voxelSceneSummary",
      "selectedNodeId": "eastvale"
    },
    "renderVoxelCountyShell": {
      "type": "countyCoverageSummary",
      "coverageTier": "L1_COUNTY_SHELL",
      "playableDistrictCount": 0,
      "placeCount": 0
    },
    "askCountyQuestion": {
      "type": "countyQuestionAnswer",
      "supported": true,
      "topic": "business_signals"
    },
    "lookupWorldPlaces": {
      "type": "worldPlaceLookup",
      "placeCount": 20,
      "categories": [
        "fitness",
        "food_drink",
        "landmark",
        "park",
        "school",
        "shop"
      ],
      "cacheHit": false
    },
    "selectCountyUnsupported": {
      "type": "countyCoverageSummary",
      "countySlug": "made-up-ca",
      "coverageTier": "L0_UNSUPPORTED",
      "playableDistrictCount": 0,
      "placeCount": 0,
      "supported": false
    }
  }
}
```

## Exact Tool Response Text

### select_county: Riverside playable

```text
Selected Riverside County. Eastvale is the playable district in this county. Use the map for places, pins, and session-only notes.
```

### select_county: Orange shell

```text
Orange County is indexed from Census county identity data, but Atlas has not built a playable local scene for it yet. Orange County is browse-only in Atlas right now. Riverside/Eastvale is playable now. Atlas does not invent local places, saves, XP, evidence, or automation for shell counties.
```

### render_voxel_county: Riverside playable

```text
Showing the Riverside/Eastvale playable map. Pins and notes stay in this chat.
```

### render_voxel_county: Orange shell

```text
Orange County is indexed from Census county identity data, but Atlas has not built a playable local scene for it yet. Orange County is browse-only in Atlas right now. Atlas only draws a local world after a curated playable district exists. Open Riverside/Eastvale for the playable map.
```

### ask_county_question

```text
Curated Riverside/Eastvale answer. For mobile detailing, the curated Riverside pack supports Eastvale because the strongest nodes cluster around homes, errands, and short routes. Top signals are Residential Demand, High Willingness to Pay, Partnership Target, QR Flyer Opportunity, Fast Route Access. Treat these as Alpha planning signals, not live demand or ROI proof.

Limits: Prototype data only. Replace/augment with sourced data before public claims. Closed-world answer from curated Atlas Alpha data only. No saved state, XP, evidence, outreach, or live market guarantee. No saves, XP, evidence, or automation are created by this answer.
```

### lookup_world_places

```text
Found 20 lookup-only places around Eastvale, CA, USA. Categories: fitness, food_drink, landmark, park, school, shop. Results are normalized into Atlas categories, not saved, and not coverage proof. This does not unlock a playable county map.
```

### select_county: unsupported county

```text
Atlas does not have an indexed or curated county contract for this slug yet. Use Riverside County for the playable Engine Beta slice. This county is browse-only in Atlas right now. Riverside/Eastvale is playable now. Atlas does not invent local places, saves, XP, evidence, or automation for shell counties.
```

